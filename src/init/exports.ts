/**
 * WASM 导出函数类型声明
 */

import type { Ptr, Vec2Ptr, Vec3Ptr, Vec3WithWithAngleAxisPtr, Vec4Ptr, QuatPtr, Mat3Ptr, Mat4Ptr, ImageDataPtr } from "../type";
import { Mat3Index, Mat4Index, RotationOrder } from "../type";

export type WCNContextPtr = Ptr<number, "WCN_Context">;
export type CStringPtr = Ptr<number, "char*">;
export type VoidPtr = Ptr<number, "void">;

// 内存管理
export let _malloc: (size: number) => VoidPtr;
export let _free: (ptr: VoidPtr) => void;

// WCN 核心 API
export let _wcn_init_js: () => void;
export let _wcn_wasm_create_gpu_resources_auto: () => number;
export let _wcn_create_context: (gpuResources: number) => WCNContextPtr;
export let _wcn_destroy_context: (ctx: WCNContextPtr) => void;
export let _wcn_begin_frame: (ctx: WCNContextPtr, width: number, height: number, format: number) => void;
export let _wcn_end_frame: (ctx: WCNContextPtr) => void;
export let _wcn_begin_render_pass: (ctx: WCNContextPtr, textureView: number) => number;
export let _wcn_end_render_pass: (ctx: WCNContextPtr) => void;
export let _wcn_submit_commands: (ctx: WCNContextPtr) => void;
export let _wcn_save: (ctx: WCNContextPtr) => void;
export let _wcn_restore: (ctx: WCNContextPtr) => void;

// 绘图 API
export let _wcn_clear_rect: (ctx: WCNContextPtr, x: number, y: number, w: number, h: number) => void;
export let _wcn_fill_rect: (ctx: WCNContextPtr, x: number, y: number, w: number, h: number) => void;
export let _wcn_stroke_rect: (ctx: WCNContextPtr, x: number, y: number, w: number, h: number) => void;

// 路径 API
export let _wcn_begin_path: (ctx: WCNContextPtr) => void;
export let _wcn_close_path: (ctx: WCNContextPtr) => void;
export let _wcn_move_to: (ctx: WCNContextPtr, x: number, y: number) => void;
export let _wcn_line_to: (ctx: WCNContextPtr, x: number, y: number) => void;
export let _wcn_arc: (ctx: WCNContextPtr, x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise: number) => void;
export let _wcn_rect: (ctx: WCNContextPtr, x: number, y: number, w: number, h: number) => void;
export let _wcn_fill: (ctx: WCNContextPtr) => void;
export let _wcn_stroke: (ctx: WCNContextPtr) => void;

// 样式 API
export let _wcn_set_fill_style: (ctx: WCNContextPtr, color: number) => void;
export let _wcn_set_stroke_style: (ctx: WCNContextPtr, color: number) => void;
export let _wcn_set_line_width: (ctx: WCNContextPtr, width: number) => void;
export let _wcn_set_line_cap: (ctx: WCNContextPtr, cap: number) => void;
export let _wcn_set_line_join: (ctx: WCNContextPtr, join: number) => void;
export let _wcn_set_miter_limit: (ctx: WCNContextPtr, limit: number) => void;
export let _wcn_set_global_alpha: (ctx: WCNContextPtr, alpha: number) => void;
export let _wcn_set_global_composite_operation: (ctx: WCNContextPtr, op: number) => void;

// 变换 API
export let _wcn_translate: (ctx: WCNContextPtr, x: number, y: number) => void;
export let _wcn_rotate: (ctx: WCNContextPtr, angle: number) => void;
export let _wcn_scale: (ctx: WCNContextPtr, x: number, y: number) => void;
export let _wcn_transform: (ctx: WCNContextPtr, a: number, b: number, c: number, d: number, e: number, f: number) => void;
export let _wcn_set_transform: (ctx: WCNContextPtr, a: number, b: number, c: number, d: number, e: number, f: number) => void;
export let _wcn_reset_transform: (ctx: WCNContextPtr) => void;

// 文本 API
export let _wcn_fill_text: (ctx: WCNContextPtr, text: CStringPtr, x: number, y: number) => void;
export let _wcn_stroke_text: (ctx: WCNContextPtr, text: CStringPtr, x: number, y: number) => void;
export let _wcn_measure_text: (ctx: WCNContextPtr, text: CStringPtr, outWidth: VoidPtr) => void;
export let _wcn_set_font: (ctx: WCNContextPtr, font: CStringPtr) => void;
export let _wcn_set_font_face: (ctx: WCNContextPtr, fontFace: number, size: number) => void;
export let _wcn_set_text_align: (ctx: WCNContextPtr, align: number) => void;
export let _wcn_set_text_baseline: (ctx: WCNContextPtr, baseline: number) => void;
export let _wcn_wasm_load_font: (fontName: CStringPtr, size: number, fontFaceOut: VoidPtr) => number;
export let _wcn_add_font_fallback: (ctx: WCNContextPtr, fontFace: number) => void;
export let _wcn_clear_font_fallbacks: (ctx: WCNContextPtr) => void;

// 图像 API
export let _wcn_draw_image: (ctx: WCNContextPtr, imageData: ImageDataPtr, x: number, y: number) => void;
export let _wcn_draw_image_scaled: (ctx: WCNContextPtr, imageData: ImageDataPtr, x: number, y: number, w: number, h: number) => void;
export let _wcn_draw_image_source: (ctx: WCNContextPtr, imageData: ImageDataPtr, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => void;
export let _wcn_decode_image: (ctx: WCNContextPtr, data: VoidPtr, size: number) => ImageDataPtr;
export let _wcn_destroy_image_data: (imageData: ImageDataPtr) => void;

// 解码器
export let _wcn_register_font_decoder: (ctx: WCNContextPtr, decoder: number) => void;
export let _wcn_register_image_decoder: (ctx: WCNContextPtr, decoder: number) => void;
export let _wcn_wasm_get_font_decoder: () => number;
export let _wcn_wasm_create_default_font_face: () => number;
export let _wcn_wasm_get_image_decoder: () => number;

// Surface
export let _wcn_get_surface_format: (ctx: WCNContextPtr) => number;
export let _wcn_set_surface_format: (ctx: WCNContextPtr, format: number) => void;

// Math API
export let _wcn_math_set_epsilon: (epsilon: number) => void;
export let _wcn_math_get_epsilon: () => number;
export let _wcn_math_Vec2_create_wasm: (out: Vec2Ptr, x: number, y: number) => void;
export let _wcn_math_Vec3_create_wasm: (out: Vec3Ptr, x: number, y: number, z: number) => void;
export let _wcn_math_Vec4_create_wasm: (out: Vec4Ptr, x: number, y: number, z: number, w: number) => void;
export let _wcn_math_Quat_create_wasm: (out: QuatPtr, x: number, y: number, z: number, w: number) => void;
export let _wcn_math_Mat3_create_wasm: (out: Mat3Ptr) => void;
export let _wcn_math_Mat4_create_wasm: (out: Mat4Ptr) => void;

// Vec2 操作
export let _wcn_math_Vec2_set_wasm: (out: Vec2Ptr, x: number, y: number) => void;
export let _wcn_math_Vec2_set_x_wasm: (out: Vec2Ptr, x: number) => void;
export let _wcn_math_Vec2_set_y_wasm: (out: Vec2Ptr, y: number) => void;
export let _wcn_math_Vec2_copy_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_zero_wasm: (out: Vec2Ptr) => void;
export let _wcn_math_Vec2_identity_wasm: (out: Vec2Ptr) => void;
export let _wcn_math_Vec2_ceil_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_floor_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_round_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_clamp_wasm: (out: Vec2Ptr, src: Vec2Ptr, min: number, max: number) => void;
export let _wcn_math_Vec2_add_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_add_scaled_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr, scale: number) => void;
export let _wcn_math_Vec2_sub_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_multiply_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_multiply_scalar_wasm: (out: Vec2Ptr, src: Vec2Ptr, scalar: number) => void;
export let _wcn_math_Vec2_div_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_div_scalar_wasm: (out: Vec2Ptr, src: Vec2Ptr, scalar: number) => void;
export let _wcn_math_Vec2_inverse_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_dot_wasm: (a: Vec2Ptr, b: Vec2Ptr) => number;
export let _wcn_math_Vec2_cross_wasm: (out: Vec3Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_length_wasm: (src: Vec2Ptr) => number;
export let _wcn_math_Vec2_length_squared_wasm: (src: Vec2Ptr) => number;
export let _wcn_math_Vec2_distance_wasm: (a: Vec2Ptr, b: Vec2Ptr) => number;
export let _wcn_math_Vec2_distance_squared_wasm: (a: Vec2Ptr, b: Vec2Ptr) => number;
export let _wcn_math_Vec2_normalize_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_negate_wasm: (out: Vec2Ptr, src: Vec2Ptr) => void;
export let _wcn_math_Vec2_lerp_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr, t: number) => void;
export let _wcn_math_Vec2_lerp_v_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr, t: Vec2Ptr) => void;
export let _wcn_math_Vec2_fmax_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_fmin_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_angle_wasm: (a: Vec2Ptr, b: Vec2Ptr) => number;
export let _wcn_math_Vec2_equals_wasm: (a: Vec2Ptr, b: Vec2Ptr) => number;
export let _wcn_math_Vec2_equals_approximately_wasm: (a: Vec2Ptr, b: Vec2Ptr) => number;
export let _wcn_math_Vec2_random_wasm: (out: Vec2Ptr, scale: number) => void;
export let _wcn_math_Vec2_rotate_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr, rad: number) => void;
export let _wcn_math_Vec2_set_length_wasm: (out: Vec2Ptr, src: Vec2Ptr, len: number) => void;
export let _wcn_math_Vec2_truncate_wasm: (out: Vec2Ptr, src: Vec2Ptr, maxLen: number) => void;
export let _wcn_math_Vec2_midpoint_wasm: (out: Vec2Ptr, a: Vec2Ptr, b: Vec2Ptr) => void;
export let _wcn_math_Vec2_scale_wasm: (out: Vec2Ptr, src: Vec2Ptr, scale: number) => void;
export let _wcn_math_Vec2_transform_mat3_wasm: (out: Vec2Ptr, src: Vec2Ptr, mat: Mat3Ptr) => void;
export let _wcn_math_Vec2_transform_mat4_wasm: (out: Vec2Ptr, src: Vec2Ptr, mat: Mat4Ptr) => void;

