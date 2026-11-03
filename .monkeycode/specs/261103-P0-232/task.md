# 《施工队 · 任务书》

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。环境上下文（仓库/构建/部署/技术栈）以 .monkeycode/CONTEXT.md 为准。

## 基线 HEAD
f31de3f（P0-231 销号后代码顶；本书行号以此提交为基准，实证过）

## 任务编号
P0-232（本目录 specs/261103-P0-232/）

## 问题描述
甲方需求：删除首页新手引导弹窗（四步引导：导入订单→…，带"跳过/下一步/开始使用"），**连代码一起删干净**。新设备/清缓存后进首页不再弹任何引导，直接见订单列表。

## 实现要求（f31de3f 行号已实证）
1. 删文件 `src/shared/components/OnboardingGuide.tsx`（50 行，四步数据+SEEN_KEY localStorage 已读标记全在里面）
2. 删文件 `src/shared/components/OnboardingGuide.css`（.onboarding-* 七个类，仅被该组件用，孤儿样式一并删）
3. 改 `src/App.tsx` 两处：`:17` 行删 `import OnboardingGuide from '@/shared/components/OnboardingGuide'`；`:127` 行删 `<OnboardingGuide />` 挂载。其余一个字节不动
4. localStorage 已读标记残留无害，**不清理**

## 禁改清单（超范围判返工）
- App.tsx 其余内容（启动维护链/路由/其他挂载）——不动
- 解析/回归样本 19 条——不动
- 不得新增任何替代引导/提示

## 验收标准
1. `grep -rn "OnboardingGuide" src` 与 `grep -rn "onboarding" src`（含 css）零残留
2. git diff：2 文件删除 + App.tsx 仅少 2 行（import+挂载），无其他改动
3. tsc 0 错误 + build-check 通过
4. 首屏渲染无引导浮层，订单列表直达

## 交付要求
- 交付写本目录 delivery.md（格式按 ONBOARDING），会话只报一行指针
- 单轮交付：编码→验证→Build→推送→回拉核验，一次性完成

施工队自行部署。

监理窗口 · 签发完毕