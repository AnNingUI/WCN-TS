import type { F32Size, Ptr } from "./ptr";
import type { Add, Mul } from "./utils";

/**
 * ```c
typedef struct {
    float v[2];
} WMATH_TYPE(Vec2);
 * ```
 */
export type Vec2Ptr = Ptr<Mul<F32Size, 2>, "WCN_Math_Vec2">;
/**
 * ```c
typedef struct {
  float v[3];
} WMATH_TYPE(Vec3);
 * ```
 */
export type Vec3Ptr = Ptr<Mul<F32Size, 3>, "WCN_Math_Vec3">;
/**
 * ```c
typedef struct {
  float angle;
  WMATH_TYPE(Vec3) axis;
} WCN_Math_Vec3_WithAngleAxis;
 * ```
 */
export type Vec3WithWithAngleAxisPtr = Ptr<
	Add<F32Size, Mul<F32Size, 3>>,
	"WCN_Math_Vec3_WithAngleAxis"
>;
export type Vec4Ptr = Ptr<Mul<F32Size, 4>>;
export type QuatPtr = Ptr<Mul<F32Size, 4>>;
/**
 * @index 0 [00, 01, 02, padding]
 * @index 1 [10, 11, 12, padding]
 * @index 2 [20, 21, 22, padding]
 * ```c
typedef struct {
  float m[12]; // Using 12 elements for better SIMD alignment
} WMATH_TYPE(Mat3);
 * ```
 */
export type Mat3Ptr = Ptr<Mul<F32Size, 12>>;
/**
 * ```c
typedef struct {
  float m[16];
} WMATH_TYPE(Mat4);
 * ```
 */
export type Mat4Ptr = Ptr<Mul<F32Size, 16>>;

export enum RotationOrder {
	XYZ = 0,
	XZY = 1,
	YXZ = 2,
	YZX = 3,
	ZXY = 4,
	ZYX = 5,
}

export enum Mat3Index {
	$00 = 0x00,
	$01 = 0x01,
	$02 = 0x02,
	$10 = 0x10,
	$11 = 0x11,
	$12 = 0x12,
	$20 = 0x20,
	$21 = 0x21,
	$22 = 0x22,
}
export enum Mat4Index {
	$00 = 0x00,
	$01 = 0x01,
	$02 = 0x02,
	$03 = 0x03,
	$10 = 0x10,
	$11 = 0x11,
	$12 = 0x12,
	$13 = 0x13,
	$20 = 0x20,
	$21 = 0x21,
	$22 = 0x22,
	$23 = 0x23,
	$30 = 0x30,
	$31 = 0x31,
	$32 = 0x32,
	$33 = 0x33,
}

export const $PI = 3.141592653589793 as const;
export const $2xPI = 6.283185307179586 as const;
export const $PId2 = 1.5707963267948966 as const;
