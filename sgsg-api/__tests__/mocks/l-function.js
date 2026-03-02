// Standalone l function mock for Prisma 7 WASM runtime

// The l function is needed for string encoding in WASM module
function l(e, t, n) {
  // Mock string encoding behavior
  if (typeof e === 'string') {
    // Return a mock pointer for encoded strings
    return 42;
  }
  
  if (e && typeof e.slice === 'function') {
    // Handle Uint8Array or similar
    return e.length;
  }
  
  // Default case
  return 42;
}

// Export for CommonJS
module.exports = l;

// Export as default for ESM
module.exports.default = l;

// Make it globally available
if (typeof global !== 'undefined') {
  global.l = l;
}

if (typeof window !== 'undefined') {
  window.l = l;
}

// Export named
module.exports.l = l;