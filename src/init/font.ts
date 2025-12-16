/**
 * 字体渲染 JS 函数
 * Worker + OffscreenCanvas 优化版本
 */

import { HEAPU8 } from "./memory";
import { setValue } from "./memory";
import { UTF8ToString } from "./utf8";
import type { _malloc as MallocType, _free as FreeType } from "./exports";

// 缓存条目
interface CacheEntry {
	ptr: number;
	w: number;
	h: number;
	offX: number;
	offY: number;
	adv: number;
	isColor: number;
}

// 内部上下文
const WCNJS = {
	canvas: null as HTMLCanvasElement | null,
	ctx: null as CanvasRenderingContext2D | null,
	fonts: {} as Record<number, { name: string; size: number }>,
	nextFontId: 1,
	cache: new Map<string, CacheEntry>(),
	CACHE_MAX: 1024,
	worker: null as Worker | null,
	initialized: false,
};

// malloc/free 引用，由 create-wcn 设置
let _mallocRef: typeof MallocType;
let _freeRef: typeof FreeType;

export function setMallocRef(malloc: typeof MallocType): void {
	_mallocRef = malloc;
}

export function setFreeRef(free: typeof FreeType): void {
	_freeRef = free;
}

function js_ensure_context(): void {
	if (WCNJS.initialized) return;

	// 主线程 Canvas (同步渲染回退)
	const canvas = document.createElement("canvas");
	canvas.width = 512;
	canvas.height = 512;
	WCNJS.canvas = canvas;
	WCNJS.ctx = canvas.getContext("2d", { willReadFrequently: true })!;

	// Worker 用于后台预渲染
	const workerCode = `
		let canvas = null;
		let ctx = null;
		let fonts = {};
		let nextFontId = 1;
		
		function initCanvas(sz) {
			if (!canvas) {
				canvas = new OffscreenCanvas(sz || 512, sz || 512);
				ctx = canvas.getContext('2d', { willReadFrequently: true });
			} else if (canvas.width < sz) {
				canvas.width = canvas.height = sz;
				ctx = canvas.getContext('2d', { willReadFrequently: true });
			}
		}
		
		function genBitmap(fontId, cp, size) {
			const f = fonts[fontId];
			if (!f) return null;
			
			const ch = String.fromCodePoint(cp);
			const pad = 4, need = Math.ceil(size + pad * 2);
			initCanvas(need);
			
			ctx.font = size + 'px ' + f.name;
			ctx.textBaseline = 'alphabetic';
			ctx.textAlign = 'left';
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#FFF';
			
			const dx = pad, dy = Math.round(size);
			ctx.fillText(ch, dx, dy);
			
			const m = ctx.measureText(ch);
			const scanW = Math.min(canvas.width, Math.ceil(dx + m.width + pad));
			const scanH = Math.min(canvas.height, Math.ceil(dy + (m.actualBoundingBoxDescent || size * 0.3) + pad));
			
			const img = ctx.getImageData(0, 0, scanW, scanH);
			const d = img.data;
			
			let minX = scanW, maxX = 0, minY = scanH, maxY = 0;
			let hasPixels = false, isColor = false;
			
			for (let y = 0; y < scanH; y++) {
				for (let x = 0; x < scanW; x++) {
					const i = (y * scanW + x) * 4;
					if (d[i + 3] > 0) {
						minX = Math.min(minX, x); maxX = Math.max(maxX, x);
						minY = Math.min(minY, y); maxY = Math.max(maxY, y);
						hasPixels = true;
						if (!isColor && (Math.abs(d[i]-d[i+1]) > 2 || Math.abs(d[i+1]-d[i+2]) > 2)) isColor = true;
					}
				}
			}
			
			if (!hasPixels) return { w: 1, h: 1, offX: 0, offY: 0, adv: m.width, isColor: 0, buf: new Uint8Array(4) };
			
			minX = Math.max(0, minX - 1); maxX = Math.min(scanW - 1, maxX + 1);
			minY = Math.max(0, minY - 1); maxY = Math.min(scanH - 1, maxY + 1);
			
			const w = maxX - minX + 1, h = maxY - minY + 1;
			const buf = new Uint8Array(w * h * 4);
			
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const si = ((minY + y) * scanW + (minX + x)) * 4, di = (y * w + x) * 4;
					if (isColor) {
						buf[di] = d[si]; buf[di+1] = d[si+1]; buf[di+2] = d[si+2]; buf[di+3] = d[si+3];
					} else {
						const a = d[si + 3];
						buf[di] = buf[di+1] = buf[di+2] = a; buf[di+3] = 255;
					}
				}
			}
			return { w, h, offX: minX - dx, offY: minY - dy, adv: m.width, isColor: isColor ? 1 : 0, buf };
		}
		
		self.onmessage = function(e) {
			const data = e.data;
			if (!(data instanceof ArrayBuffer)) return;
			
			const dv = new DataView(data);
			const cmd = dv.getUint8(0);
			
			if (cmd === 1) { // loadFont
				const nameLen = dv.getUint16(1, true);
				const name = new TextDecoder().decode(new Uint8Array(data, 3, nameLen));
				const size = dv.getFloat32(3 + nameLen, true);
				initCanvas(512);
				const id = nextFontId++;
				fonts[id] = { name, size };
				const resp = new ArrayBuffer(5);
				new DataView(resp).setUint8(0, 1);
				new DataView(resp).setUint32(1, id, true);
				self.postMessage(resp, [resp]);
			}
			else if (cmd === 2) { // prerender
				const fontId = dv.getUint32(1, true);
				const size = dv.getFloat32(5, true);
				const count = dv.getUint16(9, true);
				
				const items = [];
				let totalPixels = 0;
				for (let i = 0; i < count; i++) {
					const cp = dv.getUint32(11 + i * 4, true);
					const r = genBitmap(fontId, cp, size);
					if (r) {
						items.push({ cp, ...r });
						totalPixels += r.buf.length;
					}
				}
				
				const headerSize = 12;
				const itemHeaderSize = 21;
				let respSize = headerSize;
				for (const it of items) respSize += itemHeaderSize + it.buf.length;
				
				const resp = new ArrayBuffer(respSize);
				const rdv = new DataView(resp);
				const ru8 = new Uint8Array(resp);
				
				rdv.setUint8(0, 2);
				rdv.setUint32(1, fontId, true);
				rdv.setUint32(5, size, true);
				rdv.setUint16(9, items.length, true);
				
				let offset = headerSize;
				for (const it of items) {
					rdv.setUint32(offset, it.cp, true);
					rdv.setUint16(offset + 4, it.w, true);
					rdv.setUint16(offset + 6, it.h, true);
					rdv.setFloat32(offset + 8, it.offX, true);
					rdv.setFloat32(offset + 12, it.offY, true);
					rdv.setFloat32(offset + 16, it.adv, true);
					rdv.setUint8(offset + 20, it.isColor);
					ru8.set(it.buf, offset + 21);
					offset += itemHeaderSize + it.buf.length;
				}
				
				self.postMessage(resp, [resp]);
			}
		};
	`;

	try {
		const blob = new Blob([workerCode], { type: "application/javascript" });
		const worker = new Worker(URL.createObjectURL(blob));
		WCNJS.worker = worker;

		worker.onmessage = function (e: MessageEvent) {
			const data = e.data;
			if (!(data instanceof ArrayBuffer)) return;

			const dv = new DataView(data);
			const cmd = dv.getUint8(0);

			if (cmd === 2) { // prerendered 响应
				const fontId = dv.getUint32(1, true);
				const size = dv.getUint32(5, true);
				const count = dv.getUint16(9, true);

				let offset = 12;
				for (let i = 0; i < count; i++) {
					const cp = dv.getUint32(offset, true);
					const w = dv.getUint16(offset + 4, true);
					const h = dv.getUint16(offset + 6, true);
					const offX = dv.getFloat32(offset + 8, true);
					const offY = dv.getFloat32(offset + 12, true);
					const adv = dv.getFloat32(offset + 16, true);
					const isColor = dv.getUint8(offset + 20);
					const pixelLen = w * h * 4;

					const key = `${fontId}_${cp}_${size}`;

					// LRU 缓存
					if (WCNJS.cache.size >= WCNJS.CACHE_MAX) {
						const oldest = WCNJS.cache.keys().next().value;
						if (oldest) {
							const old = WCNJS.cache.get(oldest);
							if (old?.ptr) _freeRef(old.ptr);
							WCNJS.cache.delete(oldest);
						}
					}

					const ptr = _mallocRef(pixelLen);
					if (ptr) {
						HEAPU8.set(new Uint8Array(data, offset + 21, pixelLen), ptr);
						WCNJS.cache.set(key, { ptr, w, h, offX, offY, adv, isColor });
					}

					offset += 21 + pixelLen;
				}
			}
		};
	} catch {
		console.warn("[WCN] Worker creation failed, using main thread only");
	}

	WCNJS.initialized = true;
}

