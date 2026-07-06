const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function hasTsFiles(dir) {
  if (!fs.existsSync(dir)) return false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (hasTsFiles(p)) return true;
    } else if (/\.tsx?$/.test(e.name)) {
      return true;
    }
  }
  return false;
}

ensureDir(srcDir);
if (!hasTsFiles(srcDir)) {
  const dummyPath = path.join(srcDir, 'dummy.ts');
  const content = "// Auto-generated dummy file to satisfy TypeScript during CI builds\nexport const __DUMMY_TS_INPUT = true;\n";
  fs.writeFileSync(dummyPath, content, { encoding: 'utf8' });
  console.log('prebuild-check: created', dummyPath);
} else {
  console.log('prebuild-check: TypeScript sources present');
}
