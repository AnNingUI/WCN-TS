/**
 * WGPU 绑定函数
 */

import { HEAPU8, HEAPU32, HEAP32 } from "./memory";
import { UTF8ToString } from "./utf8";
import { WebGPU } from "./webgpu";

export const _wgpuBindGroupLayoutRelease = (id: number) => WebGPU.mgrBindGroupLayout.release(id);
export const _wgpuBindGroupRelease = (id: number) => WebGPU.mgrBindGroup.release(id);

export const _wgpuBufferDestroy = (bufferId: number) => {
	const wrapper = WebGPU.mgrBuffer.objects[bufferId];
	if (wrapper?.onUnmap) {
		wrapper.onUnmap.forEach((fn) => fn());
		wrapper.onUnmap = undefined;
	}
	WebGPU.mgrBuffer.get(bufferId)?.destroy();
};

export const _wgpuBufferRelease = (id: number) => WebGPU.mgrBuffer.release(id);
export const _wgpuCommandBufferRelease = (id: number) => WebGPU.mgrCommandBuffer.release(id);

export const _wgpuCommandEncoderBeginComputePass = (encoderId: number, descriptor: number): number => {
	const commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
	if (!commandEncoder) return 0;
	let desc: GPUComputePassDescriptor | undefined;
	if (descriptor) {
		const labelPtr = HEAPU32[(descriptor + 4) >> 2];
		desc = { label: labelPtr ? UTF8ToString(labelPtr) : undefined };
	}
	return WebGPU.mgrComputePassEncoder.create(commandEncoder.beginComputePass(desc));
};

export const _wgpuCommandEncoderFinish = (encoderId: number): number => {
	const commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
	if (!commandEncoder) return 0;
	return WebGPU.mgrCommandBuffer.create(commandEncoder.finish());
};

export const _wgpuCommandEncoderRelease = (id: number) => WebGPU.mgrCommandEncoder.release(id);

export const _wgpuComputePassEncoderDispatchWorkgroups = (passId: number, x: number, y: number, z: number) => {
	WebGPU.mgrComputePassEncoder.get(passId)?.dispatchWorkgroups(x, y, z);
};

export const _wgpuComputePassEncoderEnd = (passId: number) => {
	WebGPU.mgrComputePassEncoder.get(passId)?.end();
};