export function js_load_font(font_name: number, font_size: number, out_id: number): boolean {
	try {
		js_ensure_context();
		const nameStr = UTF8ToString(font_name);
		const id = WCNJS.nextFontId++;
		WCNJS.fonts[id] = { name: nameStr, size: font_size };
		setValue(out_id, id, "i32");

		// 通知 Worker 加载字体
		if (WCNJS.worker) {
			const nameBytes = new TextEncoder().encode(nameStr);
			const buf = new ArrayBuffer(3 + nameBytes.length + 4);
			const dv = new DataView(buf);
			dv.setUint8(0, 1); // cmd=loadFont
			dv.setUint16(1, nameBytes.length, true);
			new Uint8Array(buf, 3, nameBytes.length).set(nameBytes);
			dv.setFloat32(3 + nameBytes.length, font_size, true);
			WCNJS.worker.postMessage(buf, [buf]);
		}

		return true;
	} catch { return false; }
}


// 预渲染字符串中的所有字形 (后台Worker执行)
export function js_prerender_text(font_id: number, text: number, size: number): void {
	if (!WCNJS.worker) return;

	const str = UTF8ToString(text);
	const codepoints: number[] = [];
	for (const ch of str) {
		const cp = ch.codePointAt(0)!;
		const key = `${font_id}_${cp}_${size | 0}`;
		if (!WCNJS.cache.has(key)) {
			codepoints.push(cp);
		}
	}

	if (codepoints.length > 0) {
		const buf = new ArrayBuffer(11 + codepoints.length * 4);
		const dv = new DataView(buf);
		dv.setUint8(0, 2);
		dv.setUint32(1, font_id, true);
		dv.setFloat32(5, size, true);
		dv.setUint16(9, codepoints.length, true);
		for (let i = 0; i < codepoints.length; i++) {
			dv.setUint32(11 + i * 4, codepoints[i], true);
		}
		WCNJS.worker.postMessage(buf, [buf]);
	}
}

