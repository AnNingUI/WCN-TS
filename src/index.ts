/**
 * WCN WASM ES Module
 *
 * @example
 * ```ts
 * import wasmUrl from "./wcn.wasm?url";
 * import { createWCN, _wcn_math_Vec2_create_wasm, _malloc, _free, HEAPF32 } from "wcn";
 *
 * // 初始化模块
 * await createWCN({
 *   loadWasm: async () => {
 *     const res = await fetch(wasmUrl);
 *     return res.arrayBuffer();
 *   },
 *   preinitializedWebGPUDevice: device, // 可选
 * });
 *
 * // 使用 Math API
 * const v1 = _malloc(8) as Vec2Ptr;
 * _wcn_math_Vec2_create_wasm(v1, 1, 2);
 * console.log(HEAPF32[v1 >> 2], HEAPF32[(v1 >> 2) + 1]); // 1, 2
 * _free(v1);
 * ```
 */

// 类型系统
export type {
	Ptr,
	F32Size,
	Vec2Ptr,
	Vec3Ptr,
	Vec3WithWithAngleAxisPtr,
	Vec4Ptr,
	QuatPtr,
	Mat3Ptr,
	Mat4Ptr,
	Add,
	Sub,
	Mul,
} from "./type";

export { RotationOrder, Mat3Index, Mat4Index, $PI, $2xPI, $PId2 } from "./type";

// WCN 模块
export * from "./wcn";

// Wrapper 类
export { WCNCanvas, WCNImage, Vec2, Vec3, Vec4, Mat3, Mat4, Quat } from "./wrap";
export type { WCNCanvasOptions } from "./wrap";