export const _wgpuComputePassEncoderSetBindGroup = (
	passId: number, groupIndex: number, groupId: number, dynamicOffsetCount: number, dynamicOffsetsPtr: number,
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

export const _wgpuComputePassEncoderSetPipeline = (passId: number, pipelineId: number) => {
	const pass = WebGPU.mgrComputePassEncoder.get(passId);
	const pipeline = WebGPU.mgrComputePipeline.get(pipelineId);
	if (pass && pipeline) pass.setPipeline(pipeline);
};

export const _wgpuComputePipelineRelease = (id: number) => WebGPU.mgrComputePipeline.release(id);

export const _wgpuDeviceCreateCommandEncoder = (deviceId: number, descriptor: number): number => {
	const device = WebGPU.mgrDevice.get(deviceId);
	if (!device) return 0;
	let desc: GPUCommandEncoderDescriptor | undefined;
	if (descriptor) {
		const labelPtr = HEAPU32[(descriptor + 4) >> 2];
		desc = { label: labelPtr ? UTF8ToString(labelPtr) : undefined };
	}
	return WebGPU.mgrCommandEncoder.create(device.createCommandEncoder(desc));
};

export const _wgpuDeviceCreateTexture = (deviceId: number, descriptor: number): number => {
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

export const _wgpuDeviceGetQueue = (deviceId: number): number => {
	const queueId = WebGPU.mgrDevice.objects[deviceId]?.queueId;
	if (queueId) WebGPU.mgrQueue.reference(queueId);
	return queueId ?? 0;
};

export const _wgpuDeviceRelease = (id: number) => WebGPU.mgrDevice.release(id);
export const _wgpuPipelineLayoutRelease = (id: number) => WebGPU.mgrPipelineLayout.release(id);
export const _wgpuQueueRelease = (id: number) => WebGPU.mgrQueue.release(id);

export const _wgpuQueueSubmit = (queueId: number, commandCount: number, commands: number) => {
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

export const _wgpuQueueWriteBuffer = (
	queueId: number, bufferId: number, bufferOffset: bigint, data: number, size: number,
) => {
	const queue = WebGPU.mgrQueue.get(queueId);
	const buffer = WebGPU.mgrBuffer.get(bufferId);
	if (!queue || !buffer) return;
	queue.writeBuffer(buffer, Number(bufferOffset), HEAPU8.slice(data, data + size), 0, size);
};

export const _wgpuRenderPassEncoderDraw = (
	passId: number, vertexCount: number, instanceCount: number, firstVertex: number, firstInstance: number,
) => {
	WebGPU.mgrRenderPassEncoder.get(passId)?.draw(vertexCount, instanceCount, firstVertex, firstInstance);
};

export const _wgpuRenderPassEncoderEnd = (encoderId: number) => {
	WebGPU.mgrRenderPassEncoder.get(encoderId)?.end();
};

export const _wgpuRenderPassEncoderRelease = (id: number) => WebGPU.mgrRenderPassEncoder.release(id);

export const _wgpuRenderPassEncoderSetBindGroup = (
	passId: number, groupIndex: number, groupId: number, dynamicOffsetCount: number, dynamicOffsetsPtr: number,
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

export const _wgpuRenderPassEncoderSetPipeline = (passId: number, pipelineId: number) => {
	const pass = WebGPU.mgrRenderPassEncoder.get(passId);
	const pipeline = WebGPU.mgrRenderPipeline.get(pipelineId);
	if (pass && pipeline) pass.setPipeline(pipeline);
};

export const _wgpuRenderPassEncoderSetVertexBuffer = (
	passId: number, slot: number, bufferId: number, offset: bigint, size: bigint,
) => {
	const pass = WebGPU.mgrRenderPassEncoder.get(passId);
	const buffer = WebGPU.mgrBuffer.get(bufferId);
	if (!pass || !buffer) return;
	const sizeNum = Number(size);
	pass.setVertexBuffer(slot, buffer, Number(offset), sizeNum === -1 ? undefined : sizeNum);
};

export const _wgpuRenderPipelineRelease = (id: number) => WebGPU.mgrRenderPipeline.release(id);
export const _wgpuSamplerRelease = (id: number) => WebGPU.mgrSampler.release(id);
export const _wgpuShaderModuleRelease = (id: number) => WebGPU.mgrShaderModule.release(id);
export const _wgpuSurfaceRelease = (id: number) => WebGPU.mgrSurface.release(id);

export const _wgpuTextureCreateView = (textureId: number, descriptor: number): number => {
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
			dimension: WebGPU.TextureViewDimension[HEAPU32[(descriptor + 12) >> 2]] as GPUTextureViewDimension,
			baseMipLevel: HEAPU32[(descriptor + 16) >> 2],
			mipLevelCount: mipLevelCount === 0xffffffff ? undefined : mipLevelCount,
			baseArrayLayer: HEAPU32[(descriptor + 24) >> 2],
			arrayLayerCount: arrayLayerCount === 0xffffffff ? undefined : arrayLayerCount,
			aspect: WebGPU.TextureAspect[HEAPU32[(descriptor + 32) >> 2]] as GPUTextureAspect,
		};
	}

	return WebGPU.mgrTextureView.create(texture.createView(desc));
};

export const _wgpuTextureRelease = (id: number) => WebGPU.mgrTexture.release(id);
export const _wgpuTextureViewRelease = (id: number) => WebGPU.mgrTextureView.release(id);

export const _emscripten_webgpu_get_device = (): number => {
	if (WebGPU.preinitializedDeviceId === undefined) {
		const device = (globalThis as unknown as { preinitializedWebGPUDevice: GPUDevice }).preinitializedWebGPUDevice;
		if (!device) return 0;
		const queueId = WebGPU.mgrQueue.create(device.queue);
		WebGPU.preinitializedDeviceId = WebGPU.mgrDevice.create(device, { queueId });
	}
	WebGPU.mgrDevice.reference(WebGPU.preinitializedDeviceId);
	return WebGPU.preinitializedDeviceId;
};
