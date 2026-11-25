# 核验打回书：P0-253-5（return-R2535）

- 打回时间：2026-11-26 00:52
- 打回依据：任务书功能点 2「私仓配置 owner/repo 白名单校验」未见实现
- 核验证据（复验全量已过，仅该项不符）：
  - diff 恰 4 src+本书零超范围（repoUpload.ts/RepoUploadTool.tsx/SettingsPage.tsx/releaseNotes.ts/delivery.md）
  - runner 10/10（配置往返/today 双覆盖+base 双新建 PUT 分类/token 仅 Authorization 头非 body/500 HEAD 阶段零 PUT 拦截/失败密文保留）
  - 回归 20/20；build 三连全过
  - 行级实证：repoUpload.ts 全文件无白名单正则（L1-146 无 owner/repo 格式校验）；RepoUploadTool.tsx 保存函数仅 owner/repo/token 三非空校验（trim 长度>0），无白名单格式拦截
- 不符点：任务书白纸黑字要求「owner/repo 白名单校验」，实现缺该校验=口径与功能不符
- 整改要求：补 owner/repo 白名单校验（建议 GitHub 合法名规则：owner 字母数字连字符≤39 字符、repo 字母数字._-≤100 字符，不匹配则红条拒绝保存）；整改后重新交付（diff 基线=当前 main HEAD），本窗复验
- 备注：已完成的销号+部署笔（c0df456 销号/4ce69d7 写回）**撤销销号改打回**，线上已部署版本功能可用（仅缺该校验），整改后随新部署覆盖；其余验收项证据留存本文件，复验时免重测
