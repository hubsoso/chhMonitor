# Chrome Web Store 上架文案

> 提交时把对应内容复制到 Developer Dashboard 各字段。中英文各一份。

---

## 名称 / Name
CHH 二手区上新提醒（非官方）
> 英文可填：CHH Marketplace New-Post Alert (Unofficial)

## 简短说明 / Summary（≤132 字符）
**中文：** 监控论坛二手区新帖，角标提醒并直达原帖，支持关键词/发帖人过滤。非官方工具。
**EN:** Monitor a forum marketplace for new posts. Badge alerts, one-click open, keyword/author filters. Unofficial tool.

## 分类 / Category
Productivity（效率工具）

## 语言 / Language
中文（简体） / English

---

## 单一用途说明 / Single Purpose
**中文：** 定时检测指定论坛二手交易版块是否有新发布的主题帖，并通过扩展图标角标和可选的桌面通知提醒用户，帮助用户及时发现感兴趣的二手商品。

**EN:** Periodically check a specific forum marketplace board for newly posted threads and alert the user via a toolbar badge and optional desktop notifications, helping the user spot items of interest in time.

---

## 详细描述 / Detailed Description

**中文：**

这是一个**非官方的第三方效率工具**，用于帮助你及时发现 Chiphell 论坛二手交易区的新帖。本扩展与 Chiphell 无任何关联。

功能：
• 定时检测二手区是否有新主题帖，图标角标显示新帖数量
• 点击图标弹出简洁列表（标题 + 发帖人），点任意条目即可在新标签打开原帖
• 可选桌面弹窗通知（默认关闭，仅角标提示，不打断你）
• 关键词过滤：只对标题命中关键词的新帖提醒
• 发帖人过滤：只盯指定卖家；可与关键词按"或/且"组合
• 自定义刷新周期（1–30 分钟），并附加随机抖动以规避频率风控
• 自动检测登录状态，过期时提醒你重新登录

隐私：本扩展**不收集任何数据**，所有设置与记录仅存于你本机浏览器，绝不上传服务器；仅使用你自己的登录态只读访问论坛页面。

免责声明：本扩展为第三方非官方工具，与 Chiphell 论坛无关联；请在遵守目标网站使用条款的前提下合理使用。

**EN:**

An **unofficial third-party productivity tool** that helps you spot new posts in the Chiphell forum's second-hand marketplace board. Not affiliated with Chiphell.

Features:
• Periodically checks for new threads; the toolbar badge shows the new-post count
• Click to see a clean list (title + author); click any item to open the thread in a new tab
• Optional desktop notifications (off by default — badge only, non-intrusive)
• Keyword filter: alert only for titles containing your keywords
• Author filter: watch specific sellers; combine with keywords via OR/AND
• Custom refresh interval (1–30 min) with random jitter to avoid rate-limiting
• Detects login state and reminds you to re-login when the session expires

Privacy: collects **no data**; all settings and state stay in your local browser and are never uploaded. It only reads the forum page using your own existing login session.

Disclaimer: This is an unofficial third-party tool, not affiliated with Chiphell. Please use it responsibly and in accordance with the target site's terms of service.

---

## 权限用途说明 / Permission Justifications
> Dashboard 会要求逐条填写理由，复制对应句子即可。

| 权限 | 中文理由 | English justification |
|------|---------|----------------------|
| `storage` | 在本地保存用户的设置（周期、关键词、发帖人、通知开关）和已读帖子记录。 | Store the user's settings and read-post state locally. |
| `alarms` | 按用户设定的周期定时触发新帖检查。 | Trigger periodic new-post checks on the user's chosen interval. |
| `notifications` | 在用户开启时，发现新帖后弹出桌面通知。 | Show a desktop notification for new posts when the user enables it. |
| `host_permissions` (`https://www.chiphell.com/*`) | 读取被监控的二手区页面 HTML，以检测是否有新发布的主题帖。仅只读访问，使用用户自身登录态。 | Read the monitored marketplace page HTML to detect newly posted threads. Read-only, using the user's own session. |

**远程代码 / Remote code:** 否 / No — 扩展不加载或执行任何远程代码。
**数据收集声明 / Data collection:** 不收集任何用户数据 / Does not collect any user data.
