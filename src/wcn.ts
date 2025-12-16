/**
 * WCN WASM ES Module - 干净的 TypeScript 实现
 * 移除了不必要的 assert 和调试代码
 */

import type {
	Ptr,
	Vec2Ptr,
	Vec3Ptr,
	Vec3WithWithAngleAxisPtr,
	Vec4Ptr,
	QuatPtr,
	Mat3Ptr,
	Mat4Ptr,
	ImageDataPtr,
} from "./type";
import { Mat3Index, Mat4Index, RotationOrder } from "./type";

export { Mat3Index, Mat4Index, RotationOrder };
export type {
	Ptr,
	Vec2Ptr,
	Vec3Ptr,
	Vec3WithWithAngleAxisPtr,
	Vec4Ptr,
	QuatPtr,
	Mat3Ptr,
	Mat4Ptr,
	ImageDataPtr,
};

// ============================================================================
// 类型定义
// ============================================================================

export type WCNContextPtr = Ptr<number, "WCN_Context">;
export type CStringPtr = Ptr<number, "char*">;
export type VoidPtr = Ptr<number, "void">;

// ============================================================================
// 内存视图
// ============================================================================

let HEAP8: Int8Array;
let HEAP16: Int16Array;
let HEAP32: Int32Array;
let HEAPU8: Uint8Array;
let HEAPU16: Uint16Array;
let HEAPU32: Uint32Array;
let HEAPF32: Float32Array;
let HEAPF64: Float64Array;
let HEAP64: BigInt64Array;
let HEAPU64: BigUint64Array;

let wasmMemory: WebAssembly.Memory;
let _wasmExports: WebAssembly.Exports;
let _wasmTable: WebAssembly.Table;

function updateMemoryViews() {
	const b = wasmMemory.buffer;
	HEAP8 = new Int8Array(b);
	HEAP16 = new Int16Array(b);
	HEAP32 = new Int32Array(b);
	HEAPU8 = new Uint8Array(b);
	HEAPU16 = new Uint16Array(b);
	HEAPU32 = new Uint32Array(b);
	HEAPF32 = new Float32Array(b);
	HEAPF64 = new Float64Array(b);
	HEAP64 = new BigInt64Array(b);
	HEAPU64 = new BigUint64Array(b);
}

// ============================================================================
// UTF8 编解码
// ============================================================================

const UTF8Decoder = new TextDecoder();

function UTF8ArrayToString(heap: Uint8Array, idx: number, maxBytes = Infinity): string {
	let endPtr = idx;
	while (heap[endPtr] && endPtr - idx < maxBytes) ++endPtr;
	if (endPtr - idx > 16) {
		return UTF8Decoder.decode(heap.subarray(idx, endPtr));
	}
	let str = "";
	while (idx < endPtr) {
		let u0 = heap[idx++];
		if (!(u0 & 128)) {
			str += String.fromCharCode(u0);
			continue;
		}
		const u1 = heap[idx++] & 63;
		if ((u0 & 224) === 192) {
			str += String.fromCharCode(((u0 & 31) << 6) | u1);
			continue;
		}
		const u2 = heap[idx++] & 63;
		if ((u0 & 240) === 224) {
			u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
		} else {
			u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
		}
		if (u0 < 65536) {
			str += String.fromCharCode(u0);
		} else {
			const ch = u0 - 65536;
			str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
		}
	}
	return str;
}

export function UTF8ToString(ptr: number, maxBytes?: number): string {
	return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytes) : "";
}

export function lengthBytesUTF8(str: string): number {
	let len = 0;
	for (let i = 0; i < str.length; ++i) {
		let c = str.charCodeAt(i);
		if (c <= 127) len++;
		else if (c <= 2047) len += 2;
		else if (c >= 55296 && c <= 57343) {
			len += 4;
			++i;
		} else len += 3;
	}
	return len;
}

export function stringToUTF8(str: string, outPtr: number, maxBytes: number): number {
	if (maxBytes <= 0) return 0;
	const startIdx = outPtr;
	const endIdx = outPtr + maxBytes - 1;
	for (let i = 0; i < str.length; ++i) {
		let u = str.charCodeAt(i);
		if (u >= 55296 && u <= 57343) {
			u = 65536 + (((u & 1023) << 10) | (str.charCodeAt(++i) & 1023));
		}
		if (u <= 127) {
			if (outPtr >= endIdx) break;
			HEAPU8[outPtr++] = u;
		} else if (u <= 2047) {
			if (outPtr + 1 >= endIdx) break;
			HEAPU8[outPtr++] = 192 | (u >> 6);
			HEAPU8[outPtr++] = 128 | (u & 63);
		} else if (u <= 65535) {
			if (outPtr + 2 >= endIdx) break;
			HEAPU8[outPtr++] = 224 | (u >> 12);
			HEAPU8[outPtr++] = 128 | ((u >> 6) & 63);
			HEAPU8[outPtr++] = 128 | (u & 63);
		} else {
			if (outPtr + 3 >= endIdx) break;
			HEAPU8[outPtr++] = 240 | (u >> 18);
			HEAPU8[outPtr++] = 128 | ((u >> 12) & 63);
			HEAPU8[outPtr++] = 128 | ((u >> 6) & 63);
			HEAPU8[outPtr++] = 128 | (u & 63);
		}
	}
	HEAPU8[outPtr] = 0;
	return outPtr - startIdx;
}

// ============================================================================
// 值读写
// ============================================================================

export function setValue(ptr: number, value: number | bigint, type: string): void {
	switch (type) {
		case "i8":
			HEAP8[ptr] = value as number;
			break;
		case "i16":
			HEAP16[ptr >> 1] = value as number;
			break;
		case "i32":
			HEAP32[ptr >> 2] = value as number;
			break;
		case "i64":
			HEAP64[ptr >> 3] = BigInt(value);
			break;
		case "float":
			HEAPF32[ptr >> 2] = value as number;
			break;
		case "double":
			HEAPF64[ptr >> 3] = value as number;
			break;
		case "*":
			HEAPU32[ptr >> 2] = value as number;
			break;
	}
}

export function getValue(ptr: number, type: string): number | bigint {
	switch (type) {
		case "i8":
			return HEAP8[ptr];
		case "i16":
			return HEAP16[ptr >> 1];
		case "i32":
			return HEAP32[ptr >> 2];
		case "i64":
			return HEAP64[ptr >> 3];
		case "float":
			return HEAPF32[ptr >> 2];
		case "double":
			return HEAPF64[ptr >> 3];
		case "*":
			return HEAPU32[ptr >> 2];
		default:
			return 0;
	}
}

// ============================================================================
// 栈操作
// ============================================================================

let _stackSave: () => number;
let _stackRestore: (val: number) => void;
let stackAlloc: (size: number) => number;

function _stringToUTF8OnStack(str: string): number {
	const size = lengthBytesUTF8(str) + 1;
	const ret = stackAlloc(size);
	stringToUTF8(str, ret, size);
	return ret;
}

// 导出供外部使用
export { _stackSave as stackSave, _stackRestore as stackRestore, _stringToUTF8OnStack as stringToUTF8OnStack };


// ============================================================================
// WebGPU 管理器
// ============================================================================

interface ManagerObject<T> {
	refcount: number;
	object: T;
	queueId?: number;
	onUnmap?: Array<() => void>;
}

class Manager<T> {
	objects: Record<number, ManagerObject<T>> = {};
	nextId = 1;

	create(object: T, extra: Partial<ManagerObject<T>> = {}): number {
		const id = this.nextId++;
		this.objects[id] = { refcount: 1, object, ...extra };
		return id;
	}

	get(id: number): T | undefined {
		return id ? this.objects[id]?.object : undefined;
	}

	reference(id: number): void {
		if (this.objects[id]) this.objects[id].refcount++;
	}

	release(id: number): void {
		const o = this.objects[id];
		if (o && --o.refcount <= 0) delete this.objects[id];
	}
}

const WebGPU = {
	mgrSurface: new Manager<unknown>(),
	mgrSwapChain: new Manager<unknown>(),
	mgrAdapter: new Manager<GPUAdapter>(),
	mgrDevice: new Manager<GPUDevice>(),
	mgrQueue: new Manager<GPUQueue>(),
	mgrCommandBuffer: new Manager<GPUCommandBuffer>(),
	mgrCommandEncoder: new Manager<GPUCommandEncoder>(),
	mgrRenderPassEncoder: new Manager<GPURenderPassEncoder>(),
	mgrComputePassEncoder: new Manager<GPUComputePassEncoder>(),
	mgrBindGroup: new Manager<GPUBindGroup>(),
	mgrBuffer: new Manager<GPUBuffer>(),
	mgrSampler: new Manager<GPUSampler>(),
	mgrTexture: new Manager<GPUTexture>(),
	mgrTextureView: new Manager<GPUTextureView>(),
	mgrQuerySet: new Manager<GPUQuerySet>(),
	mgrBindGroupLayout: new Manager<GPUBindGroupLayout>(),
	mgrPipelineLayout: new Manager<GPUPipelineLayout>(),
	mgrRenderPipeline: new Manager<GPURenderPipeline>(),
	mgrComputePipeline: new Manager<GPUComputePipeline>(),
	mgrShaderModule: new Manager<GPUShaderModule>(),
	mgrRenderBundleEncoder: new Manager<GPURenderBundleEncoder>(),
	mgrRenderBundle: new Manager<GPURenderBundle>(),
	preinitializedDeviceId: undefined as number | undefined,

	TextureFormat: [
		,
		"r8unorm",
		"r8snorm",
		"r8uint",
		"r8sint",
		"r16uint",
		"r16sint",
		"r16float",
		"rg8unorm",
		"rg8snorm",
		"rg8uint",
		"rg8sint",
		"r32float",
		"r32uint",
		"r32sint",
		"rg16uint",
		"rg16sint",
		"rg16float",
		"rgba8unorm",
		"rgba8unorm-srgb",
		"rgba8snorm",
		"rgba8uint",
		"rgba8sint",
		"bgra8unorm",
		"bgra8unorm-srgb",
		"rgb10a2uint",
		"rgb10a2unorm",
		"rg11b10ufloat",
		"rgb9e5ufloat",
		"rg32float",
		"rg32uint",
		"rg32sint",
		"rgba16uint",
		"rgba16sint",
		"rgba16float",
		"rgba32float",
		"rgba32uint",
		"rgba32sint",
		"stencil8",
		"depth16unorm",
		"depth24plus",
		"depth24plus-stencil8",
		"depth32float",
		"depth32float-stencil8",
	] as const,
	TextureDimension: [, "1d", "2d", "3d"] as const,
	TextureViewDimension: [, "1d", "2d", "2d-array", "cube", "cube-array", "3d"] as const,
	TextureAspect: [, "all", "stencil-only", "depth-only"] as const,

	makeExtent3D: (ptr: number) => ({
		width: HEAPU32[ptr >> 2],
		height: HEAPU32[(ptr + 4) >> 2],
		depthOrArrayLayers: HEAPU32[(ptr + 8) >> 2],
	}),
};

