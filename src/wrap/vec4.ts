/**
 * Vec4 Wrapper Class
 */

import { getValue } from "../init";
import {
	_wcn_math_Vec4_create_wasm, _wcn_math_Vec4_copy_wasm, _wcn_math_Vec4_zero_wasm, _wcn_math_Vec4_set_wasm,
	_wcn_math_Vec4_identity_wasm, _wcn_math_Vec4_ceil_wasm, _wcn_math_Vec4_floor_wasm, _wcn_math_Vec4_round_wasm,
	_wcn_math_Vec4_clamp_wasm, _wcn_math_Vec4_add_wasm, _wcn_math_Vec4_add_scaled_wasm, _wcn_math_Vec4_sub_wasm,
	_wcn_math_Vec4_multiply_wasm, _wcn_math_Vec4_multiply_scalar_wasm, _wcn_math_Vec4_div_wasm,
	_wcn_math_Vec4_div_scalar_wasm, _wcn_math_Vec4_inverse_wasm, _wcn_math_Vec4_dot_wasm,
	_wcn_math_Vec4_length_wasm, _wcn_math_Vec4_length_squared_wasm, _wcn_math_Vec4_distance_wasm,
	_wcn_math_Vec4_distance_squared_wasm, _wcn_math_Vec4_normalize_wasm, _wcn_math_Vec4_negate_wasm,
	_wcn_math_Vec4_lerp_wasm, _wcn_math_Vec4_lerp_v_wasm, _wcn_math_Vec4_fmax_wasm, _wcn_math_Vec4_fmin_wasm,
	_wcn_math_Vec4_equals_wasm, _wcn_math_Vec4_equals_approximately_wasm, _wcn_math_Vec4_set_length_wasm,
	_wcn_math_Vec4_truncate_wasm, _wcn_math_Vec4_midpoint_wasm, _wcn_math_Vec4_transform_mat4_wasm,
} from "../init";
import type { Vec4Ptr } from "../type";
import { SIZE_F32, SIZE_VEC4, mallocAligned, freeAligned, getHEAPF32 } from "./math-common";
import type { Mat4 } from "./mat4";

export class Vec4 {
	ptr: Vec4Ptr;
	private constructor(ptr: Vec4Ptr) { this.ptr = ptr; }

	static create(x: number, y: number, z: number, w: number): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_create_wasm(ptr, x, y, z, w); return new Vec4(ptr); }
	static zero(): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_zero_wasm(ptr); return new Vec4(ptr); }
	static copy(v: Vec4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_copy_wasm(ptr, v.ptr); return new Vec4(ptr); }
	static identity(): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_identity_wasm(ptr); return new Vec4(ptr); }

	free(): void { freeAligned(this.ptr); }
	get x(): number { return getValue(this.ptr, "float") as number; }
	get y(): number { return getValue(this.ptr + SIZE_F32, "float") as number; }
	get z(): number { return getValue(this.ptr + SIZE_F32 * 2, "float") as number; }
	get w(): number { return getValue(this.ptr + SIZE_F32 * 3, "float") as number; }
	set(x: number, y: number, z: number, w: number): this { _wcn_math_Vec4_set_wasm(this.ptr, x, y, z, w); return this; }

	add(other: Vec4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_add_wasm(ptr, this.ptr, other.ptr); return new Vec4(ptr); }
	addScaled(other: Vec4, scale: number): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_add_scaled_wasm(ptr, this.ptr, other.ptr, scale); return new Vec4(ptr); }
	sub(other: Vec4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_sub_wasm(ptr, this.ptr, other.ptr); return new Vec4(ptr); }
	multiply(other: Vec4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_multiply_wasm(ptr, this.ptr, other.ptr); return new Vec4(ptr); }
	multiplyScalar(scalar: number): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_multiply_scalar_wasm(ptr, this.ptr, scalar); return new Vec4(ptr); }
	div(other: Vec4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_div_wasm(ptr, this.ptr, other.ptr); return new Vec4(ptr); }
	divScalar(scalar: number): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_div_scalar_wasm(ptr, this.ptr, scalar); return new Vec4(ptr); }
	inverse(): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_inverse_wasm(ptr, this.ptr); return new Vec4(ptr); }
	dot(other: Vec4): number { return _wcn_math_Vec4_dot_wasm(this.ptr, other.ptr); }
	length(): number { return _wcn_math_Vec4_length_wasm(this.ptr); }
	lengthSquared(): number { return _wcn_math_Vec4_length_squared_wasm(this.ptr); }
	distance(other: Vec4): number { return _wcn_math_Vec4_distance_wasm(this.ptr, other.ptr); }
	distanceSquared(other: Vec4): number { return _wcn_math_Vec4_distance_squared_wasm(this.ptr, other.ptr); }

	normalize(): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_normalize_wasm(ptr, this.ptr); return new Vec4(ptr); }
	negate(): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_negate_wasm(ptr, this.ptr); return new Vec4(ptr); }
	lerp(other: Vec4, t: number): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_lerp_wasm(ptr, this.ptr, other.ptr, t); return new Vec4(ptr); }
	lerpV(other: Vec4, t: Vec4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_lerp_v_wasm(ptr, this.ptr, other.ptr, t.ptr); return new Vec4(ptr); }
	fmax(other: Vec4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_fmax_wasm(ptr, this.ptr, other.ptr); return new Vec4(ptr); }
	fmin(other: Vec4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_fmin_wasm(ptr, this.ptr, other.ptr); return new Vec4(ptr); }
	equals(other: Vec4): boolean { return _wcn_math_Vec4_equals_wasm(this.ptr, other.ptr) !== 0; }
	equalsApproximately(other: Vec4): boolean { return _wcn_math_Vec4_equals_approximately_wasm(this.ptr, other.ptr) !== 0; }
	ceil(): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_ceil_wasm(ptr, this.ptr); return new Vec4(ptr); }
	floor(): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_floor_wasm(ptr, this.ptr); return new Vec4(ptr); }
	round(): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_round_wasm(ptr, this.ptr); return new Vec4(ptr); }
	clamp(min: number, max: number): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_clamp_wasm(ptr, this.ptr, min, max); return new Vec4(ptr); }
	setLength(len: number): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_set_length_wasm(ptr, this.ptr, len); return new Vec4(ptr); }
	truncate(maxLen: number): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_truncate_wasm(ptr, this.ptr, maxLen); return new Vec4(ptr); }
	midpoint(other: Vec4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_midpoint_wasm(ptr, this.ptr, other.ptr); return new Vec4(ptr); }
	transformMat4(mat: Mat4): Vec4 { const ptr = mallocAligned(SIZE_VEC4, 16) as Vec4Ptr; _wcn_math_Vec4_transform_mat4_wasm(ptr, this.ptr, mat.ptr); return new Vec4(ptr); }
	toArray(): [number, number, number, number] { return [this.x, this.y, this.z, this.w]; }
	toF32Array(): Float32Array { const heap = getHEAPF32(); return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 4); }
	toString(): string { return `[${this.x}, ${this.y}, ${this.z}, ${this.w}]`; }
}
