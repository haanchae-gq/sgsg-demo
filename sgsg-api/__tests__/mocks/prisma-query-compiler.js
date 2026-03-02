// Mock for @prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs
// Simulates the internal structure of the WASM module
console.log('Mock query compiler loaded - enhanced');

let o = null; // simulates the wasm instance

// Create a mock WASM instance with required exports
const createMockWasmInstance = () => ({
  memory: { buffer: new ArrayBuffer(65536) },
  __wbindgen_malloc: jest.fn().mockReturnValue(1024),
  __wbindgen_realloc: jest.fn().mockReturnValue(2048),
  __wbindgen_free: jest.fn(),
  __wbg_querycompiler_free: jest.fn(),
  querycompiler_new: jest.fn().mockReturnValue([123, null, false]),
  querycompiler_compile: jest.fn().mockReturnValue([456, null, false]),
  querycompiler_compileBatch: jest.fn().mockReturnValue([789, null, false]),
  __wbindgen_externrefs: {
    get: jest.fn().mockReturnValue('mock-result'),
    set: jest.fn(),
    grow: jest.fn().mockReturnValue(4)
  },
  __externref_table_dealloc: jest.fn(),
  l: l // Include the l function in the mock WASM instance
});

// __wbg_set_wasm: sets the wasm instance
function __wbg_set_wasm(wasmInstance) {
  console.log('__wbg_set_wasm called with', wasmInstance);
  // If no wasm instance provided, create a mock one
  o = wasmInstance && Object.keys(wasmInstance).length > 0 ? wasmInstance : createMockWasmInstance();
  
  // Ensure the l function is available in the wasm instance context
  if (o && typeof o.l !== 'function') {
    o.l = l;
  }
  
  console.log('Set wasm instance with keys:', Object.keys(o));
}

// The 'l' function from the WASM module (string encoding function) 
// This function needs to be properly bound to the WASM instance
function l(e, t, n) {
  if (!o) {
    console.log('WASM instance not set, returning default');
    return 42;
  }
  
  // Mock string encoding for WASM - return a pointer to encoded string
  if (typeof e === 'string') {
    // Simulate encoding string into WASM memory
    const encoded = new TextEncoder().encode(e);
    return encoded.length > 0 ? 42 : 0; // Return mock pointer
  }
  return 42;
}

// Ensure l function is globally accessible
if (typeof global !== 'undefined') {
  global.l = l;
}

// Attach to various contexts where runtime might look for it
l.l = l; // Self reference
module.exports.l = l;
exports.l = l;

// QueryCompiler class
class QueryCompiler {
  constructor(bytes) {
    console.log('QueryCompiler constructor called with bytes length', bytes?.length);
    this.bytes = bytes;
    this.__wbg_ptr = 123;
  }

  compile(query) {
    console.log('QueryCompiler.compile called with', query?.slice?.(0, 20));
    // Return a valid JSON string that Prisma expects
    return JSON.stringify({
      sql: 'SELECT 1',
      params: []
    });
  }

  compileBatch(queries) {
    console.log('QueryCompiler.compileBatch called with', queries?.length);
    // Return array of compiled queries
    return queries.map(() => JSON.stringify({
      sql: 'SELECT 1', 
      params: []
    }));
  }

  free() {
    console.log('QueryCompiler.free called');
  }
}