// ============================================================================
// 内部上下文（不再使用 window.WCNJS）
// ============================================================================

const WCNJS = {
	canvas: null as HTMLCanvasElement | null,
	ctx: null as CanvasRenderingContext2D | null,
	fonts: {} as Record<number, { name: string; size: number }>,
	nextFontId: 1,
};

// TextureView 管理器
const textureViewMap = new Map<number, GPUTextureView>();
const textureViewFreeList: number[] = [];
let textureViewNextId = 1;

export function storeWGPUTextureView(view: GPUTextureView): number {
	const id = textureViewFreeList.length > 0 ? textureViewFreeList.pop()! : textureViewNextId++;
	textureViewMap.set(id, view);
	return id;
}

export function getWGPUTextureView(id: number): GPUTextureView | null {
	return textureViewMap.get(id) ?? null;
}

function freeWGPUTextureView(id: number): void {
	if (textureViewMap.has(id)) {
		textureViewMap.delete(id);
		textureViewFreeList.push(id);
	}
}

// WASM 调用的初始化函数（保持兼容）
function Init_WCNJS(): void {
	// 已经是模块级变量，无需操作
}

function Init_WGPUTextureView_Map(): void {
	// 已经是模块级变量，无需操作
}

// ============================================================================
// 字体渲染 JS 函数
// ============================================================================

function js_ensure_context(): void {
	if (!WCNJS.ctx) {
		const canvas = document.createElement("canvas");
		canvas.width = 128;
		canvas.height = 128;
		WCNJS.canvas = canvas;
		WCNJS.ctx = canvas.getContext("2d", { willReadFrequently: true })!;
	}
}

function js_load_font(font_name: number, font_size: number, out_id: number): boolean {
	try {
		js_ensure_context();
		const nameStr = UTF8ToString(font_name);
		const id = WCNJS.nextFontId++;
		WCNJS.fonts[id] = { name: nameStr, size: font_size };
		setValue(out_id, id, "i32");
		return true;
	} catch {
		return false;
	}
}

function js_get_glyph_metrics(
	font_id: number,
	codepoint: number,
	out_advance: number,
	out_lsb: number,
	out_box: number,
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
	} catch {
		return false;
	}
}


function js_generate_bitmap(
	font_id: number,
	codepoint: number,
	size: number,
	out_ptr: number,
	out_w: number,
	out_h: number,
	out_off_x: number,
	out_off_y: number,
	out_adv: number,
	out_is_color_ptr: number,
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
		const scanH = Math.min(
			canvas.height,
			Math.ceil(drawY + (metrics.actualBoundingBoxDescent || size * 0.3) + padding),
		);

		const imgData = ctx.getImageData(0, 0, scanW, scanH);
		const data = imgData.data;

		let minX = scanW,
			maxX = 0,
			minY = scanH,
			maxY = 0;
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
						const r = data[idx],
							g = data[idx + 1],
							b = data[idx + 2];
						if (Math.abs(r - g) > 2 || Math.abs(g - b) > 2) isColor = true;
					}
				}
			}
		}

		if (!hasPixels) {
			minX = drawX;
			maxX = drawX;
			minY = drawY;
			maxY = drawY;
		} else {
			minX = Math.max(0, minX - 1);
			maxX = Math.min(scanW - 1, maxX + 1);
			minY = Math.max(0, minY - 1);
			maxY = Math.min(scanH - 1, maxY + 1);
		}

		const w = maxX - minX + 1;
		const h = maxY - minY + 1;
		const bufSize = w * h * 4;
		const ptr = _malloc(bufSize);
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
	} catch {
		return false;
	}
}

// ============================================================================
// WebGPU 辅助函数
// ============================================================================

function wasm_create_render_pipeline(
	device: number,
	layout: number,
	shader: number,
	vs_entry: number,
	fs_entry: number,
	instance_stride: number,
	format_str: number,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	const pipelineLayout = WebGPU.mgrPipelineLayout.get(layout);
	const shaderModule = WebGPU.mgrShaderModule.get(shader);
	if (!dev || !pipelineLayout || !shaderModule) return 0;

	const vsEntry = UTF8ToString(vs_entry);
	const fsEntry = UTF8ToString(fs_entry);
	const formatString = UTF8ToString(format_str) as GPUTextureFormat;

	const vertexBufferLayout: GPUVertexBufferLayout = {
		arrayStride: instance_stride,
		stepMode: "vertex",
		attributes: [
			{ shaderLocation: 0, format: "float32x4", offset: 0 },
			{ shaderLocation: 1, format: "float32x4", offset: 16 },
			{ shaderLocation: 2, format: "float32x2", offset: 32 },
			{ shaderLocation: 3, format: "uint32", offset: 40 },
			{ shaderLocation: 4, format: "uint32", offset: 44 },
			{ shaderLocation: 5, format: "float32x2", offset: 48 },
			{ shaderLocation: 6, format: "float32", offset: 56 },
			{ shaderLocation: 7, format: "float32x2", offset: 64 },
			{ shaderLocation: 8, format: "float32x2", offset: 72 },
			{ shaderLocation: 9, format: "float32x2", offset: 80 },
			{ shaderLocation: 10, format: "float32x2", offset: 88 },
		],
	};

	try {
		const pipeline = dev.createRenderPipeline({
			label: "Unified Renderer Pipeline",
			layout: pipelineLayout,
			vertex: { module: shaderModule, entryPoint: vsEntry, buffers: [vertexBufferLayout] },
			primitive: { topology: "triangle-list", frontFace: "ccw", cullMode: "none" },
			multisample: { count: 1 },
			fragment: {
				module: shaderModule,
				entryPoint: fsEntry,
				targets: [
					{
						format: formatString,
						blend: {
							color: {
								srcFactor: "src-alpha",
								dstFactor: "one-minus-src-alpha",
								operation: "add",
							},
							alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
						},
						writeMask: 0xf,
					},
				],
			},
		});
		return WebGPU.mgrRenderPipeline.create(pipeline);
	} catch {
		return 0;
	}
}

function wasm_create_compute_pipeline(
	device: number,
	layout: number,
	shader: number,
	entry: number,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	const pipelineLayout = WebGPU.mgrPipelineLayout.get(layout);
	const shaderModule = WebGPU.mgrShaderModule.get(shader);
	if (!dev || !pipelineLayout || !shaderModule) return 0;

	try {
		const pipeline = dev.createComputePipeline({
			label: "Instance Expander Pipeline",
			layout: pipelineLayout,
			compute: { module: shaderModule, entryPoint: UTF8ToString(entry) },
		});
		return WebGPU.mgrComputePipeline.create(pipeline);
	} catch {
		return 0;
	}
}

function wasm_create_bind_group(
	device: number,
	layout: number,
	instance_buffer: number,
	instance_buffer_size: bigint,
	uniform_buffer: number,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	const bindGroupLayout = WebGPU.mgrBindGroupLayout.get(layout);
	const instBuffer = WebGPU.mgrBuffer.get(instance_buffer);
	const unifBuffer = WebGPU.mgrBuffer.get(uniform_buffer);
	if (!dev || !bindGroupLayout || !instBuffer || !unifBuffer) return 0;

	try {
		const bindGroup = dev.createBindGroup({
			label: "Unified Renderer Bind Group",
			layout: bindGroupLayout,
			entries: [
				{ binding: 0, resource: { buffer: instBuffer, offset: 0, size: Number(instance_buffer_size) } },
				{ binding: 1, resource: { buffer: unifBuffer, offset: 0, size: 16 } },
			],
		});
		return WebGPU.mgrBindGroup.create(bindGroup);
	} catch {
		return 0;
	}
}


function wasm_create_compute_bind_group(
	device: number,
	layout: number,
	instance_buffer: number,
	instance_buffer_size: bigint,
	vertex_buffer: number,
	vertex_buffer_size: bigint,
	uniform_buffer: number,
	uniform_buffer_size: bigint,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	const bindGroupLayout = WebGPU.mgrBindGroupLayout.get(layout);
	const instanceBuffer = WebGPU.mgrBuffer.get(instance_buffer);
	const vertexBuffer = WebGPU.mgrBuffer.get(vertex_buffer);
	const uniformBuffer = WebGPU.mgrBuffer.get(uniform_buffer);
	if (!dev || !bindGroupLayout || !instanceBuffer || !vertexBuffer || !uniformBuffer) return 0;

	try {
		const bindGroup = dev.createBindGroup({
			label: "Instance Expander Compute Bind Group",
			layout: bindGroupLayout,
			entries: [
				{ binding: 0, resource: { buffer: instanceBuffer, size: Number(instance_buffer_size) } },
				{ binding: 1, resource: { buffer: vertexBuffer, size: Number(vertex_buffer_size) } },
				{ binding: 2, resource: { buffer: uniformBuffer, size: Number(uniform_buffer_size) } },
			],
		});
		return WebGPU.mgrBindGroup.create(bindGroup);
	} catch {
		return 0;
	}
}

function wasm_create_buffer(
	device: number,
	label: number,
	size: bigint,
	usage_flags: number,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	let usage = 0;
	if (usage_flags & 1) usage |= GPUBufferUsage.STORAGE;
	if (usage_flags & 2) usage |= GPUBufferUsage.UNIFORM;
	if (usage_flags & 4) usage |= GPUBufferUsage.COPY_DST;
	if (usage_flags & 8) usage |= GPUBufferUsage.VERTEX;

	try {
		const buffer = dev.createBuffer({
			label: UTF8ToString(label),
			size: Number(size),
			usage,
			mappedAtCreation: false,
		});
		return WebGPU.mgrBuffer.create(buffer);
	} catch {
		return 0;
	}
}

