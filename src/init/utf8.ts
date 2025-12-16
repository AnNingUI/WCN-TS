/**
 * UTF8 编解码
 */

import { HEAPU8 } from "./memory";

const UTF8Decoder = new TextDecoder();

export function UTF8ArrayToString(heap: Uint8Array, idx: number, maxBytes = Infinity): string {
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
		else if (c >= 55296 && c <= 57343) { len += 4; ++i; }
		else len += 3;
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
