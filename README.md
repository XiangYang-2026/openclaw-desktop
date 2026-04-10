# 🦞 OpenClaw Desktop

OpenClaw 桌面控制界面 - 让 OpenClaw 操作更简单！

## 🚀 功能特性

- ✅ 网关管理（启动/停止/状态）
- ✅ 系统状态查看
- ✅ 实时日志输出
- 🔄 节点管理（开发中）
- 🔄 频道管理（开发中）
- 🔄 技能管理（开发中）

## 📦 开发环境

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 打包 Windows 版本
npm run build:win
```

## 🛠️ 技术栈

- Electron 28+
- React 18 + TypeScript
- Vite 5
- electron-builder

## 📁 项目结构

```
openclaw-desktop/
├── src/
│   ├── main/           # Electron 主进程
│   ├── renderer/       # React 前端
│   └── preload/        # Preload 脚本
├── resources/          # 图标等资源
├── package.json
└── vite.config.ts
```

## 🎯 下一步

1. 推送代码到 GitHub
2. 配置 GitHub Actions 自动构建
3. 完善更多功能模块

---

**作者:** Li Bao 🦞
**License:** MIT
