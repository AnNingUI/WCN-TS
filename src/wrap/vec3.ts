/**
 * Vec3 Wrapper Class
 */

import { getValue } from "../init";
import {
	_wcn_math_Vec3_create_wasm, _wcn_math_Vec3_copy_wasm, _wcn_math_Vec3_zero_wasm, _wcn_math_Vec3_set_wasm,
	_wcn_math_Vec3_identity_wasm, _wcn_math_Vec3_ceil_wasm, _wcn_math_Vec3_floor_wasm, _wcn_math_Vec3_round_wasm,
	_wcn_math_Vec3_clamp_wasm, _wcn_math_Vec3_add_wasm, _wcn_math_Vec3_add_scaled_wasm, _wcn_math_Vec3_sub_wasm,
	_wcn_math_Vec3_multiply_wasm, _wcn_math_Vec3_multiply_scalar_wasm, _wcn_math_Vec3_div_wasm,
	_wcn_math_Vec3_div_scalar_wasm, _wcn_math_Vec3_inverse_wasm, _wcn_math_Vec3_cross_wasm, _wcn_math_Vec3_dot_wasm,
	_wcn_math_Vec3_length_wasm, _wcn_math_Vec3_length_squared_wasm, _wcn_math_Vec3_distance_wasm,
	_wcn_math_Vec3_distance_squared_wasm, _wcn_math_Vec3_normalize_wasm, _wcn_math_Vec3_negate_wasm,
	_wcn_math_Vec3_lerp_wasm, _wcn_math_Vec3_lerp_v_wasm, _wcn_math_Vec3_fmax_wasm, _wcn_math_Vec3_fmin_wasm,
	_wcn_math_Vec3_angle_wasm, _wcn_math_Vec3_equals_wasm, _wcn_math_Vec3_equals_approximately_wasm,
	_wcn_math_Vec3_random_wasm, _wcn_math_Vec3_set_length_wasm, _wcn_math_Vec3_truncate_wasm,
	_wcn_math_Vec3_midpoint_wasm, _wcn_math_Vec3_scale_wasm, _wcn_math_Vec3_rotate_x_wasm,
	_wcn_math_Vec3_rotate_y_wasm, _wcn_math_Vec3_rotate_z_wasm, _wcn_math_Vec3_transform_mat4_wasm,
	_wcn_math_Vec3_transform_mat3_wasm, _wcn_math_Vec3_transform_quat_wasm,
} from "../init";
import type { Vec3Ptr } from "../type";
import { SIZE_F32, SIZE_VEC3, _malloc, _free, getHEAPF32 } from "./math-common";
import type { Mat3 } from "./mat3";
import type { Mat4 } from "./mat4";
import type { Quat } from "./quat";

export class Vec3 {
	ptr: Vec3Ptr;
	private constructor(ptr: Vec3Ptr) { this.ptr = ptr; }
	static _fromPtr(ptr: Vec3Ptr): Vec3 { return new Vec3(ptr); }

