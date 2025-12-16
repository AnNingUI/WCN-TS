/**
 * WCN Wrapper Classes
 * 提供类似 HTML5 Canvas2D 的 API 以及数学类型封装
 */

import {
	_malloc,
	_free,
	_wcn_init_js,
	_wcn_wasm_create_gpu_resources_auto,
	_wcn_create_context,
	_wcn_set_surface_format,
	_wcn_wasm_get_font_decoder,
	_wcn_register_font_decoder,
	_wcn_wasm_create_default_font_face,
	_wcn_set_font_face,
	_wcn_wasm_get_image_decoder,
	_wcn_register_image_decoder,
	_wcn_begin_frame,
	_wcn_end_frame,
	_wcn_begin_render_pass,
	_wcn_end_render_pass,
	_wcn_submit_commands,
	_wcn_save,
	_wcn_restore,
	_wcn_clear_rect,
	_wcn_fill_rect,
	_wcn_stroke_rect,
	_wcn_begin_path,
	_wcn_move_to,
	_wcn_line_to,
	_wcn_arc,
	_wcn_rect,
	_wcn_close_path,
	_wcn_fill,
	_wcn_stroke,
	_wcn_set_fill_style,
	_wcn_set_stroke_style,
	_wcn_set_line_width,
	_wcn_set_line_cap,
	_wcn_set_line_join,
	_wcn_set_miter_limit,
	_wcn_set_global_alpha,
	_wcn_translate,
	_wcn_rotate,
	_wcn_scale,
	_wcn_transform,
	_wcn_set_transform,
	_wcn_reset_transform,
	_wcn_set_font,
	_wcn_fill_text,
	_wcn_stroke_text,
	_wcn_measure_text,
	_wcn_decode_image,
	_wcn_destroy_image_data,
	_wcn_draw_image,
	_wcn_draw_image_scaled,
	_wcn_draw_image_source,
	_wcn_add_font_fallback,
	_wcn_wasm_load_font,
	storeWGPUTextureView,
	getValue,
	stringToUTF8,
	lengthBytesUTF8,
	getHEAPU8,
	getHEAPF32,
	// Math functions
	_wcn_math_Vec2_create_wasm,
	_wcn_math_Vec2_copy_wasm,
	_wcn_math_Vec2_zero_wasm,
	_wcn_math_Vec2_set_wasm,
	_wcn_math_Vec2_add_wasm,
	_wcn_math_Vec2_sub_wasm,
	_wcn_math_Vec2_multiply_wasm,
	_wcn_math_Vec2_multiply_scalar_wasm,
	_wcn_math_Vec2_div_wasm,
	_wcn_math_Vec2_div_scalar_wasm,
	_wcn_math_Vec2_dot_wasm,
	_wcn_math_Vec2_cross_wasm,
	_wcn_math_Vec2_length_wasm,
	_wcn_math_Vec2_length_squared_wasm,
	_wcn_math_Vec2_distance_wasm,
	_wcn_math_Vec2_normalize_wasm,
	_wcn_math_Vec2_negate_wasm,
	_wcn_math_Vec2_lerp_wasm,
	_wcn_math_Vec2_equals_wasm,
	_wcn_math_Vec3_create_wasm,
	_wcn_math_Vec3_copy_wasm,
	_wcn_math_Vec3_zero_wasm,
	_wcn_math_Vec3_set_wasm,
	_wcn_math_Vec3_add_wasm,
	_wcn_math_Vec3_sub_wasm,
	_wcn_math_Vec3_cross_wasm,
	_wcn_math_Vec3_dot_wasm,
	_wcn_math_Vec3_length_wasm,
	_wcn_math_Vec3_normalize_wasm,
	_wcn_math_Vec3_lerp_wasm,
	_wcn_math_Vec4_create_wasm,
	_wcn_math_Vec4_copy_wasm,
	_wcn_math_Vec4_zero_wasm,
	_wcn_math_Mat3_identity_wasm,
	_wcn_math_Mat3_copy_wasm,
	_wcn_math_Mat3_multiply_wasm,
	_wcn_math_Mat3_transpose_wasm,
	_wcn_math_Mat3_determinant_wasm,
	_wcn_math_Mat3_inverse_wasm,
	_wcn_math_Mat3_scale_wasm,
	_wcn_math_Mat3_rotate_wasm,
	_wcn_math_Mat3_translate_wasm,
	_wcn_math_Mat4_identity_wasm,
	_wcn_math_Mat4_copy_wasm,
	_wcn_math_Mat4_multiply_wasm,
	_wcn_math_Mat4_transpose_wasm,
	_wcn_math_Mat4_determinant_wasm,
	_wcn_math_Mat4_inverse_wasm,
	_wcn_math_Mat4_scale_wasm,
	_wcn_math_Mat4_rotate_wasm,
	_wcn_math_Mat4_translate_wasm,
	_wcn_math_Mat4_perspective_wasm,
	_wcn_math_Mat4_ortho_wasm,
	_wcn_math_Mat4_look_at_wasm,
	_wcn_math_Quat_identity_wasm,
	_wcn_math_Quat_copy_wasm,
	_wcn_math_Quat_multiply_wasm,
	_wcn_math_Quat_normalize_wasm,
	_wcn_math_Quat_slerp_wasm,
	_wcn_math_Quat_from_axis_angle_wasm,
	_wcn_math_Quat_from_euler_wasm,
	_wcn_math_Mat4_from_quat_wasm,
} from "./wcn";
import type {
	WCNContextPtr,
	ImageDataPtr,
	Vec2Ptr,
	Vec3Ptr,
	Vec4Ptr,
	Mat3Ptr,
	Mat4Ptr,
	QuatPtr,
} from "./wcn";
import { RotationOrder } from "./type";

