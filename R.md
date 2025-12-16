这是一个非常典型的 Emscripten 生成的胶水代码（Glue Code）。将它迁移到 TypeScript 和 ES Modules (ESM) 是一个很好的决定，可以摆脱过时的 UMD 包装器，并获得类型安全。

由于原始代码包含大量的自动生成的数学函数导出（`_wcn_math_...`）和 WebGPU 映射逻辑，手动重写每一行是不现实的。

下面是一个**现代化的重构方案**。我们将代码拆分为：
1.  **类型定义**：定义模块的接口。
2.  **核心逻辑**：将 Emscripten 的运行时逻辑（内存管理、字符串转换、WebGPU 管理器）封装在一个干净的 ESM 函数中。

### 1. 类型定义 (`wcn-types.ts`)

首先，我们需要定义模块返回的内容。由于导出的数学函数极多，这里主要列出生命周期和核心功能，其他可以用索引签名处理。

```typescript
// wcn-types.ts

export interface WCNConfig {
  wasmUrl?: string;
  wasmBinary?: ArrayBuffer;
  canvas?: HTMLCanvasElement;
  print?: (msg: string) => void;
  printErr?: (msg: string) => void;
}

export interface WCNModule {
  // 内存视图
  HEAP8: Int8Array;
  HEAPU8: Uint8Array;
  HEAP16: Int16Array;
  HEAPU16: Uint16Array;
  HEAP32: Int32Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;

  // 辅助函数
  _malloc(size: number): number;
  _free(ptr: number): void;
  UTF8ToString(ptr: number, maxBytesToRead?: number): string;
  stringToUTF8(str: string, outPtr: number, maxBytesToWrite: number): number;
  
  // WCN 核心 API (根据源码提取)
  _wcn_create_context(config: number): number;
  _wcn_destroy_context(ctx: number): void;
  _wcn_begin_frame(ctx: number, width: number, height: number, time: number): void;
  _wcn_end_frame(ctx: number): void;
  _wcn_init_js(): void;
  
  // 数学库及其他导出函数 (使用索引签名覆盖成百上千个 math 函数)
  [key: string]: any;
}
```

### 2. 核心模块实现 (`wcn-module.ts`)

这是主要的迁移工作。我做了以下改进：
*   **移除 UMD/CommonJS**：直接使用 `export default async function`。
*   **清理环境检测**：假设运行在 Web/Browser 环境（因为依赖 DOM 和 WebGPU）。
*   **WebGPU Manager**：将混淆的 WebGPU 管理器逻辑整理为 TypeScript 类或闭包。
*   **字符串/内存工具**：保留核心的 `UTF8ToString` 等实现。

