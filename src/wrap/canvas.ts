/**
 * WCNCanvas 和 WCNImage 类
 */

import {
	_malloc, _free, _wcn_init_js, _wcn_wasm_create_gpu_resources_auto, _wcn_create_context,
	_wcn_set_surface_format, _wcn_wasm_get_font_decoder, _wcn_register_font_decoder,
	_wcn_wasm_create_default_font_face, _wcn_set_font_face, _wcn_wasm_get_image_decoder,
	_wcn_register_image_decoder, _wcn_begin_frame, _wcn_end_frame, _wcn_begin_render_pass,
	_wcn_end_render_pass, _wcn_submit_commands, _wcn_save, _wcn_restore, _wcn_clear_rect,
	_wcn_fill_rect, _wcn_stroke_rect, _wcn_begin_path, _wcn_move_to, _wcn_line_to, _wcn_arc,
	_wcn_rect, _wcn_close_path, _wcn_fill, _wcn_stroke, _wcn_set_fill_style, _wcn_set_stroke_style,
	_wcn_set_line_width, _wcn_set_line_cap, _wcn_set_line_join, _wcn_set_miter_limit,
	_wcn_set_global_alpha, _wcn_translate, _wcn_rotate, _wcn_scale, _wcn_transform,
	_wcn_set_transform, _wcn_reset_transform, _wcn_set_font, _wcn_fill_text, _wcn_stroke_text,
	_wcn_measure_text, _wcn_decode_image, _wcn_destroy_image_data, _wcn_draw_image,
	_wcn_draw_image_scaled, _wcn_draw_image_source, _wcn_add_font_fallback, _wcn_wasm_load_font,
	storeWGPUTextureView, getValue, stringToUTF8, lengthBytesUTF8, getHEAPU8,
} from "../init";
import type { WCNContextPtr } from "../init";
import type { ImageDataPtr } from "../type";

const LINE_CAP_BUTT = 0, LINE_CAP_ROUND = 1, LINE_CAP_SQUARE = 2;
const LINE_JOIN_MITER = 0, LINE_JOIN_ROUND = 1, LINE_JOIN_BEVEL = 2;

export class WCNImage {
	ptr: ImageDataPtr;
	readonly width: number;
	readonly height: number;

	constructor(imagePtr: ImageDataPtr) {
		this.ptr = imagePtr;
		this.width = (getValue(imagePtr + 4, "i32") as number) >>> 0;
		this.height = (getValue(imagePtr + 8, "i32") as number) >>> 0;
	}

	destroy(): void {
		if (this.ptr) {
			_wcn_destroy_image_data(this.ptr);
			this.ptr = 0 as ImageDataPtr;
		}
	}
}

export interface WCNCanvasOptions {
	device?: GPUDevice;
	adapter?: GPUAdapter;
}

export class WCNCanvas {
	readonly context: WCNContextPtr;
	readonly canvas: HTMLCanvasElement;
	readonly canvasContext: GPUCanvasContext;
	readonly device: GPUDevice;
	readonly format: GPUTextureFormat;
	private loadedFontFaces = new Map<string, { ptr: number }>();

	private constructor(context: WCNContextPtr, canvas: HTMLCanvasElement, canvasContext: GPUCanvasContext, device: GPUDevice, format: GPUTextureFormat) {
		this.context = context; this.canvas = canvas; this.canvasContext = canvasContext; this.device = device; this.format = format;
	}

	static async create(canvasElement: string | HTMLCanvasElement, options?: WCNCanvasOptions): Promise<WCNCanvas> {
		const canvas = typeof canvasElement === "string" ? (document.getElementById(canvasElement) as HTMLCanvasElement) : canvasElement;
		if (!canvas) throw new Error("Canvas element not found");

		_wcn_init_js();

		let device = options?.device;
		if (!device) {
			if (!navigator.gpu) throw new Error("WebGPU not supported");
			const adapter = options?.adapter ?? (await navigator.gpu.requestAdapter());
			if (!adapter) throw new Error("Failed to get WebGPU adapter");
			try { device = await adapter.requestDevice(); }
			catch (e) { console.warn("requestDevice failed, trying minimal config:", e); device = await adapter.requestDevice({ requiredFeatures: [], requiredLimits: {} }); }
			if (!device) throw new Error("Failed to get WebGPU device");
		}

		(globalThis as unknown as { preinitializedWebGPUDevice: GPUDevice }).preinitializedWebGPUDevice = device;
		const gpuResources = _wcn_wasm_create_gpu_resources_auto();
		if (!gpuResources) throw new Error("Failed to create GPU resources");
		const context = _wcn_create_context(gpuResources);
		if (!context) throw new Error("Failed to create WCN context");

		const canvasContext = canvas.getContext("webgpu")!;
		const format = navigator.gpu.getPreferredCanvasFormat();
		canvasContext.configure({ device, format, alphaMode: "premultiplied" });
		_wcn_set_surface_format(context, format === "bgra8unorm" ? 23 : 18);

		try { const fontDecoder = _wcn_wasm_get_font_decoder(); if (fontDecoder) _wcn_register_font_decoder(context, fontDecoder); } catch {}
		try { const defaultFontFace = _wcn_wasm_create_default_font_face(); if (defaultFontFace) _wcn_set_font_face(context, defaultFontFace, 16.0); } catch {}
		try { const imageDecoder = _wcn_wasm_get_image_decoder(); if (imageDecoder) _wcn_register_image_decoder(context, imageDecoder); } catch {}

		return new WCNCanvas(context, canvas, canvasContext, device, format);
	}

