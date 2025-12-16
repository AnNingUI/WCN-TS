/**
 * 内存视图和值读写
 */

export let HEAP8: Int8Array;
export let HEAP16: Int16Array;
export let HEAP32: Int32Array;
export let HEAPU8: Uint8Array;
export let HEAPU16: Uint16Array;
export let HEAPU32: Uint32Array;
export let HEAPF32: Float32Array;
export let HEAPF64: Float64Array;
export let HEAP64: BigInt64Array;
export let HEAPU64: BigUint64Array;

export let wasmMemory: WebAssembly.Memory;
export let wasmExports: WebAssembly.Exports;
export let wasmTable: WebAssembly.Table;

export function setWasmMemory(memory: WebAssembly.Memory): void {
	wasmMemory = memory;
}

export function setWasmExports(exports: WebAssembly.Exports): void {
	wasmExports = exports;
}

export function setWasmTable(table: WebAssembly.Table): void {
	wasmTable = table;
}

export function updateMemoryViews(): void {
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

// Getter functions for latest memory views
export function getHEAP8(): Int8Array { return HEAP8; }
export function getHEAP16(): Int16Array { return HEAP16; }
export function getHEAP32(): Int32Array { return HEAP32; }
export function getHEAPU8(): Uint8Array { return HEAPU8; }
export function getHEAPU16(): Uint16Array { return HEAPU16; }
export function getHEAPU32(): Uint32Array { return HEAPU32; }
export function getHEAPF32(): Float32Array { return HEAPF32; }
export function getHEAPF64(): Float64Array { return HEAPF64; }
export function getHEAP64(): BigInt64Array { return HEAP64; }
export function getHEAPU64(): BigUint64Array { return HEAPU64; }

export function setValue(ptr: number, value: number | bigint, type: string): void {
	switch (type) {
		case "i8": HEAP8[ptr] = value as number; break;
		case "i16": HEAP16[ptr >> 1] = value as number; break;
		case "i32": HEAP32[ptr >> 2] = value as number; break;
		case "i64": HEAP64[ptr >> 3] = BigInt(value); break;
		case "float": HEAPF32[ptr >> 2] = value as number; break;
		case "double": HEAPF64[ptr >> 3] = value as number; break;
		case "*": HEAPU32[ptr >> 2] = value as number; break;
	}
}

export function getValue(ptr: number, type: string): number | bigint {
	switch (type) {
		case "i8": return HEAP8[ptr];
		case "i16": return HEAP16[ptr >> 1];
		case "i32": return HEAP32[ptr >> 2];
		case "i64": return HEAP64[ptr >> 3];
		case "float": return HEAPF32[ptr >> 2];
		case "double": return HEAPF64[ptr >> 3];
		case "*": return HEAPU32[ptr >> 2];
		default: return 0;
	}
}
