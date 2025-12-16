/**
 * Math 类型通用常量和辅助函数
 */

import { _malloc, _free, getHEAPF32 } from "../init";

export const SIZE_F32 = 4;
export const SIZE_VEC2 = 8;
export const SIZE_VEC3 = 12;
export const SIZE_VEC4 = 16;
export const SIZE_MAT3 = 48;
export const SIZE_MAT4 = 64;
export const SIZE_QUAT = 16;

// 存储原始指针的映射，用于正确释放
const alignedPtrMap = new Map<number, number>();

export function mallocAligned(size: number, alignment: number): number {
	const rawPtr = _malloc(size + alignment - 1);
	const alignedPtr = (rawPtr + alignment - 1) & ~(alignment - 1);
	alignedPtrMap.set(alignedPtr, rawPtr);
	return alignedPtr;
}

export function freeAligned(alignedPtr: number): void {
	const rawPtr = alignedPtrMap.get(alignedPtr);
	if (rawPtr !== undefined) {
		_free(rawPtr);
		alignedPtrMap.delete(alignedPtr);
	} else {
		_free(alignedPtr);
	}
}

export { _malloc, _free, getHEAPF32 };