function wasm_create_bind_group_layout(
	device: number,
	label: number,
	min_binding_size_0: bigint,
	min_binding_size_1: bigint,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const layout = dev.createBindGroupLayout({
			label: UTF8ToString(label),
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
					buffer: { type: "read-only-storage", minBindingSize: Number(min_binding_size_0) },
				},
				{
					binding: 1,
					visibility: GPUShaderStage.VERTEX,
					buffer: { type: "uniform", minBindingSize: Number(min_binding_size_1) },
				},
			],
		});
		return WebGPU.mgrBindGroupLayout.create(layout);
	} catch {
		return 0;
	}
}

function wasm_create_compute_bind_group_layout(
	device: number,
	label: number,
	min_binding_size_0: bigint,
	min_binding_size_1: bigint,
	min_binding_size_2: bigint,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const layout = dev.createBindGroupLayout({
			label: UTF8ToString(label),
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage", minBindingSize: Number(min_binding_size_0) },
				},
				{
					binding: 1,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage", minBindingSize: Number(min_binding_size_1) },
				},
				{
					binding: 2,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "uniform", minBindingSize: Number(min_binding_size_2) },
				},
			],
		});
		return WebGPU.mgrBindGroupLayout.create(layout);
	} catch {
		return 0;
	}
}

function wasm_create_shader_module(device: number, wgsl_code: number, label: number): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const module = dev.createShaderModule({
			label: label ? UTF8ToString(label) : "Shader Module",
			code: UTF8ToString(wgsl_code),
		});
		return WebGPU.mgrShaderModule.create(module);
	} catch {
		return 0;
	}
}

function wasm_create_sdf_bind_group_layout(device: number, label: number): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const layout = dev.createBindGroupLayout({
			label: UTF8ToString(label),
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.FRAGMENT,
					texture: { sampleType: "float", viewDimension: "2d" },
				},
				{ binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
				{
					binding: 2,
					visibility: GPUShaderStage.FRAGMENT,
					texture: { sampleType: "float", viewDimension: "2d" },
				},
				{ binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
			],
		});
		return WebGPU.mgrBindGroupLayout.create(layout);
	} catch {
		return 0;
	}
}

function wasm_create_pipeline_layout(
	device: number,
	label: number,
	layout0: number,
	layout1: number,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	const bindGroupLayout0 = WebGPU.mgrBindGroupLayout.get(layout0);
	const bindGroupLayout1 = WebGPU.mgrBindGroupLayout.get(layout1);
	if (!dev || !bindGroupLayout0) return 0;

	try {
		const layout = dev.createPipelineLayout({
			label: UTF8ToString(label),
			bindGroupLayouts: [bindGroupLayout0, bindGroupLayout1!],
		});
		return WebGPU.mgrPipelineLayout.create(layout);
	} catch {
		return 0;
	}
}

function wasm_create_single_bind_group_pipeline_layout(
	device: number,
	label: number,
	layout: number,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	const bindGroupLayout = WebGPU.mgrBindGroupLayout.get(layout);
	if (!dev || !bindGroupLayout) return 0;

	try {
		const pipelineLayout = dev.createPipelineLayout({
			label: UTF8ToString(label),
			bindGroupLayouts: [bindGroupLayout],
		});
		return WebGPU.mgrPipelineLayout.create(pipelineLayout);
	} catch {
		return 0;
	}
}

function wasm_create_sampler(device: number, label: number): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const sampler = dev.createSampler({
			label: label ? UTF8ToString(label) : "Sampler",
			addressModeU: "clamp-to-edge",
			addressModeV: "clamp-to-edge",
			addressModeW: "clamp-to-edge",
			magFilter: "linear",
			minFilter: "linear",
			mipmapFilter: "linear",
		});
		return WebGPU.mgrSampler.create(sampler);
	} catch {
		return 0;
	}
}

function wasm_begin_render_pass(
	encoder: number,
	view_id: number,
	is_first_pass: number,
): number {
	const commandEncoder = WebGPU.mgrCommandEncoder.get(encoder);
	const textureView = getWGPUTextureView(view_id);
	if (!commandEncoder || !textureView) return 0;

	try {
		const renderPass = commandEncoder.beginRenderPass({
			label: "WCN Render Pass",
			colorAttachments: [
				{
					view: textureView,
					loadOp: is_first_pass ? "clear" : "load",
					storeOp: "store",
					clearValue: { r: 0.9, g: 0.9, b: 0.9, a: 1 },
				},
			],
		});
		return WebGPU.mgrRenderPassEncoder.create(renderPass);
	} catch {
		return 0;
	}
}

function wasm_create_sdf_bind_group(
	device: number,
	layout: number,
	sdf_texture_view: number,
	sdf_sampler: number,
	image_texture_view: number,
	image_sampler: number,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	const bindGroupLayout = WebGPU.mgrBindGroupLayout.get(layout);
	const sdfView = WebGPU.mgrTextureView.get(sdf_texture_view);
	const sdfSamplerObj = WebGPU.mgrSampler.get(sdf_sampler);
	const imageView = WebGPU.mgrTextureView.get(image_texture_view);
	const imageSamplerObj = WebGPU.mgrSampler.get(image_sampler);
	if (!dev || !bindGroupLayout || !sdfView || !sdfSamplerObj || !imageView || !imageSamplerObj)
		return 0;

	try {
		const bindGroup = dev.createBindGroup({
			label: "SDF Bind Group",
			layout: bindGroupLayout,
			entries: [
				{ binding: 0, resource: sdfView },
				{ binding: 1, resource: sdfSamplerObj },
				{ binding: 2, resource: imageView },
				{ binding: 3, resource: imageSamplerObj },
			],
		});
		return WebGPU.mgrBindGroup.create(bindGroup);
	} catch {
		return 0;
	}
}

function wasm_queue_write_texture(
	queue: number,
	texture: number,
	x: number,
	y: number,
	width: number,
	height: number,
	data: number,
	data_size: number,
): void {
	const queueObj = WebGPU.mgrQueue.get(queue);
	const textureObj = WebGPU.mgrTexture.get(texture);
	if (!queueObj || !textureObj) return;

	const sourceData = HEAPU8.slice(data, data + data_size);
	queueObj.writeTexture(
		{ texture: textureObj, origin: { x, y, z: 0 } },
		sourceData,
		{ bytesPerRow: width * 4, rowsPerImage: height },
		{ width, height, depthOrArrayLayers: 1 },
	);
}


// ============================================================================
// WGPU 绑定函数
// ============================================================================

const _wgpuBindGroupLayoutRelease = (id: number) => WebGPU.mgrBindGroupLayout.release(id);
const _wgpuBindGroupRelease = (id: number) => WebGPU.mgrBindGroup.release(id);
const _wgpuBufferDestroy = (bufferId: number) => {
	const wrapper = WebGPU.mgrBuffer.objects[bufferId];
	if (wrapper?.onUnmap) {
		wrapper.onUnmap.forEach((fn) => fn());
		wrapper.onUnmap = undefined;
	}
	WebGPU.mgrBuffer.get(bufferId)?.destroy();
};
const _wgpuBufferRelease = (id: number) => WebGPU.mgrBuffer.release(id);
const _wgpuCommandBufferRelease = (id: number) => WebGPU.mgrCommandBuffer.release(id);

const _wgpuCommandEncoderBeginComputePass = (encoderId: number, descriptor: number): number => {
	const commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
	if (!commandEncoder) return 0;
	let desc: GPUComputePassDescriptor | undefined;
	if (descriptor) {
		const labelPtr = HEAPU32[(descriptor + 4) >> 2];
		desc = { label: labelPtr ? UTF8ToString(labelPtr) : undefined };
	}
	return WebGPU.mgrComputePassEncoder.create(commandEncoder.beginComputePass(desc));
};

const _wgpuCommandEncoderFinish = (encoderId: number): number => {
	const commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
	if (!commandEncoder) return 0;
	return WebGPU.mgrCommandBuffer.create(commandEncoder.finish());
};

const _wgpuCommandEncoderRelease = (id: number) => WebGPU.mgrCommandEncoder.release(id);

const _wgpuComputePassEncoderDispatchWorkgroups = (
	passId: number,
	x: number,
	y: number,
	z: number,
) => {
	WebGPU.mgrComputePassEncoder.get(passId)?.dispatchWorkgroups(x, y, z);
};

const _wgpuComputePassEncoderEnd = (passId: number) => {
	WebGPU.mgrComputePassEncoder.get(passId)?.end();
};

const _wgpuComputePassEncoderSetBindGroup = (
	passId: number,
	groupIndex: number,
	groupId: number,
	dynamicOffsetCount: number,
	dynamicOffsetsPtr: number,
) => {
	const pass = WebGPU.mgrComputePassEncoder.get(passId);
	const group = WebGPU.mgrBindGroup.get(groupId);
	if (!pass || !group) return;
	if (dynamicOffsetCount === 0) {
		pass.setBindGroup(groupIndex, group);
	} else {
		const offsets: number[] = [];
		for (let i = 0; i < dynamicOffsetCount; i++) {
			offsets.push(HEAPU32[(dynamicOffsetsPtr + i * 4) >> 2]);
		}
		pass.setBindGroup(groupIndex, group, offsets);
	}
};

const _wgpuComputePassEncoderSetPipeline = (passId: number, pipelineId: number) => {
	const pass = WebGPU.mgrComputePassEncoder.get(passId);
	const pipeline = WebGPU.mgrComputePipeline.get(pipelineId);
	if (pass && pipeline) pass.setPipeline(pipeline);
};

const _wgpuComputePipelineRelease = (id: number) => WebGPU.mgrComputePipeline.release(id);

const _wgpuDeviceCreateCommandEncoder = (deviceId: number, descriptor: number): number => {
	const device = WebGPU.mgrDevice.get(deviceId);
	if (!device) return 0;
	let desc: GPUCommandEncoderDescriptor | undefined;
	if (descriptor) {
		const labelPtr = HEAPU32[(descriptor + 4) >> 2];
		desc = { label: labelPtr ? UTF8ToString(labelPtr) : undefined };
	}
	return WebGPU.mgrCommandEncoder.create(device.createCommandEncoder(desc));
};

