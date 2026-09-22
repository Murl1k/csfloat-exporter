# CSFloat Account Transfer

[Русский](README.md) · English

A Chrome extension that moves your CSFloat login from one browser profile to another. No second Steam sign-in.

Works with your own accounts only. Transfer what belongs to you.

<img src="screenshot.png" alt="Extension popup" width="360">

## Download

Grab `csfloat-exporter.zip` from the [latest release](https://github.com/Murl1k/csfloat-exporter/releases/latest) and unzip it, then follow the install steps below.

## Why

CSFloat keeps your login in two places: the `session` cookie (HttpOnly, so a plain page script cannot read it) and profile data in localStorage. A different profile needs both to pick up the login. The extension grabs both in one action and drops them back into the new profile.

## How it works

Export collects every cookie for the csfloat.com domain (HttpOnly included) through the `chrome.cookies` API, plus the full localStorage of the open tab. It hands that back as a single JSON, to a file or to the clipboard.

Import takes that JSON, sets the cookies while preserving every flag (HttpOnly, Secure, SameSite, Domain, expiry) and writes localStorage, then reloads the page. After that the tab is open under your account.

## Install in Chrome

Download `csfloat-exporter.zip` from the [latest release](https://github.com/Murl1k/csfloat-exporter/releases/latest) and unzip it. Then:

1. Open chrome://extensions
2. Turn on Developer mode (top-right toggle)
3. Click Load unpacked and point it at the unzipped folder
4. Pin the icon to the toolbar if you like

If you clone the repository instead, point Load unpacked at the repository folder directly, no archive needed.

Install it in both profiles: the one you copy from and the one you copy to.

After editing the code, hit the refresh button on the extension card so the changes are picked up.

## How to use

In the profile where you are already signed in:

1. Open a csfloat.com tab
2. Click the extension icon
3. Save to file or To clipboard

In the new profile:

1. Open a csfloat.com tab
2. Click the icon
3. From file or From clipboard

The page reloads under the transferred account on its own. The bottom of the popup reports how many cookies and localStorage entries were moved.

## Keep in mind

The session is temporary. Once the token expires, CSFloat asks for a Steam sign-in again, and without access to the Steam account itself you cannot log back in. A permanent handover needs Steam access.

Same computer is reliable. On another PC or another IP the session may drop if the server pins it to the address.

The export file holds a live session. Do not commit it and do not post it anywhere. It is already excluded in .gitignore.

## csfloat only

The domain is hardcoded in two places: `host_permissions` in manifest.json and the `DOMAIN` constant in background.js. Change both for a different site.

## License

MIT
