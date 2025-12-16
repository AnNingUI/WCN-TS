/**
 * WCN WASM ES Module 演示 - 带后处理特效
 */

import { createWCN, WCNCanvas } from "./index";

// ============================================================================
// 后处理 Shader
// ============================================================================

const postProcessShader = /* wgsl */ `
struct VertexOutput {
	@builtin(position) position: vec4f,
	@location(0) uv: vec2f,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
	// 全屏三角形
	var pos = array<vec2f, 3>(
		vec2f(-1.0, -1.0),
		vec2f(3.0, -1.0),
		vec2f(-1.0, 3.0)
	);
	var uv = array<vec2f, 3>(
		vec2f(0.0, 1.0),
		vec2f(2.0, 1.0),
		vec2f(0.0, -1.0)
	);
	var output: VertexOutput;
	output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
	output.uv = uv[vertexIndex];
	return output;
}

struct Uniforms {
	resolution: vec2f,    // offset 0, 8 bytes
	time: f32,            // offset 8, 4 bytes
	effectStrength: f32,  // offset 12, 4 bytes
	sdfStrength: f32,     // offset 16, 4 bytes - SDF 效果强度
	sdfMode: f32,         // offset 20, 4 bytes - SDF 模式 (0=off, 1=outline, 2=glow, 3=shadow)
	_pad: vec2f,          // offset 24, 8 bytes - padding to 32 bytes
}

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var inputSampler: sampler;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;

// ============================================================================
// 基础效果
// ============================================================================

// 色差效果
fn chromaticAberration(uv: vec2f, strength: f32) -> vec3f {
	let offset = strength * 0.005;
	let r = textureSample(inputTexture, inputSampler, uv + vec2f(offset, 0.0)).r;
	let g = textureSample(inputTexture, inputSampler, uv).g;
	let b = textureSample(inputTexture, inputSampler, uv - vec2f(offset, 0.0)).b;
	return vec3f(r, g, b);
}

// 暗角效果
fn vignette(uv: vec2f, strength: f32) -> f32 {
	let center = vec2f(0.5, 0.5);
	let dist = distance(uv, center);
	return 1.0 - smoothstep(0.3, 0.8, dist * strength);
}

// 扫描线效果
fn scanlines(uv: vec2f, time: f32) -> f32 {
	let line = sin(uv.y * uniforms.resolution.y * 0.5 + time * 2.0) * 0.5 + 0.5;
	return mix(0.95, 1.0, line);
}

// 噪点效果
fn noise(uv: vec2f, time: f32) -> f32 {
	return fract(sin(dot(uv + time * 0.1, vec2f(12.9898, 78.233))) * 43758.5453);
}

// 发光/泛光效果
fn bloom(uv: vec2f) -> vec3f {
	var color = vec3f(0.0);
	let blurSize = 0.003;
	for (var i = -2; i <= 2; i++) {
		for (var j = -2; j <= 2; j++) {
			let offset = vec2f(f32(i), f32(j)) * blurSize;
			color += textureSample(inputTexture, inputSampler, uv + offset).rgb;
		}
	}
	return color / 25.0;
}

// ============================================================================
// SDF 效果与抗锯齿
// ============================================================================

// 从颜色计算亮度作为 SDF 近似值
fn getLuminance(color: vec3f) -> f32 {
	return dot(color, vec3f(0.299, 0.587, 0.114));
}

// 计算边缘检测 (Sobel) - 返回梯度向量
fn sobelGradient(uv: vec2f) -> vec2f {
	let texelSize = 1.0 / uniforms.resolution;
	
	let tl = getLuminance(textureSample(inputTexture, inputSampler, uv + vec2f(-1.0, -1.0) * texelSize).rgb);
	let t  = getLuminance(textureSample(inputTexture, inputSampler, uv + vec2f( 0.0, -1.0) * texelSize).rgb);
	let tr = getLuminance(textureSample(inputTexture, inputSampler, uv + vec2f( 1.0, -1.0) * texelSize).rgb);
	let l  = getLuminance(textureSample(inputTexture, inputSampler, uv + vec2f(-1.0,  0.0) * texelSize).rgb);
	let r  = getLuminance(textureSample(inputTexture, inputSampler, uv + vec2f( 1.0,  0.0) * texelSize).rgb);
	let bl = getLuminance(textureSample(inputTexture, inputSampler, uv + vec2f(-1.0,  1.0) * texelSize).rgb);
	let b  = getLuminance(textureSample(inputTexture, inputSampler, uv + vec2f( 0.0,  1.0) * texelSize).rgb);
	let br = getLuminance(textureSample(inputTexture, inputSampler, uv + vec2f( 1.0,  1.0) * texelSize).rgb);
	
	let gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
	let gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
	
	return vec2f(gx, gy);
}

// 计算边缘强度
fn sobelEdge(uv: vec2f) -> f32 {
	let grad = sobelGradient(uv);
	return length(grad);
}

// ============================================================================
// SDF 抗锯齿核心函数
// ============================================================================

// 基于屏幕空间导数的 SDF 抗锯齿
// 使用 fwidth 计算像素覆盖率，实现亚像素级平滑
fn sdfAA(distance: f32, edgeWidth: f32) -> f32 {
	// fwidth 返回相邻像素的变化率，用于计算抗锯齿宽度
	let fw = fwidth(distance);
	// 使用 smoothstep 在边缘处创建平滑过渡
	// edgeWidth 控制边缘的软硬程度
	let aa = smoothstep(-fw * edgeWidth, fw * edgeWidth, distance);
	return aa;
}

// 高质量 SDF 抗锯齿 - 使用多重采样
fn sdfAAMultisample(uv: vec2f, threshold: f32, edgeWidth: f32) -> f32 {
	let texelSize = 1.0 / uniforms.resolution;
	
	// 计算当前像素的 SDF 值 (使用亮度作为近似)
	let center = getLuminance(textureSample(inputTexture, inputSampler, uv).rgb);
	
	// 计算屏幕空间导数
	let dx = dpdx(center);
	let dy = dpdy(center);
	let gradient = sqrt(dx*dx + dy*dy);
	
	// 基于梯度的自适应抗锯齿宽度
	let aaWidth = max(gradient * edgeWidth, 0.001);
	
	// 计算到阈值的距离
	let dist = center - threshold;
	
	// 应用平滑
	return smoothstep(-aaWidth, aaWidth, dist);
}

// 边缘感知抗锯齿 - 只在边缘处应用
fn edgeAwareAA(uv: vec2f, baseColor: vec3f) -> vec3f {
	let texelSize = 1.0 / uniforms.resolution;
	
	// 获取梯度
	let grad = sobelGradient(uv);
	let edgeStrength = length(grad);
	
	// 计算边缘法线方向 (避免除零)
	let gradLen = max(length(grad), 0.0001);
	let normal = grad / gradLen;
	
	// 沿边缘法线方向采样 (必须在 uniform control flow 中)
	let offset1 = normal * texelSize * 0.5;
	let offset2 = normal * texelSize * -0.5;
	
	let sample1 = textureSample(inputTexture, inputSampler, uv + offset1).rgb;
	let sample2 = textureSample(inputTexture, inputSampler, uv + offset2).rgb;
	
	// 基于边缘强度混合 (低边缘强度时 blendFactor 接近 0，相当于返回 baseColor)
	let blendFactor = smoothstep(0.05, 0.3, edgeStrength) * 0.5;
	return mix(baseColor, (sample1 + sample2) * 0.5, blendFactor);
}

// FXAA 风格的快速抗锯齿
fn fxaaLite(uv: vec2f, baseColor: vec3f) -> vec3f {
	let texelSize = 1.0 / uniforms.resolution;
	
	// 采样周围像素 (必须在 uniform control flow 中)
	let n = textureSample(inputTexture, inputSampler, uv + vec2f(0.0, -1.0) * texelSize).rgb;
	let s = textureSample(inputTexture, inputSampler, uv + vec2f(0.0,  1.0) * texelSize).rgb;
	let e = textureSample(inputTexture, inputSampler, uv + vec2f( 1.0, 0.0) * texelSize).rgb;
	let w = textureSample(inputTexture, inputSampler, uv + vec2f(-1.0, 0.0) * texelSize).rgb;
	
	// 计算亮度
	let lumC = getLuminance(baseColor);
	let lumN = getLuminance(n);
	let lumS = getLuminance(s);
	let lumE = getLuminance(e);
	let lumW = getLuminance(w);
	
	// 计算对比度
	let lumMin = min(lumC, min(min(lumN, lumS), min(lumE, lumW)));
	let lumMax = max(lumC, max(max(lumN, lumS), max(lumE, lumW)));
	let lumRange = lumMax - lumMin;
	
	// 计算混合方向和权重
	let lumNS = lumN + lumS;
	let lumEW = lumE + lumW;
	let isHorizontal = abs(lumNS - 2.0 * lumC) >= abs(lumEW - 2.0 * lumC);
	
	// 预计算两个方向的混合结果
	let blendH = mix(baseColor, (n + s) * 0.5, 0.25);
	let blendV = mix(baseColor, (e + w) * 0.5, 0.25);
	
	// 使用 select 代替 if (uniform control flow)
	// 低对比度时返回原色，否则根据方向选择混合结果
	let blended = select(blendV, blendH, isHorizontal);
	let hasEdge = lumRange >= 0.05;
	return select(baseColor, blended, hasEdge);
}

// ============================================================================
// SDF 效果函数
// ============================================================================

// SDF 描边效果 - 带抗锯齿
fn sdfOutline(uv: vec2f, baseColor: vec3f, strength: f32) -> vec3f {
	let edge = sobelEdge(uv);
	let outlineColor = vec3f(1.0, 0.8, 0.2); // 金色描边
	let outlineWidth = strength * 2.0;
	
	// 使用 SDF 抗锯齿计算平滑的边缘
	let edgeDist = edge - 0.15;
	let aa = sdfAA(edgeDist, outlineWidth);
	
	// 平滑混合
	let outline = aa * strength;
	return mix(baseColor, outlineColor, outline);
}

// SDF 发光效果
fn sdfGlow(uv: vec2f, baseColor: vec3f, strength: f32, time: f32) -> vec3f {
	var glow = vec3f(0.0);
	let glowColor = vec3f(0.3, 0.6, 1.0); // 蓝色发光
	let samples = 8;
	let glowRadius = strength * 0.02;
	
	for (var i = 0; i < samples; i++) {
		let angle = f32(i) / f32(samples) * 6.28318 + time;
		let offset = vec2f(cos(angle), sin(angle)) * glowRadius;
		let sampleColor = textureSample(inputTexture, inputSampler, uv + offset).rgb;
		let lum = getLuminance(sampleColor);
		glow += glowColor * lum;
	}
	glow /= f32(samples);
	
	// 脉动效果
	let pulse = 0.5 + 0.5 * sin(time * 3.0);
	glow *= (0.8 + 0.4 * pulse);
	
	return baseColor + glow * strength;
}

// SDF 阴影效果
fn sdfShadow(uv: vec2f, baseColor: vec3f, strength: f32) -> vec3f {
	let shadowOffset = vec2f(0.005, 0.008) * strength;
	let shadowColor = textureSample(inputTexture, inputSampler, uv + shadowOffset).rgb;
	let shadowLum = getLuminance(shadowColor);
	
	// 创建阴影遮罩
	let shadow = smoothstep(0.1, 0.5, shadowLum) * 0.5 * strength;
	
	// 混合阴影
	let darkShadow = vec3f(0.0, 0.0, 0.1);
	return mix(baseColor, darkShadow, shadow * 0.3);
}

// SDF 霓虹效果
fn sdfNeon(uv: vec2f, baseColor: vec3f, strength: f32, time: f32) -> vec3f {
	let edge = sobelEdge(uv);
	
	// 彩虹霓虹色
	let hue = fract(time * 0.1 + uv.x * 0.5 + uv.y * 0.3);
	let neonColor = vec3f(
		0.5 + 0.5 * cos(6.28318 * (hue + 0.0)),
		0.5 + 0.5 * cos(6.28318 * (hue + 0.33)),
		0.5 + 0.5 * cos(6.28318 * (hue + 0.67))
	);
	
	// 发光边缘
	let glowIntensity = smoothstep(0.05, 0.4, edge) * strength;
	
	// 添加闪烁
	let flicker = 0.9 + 0.1 * sin(time * 20.0 + uv.y * 100.0);
	
	return mix(baseColor, neonColor * 1.5, glowIntensity * flicker);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
	let uv = input.uv;
	let time = uniforms.time;
	let strength = uniforms.effectStrength;
	let sdfStrength = uniforms.sdfStrength;
	let sdfMode = i32(uniforms.sdfMode);
	
	// 基础颜色 + 色差
	var color = chromaticAberration(uv, strength);
	
	// 添加泛光
	let bloomColor = bloom(uv);
	color = mix(color, color + bloomColor * 0.3, strength * 0.5);
	
	// ========== SDF 效果 ==========
	if (sdfMode == 1) {
		// 描边模式 (带 SDF 抗锯齿)
		color = sdfOutline(uv, color, sdfStrength);
	} else if (sdfMode == 2) {
		// 发光模式
		color = sdfGlow(uv, color, sdfStrength, time);
	} else if (sdfMode == 3) {
		// 阴影模式
		color = sdfShadow(uv, color, sdfStrength);
	} else if (sdfMode == 4) {
		// 霓虹模式
		color = sdfNeon(uv, color, sdfStrength, time);
	} else if (sdfMode == 5) {
		// 边缘感知抗锯齿模式
		color = edgeAwareAA(uv, color);
	} else if (sdfMode == 6) {
		// FXAA 快速抗锯齿模式
		color = fxaaLite(uv, color);
	} else if (sdfMode == 7) {
		// 组合模式: 描边 + 抗锯齿
		color = sdfOutline(uv, color, sdfStrength);
		color = edgeAwareAA(uv, color);
	} else if (sdfMode == 8) {
		// 全部效果模式: 阴影 -> 发光 -> 描边 -> 霓虹 -> 抗锯齿
		// 按照渲染顺序叠加所有效果
		let s = sdfStrength * 0.6; // 降低单个效果强度避免过度
		
		// 1. 先添加阴影 (底层)
		color = sdfShadow(uv, color, s);
		
		// 2. 添加发光效果
		color = sdfGlow(uv, color, s * 0.8, time);
		
		// 3. 添加描边
		color = sdfOutline(uv, color, s);
		
		// 4. 添加霓虹边缘 (减弱强度)
		let neonColor = sdfNeon(uv, color, s * 0.5, time);
		color = mix(color, neonColor, 0.3);
		
		// 5. 最后应用抗锯齿
		color = edgeAwareAA(uv, color);
	}
	
	// 暗角
	color *= vignette(uv, 1.0 + strength * 0.5);
	
	// 扫描线
	color *= scanlines(uv, time);
	
	// 轻微噪点
	let n = noise(uv, time) * 0.03 * strength;
	color += vec3f(n);
	
	// 色调映射
	color = pow(color, vec3f(0.95));
	
	return vec4f(color, 1.0);
}
`;

