# 🦞 OpenClaw Desktop - 安装指南

## 📦 下载选项

### 选项 1：ZIP 绿色版（推荐！⭐）

**文件名：** `OpenClaw-Desktop-Windows.zip`

**优点：**
- ✅ 无需安装
- ✅ 不触发 SmartScreen 警告
- ✅ 解压即用
- ✅ 不写注册表
- ✅ 可放 U 盘随身携带

**使用步骤：**
1. 从 GitHub Actions 下载 ZIP 文件
2. 右键 → 解压到当前文件夹
3. 双击运行 `OpenClaw Desktop.exe`
4. 开始使用！

---

### 选项 2：安装包（标准方式）

**文件名：** `OpenClaw Desktop Setup 1.0.0.exe`

**如果遇到 SmartScreen 警告：**

这是 Windows 的安全机制，所有未签名的应用都会遇到。**不是病毒！**

**解决方法：**

#### 方法 A：右键解除锁定（推荐）
1. 右键点击安装包
2. 选择 **"属性"**
3. 在底部找到 **"安全"** 部分
4. 勾选 **"☑ 解除锁定"**
5. 点击 **"确定"**
6. 双击运行

#### 方法 B：使用 PowerShell
```powershell
# 打开 PowerShell，进入下载文件夹
cd C:\Users\你的用户名\Downloads
Unblock-File -Path "OpenClaw Desktop Setup 1.0.0.exe"
# 然后双击运行
```

#### 方法 C：点击"更多信息"
1. SmartScreen 警告窗口出现时
2. 点击 **"更多信息"** 链接
3. 会出现 **"仍然运行"** 按钮
4. 点击 **"仍然运行"**

#### 方法 D：以管理员身份运行
1. 右键点击安装包
2. 选择 **"以管理员身份运行"**

---

## 📥 从哪里下载

### 方式 1：GitHub Actions（最新开发版）

1. 访问：https://github.com/XiangYang-2026/openclaw-desktop/actions
2. 点击 **"Build Windows App"** 工作流
3. 点击最新的成功构建记录
4. 滚动到底部 **Artifacts**
5. 下载 `OpenClaw-Desktop-Windows.zip`（推荐）或 `.exe` 安装包

### 方式 2：GitHub Releases（稳定版）

1. 访问：https://github.com/XiangYang-2026/openclaw-desktop/releases
2. 下载最新版本的安装包或 ZIP

---

## 🚀 快速开始

1. 下载并解压/安装
2. 启动 OpenClaw Desktop
3. 在左侧导航选择功能：
   - 🏠 网关管理
   - 📱 节点管理
   - 📺 频道管理
   - 🧩 技能管理
   - ⚙️ 设置

---

## ❓ 常见问题

### Q: SmartScreen 一直阻止怎么办？
**A:** 使用 ZIP 绿色版，或者按照上面的"方法 A"解除锁定。

### Q: 杀毒软件报毒？
**A:** 这是误报。我们的应用是开源的，代码完全透明：
- 查看源码：https://github.com/XiangYang-2026/openclaw-desktop
- 在 VirusTotal 扫描：https://www.virustotal.com

### Q: 安装后无法启动？
**A:** 确保：
1. 已安装 Node.js（运行环境需要）
2. 以管理员身份运行
3. 检查防火墙设置

### Q: 如何卸载？
**A:** 
- **ZIP 版：** 直接删除文件夹
- **安装包：** 控制面板 → 程序和功能 → 卸载 OpenClaw Desktop

---

## 🔐 安全说明

- ✅ 开源项目，代码完全透明
- ✅ 无恶意代码
- ✅ 不收集个人信息
- ⚠️ 未购买数字签名证书（个人项目）
- ⚠️ SmartScreen 警告是正常现象

---

## 📞 需要帮助？

- 📖 文档：https://github.com/XiangYang-2026/openclaw-desktop#readme
- 🐛 问题反馈：https://github.com/XiangYang-2026/openclaw-desktop/issues
- 💬 社区：https://discord.com/invite/clawd

---

**🦞 狸宝出品 · 2026-04-10**