// ============================================================================
// 常量
// ============================================================================

const SIZE_F32 = 4;
const SIZE_VEC2 = 8;
const SIZE_VEC3 = 12;
const SIZE_VEC4 = 16;
const SIZE_MAT3 = 48;
const SIZE_MAT4 = 64;
const SIZE_QUAT = 16;

// LineCap 枚举值
const LINE_CAP_BUTT = 0;
const LINE_CAP_ROUND = 1;
const LINE_CAP_SQUARE = 2;

// LineJoin 枚举值
const LINE_JOIN_MITER = 0;

// ============================================================================
// 对齐内存分配辅助函数
// ============================================================================

// 存储原始指针的映射，用于正确释放
const alignedPtrMap = new Map<number, number>();

function mallocAligned(size: number, alignment: number): number {
	const rawPtr = _malloc(size + alignment - 1);
	const alignedPtr = (rawPtr + alignment - 1) & ~(alignment - 1);
	alignedPtrMap.set(alignedPtr, rawPtr);
	return alignedPtr;
}

function freeAligned(alignedPtr: number): void {
	const rawPtr = alignedPtrMap.get(alignedPtr);
	if (rawPtr !== undefined) {
		_free(rawPtr);
		alignedPtrMap.delete(alignedPtr);
	} else {
		// 如果没有在映射中，可能是普通分配的指针
		_free(alignedPtr);
	}
}
const LINE_JOIN_ROUND = 1;
const LINE_JOIN_BEVEL = 2;

// ============================================================================
// WCNImage
// ============================================================================

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


