/**
 * Vec2 Wrapper Class
 */

import { getValue } from "../init";
import {
	_wcn_math_Vec2_create_wasm, _wcn_math_Vec2_copy_wasm, _wcn_math_Vec2_zero_wasm, _wcn_math_Vec2_set_wasm,
	_wcn_math_Vec2_identity_wasm, _wcn_math_Vec2_ceil_wasm, _wcn_math_Vec2_floor_wasm, _wcn_math_Vec2_round_wasm,
	_wcn_math_Vec2_clamp_wasm, _wcn_math_Vec2_add_wasm, _wcn_math_Vec2_add_scaled_wasm, _wcn_math_Vec2_sub_wasm,
	_wcn_math_Vec2_multiply_wasm, _wcn_math_Vec2_multiply_scalar_wasm, _wcn_math_Vec2_div_wasm,
	_wcn_math_Vec2_div_scalar_wasm, _wcn_math_Vec2_inverse_wasm, _wcn_math_Vec2_dot_wasm, _wcn_math_Vec2_cross_wasm,
	_wcn_math_Vec2_length_wasm, _wcn_math_Vec2_length_squared_wasm, _wcn_math_Vec2_distance_wasm,
	_wcn_math_Vec2_distance_squared_wasm, _wcn_math_Vec2_normalize_wasm, _wcn_math_Vec2_negate_wasm,
	_wcn_math_Vec2_lerp_wasm, _wcn_math_Vec2_lerp_v_wasm, _wcn_math_Vec2_fmax_wasm, _wcn_math_Vec2_fmin_wasm,
	_wcn_math_Vec2_angle_wasm, _wcn_math_Vec2_equals_wasm, _wcn_math_Vec2_equals_approximately_wasm,
	_wcn_math_Vec2_random_wasm, _wcn_math_Vec2_rotate_wasm, _wcn_math_Vec2_set_length_wasm,
	_wcn_math_Vec2_truncate_wasm, _wcn_math_Vec2_midpoint_wasm, _wcn_math_Vec2_scale_wasm,
	_wcn_math_Vec2_transform_mat3_wasm, _wcn_math_Vec2_transform_mat4_wasm,
} from "../init";
import type { Vec2Ptr, Vec3Ptr } from "../type";
import { SIZE_F32, SIZE_VEC2, SIZE_VEC3, _malloc, _free, getHEAPF32 } from "./math-common";
import type { Vec3 } from "./vec3";
import type { Mat3 } from "./mat3";
import type { Mat4 } from "./mat4";

export class Vec2 {
	ptr: Vec2Ptr;
	private constructor(ptr: Vec2Ptr) { this.ptr = ptr; }

