// Chiphell 二手区监控 - service worker (MV3)

const MONITOR_URL =
  "https://www.chiphell.com/forum-328-1.html";
const LOGIN_URL = "https://www.chiphell.com/member.php?mod=logging&action=login";
const ALARM = "ch_check";
const KNOWN_CAP = 800; // 记忆的历史帖子 id 上限，防止无限增长

// ---------- 存储辅助 ----------
async function getSettings() {
  const r = await chrome.storage.local.get(["settings"]);
  return Object.assign(
    {
      intervalMinutes: 5,
      notify: false,
      keywords: "",
      keywordFilter: false,
      authors: "",
      authorFilter: false,
      combine: "or",
    },
    r.settings || {}
  );
}

// 关键词解析：支持中英文逗号 / 顿号 / 分号 / 换行分隔。
// 不按空格分隔，以便支持 "R5 5600" 这类短语关键词。
function parseKeywords(raw) {
  if (!raw) return [];
  return raw
    .split(/[,，、;；\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 按包含匹配关键词；短语中的空格可匹配空白或常见连接符。
// 例如 "iPhone" 可命中 "iPhone17"，"R5 5600" 仍按完整短语匹配。
function keywordPattern(keyword) {
  const parts = keyword.trim().split(/\s+/).map(escapeRegExp);
  const phrase = parts.join("[\\s\\-_/\\/·・‐‑‒–—]+");
  return new RegExp(phrase, "i");
}

function matchKeywords(title, keywords) {
  return keywords.some((keyword) => keywordPattern(keyword).test(title || ""));
}

// 发帖人解析：按逗号 / 顿号 / 分号 / 换行分隔（不按空格，用户名可能含空格）
function parseAuthors(raw) {
  if (!raw) return [];
  return raw
    .split(/[,，、;；\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
async function getState() {
  const r = await chrome.storage.local.get(["state"]);
  return r.state || {};
}
async function patchState(patch) {
  const s = await getState();
  await chrome.storage.local.set({ state: Object.assign({}, s, patch) });
}
async function ensureDefaults() {
  const r = await chrome.storage.local.get(["settings", "state"]);
  await chrome.storage.local.set({
    settings: Object.assign(
      {
        intervalMinutes: 5,
        notify: false,
        keywords: "",
        keywordFilter: false,
        authors: "",
        authorFilter: false,
        combine: "or",
      },
      r.settings || {}
    ),
    state: r.state || {},
  });
}

// ---------- HTML 解析（service worker 无 DOMParser，用正则） ----------
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n));
}
function stripTags(s) {
  return s.replace(/<[^>]+>/g, "");
}

// 只解析 normalthread_（普通主题），忽略置顶 stickthread_
function parseThreads(html) {
  const threads = [];
  const re = /<tbody id="normalthread_(\d+)">([\s\S]*?)<\/tbody>/g;
  let m;
  while ((m = re.exec(html))) {
    const tid = m[1];
    const block = m[2];
    const tm = block.match(/<a[^>]*class="s xst"[^>]*>([\s\S]*?)<\/a>/);
    if (!tm) continue;
    const title = decodeEntities(stripTags(tm[1])).trim();
    if (!title) continue;
    let author = "";
    const am = block.match(/<td class="by">[\s\S]*?<cite>([\s\S]*?)<\/cite>/);
    if (am) author = decodeEntities(stripTags(am[1])).trim();
    threads.push({
      tid,
      title,
      author,
      url: `https://www.chiphell.com/thread-${tid}-1-1.html`,
    });
  }
  return threads;
}

// 登录检测：登录后页面含 退出登录 链接（action=logout）
function detectLogin(html) {
  return /action=logout/.test(html);
}

// ---------- 徽标 / 通知 ----------
function setBadge(text, color) {
  chrome.action.setBadgeText({ text: text || "" });
  if (color) chrome.action.setBadgeBackgroundColor({ color });
}
function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message,
    priority: 1,
  });
}