// 预渲染常用字符 (ASCII + 中文标点)
export function js_prerender_common(font_id: number, size: number): void {
	if (!WCNJS.worker) return;

	const codepoints: number[] = [];
	// ASCII 可打印字符
	for (let cp = 32; cp < 127; cp++) {
		const key = `${font_id}_${cp}_${size | 0}`;
		if (!WCNJS.cache.has(key)) codepoints.push(cp);
	}
	// 常用中文标点
	const commonCps = [0xFF0C, 0x3002, 0xFF01, 0xFF1F, 0x3001, 0xFF1B, 0xFF1A,
		0x201C, 0x201D, 0x2018, 0x2019, 0xFF08, 0xFF09,
		0x3010, 0x3011, 0x300A, 0x300B, 0x2014, 0x2026];
	for (const cp of commonCps) {
		const key = `${font_id}_${cp}_${size | 0}`;
		if (!WCNJS.cache.has(key)) codepoints.push(cp);
	}

	if (codepoints.length > 0) {
		const buf = new ArrayBuffer(11 + codepoints.length * 4);
		const dv = new DataView(buf);
		dv.setUint8(0, 2);
		dv.setUint32(1, font_id, true);
		dv.setFloat32(5, size, true);
		dv.setUint16(9, codepoints.length, true);
		for (let i = 0; i < codepoints.length; i++) {
			dv.setUint32(11 + i * 4, codepoints[i], true);
		}
		WCNJS.worker.postMessage(buf, [buf]);
	}
}