	beginFrame(): void { _wcn_begin_frame(this.context, this.canvas.width, this.canvas.height, this.format === "bgra8unorm" ? 23 : 18); }
	endFrame(): void { _wcn_end_frame(this.context); }
	beginRenderPass(customTextureView?: GPUTextureView): { textureViewId: number; result: number } | null {
		let textureView: GPUTextureView;
		if (customTextureView) {
			textureView = customTextureView;
		} else {
			const texture = this.canvasContext.getCurrentTexture(); if (!texture) return null;
			textureView = texture.createView(); if (!textureView) return null;
		}
		const textureViewId = storeWGPUTextureView(textureView);
		return { textureViewId, result: _wcn_begin_render_pass(this.context, textureViewId) };
	}
	endRenderPass(): void { _wcn_end_render_pass(this.context); }
	submitCommands(): void { _wcn_submit_commands(this.context); }
	save(): void { _wcn_save(this.context); }
	restore(): void { _wcn_restore(this.context); }
	clearRect(x: number, y: number, width: number, height: number): void { _wcn_clear_rect(this.context, x, y, width, height); }
	fillRect(x: number, y: number, width: number, height: number): void { _wcn_fill_rect(this.context, x, y, width, height); }
	strokeRect(x: number, y: number, width: number, height: number): void { _wcn_stroke_rect(this.context, x, y, width, height); }

