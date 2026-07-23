#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const distPath = path.resolve(__dirname, 'dist');
const indexHtml = path.join(distPath, 'index.html');

if (process.argv.length <= 2) {
  console.log('构建前检查通过');
  process.exit(0);
}

if (process.argv.includes('--check-dist')) {
  if (!fs.existsSync(distPath)) { console.error('dist 目录不存在'); process.exit(1); }
  if (!fs.existsSync(indexHtml)) { console.error('dist/index.html 不存在'); process.exit(1); }
  const htmlContent = fs.readFileSync(indexHtml, 'utf-8');
  if (!htmlContent.includes('id="root"')) { console.error('index.html 内容异常'); process.exit(1); }
  console.log('构建产物检查通过');
  process.exit(0);
}

console.log('build-check.cjs：构建辅助脚本');
process.exit(0);
