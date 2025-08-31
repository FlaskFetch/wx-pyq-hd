# 变更日志 | Changelog

遵循 Keep a Changelog 与语义化版本（尽量）。本项目 v1 为纯前端工具，主要围绕画布贴合、体积寻优与 Pages 部署展开。

## [0.1.0] - 2025-08-31

首个公开版本（v1，固定 JPEG 输出，自动体积寻优 ≤ 5MB）

- 功能
  - 图片解码与 EXIF 方向矫正：见 [decoder.parseAndNormalizeImage()](src/utils/decoder.ts:1)
  - contain 贴合与画布渲染：见 [fit.computeContainRect()](src/utils/fit.ts:7)、[canvas.renderToCanvas()](src/utils/canvas.ts:1)
  - 自定义背景色（黑/白/自定义十六进制）：见 [color.isValidHex()](src/utils/color.ts:4)、[color.ensureHex6()](src/utils/color.ts:13)
  - 预览画布降采样与即时更新：见 [components/PreviewCanvas](src/components/PreviewCanvas.tsx)
  - 横/竖画布切换（不旋转图片内容）：见 [App](src/App.tsx)
  - JPEG 导出体积寻优（二分类似）：见 [quality.exportJpegUnderSize()](src/utils/quality.ts:6)，含 toBlob null 兜底
  - Toast 提示（比例满足、体积状态）：见 [components/Toast](src/components/Toast.tsx)
- 技术栈与构建
  - Vite + React + TypeScript + Tailwind：入口 [main](src/main.tsx)、应用 [App](src/App.tsx)
  - Vite base 配置为 /wx-pyq-hd/：见 [vite.config.ts](vite.config.ts)
  - Tailwind/PostCSS 配置与样式：见 [tailwind.config.js](tailwind.config.js)、[postcss.config.js](postcss.config.js)、[src/index.css](src/index.css)
- 测试
  - 单元测试（Vitest）：已覆盖 contain 贴合、颜色校验、JPEG 体积寻优
    - [tests/unit/fit.test.ts](tests/unit/fit.test.ts)
    - [tests/unit/color.test.ts](tests/unit/color.test.ts)
    - [tests/unit/quality.test.ts](tests/unit/quality.test.ts)
  - 端到端测试（Playwright）：上传-预览-旋转-自定义背景-下载完整链路
    - [tests/e2e/flow.spec.ts](tests/e2e/flow.spec.ts)
  - 测试环境/阈值等配置：见 [vitest.config.ts](vitest.config.ts)、[tests/setup.ts](tests/setup.ts)、[playwright.config.ts](playwright.config.ts)
- CI/CD 与发布
  - CI：安装依赖、安装 Playwright 浏览器、单测、构建、E2E 测试
    - [ .github/workflows/ci.yml ](.github/workflows/ci.yml)
  - Pages：构建 dist 并通过 Actions 部署
    - [ .github/workflows/pages.yml ](.github/workflows/pages.yml)
- 文档与协议
  - 说明文档：见 [README.md](README.md)
  - 许可证：见 [LICENSE](LICENSE)

已知限制
- HEIF/HEIC 解码依赖浏览器原生能力；v1 不内置 wasm 解码器，不支持时会提示错误（参见 [decoder.parseAndNormalizeImage()](src/utils/decoder.ts:1)）
- “朋友圈不压缩”是经验性结论，需要同时满足“长/短边 ≥ 2”与“体积 < 5MB”，不同环境可能存在差异（提示逻辑位于 [App](src/App.tsx)）
