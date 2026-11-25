# 《施工队 · 交付书》P0-253-3 本地加解密

- 仓库：1535666021/chongdianzhuang-v3
- 基线 HEAD：c9b0bf91（推码时点 main，期间仅 RULES.md 文书笔与载荷零重叠）
- 范围：只做本地 age v1 加解密工具（与 age/rage CLI 互通格式，依据 C2SP age.md）——选 253-2 JSON 用 253-1 公钥出 .age/.sha256；选 .age+私钥解密回 JSON；全程断网可用
- 未做（任务书明令）：变更监听/私仓上传——一行未写

## 载荷（7 文件，对 c9b0bf91 diff 面零越界）
| 文件 | 动作 |
| --- | --- |
| src/features/settings/lib/localAge.ts | 新增：age v1 全格式——X25519 stanza（临时密钥对+HKDF(salt=ephemeral‖recipient, info=age-encryption.org/v1/X25519)+ChaCha20Poly1305 包裹 16 字节 file key，nonce 全零）/文件头 HMAC（HKDF(info=header)+HMAC-SHA256，salt=none 全零）/16 字节载荷 nonce+HKDF(info=payload)/64KiB 分块 AEAD 流（11 字节大端计数+末字节 0x01 最后块标志）/canonical base64 严格解码/bech32+bech32m 密钥解析/全零共享密钥拒绝/非 X25519 stanza 忽略/sha256 配套 |
| src/features/settings/components/LocalAgeTool.tsx | 新增：加密卡（选 JSON→公钥加密→双下载）+解密卡（选 .age+私钥文件+可选 .sha256→sha256 校验→还原下载）；私钥仅 file.text() 进内存，零 localStorage 零临时文件 |
| src/features/settings/pages/SettingsPage.tsx | 五 spot 接线（图标/import/类型/菜单/case），逐点 grep 复核 |
| src/constants/releaseNotes.ts | 头部追加 1 条 |
| package.json / package-lock.json | 新增 @noble/ciphers + @noble/hashes |
| 本书 | — |

## 自查实证清单（对应验收逐条）
1. 无私钥只能加密不能解密：加密入参仅公钥（Uint8Array）；runner `无私钥/错私钥解不开 PASS`（函数签名即要求私钥，错钥抛「无匹配接收者」）
2. 有私钥解密还原+sha256 校验：runner 13 断言 FAILS=0——`私钥解密还原一致 PASS`+`sha256文件解析回环 PASS`；UI 解密卡选 .sha256 即强制校验，不符抛错
3. 工具不留明文临时文件：私钥 file.text() 仅存组件 state 内存；明文只经 Blob 直出下载；grep 组件零 localStorage/零 secretKey 持久化（同 253-1 双证法）
4. npm run build 通过：tsc 0（含 TS5.7 Uint8Array<ArrayBuffer> 泛型适配两处 cast）+vite+`[BUILD CHECK] 后置检查通过`
5. 交付本书：落 specs/2026-11-25-P0-253-3-local-age/delivery.md
6. 边界守护：篡改载荷被拦/篡改文件头MAC被拦/截断被拦三证；空载荷与 70KB 跨块双路回环；任务书明令二不做零出现；P0-255 他窗文件零触碰

## 教训/避坑（复盘强制落仓）
- TS 5.7+ Uint8Array 泛型：lib 返回类型声明 `Uint8Array` 会拓宽成 ArrayBufferLike，Blob 入参要 cast `as Uint8Array<ArrayBuffer>`（本单两处，已修）
- @noble/ciphers v2 chacha20poly1305(key,nonce) 只暴露 encrypt/decrypt（v1 的 seal/open 已移除）；@scure/base v2.4 无 b64 导出，用 base64（带填充）自行去 '=' + 严格字符集校验实现 canonical base64
- age 规范细节易错三处：文件头 MAC 覆盖范围=含末尾换行、不含 '---' 行；块 nonce=11 字节大端计数（自 0）+标志字节（0x01=最后块）；HKDF salt=none 必须显式传 32 字节全零（noble 不自动补零）