const _wgpuDeviceCreateTexture = (deviceId: number, descriptor: number): number => {
	const device = WebGPU.mgrDevice.get(deviceId);
	if (!device || !descriptor) return 0;

	const labelPtr = HEAPU32[(descriptor + 4) >> 2];
	const viewFormatCount = HEAPU32[(descriptor + 40) >> 2];
	let viewFormats: GPUTextureFormat[] | undefined;
	if (viewFormatCount) {
		const viewFormatsPtr = HEAPU32[(descriptor + 44) >> 2];
		viewFormats = [];
		for (let i = 0; i < viewFormatCount; i++) {
			const fmt = HEAP32[(viewFormatsPtr + i * 4) >> 2];
			viewFormats.push(WebGPU.TextureFormat[fmt] as GPUTextureFormat);
		}
	}

	const desc: GPUTextureDescriptor = {
		label: labelPtr ? UTF8ToString(labelPtr) : undefined,
		size: WebGPU.makeExtent3D(descriptor + 16),
		mipLevelCount: HEAPU32[(descriptor + 32) >> 2],
		sampleCount: HEAPU32[(descriptor + 36) >> 2],
		dimension: WebGPU.TextureDimension[HEAPU32[(descriptor + 12) >> 2]] as GPUTextureDimension,
		format: WebGPU.TextureFormat[HEAPU32[(descriptor + 28) >> 2]] as GPUTextureFormat,
		usage: HEAPU32[(descriptor + 8) >> 2],
		viewFormats,
	};

	return WebGPU.mgrTexture.create(device.createTexture(desc));
};

const _wgpuDeviceGetQueue = (deviceId: number): number => {
	const queueId = WebGPU.mgrDevice.objects[deviceId]?.queueId;
	if (queueId) WebGPU.mgrQueue.reference(queueId);
	return queueId ?? 0;
};

const _wgpuDeviceRelease = (id: number) => WebGPU.mgrDevice.release(id);
const _wgpuPipelineLayoutRelease = (id: number) => WebGPU.mgrPipelineLayout.release(id);
const _wgpuQueueRelease = (id: number) => WebGPU.mgrQueue.release(id);

const _wgpuQueueSubmit = (queueId: number, commandCount: number, commands: number) => {
	const queue = WebGPU.mgrQueue.get(queueId);
	if (!queue) return;
	const cmds: GPUCommandBuffer[] = [];
	for (let i = 0; i < commandCount; i++) {
		const id = HEAP32[(commands + i * 4) >> 2];
		const cmd = WebGPU.mgrCommandBuffer.get(id);
		if (cmd) cmds.push(cmd);
	}
	queue.submit(cmds);
};

const _wgpuQueueWriteBuffer = (
	queueId: number,
	bufferId: number,
	bufferOffset: bigint,
	data: number,
	size: number,
) => {
	const queue = WebGPU.mgrQueue.get(queueId);
	const buffer = WebGPU.mgrBuffer.get(bufferId);
	if (!queue || !buffer) return;
	queue.writeBuffer(buffer, Number(bufferOffset), HEAPU8.slice(data, data + size), 0, size);
};

const _wgpuRenderPassEncoderDraw = (
	passId: number,
	vertexCount: number,
	instanceCount: number,
	firstVertex: number,
	firstInstance: number,
) => {
	WebGPU.mgrRenderPassEncoder.get(passId)?.draw(vertexCount, instanceCount, firstVertex, firstInstance);
};

const _wgpuRenderPassEncoderEnd = (encoderId: number) => {
	WebGPU.mgrRenderPassEncoder.get(encoderId)?.end();
};

const _wgpuRenderPassEncoderRelease = (id: number) => WebGPU.mgrRenderPassEncoder.release(id);

const _wgpuRenderPassEncoderSetBindGroup = (
	passId: number,
	groupIndex: number,
	groupId: number,
	dynamicOffsetCount: number,
	dynamicOffsetsPtr: number,
) => {
	const pass = WebGPU.mgrRenderPassEncoder.get(passId);
	const group = WebGPU.mgrBindGroup.get(groupId);
	if (!pass || !group) return;
	if (dynamicOffsetCount === 0) {
		pass.setBindGroup(groupIndex, group);
	} else {
		const offsets: number[] = [];
		for (let i = 0; i < dynamicOffsetCount; i++) {
			offsets.push(HEAPU32[(dynamicOffsetsPtr + i * 4) >> 2]);
		}
		pass.setBindGroup(groupIndex, group, offsets);
	}
};

const _wgpuRenderPassEncoderSetPipeline = (passId: number, pipelineId: number) => {
	const pass = WebGPU.mgrRenderPassEncoder.get(passId);
	const pipeline = WebGPU.mgrRenderPipeline.get(pipelineId);
	if (pass && pipeline) pass.setPipeline(pipeline);
};

const _wgpuRenderPassEncoderSetVertexBuffer = (
	passId: number,
	slot: number,
	bufferId: number,
	offset: bigint,
	size: bigint,
) => {
	const pass = WebGPU.mgrRenderPassEncoder.get(passId);
	const buffer = WebGPU.mgrBuffer.get(bufferId);
	if (!pass || !buffer) return;
	const sizeNum = Number(size);
	pass.setVertexBuffer(slot, buffer, Number(offset), sizeNum === -1 ? undefined : sizeNum);
};

const _wgpuRenderPipelineRelease = (id: number) => WebGPU.mgrRenderPipeline.release(id);
const _wgpuSamplerRelease = (id: number) => WebGPU.mgrSampler.release(id);
const _wgpuShaderModuleRelease = (id: number) => WebGPU.mgrShaderModule.release(id);
const _wgpuSurfaceRelease = (id: number) => WebGPU.mgrSurface.release(id);

const _wgpuTextureCreateView = (textureId: number, descriptor: number): number => {
	const texture = WebGPU.mgrTexture.get(textureId);
	if (!texture) return 0;

	let desc: GPUTextureViewDescriptor | undefined;
	if (descriptor) {
		const labelPtr = HEAPU32[(descriptor + 4) >> 2];
		const mipLevelCount = HEAPU32[(descriptor + 20) >> 2];
		const arrayLayerCount = HEAPU32[(descriptor + 28) >> 2];
		desc = {
			label: labelPtr ? UTF8ToString(labelPtr) : undefined,
			format: WebGPU.TextureFormat[HEAPU32[(descriptor + 8) >> 2]] as GPUTextureFormat,
			dimension: WebGPU.TextureViewDimension[
				HEAPU32[(descriptor + 12) >> 2]
			] as GPUTextureViewDimension,
			baseMipLevel: HEAPU32[(descriptor + 16) >> 2],
			mipLevelCount: mipLevelCount === 0xffffffff ? undefined : mipLevelCount,
			baseArrayLayer: HEAPU32[(descriptor + 24) >> 2],
			arrayLayerCount: arrayLayerCount === 0xffffffff ? undefined : arrayLayerCount,
			aspect: WebGPU.TextureAspect[HEAPU32[(descriptor + 32) >> 2]] as GPUTextureAspect,
		};
	}

	return WebGPU.mgrTextureView.create(texture.createView(desc));
};

const _wgpuTextureRelease = (id: number) => WebGPU.mgrTexture.release(id);
const _wgpuTextureViewRelease = (id: number) => WebGPU.mgrTextureView.release(id);

const _emscripten_webgpu_get_device = (): number => {
	if (WebGPU.preinitializedDeviceId === undefined) {
		const device = (globalThis as unknown as { preinitializedWebGPUDevice: GPUDevice })
			.preinitializedWebGPUDevice;
		if (!device) return 0;
		const queueId = WebGPU.mgrQueue.create(device.queue);
		WebGPU.preinitializedDeviceId = WebGPU.mgrDevice.create(device, { queueId });
	}
	WebGPU.mgrDevice.reference(WebGPU.preinitializedDeviceId);
	return WebGPU.preinitializedDeviceId;
};

// ============================================================================
// 系统调用存根
// ============================================================================

const printCharBuffers: [null, number[], number[]] = [null, [], []];
const printChar = (stream: number, curr: number) => {
	const buffer = printCharBuffers[stream]!;
	if (curr === 0 || curr === 10) {
		const str = UTF8ArrayToString(new Uint8Array(buffer), 0);
		(stream === 1 ? console.log : console.error)(str);
		buffer.length = 0;
	} else {
		buffer.push(curr);
	}
};

const _fd_close = () => 0;
const _fd_seek = () => 70;
const _fd_write = (fd: number, iov: number, iovcnt: number, pnum: number): number => {
	let num = 0;
	for (let i = 0; i < iovcnt; i++) {
		const ptr = HEAPU32[iov >> 2];
		const len = HEAPU32[(iov + 4) >> 2];
		iov += 8;
		for (let j = 0; j < len; j++) {
			printChar(fd, HEAPU8[ptr + j]);
		}
		num += len;
	}
	HEAPU32[pnum >> 2] = num;
	return 0;
};

const __abort_js = () => {
	throw new Error("abort");
};

const _emscripten_resize_heap = (requestedSize: number): boolean => {
	const oldSize = HEAPU8.length;
	if (requestedSize <= oldSize) return true;
	const maxHeapSize = 2147483648;
	if (requestedSize > maxHeapSize) return false;
	for (let cutDown = 1; cutDown <= 4; cutDown *= 2) {
		let overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
		overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
		const newSize = Math.min(
			maxHeapSize,
			Math.ceil(Math.max(requestedSize, overGrownHeapSize) / 65536) * 65536,
		);
		try {
			wasmMemory.grow((newSize - oldSize) / 65536);
			updateMemoryViews();
			return true;
		} catch {
			/* continue */
		}
	}
	return false;
};

const segfault = () => {
	throw new Error("segmentation fault");
};
const alignfault = () => {
	throw new Error("alignment fault");
};


// ============================================================================
// WASM 导入表
// ============================================================================

