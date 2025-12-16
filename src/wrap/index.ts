/**
 * WCN Wrapper Classes - Barrel Export
 */

export { WCNCanvas, WCNImage } from "./canvas";
export type { WCNCanvasOptions } from "./canvas";

export { Vec2 } from "./vec2";
export { Vec3 } from "./vec3";
export { Vec4 } from "./vec4";
export { Mat3 } from "./mat3";
export { Mat4 } from "./mat4";
export { Quat } from "./quat";

// Register Mat3 and Mat4 globally for Quat.toMat3/toMat4
import { Mat3 } from "./mat3";
import { Mat4 } from "./mat4";
(globalThis as unknown as { Mat3: typeof Mat3; Mat4: typeof Mat4 }).Mat3 = Mat3;
(globalThis as unknown as { Mat3: typeof Mat3; Mat4: typeof Mat4 }).Mat4 = Mat4;
