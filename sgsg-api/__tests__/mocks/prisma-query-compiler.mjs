// ES module mock for @prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs
console.log('ES Module mock query compiler loaded');

// The 'l' function from the WASM module (string encoding function)
export const l = (...args) => {
  console.log('ESM Mock l called with:', args.length, args[0]?.slice?.(0, 20));
  // Return a dummy pointer
  return 42;
};

// Create a mock QueryCompiler class
export class QueryCompiler {
  constructor(bytes) {
    console.log('QueryCompiler constructor called with', bytes?.slice?.(0, 20));
    this.bytes = bytes;
    this.__wbg_ptr = 123;
  }

  compile(query) {
    console.log('QueryCompiler.compile called with', query?.slice?.(0, 20));
    return 'mock-compiled-query';
  }

  compileBatch(queries) {
    console.log('QueryCompiler.compileBatch called with', queries?.length);
    return queries.map(() => 'mock-compiled-query');
  }

  free() {
    console.log('QueryCompiler.free called');
  }
}

// All the other WASM binding exports as mock functions
export const __wbg_Error_e83987f665cf5504 = () => {};
export const __wbg_Number_bb48ca12f395cd08 = () => {};
export const __wbg_String_8f0eb39a4a4c2f66 = () => {};
export const __wbg___wbindgen_boolean_get_6d5a1ee65bab5f68 = () => {};
export const __wbg___wbindgen_debug_string_df47ffb5e35e6763 = () => {};
export const __wbg___wbindgen_in_bb933bd9e1b3bc0f = () => {};
export const __wbg___wbindgen_is_object_c818261d21f283a4 = () => {};
export const __wbg___wbindgen_is_string_fbb76cb2940daafd = () => {};
export const __wbg___wbindgen_is_undefined_2d472862bd29a478 = () => {};
export const __wbg___wbindgen_jsval_loose_eq_b664b38a2f582147 = () => {};
export const __wbg___wbindgen_number_get_a20bf9b85341449d = () => {};
export const __wbg___wbindgen_string_get_e4f06c90489ad01b = () => {};
export const __wbg___wbindgen_throw_b855445ff6a94295 = () => {};
export const __wbg_entries_e171b586f8f6bdbf = () => {};
export const __wbg_getTime_14776bfb48a1bff9 = () => {};
export const __wbg_get_7bed016f185add81 = () => {};
export const __wbg_get_with_ref_key_1dc361bd10053bfe = () => {};
export const __wbg_instanceof_ArrayBuffer_70beb1189ca63b38 = () => {};
export const __wbg_instanceof_Uint8Array_20c8e73002f7af98 = () => {};
export const __wbg_isSafeInteger_d216eda7911dde36 = () => {};
export const __wbg_length_69bca3cb64fc8748 = () => {};
export const __wbg_length_cdd215e10d9dd507 = () => {};
export const __wbg_new_0_f9740686d739025c = () => {};
export const __wbg_new_1acc0b6eea89d040 = () => {};
export const __wbg_new_5a79be3ab53b8aa5 = () => {};
export const __wbg_new_68651c719dcda04e = () => {};
export const __wbg_new_e17d9f43105b08be = () => {};
export const __wbg_prototypesetcall_2a6620b6922694b2 = () => {};
export const __wbg_set_3f1d0b984ed272ed = () => {};
export const __wbg_set_907fb406c34a251d = () => {};
export const __wbg_set_c213c871859d6500 = () => {};
export const __wbg_set_message_82ae475bb413aa5c = () => {};
export const __wbg_set_wasm = (e) => {
  console.log('__wbg_set_wasm called with', e);
  // Store the wasm object globally
  global.__prisma_wasm = e;
};
export const __wbindgen_cast_2241b6af4c4b2941 = () => {};
export const __wbindgen_cast_4625c577ab2ec9ee = () => {};
export const __wbindgen_cast_9ae0607507abb057 = () => {};
export const __wbindgen_cast_d6cd19b81560fd6e = () => {};
export const __wbindgen_init_externref_table = () => {};