export function js_get_glyph_metrics(
	font_id: number, codepoint: number, out_advance: number, out_lsb: number, out_box: number,
): boolean {
	try {
		const font = WCNJS.fonts[font_id];
		if (!font) return false;
		const ctx = WCNJS.ctx!;
		ctx.font = `${font.size}px ${font.name}`;
		ctx.textBaseline = "alphabetic";
		const charStr = String.fromCodePoint(codepoint);
		const m = ctx.measureText(charStr);
		setValue(out_advance, m.width, "float");
		const lsb = m.actualBoundingBoxLeft ? -m.actualBoundingBoxLeft : 0;
		setValue(out_lsb, lsb, "float");
		setValue(out_box, lsb, "float");
		setValue(out_box + 4, m.actualBoundingBoxAscent ? -m.actualBoundingBoxAscent : -font.size, "float");
		setValue(out_box + 8, m.actualBoundingBoxRight || m.width, "float");
		setValue(out_box + 12, m.actualBoundingBoxDescent || 0, "float");
		return true;
	} catch { return false; }
}

export function js_generate_bitmap(
	font_id: number, codepoint: number, size: number, out_ptr: number, out_w: number,
	out_h: number, out_off_x: number, out_off_y: number, out_adv: number, out_is_color_ptr: number,
): boolean {
	try {
		const font = WCNJS.fonts[font_id];
		if (!font) return false;

		// LRU 缓存检查
		const cacheKey = `${font_id}_${codepoint}_${size | 0}`;
		const cached = WCNJS.cache.get(cacheKey);
		if (cached) {
			// 更新 LRU 顺序
			WCNJS.cache.delete(cacheKey);
			WCNJS.cache.set(cacheKey, cached);

			const bufSize = cached.w * cached.h * 4;
			const ptr = _mallocRef(bufSize);
			if (!ptr) return false;
			HEAPU8.copyWithin(ptr, cached.ptr, cached.ptr + bufSize);

			setValue(out_ptr, ptr, "i32");
			setValue(out_w, cached.w, "i32");
			setValue(out_h, cached.h, "i32");
			setValue(out_off_x, cached.offX, "float");
			setValue(out_off_y, cached.offY, "float");
			setValue(out_adv, cached.adv, "float");
			if (out_is_color_ptr) setValue(out_is_color_ptr, cached.isColor, "i8");
			return true;
		}

		const canvas = WCNJS.canvas!;
		const charStr = String.fromCodePoint(codepoint);
		const padding = 4;
		const neededSize = Math.ceil(size + padding * 2);

		if (canvas.width < neededSize || canvas.height < neededSize) {
			canvas.width = Math.max(canvas.width, neededSize);
			canvas.height = Math.max(canvas.height, neededSize);
			WCNJS.ctx = canvas.getContext("2d", { willReadFrequently: true })!;
		}

		const ctx = WCNJS.ctx!;
		ctx.font = `${size}px ${font.name}`;
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "left";
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#FFFFFF";

		const drawX = padding;
		const drawY = Math.round(size);
		ctx.fillText(charStr, drawX, drawY);

		const metrics = ctx.measureText(charStr);
		const scanW = Math.min(canvas.width, Math.ceil(drawX + metrics.width + padding));
		const scanH = Math.min(canvas.height, Math.ceil(drawY + (metrics.actualBoundingBoxDescent || size * 0.3) + padding));

		const imgData = ctx.getImageData(0, 0, scanW, scanH);
		const data = imgData.data;

		let minX = scanW, maxX = 0, minY = scanH, maxY = 0;
		let hasPixels = false, isColor = false;

		for (let y = 0; y < scanH; y++) {
			for (let x = 0; x < scanW; x++) {
				const idx = (y * scanW + x) * 4;
				if (data[idx + 3] > 0) {
					if (x < minX) minX = x;
					if (x > maxX) maxX = x;
					if (y < minY) minY = y;
					if (y > maxY) maxY = y;
					hasPixels = true;
					if (!isColor) {
						const r = data[idx], g = data[idx + 1], b = data[idx + 2];
						if (Math.abs(r - g) > 2 || Math.abs(g - b) > 2) isColor = true;
					}
				}
			}
		}

		if (!hasPixels) {
			// 空字符
			const ptr = _mallocRef(4);
			if (!ptr) return false;
			HEAPU8.fill(0, ptr, ptr + 4);
			setValue(out_ptr, ptr, "i32");
			setValue(out_w, 1, "i32");
			setValue(out_h, 1, "i32");
			setValue(out_off_x, 0, "float");
			setValue(out_off_y, 0, "float");
			setValue(out_adv, metrics.width, "float");
			if (out_is_color_ptr) setValue(out_is_color_ptr, 0, "i8");
			return true;
		}

		minX = Math.max(0, minX - 1);
		maxX = Math.min(scanW - 1, maxX + 1);
		minY = Math.max(0, minY - 1);
		maxY = Math.min(scanH - 1, maxY + 1);

		const w = maxX - minX + 1;
		const h = maxY - minY + 1;
		const bufSize = w * h * 4;
		const ptr = _mallocRef(bufSize);
		if (!ptr) return false;

		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const srcIdx = ((minY + y) * scanW + (minX + x)) * 4;
				const dstIdx = ptr + (y * w + x) * 4;
				if (isColor) {
					HEAPU8[dstIdx] = data[srcIdx];
					HEAPU8[dstIdx + 1] = data[srcIdx + 1];
					HEAPU8[dstIdx + 2] = data[srcIdx + 2];
					HEAPU8[dstIdx + 3] = data[srcIdx + 3];
				} else {
					const alpha = data[srcIdx + 3];
					HEAPU8[dstIdx] = alpha;
					HEAPU8[dstIdx + 1] = alpha;
					HEAPU8[dstIdx + 2] = alpha;
					HEAPU8[dstIdx + 3] = 255;
				}
			}
		}

		const offX = minX - drawX;
		const offY = minY - drawY;

		// LRU 缓存存入
		if (WCNJS.cache.size >= WCNJS.CACHE_MAX) {
			const oldest = WCNJS.cache.keys().next().value;
			if (oldest) {
				const oldEntry = WCNJS.cache.get(oldest);
				if (oldEntry?.ptr) _freeRef(oldEntry.ptr);
				WCNJS.cache.delete(oldest);
			}
		}
		const cachePtr = _mallocRef(bufSize);
		if (cachePtr) {
			HEAPU8.copyWithin(cachePtr, ptr, ptr + bufSize);
			WCNJS.cache.set(cacheKey, { ptr: cachePtr, w, h, offX, offY, adv: metrics.width, isColor: isColor ? 1 : 0 });
		}

		setValue(out_ptr, ptr, "i32");
		setValue(out_w, w, "i32");
		setValue(out_h, h, "i32");
		setValue(out_off_x, offX, "float");
		setValue(out_off_y, offY, "float");
		setValue(out_adv, metrics.width, "float");
		if (out_is_color_ptr) setValue(out_is_color_ptr, isColor ? 1 : 0, "i8");

		return true;
	} catch { return false; }
}

// WASM 调用的初始化函数（保持兼容）
export function Init_WCNJS(): void {
	js_ensure_context();
}

export function Init_WGPUTextureView_Map(): void {
	// 已经是模块级变量，无需操作
}
