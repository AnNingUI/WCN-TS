/**
 * 栈操作
 */

import { lengthBytesUTF8, stringToUTF8 } from "./utf8";

export let stackSave: () => number;
export let stackRestore: (val: number) => void;
export let stackAlloc: (size: number) => number;

export function setStackFunctions(
	save: () => number,
	restore: (val: number) => void,
	alloc: (size: number) => number,
): void {
	stackSave = save;
	stackRestore = restore;
	stackAlloc = alloc;
}

export function stringToUTF8OnStack(str: string): number {
	const size = lengthBytesUTF8(str) + 1;
	const ret = stackAlloc(size);
	stringToUTF8(str, ret, size);
	return ret;
}
