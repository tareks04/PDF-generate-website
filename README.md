# PDF-generate-website

**Smart Page Library — Web Edition**

This repository contains the browser-based website conversion of the Android app in [tareks04/PDF-generate](https://github.com/tareks04/PDF-generate). The Android repository is separate and has not been modified.

## Website source

The complete website source is stored in `website-source.tar.gz`. It contains the static site files and the optional Node.js relay:

- `index.html`, `style.css`, `app.js`
- `manifest.webmanifest`, `sw.js`, `app-icon.svg`
- `relay/server.mjs`

To work on the source locally, download and extract `website-source.tar.gz` into a folder. The `index.html` file should be at the web server's document root after extraction.

## GitHub Pages

A GitHub Actions workflow extracts the source bundle and deploys the website. In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. Then push to `main` (or run the workflow manually from the Actions tab).

The website will be available at:

`https://tareks04.github.io/PDF-generate-website/`

## Features

- Bangla / English UI and light / dark themes.
- Physics, Chemistry and Biology; six papers and 56 chapter slots.
- Sequential image URL scanner with page-number detection, pause/resume, retry, and status classification.
- Chapter library with merge/replace, duplicate detection, rename, copy and TXT export.
- PDF generation with A4 Fit / Original Size, preview, print and download.
- JSON backup import/export compatible with Android `smart_page_library_backup` version 1.
- Browser-local storage and basic offline shell caching.
- Optional allowlist-based Node.js image relay for hosts that block browser CORS requests.

## Important limitations

- Library data is stored in the current browser's local storage; it is not synchronized across devices.
- Browser CORS cannot be bypassed from frontend JavaScript. Configure the optional relay only for image domains you trust.
- The relay must be deployed separately. Never configure it as an unrestricted open proxy.
- A PDF is not generated when any requested image fails validation; pages are never silently omitted.
