/**
 * Mat3 Wrapper Class
 */

import {
	_wcn_math_Mat3_identity_wasm, _wcn_math_Mat3_copy_wasm, _wcn_math_Mat3_zero_wasm,
	_wcn_math_Mat3_equals_wasm, _wcn_math_Mat3_equals_approximately_wasm, _wcn_math_Mat3_negate_wasm,
	_wcn_math_Mat3_add_wasm, _wcn_math_Mat3_sub_wasm, _wcn_math_Mat3_multiply_wasm,
	_wcn_math_Mat3_multiply_scalar_wasm, _wcn_math_Mat3_transpose_wasm, _wcn_math_Mat3_determinant_wasm,
	_wcn_math_Mat3_inverse_wasm, _wcn_math_Mat3_from_mat4_wasm, _wcn_math_Mat3_from_quat_wasm,
	_wcn_math_Mat3_scale_wasm, _wcn_math_Mat3_rotate_wasm, _wcn_math_Mat3_translate_wasm,
} from "../init";
import type { Mat3Ptr } from "../type";
import { SIZE_MAT3, _malloc, _free, getHEAPF32 } from "./math-common";
import type { Mat4 } from "./mat4";
import type { Quat } from "./quat";
import type { Vec2 } from "./vec2";

export class Mat3 {
	ptr: Mat3Ptr;
	private constructor(ptr: Mat3Ptr) { this.ptr = ptr; }

	static identity(): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_identity_wasm(ptr); return new Mat3(ptr); }
	static copy(m: Mat3): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_copy_wasm(ptr, m.ptr); return new Mat3(ptr); }
	static zero(): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_zero_wasm(ptr); return new Mat3(ptr); }
	static fromMat4(m: Mat4): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_from_mat4_wasm(ptr, m.ptr); return new Mat3(ptr); }
	static fromQuat(q: Quat): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_from_quat_wasm(ptr, q.ptr); return new Mat3(ptr); }

	free(): void { _free(this.ptr); }
	multiply(other: Mat3): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_multiply_wasm(ptr, this.ptr, other.ptr); return new Mat3(ptr); }
	multiplyScalar(scalar: number): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_multiply_scalar_wasm(ptr, this.ptr, scalar); return new Mat3(ptr); }
	transpose(): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_transpose_wasm(ptr, this.ptr); return new Mat3(ptr); }
	determinant(): number { return _wcn_math_Mat3_determinant_wasm(this.ptr); }
	inverse(): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_inverse_wasm(ptr, this.ptr); return new Mat3(ptr); }
	scale(v: Vec2): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_scale_wasm(ptr, this.ptr, v.ptr); return new Mat3(ptr); }
	rotate(angle: number): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_rotate_wasm(ptr, this.ptr, angle); return new Mat3(ptr); }
	translate(v: Vec2): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_translate_wasm(ptr, this.ptr, v.ptr); return new Mat3(ptr); }
	equals(other: Mat3): boolean { return _wcn_math_Mat3_equals_wasm(this.ptr, other.ptr) !== 0; }
	equalsApproximately(other: Mat3): boolean { return _wcn_math_Mat3_equals_approximately_wasm(this.ptr, other.ptr) !== 0; }
	negate(): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_negate_wasm(ptr, this.ptr); return new Mat3(ptr); }
	add(other: Mat3): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_add_wasm(ptr, this.ptr, other.ptr); return new Mat3(ptr); }
	sub(other: Mat3): Mat3 { const ptr = _malloc(SIZE_MAT3) as Mat3Ptr; _wcn_math_Mat3_sub_wasm(ptr, this.ptr, other.ptr); return new Mat3(ptr); }
	toF32Array(): Float32Array { const heap = getHEAPF32(); return new Float32Array(heap.buffer, heap.byteOffset + this.ptr, 12); }
}