const wasmImports = {
	Init_WCNJS,
	Init_WGPUTextureView_Map,
	_abort_js: __abort_js,
	alignfault,
	emscripten_resize_heap: _emscripten_resize_heap,
	emscripten_webgpu_get_device: _emscripten_webgpu_get_device,
	fd_close: _fd_close,
	fd_seek: _fd_seek,
	fd_write: _fd_write,
	freeWGPUTextureView,
	js_generate_bitmap,
	js_get_glyph_metrics,
	js_load_font,
	segfault,
	wasm_begin_render_pass,
	wasm_create_bind_group,
	wasm_create_bind_group_layout,
	wasm_create_buffer,
	wasm_create_compute_bind_group,
	wasm_create_compute_bind_group_layout,
	wasm_create_compute_pipeline,
	wasm_create_pipeline_layout,
	wasm_create_render_pipeline,
	wasm_create_sampler,
	wasm_create_sdf_bind_group,
	wasm_create_sdf_bind_group_layout,
	wasm_create_shader_module,
	wasm_create_single_bind_group_pipeline_layout,
	wasm_queue_write_texture,
	wgpuBindGroupLayoutRelease: _wgpuBindGroupLayoutRelease,
	wgpuBindGroupRelease: _wgpuBindGroupRelease,
	wgpuBufferDestroy: _wgpuBufferDestroy,
	wgpuBufferRelease: _wgpuBufferRelease,
	wgpuCommandBufferRelease: _wgpuCommandBufferRelease,
	wgpuCommandEncoderBeginComputePass: _wgpuCommandEncoderBeginComputePass,
	wgpuCommandEncoderFinish: _wgpuCommandEncoderFinish,
	wgpuCommandEncoderRelease: _wgpuCommandEncoderRelease,
	wgpuComputePassEncoderDispatchWorkgroups: _wgpuComputePassEncoderDispatchWorkgroups,
	wgpuComputePassEncoderEnd: _wgpuComputePassEncoderEnd,
	wgpuComputePassEncoderSetBindGroup: _wgpuComputePassEncoderSetBindGroup,
	wgpuComputePassEncoderSetPipeline: _wgpuComputePassEncoderSetPipeline,
	wgpuComputePipelineRelease: _wgpuComputePipelineRelease,
	wgpuDeviceCreateCommandEncoder: _wgpuDeviceCreateCommandEncoder,
	wgpuDeviceCreateTexture: _wgpuDeviceCreateTexture,
	wgpuDeviceGetQueue: _wgpuDeviceGetQueue,
	wgpuDeviceRelease: _wgpuDeviceRelease,
	wgpuPipelineLayoutRelease: _wgpuPipelineLayoutRelease,
	wgpuQueueRelease: _wgpuQueueRelease,
	wgpuQueueSubmit: _wgpuQueueSubmit,
	wgpuQueueWriteBuffer: _wgpuQueueWriteBuffer,
	wgpuRenderPassEncoderDraw: _wgpuRenderPassEncoderDraw,
	wgpuRenderPassEncoderEnd: _wgpuRenderPassEncoderEnd,
	wgpuRenderPassEncoderRelease: _wgpuRenderPassEncoderRelease,
	wgpuRenderPassEncoderSetBindGroup: _wgpuRenderPassEncoderSetBindGroup,
	wgpuRenderPassEncoderSetPipeline: _wgpuRenderPassEncoderSetPipeline,
	wgpuRenderPassEncoderSetVertexBuffer: _wgpuRenderPassEncoderSetVertexBuffer,
	wgpuRenderPipelineRelease: _wgpuRenderPipelineRelease,
	wgpuSamplerRelease: _wgpuSamplerRelease,
	wgpuShaderModuleRelease: _wgpuShaderModuleRelease,
	wgpuSurfaceRelease: _wgpuSurfaceRelease,
	wgpuTextureCreateView: _wgpuTextureCreateView,
	wgpuTextureRelease: _wgpuTextureRelease,
	wgpuTextureViewRelease: _wgpuTextureViewRelease,
};

// ============================================================================
// 导出函数类型
// ============================================================================

// 内存管理
export let _malloc: (size: number) => VoidPtr;
export let _free: (ptr: VoidPtr) => void;

// WCN 核心 API
export let _wcn_init_js: () => void;
export let _wcn_wasm_create_gpu_resources_auto: () => number;
export let _wcn_create_context: (gpuResources: number) => WCNContextPtr;
export let _wcn_destroy_context: (ctx: WCNContextPtr) => void;
export let _wcn_begin_frame: (
	ctx: WCNContextPtr,
	width: number,
	height: number,
	format: number,
) => void;
export let _wcn_end_frame: (ctx: WCNContextPtr) => void;
export let _wcn_begin_render_pass: (ctx: WCNContextPtr, textureView: number) => number;
export let _wcn_end_render_pass: (ctx: WCNContextPtr) => void;
export let _wcn_submit_commands: (ctx: WCNContextPtr) => void;
export let _wcn_save: (ctx: WCNContextPtr) => void;
export let _wcn_restore: (ctx: WCNContextPtr) => void;

// 绘图 API
export let _wcn_clear_rect: (
	ctx: WCNContextPtr,
	x: number,
	y: number,
	w: number,
	h: number,
) => void;
export let _wcn_fill_rect: (
	ctx: WCNContextPtr,
	x: number,
	y: number,
	w: number,
	h: number,
) => void;
export let _wcn_stroke_rect: (
	ctx: WCNContextPtr,
	x: number,
	y: number,
	w: number,
	h: number,
) => void;

// 路径 API
export let _wcn_begin_path: (ctx: WCNContextPtr) => void;
export let _wcn_close_path: (ctx: WCNContextPtr) => void;
export let _wcn_move_to: (ctx: WCNContextPtr, x: number, y: number) => void;
export let _wcn_line_to: (ctx: WCNContextPtr, x: number, y: number) => void;
export let _wcn_arc: (
	ctx: WCNContextPtr,
	x: number,
	y: number,
	radius: number,
	startAngle: number,
	endAngle: number,
	counterclockwise: number,
) => void;
export let _wcn_rect: (ctx: WCNContextPtr, x: number, y: number, w: number, h: number) => void;
export let _wcn_fill: (ctx: WCNContextPtr) => void;
export let _wcn_stroke: (ctx: WCNContextPtr) => void;

// 样式 API
export let _wcn_set_fill_style: (ctx: WCNContextPtr, color: number) => void;
export let _wcn_set_stroke_style: (ctx: WCNContextPtr, color: number) => void;
export let _wcn_set_line_width: (ctx: WCNContextPtr, width: number) => void;
export let _wcn_set_line_cap: (ctx: WCNContextPtr, cap: number) => void;
export let _wcn_set_line_join: (ctx: WCNContextPtr, join: number) => void;
export let _wcn_set_miter_limit: (ctx: WCNContextPtr, limit: number) => void;
export let _wcn_set_global_alpha: (ctx: WCNContextPtr, alpha: number) => void;
export let _wcn_set_global_composite_operation: (ctx: WCNContextPtr, op: number) => void;

// 变换 API
export let _wcn_translate: (ctx: WCNContextPtr, x: number, y: number) => void;
export let _wcn_rotate: (ctx: WCNContextPtr, angle: number) => void;
export let _wcn_scale: (ctx: WCNContextPtr, x: number, y: number) => void;
export let _wcn_transform: (
	ctx: WCNContextPtr,
	a: number,
	b: number,
	c: number,
	d: number,
	e: number,
	f: number,
) => void;
export let _wcn_set_transform: (
	ctx: WCNContextPtr,
	a: number,
	b: number,
	c: number,
	d: number,
	e: number,
	f: number,
) => void;
export let _wcn_reset_transform: (ctx: WCNContextPtr) => void;

// 文本 API
export let _wcn_fill_text: (ctx: WCNContextPtr, text: CStringPtr, x: number, y: number) => void;
export let _wcn_stroke_text: (ctx: WCNContextPtr, text: CStringPtr, x: number, y: number) => void;
export let _wcn_measure_text: (ctx: WCNContextPtr, text: CStringPtr, outWidth: VoidPtr) => void;
export let _wcn_set_font: (ctx: WCNContextPtr, font: CStringPtr) => void;
export let _wcn_set_font_face: (ctx: WCNContextPtr, fontFace: number, size: number) => void;
export let _wcn_set_text_align: (ctx: WCNContextPtr, align: number) => void;
export let _wcn_set_text_baseline: (ctx: WCNContextPtr, baseline: number) => void;
export let _wcn_wasm_load_font: (
	fontName: CStringPtr,
	size: number,
	fontFaceOut: VoidPtr,
) => number;
export let _wcn_add_font_fallback: (ctx: WCNContextPtr, fontFace: number) => void;
export let _wcn_clear_font_fallbacks: (ctx: WCNContextPtr) => void;

// 图像 API
export let _wcn_draw_image: (ctx: WCNContextPtr, imageData: ImageDataPtr, x: number, y: number) => void;
export let _wcn_draw_image_scaled: (
	ctx: WCNContextPtr,
	imageData: ImageDataPtr,
	x: number,
	y: number,
	w: number,
	h: number,
) => void;
export let _wcn_draw_image_source: (
	ctx: WCNContextPtr,
	imageData: ImageDataPtr,
	sx: number,
	sy: number,
	sw: number,
	sh: number,
	dx: number,
	dy: number,
	dw: number,
	dh: number,
) => void;
export let _wcn_decode_image: (ctx: WCNContextPtr, data: VoidPtr, size: number) => ImageDataPtr;
export let _wcn_destroy_image_data: (imageData: ImageDataPtr) => void;

// 解码器
export let _wcn_register_font_decoder: (ctx: WCNContextPtr, decoder: number) => void;
export let _wcn_register_image_decoder: (ctx: WCNContextPtr, decoder: number) => void;
export let _wcn_wasm_get_font_decoder: () => number;
export let _wcn_wasm_create_default_font_face: () => number;
export let _wcn_wasm_get_image_decoder: () => number;

// Surface
export let _wcn_get_surface_format: (ctx: WCNContextPtr) => number;
export let _wcn_set_surface_format: (ctx: WCNContextPtr, format: number) => void;


// Math API
export let _wcn_math_set_epsilon: (epsilon: number) => void;
export let _wcn_math_get_epsilon: () => number;
export let _wcn_math_Vec2_create_wasm: (out: Vec2Ptr, x: number, y: number) => void;
export let _wcn_math_Vec3_create_wasm: (out: Vec3Ptr, x: number, y: number, z: number) => void;
export let _wcn_math_Vec4_create_wasm: (out: Vec4Ptr, x: number, y: number, z: number, w: number) => void;
export let _wcn_math_Quat_create_wasm: (out: QuatPtr, x: number, y: number, z: number, w: number) => void;
export let _wcn_math_Mat3_create_wasm: (out: Mat3Ptr) => void;
export let _wcn_math_Mat4_create_wasm: (out: Mat4Ptr) => void;