// ============================================================================
// WCNCanvas
// ============================================================================

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

	private constructor(
		context: WCNContextPtr,
		canvas: HTMLCanvasElement,
		canvasContext: GPUCanvasContext,
		device: GPUDevice,
		format: GPUTextureFormat,
	) {
		this.context = context;
		this.canvas = canvas;
		this.canvasContext = canvasContext;
		this.device = device;
		this.format = format;
	}

	static async create(
		canvasElement: string | HTMLCanvasElement,
		options?: WCNCanvasOptions,
	): Promise<WCNCanvas> {
		const canvas =
			typeof canvasElement === "string"
				? (document.getElementById(canvasElement) as HTMLCanvasElement)
				: canvasElement;

		if (!canvas) throw new Error("Canvas element not found");

		_wcn_init_js();

		let device = options?.device;
		if (!device) {
			if (!navigator.gpu) {
				throw new Error(
					"WebGPU not supported. Please use Chrome/Edge 113+ or enable WebGPU in Firefox (about:config -> dom.webgpu.enabled)",
				);
			}
			const adapter = options?.adapter ?? (await navigator.gpu.requestAdapter());
			if (!adapter) {
				throw new Error(
					"Failed to get WebGPU adapter. Your browser may not support WebGPU or it may be disabled.",
				);
			}

			// 尝试请求 device，Firefox 可能需要特殊处理
			try {
				device = await adapter.requestDevice();
			} catch (e) {
				// Firefox 可能不支持某些默认 features，尝试最小配置
				console.warn("requestDevice failed, trying minimal config:", e);
				device = await adapter.requestDevice({
					requiredFeatures: [],
					requiredLimits: {},
				});
			}
			if (!device) throw new Error("Failed to get WebGPU device");
		}

		// 通过 globalThis.preinitializedWebGPUDevice 传递 device 给 WASM
		(globalThis as unknown as { preinitializedWebGPUDevice: GPUDevice }).preinitializedWebGPUDevice =
			device;

		// 创建 GPU 资源（Emscripten 会自动使用 preinitializedWebGPUDevice）
		let gpuResources: number;
		try {
			gpuResources = _wcn_wasm_create_gpu_resources_auto();
		} catch (e) {
			console.error("_wcn_wasm_create_gpu_resources_auto failed:", e);
			throw e;
		}
		if (!gpuResources) throw new Error("Failed to create GPU resources");

		let context: ReturnType<typeof _wcn_create_context>;
		try {
			context = _wcn_create_context(gpuResources);
		} catch (e) {
			console.error("_wcn_create_context failed:", e);
			throw e;
		}
		if (!context) throw new Error("Failed to create WCN context");

		const canvasContext = canvas.getContext("webgpu")!;
		const format = navigator.gpu.getPreferredCanvasFormat();
		canvasContext.configure({ device, format, alphaMode: "premultiplied" });

		const formatEnum = format === "bgra8unorm" ? 23 : 18;
		_wcn_set_surface_format(context, formatEnum);

		// Register font decoder
		try {
			const fontDecoder = _wcn_wasm_get_font_decoder();
			if (fontDecoder) _wcn_register_font_decoder(context, fontDecoder);
		} catch {}

		// Create default font face
		try {
			const defaultFontFace = _wcn_wasm_create_default_font_face();
			if (defaultFontFace) _wcn_set_font_face(context, defaultFontFace, 16.0);
		} catch {}

		// Register image decoder
		try {
			const imageDecoder = _wcn_wasm_get_image_decoder();
			if (imageDecoder) _wcn_register_image_decoder(context, imageDecoder);
		} catch {}

		return new WCNCanvas(context, canvas, canvasContext, device, format);
	}

	// Frame methods
	beginFrame(): void {
		const formatEnum = this.format === "bgra8unorm" ? 23 : 18;
		_wcn_begin_frame(this.context, this.canvas.width, this.canvas.height, formatEnum);
	}

	endFrame(): void {
		_wcn_end_frame(this.context);
	}

	beginRenderPass(): { textureViewId: number; result: number } | null {
		const texture = this.canvasContext.getCurrentTexture();
		if (!texture) return null;

		const textureView = texture.createView();
		if (!textureView) return null;

		const textureViewId = storeWGPUTextureView(textureView);
		const result = _wcn_begin_render_pass(this.context, textureViewId);
		return { textureViewId, result };
	}

	endRenderPass(): void {
		_wcn_end_render_pass(this.context);
	}

	submitCommands(): void {
		_wcn_submit_commands(this.context);
	}

	// State methods
	save(): void {
		_wcn_save(this.context);
	}

	restore(): void {
		_wcn_restore(this.context);
	}

	// Drawing methods
	clearRect(x: number, y: number, width: number, height: number): void {
		_wcn_clear_rect(this.context, x, y, width, height);
	}

	fillRect(x: number, y: number, width: number, height: number): void {
		_wcn_fill_rect(this.context, x, y, width, height);
	}

	strokeRect(x: number, y: number, width: number, height: number): void {
		_wcn_stroke_rect(this.context, x, y, width, height);
	}

	// Path methods
	beginPath(): void {
		_wcn_begin_path(this.context);
	}

	moveTo(x: number, y: number): void {
		_wcn_move_to(this.context, x, y);
	}

	lineTo(x: number, y: number): void {
		_wcn_line_to(this.context, x, y);
	}

	arc(
		x: number,
		y: number,
		radius: number,
		startAngle: number,
		endAngle: number,
		anticlockwise = false,
	): void {
		_wcn_arc(this.context, x, y, radius, startAngle, endAngle, anticlockwise ? 1 : 0);
	}

	rect(x: number, y: number, width: number, height: number): void {
		_wcn_rect(this.context, x, y, width, height);
	}

	closePath(): void {
		_wcn_close_path(this.context);
	}

	fill(): void {
		_wcn_fill(this.context);
	}

	stroke(): void {
		_wcn_stroke(this.context);
	}

	fillCircle(x: number, y: number, radius: number): void {
		this.beginPath();
		this.arc(x, y, radius, 0, Math.PI * 2);
		this.fill();
	}

	// Style methods
	setFillStyle(style: string | number): void {
		_wcn_set_fill_style(this.context, this._parseColor(style));
	}

	setStrokeStyle(style: string | number): void {
		_wcn_set_stroke_style(this.context, this._parseColor(style));
	}

	setLineWidth(width: number): void {
		_wcn_set_line_width(this.context, width);
	}

	setLineCap(cap: "butt" | "round" | "square"): void {
		const capValue =
			cap === "round" ? LINE_CAP_ROUND : cap === "square" ? LINE_CAP_SQUARE : LINE_CAP_BUTT;
		_wcn_set_line_cap(this.context, capValue);
	}

	setLineJoin(join: "miter" | "round" | "bevel"): void {
		const joinValue =
			join === "round" ? LINE_JOIN_ROUND : join === "bevel" ? LINE_JOIN_BEVEL : LINE_JOIN_MITER;
		_wcn_set_line_join(this.context, joinValue);
	}

	setMiterLimit(limit: number): void {
		_wcn_set_miter_limit(this.context, limit);
	}

	setGlobalAlpha(alpha: number): void {
		_wcn_set_global_alpha(this.context, alpha);
	}

	// Transform methods
	translate(x: number, y: number): void {
		_wcn_translate(this.context, x, y);
	}

	rotate(angle: number): void {
		_wcn_rotate(this.context, angle);
	}

	scale(x: number, y: number): void {
		_wcn_scale(this.context, x, y);
	}

	transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
		_wcn_transform(this.context, a, b, c, d, e, f);
	}

	setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
		_wcn_set_transform(this.context, a, b, c, d, e, f);
	}

	resetTransform(): void {
		_wcn_reset_transform(this.context);
	}

	// Text methods
	setFont(font: string): void {
		const fontPtr = _malloc(font.length + 1);
		stringToUTF8(font, fontPtr, font.length + 1);
		_wcn_set_font(this.context, fontPtr);
		_free(fontPtr);

		const match = font.match(/^\s*([0-9]*\.?[0-9]+)\s*px\s*(.+)$/i);
		if (match) {
			const size = parseFloat(match[1]);
			let family = match[2].split(",")[0].trim().replace(/^['"]+|['"]+$/g, "");
			const entry = this.loadedFontFaces.get(family.toLowerCase());
			if (entry?.ptr) _wcn_set_font_face(this.context, entry.ptr, size);
		}
	}

	fillText(text: string, x: number, y: number): void {
		const textBytes = lengthBytesUTF8(text) + 1;
		const textPtr = _malloc(textBytes);
		stringToUTF8(text, textPtr, textBytes);
		_wcn_fill_text(this.context, textPtr, x, y);
		_free(textPtr);
	}

	strokeText(text: string, x: number, y: number): void {
		const textBytes = lengthBytesUTF8(text) + 1;
		const textPtr = _malloc(textBytes);
		stringToUTF8(text, textPtr, textBytes);
		_wcn_stroke_text(this.context, textPtr, x, y);
		_free(textPtr);
	}

	measureText(text: string): { width: number } {
		const textBytes = lengthBytesUTF8(text) + 1;
		const textPtr = _malloc(textBytes);
		stringToUTF8(text, textPtr, textBytes);
		const outWidthPtr = _malloc(4);
		_wcn_measure_text(this.context, textPtr, outWidthPtr);
		const width = getValue(outWidthPtr, "float") as number;
		_free(outWidthPtr);
		_free(textPtr);
		return { width };
	}

	loadFont(
		fontName: string,
		fontSize = 16,
		options?: { setCurrent?: boolean; addFallback?: boolean },
	): boolean {
		const setCurrent = options?.setCurrent ?? true;
		const addFallback = options?.addFallback ?? false;

		const fontDataString = fontName + "\0";
		const fontDataLength = fontDataString.length;
		const fontDataPtr = _malloc(fontDataLength);
		stringToUTF8(fontDataString, fontDataPtr, fontDataLength);
		const fontFacePtrPtr = _malloc(4);

		try {
			const result = _wcn_wasm_load_font(fontDataPtr, fontDataLength, fontFacePtrPtr);
			if (result) {
				const fontFacePtr = getValue(fontFacePtrPtr, "i32") as number;
				if (fontFacePtr) {
					if (addFallback) _wcn_add_font_fallback(this.context, fontFacePtr);
					this.loadedFontFaces.set(fontName.toLowerCase(), { ptr: fontFacePtr });
					if (setCurrent) _wcn_set_font_face(this.context, fontFacePtr, fontSize);
					return true;
				}
			}
		} finally {
			_free(fontDataPtr);
			_free(fontFacePtrPtr);
		}
		return false;
	}

	loadFallbackFont(fontName: string, fontSize = 16): boolean {
		return this.loadFont(fontName, fontSize, { setCurrent: false, addFallback: true });
	}

	// Image methods
	createImageFromBytes(byteArray: Uint8Array): WCNImage {
		if (!byteArray?.length) throw new Error("Byte array is empty");

		const dataPtr = _malloc(byteArray.length);
		getHEAPU8().set(byteArray, dataPtr);
		const imagePtr = _wcn_decode_image(this.context, dataPtr, byteArray.length);
		_free(dataPtr);

		if (!imagePtr) throw new Error("Failed to decode image bytes");
		return new WCNImage(imagePtr);
	}

	async loadImageFromUrl(url: string): Promise<WCNImage> {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
		const buffer = await response.arrayBuffer();
		return this.createImageFromBytes(new Uint8Array(buffer));
	}

	drawImage(image: WCNImage, dx: number, dy: number): void;
	drawImage(image: WCNImage, dx: number, dy: number, dw: number, dh: number): void;
	drawImage(
		image: WCNImage,
		sx: number,
		sy: number,
		sw: number,
		sh: number,
		dx: number,
		dy: number,
		dw: number,
		dh: number,
	): void;
	drawImage(image: WCNImage, ...params: number[]): void {
		if (!image?.ptr) throw new Error("Invalid image");

		if (params.length === 2) {
			_wcn_draw_image(this.context, image.ptr, params[0], params[1]);
		} else if (params.length === 4) {
			_wcn_draw_image_scaled(this.context, image.ptr, params[0], params[1], params[2], params[3]);
		} else if (params.length === 8) {
			_wcn_draw_image_source(
				this.context,
				image.ptr,
				params[0],
				params[1],
				params[2],
				params[3],
				params[4],
				params[5],
				params[6],
				params[7],
			);
		}
	}

	private _parseColor(color: string | number): number {
		if (typeof color === "number") return color;
		if (typeof color !== "string") return 0xff000000;

		if (color.startsWith("#")) {
			const hex = color.substring(1);
			if (hex.length === 3) {
				const r = parseInt(hex[0] + hex[0], 16);
				const g = parseInt(hex[1] + hex[1], 16);
				const b = parseInt(hex[2] + hex[2], 16);
				return 0xff000000 | (r << 16) | (g << 8) | b;
			} else if (hex.length === 6) {
				const r = parseInt(hex.substring(0, 2), 16);
				const g = parseInt(hex.substring(2, 4), 16);
				const b = parseInt(hex.substring(4, 6), 16);
				return 0xff000000 | (r << 16) | (g << 8) | b;
			} else if (hex.length === 8) {
				const a = parseInt(hex.substring(0, 2), 16);
				const r = parseInt(hex.substring(2, 4), 16);
				const g = parseInt(hex.substring(4, 6), 16);
				const b = parseInt(hex.substring(6, 8), 16);
				return (a << 24) | (r << 16) | (g << 8) | b;
			}
		} else if (color.startsWith("rgb(")) {
			const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
			if (match) {
				const r = parseInt(match[1], 10);
				const g = parseInt(match[2], 10);
				const b = parseInt(match[3], 10);
				return 0xff000000 | (r << 16) | (g << 8) | b;
			}
		} else if (color.startsWith("rgba(")) {
			const match = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
			if (match) {
				const r = parseInt(match[1], 10);
				const g = parseInt(match[2], 10);
				const b = parseInt(match[3], 10);
				const a = Math.round(parseFloat(match[4]) * 255);
				return (a << 24) | (r << 16) | (g << 8) | b;
			}
		}
		return 0xff000000;
	}
}


// ============================================================================
// Vec2
// ============================================================================

export class Vec2 {
	ptr: Vec2Ptr;

	private constructor(ptr: Vec2Ptr) {
		this.ptr = ptr;
	}

	static create(x: number, y: number): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_create_wasm(ptr, x, y);
		return new Vec2(ptr);
	}

	static zero(): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_zero_wasm(ptr);
		return new Vec2(ptr);
	}

	static copy(v: Vec2): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_copy_wasm(ptr, v.ptr);
		return new Vec2(ptr);
	}

	free(): void {
		_free(this.ptr);
	}

	get x(): number {
		return getValue(this.ptr, "float") as number;
	}

	set x(value: number) {
		_wcn_math_Vec2_set_wasm(this.ptr, value, this.y);
	}

	get y(): number {
		return getValue(this.ptr + SIZE_F32, "float") as number;
	}

	set y(value: number) {
		_wcn_math_Vec2_set_wasm(this.ptr, this.x, value);
	}

	set(x: number, y: number): this {
		_wcn_math_Vec2_set_wasm(this.ptr, x, y);
		return this;
	}

	add(other: Vec2): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_add_wasm(ptr, this.ptr, other.ptr);
		return new Vec2(ptr);
	}

	sub(other: Vec2): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_sub_wasm(ptr, this.ptr, other.ptr);
		return new Vec2(ptr);
	}

	multiply(other: Vec2): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_multiply_wasm(ptr, this.ptr, other.ptr);
		return new Vec2(ptr);
	}

	multiplyScalar(scalar: number): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_multiply_scalar_wasm(ptr, this.ptr, scalar);
		return new Vec2(ptr);
	}

	div(other: Vec2): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_div_wasm(ptr, this.ptr, other.ptr);
		return new Vec2(ptr);
	}

	divScalar(scalar: number): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_div_scalar_wasm(ptr, this.ptr, scalar);
		return new Vec2(ptr);
	}

	dot(other: Vec2): number {
		return _wcn_math_Vec2_dot_wasm(this.ptr, other.ptr);
	}

	cross(other: Vec2): Vec3 {
		const ptr = _malloc(SIZE_VEC3) as Vec3Ptr;
		_wcn_math_Vec2_cross_wasm(ptr, this.ptr, other.ptr);
		return Vec3._fromPtr(ptr);
	}

	length(): number {
		return _wcn_math_Vec2_length_wasm(this.ptr);
	}

	lengthSquared(): number {
		return _wcn_math_Vec2_length_squared_wasm(this.ptr);
	}

	distance(other: Vec2): number {
		return _wcn_math_Vec2_distance_wasm(this.ptr, other.ptr);
	}

	normalize(): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_normalize_wasm(ptr, this.ptr);
		return new Vec2(ptr);
	}

	negate(): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_negate_wasm(ptr, this.ptr);
		return new Vec2(ptr);
	}

	lerp(other: Vec2, t: number): Vec2 {
		const ptr = _malloc(SIZE_VEC2) as Vec2Ptr;
		_wcn_math_Vec2_lerp_wasm(ptr, this.ptr, other.ptr, t);
		return new Vec2(ptr);
	}

	equals(other: Vec2): boolean {
		return _wcn_math_Vec2_equals_wasm(this.ptr, other.ptr) !== 0;
	}

	toArray(): [number, number] {
		return [this.x, this.y];
	}

	toF32Array(): Float32Array {
		const heap = getHEAPF32();
		return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 2);
	}

	toString(): string {
		return `[${this.x}, ${this.y}]`;
	}
}

