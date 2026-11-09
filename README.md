# 咪猪头的2048碰碰大挑战

小猪主题的物理碰撞合并 Web 游戏。使用 Vite、原生 JavaScript、Canvas 2D 和 Matter.js 0.20.0；游戏运行时的脚本、图形和音频全部来自本地文件，无需 CDN。

在线玩：https://larria.github.io/piggymi2048Bump/

## 运行

要求 Node.js 20.19+ 或 22.12+。

```sh
npm install --cache .npm-cache
npm run dev
```

打开 http://localhost:5188 。同一局里，鼠标移动瞄准、点击投放；手机拖动瞄准、松手投放。键盘左右方向键瞄准、空格投放、P 暂停、Esc 取消消除。

```sh
npm test       # 物理规则回归测试
npm run build # 生成 dist/，可部署到静态服务器
npm run preview # 在 http://localhost:4188/piggymi2048Bump/ 验证构建结果
npm run test:pwa # 检查构建中的图标、离线资源和 Pages 路径
```

`dist/index.html` 需要由 HTTP 静态服务器提供，不要以 file:// 双击运行。开发时使用根目录；生产构建默认部署到 `/piggymi2048Bump/`。

## PWA 与发布

- 在游戏底部点击「把小猪带回家」，或通过浏览器的安装入口安装。iPhone / iPad 使用 Safari → 分享 → 添加到主屏幕。
- 图标使用用户提供的「粉红小猪挑战2048.png」，包含 192 / 512 像素标准图标、遮罩安全图标、Apple touch 图标与 favicon。
- 首次在线加载并完成离线准备后，游戏、所有关卡、图标、背景音乐和五种音效都可以离线使用；缓存约 1.8 MB。音频支持离线 Range 请求。
- 有新版本时会提示，点击「更新并重开」才更新。单局会重新开始，已解锁关卡、星数和最高分保留。
- Service Worker 仅在生产构建启用，缓存与作用域限定在本游戏路径，开发服务器不启用离线缓存。

直接通过 `gh-pages` npm 插件发布，**不使用 GitHub Actions**：

```sh
git push origin main # 源码
npm run deploy      # 测试、构建、PWA 检查，然后将 dist/ 推到 gh-pages 分支
```

GitHub 仓库 Settings → Pages 选择「Deploy from a branch」，分支 `gh-pages`，目录 `/ (root)`。发布分支包含 `.nojekyll`，无需 Jekyll。后续每次更新只需提交源码并运行 `npm run deploy`。

## 玩法

- 相同数字真实碰撞后合并、翻倍，支持连续合并。碰撞使用圆角方块刚体，可旋转、滚动、堆叠。
- 12 个关卡：从 128 到 8192。依次解锁，记录 1–3 星表现。第 2 关开始有投放次数限制，第 3 关开始加入固定与旋转挡板，第 6 关开始降低初始数字储备。
- 出块使用每关专属的均衡洗牌袋，限制长时间抽不到某种数字的情况。
- 同一方块在警戒线上方静止约 2.8 秒才判满；新投放有 2 秒宽限期。最后一次投放后保留 5 秒碰撞结算时间，达成目标优先通关。
- 每关有 3 次撤回、2 次摇一摇、2 次点选消除。撤回还原上次投放前的方块、队列、计分与次数，不退还已消耗道具。重新开始补满道具。
- 自由模式没有目标或投放限制，方块堆满仍会结束。
- 本机 localStorage 保存关卡解锁、星数、最近选择、最高分、音乐与音效偏好。进行中的单局不会在刷新后恢复。
- 浏览器要求首次点击或按键后才开始音乐；音乐和音效可分别关闭。暂停、打开弹窗、切到后台时暂停游戏与背景音乐。

## 文件

| 路径 | 用途 |
| --- | --- |
| `src/data.js` | 关卡目标、出块分布、障碍、配色 |
| `src/physics.js` | 刚体、碰撞合并、撤回、道具、胜负 |
| `src/render.js` | 数字猪方块、轨迹、粒子和画布绘制 |
| `src/main.js` | 界面、输入、地图、存档与弹窗 |
| `src/style.css` | 桌面、平板、手机布局 |
| `src/icons.js` | 原创 SVG 小猪与线性图标 |
| `src/audio.js` | 本地音乐与音效 |
| `src/pwa.js` | 安装入口、离线就绪与更新提示 |
| `src/sw.js` | 预缓存、导航回退与离线音频 Range 请求 |
| `scripts/verify-pwa.mjs` | PWA 构建检查 |

## 资源来源

- Matter.js：MIT，https://github.com/liabru/matter-js ，许可证保存在 `THIRD_PARTY_NOTICES.md`。
- 小猪吉祥物、数字方块、图标、背景与庆祝效果均由本项目的 SVG / Canvas / CSS 绘制。
- 按用户授权，从 `piggymicharacter3/public/audio/` **仅复制**：`bgm-sunny-30s.mp3`、`sfx_click.mp3`、`sfx_correct.mp3`、`sfx_celebrate.mp3`、`sfx_wrong.mp3`、`sfx_unlock.mp3`。源项目没有改动。
- PWA 图标来源于用户提供的小猪图片。

## 验证

`npm test` 覆盖真实碰撞、三块争抢合并、连锁、计分守恒、末次投放通关、警戒线宽限期、撤回、均衡出块与道具预算。浏览器检查桌面和 iPhone 14 布局、键盘投放、撤回、暂停、洗牌、关卡地图和音频开关。
