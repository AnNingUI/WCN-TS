/**
 * WCN WASM ES Module 演示
 */

import { createWCN, WCNCanvas, Vec2, Vec3, Mat4, Quat, $PI } from "./index";

// 假设 wasm 文件通过 Vite 等构建工具导入
// import wasmUrl from "../lookme/wcn.wasm?url";

async function main() {
	// ========================================
	// 1. 初始化 WCN 模块
	// ========================================
	await createWCN({
		loadWasm: async () => {
			const res = await fetch("/wcn.wasm");
			return res.arrayBuffer();
		},
	});

	console.log("WCN 模块初始化完成");

	// ========================================
	// 2. 数学类型演示
	// ========================================
	console.log("\n=== 数学类型演示 ===");

	// Vec2
	const v1 = Vec2.create(3, 4);
	const v2 = Vec2.create(1, 2);
	console.log(`v1 = ${v1}`); // [3, 4]
	console.log(`v1.ptr = ${v1.ptr}, v1.x = ${v1.x}, v1.y = ${v1.y}`);
	console.log(`v2 = ${v2}`); // [1, 2]
	console.log(`v2.ptr = ${v2.ptr}, v2.x = ${v2.x}, v2.y = ${v2.y}`);
	const v1AddV2 = v1.add(v2);
	console.log(`v1 + v2 = ${v1AddV2}`); // [4, 6]
	console.log(`v1.length() = ${v1.length()}`); // 5
	console.log(`v1.dot(v2) = ${v1.dot(v2)}`); // 11
	const v1Norm = v1.normalize();
	console.log(`v1.normalize() = ${v1Norm}`); // [0.6, 0.8]

	// 测试 free 前检查指针
	console.log(`Before free: v1AddV2.ptr = ${v1AddV2.ptr}, v1Norm.ptr = ${v1Norm.ptr}`);
	v1AddV2.free();
	console.log("v1AddV2 freed");
	v1Norm.free();
	console.log("v1Norm freed");

	// Vec3
	const v3 = Vec3.create(1, 0, 0);
	const v4 = Vec3.create(0, 1, 0);
	console.log(`\nv3 = ${v3}`); // [1, 0, 0]
	console.log(`v4 = ${v4}`); // [0, 1, 0]
	const v3CrossV4 = v3.cross(v4);
	console.log(`v3.cross(v4) = ${v3CrossV4}`); // [0, 0, 1]
	v3CrossV4.free();

	// Mat4
	const identity = Mat4.identity();
	console.log("\nMat4.identity():", identity.toF32Array());

	const perspective = Mat4.perspective($PI / 4, 16 / 9, 0.1, 100);
	console.log("Mat4.perspective():", perspective.toF32Array());

	const eye = Vec3.create(0, 0, 5);
	const center = Vec3.create(0, 0, 0);
	const up = Vec3.create(0, 1, 0);
	const view = Mat4.lookAt(eye, center, up);
	console.log("Mat4.lookAt():", view.toF32Array());

	// Quat
	const axis = Vec3.create(0, 1, 0);
	const q1 = Quat.fromAxisAngle(axis, $PI / 2);
	console.log(`\nQuat.fromAxisAngle(Y, PI/2) = ${q1}`);

	const q2 = Quat.fromEuler(0, $PI / 4, 0);
	console.log(`Quat.fromEuler(0, PI/4, 0) = ${q2}`);

	const rotationMatrix = q1.toMat4();
	console.log("q1.toMat4():", rotationMatrix.toF32Array());

	// 释放内存
	v1.free();
	v2.free();
	v3.free();
	v4.free();
	identity.free();
	perspective.free();
	eye.free();
	center.free();
	up.free();
	view.free();
	axis.free();
	q1.free();
	q2.free();
	rotationMatrix.free();

	// ========================================
	// 3. Canvas 绑定演示
	// ========================================
	console.log("\n=== Canvas 演示 ===");

	const canvas = document.getElementById("wcn-canvas") as HTMLCanvasElement;
	if (!canvas) {
		console.warn("未找到 canvas 元素，跳过 Canvas 演示");
		return;
	}

	try {
		const wcn = await WCNCanvas.create(canvas);
		console.log("WCNCanvas 创建成功");

		let time = 0;

		// 渲染循环
		function render() {
			time += 0.016; // ~60fps

			wcn.beginFrame();

			const pass = wcn.beginRenderPass();
			if (pass) {
				const W = canvas.width;
				const H = canvas.height;

				// 清除背景
				wcn.setFillStyle("#1a1a2e");
				wcn.fillRect(0, 0, W, H);

				// ========== 绘制网格背景 ==========
				wcn.setStrokeStyle("rgba(255, 255, 255, 0.1)");
				wcn.setLineWidth(1);
				for (let x = 0; x <= W; x += 40) {
					wcn.beginPath();
					wcn.moveTo(x, 0);
					wcn.lineTo(x, H);
					wcn.stroke();
				}
				for (let y = 0; y <= H; y += 40) {
					wcn.beginPath();
					wcn.moveTo(0, y);
					wcn.lineTo(W, y);
					wcn.stroke();
				}

				// ========== 动态旋转的矩形 ==========
				wcn.save();
				wcn.translate(150, 150);
				wcn.rotate(time);
				wcn.setFillStyle("rgba(255, 107, 107, 0.8)");
				wcn.fillRect(-50, -50, 100, 100);
				wcn.setStrokeStyle("#ffffff");
				wcn.setLineWidth(2);
				wcn.strokeRect(-50, -50, 100, 100);
				wcn.restore();

				// ========== 脉动的圆形 ==========
				const pulseRadius = 40 + Math.sin(time * 3) * 15;
				wcn.beginPath();
				wcn.arc(350, 150, pulseRadius, 0, Math.PI * 2);
				wcn.setFillStyle("rgba(78, 205, 196, 0.8)");
				wcn.fill();
				wcn.setStrokeStyle("#ffffff");
				wcn.setLineWidth(2);
				wcn.stroke();

				// ========== 彩虹色矩形序列 ==========
				const colors = [
					"rgba(255, 0, 0, 0.7)",
					"rgba(255, 127, 0, 0.7)",
					"rgba(255, 255, 0, 0.7)",
					"rgba(0, 255, 0, 0.7)",
					"rgba(0, 0, 255, 0.7)",
					"rgba(75, 0, 130, 0.7)",
					"rgba(148, 0, 211, 0.7)",
				];
				for (let i = 0; i < colors.length; i++) {
					const offset = Math.sin(time * 2 + i * 0.5) * 10;
					wcn.setFillStyle(colors[i]);
					wcn.fillRect(500 + i * 35, 100 + offset, 30, 100);
				}

				// ========== 旋转的三角形 ==========
				wcn.save();
				wcn.translate(150, 350);
				wcn.rotate(-time * 0.7);
				wcn.beginPath();
				wcn.moveTo(0, -60);
				wcn.lineTo(52, 30);
				wcn.lineTo(-52, 30);
				wcn.closePath();
				wcn.setFillStyle("rgba(155, 89, 182, 0.8)");
				wcn.fill();
				wcn.setStrokeStyle("#ffffff");
				wcn.setLineWidth(2);
				wcn.stroke();
				wcn.restore();

				// ========== 波浪线 ==========
				wcn.beginPath();
				wcn.moveTo(280, 350);
				for (let x = 0; x <= 200; x += 5) {
					const y = Math.sin((x + time * 100) * 0.05) * 30;
					wcn.lineTo(280 + x, 350 + y);
				}
				wcn.setStrokeStyle("rgba(46, 204, 113, 0.9)");
				wcn.setLineWidth(3);
				wcn.stroke();

				// ========== 同心圆 ==========
				for (let i = 5; i > 0; i--) {
					const radius = i * 20 + Math.sin(time * 2) * 5;
					wcn.beginPath();
					wcn.arc(600, 350, radius, 0, Math.PI * 2);
					const alpha = 0.2 + (5 - i) * 0.15;
					wcn.setFillStyle(`rgba(241, 196, 15, ${alpha})`);
					wcn.fill();
				}

				// ========== 星形 ==========
				wcn.save();
				wcn.translate(700, 150);
				wcn.rotate(time * 0.5);
				wcn.beginPath();
				for (let i = 0; i < 5; i++) {
					const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
					const x = Math.cos(angle) * 50;
					const y = Math.sin(angle) * 50;
					if (i === 0) wcn.moveTo(x, y);
					else wcn.lineTo(x, y);
				}
				wcn.closePath();
				wcn.setFillStyle("rgba(230, 126, 34, 0.8)");
				wcn.fill();
				wcn.setStrokeStyle("#ffffff");
				wcn.setLineWidth(2);
				wcn.stroke();
				wcn.restore();

				// ========== 渐变效果的矩形序列 ==========
				for (let i = 0; i < 10; i++) {
					const alpha = 1 - i * 0.1;
					const size = 80 - i * 5;
					const offset = i * 8;
					wcn.setFillStyle(`rgba(52, 152, 219, ${alpha})`);
					wcn.fillRect(550 + offset, 450 + offset, size, size);
				}

				// ========== 文本 ==========
				wcn.setFont("32px Arial");
				wcn.setFillStyle("#ffffff");
				wcn.fillText("WCN WebGPU Canvas", 250, 550);

				wcn.setFont("16px Arial");
				wcn.setFillStyle("rgba(255, 255, 255, 0.6)");
				wcn.fillText(`Frame Time: ${(time * 1000).toFixed(0)}ms`, 20, 580);
			}

			wcn.endFrame();
			requestAnimationFrame(render);
		}

		render();
	} catch (e) {
		console.error("Canvas 演示失败:", e);
	}
}

main().catch(console.error);