// ============================================================================
// Vec3
// ============================================================================

export class Vec3 {
	ptr: Vec3Ptr;

	private constructor(ptr: Vec3Ptr) {
		this.ptr = ptr;
	}

	/** @internal */
	static _fromPtr(ptr: Vec3Ptr): Vec3 {
		return new Vec3(ptr);
	}

	static create(x: number, y: number, z: number): Vec3 {
		const ptr = _malloc(SIZE_VEC3) as Vec3Ptr;
		_wcn_math_Vec3_create_wasm(ptr, x, y, z);
		return new Vec3(ptr);
	}

	static zero(): Vec3 {
		const ptr = _malloc(SIZE_VEC3) as Vec3Ptr;
		_wcn_math_Vec3_zero_wasm(ptr);
		return new Vec3(ptr);
	}

	static copy(v: Vec3): Vec3 {
		const ptr = _malloc(SIZE_VEC3) as Vec3Ptr;
		_wcn_math_Vec3_copy_wasm(ptr, v.ptr);
		return new Vec3(ptr);
	}

	free(): void {
		_free(this.ptr);
	}

	get x(): number {
		return getValue(this.ptr, "float") as number;
	}

	set x(value: number) {
		_wcn_math_Vec3_set_wasm(this.ptr, value, this.y, this.z);
	}

