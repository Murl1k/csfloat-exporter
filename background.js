const DOMAIN = "csfloat.com";

async function collectCookies() {
  const cookies = await chrome.cookies.getAll({ domain: DOMAIN });
  return cookies;
}

async function setCookies(cookies) {
  let ok = 0, fail = 0;
  const ordered = [...cookies].sort((a, b) => Number(a.hostOnly) - Number(b.hostOnly));
  for (const c of ordered) {
    const host = c.domain.startsWith(".") ? c.domain.slice(1) : c.domain;
    const url = "https://" + host + (c.path || "/");
    const details = {
      url,
      name: c.name,
      value: c.value,
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      storeId: c.storeId,
    };
    if (!c.hostOnly) details.domain = c.domain;
    if (c.expirationDate) details.expirationDate = c.expirationDate;
    const set = async (d) => {
      const r = await chrome.cookies.set(d);
      if (!r) throw new Error("rejected");
      return r;
    };
    try {
      await set(details);
      ok++;
    } catch (e) {
      try {
        await set({ ...details, sameSite: "lax" });
        ok++;
      } catch (e2) {
        try {
          await set({ ...details, sameSite: "no_restriction", secure: true });
          ok++;
        } catch (e3) {
          fail++;
          console.warn("cookie set failed:", c.name, c.domain, e3.message);
        }
      }
    }
  }
  return { ok, fail };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "COLLECT_COOKIES") {
      const cookies = await collectCookies();
      sendResponse({ cookies });
    } else if (msg.type === "SET_COOKIES") {
      const res = await setCookies(msg.cookies);
      sendResponse(res);
    }
  })();
  return true;
});
