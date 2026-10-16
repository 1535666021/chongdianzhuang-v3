#!/usr/bin/env node
/**
 * 构建前后检查脚本
 * 用法：node build-check.cjs
 *       node build-check.cjs --check-dist
 */
const fs = require('fs')
const path = require('path')

const DIST_DIR = path.resolve(__dirname, 'dist')
const INDEX_HTML = path.join(DIST_DIR, 'index.html')

function checkPreBuild() {
  const required = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'index.html',
    'src/main.tsx',
    'src/App.tsx',
  ]
  let ok = true
  for (const file of required) {
    const p = path.resolve(__dirname, file)
    if (!fs.existsSync(p)) {
      console.error(`[BUILD CHECK] 缺失: ${file}`)
      ok = false
    }
  }
  if (ok) {
    console.log('[BUILD CHECK] 前置检查通过')
  } else {
    console.error('[BUILD CHECK] 前置检查失败，请补全文件')
    process.exit(1)
  }
}

function checkPostBuild() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('[BUILD CHECK] dist 目录不存在')
    process.exit(1)
  }
  if (!fs.existsSync(INDEX_HTML)) {
    console.error('[BUILD CHECK] dist/index.html 不存在')
    process.exit(1)
  }
  const html = fs.readFileSync(INDEX_HTML, 'utf-8')
  if (!html.includes('<div id="root">')) {
    console.error('[BUILD CHECK] index.html 内容异常')
    process.exit(1)
  }
  console.log('[BUILD CHECK] 后置检查通过')
}

const args = process.argv.slice(2)
if (args.includes('--check-dist')) {
  checkPostBuild()
} else {
  checkPreBuild()
}