	get y(): number {
		return getValue(this.ptr + SIZE_F32, "float") as number;
	}

	set y(value: number) {
		_wcn_math_Vec3_set_wasm(this.ptr, this.x, value, this.z);
	}

	get z(): number {
		return getValue(this.ptr + SIZE_F32 * 2, "float") as number;
	}

	set z(value: number) {
		_wcn_math_Vec3_set_wasm(this.ptr, this.x, this.y, value);
	}

	set(x: number, y: number, z: number): this {
		_wcn_math_Vec3_set_wasm(this.ptr, x, y, z);
		return this;
	}

	add(other: Vec3): Vec3 {
		const ptr = _malloc(SIZE_VEC3) as Vec3Ptr;
		_wcn_math_Vec3_add_wasm(ptr, this.ptr, other.ptr);
		return new Vec3(ptr);
	}

	sub(other: Vec3): Vec3 {
		const ptr = _malloc(SIZE_VEC3) as Vec3Ptr;
		_wcn_math_Vec3_sub_wasm(ptr, this.ptr, other.ptr);
		return new Vec3(ptr);
	}

	cross(other: Vec3): Vec3 {
		const ptr = _malloc(SIZE_VEC3) as Vec3Ptr;
		_wcn_math_Vec3_cross_wasm(ptr, this.ptr, other.ptr);
		return new Vec3(ptr);
	}