// ============================================================================
// 后处理渲染器
// ============================================================================

class PostProcessor {
	private device: GPUDevice;
	private pipeline: GPURenderPipeline;
	private sampler: GPUSampler;
	private uniformBuffer: GPUBuffer;
	private bindGroupLayout: GPUBindGroupLayout;
	private format: GPUTextureFormat;
	
	// 离屏渲染目标
	private renderTexture: GPUTexture | null = null;
	private renderTextureView: GPUTextureView | null = null;
	private bindGroup: GPUBindGroup | null = null;
	private width = 0;
	private height = 0;

	constructor(device: GPUDevice, format: GPUTextureFormat) {
		this.device = device;
		this.format = format;

		// 创建 shader module
		const shaderModule = device.createShaderModule({ code: postProcessShader });

		// 创建 bind group layout
		this.bindGroupLayout = device.createBindGroupLayout({
			entries: [
				{ binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
				{ binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
				{ binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
			],
		});

		// 创建 pipeline layout
		const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] });

		// 创建渲染管线
		this.pipeline = device.createRenderPipeline({
			layout: pipelineLayout,
			vertex: { module: shaderModule, entryPoint: "vs_main" },
			fragment: {
				module: shaderModule,
				entryPoint: "fs_main",
				targets: [{ format }],
			},
			primitive: { topology: "triangle-list" },
		});

		// 创建采样器
		this.sampler = device.createSampler({
			magFilter: "linear",
			minFilter: "linear",
		});

		// 创建 uniform buffer
		// WGSL layout: resolution(8) + time(4) + effectStrength(4) + sdfStrength(4) + sdfMode(4) + pad(8) = 32 bytes
		this.uniformBuffer = device.createBuffer({
			size: 32,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});
	}

