# 朋友圈高清图画布工具（wx-pyq-hd）

满足“长边/短边 ≥ 2”与“体积 < 5MB”时，据大量实践反馈微信朋友圈通常不会再次压缩。本工具帮助你把任意图片快速铺贴到固定画布（横 4400×2200 或 竖 2200×4400）上，并尽量将导出 JPEG 的体积控制在 5MB 以下，以提高不被二次压缩的概率。所有处理均在本地浏览器完成，不会上传到服务器。

- 技术栈：Vite + React + TypeScript + Tailwind CSS（纯前端）
- 输出格式：v1 固定为 JPEG（隐藏输出格式选项）
- 目标体积：自动寻优保证导出体积尽量 ≤ 5MB（在可行的质量范围内）

在线地址（GitHub Pages，创建后替换为你的用户名）：
- https://<your-github-username>.github.io/wx-pyq-hd/

提示：本工具仅提供“尽量提高”的技术手段，无法保证 100% 不被压缩；不同微信版本或设备策略可能不同。

## 功能概览

- 选择图片（PNG/JPEG/HEIF/HEIC）
- 自动进行 EXIF 方向矫正与解码（浏览器原生支持为准，HEIF/HEIC 不支持时给出友好提示）
- 切换目标画布横/竖（不旋转图片内容）
- 以 contain 策略等比缩放并居中铺贴到目标画布
- 背景色可选：黑 / 白 / 自定义十六进制（输入校验）
- 预览区使用缩放画布，交互顺滑
- 下载为 JPEG，采用“二分寻优”自适应质量，在画质与体积间尽量取得平衡，力求 ≤ 5MB
- Toast 提示：比例满足 / 体积状态

## 使用指南

1. 选择图片（仅本地处理，不上传）
2. 根据需要切换画布方向（横 4400×2200 或 竖 2200×4400）
3. 选择背景色（黑/白/自定义 #RRGGBB）
4. 预览确认后，点击“下载”
5. 下载文件名包含方向、尺寸与时间戳，方便区分管理

满足“长边/短边 ≥ 2”与“体积 < 5MB”的联合条件时，理论上发到朋友圈更可能不被压缩。工具界面会就这两项分别给予提示。

## 实现原理（关键点）

- 画布与贴合
  - 目标画布固定尺寸，分别为 4400×2200（横）或 2200×4400（竖）
  - 按 contain 策略等比缩放源图，居中贴合，空白区域用背景色填充
  - 参见：src/utils/fit.ts 中的 computeContainRect()

- 图片解码与 EXIF 方向
  - 首选浏览器原生解码能力，读取 EXIF Orientation 并进行画布变换矫正
  - HEIF/HEIC：当前 v1 不内置 wasm 解码器，若浏览器不支持则提示错误
  - 参见：src/utils/decoder.ts、src/utils/exif.ts

- JPEG 导出体积优化
  - 使用二分类似的策略搜索质量系数，尽量使输出体积 ≤ 5MB
  - 处理 Safari 等浏览器 canvas.toBlob 可能为 null 的兜底路径
  - 参见：src/utils/quality.ts 中的 exportJpegUnderSize()

- UI 与可访问性
  - Tailwind CSS 构建响应式布局与可达性
  - 预览画布降采样，保持交互顺滑
  - 参见：src/App.tsx、src/components/*

## 浏览器支持

- 移动端：iOS 15+（Safari）、Android Chrome 100+
- 桌面端：Chrome / Edge / Firefox 最新两个大版本
- HEIF/HEIC 支持依赖浏览器原生能力；不支持即提示失败（v1 不内置 wasm 解码器）

## 本地开发

要求：Node.js 18+（推荐 20）

- 安装依赖  
  npm ci

- 本地开发（含热更新）  
  npm run dev  
  启动后访问（如 Vite 默认）：http://localhost:5173/wx-pyq-hd/index.html

- 生产构建  
  npm run build  
  产物位于 dist/（GitHub Pages 将部署此目录）

- 预览构建产物  
  npm run preview  
  注意：项目使用 Vite base '/wx-pyq-hd/' 以适配项目型 Pages，Playwright E2E 也依赖该路径

### 测试

- 单元测试（Vitest）  
  - 运行：npm test  
  - 常驻：npm run test:watch  
  - 覆盖率：已启用 v8 provider（见 vitest.config.ts），可输出 text 与 lcov

- 端到端测试（Playwright）  
  - 运行：npm run e2e  
  - UI 模式：npm run e2e:ui  
  - Playwright 将先构建并以预览服务器在 http://localhost:4173/wx-pyq-hd/ 启动站点，再执行测试

提示：如果你在编辑器看到 tests/e2e 中 Node 内置模块类型报错，这不影响实际运行。我们在 E2E 测试文件中加了 @ts-nocheck 以避免编辑器类型噪音，运行时由 Playwright 在 Node 环境中执行。

## CI/CD（GitHub Actions）

- CI（.github/workflows/ci.yml）
  - 拉取依赖
  - 安装 Playwright 浏览器依赖
  - 执行单元测试与生产构建
  - 执行端到端测试

- Pages 部署（.github/workflows/pages.yml）
  - 触发：推送 main 分支或手动 workflow_dispatch
  - 产物：dist/
  - 部署到 GitHub Pages（来源：Actions）

首次启用 Pages：
1) Settings → Pages → Source 选择“GitHub Actions”
2) 推送 main 后等待 workflow 完成
3) 访问 https://<your-github-username>.github.io/wx-pyq-hd/

## 注意事项与局限

- “不被压缩”是经验性结论，受微信版本/系统/网络等影响，不保证 100% 成功。
- 体积压缩使用 JPEG 有损压缩，已有尽量平衡画质与体积的策略，但不同图片内容（纹理/噪声/色带）对体积敏感度不同，结果会有差异。
- HEIF/HEIC 的支持由浏览器决定。若你的设备/浏览器不支持，此工具会提示相应错误。可考虑先在系统层将 HEIC 转为 JPEG/PNG 再处理。

## 开源协议

MIT License（见 LICENSE）

## 变更日志

见 CHANGELOG.md