	dot(other: Vec3): number {
		return _wcn_math_Vec3_dot_wasm(this.ptr, other.ptr);
	}

	length(): number {
		return _wcn_math_Vec3_length_wasm(this.ptr);
	}

	normalize(): Vec3 {
		const ptr = _malloc(SIZE_VEC3) as Vec3Ptr;
		_wcn_math_Vec3_normalize_wasm(ptr, this.ptr);
		return new Vec3(ptr);
	}

	lerp(other: Vec3, t: number): Vec3 {
		const ptr = _malloc(SIZE_VEC3) as Vec3Ptr;
		_wcn_math_Vec3_lerp_wasm(ptr, this.ptr, other.ptr, t);
		return new Vec3(ptr);
	}

	toArray(): [number, number, number] {
		return [this.x, this.y, this.z];
	}

	toF32Array(): Float32Array {
		const heap = getHEAPF32();
		return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 3);
	}

	toString(): string {
		return `[${this.x}, ${this.y}, ${this.z}]`;
	}
}

// ============================================================================
// Vec4
// ============================================================================

export class Vec4 {
	ptr: Vec4Ptr;

	private constructor(ptr: Vec4Ptr) {
		this.ptr = ptr;
	}

	static create(x: number, y: number, z: number, w: number): Vec4 {
		const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr;
		_wcn_math_Vec4_create_wasm(ptr, x, y, z, w);
		return new Vec4(ptr);
	}

