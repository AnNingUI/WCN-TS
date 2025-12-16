/**
 * 字体渲染 JS 函数
 */

import { HEAPU8 } from "./memory";
import { setValue } from "./memory";
import { UTF8ToString } from "./utf8";
import type { _malloc as MallocType } from "./exports";

// 内部上下文
const WCNJS = {
	canvas: null as HTMLCanvasElement | null,
	ctx: null as CanvasRenderingContext2D | null,
	fonts: {} as Record<number, { name: string; size: number }>,
	nextFontId: 1,
};

// malloc 引用，由 create-wcn 设置
let _mallocRef: typeof MallocType;

export function setMallocRef(malloc: typeof MallocType): void {
	_mallocRef = malloc;
}

function js_ensure_context(): void {
	if (!WCNJS.ctx) {
		const canvas = document.createElement("canvas");
		canvas.width = 128;
		canvas.height = 128;
		WCNJS.canvas = canvas;
		WCNJS.ctx = canvas.getContext("2d", { willReadFrequently: true })!;
	}
}

export function js_load_font(font_name: number, font_size: number, out_id: number): boolean {
	try {
		js_ensure_context();
		const nameStr = UTF8ToString(font_name);
		const id = WCNJS.nextFontId++;
		WCNJS.fonts[id] = { name: nameStr, size: font_size };
		setValue(out_id, id, "i32");
		return true;
	} catch { return false; }
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
		const metrics = ctx.measureText(charStr);
		setValue(out_advance, metrics.width, "float");
		const lsb = metrics.actualBoundingBoxLeft ? -metrics.actualBoundingBoxLeft : 0;
		setValue(out_lsb, lsb, "float");
		const x0 = lsb;
		const x1 = metrics.actualBoundingBoxRight ?? metrics.width;
		const y0 = metrics.actualBoundingBoxAscent ? -metrics.actualBoundingBoxAscent : -font.size;
		const y1 = metrics.actualBoundingBoxDescent ?? 0;
		setValue(out_box, x0, "float");
		setValue(out_box + 4, y0, "float");
		setValue(out_box + 8, x1, "float");
		setValue(out_box + 12, y1, "float");
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

		const canvas = WCNJS.canvas!;
		const charStr = String.fromCodePoint(codepoint);
		const padding = 4;
		const neededSize = Math.ceil(size + padding * 2);

		if (canvas.width < neededSize || canvas.height < neededSize) {
			canvas.width = neededSize;
			canvas.height = neededSize;
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
		let hasPixels = false;
		let isColor = false;

		for (let y = 0; y < scanH; y++) {
			for (let x = 0; x < scanW; x++) {
				const idx = (y * scanW + x) * 4;
				const alpha = data[idx + 3];
				if (alpha > 0) {
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
			minX = drawX; maxX = drawX; minY = drawY; maxY = drawY;
		} else {
			minX = Math.max(0, minX - 1);
			maxX = Math.min(scanW - 1, maxX + 1);
			minY = Math.max(0, minY - 1);
			maxY = Math.min(scanH - 1, maxY + 1);
		}

		const w = maxX - minX + 1;
		const h = maxY - minY + 1;
		const bufSize = w * h * 4;
		const ptr = _mallocRef(bufSize);
		if (!ptr) return false;

		if (isColor) {
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const srcIdx = ((minY + y) * scanW + (minX + x)) * 4;
					const dstIdx = ptr + (y * w + x) * 4;
					HEAPU8[dstIdx] = data[srcIdx];
					HEAPU8[dstIdx + 1] = data[srcIdx + 1];
					HEAPU8[dstIdx + 2] = data[srcIdx + 2];
					HEAPU8[dstIdx + 3] = data[srcIdx + 3];
				}
			}
		} else {
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const srcIdx = ((minY + y) * scanW + (minX + x)) * 4;
					const dstIdx = ptr + (y * w + x) * 4;
					const alpha = hasPixels ? data[srcIdx + 3] : 0;
					HEAPU8[dstIdx] = alpha;
					HEAPU8[dstIdx + 1] = alpha;
					HEAPU8[dstIdx + 2] = alpha;
					HEAPU8[dstIdx + 3] = 255;
				}
			}
		}

		setValue(out_ptr, ptr, "i32");
		setValue(out_w, w, "i32");
		setValue(out_h, h, "i32");
		setValue(out_off_x, minX - drawX, "float");
		setValue(out_off_y, minY - drawY, "float");
		setValue(out_adv, metrics.width, "float");
		if (out_is_color_ptr) setValue(out_is_color_ptr, isColor ? 1 : 0, "i8");

		return true;
	} catch { return false; }
}

// WASM 调用的初始化函数（保持兼容）
export function Init_WCNJS(): void {
	// 已经是模块级变量，无需操作
}

export function Init_WGPUTextureView_Map(): void {
	// 已经是模块级变量，无需操作
}
