/**
 * WCN 模块初始化
 */

import { setWasmMemory, setWasmExports, setWasmTable, updateMemoryViews } from "./memory";
import { setStackFunctions } from "./stack";
import { bindExports, _malloc, _free } from "./exports";
import { setMallocRef, setFreeRef, Init_WCNJS, Init_WGPUTextureView_Map, js_load_font, js_get_glyph_metrics, js_generate_bitmap, js_prerender_text, js_prerender_common } from "./font";
import { _fd_close, _fd_seek, _fd_write, __abort_js, _emscripten_resize_heap, segfault, alignfault } from "./syscalls";
import {
	freeWGPUTextureView, wasm_begin_render_pass, wasm_create_bind_group, wasm_create_bind_group_layout,
	wasm_create_buffer, wasm_create_compute_bind_group, wasm_create_compute_bind_group_layout,
	wasm_create_compute_pipeline, wasm_create_pipeline_layout, wasm_create_render_pipeline,
	wasm_create_sampler, wasm_create_sdf_bind_group, wasm_create_sdf_bind_group_layout,
	wasm_create_shader_module, wasm_create_single_bind_group_pipeline_layout, wasm_queue_write_texture,
} from "./webgpu";
import {
	_wgpuBindGroupLayoutRelease, _wgpuBindGroupRelease, _wgpuBufferDestroy, _wgpuBufferRelease,
	_wgpuCommandBufferRelease, _wgpuCommandEncoderBeginComputePass, _wgpuCommandEncoderFinish,
	_wgpuCommandEncoderRelease, _wgpuComputePassEncoderDispatchWorkgroups, _wgpuComputePassEncoderEnd,
	_wgpuComputePassEncoderSetBindGroup, _wgpuComputePassEncoderSetPipeline, _wgpuComputePipelineRelease,
	_wgpuDeviceCreateCommandEncoder, _wgpuDeviceCreateTexture, _wgpuDeviceGetQueue, _wgpuDeviceRelease,
	_wgpuPipelineLayoutRelease, _wgpuQueueRelease, _wgpuQueueSubmit, _wgpuQueueWriteBuffer,
	_wgpuRenderPassEncoderDraw, _wgpuRenderPassEncoderEnd, _wgpuRenderPassEncoderRelease,
	_wgpuRenderPassEncoderSetBindGroup, _wgpuRenderPassEncoderSetPipeline, _wgpuRenderPassEncoderSetVertexBuffer,
	_wgpuRenderPipelineRelease, _wgpuSamplerRelease, _wgpuShaderModuleRelease, _wgpuSurfaceRelease,
	_wgpuTextureCreateView, _wgpuTextureRelease, _wgpuTextureViewRelease, _emscripten_webgpu_get_device,
} from "./wgpu-bindings";

export interface CreateWCNOptions {
	loadWasm: () => Promise<ArrayBuffer>;
	preinitializedWebGPUDevice?: GPUDevice;
}

let _initialized = false;

