/**
 * Mat4 Wrapper Class
 */

import {
	_wcn_math_Mat4_identity_wasm, _wcn_math_Mat4_copy_wasm, _wcn_math_Mat4_zero_wasm,
	_wcn_math_Mat4_equals_wasm, _wcn_math_Mat4_equals_approximately_wasm, _wcn_math_Mat4_negate_wasm,
	_wcn_math_Mat4_add_wasm, _wcn_math_Mat4_sub_wasm, _wcn_math_Mat4_multiply_wasm,
	_wcn_math_Mat4_multiply_scalar_wasm, _wcn_math_Mat4_transpose_wasm, _wcn_math_Mat4_determinant_wasm,
	_wcn_math_Mat4_inverse_wasm, _wcn_math_Mat4_from_mat3_wasm, _wcn_math_Mat4_from_quat_wasm,
	_wcn_math_Mat4_scale_wasm, _wcn_math_Mat4_rotate_wasm, _wcn_math_Mat4_rotate_x_wasm,
	_wcn_math_Mat4_rotate_y_wasm, _wcn_math_Mat4_rotate_z_wasm, _wcn_math_Mat4_translate_wasm,
	_wcn_math_Mat4_perspective_wasm, _wcn_math_Mat4_ortho_wasm, _wcn_math_Mat4_look_at_wasm,
} from "../init";
import type { Mat4Ptr } from "../type";
import { SIZE_MAT4, _malloc, _free, getHEAPF32 } from "./math-common";
import type { Mat3 } from "./mat3";
import type { Quat } from "./quat";
import type { Vec3 } from "./vec3";

export class Mat4 {
	ptr: Mat4Ptr;
	private constructor(ptr: Mat4Ptr) { this.ptr = ptr; }

	static identity(): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_identity_wasm(ptr); return new Mat4(ptr); }
	static copy(m: Mat4): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_copy_wasm(ptr, m.ptr); return new Mat4(ptr); }
	static zero(): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_zero_wasm(ptr); return new Mat4(ptr); }
	static perspective(fovy: number, aspect: number, near: number, far: number): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_perspective_wasm(ptr, fovy, aspect, near, far); return new Mat4(ptr); }
	static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_ortho_wasm(ptr, left, right, bottom, top, near, far); return new Mat4(ptr); }
	static lookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_look_at_wasm(ptr, eye.ptr, center.ptr, up.ptr); return new Mat4(ptr); }
	static fromQuat(q: Quat): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_from_quat_wasm(ptr, q.ptr); return new Mat4(ptr); }
	static fromMat3(m: Mat3): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_from_mat3_wasm(ptr, m.ptr); return new Mat4(ptr); }

	free(): void { _free(this.ptr); }
	multiply(other: Mat4): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_multiply_wasm(ptr, this.ptr, other.ptr); return new Mat4(ptr); }
	multiplyScalar(scalar: number): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_multiply_scalar_wasm(ptr, this.ptr, scalar); return new Mat4(ptr); }
	transpose(): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_transpose_wasm(ptr, this.ptr); return new Mat4(ptr); }
	determinant(): number { return _wcn_math_Mat4_determinant_wasm(this.ptr); }
	inverse(): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_inverse_wasm(ptr, this.ptr); return new Mat4(ptr); }
	scale(v: Vec3): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_scale_wasm(ptr, this.ptr, v.ptr); return new Mat4(ptr); }
	rotate(axis: Vec3, angle: number): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_rotate_wasm(ptr, this.ptr, axis.ptr, angle); return new Mat4(ptr); }
	rotateX(angle: number): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_rotate_x_wasm(ptr, this.ptr, angle); return new Mat4(ptr); }
	rotateY(angle: number): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_rotate_y_wasm(ptr, this.ptr, angle); return new Mat4(ptr); }
	rotateZ(angle: number): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_rotate_z_wasm(ptr, this.ptr, angle); return new Mat4(ptr); }
	translate(v: Vec3): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_translate_wasm(ptr, this.ptr, v.ptr); return new Mat4(ptr); }
	equals(other: Mat4): boolean { return _wcn_math_Mat4_equals_wasm(this.ptr, other.ptr) !== 0; }
	equalsApproximately(other: Mat4): boolean { return _wcn_math_Mat4_equals_approximately_wasm(this.ptr, other.ptr) !== 0; }
	negate(): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_negate_wasm(ptr, this.ptr); return new Mat4(ptr); }
	add(other: Mat4): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_add_wasm(ptr, this.ptr, other.ptr); return new Mat4(ptr); }
	sub(other: Mat4): Mat4 { const ptr = _malloc(SIZE_MAT4) as Mat4Ptr; _wcn_math_Mat4_sub_wasm(ptr, this.ptr, other.ptr); return new Mat4(ptr); }
	toF32Array(): Float32Array { const heap = getHEAPF32(); return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 16); }
}