// Vec2 操作
export let _wcn_math_Vec2_set_wasm: (out: Vec2Ptr, x: number, y: number) => void;
export let _wcn_math_Vec2_copy_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_zero_wasm: (out: Vec2Ptr) => void;
export let _wcn_math_Vec2_add_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_sub_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_multiply_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_multiply_scalar_wasm: (out: Vec2Ptr, src: Vec2Ptr, scalar: number) => void;
export let _wcn_math_Vec2_div_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_div_scalar_wasm: (out: Vec2Ptr, src: Vec2Ptr, scalar: number) => void;
export let _wcn_math_Vec2_dot_wasm: (a: Vec2Ptr, b: Vec2Ptr) => number;
export let _wcn_math_Vec2_cross_wasm: (out: Vec3Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_length_wasm: (src: Vec2Ptr) => number;
export let _wcn_math_Vec2_length_squared_wasm: (src: Vec2Ptr) => number;
export let _wcn_math_Vec2_distance_wasm: (a: Vec2Ptr, b: Vec2Ptr) => number;
export let _wcn_math_Vec2_normalize_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_negate_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_lerp_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr, t: number) => void;
export let _wcn_math_Vec2_equals_wasm: (a: Vec2Ptr, b: Vec2Ptr) => number;
export let _wcn_math_Vec2_transform_mat3_wasm: (out: Vec2Ptr, src: Vec2Ptr, mat: Mat3Ptr) => void;
export let _wcn_math_Vec2_transform_mat4_wasm: (out: Vec2Ptr, src: Vec2Ptr, mat: Mat4Ptr) => void;

// Vec3 操作
export let _wcn_math_Vec3_set_wasm: (out: Vec3Ptr, x: number, y: number, z: number) => void;
export let _wcn_math_Vec3_copy_wasm: (out: Vec3Ptr, src: Vec3Ptr) => void;
export let _wcn_math_Vec3_zero_wasm: (out: Vec3Ptr) => void;
export let _wcn_math_Vec3_add_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_sub_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_cross_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_dot_wasm: (a: Vec3Ptr, b: Vec3Ptr) => number;
export let _wcn_math_Vec3_length_wasm: (src: Vec3Ptr) => number;
export let _wcn_math_Vec3_normalize_wasm: (out: Vec3Ptr, src: Vec3Ptr) => void;
export let _wcn_math_Vec3_lerp_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr, t: number) => void;
export let _wcn_math_Vec3_transform_mat4_wasm: (out: Vec3Ptr, src: Vec3Ptr, mat: Mat4Ptr) => void;
export let _wcn_math_Vec3_transform_quat_wasm: (out: Vec3Ptr, src: Vec3Ptr, quat: QuatPtr) => void;


// Vec4 操作
export let _wcn_math_Vec4_set_wasm: (out: Vec4Ptr, x: number, y: number, z: number, w: number) => void;
export let _wcn_math_Vec4_copy_wasm: (out: Vec4Ptr, src: Vec4Ptr) => void;
export let _wcn_math_Vec4_zero_wasm: (out: Vec4Ptr) => void;
export let _wcn_math_Vec4_add_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr) => void;
export let _wcn_math_Vec4_sub_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr) => void;
export let _wcn_math_Vec4_dot_wasm: (a: Vec4Ptr, b: Vec4Ptr) => number;
export let _wcn_math_Vec4_length_wasm: (src: Vec4Ptr) => number;
export let _wcn_math_Vec4_normalize_wasm: (out: Vec4Ptr, src: Vec4Ptr) => void;
export let _wcn_math_Vec4_lerp_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr, t: number) => void;
export let _wcn_math_Vec4_transform_mat4_wasm: (out: Vec4Ptr, src: Vec4Ptr, mat: Mat4Ptr) => void;

// Quat 操作
export let _wcn_math_Quat_set_wasm: (out: QuatPtr, x: number, y: number, z: number, w: number) => void;
export let _wcn_math_Quat_copy_wasm: (out: QuatPtr, src: QuatPtr) => void;
export let _wcn_math_Quat_identity_wasm: (out: QuatPtr) => void;
export let _wcn_math_Quat_multiply_wasm: (out: QuatPtr, a: QuatPtr, b: QuatPtr) => void;
export let _wcn_math_Quat_normalize_wasm: (out: QuatPtr, src: QuatPtr) => void;
export let _wcn_math_Quat_slerp_wasm: (out: QuatPtr, a: QuatPtr, b: QuatPtr, t: number) => void;
export let _wcn_math_Quat_from_euler_wasm: (out: QuatPtr, x: number, y: number, z: number, order: RotationOrder) => void;
export let _wcn_math_Quat_from_axis_angle_wasm: (out: QuatPtr, axis: Vec3Ptr, angle: number) => void;

// Mat3 操作
export let _wcn_math_Mat3_copy_wasm: (out: Mat3Ptr, src: Mat3Ptr) => void;
export let _wcn_math_Mat3_identity_wasm: (out: Mat3Ptr) => void;
export let _wcn_math_Mat3_multiply_wasm: (out: Mat3Ptr, a: Mat3Ptr, b: Mat3Ptr) => void;
export let _wcn_math_Mat3_inverse_wasm: (out: Mat3Ptr, src: Mat3Ptr) => void;
export let _wcn_math_Mat3_transpose_wasm: (out: Mat3Ptr, src: Mat3Ptr) => void;
export let _wcn_math_Mat3_determinant_wasm: (src: Mat3Ptr) => number;
export let _wcn_math_Mat3_set_with_index_wasm: (out: Mat3Ptr, index: Mat3Index, value: number) => void;
export let _wcn_math_Mat3_from_quat_wasm: (out: Mat3Ptr, src: QuatPtr) => void;
export let _wcn_math_Mat3_rotate_wasm: (out: Mat3Ptr, src: Mat3Ptr, angle: number) => void;
export let _wcn_math_Mat3_scale_wasm: (out: Mat3Ptr, src: Mat3Ptr, v: Vec2Ptr) => void;
export let _wcn_math_Mat3_translate_wasm: (out: Mat3Ptr, src: Mat3Ptr, v: Vec2Ptr) => void;

