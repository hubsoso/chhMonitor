# CHH 二手区上新提醒（非官方）

一个 Chrome 扩展（Manifest V3），用于监控 Chiphell 论坛二手交易区的新帖并及时提醒。
**非官方第三方工具，与 Chiphell 无关联。**

## 功能

- 📛 **角标计数**：图标上显示未读新帖数量
- 📋 **列表直达**：点图标弹出列表（标题 + 发帖人），点条目在新标签打开原帖
- 🔔 **可选弹窗通知**：默认关闭，仅角标提示，不打断当前操作
- 🏷️ **关键词过滤**：只对标题命中关键词的新帖提醒
- 👤 **发帖人过滤**：只盯指定卖家，可与关键词按「或 / 且」组合
- ⏱️ **自定义刷新周期**：1–30 分钟，附随机抖动规避频率风控
- 🔐 **登录检测**：过期时角标变橙并在弹窗提示重新登录

## 安装（开发者模式）

1. 打开 `chrome://extensions/`
2. 右上角开启 **开发者模式**
3. 点 **加载已解压的扩展程序**，选择本目录
4. 确保同一个 Chrome 已登录 chiphell.com（扩展复用你的登录 Cookie）

## 使用

- 点扩展图标查看新帖列表；打开弹窗即清零角标
- 点弹窗右下角 **设置** 配置：刷新周期、弹窗开关、关键词、发帖人、组合方式
- 改动设置或代码后，到 `chrome://extensions/` 点 🔄 重新加载

## 工作原理

- 后台 service worker 用 `chrome.alarms` 定时拉取版块页面，正则解析 `normalthread_` 主题块，用帖子 `tid` 判定"新帖"并拼接直达链接。
- 首次安装建立基线（不把历史帖当新帖）；之后仅未出现过的帖子算新。
- 登录检测：页面是否含"退出登录"链接。

## 隐私

不收集任何数据，所有设置与记录仅存于本机 `chrome.storage.local`，绝不上传服务器。详见 [PRIVACY.md](./PRIVACY.md)。

## 发布到 Chrome Web Store

上架文案见 [STORE_LISTING.md](./STORE_LISTING.md)。打包命令：

```bash
cd ~/chiphell-monitor
zip -r -X ../chh-marketplace-alert.zip . \
  -x '.*' -x '__MACOSX' -x '*.md' -x '*.zip'
```

> zip 根目录须直接是 `manifest.json`。更新版本时递增 `manifest.json` 的 `version`。

## 目录结构

```
chiphell-monitor/
├── manifest.json        扩展清单
├── background.js        后台：定时检查 / 解析 / 通知 / 徽标
├── popup.html/.js       弹窗：新帖列表 + 直达 + 登录提示
├── options.html/.js     设置：周期 / 通知 / 关键词 / 发帖人
├── icons/               图标 16/48/128
├── donate/              赞赏码（微信 / 支付宝）
├── PRIVACY.md           隐私政策
├── STORE_LISTING.md     商店上架文案
├── LICENSE              MIT 许可证
└── README.md
```

## 赞赏支持

如果这个小工具帮到了你，欢迎请作者喝杯咖啡，感谢支持 🙏

| 微信 | 支付宝 |
|:---:|:---:|
| <img src="./donate/wechatpay.png" width="220" alt="微信赞赏码"> | <img src="./donate/alipay.jpg" width="220" alt="支付宝收款码"> |

## 免责声明

本扩展为第三方非官方工具，与 Chiphell 论坛无任何关联。请在遵守目标网站使用条款的前提下合理使用。

## 许可证

[MIT](./LICENSE) © 2026 lucifer

---

# CHH Marketplace New-Post Alert (Unofficial)

A Chrome extension (Manifest V3) that monitors the second-hand trading section of the Chiphell forum for new posts and alerts you promptly.
**Unofficial third-party tool, not affiliated with Chiphell.**

## Features

- 📛 **Badge count**: shows the number of unread new posts on the icon
- 📋 **Direct list access**: click the icon for a popup list (title + poster); click an item to open the original post in a new tab
- 🔔 **Optional popup notifications**: off by default — badge-only, so it won't interrupt what you're doing
- 🏷️ **Keyword filter**: only alerts on new posts whose title matches your keywords
- 👤 **Poster filter**: watch only specific sellers, combinable with keywords via "OR / AND"
- ⏱️ **Custom refresh interval**: 1–30 minutes, with random jitter to avoid rate-limit controls
- 🔐 **Login detection**: when your session expires, the badge turns orange and the popup prompts you to log in again

## Installation (Developer Mode)

1. Open `chrome://extensions/`
2. Enable **Developer mode** in the top-right corner
3. Click **Load unpacked** and select this directory
4. Make sure the same Chrome is logged in to chiphell.com (the extension reuses your login cookie)

## Usage

- Click the extension icon to view the new-post list; opening the popup resets the badge to zero
- Click **Settings** at the bottom-right of the popup to configure: refresh interval, notification toggle, keywords, posters, and combination mode
- After changing settings or code, go to `chrome://extensions/` and click 🔄 to reload

## How It Works

- A background service worker uses `chrome.alarms` to periodically fetch the section page, parses `normalthread_` thread blocks with a regex, uses each post's `tid` to determine whether it's "new," and builds a direct link.
- On first install it establishes a baseline (so historical posts aren't treated as new); afterward, only posts not seen before count as new.
- Login detection: whether the page contains a "log out" link.

## Privacy

Collects no data. All settings and records are stored only on your machine in `chrome.storage.local` and are never uploaded to any server. See [PRIVACY.md](./PRIVACY.md) for details.

## Publishing to the Chrome Web Store

See [STORE_LISTING.md](./STORE_LISTING.md) for the store listing copy. Packaging command:

```bash
cd ~/chiphell-monitor
zip -r -X ../chh-marketplace-alert.zip . \
  -x '.*' -x '__MACOSX' -x '*.md' -x '*.zip'
```

> The zip root must contain `manifest.json` directly. Increment the `version` in `manifest.json` when releasing an update.

## Directory Structure

```
chiphell-monitor/
├── manifest.json        Extension manifest
├── background.js        Background: scheduled checks / parsing / notifications / badge
├── popup.html/.js       Popup: new-post list + direct links + login prompt
├── options.html/.js     Settings: interval / notifications / keywords / posters
├── icons/               Icons 16/48/128
├── donate/              Donation QR codes (WeChat / Alipay)
├── PRIVACY.md           Privacy policy
├── STORE_LISTING.md     Store listing copy
├── LICENSE              MIT License
└── README.md
```

## Support the Project

If this little tool helps you, feel free to buy the author a coffee — thanks for your support 🙏

| WeChat Pay | Alipay |
|:---:|:---:|
| <img src="./donate/wechatpay.png" width="220" alt="WeChat Pay"> | <img src="./donate/alipay.jpg" width="220" alt="Alipay"> |

## Disclaimer

This extension is an unofficial third-party tool with no affiliation to the Chiphell forum. Please use it reasonably and in compliance with the target website's terms of service.

## License

[MIT](./LICENSE) © 2026 lucifer