// Vec3 操作
export let _wcn_math_Vec3_set_wasm: (out: Vec3Ptr, x: number, y: number, z: number) => void;
export let _wcn_math_Vec3_set_x_wasm: (out: Vec3Ptr, x: number) => void;
export let _wcn_math_Vec3_set_y_wasm: (out: Vec3Ptr, y: number) => void;
export let _wcn_math_Vec3_set_z_wasm: (out: Vec3Ptr, z: number) => void;
export let _wcn_math_Vec3_copy_wasm: (out: Vec3Ptr, src: Vec3Ptr) => void;
export let _wcn_math_Vec3_zero_wasm: (out: Vec3Ptr) => void;
export let _wcn_math_Vec3_identity_wasm: (out: Vec3Ptr) => void;
export let _wcn_math_Vec3_ceil_wasm: (out: Vec3Ptr, src: Vec3Ptr) => void;
export let _wcn_math_Vec3_floor_wasm: (out: Vec3Ptr, src: Vec3Ptr) => void;
export let _wcn_math_Vec3_round_wasm: (out: Vec3Ptr, src: Vec3Ptr) => void;
export let _wcn_math_Vec3_clamp_wasm: (out: Vec3Ptr, src: Vec3Ptr, min: number, max: number) => void;
export let _wcn_math_Vec3_add_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_add_scaled_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr, scale: number) => void;
export let _wcn_math_Vec3_sub_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_multiply_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_multiply_scalar_wasm: (out: Vec3Ptr, src: Vec3Ptr, scalar: number) => void;
export let _wcn_math_Vec3_div_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_div_scalar_wasm: (out: Vec3Ptr, src: Vec3Ptr, scalar: number) => void;
export let _wcn_math_Vec3_inverse_wasm: (out: Vec3Ptr, src: Vec3Ptr) => void;
export let _wcn_math_Vec3_cross_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_dot_wasm: (a: Vec3Ptr, b: Vec3Ptr) => number;
export let _wcn_math_Vec3_length_wasm: (src: Vec3Ptr) => number;
export let _wcn_math_Vec3_length_squared_wasm: (src: Vec3Ptr) => number;
export let _wcn_math_Vec3_distance_wasm: (a: Vec3Ptr, b: Vec3Ptr) => number;
export let _wcn_math_Vec3_distance_squared_wasm: (a: Vec3Ptr, b: Vec3Ptr) => number;
export let _wcn_math_Vec3_normalize_wasm: (out: Vec3Ptr, src: Vec3Ptr) => void;
export let _wcn_math_Vec3_negate_wasm: (out: Vec3Ptr, src: Vec3Ptr) => void;
export let _wcn_math_Vec3_lerp_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr, t: number) => void;
export let _wcn_math_Vec3_lerp_v_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr, t: Vec3Ptr) => void;
export let _wcn_math_Vec3_fmax_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_fmin_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_angle_wasm: (a: Vec3Ptr, b: Vec3Ptr) => number;
export let _wcn_math_Vec3_equals_wasm: (a: Vec3Ptr, b: Vec3Ptr) => number;
export let _wcn_math_Vec3_equals_approximately_wasm: (a: Vec3Ptr, b: Vec3Ptr) => number;
export let _wcn_math_Vec3_random_wasm: (out: Vec3Ptr, scale: number) => void;
export let _wcn_math_Vec3_set_length_wasm: (out: Vec3Ptr, src: Vec3Ptr, len: number) => void;
export let _wcn_math_Vec3_truncate_wasm: (out: Vec3Ptr, src: Vec3Ptr, maxLen: number) => void;
export let _wcn_math_Vec3_midpoint_wasm: (out: Vec3Ptr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Vec3_scale_wasm: (out: Vec3Ptr, src: Vec3Ptr, scale: number) => void;
export let _wcn_math_Vec3_rotate_x_wasm: (out: Vec3Ptr, src: Vec3Ptr, origin: Vec3Ptr, rad: number) => void;
export let _wcn_math_Vec3_rotate_y_wasm: (out: Vec3Ptr, src: Vec3Ptr, origin: Vec3Ptr, rad: number) => void;
export let _wcn_math_Vec3_rotate_z_wasm: (out: Vec3Ptr, src: Vec3Ptr, origin: Vec3Ptr, rad: number) => void;
export let _wcn_math_Vec3_get_translation_wasm: (out: Vec3Ptr, mat: Mat4Ptr) => void;
export let _wcn_math_Vec3_get_axis_wasm: (out: Vec3Ptr, mat: Mat4Ptr, axis: number) => void;
export let _wcn_math_Vec3_get_scale_wasm: (out: Vec3Ptr, mat: Mat4Ptr) => void;
export let _wcn_math_Vec3_transform_mat4_wasm: (out: Vec3Ptr, src: Vec3Ptr, mat: Mat4Ptr) => void;
export let _wcn_math_Vec3_transform_mat4_upper3x3_wasm: (out: Vec3Ptr, src: Vec3Ptr, mat: Mat4Ptr) => void;
export let _wcn_math_Vec3_transform_mat3_wasm: (out: Vec3Ptr, src: Vec3Ptr, mat: Mat3Ptr) => void;
export let _wcn_math_Vec3_transform_quat_wasm: (out: Vec3Ptr, src: Vec3Ptr, quat: QuatPtr) => void;

// Vec4 操作
export let _wcn_math_Vec4_set_wasm: (out: Vec4Ptr, x: number, y: number, z: number, w: number) => void;
export let _wcn_math_Vec4_set_x_wasm: (out: Vec4Ptr, x: number) => void;
export let _wcn_math_Vec4_set_y_wasm: (out: Vec4Ptr, y: number) => void;
export let _wcn_math_Vec4_set_z_wasm: (out: Vec4Ptr, z: number) => void;
export let _wcn_math_Vec4_set_w_wasm: (out: Vec4Ptr, w: number) => void;
export let _wcn_math_Vec4_copy_wasm: (out: Vec4Ptr, src: Vec4Ptr) => void;
export let _wcn_math_Vec4_zero_wasm: (out: Vec4Ptr) => void;
export let _wcn_math_Vec4_identity_wasm: (out: Vec4Ptr) => void;
export let _wcn_math_Vec4_ceil_wasm: (out: Vec4Ptr, src: Vec4Ptr) => void;
export let _wcn_math_Vec4_floor_wasm: (out: Vec4Ptr, src: Vec4Ptr) => void;
export let _wcn_math_Vec4_round_wasm: (out: Vec4Ptr, src: Vec4Ptr) => void;
export let _wcn_math_Vec4_clamp_wasm: (out: Vec4Ptr, src: Vec4Ptr, min: number, max: number) => void;
export let _wcn_math_Vec4_add_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr) => void;
export let _wcn_math_Vec4_add_scaled_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr, scale: number) => void;
export let _wcn_math_Vec4_sub_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr) => void;
export let _wcn_math_Vec4_multiply_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr) => void;
export let _wcn_math_Vec4_multiply_scalar_wasm: (out: Vec4Ptr, src: Vec4Ptr, scalar: number) => void;
export let _wcn_math_Vec4_div_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr) => void;
export let _wcn_math_Vec4_div_scalar_wasm: (out: Vec4Ptr, src: Vec4Ptr, scalar: number) => void;
export let _wcn_math_Vec4_inverse_wasm: (out: Vec4Ptr, src: Vec4Ptr) => void;
export let _wcn_math_Vec4_dot_wasm: (a: Vec4Ptr, b: Vec4Ptr) => number;
export let _wcn_math_Vec4_length_wasm: (src: Vec4Ptr) => number;
export let _wcn_math_Vec4_length_squared_wasm: (src: Vec4Ptr) => number;
export let _wcn_math_Vec4_distance_wasm: (a: Vec4Ptr, b: Vec4Ptr) => number;
export let _wcn_math_Vec4_distance_squared_wasm: (a: Vec4Ptr, b: Vec4Ptr) => number;
export let _wcn_math_Vec4_normalize_wasm: (out: Vec4Ptr, src: Vec4Ptr) => void;
export let _wcn_math_Vec4_negate_wasm: (out: Vec4Ptr, src: Vec4Ptr) => void;
export let _wcn_math_Vec4_lerp_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr, t: number) => void;
export let _wcn_math_Vec4_lerp_v_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr, t: Vec4Ptr) => void;
export let _wcn_math_Vec4_fmax_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr) => void;
export let _wcn_math_Vec4_fmin_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr) => void;
export let _wcn_math_Vec4_equals_wasm: (a: Vec4Ptr, b: Vec4Ptr) => number;
export let _wcn_math_Vec4_equals_approximately_wasm: (a: Vec4Ptr, b: Vec4Ptr) => number;
export let _wcn_math_Vec4_set_length_wasm: (out: Vec4Ptr, src: Vec4Ptr, len: number) => void;
export let _wcn_math_Vec4_truncate_wasm: (out: Vec4Ptr, src: Vec4Ptr, maxLen: number) => void;
export let _wcn_math_Vec4_midpoint_wasm: (out: Vec4Ptr, a: Vec4Ptr, b: Vec4Ptr) => void;
export let _wcn_math_Vec4_transform_mat4_wasm: (out: Vec4Ptr, src: Vec4Ptr, mat: Mat4Ptr) => void;