// All the other WASM binding exports as mock functions
const __wbg_Error_e83987f665cf5504 = () => {};
const __wbg_Number_bb48ca12f395cd08 = () => {};
const __wbg_String_8f0eb39a4a4c2f66 = () => {};
const __wbg___wbindgen_boolean_get_6d5a1ee65bab5f68 = () => {};
const __wbg___wbindgen_debug_string_df47ffb5e35e6763 = () => {};
const __wbg___wbindgen_in_bb933bd9e1b3bc0f = () => {};
const __wbg___wbindgen_is_object_c818261d21f283a4 = () => {};
const __wbg___wbindgen_is_string_fbb76cb2940daafd = () => {};
const __wbg___wbindgen_is_undefined_2d472862bd29a478 = () => {};
const __wbg___wbindgen_jsval_loose_eq_b664b38a2f582147 = () => {};
const __wbg___wbindgen_number_get_a20bf9b85341449d = () => {};
const __wbg___wbindgen_string_get_e4f06c90489ad01b = () => {};
const __wbg___wbindgen_throw_b855445ff6a94295 = () => {};
const __wbg_entries_e171b586f8f6bdbf = () => {};
const __wbg_getTime_14776bfb48a1bff9 = () => {};
const __wbg_get_7bed016f185add81 = () => {};
const __wbg_get_with_ref_key_1dc361bd10053bfe = () => {};
const __wbg_instanceof_ArrayBuffer_70beb1189ca63b38 = () => {};
const __wbg_instanceof_Uint8Array_20c8e73002f7af98 = () => {};
const __wbg_isSafeInteger_d216eda7911dde36 = () => {};
const __wbg_length_69bca3cb64fc8748 = () => {};
const __wbg_length_cdd215e10d9dd507 = () => {};
const __wbg_new_0_f9740686d739025c = () => {};
const __wbg_new_1acc0b6eea89d040 = () => {};
const __wbg_new_5a79be3ab53b8aa5 = () => {};
const __wbg_new_68651c719dcda04e = () => {};
const __wbg_new_e17d9f43105b08be = () => {};
const __wbg_prototypesetcall_2a6620b6922694b2 = () => {};
const __wbg_set_3f1d0b984ed272ed = () => {};
const __wbg_set_907fb406c34a251d = () => {};
const __wbg_set_c213c871859d6500 = () => {};
const __wbg_set_message_82ae475bb413aa5c = () => {};
const __wbindgen_cast_2241b6af4c4b2941 = () => {};
const __wbindgen_cast_4625c577ab2ec9ee = () => {};
const __wbindgen_cast_9ae0607507abb057 = () => {};
const __wbindgen_cast_d6cd19b81560fd6e = () => {};
const __wbindgen_init_externref_table = () => {};

module.exports = {
  __esModule: true,
  QueryCompiler,
  l,
  __wbg_set_wasm,
  __wbg_Error_e83987f665cf5504,
  __wbg_Number_bb48ca12f395cd08,
  __wbg_String_8f0eb39a4a4c2f66,
  __wbg___wbindgen_boolean_get_6d5a1ee65bab5f68,
  __wbg___wbindgen_debug_string_df47ffb5e35e6763,
  __wbg___wbindgen_in_bb933bd9e1b3bc0f,
  __wbg___wbindgen_is_object_c818261d21f283a4,
  __wbg___wbindgen_is_string_fbb76cb2940daafd,
  __wbg___wbindgen_is_undefined_2d472862bd29a478,
  __wbg___wbindgen_jsval_loose_eq_b664b38a2f582147,
  __wbg___wbindgen_number_get_a20bf9b85341449d,
  __wbg___wbindgen_string_get_e4f06c90489ad01b,
  __wbg___wbindgen_throw_b855445ff6a94295,
  __wbg_entries_e171b586f8f6bdbf,
  __wbg_getTime_14776bfb48a1bff9,
  __wbg_get_7bed016f185add81,
  __wbg_get_with_ref_key_1dc361bd10053bfe,
  __wbg_instanceof_ArrayBuffer_70beb1189ca63b38,
  __wbg_instanceof_Uint8Array_20c8e73002f7af98,
  __wbg_isSafeInteger_d216eda7911dde36,
  __wbg_length_69bca3cb64fc8748,
  __wbg_length_cdd215e10d9dd507,
  __wbg_new_0_f9740686d739025c,
  __wbg_new_1acc0b6eea89d040,
  __wbg_new_5a79be3ab53b8aa5,
  __wbg_new_68651c719dcda04e,
  __wbg_new_e17d9f43105b08be,
  __wbg_prototypesetcall_2a6620b6922694b2,
  __wbg_set_3f1d0b984ed272ed,
  __wbg_set_907fb406c34a251d,
  __wbg_set_c213c871859d6500,
  __wbg_set_message_82ae475bb413aa5c,
  __wbindgen_cast_2241b6af4c4b2941,
  __wbindgen_cast_4625c577ab2ec9ee,
  __wbindgen_cast_9ae0607507abb057,
  __wbindgen_cast_d6cd19b81560fd6e,
  __wbindgen_init_externref_table,
};