	beginPath(): void { _wcn_begin_path(this.context); }
	moveTo(x: number, y: number): void { _wcn_move_to(this.context, x, y); }
	lineTo(x: number, y: number): void { _wcn_line_to(this.context, x, y); }
	arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise = false): void { _wcn_arc(this.context, x, y, radius, startAngle, endAngle, anticlockwise ? 1 : 0); }
	rect(x: number, y: number, width: number, height: number): void { _wcn_rect(this.context, x, y, width, height); }
	closePath(): void { _wcn_close_path(this.context); }
	fill(): void { _wcn_fill(this.context); }
	stroke(): void { _wcn_stroke(this.context); }
	fillCircle(x: number, y: number, radius: number): void { this.beginPath(); this.arc(x, y, radius, 0, Math.PI * 2); this.fill(); }

	setFillStyle(style: string | number): void { _wcn_set_fill_style(this.context, this._parseColor(style)); }
	setStrokeStyle(style: string | number): void { _wcn_set_stroke_style(this.context, this._parseColor(style)); }
	setLineWidth(width: number): void { _wcn_set_line_width(this.context, width); }
	setLineCap(cap: "butt" | "round" | "square"): void { _wcn_set_line_cap(this.context, cap === "round" ? LINE_CAP_ROUND : cap === "square" ? LINE_CAP_SQUARE : LINE_CAP_BUTT); }
	setLineJoin(join: "miter" | "round" | "bevel"): void { _wcn_set_line_join(this.context, join === "round" ? LINE_JOIN_ROUND : join === "bevel" ? LINE_JOIN_BEVEL : LINE_JOIN_MITER); }
	setMiterLimit(limit: number): void { _wcn_set_miter_limit(this.context, limit); }
	setGlobalAlpha(alpha: number): void { _wcn_set_global_alpha(this.context, alpha); }

	translate(x: number, y: number): void { _wcn_translate(this.context, x, y); }
	rotate(angle: number): void { _wcn_rotate(this.context, angle); }
	scale(x: number, y: number): void { _wcn_scale(this.context, x, y); }
	transform(a: number, b: number, c: number, d: number, e: number, f: number): void { _wcn_transform(this.context, a, b, c, d, e, f); }
	setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void { _wcn_set_transform(this.context, a, b, c, d, e, f); }
	resetTransform(): void { _wcn_reset_transform(this.context); }

	setFont(font: string): void {
		const fontPtr = _malloc(font.length + 1); stringToUTF8(font, fontPtr, font.length + 1); _wcn_set_font(this.context, fontPtr); _free(fontPtr);
		const match = font.match(/^\s*([0-9]*\.?[0-9]+)\s*px\s*(.+)$/i);
		if (match) { const size = parseFloat(match[1]); let family = match[2].split(",")[0].trim().replace(/^['"]+|['"]+$/g, ""); const entry = this.loadedFontFaces.get(family.toLowerCase()); if (entry?.ptr) _wcn_set_font_face(this.context, entry.ptr, size); }
	}
	fillText(text: string, x: number, y: number): void { const textBytes = lengthBytesUTF8(text) + 1; const textPtr = _malloc(textBytes); stringToUTF8(text, textPtr, textBytes); _wcn_fill_text(this.context, textPtr, x, y); _free(textPtr); }
	strokeText(text: string, x: number, y: number): void { const textBytes = lengthBytesUTF8(text) + 1; const textPtr = _malloc(textBytes); stringToUTF8(text, textPtr, textBytes); _wcn_stroke_text(this.context, textPtr, x, y); _free(textPtr); }
	measureText(text: string): { width: number } { const textBytes = lengthBytesUTF8(text) + 1; const textPtr = _malloc(textBytes); stringToUTF8(text, textPtr, textBytes); const outWidthPtr = _malloc(4); _wcn_measure_text(this.context, textPtr, outWidthPtr); const width = getValue(outWidthPtr, "float") as number; _free(outWidthPtr); _free(textPtr); return { width }; }

	loadFont(fontName: string, fontSize = 16, options?: { setCurrent?: boolean; addFallback?: boolean }): boolean {
		const setCurrent = options?.setCurrent ?? true; const addFallback = options?.addFallback ?? false;
		const fontDataString = fontName + "\0"; const fontDataLength = fontDataString.length;
		const fontDataPtr = _malloc(fontDataLength); stringToUTF8(fontDataString, fontDataPtr, fontDataLength);
		const fontFacePtrPtr = _malloc(4);
		try {
			const result = _wcn_wasm_load_font(fontDataPtr, fontDataLength, fontFacePtrPtr);
			if (result) { const fontFacePtr = getValue(fontFacePtrPtr, "i32") as number; if (fontFacePtr) { if (addFallback) _wcn_add_font_fallback(this.context, fontFacePtr); this.loadedFontFaces.set(fontName.toLowerCase(), { ptr: fontFacePtr }); if (setCurrent) _wcn_set_font_face(this.context, fontFacePtr, fontSize); return true; } }
		} finally { _free(fontDataPtr); _free(fontFacePtrPtr); }
		return false;
	}
	loadFallbackFont(fontName: string, fontSize = 16): boolean { return this.loadFont(fontName, fontSize, { setCurrent: false, addFallback: true }); }

	createImageFromBytes(byteArray: Uint8Array): WCNImage {
		if (!byteArray?.length) throw new Error("Byte array is empty");
		const dataPtr = _malloc(byteArray.length); getHEAPU8().set(byteArray, dataPtr);
		const imagePtr = _wcn_decode_image(this.context, dataPtr, byteArray.length); _free(dataPtr);
		if (!imagePtr) throw new Error("Failed to decode image bytes");
		return new WCNImage(imagePtr);
	}
	async loadImageFromUrl(url: string): Promise<WCNImage> { const response = await fetch(url); if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`); const buffer = await response.arrayBuffer(); return this.createImageFromBytes(new Uint8Array(buffer)); }

	drawImage(image: WCNImage, dx: number, dy: number): void;
	drawImage(image: WCNImage, dx: number, dy: number, dw: number, dh: number): void;
	drawImage(image: WCNImage, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
	drawImage(image: WCNImage, ...params: number[]): void {
		if (!image?.ptr) throw new Error("Invalid image");
		if (params.length === 2) _wcn_draw_image(this.context, image.ptr, params[0], params[1]);
		else if (params.length === 4) _wcn_draw_image_scaled(this.context, image.ptr, params[0], params[1], params[2], params[3]);
		else if (params.length === 8) _wcn_draw_image_source(this.context, image.ptr, params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7]);
	}

	private _parseColor(color: string | number): number {
		if (typeof color === "number") return color;
		if (typeof color !== "string") return 0xff000000;
		if (color.startsWith("#")) {
			const hex = color.substring(1);
			if (hex.length === 3) { const r = parseInt(hex[0] + hex[0], 16), g = parseInt(hex[1] + hex[1], 16), b = parseInt(hex[2] + hex[2], 16); return 0xff000000 | (r << 16) | (g << 8) | b; }
			else if (hex.length === 6) { const r = parseInt(hex.substring(0, 2), 16), g = parseInt(hex.substring(2, 4), 16), b = parseInt(hex.substring(4, 6), 16); return 0xff000000 | (r << 16) | (g << 8) | b; }
			else if (hex.length === 8) { const a = parseInt(hex.substring(0, 2), 16), r = parseInt(hex.substring(2, 4), 16), g = parseInt(hex.substring(4, 6), 16), b = parseInt(hex.substring(6, 8), 16); return (a << 24) | (r << 16) | (g << 8) | b; }
		} else if (color.startsWith("rgb(")) { const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/); if (match) { const r = parseInt(match[1], 10), g = parseInt(match[2], 10), b = parseInt(match[3], 10); return 0xff000000 | (r << 16) | (g << 8) | b; } }
		else if (color.startsWith("rgba(")) { const match = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/); if (match) { const r = parseInt(match[1], 10), g = parseInt(match[2], 10), b = parseInt(match[3], 10), a = Math.round(parseFloat(match[4]) * 255); return (a << 24) | (r << 16) | (g << 8) | b; } }
		return 0xff000000;
	}
}