	// 确保离屏纹理大小正确
	ensureRenderTexture(width: number, height: number): GPUTextureView {
		if (this.renderTexture && this.width === width && this.height === height) {
			return this.renderTextureView!;
		}

		// 销毁旧纹理
		this.renderTexture?.destroy();

		// 创建新纹理
		this.renderTexture = this.device.createTexture({
			size: { width, height },
			format: this.format,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		});
		this.renderTextureView = this.renderTexture.createView();
		this.width = width;
		this.height = height;

		// 重新创建 bind group
		this.bindGroup = this.device.createBindGroup({
			layout: this.bindGroupLayout,
			entries: [
				{ binding: 0, resource: this.renderTextureView },
				{ binding: 1, resource: this.sampler },
				{ binding: 2, resource: { buffer: this.uniformBuffer } },
			],
		});

		return this.renderTextureView;
	}

	// 获取离屏渲染目标
	getRenderTarget(width: number, height: number): GPUTextureView {
		return this.ensureRenderTexture(width, height);
	}

	// 应用后处理并渲染到最终目标
	render(
		encoder: GPUCommandEncoder,
		targetView: GPUTextureView,
		time: number,
		effectStrength: number,
		sdfStrength = 0.5,
		sdfMode = 0,
	) {
		// 更新 uniforms - WGSL layout: resolution(8) + time(4) + effectStrength(4) + sdfStrength(4) + sdfMode(4) + pad(8)
		const uniformData = new Float32Array([
			this.width, this.height, time, effectStrength, sdfStrength, sdfMode, 0, 0,
		]);
		this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

		// 后处理 pass
		const passEncoder = encoder.beginRenderPass({
			colorAttachments: [{
				view: targetView,
				loadOp: "clear",
				storeOp: "store",
				clearValue: { r: 0, g: 0, b: 0, a: 1 },
			}],
		});

		passEncoder.setPipeline(this.pipeline);
		passEncoder.setBindGroup(0, this.bindGroup!);
		passEncoder.draw(3); // 全屏三角形
		passEncoder.end();
	}