// Quat 操作
export let _wcn_math_Quat_set_wasm: (out: QuatPtr, x: number, y: number, z: number, w: number) => void;
export let _wcn_math_Quat_set_x_wasm: (out: QuatPtr, x: number) => void;
export let _wcn_math_Quat_set_y_wasm: (out: QuatPtr, y: number) => void;
export let _wcn_math_Quat_set_z_wasm: (out: QuatPtr, z: number) => void;
export let _wcn_math_Quat_set_w_wasm: (out: QuatPtr, w: number) => void;
export let _wcn_math_Quat_copy_wasm: (out: QuatPtr, src: QuatPtr) => void;
export let _wcn_math_Quat_zero_wasm: (out: QuatPtr) => void;
export let _wcn_math_Quat_identity_wasm: (out: QuatPtr) => void;
export let _wcn_math_Quat_dot_wasm: (a: QuatPtr, b: QuatPtr) => number;
export let _wcn_math_Quat_lerp_wasm: (out: QuatPtr, a: QuatPtr, b: QuatPtr, t: number) => void;
export let _wcn_math_Quat_multiply_wasm: (out: QuatPtr, a: QuatPtr, b: QuatPtr) => void;
export let _wcn_math_Quat_multiply_scalar_wasm: (out: QuatPtr, src: QuatPtr, scalar: number) => void;
export let _wcn_math_Quat_add_wasm: (out: QuatPtr, a: QuatPtr, b: QuatPtr) => void;
export let _wcn_math_Quat_sub_wasm: (out: QuatPtr, a: QuatPtr, b: QuatPtr) => void;
export let _wcn_math_Quat_normalize_wasm: (out: QuatPtr, src: QuatPtr) => void;
export let _wcn_math_Quat_slerp_wasm: (out: QuatPtr, a: QuatPtr, b: QuatPtr, t: number) => void;
export let _wcn_math_Quat_sqlerp_wasm: (out: QuatPtr, a: QuatPtr, b: QuatPtr, c: QuatPtr, d: QuatPtr, t: number) => void;
export let _wcn_math_Quat_length_wasm: (src: QuatPtr) => number;
export let _wcn_math_Quat_length_squared_wasm: (src: QuatPtr) => number;
export let _wcn_math_Quat_equals_wasm: (a: QuatPtr, b: QuatPtr) => number;
export let _wcn_math_Quat_equals_approximately_wasm: (a: QuatPtr, b: QuatPtr) => number;
export let _wcn_math_Quat_angle_wasm: (a: QuatPtr, b: QuatPtr) => number;
export let _wcn_math_Quat_rotation_to_wasm: (out: QuatPtr, a: Vec3Ptr, b: Vec3Ptr) => void;
export let _wcn_math_Quat_inverse_wasm: (out: QuatPtr, src: QuatPtr) => void;
export let _wcn_math_Quat_conjugate_wasm: (out: QuatPtr, src: QuatPtr) => void;
export let _wcn_math_Quat_div_scalar_wasm: (out: QuatPtr, src: QuatPtr, scalar: number) => void;
export let _wcn_math_Quat_from_euler_wasm: (out: QuatPtr, x: number, y: number, z: number, order: RotationOrder) => void;
export let _wcn_math_Quat_from_axis_angle_wasm: (out: QuatPtr, axis: Vec3Ptr, angle: number) => void;
export let _wcn_math_Quat_to_axis_angle_wasm: (out: Vec3WithWithAngleAxisPtr, src: QuatPtr) => void;
export let _wcn_math_Quat_from_mat4_wasm: (out: QuatPtr, mat: Mat4Ptr) => void;
export let _wcn_math_Quat_from_mat3_wasm: (out: QuatPtr, mat: Mat3Ptr) => void;
export let _wcn_math_Quat_rotate_x_wasm: (out: QuatPtr, src: QuatPtr, rad: number) => void;
export let _wcn_math_Quat_rotate_y_wasm: (out: QuatPtr, src: QuatPtr, rad: number) => void;
export let _wcn_math_Quat_rotate_z_wasm: (out: QuatPtr, src: QuatPtr, rad: number) => void;
export let _wcn_math_Quat_scale_wasm: (out: QuatPtr, src: QuatPtr, scale: number) => void;

// Mat3 操作
export let _wcn_math_Mat3_set_wasm: (out: Mat3Ptr, m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number) => void;
export let _wcn_math_Mat3_set_with_index_wasm: (out: Mat3Ptr, index: Mat3Index, value: number) => void;
export let _wcn_math_Mat3_copy_wasm: (out: Mat3Ptr, src: Mat3Ptr) => void;
export let _wcn_math_Mat3_zero_wasm: (out: Mat3Ptr) => void;
export let _wcn_math_Mat3_identity_wasm: (out: Mat3Ptr) => void;
export let _wcn_math_Mat3_equals_wasm: (a: Mat3Ptr, b: Mat3Ptr) => number;
export let _wcn_math_Mat3_equals_approximately_wasm: (a: Mat3Ptr, b: Mat3Ptr) => number;
export let _wcn_math_Mat3_negate_wasm: (out: Mat3Ptr, src: Mat3Ptr) => void;
export let _wcn_math_Mat3_transpose_wasm: (out: Mat3Ptr, src: Mat3Ptr) => void;
export let _wcn_math_Mat3_add_wasm: (out: Mat3Ptr, a: Mat3Ptr, b: Mat3Ptr) => void;
export let _wcn_math_Mat3_sub_wasm: (out: Mat3Ptr, a: Mat3Ptr, b: Mat3Ptr) => void;
export let _wcn_math_Mat3_multiply_wasm: (out: Mat3Ptr, a: Mat3Ptr, b: Mat3Ptr) => void;
export let _wcn_math_Mat3_multiply_scalar_wasm: (out: Mat3Ptr, src: Mat3Ptr, scalar: number) => void;
export let _wcn_math_Mat3_inverse_wasm: (out: Mat3Ptr, src: Mat3Ptr) => void;
export let _wcn_math_Mat3_determinant_wasm: (src: Mat3Ptr) => number;
export let _wcn_math_Mat3_from_mat4_wasm: (out: Mat3Ptr, src: Mat4Ptr) => void;
export let _wcn_math_Mat3_from_quat_wasm: (out: Mat3Ptr, src: QuatPtr) => void;
export let _wcn_math_Mat3_rotate_wasm: (out: Mat3Ptr, src: Mat3Ptr, angle: number) => void;
export let _wcn_math_Mat3_rotate_x_wasm: (out: Mat3Ptr, src: Mat3Ptr, angle: number) => void;
export let _wcn_math_Mat3_rotate_y_wasm: (out: Mat3Ptr, src: Mat3Ptr, angle: number) => void;
export let _wcn_math_Mat3_rotate_z_wasm: (out: Mat3Ptr, src: Mat3Ptr, angle: number) => void;
export let _wcn_math_Mat3_rotation_wasm: (out: Mat3Ptr, angle: number) => void;
export let _wcn_math_Mat3_rotation_x_wasm: (out: Mat3Ptr, angle: number) => void;
export let _wcn_math_Mat3_rotation_y_wasm: (out: Mat3Ptr, angle: number) => void;
export let _wcn_math_Mat3_rotation_z_wasm: (out: Mat3Ptr, angle: number) => void;
export let _wcn_math_Mat3_get_axis_wasm: (out: Vec2Ptr, mat: Mat3Ptr, axis: number) => void;
export let _wcn_math_Mat3_set_axis_wasm: (out: Mat3Ptr, mat: Mat3Ptr, axis: number, v: Vec2Ptr) => void;
export let _wcn_math_Mat3_get_scaling_wasm: (out: Vec2Ptr, mat: Mat3Ptr) => void;
export let _wcn_math_Mat3_get_3D_scaling_wasm: (out: Vec3Ptr, mat: Mat3Ptr) => void;
export let _wcn_math_Mat3_get_translation_wasm: (out: Vec2Ptr, mat: Mat3Ptr) => void;
export let _wcn_math_Mat3_set_translation_wasm: (out: Mat3Ptr, mat: Mat3Ptr, v: Vec2Ptr) => void;
export let _wcn_math_Mat3_translation_wasm: (out: Mat3Ptr, v: Vec2Ptr) => void;
export let _wcn_math_Mat3_translate_wasm: (out: Mat3Ptr, src: Mat3Ptr, v: Vec2Ptr) => void;
export let _wcn_math_Mat3_scale_wasm: (out: Mat3Ptr, src: Mat3Ptr, v: Vec2Ptr) => void;
export let _wcn_math_Mat3_scale3D_wasm: (out: Mat3Ptr, src: Mat3Ptr, v: Vec3Ptr) => void;
export let _wcn_math_Mat3_scaling_wasm: (out: Mat3Ptr, v: Vec2Ptr) => void;
export let _wcn_math_Mat3_scaling3D_wasm: (out: Mat3Ptr, v: Vec3Ptr) => void;
export let _wcn_math_Mat3_uniform_scale_wasm: (out: Mat3Ptr, src: Mat3Ptr, scale: number) => void;
export let _wcn_math_Mat3_uniform_scale_3D_wasm: (out: Mat3Ptr, src: Mat3Ptr, scale: number) => void;
export let _wcn_math_Mat3_uniform_scaling_wasm: (out: Mat3Ptr, scale: number) => void;
export let _wcn_math_Mat3_uniform_scaling_3D_wasm: (out: Mat3Ptr, scale: number) => void;