	static zero(): Vec4 {
		const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr;
		_wcn_math_Vec4_zero_wasm(ptr);
		return new Vec4(ptr);
	}

	static copy(v: Vec4): Vec4 {
		const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr;
		_wcn_math_Vec4_copy_wasm(ptr, v.ptr);
		return new Vec4(ptr);
	}

	free(): void {
		freeAligned(this.ptr);
	}

	get x(): number {
		return getValue(this.ptr, "float") as number;
	}

	get y(): number {
		return getValue(this.ptr + SIZE_F32, "float") as number;
	}

	get z(): number {
		return getValue(this.ptr + SIZE_F32 * 2, "float") as number;
	}

	get w(): number {
		return getValue(this.ptr + SIZE_F32 * 3, "float") as number;
	}

	toArray(): [number, number, number, number] {
		return [this.x, this.y, this.z, this.w];
	}

	toF32Array(): Float32Array {
		const heap = getHEAPF32();
		return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 4);
	}

	toString(): string {
		return `[${this.x}, ${this.y}, ${this.z}, ${this.w}]`;
	}
}

// ============================================================================
// Mat3
// ============================================================================

export class Mat3 {
	ptr: Mat3Ptr;

	private constructor(ptr: Mat3Ptr) {
		this.ptr = ptr;
	}

	static identity(): Mat3 {
		const ptr = _malloc(SIZE_MAT3) as Mat3Ptr;
		_wcn_math_Mat3_identity_wasm(ptr);
		return new Mat3(ptr);
	}

	static copy(m: Mat3): Mat3 {
		const ptr = _malloc(SIZE_MAT3) as Mat3Ptr;
		_wcn_math_Mat3_copy_wasm(ptr, m.ptr);
		return new Mat3(ptr);
	}

	free(): void {
		_free(this.ptr);
	}

	multiply(other: Mat3): Mat3 {
		const ptr = _malloc(SIZE_MAT3) as Mat3Ptr;
		_wcn_math_Mat3_multiply_wasm(ptr, this.ptr, other.ptr);
		return new Mat3(ptr);
	}

	transpose(): Mat3 {
		const ptr = _malloc(SIZE_MAT3) as Mat3Ptr;
		_wcn_math_Mat3_transpose_wasm(ptr, this.ptr);
		return new Mat3(ptr);
	}

	determinant(): number {
		return _wcn_math_Mat3_determinant_wasm(this.ptr);
	}

	inverse(): Mat3 {
		const ptr = _malloc(SIZE_MAT3) as Mat3Ptr;
		_wcn_math_Mat3_inverse_wasm(ptr, this.ptr);
		return new Mat3(ptr);
	}

	scale(v: Vec2): Mat3 {
		const ptr = _malloc(SIZE_MAT3) as Mat3Ptr;
		_wcn_math_Mat3_scale_wasm(ptr, this.ptr, v.ptr);
		return new Mat3(ptr);
	}

	rotate(angle: number): Mat3 {
		const ptr = _malloc(SIZE_MAT3) as Mat3Ptr;
		_wcn_math_Mat3_rotate_wasm(ptr, this.ptr, angle);
		return new Mat3(ptr);
	}

	translate(v: Vec2): Mat3 {
		const ptr = _malloc(SIZE_MAT3) as Mat3Ptr;
		_wcn_math_Mat3_translate_wasm(ptr, this.ptr, v.ptr);
		return new Mat3(ptr);
	}

