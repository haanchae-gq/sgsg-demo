const bcrypt = require('bcrypt');

async function main() {
  const hash = await bcrypt.hash('Expert@123456', 10);
  console.log('Hash:', hash);
  // Also compute for password123 for reference
  const hash2 = await bcrypt.hash('password123', 10);
  console.log('Hash for password123:', hash2);
}

main().catch(console.error);