	destroy(): void {
		this.renderTexture?.destroy();
		this.uniformBuffer.destroy();
	}
}

// ============================================================================
// 主程序
// ============================================================================

async function main() {
	// 获取 canvas
	const canvas = document.getElementById("wcn-canvas") as HTMLCanvasElement;
	if (!canvas) {
		console.error("Canvas element not found");
		return;
	}

	// 设置 canvas 大小
	canvas.width = 800;
	canvas.height = 600;

	// 初始化 WCN
	const wasmUrl = new URL("/wcn.wasm", import.meta.url).href;
	await createWCN({
		loadWasm: async () => {
			const res = await fetch(wasmUrl);
			return res.arrayBuffer();
		},
	});

	// 创建 WCNCanvas (会自动初始化 WebGPU)
	const wcn = await WCNCanvas.create(canvas);

	// 创建后处理器
	const postProcessor = new PostProcessor(wcn.device, wcn.format);

	// 特效控制
	let effectStrength = 0.5;
	let sdfStrength = 0.5;
	let sdfMode = 0; // 0=off, 1=outline, 2=glow, 3=shadow, 4=neon, 5=edgeAA, 6=fxaa, 7=outline+AA, 8=all

	// 创建 UI 控制
	const controlDiv = document.createElement("div");
	controlDiv.style.cssText = "position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.85);padding:15px;border-radius:8px;color:white;font-family:sans-serif;font-size:13px;min-width:300px;";
	controlDiv.innerHTML = `
		<div style="margin-bottom:12px;font-size:15px;font-weight:bold;border-bottom:1px solid #444;padding-bottom:8px;">🎨 后处理控制</div>
		<div style="margin-bottom:10px;">
			<label>基础特效: <input type="range" id="effectSlider" min="0" max="1" step="0.01" value="0.5" style="width:120px;vertical-align:middle;"></label>
			<span id="effectValue" style="display:inline-block;width:35px;">0.50</span>
		</div>
		<div style="margin-bottom:10px;">
			<label>SDF 强度: <input type="range" id="sdfSlider" min="0" max="1" step="0.01" value="0.5" style="width:120px;vertical-align:middle;"></label>
			<span id="sdfValue" style="display:inline-block;width:35px;">0.50</span>
		</div>
		<div style="margin-bottom:8px;">
			<label>SDF/AA 模式: </label>
			<select id="sdfMode" style="padding:4px 8px;border-radius:4px;background:#333;color:white;border:1px solid #555;">
				<option value="0">关闭</option>
				<optgroup label="SDF 效果">
					<option value="1">描边 (Outline)</option>
					<option value="2">发光 (Glow)</option>
					<option value="3">阴影 (Shadow)</option>
					<option value="4">霓虹 (Neon)</option>
				</optgroup>
				<optgroup label="抗锯齿">
					<option value="5">边缘感知 AA</option>
					<option value="6">FXAA 快速</option>
					<option value="7">描边 + AA</option>
				</optgroup>
				<optgroup label="组合">
					<option value="8">✨ 全部效果</option>
				</optgroup>
			</select>
		</div>
	`;
	document.body.appendChild(controlDiv);

	// 绑定事件
	const effectSlider = document.getElementById("effectSlider") as HTMLInputElement;
	const effectValue = document.getElementById("effectValue") as HTMLSpanElement;
	effectSlider.addEventListener("input", () => {
		effectStrength = parseFloat(effectSlider.value);
		effectValue.textContent = effectStrength.toFixed(2);
	});

	const sdfSlider = document.getElementById("sdfSlider") as HTMLInputElement;
	const sdfValue = document.getElementById("sdfValue") as HTMLSpanElement;
	sdfSlider.addEventListener("input", () => {
		sdfStrength = parseFloat(sdfSlider.value);
		sdfValue.textContent = sdfStrength.toFixed(2);
	});

	const sdfModeSelect = document.getElementById("sdfMode") as HTMLSelectElement;
	sdfModeSelect.addEventListener("change", () => {
		sdfMode = parseInt(sdfModeSelect.value);
	});

	// 动画状态
	const startTime = performance.now();
	let animationId: number;

	// 是否启用后处理
	const enablePostProcess = true;

	// 渲染循环
	function render() {
		const time = (performance.now() - startTime) / 1000;
		const width = canvas.width;
		const height = canvas.height;

		if (enablePostProcess) {
			// ========== 带后处理的渲染流程 ==========
			// 获取离屏渲染目标 (WCN 渲染到这里)
			const offscreenView = postProcessor.getRenderTarget(width, height);

			// WCN 渲染到离屏纹理
			wcn.beginFrame();
			const passResult = wcn.beginRenderPass(offscreenView);
			if (passResult) {
				drawAnimatedContent(wcn, time, width, height);
			}
			// endFrame 会自动结束 render pass 和提交命令
			wcn.endFrame();

			// 后处理: 从离屏纹理读取，输出到 canvas
			const texture = wcn.canvasContext.getCurrentTexture();
			const finalView = texture.createView();
			const postEncoder = wcn.device.createCommandEncoder({ label: "Post Process Encoder" });
			postProcessor.render(postEncoder, finalView, time, effectStrength, sdfStrength, sdfMode);
			wcn.device.queue.submit([postEncoder.finish()]);
		} else {
			// ========== 直接渲染到 canvas (调试用) ==========
			wcn.beginFrame();
			const passResult = wcn.beginRenderPass();
			if (passResult) {
				drawAnimatedContent(wcn, time, width, height);
			}
			// endFrame 会自动结束 render pass 和提交命令
			wcn.endFrame();
		}

		animationId = requestAnimationFrame(render);
	}

	// 绘制动画内容
	function drawAnimatedContent(ctx: WCNCanvas, time: number, width: number, height: number) {
		const centerX = width / 2;
		const centerY = height / 2;

		// 深蓝背景
		ctx.setFillStyle("#1a1a2e");
		ctx.fillRect(0, 0, width, height);

		// 旋转的多边形
		ctx.save();
		ctx.translate(centerX, centerY);
		ctx.rotate(time * 0.5);

		// 外圈六边形
		ctx.setStrokeStyle("#00d4ff");
		ctx.setLineWidth(3);
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (i / 6) * Math.PI * 2;
			const r = 150 + Math.sin(time * 2 + i) * 20;
			const x = Math.cos(angle) * r;
			const y = Math.sin(angle) * r;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.stroke();

		// 内圈六边形
		ctx.setStrokeStyle("#ff6b6b");
		ctx.setLineWidth(2);
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (i / 6) * Math.PI * 2 + time * 0.3;
			const r = 80 + Math.sin(time * 3 + i * 0.5) * 15;
			const x = Math.cos(angle) * r;
			const y = Math.sin(angle) * r;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.stroke();

		ctx.restore();

		// 浮动的圆形粒子
		const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9", "#fd79a8", "#a29bfe"];
		for (let i = 0; i < 12; i++) {
			const angle = (i / 12) * Math.PI * 2 + time * 0.2;
			const distance = 200 + Math.sin(time + i * 0.5) * 50;
			const x = centerX + Math.cos(angle) * distance;
			const y = centerY + Math.sin(angle) * distance;
			const radius = 8 + Math.sin(time * 2 + i) * 4;

			ctx.setFillStyle(colors[i % colors.length]);
			ctx.fillCircle(x, y, radius);
		}

		// 中心发光圆
		ctx.setFillStyle("#ffffff");
		ctx.fillCircle(centerX, centerY, 20 + Math.sin(time * 4) * 5);

		ctx.setFillStyle("rgba(255, 255, 255, 128)");
		ctx.fillCircle(centerX, centerY, 35 + Math.sin(time * 4) * 8);

		// 文字
		ctx.setFillStyle("#ffffff");
		ctx.setFont("24px sans-serif");
		ctx.fillText("WCN + WebGPU Post-Processing", centerX - 180, height - 50);

		ctx.setFillStyle("#888888");
		ctx.setFont("14px sans-serif");
		ctx.fillText(`Effect: ${effectStrength.toFixed(2)}`, centerX - 40, height - 25);
	}

	// 开始渲染
	render();

	// 清理函数
	window.addEventListener("beforeunload", () => {
		cancelAnimationFrame(animationId);
		postProcessor.destroy();
	});
}

// 启动
main().catch(console.error);
