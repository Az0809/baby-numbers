# 宝宝学数字

面向 3 岁儿童的 1～100 数字启蒙网站。手机、平板优先，无登录、无后端、无数据库，所有数据只保存在当前浏览器。

## 已实现

- 1～100 数字和中文读法
- 10 个学习范围
- 数字与实际数量对应展示
- 中文语音朗读、声音开关
- 上一个、下一个和学习完成奖励
- 全屏数字卡片、点击朗读、左右滑动
- 看数字选数量
- 听声音找数字
- 答对/答错反馈与星星奖励
- 学习进度、上次位置、声音设置持久化
- 首次使用状态识别与旧版数据迁移
- 320px～平板尺寸响应式布局
- Web App Manifest、桌面图标、Service Worker 离线缓存
- 单元测试和 Playwright 交互测试

## 环境

- Node.js 20.9 或更高版本
- npm 10 或更高版本

## 本地运行

```bash
npm ci
npm run dev
```

打开终端显示的地址。

## 完整检查

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

第一次执行 Playwright 测试前，可能需要安装 Chromium：

```bash
npx playwright install chromium
```

## 静态预览

```bash
npm run build
npm run preview
```

默认地址为 `http://127.0.0.1:4173`，也可以指定端口：

```bash
npm run preview -- --port 8080
```

## 部署

### Vercel

导入仓库后使用默认 Next.js 配置即可。项目会静态导出，不需要服务器。`main` 分支用于生产环境自动部署。

### Cloudflare Pages

- 构建命令：`npm run build`
- 输出目录：`out`
- Node.js 版本：20.9 或更高

## 数据与隐私

学习数据保存在浏览器 `localStorage` 中，不会上传。清除浏览器网站数据、卸载浏览器或更换设备后，记录不会自动同步。

## 语音说明

朗读使用浏览器 Web Speech API。iPhone/iPad 建议使用 Safari，安卓建议使用 Chrome。部分浏览器第一次朗读需要孩子或家长先点击页面按钮。
