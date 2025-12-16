/**
 * WebGPU 管理器和辅助函数
 */

import { HEAPU8, HEAPU32 } from "./memory";
import { UTF8ToString } from "./utf8";

// ============================================================================
// Manager 类
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

// ============================================================================
// WebGPU 全局对象
// ============================================================================

export const WebGPU = {
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
		, "r8unorm", "r8snorm", "r8uint", "r8sint", "r16uint", "r16sint", "r16float",
		"rg8unorm", "rg8snorm", "rg8uint", "rg8sint", "r32float", "r32uint", "r32sint",
		"rg16uint", "rg16sint", "rg16float", "rgba8unorm", "rgba8unorm-srgb", "rgba8snorm",
		"rgba8uint", "rgba8sint", "bgra8unorm", "bgra8unorm-srgb", "rgb10a2uint", "rgb10a2unorm",
		"rg11b10ufloat", "rgb9e5ufloat", "rg32float", "rg32uint", "rg32sint", "rgba16uint",
		"rgba16sint", "rgba16float", "rgba32float", "rgba32uint", "rgba32sint", "stencil8",
		"depth16unorm", "depth24plus", "depth24plus-stencil8", "depth32float", "depth32float-stencil8",
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
// TextureView 管理器
// ============================================================================

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

export function freeWGPUTextureView(id: number): void {
	if (textureViewMap.has(id)) {
		textureViewMap.delete(id);
		textureViewFreeList.push(id);
	}
}

// ============================================================================
// WebGPU 辅助函数
// ============================================================================

export function wasm_create_render_pipeline(
	device: number, layout: number, shader: number, vs_entry: number,
	fs_entry: number, instance_stride: number, format_str: number,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	const pipelineLayout = WebGPU.mgrPipelineLayout.get(layout);
	const shaderModule = WebGPU.mgrShaderModule.get(shader);
	if (!dev || !pipelineLayout || !shaderModule) return 0;

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
			vertex: { module: shaderModule, entryPoint: UTF8ToString(vs_entry), buffers: [vertexBufferLayout] },
			primitive: { topology: "triangle-list", frontFace: "ccw", cullMode: "none" },
			multisample: { count: 1 },
			fragment: {
				module: shaderModule,
				entryPoint: UTF8ToString(fs_entry),
				targets: [{
					format: UTF8ToString(format_str) as GPUTextureFormat,
					blend: {
						color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
						alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
					},
					writeMask: 0xf,
				}],
			},
		});
		return WebGPU.mgrRenderPipeline.create(pipeline);
	} catch { return 0; }
}

export function wasm_create_compute_pipeline(device: number, layout: number, shader: number, entry: number): number {
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
	} catch { return 0; }
}

export function wasm_create_bind_group(
	device: number, layout: number, instance_buffer: number,
	instance_buffer_size: bigint, uniform_buffer: number,
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
	} catch { return 0; }
}

export function wasm_create_compute_bind_group(
	device: number, layout: number, instance_buffer: number, instance_buffer_size: bigint,
	vertex_buffer: number, vertex_buffer_size: bigint, uniform_buffer: number, uniform_buffer_size: bigint,
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
	} catch { return 0; }
}

export function wasm_create_buffer(device: number, label: number, size: bigint, usage_flags: number): number {
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
	} catch { return 0; }
}

export function wasm_create_bind_group_layout(device: number, label: number, min_binding_size_0: bigint, min_binding_size_1: bigint): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const layout = dev.createBindGroupLayout({
			label: UTF8ToString(label),
			entries: [
				{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage", minBindingSize: Number(min_binding_size_0) } },
				{ binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform", minBindingSize: Number(min_binding_size_1) } },
			],
		});
		return WebGPU.mgrBindGroupLayout.create(layout);
	} catch { return 0; }
}