	static create(x: number, y: number, z: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_create_wasm(ptr, x, y, z); return new Vec3(ptr); }
	static zero(): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_zero_wasm(ptr); return new Vec3(ptr); }
	static copy(v: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_copy_wasm(ptr, v.ptr); return new Vec3(ptr); }
	static identity(): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_identity_wasm(ptr); return new Vec3(ptr); }
	static random(scale = 1): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_random_wasm(ptr, scale); return new Vec3(ptr); }

	free(): void { _free(this.ptr); }
	get x(): number { return getValue(this.ptr, "float") as number; }
	set x(value: number) { _wcn_math_Vec3_set_wasm(this.ptr, value, this.y, this.z); }
	get y(): number { return getValue(this.ptr + SIZE_F32, "float") as number; }
	set y(value: number) { _wcn_math_Vec3_set_wasm(this.ptr, this.x, value, this.z); }
	get z(): number { return getValue(this.ptr + SIZE_F32 * 2, "float") as number; }
	set z(value: number) { _wcn_math_Vec3_set_wasm(this.ptr, this.x, this.y, value); }
	set(x: number, y: number, z: number): this { _wcn_math_Vec3_set_wasm(this.ptr, x, y, z); return this; }

	add(other: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_add_wasm(ptr, this.ptr, other.ptr); return new Vec3(ptr); }
	sub(other: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_sub_wasm(ptr, this.ptr, other.ptr); return new Vec3(ptr); }
	cross(other: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_cross_wasm(ptr, this.ptr, other.ptr); return new Vec3(ptr); }
	dot(other: Vec3): number { return _wcn_math_Vec3_dot_wasm(this.ptr, other.ptr); }
	length(): number { return _wcn_math_Vec3_length_wasm(this.ptr); }
	lengthSquared(): number { return _wcn_math_Vec3_length_squared_wasm(this.ptr); }
	distance(other: Vec3): number { return _wcn_math_Vec3_distance_wasm(this.ptr, other.ptr); }
	distanceSquared(other: Vec3): number { return _wcn_math_Vec3_distance_squared_wasm(this.ptr, other.ptr); }
	normalize(): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_normalize_wasm(ptr, this.ptr); return new Vec3(ptr); }
	negate(): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_negate_wasm(ptr, this.ptr); return new Vec3(ptr); }
	lerp(other: Vec3, t: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_lerp_wasm(ptr, this.ptr, other.ptr, t); return new Vec3(ptr); }
	lerpV(other: Vec3, t: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_lerp_v_wasm(ptr, this.ptr, other.ptr, t.ptr); return new Vec3(ptr); }
	equals(other: Vec3): boolean { return _wcn_math_Vec3_equals_wasm(this.ptr, other.ptr) !== 0; }
	equalsApproximately(other: Vec3): boolean { return _wcn_math_Vec3_equals_approximately_wasm(this.ptr, other.ptr) !== 0; }
	ceil(): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_ceil_wasm(ptr, this.ptr); return new Vec3(ptr); }
	floor(): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_floor_wasm(ptr, this.ptr); return new Vec3(ptr); }
	round(): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_round_wasm(ptr, this.ptr); return new Vec3(ptr); }
	clamp(min: number, max: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_clamp_wasm(ptr, this.ptr, min, max); return new Vec3(ptr); }
	addScaled(other: Vec3, scale: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_add_scaled_wasm(ptr, this.ptr, other.ptr, scale); return new Vec3(ptr); }
	multiply(other: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_multiply_wasm(ptr, this.ptr, other.ptr); return new Vec3(ptr); }
	multiplyScalar(scalar: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_multiply_scalar_wasm(ptr, this.ptr, scalar); return new Vec3(ptr); }
	div(other: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_div_wasm(ptr, this.ptr, other.ptr); return new Vec3(ptr); }
	divScalar(scalar: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_div_scalar_wasm(ptr, this.ptr, scalar); return new Vec3(ptr); }
	inverse(): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_inverse_wasm(ptr, this.ptr); return new Vec3(ptr); }
	fmax(other: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_fmax_wasm(ptr, this.ptr, other.ptr); return new Vec3(ptr); }
	fmin(other: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_fmin_wasm(ptr, this.ptr, other.ptr); return new Vec3(ptr); }
	angle(other: Vec3): number { return _wcn_math_Vec3_angle_wasm(this.ptr, other.ptr); }
	setLength(len: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_set_length_wasm(ptr, this.ptr, len); return new Vec3(ptr); }
	truncate(maxLen: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_truncate_wasm(ptr, this.ptr, maxLen); return new Vec3(ptr); }
	midpoint(other: Vec3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_midpoint_wasm(ptr, this.ptr, other.ptr); return new Vec3(ptr); }
	scale(s: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_scale_wasm(ptr, this.ptr, s); return new Vec3(ptr); }
	rotateX(origin: Vec3, rad: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_rotate_x_wasm(ptr, this.ptr, origin.ptr, rad); return new Vec3(ptr); }
	rotateY(origin: Vec3, rad: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_rotate_y_wasm(ptr, this.ptr, origin.ptr, rad); return new Vec3(ptr); }
	rotateZ(origin: Vec3, rad: number): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_rotate_z_wasm(ptr, this.ptr, origin.ptr, rad); return new Vec3(ptr); }
	transformMat4(mat: Mat4): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_transform_mat4_wasm(ptr, this.ptr, mat.ptr); return new Vec3(ptr); }
	transformMat3(mat: Mat3): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_transform_mat3_wasm(ptr, this.ptr, mat.ptr); return new Vec3(ptr); }
	transformQuat(quat: Quat): Vec3 { const ptr = _malloc(SIZE_VEC3) as Vec3Ptr; _wcn_math_Vec3_transform_quat_wasm(ptr, this.ptr, quat.ptr); return new Vec3(ptr); }
	toArray(): [number, number, number] { return [this.x, this.y, this.z]; }
	toF32Array(): Float32Array { const heap = getHEAPF32(); return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 3); }
	toString(): string { return `[${this.x}, ${this.y}, ${this.z}]`; }
}

// Register Vec3 globally for Vec2.cross
(globalThis as unknown as { Vec3: typeof Vec3 }).Vec3 = Vec3;