// ---------- 核心检查 ----------
async function runCheck(reason) {
  const settings = await getSettings();
  let html;
  try {
    const resp = await fetch(MONITOR_URL, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    html = await resp.text();
    if (!resp.ok) throw new Error("HTTP " + resp.status);
  } catch (e) {
    await patchState({ lastError: "网络错误：" + e.message, lastCheck: Date.now() });
    return;
  }

  const loggedIn = detectLogin(html);
  const threads = parseThreads(html);
  const st = await getState();

  // 过滤器：关键词（标题包含匹配）+ 发帖人（用户名精确匹配）
  const kws = parseKeywords(settings.keywords);
  const authors = parseAuthors(settings.authors);
  const kwOn = !!settings.keywordFilter && kws.length > 0;
  const auOn = !!settings.authorFilter && authors.length > 0;
  const anyFilter = kwOn || auOn;
  const combineAnd = settings.combine === "and";
  const matchKw = (title) => matchKeywords(title, kws);
  const matchAu = (author) => authors.includes((author || "").toLowerCase());
  const isAlertable = (t) => {
    if (!anyFilter) return true; // 未设任何过滤 -> 全部提醒
    if (kwOn && !auOn) return matchKw(t.title);
    if (!kwOn && auOn) return matchAu(t.author);
    // 两个过滤器都开：按组合方式
    return combineAnd
      ? matchKw(t.title) && matchAu(t.author)
      : matchKw(t.title) || matchAu(t.author);
  };
  threads.forEach((t) => (t.match = anyFilter && isAlertable(t)));

  // 未登录 / 登录过期
  if (!loggedIn) {
    setBadge("!", "#e67e22");
    await patchState({
      loginOk: false,
      lastCheck: Date.now(),
      lastError: "",
    });
    if (settings.notify && !st.loginWarned) {
      notify("Chiphell 监控：需要登录", "检测到未登录或登录已过期，点击扩展图标去登录。");
    }
    await patchState({ loginWarned: true });
    return;
  }

  // 已登录但没解析到帖子：可能页面结构变化，保留旧数据
  if (threads.length === 0) {
    await patchState({
      loginOk: true,
      loginWarned: false,
      lastCheck: Date.now(),
      lastError: "未解析到帖子（页面结构可能已变化）",
    });
    return;
  }

  const known = new Set(st.knownTids || []);
  const unread = new Set(st.unreadTids || []);

  // 首次运行：建立基线，不报新帖、不弹窗
  if (!st.seeded) {
    threads.forEach((t) => known.add(t.tid));
    await patchState({
      seeded: true,
      knownTids: [...known],
      unreadTids: [],
      threads,
      loginOk: true,
      loginWarned: false,
      lastCheck: Date.now(),
      lastError: "",
    });
    setBadge("", "");
    return;
  }

  // 找出全新帖子；开启过滤时，只有命中过滤条件的才计入提醒
  const brandNew = threads.filter((t) => !known.has(t.tid));
  const alertable = brandNew.filter(isAlertable);
  alertable.forEach((t) => unread.add(t.tid));
  threads.forEach((t) => known.add(t.tid)); // 所有当前帖都记为已知，未命中的下次不再算新

  let knownArr = [...known];
  if (knownArr.length > KNOWN_CAP) knownArr = knownArr.slice(knownArr.length - KNOWN_CAP);

  await patchState({
    knownTids: knownArr,
    unreadTids: [...unread],
    threads,
    loginOk: true,
    loginWarned: false,
    lastCheck: Date.now(),
    lastError: "",
  });

  const badgeCount = unread.size;
  setBadge(badgeCount > 0 ? String(badgeCount) : "", "#c8102e");

  if (settings.notify && alertable.length > 0) {
    const head = alertable
      .slice(0, 3)
      .map((t) => "• " + t.title)
      .join("\n");
    const more = alertable.length > 3 ? `\n…共 ${alertable.length} 条` : "";
    const tip = anyFilter ? "（命中过滤）" : "";
    notify(`Chiphell 二手区 ${alertable.length} 条新帖${tip}`, head + more);
  }
}

async function markRead() {
  await patchState({ unreadTids: [] });
  setBadge("", "");
}

// ---------- 定时器（带抖动，规避流控） ----------
async function scheduleNext() {
  const settings = await getSettings();
  const base = Math.max(1, settings.intervalMinutes || 5);
  const jitter = base * 0.25 * Math.random(); // 0 ~ 25% 抖动
  chrome.alarms.create(ALARM, { delayInMinutes: base + jitter });
}

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) runCheck("alarm").finally(scheduleNext);
});

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  await runCheck("install");
  scheduleNext();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  runCheck("startup");
  scheduleNext();
});

// 点击通知 -> 打开二手区
chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: MONITOR_URL });
});

// 当用户在 chiphell 页面完成加载（如重新登录后页面刷新）时，立即复查一次，
// 让"登录过期 -> 重新登录"后扩展状态自动刷新，无需手动点刷新。
let lastAutoCheck = 0;
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  const url = (tab && tab.url) || "";
  if (!url.includes("chiphell.com")) return;
  const st = await getState();
  const now = Date.now();
  // 登录过期时优先立即复查；否则 30 秒节流，避免频繁请求触发风控
  if (st.loginOk === false || now - lastAutoCheck > 30000) {
    lastAutoCheck = now;
    await runCheck("tab-loaded");
    await scheduleNext();
  }
});

// ---------- 消息（来自 popup / options） ----------
chrome.runtime.onMessage.addListener((msg, sender, send) => {
  (async () => {
    if (msg.type === "getState") {
      send({ ok: true, state: await getState(), settings: await getSettings() });
    } else if (msg.type === "checkNow") {
      await runCheck("manual");
      await scheduleNext();
      send({ ok: true, state: await getState(), settings: await getSettings() });
    } else if (msg.type === "markRead") {
      await markRead();
      send({ ok: true });
    } else if (msg.type === "settingsChanged") {
      await scheduleNext();
      send({ ok: true });
    } else {
      send({ ok: false });
    }
  })();
  return true; // 异步响应
});