// Mat4 操作
export let _wcn_math_Mat4_copy_wasm: (out: Mat4Ptr, src: Mat4Ptr) => void;
export let _wcn_math_Mat4_identity_wasm: (out: Mat4Ptr) => void;
export let _wcn_math_Mat4_multiply_wasm: (out: Mat4Ptr, a: Mat4Ptr, b: Mat4Ptr) => void;
export let _wcn_math_Mat4_inverse_wasm: (out: Mat4Ptr, src: Mat4Ptr) => void;
export let _wcn_math_Mat4_transpose_wasm: (out: Mat4Ptr, src: Mat4Ptr) => void;
export let _wcn_math_Mat4_determinant_wasm: (src: Mat4Ptr) => number;
export let _wcn_math_Mat4_set_with_index_wasm: (out: Mat4Ptr, index: Mat4Index, value: number) => void;
export let _wcn_math_Mat4_from_quat_wasm: (out: Mat4Ptr, src: QuatPtr) => void;
export let _wcn_math_Mat4_translate_wasm: (out: Mat4Ptr, src: Mat4Ptr, v: Vec3Ptr) => void;
export let _wcn_math_Mat4_scale_wasm: (out: Mat4Ptr, src: Mat4Ptr, v: Vec3Ptr) => void;
export let _wcn_math_Mat4_rotate_wasm: (out: Mat4Ptr, src: Mat4Ptr, axis: Vec3Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotate_x_wasm: (out: Mat4Ptr, src: Mat4Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotate_y_wasm: (out: Mat4Ptr, src: Mat4Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotate_z_wasm: (out: Mat4Ptr, src: Mat4Ptr, angle: number) => void;


export let _wcn_math_Mat4_perspective_wasm: (out: Mat4Ptr, fov: number, aspect: number, near: number, far: number) => void;
export let _wcn_math_Mat4_ortho_wasm: (out: Mat4Ptr, left: number, right: number, bottom: number, top: number, near: number, far: number) => void;
export let _wcn_math_Mat4_look_at_wasm: (out: Mat4Ptr, eye: Vec3Ptr, target: Vec3Ptr, up: Vec3Ptr) => void;

// ============================================================================
// 模块初始化
// ============================================================================

export interface CreateWCNOptions {
	/** 加载 wasm 文件的函数 */
	loadWasm: () => Promise<ArrayBuffer>;
	/** 预初始化的 WebGPU 设备 */
	preinitializedWebGPUDevice?: GPUDevice;
}

let _initialized = false;

/**
 * 创建并初始化 WCN 模块
 */
export async function createWCN(options: CreateWCNOptions): Promise<void> {
	if (_initialized) return;

	// 设置预初始化的 WebGPU 设备
	if (options.preinitializedWebGPUDevice) {
		(globalThis as unknown as { preinitializedWebGPUDevice: GPUDevice }).preinitializedWebGPUDevice =
			options.preinitializedWebGPUDevice;
	}

	// 加载 wasm
	const wasmBinary = await options.loadWasm();

	// 实例化
	const imports = {
		env: wasmImports,
		wasi_snapshot_preview1: wasmImports,
	};

	const result = await WebAssembly.instantiate(wasmBinary, imports);
	const exports = result.instance.exports;

	// 设置内存和表
	wasmMemory = exports.memory as WebAssembly.Memory;
	_wasmTable = exports.__indirect_function_table as WebAssembly.Table;
	_wasmExports = exports;
	updateMemoryViews();

	// 设置栈操作函数
	_stackSave = exports.emscripten_stack_get_current as () => number;
	_stackRestore = exports._emscripten_stack_restore as (val: number) => void;
	stackAlloc = exports._emscripten_stack_alloc as (size: number) => number;

	// 初始化栈
	(exports.emscripten_stack_init as () => void)();

	// 调用 ctors
	(exports.__wasm_call_ctors as () => void)();

	// 绑定导出函数
	_malloc = exports.malloc as typeof _malloc;
	_free = exports.free as typeof _free;

	// WCN 核心
	_wcn_init_js = exports.wcn_init_js as typeof _wcn_init_js;
	_wcn_wasm_create_gpu_resources_auto =
		exports.wcn_wasm_create_gpu_resources_auto as typeof _wcn_wasm_create_gpu_resources_auto;
	_wcn_create_context = exports.wcn_create_context as typeof _wcn_create_context;
	_wcn_destroy_context = exports.wcn_destroy_context as typeof _wcn_destroy_context;
	_wcn_begin_frame = exports.wcn_begin_frame as typeof _wcn_begin_frame;
	_wcn_end_frame = exports.wcn_end_frame as typeof _wcn_end_frame;
	_wcn_begin_render_pass = exports.wcn_begin_render_pass as typeof _wcn_begin_render_pass;
	_wcn_end_render_pass = exports.wcn_end_render_pass as typeof _wcn_end_render_pass;
	_wcn_submit_commands = exports.wcn_submit_commands as typeof _wcn_submit_commands;
	_wcn_save = exports.wcn_save as typeof _wcn_save;
	_wcn_restore = exports.wcn_restore as typeof _wcn_restore;

	// 绘图
	_wcn_clear_rect = exports.wcn_clear_rect as typeof _wcn_clear_rect;
	_wcn_fill_rect = exports.wcn_fill_rect as typeof _wcn_fill_rect;
	_wcn_stroke_rect = exports.wcn_stroke_rect as typeof _wcn_stroke_rect;
	_wcn_begin_path = exports.wcn_begin_path as typeof _wcn_begin_path;
	_wcn_close_path = exports.wcn_close_path as typeof _wcn_close_path;
	_wcn_move_to = exports.wcn_move_to as typeof _wcn_move_to;
	_wcn_line_to = exports.wcn_line_to as typeof _wcn_line_to;
	_wcn_arc = exports.wcn_arc as typeof _wcn_arc;
	_wcn_rect = exports.wcn_rect as typeof _wcn_rect;
	_wcn_fill = exports.wcn_fill as typeof _wcn_fill;
	_wcn_stroke = exports.wcn_stroke as typeof _wcn_stroke;

	// 样式
	_wcn_set_fill_style = exports.wcn_set_fill_style as typeof _wcn_set_fill_style;
	_wcn_set_stroke_style = exports.wcn_set_stroke_style as typeof _wcn_set_stroke_style;
	_wcn_set_line_width = exports.wcn_set_line_width as typeof _wcn_set_line_width;
	_wcn_set_line_cap = exports.wcn_set_line_cap as typeof _wcn_set_line_cap;
	_wcn_set_line_join = exports.wcn_set_line_join as typeof _wcn_set_line_join;
	_wcn_set_miter_limit = exports.wcn_set_miter_limit as typeof _wcn_set_miter_limit;
	_wcn_set_global_alpha = exports.wcn_set_global_alpha as typeof _wcn_set_global_alpha;
	_wcn_set_global_composite_operation = exports.wcn_set_global_composite_operation as typeof _wcn_set_global_composite_operation;

	// 变换
	_wcn_translate = exports.wcn_translate as typeof _wcn_translate;
	_wcn_rotate = exports.wcn_rotate as typeof _wcn_rotate;
	_wcn_scale = exports.wcn_scale as typeof _wcn_scale;
	_wcn_transform = exports.wcn_transform as typeof _wcn_transform;
	_wcn_set_transform = exports.wcn_set_transform as typeof _wcn_set_transform;
	_wcn_reset_transform = exports.wcn_reset_transform as typeof _wcn_reset_transform;


	// 文本
	_wcn_fill_text = exports.wcn_fill_text as typeof _wcn_fill_text;
	_wcn_stroke_text = exports.wcn_stroke_text as typeof _wcn_stroke_text;
	_wcn_measure_text = exports.wcn_measure_text as typeof _wcn_measure_text;
	_wcn_set_font = exports.wcn_set_font as typeof _wcn_set_font;
	_wcn_set_font_face = exports.wcn_set_font_face as typeof _wcn_set_font_face;
	_wcn_set_text_align = exports.wcn_set_text_align as typeof _wcn_set_text_align;
	_wcn_set_text_baseline = exports.wcn_set_text_baseline as typeof _wcn_set_text_baseline;
	_wcn_wasm_load_font = exports.wcn_wasm_load_font as typeof _wcn_wasm_load_font;
	_wcn_add_font_fallback = exports.wcn_add_font_fallback as typeof _wcn_add_font_fallback;
	_wcn_clear_font_fallbacks = exports.wcn_clear_font_fallbacks as typeof _wcn_clear_font_fallbacks;

	// 图像
	_wcn_draw_image = exports.wcn_draw_image as typeof _wcn_draw_image;
	_wcn_draw_image_scaled = exports.wcn_draw_image_scaled as typeof _wcn_draw_image_scaled;
	_wcn_draw_image_source = exports.wcn_draw_image_source as typeof _wcn_draw_image_source;
	_wcn_decode_image = exports.wcn_decode_image as typeof _wcn_decode_image;
	_wcn_destroy_image_data = exports.wcn_destroy_image_data as typeof _wcn_destroy_image_data;

	// 解码器
	_wcn_register_font_decoder = exports.wcn_register_font_decoder as typeof _wcn_register_font_decoder;
	_wcn_register_image_decoder = exports.wcn_register_image_decoder as typeof _wcn_register_image_decoder;
	_wcn_wasm_get_font_decoder = exports.wcn_wasm_get_font_decoder as typeof _wcn_wasm_get_font_decoder;
	_wcn_wasm_create_default_font_face = exports.wcn_wasm_create_default_font_face as typeof _wcn_wasm_create_default_font_face;
	_wcn_wasm_get_image_decoder = exports.wcn_wasm_get_image_decoder as typeof _wcn_wasm_get_image_decoder;

	// Surface
	_wcn_get_surface_format = exports.wcn_get_surface_format as typeof _wcn_get_surface_format;
	_wcn_set_surface_format = exports.wcn_set_surface_format as typeof _wcn_set_surface_format;

	// Math
	_wcn_math_set_epsilon = exports.wcn_math_set_epsilon as typeof _wcn_math_set_epsilon;
	_wcn_math_get_epsilon = exports.wcn_math_get_epsilon as typeof _wcn_math_get_epsilon;
	_wcn_math_Vec2_create_wasm = exports.wcn_math_Vec2_create_wasm as typeof _wcn_math_Vec2_create_wasm;
	_wcn_math_Vec3_create_wasm = exports.wcn_math_Vec3_create_wasm as typeof _wcn_math_Vec3_create_wasm;
	_wcn_math_Vec4_create_wasm = exports.wcn_math_Vec4_create_wasm as typeof _wcn_math_Vec4_create_wasm;
	_wcn_math_Quat_create_wasm = exports.wcn_math_Quat_create_wasm as typeof _wcn_math_Quat_create_wasm;
	_wcn_math_Mat3_create_wasm = exports.wcn_math_Mat3_create_wasm as typeof _wcn_math_Mat3_create_wasm;
	_wcn_math_Mat4_create_wasm = exports.wcn_math_Mat4_create_wasm as typeof _wcn_math_Mat4_create_wasm;

	// Vec2
	_wcn_math_Vec2_set_wasm = exports.wcn_math_Vec2_set_wasm as typeof _wcn_math_Vec2_set_wasm;
	_wcn_math_Vec2_copy_wasm = exports.wcn_math_Vec2_copy_wasm as typeof _wcn_math_Vec2_copy_wasm;
	_wcn_math_Vec2_zero_wasm = exports.wcn_math_Vec2_zero_wasm as typeof _wcn_math_Vec2_zero_wasm;
	_wcn_math_Vec2_add_wasm = exports.wcn_math_Vec2_add_wasm as typeof _wcn_math_Vec2_add_wasm;
	_wcn_math_Vec2_sub_wasm = exports.wcn_math_Vec2_sub_wasm as typeof _wcn_math_Vec2_sub_wasm;
	_wcn_math_Vec2_multiply_wasm = exports.wcn_math_Vec2_multiply_wasm as typeof _wcn_math_Vec2_multiply_wasm;
	_wcn_math_Vec2_multiply_scalar_wasm = exports.wcn_math_Vec2_multiply_scalar_wasm as typeof _wcn_math_Vec2_multiply_scalar_wasm;
	_wcn_math_Vec2_div_wasm = exports.wcn_math_Vec2_div_wasm as typeof _wcn_math_Vec2_div_wasm;
	_wcn_math_Vec2_div_scalar_wasm = exports.wcn_math_Vec2_div_scalar_wasm as typeof _wcn_math_Vec2_div_scalar_wasm;
	_wcn_math_Vec2_dot_wasm = exports.wcn_math_Vec2_dot_wasm as typeof _wcn_math_Vec2_dot_wasm;
	_wcn_math_Vec2_cross_wasm = exports.wcn_math_Vec2_cross_wasm as typeof _wcn_math_Vec2_cross_wasm;
	_wcn_math_Vec2_length_wasm = exports.wcn_math_Vec2_length_wasm as typeof _wcn_math_Vec2_length_wasm;
	_wcn_math_Vec2_length_squared_wasm = exports.wcn_math_Vec2_length_squared_wasm as typeof _wcn_math_Vec2_length_squared_wasm;
	_wcn_math_Vec2_distance_wasm = exports.wcn_math_Vec2_distance_wasm as typeof _wcn_math_Vec2_distance_wasm;
	_wcn_math_Vec2_normalize_wasm = exports.wcn_math_Vec2_normalize_wasm as typeof _wcn_math_Vec2_normalize_wasm;
	_wcn_math_Vec2_negate_wasm = exports.wcn_math_Vec2_negate_wasm as typeof _wcn_math_Vec2_negate_wasm;
	_wcn_math_Vec2_lerp_wasm = exports.wcn_math_Vec2_lerp_wasm as typeof _wcn_math_Vec2_lerp_wasm;
	_wcn_math_Vec2_equals_wasm = exports.wcn_math_Vec2_equals_wasm as typeof _wcn_math_Vec2_equals_wasm;
	_wcn_math_Vec2_transform_mat3_wasm = exports.wcn_math_Vec2_transform_mat3_wasm as typeof _wcn_math_Vec2_transform_mat3_wasm;
	_wcn_math_Vec2_transform_mat4_wasm = exports.wcn_math_Vec2_transform_mat4_wasm as typeof _wcn_math_Vec2_transform_mat4_wasm;


	// Vec3
	_wcn_math_Vec3_set_wasm = exports.wcn_math_Vec3_set_wasm as typeof _wcn_math_Vec3_set_wasm;
	_wcn_math_Vec3_copy_wasm = exports.wcn_math_Vec3_copy_wasm as typeof _wcn_math_Vec3_copy_wasm;
	_wcn_math_Vec3_zero_wasm = exports.wcn_math_Vec3_zero_wasm as typeof _wcn_math_Vec3_zero_wasm;
	_wcn_math_Vec3_add_wasm = exports.wcn_math_Vec3_add_wasm as typeof _wcn_math_Vec3_add_wasm;
	_wcn_math_Vec3_sub_wasm = exports.wcn_math_Vec3_sub_wasm as typeof _wcn_math_Vec3_sub_wasm;
	_wcn_math_Vec3_cross_wasm = exports.wcn_math_Vec3_cross_wasm as typeof _wcn_math_Vec3_cross_wasm;
	_wcn_math_Vec3_dot_wasm = exports.wcn_math_Vec3_dot_wasm as typeof _wcn_math_Vec3_dot_wasm;
	_wcn_math_Vec3_length_wasm = exports.wcn_math_Vec3_length_wasm as typeof _wcn_math_Vec3_length_wasm;
	_wcn_math_Vec3_normalize_wasm = exports.wcn_math_Vec3_normalize_wasm as typeof _wcn_math_Vec3_normalize_wasm;
	_wcn_math_Vec3_lerp_wasm = exports.wcn_math_Vec3_lerp_wasm as typeof _wcn_math_Vec3_lerp_wasm;
	_wcn_math_Vec3_transform_mat4_wasm = exports.wcn_math_Vec3_transform_mat4_wasm as typeof _wcn_math_Vec3_transform_mat4_wasm;
	_wcn_math_Vec3_transform_quat_wasm = exports.wcn_math_Vec3_transform_quat_wasm as typeof _wcn_math_Vec3_transform_quat_wasm;

	// Vec4
	_wcn_math_Vec4_set_wasm = exports.wcn_math_Vec4_set_wasm as typeof _wcn_math_Vec4_set_wasm;
	_wcn_math_Vec4_copy_wasm = exports.wcn_math_Vec4_copy_wasm as typeof _wcn_math_Vec4_copy_wasm;
	_wcn_math_Vec4_zero_wasm = exports.wcn_math_Vec4_zero_wasm as typeof _wcn_math_Vec4_zero_wasm;
	_wcn_math_Vec4_add_wasm = exports.wcn_math_Vec4_add_wasm as typeof _wcn_math_Vec4_add_wasm;
	_wcn_math_Vec4_sub_wasm = exports.wcn_math_Vec4_sub_wasm as typeof _wcn_math_Vec4_sub_wasm;
	_wcn_math_Vec4_dot_wasm = exports.wcn_math_Vec4_dot_wasm as typeof _wcn_math_Vec4_dot_wasm;
	_wcn_math_Vec4_length_wasm = exports.wcn_math_Vec4_length_wasm as typeof _wcn_math_Vec4_length_wasm;
	_wcn_math_Vec4_normalize_wasm = exports.wcn_math_Vec4_normalize_wasm as typeof _wcn_math_Vec4_normalize_wasm;
	_wcn_math_Vec4_lerp_wasm = exports.wcn_math_Vec4_lerp_wasm as typeof _wcn_math_Vec4_lerp_wasm;
	_wcn_math_Vec4_transform_mat4_wasm = exports.wcn_math_Vec4_transform_mat4_wasm as typeof _wcn_math_Vec4_transform_mat4_wasm;

	// Quat
	_wcn_math_Quat_set_wasm = exports.wcn_math_Quat_set_wasm as typeof _wcn_math_Quat_set_wasm;
	_wcn_math_Quat_copy_wasm = exports.wcn_math_Quat_copy_wasm as typeof _wcn_math_Quat_copy_wasm;
	_wcn_math_Quat_identity_wasm = exports.wcn_math_Quat_identity_wasm as typeof _wcn_math_Quat_identity_wasm;
	_wcn_math_Quat_multiply_wasm = exports.wcn_math_Quat_multiply_wasm as typeof _wcn_math_Quat_multiply_wasm;
	_wcn_math_Quat_normalize_wasm = exports.wcn_math_Quat_normalize_wasm as typeof _wcn_math_Quat_normalize_wasm;
	_wcn_math_Quat_slerp_wasm = exports.wcn_math_Quat_slerp_wasm as typeof _wcn_math_Quat_slerp_wasm;
	_wcn_math_Quat_from_euler_wasm = exports.wcn_math_Quat_from_euler_wasm as typeof _wcn_math_Quat_from_euler_wasm;
	_wcn_math_Quat_from_axis_angle_wasm = exports.wcn_math_Quat_from_axis_angle_wasm as typeof _wcn_math_Quat_from_axis_angle_wasm;

	// Mat3
	_wcn_math_Mat3_copy_wasm = exports.wcn_math_Mat3_copy_wasm as typeof _wcn_math_Mat3_copy_wasm;
	_wcn_math_Mat3_identity_wasm = exports.wcn_math_Mat3_identity_wasm as typeof _wcn_math_Mat3_identity_wasm;
	_wcn_math_Mat3_multiply_wasm = exports.wcn_math_Mat3_multiply_wasm as typeof _wcn_math_Mat3_multiply_wasm;
	_wcn_math_Mat3_inverse_wasm = exports.wcn_math_Mat3_inverse_wasm as typeof _wcn_math_Mat3_inverse_wasm;
	_wcn_math_Mat3_transpose_wasm = exports.wcn_math_Mat3_transpose_wasm as typeof _wcn_math_Mat3_transpose_wasm;
	_wcn_math_Mat3_determinant_wasm = exports.wcn_math_Mat3_determinant_wasm as typeof _wcn_math_Mat3_determinant_wasm;
	_wcn_math_Mat3_set_with_index_wasm = exports.wcn_math_Mat3_set_with_index_wasm as typeof _wcn_math_Mat3_set_with_index_wasm;
	_wcn_math_Mat3_from_quat_wasm = exports.wcn_math_Mat3_from_quat_wasm as typeof _wcn_math_Mat3_from_quat_wasm;
	_wcn_math_Mat3_rotate_wasm = exports.wcn_math_Mat3_rotate_wasm as typeof _wcn_math_Mat3_rotate_wasm;
	_wcn_math_Mat3_scale_wasm = exports.wcn_math_Mat3_scale_wasm as typeof _wcn_math_Mat3_scale_wasm;
	_wcn_math_Mat3_translate_wasm = exports.wcn_math_Mat3_translate_wasm as typeof _wcn_math_Mat3_translate_wasm;

	// Mat4
	_wcn_math_Mat4_copy_wasm = exports.wcn_math_Mat4_copy_wasm as typeof _wcn_math_Mat4_copy_wasm;
	_wcn_math_Mat4_identity_wasm = exports.wcn_math_Mat4_identity_wasm as typeof _wcn_math_Mat4_identity_wasm;
	_wcn_math_Mat4_multiply_wasm = exports.wcn_math_Mat4_multiply_wasm as typeof _wcn_math_Mat4_multiply_wasm;
	_wcn_math_Mat4_inverse_wasm = exports.wcn_math_Mat4_inverse_wasm as typeof _wcn_math_Mat4_inverse_wasm;
	_wcn_math_Mat4_transpose_wasm = exports.wcn_math_Mat4_transpose_wasm as typeof _wcn_math_Mat4_transpose_wasm;
	_wcn_math_Mat4_determinant_wasm = exports.wcn_math_Mat4_determinant_wasm as typeof _wcn_math_Mat4_determinant_wasm;
	_wcn_math_Mat4_set_with_index_wasm = exports.wcn_math_Mat4_set_with_index_wasm as typeof _wcn_math_Mat4_set_with_index_wasm;
	_wcn_math_Mat4_from_quat_wasm = exports.wcn_math_Mat4_from_quat_wasm as typeof _wcn_math_Mat4_from_quat_wasm;
	_wcn_math_Mat4_translate_wasm = exports.wcn_math_Mat4_translate_wasm as typeof _wcn_math_Mat4_translate_wasm;
	_wcn_math_Mat4_scale_wasm = exports.wcn_math_Mat4_scale_wasm as typeof _wcn_math_Mat4_scale_wasm;
	_wcn_math_Mat4_rotate_wasm = exports.wcn_math_Mat4_rotate_wasm as typeof _wcn_math_Mat4_rotate_wasm;
	_wcn_math_Mat4_rotate_x_wasm = exports.wcn_math_Mat4_rotate_x_wasm as typeof _wcn_math_Mat4_rotate_x_wasm;
	_wcn_math_Mat4_rotate_y_wasm = exports.wcn_math_Mat4_rotate_y_wasm as typeof _wcn_math_Mat4_rotate_y_wasm;
	_wcn_math_Mat4_rotate_z_wasm = exports.wcn_math_Mat4_rotate_z_wasm as typeof _wcn_math_Mat4_rotate_z_wasm;
	_wcn_math_Mat4_perspective_wasm = exports.wcn_math_Mat4_perspective_wasm as typeof _wcn_math_Mat4_perspective_wasm;
	_wcn_math_Mat4_ortho_wasm = exports.wcn_math_Mat4_ortho_wasm as typeof _wcn_math_Mat4_ortho_wasm;
	_wcn_math_Mat4_look_at_wasm = exports.wcn_math_Mat4_look_at_wasm as typeof _wcn_math_Mat4_look_at_wasm;

	_initialized = true;
}

// ============================================================================
// 辅助函数
// ============================================================================

export function allocString(str: string): CStringPtr {
	const len = lengthBytesUTF8(str) + 1;
	const ptr = _malloc(len) as CStringPtr;
	stringToUTF8(str, ptr as number, len);
	return ptr;
}

export function withString<T>(str: string, fn: (ptr: CStringPtr) => T): T {
	const ptr = allocString(str);
	try {
		return fn(ptr);
	} finally {
		_free(ptr);
	}
}

// 内存视图导出（使用 getter 确保获取最新值）
export {
	HEAP8,
	HEAP16,
	HEAP32,
	HEAPU8,
	HEAPU16,
	HEAPU32,
	HEAPF32,
	HEAPF64,
	HEAP64,
	HEAPU64,
};

// 内存视图 getter 函数（用于需要动态获取最新视图的场景）
export const getHEAP8 = () => HEAP8;
export const getHEAP16 = () => HEAP16;
export const getHEAP32 = () => HEAP32;
export const getHEAPU8 = () => HEAPU8;
export const getHEAPU16 = () => HEAPU16;
export const getHEAPU32 = () => HEAPU32;
export const getHEAPF32 = () => HEAPF32;
export const getHEAPF64 = () => HEAPF64;
export const getHEAP64 = () => HEAP64;
export const getHEAPU64 = () => HEAPU64;

// 内部变量导出（供高级用途）
export { _wasmExports as wasmExports, _wasmTable as wasmTable };
