const statusEl = document.getElementById("status");
const setStatus = (t, k = "") => { statusEl.textContent = t; statusEl.className = k; };

async function getCsfloatTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    if (active && /(^|\.)csfloat\.com$/.test(new URL(active.url).hostname)) return active;
  } catch (_) {}
  const tabs = await chrome.tabs.query({ url: ["https://csfloat.com/*", "https://*.csfloat.com/*"] });
  return tabs[0] || null;
}

async function readLocalStorage(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = localStorage.getItem(k);
      }
      return out;
    },
  });
  return result;
}

async function writeLocalStorage(tabId, data) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (obj) => { for (const [k, v] of Object.entries(obj)) { try { localStorage.setItem(k, v); } catch (e) {} } },
    args: [data],
  });
}

async function buildBundle() {
  const tab = await getCsfloatTab();
  if (!tab) throw new Error("no-tab");
  const { cookies } = await chrome.runtime.sendMessage({ type: "COLLECT_COOKIES" });
  const localStorageData = await readLocalStorage(tab.id);
  return {
    bundle: { site: "csfloat.com", exportedAt: new Date().toISOString(), cookies, localStorage: localStorageData },
    counts: { cookies: cookies.length, ls: Object.keys(localStorageData).length },
  };
}

async function applyBundle(bundle) {
  if (!bundle || !bundle.cookies || !bundle.localStorage) throw new Error("bad-bundle");
  const tab = await getCsfloatTab();
  if (!tab) throw new Error("no-tab");
  setStatus("Ставлю куки…");
  const res = await chrome.runtime.sendMessage({ type: "SET_COOKIES", cookies: bundle.cookies });
  setStatus("Записываю localStorage…");
  await writeLocalStorage(tab.id, bundle.localStorage);
  await chrome.tabs.reload(tab.id);
  return res;
}

const noTabMsg = "Сначала откройте вкладку csfloat.com в этом профиле.";

document.getElementById("export-file").addEventListener("click", async () => {
  try {
    setStatus("Собираю данные…");
    const { bundle, counts } = await buildBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({ url, filename: "csfloat-account.json", saveAs: true });
    setStatus(`Сохранено: ${counts.cookies} кук + ${counts.ls} записей localStorage.`, "ok");
  } catch (e) {
    setStatus(e.message === "no-tab" ? noTabMsg : "Ошибка: " + e.message, "err");
  }
});

document.getElementById("export-clip").addEventListener("click", async () => {
  try {
    setStatus("Собираю данные…");
    const { bundle, counts } = await buildBundle();
    await navigator.clipboard.writeText(JSON.stringify(bundle));
    setStatus(`Скопировано в буфер: ${counts.cookies} кук + ${counts.ls} записей localStorage.\nВставьте в новом профиле кнопкой «Из буфера».`, "ok");
  } catch (e) {
    setStatus(e.message === "no-tab" ? noTabMsg : "Ошибка: " + e.message, "err");
  }
});

document.getElementById("import-file").addEventListener("click", () => document.getElementById("file").click());
document.getElementById("file").addEventListener("change", async (ev) => {
  try {
    const file = ev.target.files[0];
    if (!file) return;
    setStatus("Читаю файл…");
    const bundle = JSON.parse(await file.text());
    const res = await applyBundle(bundle);
    setStatus(`Готово. Куки: ${res.ok} ок${res.fail ? ", " + res.fail + " не удалось" : ""}. Страница обновлена.`, "ok");
  } catch (e) {
    setStatus(e.message === "no-tab" ? noTabMsg : e.message === "bad-bundle" ? "Файл не похож на бандл csfloat." : "Ошибка: " + e.message, "err");
  } finally {
    ev.target.value = "";
  }
});

document.getElementById("import-clip").addEventListener("click", async () => {
  try {
    setStatus("Читаю буфер обмена…");
    const text = await navigator.clipboard.readText();
    if (!text.trim()) { setStatus("Буфер обмена пуст.", "err"); return; }
    let bundle;
    try { bundle = JSON.parse(text); } catch { setStatus("В буфере не JSON. Скопируйте бандл кнопкой «В буфер».", "err"); return; }
    const res = await applyBundle(bundle);
    setStatus(`Готово. Куки: ${res.ok} ок${res.fail ? ", " + res.fail + " не удалось" : ""}. Страница обновлена.`, "ok");
  } catch (e) {
    setStatus(e.message === "no-tab" ? noTabMsg : e.message === "bad-bundle" ? "В буфере не бандл csfloat." : "Ошибка: " + e.message, "err");
  }
});