// Mat4 操作
export let _wcn_math_Mat4_set_wasm: (out: Mat4Ptr, m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number) => void;
export let _wcn_math_Mat4_set_with_index_wasm: (out: Mat4Ptr, index: Mat4Index, value: number) => void;
export let _wcn_math_Mat4_copy_wasm: (out: Mat4Ptr, src: Mat4Ptr) => void;
export let _wcn_math_Mat4_zero_wasm: (out: Mat4Ptr) => void;
export let _wcn_math_Mat4_identity_wasm: (out: Mat4Ptr) => void;
export let _wcn_math_Mat4_negate_wasm: (out: Mat4Ptr, src: Mat4Ptr) => void;
export let _wcn_math_Mat4_equals_wasm: (a: Mat4Ptr, b: Mat4Ptr) => number;
export let _wcn_math_Mat4_equals_approximately_wasm: (a: Mat4Ptr, b: Mat4Ptr) => number;
export let _wcn_math_Mat4_add_wasm: (out: Mat4Ptr, a: Mat4Ptr, b: Mat4Ptr) => void;
export let _wcn_math_Mat4_sub_wasm: (out: Mat4Ptr, a: Mat4Ptr, b: Mat4Ptr) => void;
export let _wcn_math_Mat4_multiply_wasm: (out: Mat4Ptr, a: Mat4Ptr, b: Mat4Ptr) => void;
export let _wcn_math_Mat4_multiply_scalar_wasm: (out: Mat4Ptr, src: Mat4Ptr, scalar: number) => void;
export let _wcn_math_Mat4_inverse_wasm: (out: Mat4Ptr, src: Mat4Ptr) => void;
export let _wcn_math_Mat4_transpose_wasm: (out: Mat4Ptr, src: Mat4Ptr) => void;
export let _wcn_math_Mat4_determinant_wasm: (src: Mat4Ptr) => number;
export let _wcn_math_Mat4_aim_wasm: (out: Mat4Ptr, eye: Vec3Ptr, target: Vec3Ptr, up: Vec3Ptr) => void;
export let _wcn_math_Mat4_from_mat3_wasm: (out: Mat4Ptr, src: Mat3Ptr) => void;
export let _wcn_math_Mat4_from_quat_wasm: (out: Mat4Ptr, src: QuatPtr) => void;
export let _wcn_math_Mat4_axis_rotate_wasm: (out: Mat4Ptr, src: Mat4Ptr, axis: Vec3Ptr, angle: number) => void;
export let _wcn_math_Mat4_axis_rotation_wasm: (out: Mat4Ptr, axis: Vec3Ptr, angle: number) => void;
export let _wcn_math_Mat4_camera_aim_wasm: (out: Mat4Ptr, eye: Vec3Ptr, target: Vec3Ptr, up: Vec3Ptr) => void;
export let _wcn_math_Mat4_frustum_wasm: (out: Mat4Ptr, left: number, right: number, bottom: number, top: number, near: number, far: number) => void;
export let _wcn_math_Mat4_frustum_reverse_z_wasm: (out: Mat4Ptr, left: number, right: number, bottom: number, top: number, near: number, far: number) => void;
export let _wcn_math_Mat4_get_axis_wasm: (out: Vec3Ptr, mat: Mat4Ptr, axis: number) => void;
export let _wcn_math_Mat4_set_axis_wasm: (out: Mat4Ptr, mat: Mat4Ptr, axis: number, v: Vec3Ptr) => void;
export let _wcn_math_Mat4_get_translation_wasm: (out: Vec3Ptr, mat: Mat4Ptr) => void;
export let _wcn_math_Mat4_set_translation_wasm: (out: Mat4Ptr, mat: Mat4Ptr, v: Vec3Ptr) => void;
export let _wcn_math_Mat4_translation_wasm: (out: Mat4Ptr, v: Vec3Ptr) => void;
export let _wcn_math_Mat4_translate_wasm: (out: Mat4Ptr, src: Mat4Ptr, v: Vec3Ptr) => void;
export let _wcn_math_Mat4_perspective_wasm: (out: Mat4Ptr, fov: number, aspect: number, near: number, far: number) => void;
export let _wcn_math_Mat4_perspective_reverse_z_wasm: (out: Mat4Ptr, fov: number, aspect: number, near: number, far: number) => void;
export let _wcn_math_Mat4_ortho_wasm: (out: Mat4Ptr, left: number, right: number, bottom: number, top: number, near: number, far: number) => void;
export let _wcn_math_Mat4_look_at_wasm: (out: Mat4Ptr, eye: Vec3Ptr, target: Vec3Ptr, up: Vec3Ptr) => void;
export let _wcn_math_Mat4_rotate_wasm: (out: Mat4Ptr, src: Mat4Ptr, axis: Vec3Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotate_x_wasm: (out: Mat4Ptr, src: Mat4Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotate_y_wasm: (out: Mat4Ptr, src: Mat4Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotate_z_wasm: (out: Mat4Ptr, src: Mat4Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotation_wasm: (out: Mat4Ptr, axis: Vec3Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotation_x_wasm: (out: Mat4Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotation_y_wasm: (out: Mat4Ptr, angle: number) => void;
export let _wcn_math_Mat4_rotation_z_wasm: (out: Mat4Ptr, angle: number) => void;
export let _wcn_math_Mat4_scale_wasm: (out: Mat4Ptr, src: Mat4Ptr, v: Vec3Ptr) => void;
export let _wcn_math_Mat4_get_scaling_wasm: (out: Vec3Ptr, mat: Mat4Ptr) => void;
export let _wcn_math_Mat4_scaling_wasm: (out: Mat4Ptr, v: Vec3Ptr) => void;
export let _wcn_math_Mat4_uniform_scale_wasm: (out: Mat4Ptr, src: Mat4Ptr, scale: number) => void;
export let _wcn_math_Mat4_uniform_scaling_wasm: (out: Mat4Ptr, scale: number) => void;

// ============================================================================
// 绑定函数
// ============================================================================

export function bindExports(exports: WebAssembly.Exports): void {
	_malloc = exports.malloc as typeof _malloc;
	_free = exports.free as typeof _free;

	// WCN 核心
	_wcn_init_js = exports.wcn_init_js as typeof _wcn_init_js;
	_wcn_wasm_create_gpu_resources_auto = exports.wcn_wasm_create_gpu_resources_auto as typeof _wcn_wasm_create_gpu_resources_auto;
	_wcn_create_context = exports.wcn_create_context as typeof _wcn_create_context;
	_wcn_destroy_context = exports.wcn_destroy_context as typeof _wcn_destroy_context;
	_wcn_begin_frame = exports.wcn_begin_frame as typeof _wcn_begin_frame;
	_wcn_end_frame = exports.wcn_end_frame as typeof _wcn_end_frame;
	_wcn_begin_render_pass = exports.wcn_begin_render_pass as typeof _wcn_begin_render_pass;
	_wcn_end_render_pass = exports.wcn_end_render_pass as typeof _wcn_end_render_pass;
	_wcn_submit_commands = exports.wcn_submit_commands as typeof _wcn_submit_commands;
	_wcn_save = exports.wcn_save as typeof _wcn_save;
	_wcn_restore = exports.wcn_restore as typeof _wcn_restore;

	// 绘图
	_wcn_clear_rect = exports.wcn_clear_rect as typeof _wcn_clear_rect;
	_wcn_fill_rect = exports.wcn_fill_rect as typeof _wcn_fill_rect;
	_wcn_stroke_rect = exports.wcn_stroke_rect as typeof _wcn_stroke_rect;
	_wcn_begin_path = exports.wcn_begin_path as typeof _wcn_begin_path;
	_wcn_close_path = exports.wcn_close_path as typeof _wcn_close_path;
	_wcn_move_to = exports.wcn_move_to as typeof _wcn_move_to;
	_wcn_line_to = exports.wcn_line_to as typeof _wcn_line_to;
	_wcn_arc = exports.wcn_arc as typeof _wcn_arc;
	_wcn_rect = exports.wcn_rect as typeof _wcn_rect;
	_wcn_fill = exports.wcn_fill as typeof _wcn_fill;
	_wcn_stroke = exports.wcn_stroke as typeof _wcn_stroke;

	// 样式
	_wcn_set_fill_style = exports.wcn_set_fill_style as typeof _wcn_set_fill_style;
	_wcn_set_stroke_style = exports.wcn_set_stroke_style as typeof _wcn_set_stroke_style;
	_wcn_set_line_width = exports.wcn_set_line_width as typeof _wcn_set_line_width;
	_wcn_set_line_cap = exports.wcn_set_line_cap as typeof _wcn_set_line_cap;
	_wcn_set_line_join = exports.wcn_set_line_join as typeof _wcn_set_line_join;
	_wcn_set_miter_limit = exports.wcn_set_miter_limit as typeof _wcn_set_miter_limit;
	_wcn_set_global_alpha = exports.wcn_set_global_alpha as typeof _wcn_set_global_alpha;
	_wcn_set_global_composite_operation = exports.wcn_set_global_composite_operation as typeof _wcn_set_global_composite_operation;

	// 变换
	_wcn_translate = exports.wcn_translate as typeof _wcn_translate;
	_wcn_rotate = exports.wcn_rotate as typeof _wcn_rotate;
	_wcn_scale = exports.wcn_scale as typeof _wcn_scale;
	_wcn_transform = exports.wcn_transform as typeof _wcn_transform;
	_wcn_set_transform = exports.wcn_set_transform as typeof _wcn_set_transform;
	_wcn_reset_transform = exports.wcn_reset_transform as typeof _wcn_reset_transform;

	// 文本
	_wcn_fill_text = exports.wcn_fill_text as typeof _wcn_fill_text;
	_wcn_stroke_text = exports.wcn_stroke_text as typeof _wcn_stroke_text;
	_wcn_measure_text = exports.wcn_measure_text as typeof _wcn_measure_text;
	_wcn_set_font = exports.wcn_set_font as typeof _wcn_set_font;
	_wcn_set_font_face = exports.wcn_set_font_face as typeof _wcn_set_font_face;
	_wcn_set_text_align = exports.wcn_set_text_align as typeof _wcn_set_text_align;
	_wcn_set_text_baseline = exports.wcn_set_text_baseline as typeof _wcn_set_text_baseline;
	_wcn_wasm_load_font = exports.wcn_wasm_load_font as typeof _wcn_wasm_load_font;
	_wcn_add_font_fallback = exports.wcn_add_font_fallback as typeof _wcn_add_font_fallback;
	_wcn_clear_font_fallbacks = exports.wcn_clear_font_fallbacks as typeof _wcn_clear_font_fallbacks;

	// 图像
	_wcn_draw_image = exports.wcn_draw_image as typeof _wcn_draw_image;
	_wcn_draw_image_scaled = exports.wcn_draw_image_scaled as typeof _wcn_draw_image_scaled;
	_wcn_draw_image_source = exports.wcn_draw_image_source as typeof _wcn_draw_image_source;
	_wcn_decode_image = exports.wcn_decode_image as typeof _wcn_decode_image;
	_wcn_destroy_image_data = exports.wcn_destroy_image_data as typeof _wcn_destroy_image_data;

	// 解码器
	_wcn_register_font_decoder = exports.wcn_register_font_decoder as typeof _wcn_register_font_decoder;
	_wcn_register_image_decoder = exports.wcn_register_image_decoder as typeof _wcn_register_image_decoder;
	_wcn_wasm_get_font_decoder = exports.wcn_wasm_get_font_decoder as typeof _wcn_wasm_get_font_decoder;
	_wcn_wasm_create_default_font_face = exports.wcn_wasm_create_default_font_face as typeof _wcn_wasm_create_default_font_face;
	_wcn_wasm_get_image_decoder = exports.wcn_wasm_get_image_decoder as typeof _wcn_wasm_get_image_decoder;

	// Surface
	_wcn_get_surface_format = exports.wcn_get_surface_format as typeof _wcn_get_surface_format;
	_wcn_set_surface_format = exports.wcn_set_surface_format as typeof _wcn_set_surface_format;

	// Math
	_wcn_math_set_epsilon = exports.wcn_math_set_epsilon as typeof _wcn_math_set_epsilon;
	_wcn_math_get_epsilon = exports.wcn_math_get_epsilon as typeof _wcn_math_get_epsilon;
	_wcn_math_Vec2_create_wasm = exports.wcn_math_Vec2_create_wasm as typeof _wcn_math_Vec2_create_wasm;
	_wcn_math_Vec3_create_wasm = exports.wcn_math_Vec3_create_wasm as typeof _wcn_math_Vec3_create_wasm;
	_wcn_math_Vec4_create_wasm = exports.wcn_math_Vec4_create_wasm as typeof _wcn_math_Vec4_create_wasm;
	_wcn_math_Quat_create_wasm = exports.wcn_math_Quat_create_wasm as typeof _wcn_math_Quat_create_wasm;
	_wcn_math_Mat3_create_wasm = exports.wcn_math_Mat3_create_wasm as typeof _wcn_math_Mat3_create_wasm;
	_wcn_math_Mat4_create_wasm = exports.wcn_math_Mat4_create_wasm as typeof _wcn_math_Mat4_create_wasm;

	// Vec2
	_wcn_math_Vec2_set_wasm = exports.wcn_math_Vec2_set_wasm as typeof _wcn_math_Vec2_set_wasm;
	_wcn_math_Vec2_copy_wasm = exports.wcn_math_Vec2_copy_wasm as typeof _wcn_math_Vec2_copy_wasm;
	_wcn_math_Vec2_zero_wasm = exports.wcn_math_Vec2_zero_wasm as typeof _wcn_math_Vec2_zero_wasm;
	_wcn_math_Vec2_identity_wasm = exports.wcn_math_Vec2_identity_wasm as typeof _wcn_math_Vec2_identity_wasm;
	_wcn_math_Vec2_ceil_wasm = exports.wcn_math_Vec2_ceil_wasm as typeof _wcn_math_Vec2_ceil_wasm;
	_wcn_math_Vec2_floor_wasm = exports.wcn_math_Vec2_floor_wasm as typeof _wcn_math_Vec2_floor_wasm;
	_wcn_math_Vec2_round_wasm = exports.wcn_math_Vec2_round_wasm as typeof _wcn_math_Vec2_round_wasm;
	_wcn_math_Vec2_clamp_wasm = exports.wcn_math_Vec2_clamp_wasm as typeof _wcn_math_Vec2_clamp_wasm;
	_wcn_math_Vec2_add_wasm = exports.wcn_math_Vec2_add_wasm as typeof _wcn_math_Vec2_add_wasm;
	_wcn_math_Vec2_add_scaled_wasm = exports.wcn_math_Vec2_add_scaled_wasm as typeof _wcn_math_Vec2_add_scaled_wasm;
	_wcn_math_Vec2_sub_wasm = exports.wcn_math_Vec2_sub_wasm as typeof _wcn_math_Vec2_sub_wasm;

	_wcn_math_Vec2_multiply_wasm = exports.wcn_math_Vec2_multiply_wasm as typeof _wcn_math_Vec2_multiply_wasm;
	_wcn_math_Vec2_multiply_scalar_wasm = exports.wcn_math_Vec2_multiply_scalar_wasm as typeof _wcn_math_Vec2_multiply_scalar_wasm;
	_wcn_math_Vec2_div_wasm = exports.wcn_math_Vec2_div_wasm as typeof _wcn_math_Vec2_div_wasm;
	_wcn_math_Vec2_div_scalar_wasm = exports.wcn_math_Vec2_div_scalar_wasm as typeof _wcn_math_Vec2_div_scalar_wasm;
	_wcn_math_Vec2_inverse_wasm = exports.wcn_math_Vec2_inverse_wasm as typeof _wcn_math_Vec2_inverse_wasm;
	_wcn_math_Vec2_dot_wasm = exports.wcn_math_Vec2_dot_wasm as typeof _wcn_math_Vec2_dot_wasm;
	_wcn_math_Vec2_cross_wasm = exports.wcn_math_Vec2_cross_wasm as typeof _wcn_math_Vec2_cross_wasm;
	_wcn_math_Vec2_length_wasm = exports.wcn_math_Vec2_length_wasm as typeof _wcn_math_Vec2_length_wasm;
	_wcn_math_Vec2_length_squared_wasm = exports.wcn_math_Vec2_length_squared_wasm as typeof _wcn_math_Vec2_length_squared_wasm;
	_wcn_math_Vec2_distance_wasm = exports.wcn_math_Vec2_distance_wasm as typeof _wcn_math_Vec2_distance_wasm;
	_wcn_math_Vec2_distance_squared_wasm = exports.wcn_math_Vec2_distance_squared_wasm as typeof _wcn_math_Vec2_distance_squared_wasm;
	_wcn_math_Vec2_normalize_wasm = exports.wcn_math_Vec2_normalize_wasm as typeof _wcn_math_Vec2_normalize_wasm;
	_wcn_math_Vec2_negate_wasm = exports.wcn_math_Vec2_negate_wasm as typeof _wcn_math_Vec2_negate_wasm;
	_wcn_math_Vec2_lerp_wasm = exports.wcn_math_Vec2_lerp_wasm as typeof _wcn_math_Vec2_lerp_wasm;
	_wcn_math_Vec2_lerp_v_wasm = exports.wcn_math_Vec2_lerp_v_wasm as typeof _wcn_math_Vec2_lerp_v_wasm;
	_wcn_math_Vec2_fmax_wasm = exports.wcn_math_Vec2_fmax_wasm as typeof _wcn_math_Vec2_fmax_wasm;
	_wcn_math_Vec2_fmin_wasm = exports.wcn_math_Vec2_fmin_wasm as typeof _wcn_math_Vec2_fmin_wasm;
	_wcn_math_Vec2_angle_wasm = exports.wcn_math_Vec2_angle_wasm as typeof _wcn_math_Vec2_angle_wasm;
	_wcn_math_Vec2_equals_wasm = exports.wcn_math_Vec2_equals_wasm as typeof _wcn_math_Vec2_equals_wasm;
	_wcn_math_Vec2_equals_approximately_wasm = exports.wcn_math_Vec2_equals_approximately_wasm as typeof _wcn_math_Vec2_equals_approximately_wasm;
	_wcn_math_Vec2_random_wasm = exports.wcn_math_Vec2_random_wasm as typeof _wcn_math_Vec2_random_wasm;
	_wcn_math_Vec2_rotate_wasm = exports.wcn_math_Vec2_rotate_wasm as typeof _wcn_math_Vec2_rotate_wasm;
	_wcn_math_Vec2_set_length_wasm = exports.wcn_math_Vec2_set_length_wasm as typeof _wcn_math_Vec2_set_length_wasm;
	_wcn_math_Vec2_truncate_wasm = exports.wcn_math_Vec2_truncate_wasm as typeof _wcn_math_Vec2_truncate_wasm;
	_wcn_math_Vec2_midpoint_wasm = exports.wcn_math_Vec2_midpoint_wasm as typeof _wcn_math_Vec2_midpoint_wasm;
	_wcn_math_Vec2_scale_wasm = exports.wcn_math_Vec2_scale_wasm as typeof _wcn_math_Vec2_scale_wasm;
	_wcn_math_Vec2_transform_mat3_wasm = exports.wcn_math_Vec2_transform_mat3_wasm as typeof _wcn_math_Vec2_transform_mat3_wasm;
	_wcn_math_Vec2_transform_mat4_wasm = exports.wcn_math_Vec2_transform_mat4_wasm as typeof _wcn_math_Vec2_transform_mat4_wasm;

	// Vec3
	_wcn_math_Vec3_set_wasm = exports.wcn_math_Vec3_set_wasm as typeof _wcn_math_Vec3_set_wasm;
	_wcn_math_Vec3_copy_wasm = exports.wcn_math_Vec3_copy_wasm as typeof _wcn_math_Vec3_copy_wasm;
	_wcn_math_Vec3_zero_wasm = exports.wcn_math_Vec3_zero_wasm as typeof _wcn_math_Vec3_zero_wasm;
	_wcn_math_Vec3_identity_wasm = exports.wcn_math_Vec3_identity_wasm as typeof _wcn_math_Vec3_identity_wasm;
	_wcn_math_Vec3_ceil_wasm = exports.wcn_math_Vec3_ceil_wasm as typeof _wcn_math_Vec3_ceil_wasm;
	_wcn_math_Vec3_floor_wasm = exports.wcn_math_Vec3_floor_wasm as typeof _wcn_math_Vec3_floor_wasm;
	_wcn_math_Vec3_round_wasm = exports.wcn_math_Vec3_round_wasm as typeof _wcn_math_Vec3_round_wasm;
	_wcn_math_Vec3_clamp_wasm = exports.wcn_math_Vec3_clamp_wasm as typeof _wcn_math_Vec3_clamp_wasm;
	_wcn_math_Vec3_add_wasm = exports.wcn_math_Vec3_add_wasm as typeof _wcn_math_Vec3_add_wasm;
	_wcn_math_Vec3_add_scaled_wasm = exports.wcn_math_Vec3_add_scaled_wasm as typeof _wcn_math_Vec3_add_scaled_wasm;
	_wcn_math_Vec3_sub_wasm = exports.wcn_math_Vec3_sub_wasm as typeof _wcn_math_Vec3_sub_wasm;
	_wcn_math_Vec3_multiply_wasm = exports.wcn_math_Vec3_multiply_wasm as typeof _wcn_math_Vec3_multiply_wasm;
	_wcn_math_Vec3_multiply_scalar_wasm = exports.wcn_math_Vec3_multiply_scalar_wasm as typeof _wcn_math_Vec3_multiply_scalar_wasm;
	_wcn_math_Vec3_div_wasm = exports.wcn_math_Vec3_div_wasm as typeof _wcn_math_Vec3_div_wasm;
	_wcn_math_Vec3_div_scalar_wasm = exports.wcn_math_Vec3_div_scalar_wasm as typeof _wcn_math_Vec3_div_scalar_wasm;
	_wcn_math_Vec3_inverse_wasm = exports.wcn_math_Vec3_inverse_wasm as typeof _wcn_math_Vec3_inverse_wasm;
	_wcn_math_Vec3_cross_wasm = exports.wcn_math_Vec3_cross_wasm as typeof _wcn_math_Vec3_cross_wasm;
	_wcn_math_Vec3_dot_wasm = exports.wcn_math_Vec3_dot_wasm as typeof _wcn_math_Vec3_dot_wasm;
	_wcn_math_Vec3_length_wasm = exports.wcn_math_Vec3_length_wasm as typeof _wcn_math_Vec3_length_wasm;
	_wcn_math_Vec3_length_squared_wasm = exports.wcn_math_Vec3_length_squared_wasm as typeof _wcn_math_Vec3_length_squared_wasm;

	_wcn_math_Vec3_distance_wasm = exports.wcn_math_Vec3_distance_wasm as typeof _wcn_math_Vec3_distance_wasm;
	_wcn_math_Vec3_distance_squared_wasm = exports.wcn_math_Vec3_distance_squared_wasm as typeof _wcn_math_Vec3_distance_squared_wasm;
	_wcn_math_Vec3_normalize_wasm = exports.wcn_math_Vec3_normalize_wasm as typeof _wcn_math_Vec3_normalize_wasm;
	_wcn_math_Vec3_negate_wasm = exports.wcn_math_Vec3_negate_wasm as typeof _wcn_math_Vec3_negate_wasm;
	_wcn_math_Vec3_lerp_wasm = exports.wcn_math_Vec3_lerp_wasm as typeof _wcn_math_Vec3_lerp_wasm;
	_wcn_math_Vec3_lerp_v_wasm = exports.wcn_math_Vec3_lerp_v_wasm as typeof _wcn_math_Vec3_lerp_v_wasm;
	_wcn_math_Vec3_fmax_wasm = exports.wcn_math_Vec3_fmax_wasm as typeof _wcn_math_Vec3_fmax_wasm;
	_wcn_math_Vec3_fmin_wasm = exports.wcn_math_Vec3_fmin_wasm as typeof _wcn_math_Vec3_fmin_wasm;
	_wcn_math_Vec3_angle_wasm = exports.wcn_math_Vec3_angle_wasm as typeof _wcn_math_Vec3_angle_wasm;
	_wcn_math_Vec3_equals_wasm = exports.wcn_math_Vec3_equals_wasm as typeof _wcn_math_Vec3_equals_wasm;
	_wcn_math_Vec3_equals_approximately_wasm = exports.wcn_math_Vec3_equals_approximately_wasm as typeof _wcn_math_Vec3_equals_approximately_wasm;
	_wcn_math_Vec3_random_wasm = exports.wcn_math_Vec3_random_wasm as typeof _wcn_math_Vec3_random_wasm;
	_wcn_math_Vec3_set_length_wasm = exports.wcn_math_Vec3_set_length_wasm as typeof _wcn_math_Vec3_set_length_wasm;
	_wcn_math_Vec3_truncate_wasm = exports.wcn_math_Vec3_truncate_wasm as typeof _wcn_math_Vec3_truncate_wasm;
	_wcn_math_Vec3_midpoint_wasm = exports.wcn_math_Vec3_midpoint_wasm as typeof _wcn_math_Vec3_midpoint_wasm;
	_wcn_math_Vec3_scale_wasm = exports.wcn_math_Vec3_scale_wasm as typeof _wcn_math_Vec3_scale_wasm;
	_wcn_math_Vec3_rotate_x_wasm = exports.wcn_math_Vec3_rotate_x_wasm as typeof _wcn_math_Vec3_rotate_x_wasm;
	_wcn_math_Vec3_rotate_y_wasm = exports.wcn_math_Vec3_rotate_y_wasm as typeof _wcn_math_Vec3_rotate_y_wasm;
	_wcn_math_Vec3_rotate_z_wasm = exports.wcn_math_Vec3_rotate_z_wasm as typeof _wcn_math_Vec3_rotate_z_wasm;
	_wcn_math_Vec3_transform_mat4_wasm = exports.wcn_math_Vec3_transform_mat4_wasm as typeof _wcn_math_Vec3_transform_mat4_wasm;
	_wcn_math_Vec3_transform_mat3_wasm = exports.wcn_math_Vec3_transform_mat3_wasm as typeof _wcn_math_Vec3_transform_mat3_wasm;
	_wcn_math_Vec3_transform_quat_wasm = exports.wcn_math_Vec3_transform_quat_wasm as typeof _wcn_math_Vec3_transform_quat_wasm;

	// Vec4
	_wcn_math_Vec4_set_wasm = exports.wcn_math_Vec4_set_wasm as typeof _wcn_math_Vec4_set_wasm;
	_wcn_math_Vec4_copy_wasm = exports.wcn_math_Vec4_copy_wasm as typeof _wcn_math_Vec4_copy_wasm;
	_wcn_math_Vec4_zero_wasm = exports.wcn_math_Vec4_zero_wasm as typeof _wcn_math_Vec4_zero_wasm;
	_wcn_math_Vec4_identity_wasm = exports.wcn_math_Vec4_identity_wasm as typeof _wcn_math_Vec4_identity_wasm;
	_wcn_math_Vec4_ceil_wasm = exports.wcn_math_Vec4_ceil_wasm as typeof _wcn_math_Vec4_ceil_wasm;
	_wcn_math_Vec4_floor_wasm = exports.wcn_math_Vec4_floor_wasm as typeof _wcn_math_Vec4_floor_wasm;
	_wcn_math_Vec4_round_wasm = exports.wcn_math_Vec4_round_wasm as typeof _wcn_math_Vec4_round_wasm;
	_wcn_math_Vec4_clamp_wasm = exports.wcn_math_Vec4_clamp_wasm as typeof _wcn_math_Vec4_clamp_wasm;
	_wcn_math_Vec4_add_wasm = exports.wcn_math_Vec4_add_wasm as typeof _wcn_math_Vec4_add_wasm;
	_wcn_math_Vec4_add_scaled_wasm = exports.wcn_math_Vec4_add_scaled_wasm as typeof _wcn_math_Vec4_add_scaled_wasm;
	_wcn_math_Vec4_sub_wasm = exports.wcn_math_Vec4_sub_wasm as typeof _wcn_math_Vec4_sub_wasm;
	_wcn_math_Vec4_multiply_wasm = exports.wcn_math_Vec4_multiply_wasm as typeof _wcn_math_Vec4_multiply_wasm;
	_wcn_math_Vec4_multiply_scalar_wasm = exports.wcn_math_Vec4_multiply_scalar_wasm as typeof _wcn_math_Vec4_multiply_scalar_wasm;
	_wcn_math_Vec4_div_wasm = exports.wcn_math_Vec4_div_wasm as typeof _wcn_math_Vec4_div_wasm;
	_wcn_math_Vec4_div_scalar_wasm = exports.wcn_math_Vec4_div_scalar_wasm as typeof _wcn_math_Vec4_div_scalar_wasm;
	_wcn_math_Vec4_inverse_wasm = exports.wcn_math_Vec4_inverse_wasm as typeof _wcn_math_Vec4_inverse_wasm;
	_wcn_math_Vec4_dot_wasm = exports.wcn_math_Vec4_dot_wasm as typeof _wcn_math_Vec4_dot_wasm;
	_wcn_math_Vec4_length_wasm = exports.wcn_math_Vec4_length_wasm as typeof _wcn_math_Vec4_length_wasm;
	_wcn_math_Vec4_length_squared_wasm = exports.wcn_math_Vec4_length_squared_wasm as typeof _wcn_math_Vec4_length_squared_wasm;
	_wcn_math_Vec4_distance_wasm = exports.wcn_math_Vec4_distance_wasm as typeof _wcn_math_Vec4_distance_wasm;
	_wcn_math_Vec4_distance_squared_wasm = exports.wcn_math_Vec4_distance_squared_wasm as typeof _wcn_math_Vec4_distance_squared_wasm;
	_wcn_math_Vec4_normalize_wasm = exports.wcn_math_Vec4_normalize_wasm as typeof _wcn_math_Vec4_normalize_wasm;
	_wcn_math_Vec4_negate_wasm = exports.wcn_math_Vec4_negate_wasm as typeof _wcn_math_Vec4_negate_wasm;
	_wcn_math_Vec4_lerp_wasm = exports.wcn_math_Vec4_lerp_wasm as typeof _wcn_math_Vec4_lerp_wasm;
	_wcn_math_Vec4_lerp_v_wasm = exports.wcn_math_Vec4_lerp_v_wasm as typeof _wcn_math_Vec4_lerp_v_wasm;
	_wcn_math_Vec4_fmax_wasm = exports.wcn_math_Vec4_fmax_wasm as typeof _wcn_math_Vec4_fmax_wasm;
	_wcn_math_Vec4_fmin_wasm = exports.wcn_math_Vec4_fmin_wasm as typeof _wcn_math_Vec4_fmin_wasm;

	_wcn_math_Vec4_equals_wasm = exports.wcn_math_Vec4_equals_wasm as typeof _wcn_math_Vec4_equals_wasm;
	_wcn_math_Vec4_equals_approximately_wasm = exports.wcn_math_Vec4_equals_approximately_wasm as typeof _wcn_math_Vec4_equals_approximately_wasm;
	_wcn_math_Vec4_set_length_wasm = exports.wcn_math_Vec4_set_length_wasm as typeof _wcn_math_Vec4_set_length_wasm;
	_wcn_math_Vec4_truncate_wasm = exports.wcn_math_Vec4_truncate_wasm as typeof _wcn_math_Vec4_truncate_wasm;
	_wcn_math_Vec4_midpoint_wasm = exports.wcn_math_Vec4_midpoint_wasm as typeof _wcn_math_Vec4_midpoint_wasm;
	_wcn_math_Vec4_transform_mat4_wasm = exports.wcn_math_Vec4_transform_mat4_wasm as typeof _wcn_math_Vec4_transform_mat4_wasm;

	// Quat
	_wcn_math_Quat_copy_wasm = exports.wcn_math_Quat_copy_wasm as typeof _wcn_math_Quat_copy_wasm;
	_wcn_math_Quat_zero_wasm = exports.wcn_math_Quat_zero_wasm as typeof _wcn_math_Quat_zero_wasm;
	_wcn_math_Quat_identity_wasm = exports.wcn_math_Quat_identity_wasm as typeof _wcn_math_Quat_identity_wasm;
	_wcn_math_Quat_dot_wasm = exports.wcn_math_Quat_dot_wasm as typeof _wcn_math_Quat_dot_wasm;
	_wcn_math_Quat_lerp_wasm = exports.wcn_math_Quat_lerp_wasm as typeof _wcn_math_Quat_lerp_wasm;
	_wcn_math_Quat_multiply_wasm = exports.wcn_math_Quat_multiply_wasm as typeof _wcn_math_Quat_multiply_wasm;
	_wcn_math_Quat_multiply_scalar_wasm = exports.wcn_math_Quat_multiply_scalar_wasm as typeof _wcn_math_Quat_multiply_scalar_wasm;
	_wcn_math_Quat_add_wasm = exports.wcn_math_Quat_add_wasm as typeof _wcn_math_Quat_add_wasm;
	_wcn_math_Quat_sub_wasm = exports.wcn_math_Quat_sub_wasm as typeof _wcn_math_Quat_sub_wasm;
	_wcn_math_Quat_normalize_wasm = exports.wcn_math_Quat_normalize_wasm as typeof _wcn_math_Quat_normalize_wasm;
	_wcn_math_Quat_slerp_wasm = exports.wcn_math_Quat_slerp_wasm as typeof _wcn_math_Quat_slerp_wasm;
	_wcn_math_Quat_sqlerp_wasm = exports.wcn_math_Quat_sqlerp_wasm as typeof _wcn_math_Quat_sqlerp_wasm;
	_wcn_math_Quat_length_wasm = exports.wcn_math_Quat_length_wasm as typeof _wcn_math_Quat_length_wasm;
	_wcn_math_Quat_length_squared_wasm = exports.wcn_math_Quat_length_squared_wasm as typeof _wcn_math_Quat_length_squared_wasm;
	_wcn_math_Quat_equals_wasm = exports.wcn_math_Quat_equals_wasm as typeof _wcn_math_Quat_equals_wasm;
	_wcn_math_Quat_equals_approximately_wasm = exports.wcn_math_Quat_equals_approximately_wasm as typeof _wcn_math_Quat_equals_approximately_wasm;
	_wcn_math_Quat_angle_wasm = exports.wcn_math_Quat_angle_wasm as typeof _wcn_math_Quat_angle_wasm;
	_wcn_math_Quat_rotation_to_wasm = exports.wcn_math_Quat_rotation_to_wasm as typeof _wcn_math_Quat_rotation_to_wasm;
	_wcn_math_Quat_inverse_wasm = exports.wcn_math_Quat_inverse_wasm as typeof _wcn_math_Quat_inverse_wasm;
	_wcn_math_Quat_conjugate_wasm = exports.wcn_math_Quat_conjugate_wasm as typeof _wcn_math_Quat_conjugate_wasm;
	_wcn_math_Quat_div_scalar_wasm = exports.wcn_math_Quat_div_scalar_wasm as typeof _wcn_math_Quat_div_scalar_wasm;
	_wcn_math_Quat_from_euler_wasm = exports.wcn_math_Quat_from_euler_wasm as typeof _wcn_math_Quat_from_euler_wasm;
	_wcn_math_Quat_from_axis_angle_wasm = exports.wcn_math_Quat_from_axis_angle_wasm as typeof _wcn_math_Quat_from_axis_angle_wasm;
	_wcn_math_Quat_from_mat4_wasm = exports.wcn_math_Quat_from_mat4_wasm as typeof _wcn_math_Quat_from_mat4_wasm;
	_wcn_math_Quat_from_mat3_wasm = exports.wcn_math_Quat_from_mat3_wasm as typeof _wcn_math_Quat_from_mat3_wasm;
	_wcn_math_Quat_rotate_x_wasm = exports.wcn_math_Quat_rotate_x_wasm as typeof _wcn_math_Quat_rotate_x_wasm;
	_wcn_math_Quat_rotate_y_wasm = exports.wcn_math_Quat_rotate_y_wasm as typeof _wcn_math_Quat_rotate_y_wasm;
	_wcn_math_Quat_rotate_z_wasm = exports.wcn_math_Quat_rotate_z_wasm as typeof _wcn_math_Quat_rotate_z_wasm;
	_wcn_math_Quat_scale_wasm = exports.wcn_math_Quat_scale_wasm as typeof _wcn_math_Quat_scale_wasm;

	// Mat3
	_wcn_math_Mat3_copy_wasm = exports.wcn_math_Mat3_copy_wasm as typeof _wcn_math_Mat3_copy_wasm;
	_wcn_math_Mat3_zero_wasm = exports.wcn_math_Mat3_zero_wasm as typeof _wcn_math_Mat3_zero_wasm;
	_wcn_math_Mat3_identity_wasm = exports.wcn_math_Mat3_identity_wasm as typeof _wcn_math_Mat3_identity_wasm;
	_wcn_math_Mat3_equals_wasm = exports.wcn_math_Mat3_equals_wasm as typeof _wcn_math_Mat3_equals_wasm;
	_wcn_math_Mat3_equals_approximately_wasm = exports.wcn_math_Mat3_equals_approximately_wasm as typeof _wcn_math_Mat3_equals_approximately_wasm;
	_wcn_math_Mat3_negate_wasm = exports.wcn_math_Mat3_negate_wasm as typeof _wcn_math_Mat3_negate_wasm;
	_wcn_math_Mat3_transpose_wasm = exports.wcn_math_Mat3_transpose_wasm as typeof _wcn_math_Mat3_transpose_wasm;
	_wcn_math_Mat3_add_wasm = exports.wcn_math_Mat3_add_wasm as typeof _wcn_math_Mat3_add_wasm;
	_wcn_math_Mat3_sub_wasm = exports.wcn_math_Mat3_sub_wasm as typeof _wcn_math_Mat3_sub_wasm;
	_wcn_math_Mat3_multiply_wasm = exports.wcn_math_Mat3_multiply_wasm as typeof _wcn_math_Mat3_multiply_wasm;
	_wcn_math_Mat3_multiply_scalar_wasm = exports.wcn_math_Mat3_multiply_scalar_wasm as typeof _wcn_math_Mat3_multiply_scalar_wasm;

	_wcn_math_Mat3_inverse_wasm = exports.wcn_math_Mat3_inverse_wasm as typeof _wcn_math_Mat3_inverse_wasm;
	_wcn_math_Mat3_determinant_wasm = exports.wcn_math_Mat3_determinant_wasm as typeof _wcn_math_Mat3_determinant_wasm;
	_wcn_math_Mat3_from_mat4_wasm = exports.wcn_math_Mat3_from_mat4_wasm as typeof _wcn_math_Mat3_from_mat4_wasm;
	_wcn_math_Mat3_from_quat_wasm = exports.wcn_math_Mat3_from_quat_wasm as typeof _wcn_math_Mat3_from_quat_wasm;
	_wcn_math_Mat3_rotate_wasm = exports.wcn_math_Mat3_rotate_wasm as typeof _wcn_math_Mat3_rotate_wasm;
	_wcn_math_Mat3_translate_wasm = exports.wcn_math_Mat3_translate_wasm as typeof _wcn_math_Mat3_translate_wasm;
	_wcn_math_Mat3_scale_wasm = exports.wcn_math_Mat3_scale_wasm as typeof _wcn_math_Mat3_scale_wasm;

	// Mat4
	_wcn_math_Mat4_copy_wasm = exports.wcn_math_Mat4_copy_wasm as typeof _wcn_math_Mat4_copy_wasm;
	_wcn_math_Mat4_zero_wasm = exports.wcn_math_Mat4_zero_wasm as typeof _wcn_math_Mat4_zero_wasm;
	_wcn_math_Mat4_identity_wasm = exports.wcn_math_Mat4_identity_wasm as typeof _wcn_math_Mat4_identity_wasm;
	_wcn_math_Mat4_negate_wasm = exports.wcn_math_Mat4_negate_wasm as typeof _wcn_math_Mat4_negate_wasm;
	_wcn_math_Mat4_equals_wasm = exports.wcn_math_Mat4_equals_wasm as typeof _wcn_math_Mat4_equals_wasm;
	_wcn_math_Mat4_equals_approximately_wasm = exports.wcn_math_Mat4_equals_approximately_wasm as typeof _wcn_math_Mat4_equals_approximately_wasm;
	_wcn_math_Mat4_add_wasm = exports.wcn_math_Mat4_add_wasm as typeof _wcn_math_Mat4_add_wasm;
	_wcn_math_Mat4_sub_wasm = exports.wcn_math_Mat4_sub_wasm as typeof _wcn_math_Mat4_sub_wasm;
	_wcn_math_Mat4_multiply_wasm = exports.wcn_math_Mat4_multiply_wasm as typeof _wcn_math_Mat4_multiply_wasm;
	_wcn_math_Mat4_multiply_scalar_wasm = exports.wcn_math_Mat4_multiply_scalar_wasm as typeof _wcn_math_Mat4_multiply_scalar_wasm;
	_wcn_math_Mat4_inverse_wasm = exports.wcn_math_Mat4_inverse_wasm as typeof _wcn_math_Mat4_inverse_wasm;
	_wcn_math_Mat4_transpose_wasm = exports.wcn_math_Mat4_transpose_wasm as typeof _wcn_math_Mat4_transpose_wasm;
	_wcn_math_Mat4_determinant_wasm = exports.wcn_math_Mat4_determinant_wasm as typeof _wcn_math_Mat4_determinant_wasm;
	_wcn_math_Mat4_from_mat3_wasm = exports.wcn_math_Mat4_from_mat3_wasm as typeof _wcn_math_Mat4_from_mat3_wasm;
	_wcn_math_Mat4_from_quat_wasm = exports.wcn_math_Mat4_from_quat_wasm as typeof _wcn_math_Mat4_from_quat_wasm;
	_wcn_math_Mat4_translate_wasm = exports.wcn_math_Mat4_translate_wasm as typeof _wcn_math_Mat4_translate_wasm;
	_wcn_math_Mat4_perspective_wasm = exports.wcn_math_Mat4_perspective_wasm as typeof _wcn_math_Mat4_perspective_wasm;
	_wcn_math_Mat4_ortho_wasm = exports.wcn_math_Mat4_ortho_wasm as typeof _wcn_math_Mat4_ortho_wasm;
	_wcn_math_Mat4_look_at_wasm = exports.wcn_math_Mat4_look_at_wasm as typeof _wcn_math_Mat4_look_at_wasm;
	_wcn_math_Mat4_rotate_wasm = exports.wcn_math_Mat4_rotate_wasm as typeof _wcn_math_Mat4_rotate_wasm;
	_wcn_math_Mat4_rotate_x_wasm = exports.wcn_math_Mat4_rotate_x_wasm as typeof _wcn_math_Mat4_rotate_x_wasm;
	_wcn_math_Mat4_rotate_y_wasm = exports.wcn_math_Mat4_rotate_y_wasm as typeof _wcn_math_Mat4_rotate_y_wasm;
	_wcn_math_Mat4_rotate_z_wasm = exports.wcn_math_Mat4_rotate_z_wasm as typeof _wcn_math_Mat4_rotate_z_wasm;
	_wcn_math_Mat4_scale_wasm = exports.wcn_math_Mat4_scale_wasm as typeof _wcn_math_Mat4_scale_wasm;
}
