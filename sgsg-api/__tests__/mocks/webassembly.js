// Mock WebAssembly for Jest testing
// Provides basic mock implementations of WebAssembly APIs

global.WebAssembly = {
  Module: class MockWebAssemblyModule {
    constructor(bytes) {
      // Mock implementation - just store the bytes
      this.bytes = bytes;
    }
  },

  Memory: class MockWebAssemblyMemory {
    constructor(descriptor = {}) {
      this.initial = descriptor.initial || 1;
      this.buffer = new ArrayBuffer((this.initial || 1) * 65536); // 64KB pages
    }
  },
  
  Instance: class MockWebAssemblyInstance {
    constructor(module, imports) {
      this.module = module;
      this.imports = imports;
      // Mock the exports that Prisma WASM requires
      this.exports = {
        memory: new WebAssembly.Memory({ initial: 10 }),
        __wbindgen_malloc: jest.fn().mockReturnValue(1024),
        __wbindgen_realloc: jest.fn().mockReturnValue(2048),
        __wbindgen_free: jest.fn(),
        __wbg_querycompiler_free: jest.fn(),
        querycompiler_new: jest.fn().mockReturnValue([123, null, false]), // ptr, error, hasError
        querycompiler_compile: jest.fn().mockReturnValue([456, null, false]),
        querycompiler_compileBatch: jest.fn().mockReturnValue([789, null, false]),
        __wbindgen_externrefs: {
          get: jest.fn().mockReturnValue('mock-result'),
          set: jest.fn(),
          grow: jest.fn().mockReturnValue(4)
        },
        __externref_table_dealloc: jest.fn(),
        // Add the l function directly to the wasm instance
        l: function(e, t, n) {
          console.log('*** WASM instance l function called:', e?.slice?.(0, 20), typeof t, typeof n);
          return 42;
        }
      };
    }
  },
  
  // Other WebAssembly APIs that might be needed
  compile: jest.fn().mockResolvedValue({}),
  instantiate: jest.fn().mockResolvedValue({ 
    instance: { exports: {} },
    module: {}
  }),
};