	toF32Array(): Float32Array {
		const heap = getHEAPF32();
		return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 12);
	}
}

// ============================================================================
// Mat4
// ============================================================================

export class Mat4 {
	ptr: Mat4Ptr;

	private constructor(ptr: Mat4Ptr) {
		this.ptr = ptr;
	}

	static identity(): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_identity_wasm(ptr);
		return new Mat4(ptr);
	}

	static copy(m: Mat4): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_copy_wasm(ptr, m.ptr);
		return new Mat4(ptr);
	}

	static perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_perspective_wasm(ptr, fovy, aspect, near, far);
		return new Mat4(ptr);
	}

	static ortho(
		left: number,
		right: number,
		bottom: number,
		top: number,
		near: number,
		far: number,
	): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_ortho_wasm(ptr, left, right, bottom, top, near, far);
		return new Mat4(ptr);
	}

	static lookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_look_at_wasm(ptr, eye.ptr, center.ptr, up.ptr);
		return new Mat4(ptr);
	}

	static fromQuat(q: Quat): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_from_quat_wasm(ptr, q.ptr);
		return new Mat4(ptr);
	}

	free(): void {
		_free(this.ptr);
	}

	multiply(other: Mat4): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_multiply_wasm(ptr, this.ptr, other.ptr);
		return new Mat4(ptr);
	}

	transpose(): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_transpose_wasm(ptr, this.ptr);
		return new Mat4(ptr);
	}

	determinant(): number {
		return _wcn_math_Mat4_determinant_wasm(this.ptr);
	}

	inverse(): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_inverse_wasm(ptr, this.ptr);
		return new Mat4(ptr);
	}

	scale(v: Vec3): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_scale_wasm(ptr, this.ptr, v.ptr);
		return new Mat4(ptr);
	}

	rotate(axis: Vec3, angle: number): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_rotate_wasm(ptr, this.ptr, axis.ptr, angle);
		return new Mat4(ptr);
	}

	translate(v: Vec3): Mat4 {
		const ptr = _malloc(SIZE_MAT4) as Mat4Ptr;
		_wcn_math_Mat4_translate_wasm(ptr, this.ptr, v.ptr);
		return new Mat4(ptr);
	}

	toF32Array(): Float32Array {
		const heap = getHEAPF32();
		return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 16);
	}
}

// ============================================================================
// Quat
// ============================================================================

export class Quat {
	ptr: QuatPtr;

	private constructor(ptr: QuatPtr) {
		this.ptr = ptr;
	}

	static identity(): Quat {
		const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr;
		_wcn_math_Quat_identity_wasm(ptr);
		return new Quat(ptr);
	}

	static copy(q: Quat): Quat {
		const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr;
		_wcn_math_Quat_copy_wasm(ptr, q.ptr);
		return new Quat(ptr);
	}

	static fromAxisAngle(axis: Vec3, angle: number): Quat {
		const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr;
		_wcn_math_Quat_from_axis_angle_wasm(ptr, axis.ptr, angle);
		return new Quat(ptr);
	}

	static fromEuler(x: number, y: number, z: number, order: RotationOrder = RotationOrder.XYZ): Quat {
		const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr;
		_wcn_math_Quat_from_euler_wasm(ptr, x, y, z, order);
		return new Quat(ptr);
	}

	free(): void {
		freeAligned(this.ptr);
	}

	get x(): number {
		return getValue(this.ptr, "float") as number;
	}

	get y(): number {
		return getValue(this.ptr + SIZE_F32, "float") as number;
	}

	get z(): number {
		return getValue(this.ptr + SIZE_F32 * 2, "float") as number;
	}

	get w(): number {
		return getValue(this.ptr + SIZE_F32 * 3, "float") as number;
	}

	multiply(other: Quat): Quat {
		const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr;
		_wcn_math_Quat_multiply_wasm(ptr, this.ptr, other.ptr);
		return new Quat(ptr);
	}

	normalize(): Quat {
		const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr;
		_wcn_math_Quat_normalize_wasm(ptr, this.ptr);
		return new Quat(ptr);
	}

	slerp(other: Quat, t: number): Quat {
		const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr;
		_wcn_math_Quat_slerp_wasm(ptr, this.ptr, other.ptr, t);
		return new Quat(ptr);
	}

	toMat4(): Mat4 {
		return Mat4.fromQuat(this);
	}

	toArray(): [number, number, number, number] {
		return [this.x, this.y, this.z, this.w];
	}

	toF32Array(): Float32Array {
		const heap = getHEAPF32();
		return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 4);
	}

	toString(): string {
		return `[${this.x}, ${this.y}, ${this.z}, ${this.w}]`;
	}
}
