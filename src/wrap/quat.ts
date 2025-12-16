/**
 * Quat Wrapper Class
 */

import { getValue } from "../init";
import {
	_wcn_math_Quat_identity_wasm, _wcn_math_Quat_copy_wasm, _wcn_math_Quat_zero_wasm,
	_wcn_math_Quat_dot_wasm, _wcn_math_Quat_lerp_wasm, _wcn_math_Quat_multiply_wasm,
	_wcn_math_Quat_multiply_scalar_wasm, _wcn_math_Quat_add_wasm, _wcn_math_Quat_sub_wasm,
	_wcn_math_Quat_normalize_wasm, _wcn_math_Quat_slerp_wasm, _wcn_math_Quat_sqlerp_wasm,
	_wcn_math_Quat_length_wasm, _wcn_math_Quat_length_squared_wasm, _wcn_math_Quat_equals_wasm,
	_wcn_math_Quat_equals_approximately_wasm, _wcn_math_Quat_angle_wasm, _wcn_math_Quat_rotation_to_wasm,
	_wcn_math_Quat_inverse_wasm, _wcn_math_Quat_conjugate_wasm, _wcn_math_Quat_div_scalar_wasm,
	_wcn_math_Quat_from_axis_angle_wasm, _wcn_math_Quat_from_euler_wasm, _wcn_math_Quat_from_mat4_wasm,
	_wcn_math_Quat_from_mat3_wasm, _wcn_math_Quat_rotate_x_wasm, _wcn_math_Quat_rotate_y_wasm,
	_wcn_math_Quat_rotate_z_wasm, _wcn_math_Quat_scale_wasm,
} from "../init";
import type { QuatPtr } from "../type";
import { RotationOrder } from "../type";
import { SIZE_F32, SIZE_QUAT, mallocAligned, freeAligned, getHEAPF32 } from "./math-common";
import type { Vec3 } from "./vec3";
import type { Mat3 } from "./mat3";
import type { Mat4 } from "./mat4";

export class Quat {
	ptr: QuatPtr;
	private constructor(ptr: QuatPtr) { this.ptr = ptr; }

	static identity(): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_identity_wasm(ptr); return new Quat(ptr); }
	static copy(q: Quat): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_copy_wasm(ptr, q.ptr); return new Quat(ptr); }
	static zero(): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_zero_wasm(ptr); return new Quat(ptr); }
	static fromAxisAngle(axis: Vec3, angle: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_from_axis_angle_wasm(ptr, axis.ptr, angle); return new Quat(ptr); }
	static fromEuler(x: number, y: number, z: number, order: RotationOrder = RotationOrder.XYZ): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_from_euler_wasm(ptr, x, y, z, order); return new Quat(ptr); }
	static fromMat4(m: Mat4): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_from_mat4_wasm(ptr, m.ptr); return new Quat(ptr); }
	static fromMat3(m: Mat3): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_from_mat3_wasm(ptr, m.ptr); return new Quat(ptr); }
	static rotationTo(a: Vec3, b: Vec3): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_rotation_to_wasm(ptr, a.ptr, b.ptr); return new Quat(ptr); }

	free(): void { freeAligned(this.ptr); }
	get x(): number { return getValue(this.ptr, "float") as number; }
	get y(): number { return getValue(this.ptr + SIZE_F32, "float") as number; }
	get z(): number { return getValue(this.ptr + SIZE_F32 * 2, "float") as number; }
	get w(): number { return getValue(this.ptr + SIZE_F32 * 3, "float") as number; }

	multiply(other: Quat): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_multiply_wasm(ptr, this.ptr, other.ptr); return new Quat(ptr); }
	multiplyScalar(scalar: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_multiply_scalar_wasm(ptr, this.ptr, scalar); return new Quat(ptr); }
	add(other: Quat): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_add_wasm(ptr, this.ptr, other.ptr); return new Quat(ptr); }
	sub(other: Quat): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_sub_wasm(ptr, this.ptr, other.ptr); return new Quat(ptr); }
	normalize(): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_normalize_wasm(ptr, this.ptr); return new Quat(ptr); }
	slerp(other: Quat, t: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_slerp_wasm(ptr, this.ptr, other.ptr, t); return new Quat(ptr); }

	sqlerp(b: Quat, c: Quat, d: Quat, t: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_sqlerp_wasm(ptr, this.ptr, b.ptr, c.ptr, d.ptr, t); return new Quat(ptr); }
	dot(other: Quat): number { return _wcn_math_Quat_dot_wasm(this.ptr, other.ptr); }
	lerp(other: Quat, t: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_lerp_wasm(ptr, this.ptr, other.ptr, t); return new Quat(ptr); }
	length(): number { return _wcn_math_Quat_length_wasm(this.ptr); }
	lengthSquared(): number { return _wcn_math_Quat_length_squared_wasm(this.ptr); }
	equals(other: Quat): boolean { return _wcn_math_Quat_equals_wasm(this.ptr, other.ptr) !== 0; }
	equalsApproximately(other: Quat): boolean { return _wcn_math_Quat_equals_approximately_wasm(this.ptr, other.ptr) !== 0; }
	angle(other: Quat): number { return _wcn_math_Quat_angle_wasm(this.ptr, other.ptr); }
	inverse(): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_inverse_wasm(ptr, this.ptr); return new Quat(ptr); }
	conjugate(): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_conjugate_wasm(ptr, this.ptr); return new Quat(ptr); }
	divScalar(scalar: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_div_scalar_wasm(ptr, this.ptr, scalar); return new Quat(ptr); }
	rotateX(rad: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_rotate_x_wasm(ptr, this.ptr, rad); return new Quat(ptr); }
	rotateY(rad: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_rotate_y_wasm(ptr, this.ptr, rad); return new Quat(ptr); }
	rotateZ(rad: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_rotate_z_wasm(ptr, this.ptr, rad); return new Quat(ptr); }
	scale(s: number): Quat { const ptr = mallocAligned(SIZE_QUAT, 16) as QuatPtr; _wcn_math_Quat_scale_wasm(ptr, this.ptr, s); return new Quat(ptr); }
	toMat4(): Mat4 { return (globalThis as unknown as { Mat4: { fromQuat: (q: Quat) => Mat4 } }).Mat4.fromQuat(this); }
	toMat3(): Mat3 { return (globalThis as unknown as { Mat3: { fromQuat: (q: Quat) => Mat3 } }).Mat3.fromQuat(this); }
	toArray(): [number, number, number, number] { return [this.x, this.y, this.z, this.w]; }
	toF32Array(): Float32Array { const heap = getHEAPF32(); return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 4); }
	toString(): string { return `[${this.x}, ${this.y}, ${this.z}, ${this.w}]`; }
}
