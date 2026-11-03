#!/bin/bash
# 《核验脚本 v1》——第三核验窗口专用（2026-11-03 监理预置）
# 用法：GH_TOKEN="<两段拼接令牌>" bash verify.sh <基线SHA> <新SHA> [残留关键词...]
# 一次跑完五步证据：拉双版本→全量改动面→src改动面→残留grep→回归样本对拍
set -u
BASE="${1:?缺基线SHA}"; NEW="${2:?缺新SHA}"; shift 2
REPO="1535666021/chongdianzhuang-v3"
W="$(mktemp -d)"
echo "═══ ① 拉取双版本 $BASE → $NEW ═══"
curl -sL -H "Authorization: Bearer $GH_TOKEN" "https://codeload.github.com/$REPO/tar.gz/$BASE" -o "$W/base.tgz" || { echo "拉取基线失败"; exit 1; }
curl -sL -H "Authorization: Bearer $GH_TOKEN" "https://codeload.github.com/$REPO/tar.gz/$NEW" -o "$W/new.tgz" || { echo "拉取新版失败"; exit 1; }
mkdir -p "$W/b" "$W/n"
tar xzf "$W/base.tgz" -C "$W/b" && tar xzf "$W/new.tgz" -C "$W/n"
B="$(ls "$W/b")"; N="$(ls "$W/n")"
echo "═══ ② 全量改动面（diff -rq）═══"
diff -rq "$W/b/$B" "$W/n/$N" 2>/dev/null | grep -v node_modules || echo "（零差异）"
echo "═══ ③ src 改动面 ═══"
diff -rq "$W/b/$B/src" "$W/n/$N/src" 2>/dev/null | grep -v node_modules || echo "（src 零差异）"
echo "═══ ④ 残留关键词 grep（逐个查新版本 src）═══"
if [ "$#" -eq 0 ]; then echo "（未传关键词，跳过）"; fi
for kw in "$@"; do
  c=$(grep -rn "$kw" "$W/n/$N/src" 2>/dev/null | wc -l)
  echo "  '$kw': $c 处"
done
echo "═══ ⑤ 回归样本对拍 ═══"
if diff -q "$W/b/$B/src/lib/parserRegressionSamples.ts" "$W/n/$N/src/lib/parserRegressionSamples.ts" >/dev/null 2>&1; then
  echo "  回归样本零差异 ✓"
else
  echo "  回归样本有差异 ✗（须与任务书声明一致，否则打回）"
fi
echo "═══ 完毕。工作目录 $W ═══"