```typescript
// wcn-module.ts
import { WCNConfig, WCNModule } from './wcn-types';

export default async function createWCNModule(config: WCNConfig = {}): Promise<WCNModule> {
  // --- 1. 初始化变量与环境 ---
  let wasmMemory: WebAssembly.Memory;
  let HEAP8: Int8Array, HEAPU8: Uint8Array, HEAP16: Int16Array, HEAPU16: Uint16Array;
  let HEAP32: Int32Array, HEAPU32: Uint32Array, HEAPF32: Float32Array, HEAPF64: Float64Array;
  
  const out = config.print || console.log.bind(console);
  const err = config.printErr || console.error.bind(console);

  // --- 2. 内存管理辅助函数 ---
  function updateMemoryViews() {
    const b = wasmMemory.buffer;
    HEAP8 = new Int8Array(b);
    HEAP16 = new Int16Array(b);
    HEAPU8 = new Uint8Array(b);
    HEAPU16 = new Uint16Array(b);
    HEAP32 = new Int32Array(b);
    HEAPU32 = new Uint32Array(b);
    HEAPF32 = new Float32Array(b);
    HEAPF64 = new Float64Array(b);
  }

  const UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

  function UTF8ToString(ptr: number, maxBytesToRead?: number): string {
    if (!ptr) return '';
    const endPtr = ptr + (maxBytesToRead || NaN);
    let idx = ptr;
    while (HEAPU8[idx] && !(idx >= endPtr)) ++idx;
    const end = idx;
    if (end - ptr > 16 && HEAPU8.subarray && UTF8Decoder) {
      return UTF8Decoder.decode(HEAPU8.subarray(ptr, end));
    }
    // Fallback for no TextDecoder or short strings (simplified for brevity)
    let str = '';
    for (let i = ptr; i < end; i++) {
      str += String.fromCharCode(HEAPU8[i]);
    }
    return str;
  }

  function stringToUTF8(str: string, outPtr: number, maxBytesToWrite: number): number {
    if (!(maxBytesToWrite > 0)) return 0;
    const startIdx = outPtr;
    const endIdx = outPtr + maxBytesToWrite - 1;
    for (let i = 0; i < str.length; ++i) {
      let u = str.charCodeAt(i);
      if (u >= 0xD800 && u <= 0xDFFF) {
        const u1 = str.charCodeAt(++i);
        u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
      }
      if (u <= 0x7F) {
        if (outPtr >= endIdx) break;
        HEAPU8[outPtr++] = u;
      } else if (u <= 0x7FF) {
        if (outPtr + 1 >= endIdx) break;
        HEAPU8[outPtr++] = 0xC0 | (u >> 6);
        HEAPU8[outPtr++] = 0x80 | (u & 0x3F);
      } else if (u <= 0xFFFF) {
        if (outPtr + 2 >= endIdx) break;
        HEAPU8[outPtr++] = 0xE0 | (u >> 12);
        HEAPU8[outPtr++] = 0x80 | ((u >> 6) & 0x3F);
        HEAPU8[outPtr++] = 0x80 | (u & 0x3F);
      } else {
        if (outPtr + 3 >= endIdx) break;
        HEAPU8[outPtr++] = 0xF0 | (u >> 18);
        HEAPU8[outPtr++] = 0x80 | ((u >> 12) & 0x3F);
        HEAPU8[outPtr++] = 0x80 | ((u >> 6) & 0x3F);
        HEAPU8[outPtr++] = 0x80 | (u & 0x3F);
      }
    }
    HEAPU8[outPtr] = 0;
    return outPtr - startIdx;
  }

  function setValue(ptr: number, value: number, type: string) {
    type = type || 'i8';
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[ptr >> 1] = value; break;
      case 'i32': HEAP32[ptr >> 2] = value; break;
      case 'float': HEAPF32[ptr >> 2] = value; break;
      case 'double': HEAPF64[ptr >> 3] = value; break;
      case '*': HEAPU32[ptr >> 2] = value; break;
      default: err('invalid type for setValue: ' + type);
    }
  }

  // --- 3. WebGPU 管理器 (从源码移植) ---
  const WebGPU = {
    mgrDevice: new ResourceManager<GPUDevice>(),
    mgrQueue: new ResourceManager<GPUQueue>(),
    mgrBindGroupLayout: new ResourceManager<GPUBindGroupLayout>(),
    mgrPipelineLayout: new ResourceManager<GPUPipelineLayout>(),
    mgrShaderModule: new ResourceManager<GPUShaderModule>(),
    mgrRenderPipeline: new ResourceManager<GPURenderPipeline>(),
    mgrComputePipeline: new ResourceManager<GPUComputePipeline>(),
    mgrBindGroup: new ResourceManager<GPUBindGroup>(),
    mgrBuffer: new ResourceManager<GPUBuffer>(),
    mgrSampler: new ResourceManager<GPUSampler>(),
    mgrTexture: new ResourceManager<GPUTexture>(),
    mgrTextureView: new ResourceManager<GPUTextureView>(),
    mgrCommandEncoder: new ResourceManager<GPUCommandEncoder>(),
    mgrRenderPassEncoder: new ResourceManager<GPURenderPassEncoder>(),
    mgrComputePassEncoder: new ResourceManager<GPUComputePassEncoder>(),
    mgrCommandBuffer: new ResourceManager<GPUCommandBuffer>(),
    mgrQuerySet: new ResourceManager<GPUQuerySet>(),
    mgrSurface: new ResourceManager<any>(), 
  };

  // 辅助类：用于管理 JS 对象和 Wasm 整数句柄的映射
  class ResourceManager<T> {
    objects: Record<number, { object: T, refcount: number }> = {};
    nextId = 1;

    create(object: T): number {
      const id = this.nextId++;
      this.objects[id] = { object, refcount: 1 };
      return id;
    }
    get(id: number): T | undefined {
      return this.objects[id]?.object;
    }
    release(id: number) {
      const entry = this.objects[id];
      if (entry) {
        entry.refcount--;
        if (entry.refcount <= 0) delete this.objects[id];
      }
    }
    reference(id: number) {
      if (this.objects[id]) this.objects[id].refcount++;
    }
  }
  
  // WCNJS 全局状态 (用于 Font/Canvas)
  const WCNJS: any = {
      WGPUTextureView_Map: new Map(),
      WGPUTextureView_Free_List: [],
      nextFontId: 1,
      fonts: {},
      ctx: null,
      canvas: null
  };

  function js_ensure_context() {
    if (!WCNJS.ctx) {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      WCNJS.canvas = canvas;
      WCNJS.ctx = canvas.getContext("2d", { willReadFrequently: true });
    }
  }

  // --- 4. Library Imports (wasmImports) ---
  // 这些是 C++ 调用的 JS 函数。需要将源码中的 `wasmImports` 对象里的函数搬运到这里。
  
  const wasmImports = {
    // ... 基本工具 ...
    emscripten_resize_heap: (requestedSize: number) => {
        // 简化的内存增长逻辑
        const oldSize = HEAPU8.length;
        if (requestedSize <= oldSize) return false;
        const pages = Math.ceil((requestedSize - oldSize) / 65536);
        try {
            wasmMemory.grow(pages);
            updateMemoryViews();
            return true;
        } catch(e) { return false; }
    },
    _abort_js: () => { throw new Error("Abort called"); },
    alignfault: () => { console.error("Alignment fault"); },
    segfault: () => { console.error("Segmentation fault"); },
    
    // ... WebGPU 胶水代码 (根据源码提取核心逻辑) ...
    emscripten_webgpu_get_device: () => {
        // 通常在外部通过 preinitializedWebGPUDevice 传入，这里简化处理
        // 如果需要实际初始化 WebGPU，需要在外部完成并传给 Module
        const device = (config as any).preinitializedWebGPUDevice;
        if (!device) throw new Error("WebGPU device not initialized");
        // 如果已经存在映射则返回，否则创建
        if(!(WebGPU as any).preinitializedDeviceId) {
             const qId = WebGPU.mgrQueue.create(device.queue);
             // 将 device 上的 queueId 挂载，方便后续获取
             (WebGPU.mgrDevice as any).objects = (WebGPU.mgrDevice as any).objects || {};
             const devId = WebGPU.mgrDevice.create(device);
             (WebGPU.mgrDevice as any).objects[devId].queueId = qId; // Hacky but matches original logic
             (WebGPU as any).preinitializedDeviceId = devId;
        }
        return (WebGPU as any).preinitializedDeviceId;
    },

    // ... Font / Bitmap Generation (从源码 js_generate_bitmap 等复制逻辑) ...
    js_load_font: (font_name: number, font_size: number, out_id: number) => {
        try {
            js_ensure_context();
            const nameStr = UTF8ToString(font_name);
            const id = WCNJS.nextFontId++;
            WCNJS.fonts[id] = { name: nameStr, size: font_size };
            setValue(out_id, id, "i32");
            return true;
        } catch (e) {
            console.error("Load font failed", e);
            return false;
        }
    },
    
    // ... 此处需要粘贴源码中大量的 wasm_create_*, wgpu* 函数 ...
    // 为了节省篇幅，这里举例几个关键的，其他的按照相同模式从源码复制即可
    
    wgpuDeviceCreateCommandEncoder: (deviceId: number, descriptor: number) => {
        const dev = WebGPU.mgrDevice.get(deviceId);
        if(!dev) return 0;
        // Descriptor parsing logic...
        const encoder = dev.createCommandEncoder({}); // Simplify for demo
        return WebGPU.mgrCommandEncoder.create(encoder);
    },
    
    wgpuCommandEncoderFinish: (encoderId: number, descriptor: number) => {
        const enc = WebGPU.mgrCommandEncoder.get(encoderId);
        if(!enc) return 0;
        return WebGPU.mgrCommandBuffer.create(enc.finish());
    },

    wgpuQueueSubmit: (queueId: number, commandCount: number, commandsPtr: number) => {
        const queue = WebGPU.mgrQueue.get(queueId);
        if(!queue) return;
        const cmds: GPUCommandBuffer[] = [];
        for(let i=0; i<commandCount; i++) {
            const id = HEAP32[(commandsPtr >> 2) + i];
            const cmd = WebGPU.mgrCommandBuffer.get(id);
            if(cmd) cmds.push(cmd);
        }
        queue.submit(cmds);
    },
    
    // 其他所有 wgpu* 函数都需要直接从源码的 `wasmImports` 对象中复制过来
    // 注意替换 Module.HEAP* 为本地的 HEAP* 变量
  };
  
  // --- 补充缺失的空函数以防止崩溃 ---
  // 源码中有很多 Init_WCNJS 等初始化，需要 stub
  (wasmImports as any).Init_WCNJS = () => {}; 
  (wasmImports as any).Init_WGPUTextureView_Map = () => {};
  // ... 其他在源码 checkIncomingModuleAPI 附近的函数

  // --- 5. 加载 WASM ---
  let wasmBinary = config.wasmBinary;
  if (!wasmBinary && config.wasmUrl) {
    const response = await fetch(config.wasmUrl);
    wasmBinary = await response.arrayBuffer();
  }
  if (!wasmBinary) {
    throw new Error("Must provide wasmBinary or wasmUrl in config");
  }

  const result = await WebAssembly.instantiate(wasmBinary, {
    env: wasmImports,
    wasi_snapshot_preview1: wasmImports // 如果使用了 WASI
  });
  
  const instance = result.instance;
  const exports = instance.exports as any;
  wasmMemory = exports.memory;
  updateMemoryViews();

  // --- 6. 构造返回值 (The Module Object) ---
  
  // 运行初始化构造函数 (如果有)
  if (exports.__wasm_call_ctors) {
    exports.__wasm_call_ctors();
  }

  // 构造最终对象
  const finalModule: WCNModule = {
    HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64,
    _malloc: exports.malloc,
    _free: exports.free,
    UTF8ToString,
    stringToUTF8,
    ...exports // 导出所有 C++ 函数 (_wcn_*)
  };
  
  // 运行 js 初始化
  if (finalModule._wcn_init_js) {
      finalModule._wcn_init_js();
  }

  return finalModule;
}
```

