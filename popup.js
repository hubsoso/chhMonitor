const LOGIN_URL = "https://www.chiphell.com/member.php?mod=logging&action=login";
// 打赏：打开扩展内置的收款码页面（微信 / 支付宝扫码，无需跳转登录）
const COFFEE_URL = chrome.runtime.getURL("donate.html");

const $ = (id) => document.getElementById(id);

function fmtTime(ts) {
  if (!ts) return "尚未检查";
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function render(state, settings) {
  const dot = $("dot");
  const statusText = $("statusText");
  const banner = $("banner");
  const notifyBanner = $("notifyBanner");

  if (state.lastNotificationError) {
    notifyBanner.textContent = `系统通知发送失败，稍后重试：${state.lastNotificationError}`;
    notifyBanner.style.display = "block";
  } else {
    notifyBanner.style.display = "none";
  }

  if (state.loginOk === false) {
    dot.className = "dot bad";
    statusText.textContent = "Chiphell 未登录";
    banner.style.display = "block";
  } else if (state.loginOk === true) {
    dot.className = "dot ok";
    statusText.textContent = "已登录";
    banner.style.display = "none";
  } else {
    dot.className = "dot";
    statusText.textContent = "未知";
    banner.style.display = "none";
  }

  const list = $("list");
  const empty = $("empty");
  list.innerHTML = "";
  const threads = state.threads || [];
  const unread = new Set(state.unreadTids || []);

  if (threads.length === 0) {
    empty.style.display = "block";
    empty.textContent = state.lastError || "暂无帖子";
  } else {
    empty.style.display = "none";
    threads.slice(0, 50).forEach((t) => {
      const li = document.createElement("li");
      const isNew = unread.has(t.tid);
      const cls = [];
      if (isNew) cls.push("new");
      if (t.match) cls.push("match");
      li.className = cls.join(" ");
      const title = document.createElement("span");
      title.className = "t";
      title.innerHTML =
        (isNew ? '<span class="newdot"></span>' : "") +
        `<span class="source-tag">${escapeHtml(t.sourceLabel || "Chiphell")}</span>` +
        (t.match ? '<span class="kwtag">关键词</span>' : "") +
        escapeHtml(t.title);
      const by = document.createElement("span");
      by.className = "by";
      by.textContent = t.author ? "by " + t.author : "";
      li.appendChild(title);
      li.appendChild(by);
      li.addEventListener("click", () => chrome.tabs.create({ url: t.url }));
      list.appendChild(li);
    });
  }

  const meta = $("meta");
  const nUnread = (state.unreadTids || []).length;
  meta.textContent =
    (nUnread > 0 ? `${nUnread} 新 · ` : "") +
    `更新于 ${fmtTime(state.lastCheck)}`;
}

async function load() {
  const resp = await chrome.runtime.sendMessage({ type: "getState" });
  if (resp && resp.ok) render(resp.state, resp.settings);
  // 展示后标记为已读，清空角标
  chrome.runtime.sendMessage({ type: "markRead" });
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

$("refresh").addEventListener("click", async () => {
  const btn = $("refresh");
  btn.disabled = true;
  btn.textContent = "刷新中…";
  const resp = await chrome.runtime.sendMessage({ type: "checkNow" });
  if (resp && resp.ok) render(resp.state, resp.settings);
  chrome.runtime.sendMessage({ type: "markRead" });
  btn.disabled = false;
  btn.textContent = "立即刷新";
});

$("coffee").addEventListener("click", () => chrome.tabs.create({ url: COFFEE_URL }));
$("opt").addEventListener("click", () => chrome.runtime.openOptionsPage());
$("loginLink").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: LOGIN_URL });
});

load();
