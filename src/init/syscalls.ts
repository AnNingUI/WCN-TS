/**
 * 系统调用存根
 */

import { HEAPU8, HEAPU32, wasmMemory, updateMemoryViews } from "./memory";
import { UTF8ArrayToString } from "./utf8";

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

export const _fd_close = () => 0;
export const _fd_seek = () => 70;

export const _fd_write = (fd: number, iov: number, iovcnt: number, pnum: number): number => {
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

export const __abort_js = () => {
	throw new Error("abort");
};

export const _emscripten_resize_heap = (requestedSize: number): boolean => {
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
		} catch { /* continue */ }
	}
	return false;
};

export const segfault = () => { throw new Error("segmentation fault"); };
export const alignfault = () => { throw new Error("alignment fault"); };