### 3. 如何使用

在你的 Vue/React/TS 项目中：

```typescript
import createWCNModule from './wcn-module';

// Vite 方式导入 wasm URL
import wcnWasmUrl from './assets/wcn.wasm?url'; 

async function init() {
  // 1. 获取 WebGPU Device (假设你已经在外部获取了)
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();

  // 2. 初始化模块
  const wcn = await createWCNModule({
    wasmUrl: wcnWasmUrl,
    // Emscripten 代码依赖外部传入预初始化的 Device
    preinitializedWebGPUDevice: device 
  } as any);

  // 3. 调用 C++ 导出函数
  const ctx = wcn._wcn_create_context(0);
  console.log("Context created:", ctx);
  
  // 使用内存工具
  const ptr = wcn._malloc(1024);
  wcn.stringToUTF8("Hello World", ptr, 1024);
  wcn._free(ptr);
}
```

### 关键注意事项 (必读)

1.  **WebGPU 函数补全**：
    在上面的 `wcn-module.ts` 代码中，我为了简洁省略了大量的 `wgpu*` 和 `wasm_*` 函数（如 `wasm_create_render_pipeline`, `wgpuDeviceCreateTexture`）。**你需要打开原始文件，找到 `var wasmImports = { ... }` 这一块，将其中的所有函数复制到 `wcn-module.ts` 的 `wasmImports` 对象中。**
    *   **修改点**：复制时，原始代码中的 `Module.HEAPU8` 需要改为闭包内的 `HEAPU8`，`UTF8ToString` 也不再需要 `Module.` 前缀。

2.  **`WebGPU` 常量映射**：
    原始代码中有一个巨大的常量映射表（`Int_DeviceLostReason`, `TextureFormat` 数组等）。这些也必须复制到 `wcn-module.ts` 中，否则 `wgpuDeviceCreateTexture` 等函数无法将整数枚举转换为字符串字符串。

3.  **`_malloc` / `_free`**:
    确保 Wasm 导出了这两个函数。通常 Emscripten 默认导出。如果没有，你可能需要在 C++ 编译选项中添加 `-s EXPORTED_FUNCTIONS=['_malloc','_free',...]`。

4.  **Math 函数**:
    原始代码有几百个 `_wcn_math_...` 函数。TS 接口中我用了 `[key: string]: any` 来兜底。如果你需要强类型，建议编写一个脚本扫描原始 JS 文件，正则匹配 `_wcn_math_(\w+)` 并生成 `.d.ts` 文件。

这个结构将原本混乱的全局变量和自执行函数变为了一个标准的、无副作用的异步 ESM 模块加载器。