export async function createWCN(options: CreateWCNOptions): Promise<void> {
	if (_initialized) return;

	if (options.preinitializedWebGPUDevice) {
		(globalThis as unknown as { preinitializedWebGPUDevice: GPUDevice }).preinitializedWebGPUDevice =
			options.preinitializedWebGPUDevice;
	}

	const wasmBinary = await options.loadWasm();
	const wasmImports = {
		Init_WCNJS, Init_WGPUTextureView_Map, _abort_js: __abort_js, alignfault,
		emscripten_resize_heap: _emscripten_resize_heap, emscripten_webgpu_get_device: _emscripten_webgpu_get_device,
		fd_close: _fd_close, fd_seek: _fd_seek, fd_write: _fd_write, freeWGPUTextureView,
		js_generate_bitmap, js_get_glyph_metrics, js_load_font, js_prerender_text, js_prerender_common, segfault,
		wasm_begin_render_pass, wasm_create_bind_group, wasm_create_bind_group_layout, wasm_create_buffer,
		wasm_create_compute_bind_group, wasm_create_compute_bind_group_layout, wasm_create_compute_pipeline,
		wasm_create_pipeline_layout, wasm_create_render_pipeline, wasm_create_sampler, wasm_create_sdf_bind_group,
		wasm_create_sdf_bind_group_layout, wasm_create_shader_module, wasm_create_single_bind_group_pipeline_layout,
		wasm_queue_write_texture,
		wgpuBindGroupLayoutRelease: _wgpuBindGroupLayoutRelease, wgpuBindGroupRelease: _wgpuBindGroupRelease,
		wgpuBufferDestroy: _wgpuBufferDestroy, wgpuBufferRelease: _wgpuBufferRelease,
		wgpuCommandBufferRelease: _wgpuCommandBufferRelease, wgpuCommandEncoderBeginComputePass: _wgpuCommandEncoderBeginComputePass,
		wgpuCommandEncoderFinish: _wgpuCommandEncoderFinish, wgpuCommandEncoderRelease: _wgpuCommandEncoderRelease,
		wgpuComputePassEncoderDispatchWorkgroups: _wgpuComputePassEncoderDispatchWorkgroups,
		wgpuComputePassEncoderEnd: _wgpuComputePassEncoderEnd, wgpuComputePassEncoderSetBindGroup: _wgpuComputePassEncoderSetBindGroup,
		wgpuComputePassEncoderSetPipeline: _wgpuComputePassEncoderSetPipeline, wgpuComputePipelineRelease: _wgpuComputePipelineRelease,
		wgpuDeviceCreateCommandEncoder: _wgpuDeviceCreateCommandEncoder, wgpuDeviceCreateTexture: _wgpuDeviceCreateTexture,
		wgpuDeviceGetQueue: _wgpuDeviceGetQueue, wgpuDeviceRelease: _wgpuDeviceRelease,
		wgpuPipelineLayoutRelease: _wgpuPipelineLayoutRelease, wgpuQueueRelease: _wgpuQueueRelease,
		wgpuQueueSubmit: _wgpuQueueSubmit, wgpuQueueWriteBuffer: _wgpuQueueWriteBuffer,
		wgpuRenderPassEncoderDraw: _wgpuRenderPassEncoderDraw, wgpuRenderPassEncoderEnd: _wgpuRenderPassEncoderEnd,
		wgpuRenderPassEncoderRelease: _wgpuRenderPassEncoderRelease, wgpuRenderPassEncoderSetBindGroup: _wgpuRenderPassEncoderSetBindGroup,
		wgpuRenderPassEncoderSetPipeline: _wgpuRenderPassEncoderSetPipeline, wgpuRenderPassEncoderSetVertexBuffer: _wgpuRenderPassEncoderSetVertexBuffer,
		wgpuRenderPipelineRelease: _wgpuRenderPipelineRelease, wgpuSamplerRelease: _wgpuSamplerRelease,
		wgpuShaderModuleRelease: _wgpuShaderModuleRelease, wgpuSurfaceRelease: _wgpuSurfaceRelease,
		wgpuTextureCreateView: _wgpuTextureCreateView, wgpuTextureRelease: _wgpuTextureRelease,
		wgpuTextureViewRelease: _wgpuTextureViewRelease,
	};

	const imports = { env: wasmImports, wasi_snapshot_preview1: wasmImports };
	const result = await WebAssembly.instantiate(wasmBinary, imports);
	const exports = result.instance.exports;

	setWasmMemory(exports.memory as WebAssembly.Memory);
	setWasmTable(exports.__indirect_function_table as WebAssembly.Table);
	setWasmExports(exports);
	updateMemoryViews();

	setStackFunctions(
		exports.emscripten_stack_get_current as () => number,
		exports._emscripten_stack_restore as (val: number) => void,
		exports._emscripten_stack_alloc as (size: number) => number,
	);

	(exports.emscripten_stack_init as () => void)();
	(exports.__wasm_call_ctors as () => void)();

	bindExports(exports);
	setMallocRef(_malloc);
	setFreeRef(_free);

	_initialized = true;
}
