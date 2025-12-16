/**
 * WCN Init Module - Barrel Export
 */

// 类型
export type { WCNContextPtr, CStringPtr, VoidPtr } from "./exports";
export type { CreateWCNOptions } from "./create-wcn";

// 内存
export {
	HEAP8, HEAP16, HEAP32, HEAPU8, HEAPU16, HEAPU32, HEAPF32, HEAPF64, HEAP64, HEAPU64,
	getHEAP8, getHEAP16, getHEAP32, getHEAPU8, getHEAPU16, getHEAPU32, getHEAPF32, getHEAPF64, getHEAP64, getHEAPU64,
	setValue, getValue, updateMemoryViews,
} from "./memory";

// UTF8
export { UTF8ToString, lengthBytesUTF8, stringToUTF8, UTF8ArrayToString } from "./utf8";

// 栈
export { stackSave, stackRestore, stackAlloc, stringToUTF8OnStack } from "./stack";

// WebGPU
export { storeWGPUTextureView, getWGPUTextureView } from "./webgpu";

// 导出函数
export * from "./exports";

// 初始化
export { createWCN } from "./create-wcn";