	static create(x: number, y: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_create_wasm(ptr, x, y); return new Vec2(ptr); }
	static zero(): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_zero_wasm(ptr); return new Vec2(ptr); }
	static copy(v: Vec2): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_copy_wasm(ptr, v.ptr); return new Vec2(ptr); }
	static identity(): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_identity_wasm(ptr); return new Vec2(ptr); }
	static random(scale = 1): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_random_wasm(ptr, scale); return new Vec2(ptr); }

	free(): void { _free(this.ptr); }
	get x(): number { return getValue(this.ptr, "float") as number; }
	set x(value: number) { _wcn_math_Vec2_set_wasm(this.ptr, value, this.y); }
	get y(): number { return getValue(this.ptr + SIZE_F32, "float") as number; }
	set y(value: number) { _wcn_math_Vec2_set_wasm(this.ptr, this.x, value); }
	set(x: number, y: number): this { _wcn_math_Vec2_set_wasm(this.ptr, x, y); return this; }

	add(other: Vec2): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_add_wasm(ptr, this.ptr, other.ptr); return new Vec2(ptr); }
	sub(other: Vec2): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_sub_wasm(ptr, this.ptr, other.ptr); return new Vec2(ptr); }
	multiply(other: Vec2): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_multiply_wasm(ptr, this.ptr, other.ptr); return new Vec2(ptr); }
	multiplyScalar(scalar: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_multiply_scalar_wasm(ptr, this.ptr, scalar); return new Vec2(ptr); }
	div(other: Vec2): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_div_wasm(ptr, this.ptr, other.ptr); return new Vec2(ptr); }
	divScalar(scalar: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_div_scalar_wasm(ptr, this.ptr, scalar); return new Vec2(ptr); }
	dot(other: Vec2): number { return _wcn_math_Vec2_dot_wasm(this.ptr, other.ptr); }
	cross(other: Vec2): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec2_cross_wasm(ptr, this.ptr, other.ptr); return (globalThis as unknown as { Vec3: { _fromPtr: (p: Vec3Ptr) => Vec3 } }).Vec3._fromPtr(ptr); }
	length(): number { return _wcn_math_Vec2_length_wasm(this.ptr); }
	lengthSquared(): number { return _wcn_math_Vec2_length_squared_wasm(this.ptr); }
	distance(other: Vec2): number { return _wcn_math_Vec2_distance_wasm(this.ptr, other.ptr); }
	distanceSquared(other: Vec2): number { return _wcn_math_Vec2_distance_squared_wasm(this.ptr, other.ptr); }
	normalize(): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_normalize_wasm(ptr, this.ptr); return new Vec2(ptr); }
	negate(): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_negate_wasm(ptr, this.ptr); return new Vec2(ptr); }
	lerp(other: Vec2, t: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_lerp_wasm(ptr, this.ptr, other.ptr, t); return new Vec2(ptr); }
	lerpV(other: Vec2, t: Vec2): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_lerp_v_wasm(ptr, this.ptr, other.ptr, t.ptr); return new Vec2(ptr); }
	equals(other: Vec2): boolean { return _wcn_math_Vec2_equals_wasm(this.ptr, other.ptr) !== 0; }
	equalsApproximately(other: Vec2): boolean { return _wcn_math_Vec2_equals_approximately_wasm(this.ptr, other.ptr) !== 0; }
	ceil(): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_ceil_wasm(ptr, this.ptr); return new Vec2(ptr); }
	floor(): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_floor_wasm(ptr, this.ptr); return new Vec2(ptr); }
	round(): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_round_wasm(ptr, this.ptr); return new Vec2(ptr); }
	clamp(min: number, max: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_clamp_wasm(ptr, this.ptr, min, max); return new Vec2(ptr); }
	addScaled(other: Vec2, scale: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_add_scaled_wasm(ptr, this.ptr, other.ptr, scale); return new Vec2(ptr); }
	inverse(): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_inverse_wasm(ptr, this.ptr); return new Vec2(ptr); }
	fmax(other: Vec2): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_fmax_wasm(ptr, this.ptr, other.ptr); return new Vec2(ptr); }
	fmin(other: Vec2): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_fmin_wasm(ptr, this.ptr, other.ptr); return new Vec2(ptr); }
	angle(other: Vec2): number { return _wcn_math_Vec2_angle_wasm(this.ptr, other.ptr); }
	rotate(origin: Vec2, rad: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_rotate_wasm(ptr, this.ptr, origin.ptr, rad); return new Vec2(ptr); }
	setLength(len: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_set_length_wasm(ptr, this.ptr, len); return new Vec2(ptr); }
	truncate(maxLen: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_truncate_wasm(ptr, this.ptr, maxLen); return new Vec2(ptr); }
	midpoint(other: Vec2): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_midpoint_wasm(ptr, this.ptr, other.ptr); return new Vec2(ptr); }
	scale(s: number): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_scale_wasm(ptr, this.ptr, s); return new Vec2(ptr); }
	transformMat3(mat: Mat3): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_transform_mat3_wasm(ptr, this.ptr, mat.ptr); return new Vec2(ptr); }
	transformMat4(mat: Mat4): Vec2 { const ptr = _malloc(SIZE_VEC2) as Vec2Ptr; _wcn_math_Vec2_transform_mat4_wasm(ptr, this.ptr, mat.ptr); return new Vec2(ptr); }
	toArray(): [number, number] { return [this.x, this.y]; }
	toF32Array(): Float32Array { const heap = getHEAPF32(); return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 2); }
	toString(): string { return `[${this.x}, ${this.y}]`; }
}