export function wasm_create_compute_bind_group_layout(device: number, label: number, min_binding_size_0: bigint, min_binding_size_1: bigint, min_binding_size_2: bigint): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const layout = dev.createBindGroupLayout({
			label: UTF8ToString(label),
			entries: [
				{ binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage", minBindingSize: Number(min_binding_size_0) } },
				{ binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage", minBindingSize: Number(min_binding_size_1) } },
				{ binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform", minBindingSize: Number(min_binding_size_2) } },
			],
		});
		return WebGPU.mgrBindGroupLayout.create(layout);
	} catch { return 0; }
}

export function wasm_create_shader_module(device: number, wgsl_code: number, label: number): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const module = dev.createShaderModule({
			label: label ? UTF8ToString(label) : "Shader Module",
			code: UTF8ToString(wgsl_code),
		});
		return WebGPU.mgrShaderModule.create(module);
	} catch { return 0; }
}

export function wasm_create_sdf_bind_group_layout(device: number, label: number): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const layout = dev.createBindGroupLayout({
			label: UTF8ToString(label),
			entries: [
				{ binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float", viewDimension: "2d" } },
				{ binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
				{ binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float", viewDimension: "2d" } },
				{ binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
			],
		});
		return WebGPU.mgrBindGroupLayout.create(layout);
	} catch { return 0; }
}

export function wasm_create_pipeline_layout(device: number, label: number, layout0: number, layout1: number): number {
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
	} catch { return 0; }
}

export function wasm_create_single_bind_group_pipeline_layout(device: number, label: number, layout: number): number {
	const dev = WebGPU.mgrDevice.get(device);
	const bindGroupLayout = WebGPU.mgrBindGroupLayout.get(layout);
	if (!dev || !bindGroupLayout) return 0;

	try {
		const pipelineLayout = dev.createPipelineLayout({
			label: UTF8ToString(label),
			bindGroupLayouts: [bindGroupLayout],
		});
		return WebGPU.mgrPipelineLayout.create(pipelineLayout);
	} catch { return 0; }
}

export function wasm_create_sampler(device: number, label: number): number {
	const dev = WebGPU.mgrDevice.get(device);
	if (!dev) return 0;

	try {
		const sampler = dev.createSampler({
			label: label ? UTF8ToString(label) : "Sampler",
			addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge", addressModeW: "clamp-to-edge",
			magFilter: "linear", minFilter: "linear", mipmapFilter: "linear",
		});
		return WebGPU.mgrSampler.create(sampler);
	} catch { return 0; }
}

export function wasm_begin_render_pass(encoder: number, view_id: number, is_first_pass: number): number {
	const commandEncoder = WebGPU.mgrCommandEncoder.get(encoder);
	const textureView = getWGPUTextureView(view_id);
	if (!commandEncoder || !textureView) return 0;

	try {
		const renderPass = commandEncoder.beginRenderPass({
			label: "WCN Render Pass",
			colorAttachments: [{
				view: textureView,
				loadOp: is_first_pass ? "clear" : "load",
				storeOp: "store",
				clearValue: { r: 0.9, g: 0.9, b: 0.9, a: 1 },
			}],
		});
		return WebGPU.mgrRenderPassEncoder.create(renderPass);
	} catch { return 0; }
}

export function wasm_create_sdf_bind_group(
	device: number, layout: number, sdf_texture_view: number, sdf_sampler: number,
	image_texture_view: number, image_sampler: number,
): number {
	const dev = WebGPU.mgrDevice.get(device);
	const bindGroupLayout = WebGPU.mgrBindGroupLayout.get(layout);
	const sdfView = WebGPU.mgrTextureView.get(sdf_texture_view);
	const sdfSamplerObj = WebGPU.mgrSampler.get(sdf_sampler);
	const imageView = WebGPU.mgrTextureView.get(image_texture_view);
	const imageSamplerObj = WebGPU.mgrSampler.get(image_sampler);
	if (!dev || !bindGroupLayout || !sdfView || !sdfSamplerObj || !imageView || !imageSamplerObj) return 0;

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
	} catch { return 0; }
}

export function wasm_queue_write_texture(
	queue: number, texture: number, x: number, y: number,
	width: number, height: number, data: number, data_size: number,
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
