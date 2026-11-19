# PDF-generate-website

**Smart Page Library — Web Edition**

A browser-based web edition of the Android app in [tareks04/PDF-generate](https://github.com/tareks04/PDF-generate). The Android repository is separate and has not been modified.

## Live website

https://tareks04.github.io/PDF-generate-website/

## Features

- Bangla / English interface labels and Light / Dark theme.
- Physics, Chemistry and Biology: six papers and 56 chapter slots.
- Automatic page-number detection from an image URL.
- Sequential URL scan with pause, resume, stop, 404 / 410 retry, and status classification.
- Chapter library with Merge / Replace, rename, duplicate protection, link copying, deletion, and TXT export.
- PDF generation in A4 Fit or Original Size, with preview, print, and download.
- JSON backup import/export compatible with Android `smart_page_library_backup` version 1.
- Browser Local Storage for the library.

## Fixing "Failed to fetch" / CORS errors

GitHub Pages is a static frontend. It cannot read image bytes from a third-party host unless that host permits CORS. Deploy the allowlist-based Cloudflare Worker in [relay/worker.js](relay/worker.js), then follow the [relay setup guide](relay/README.md).

Once deployed, paste the Worker URL into **Website → Settings → Optional Relay Endpoint URL**, save it, and click **Test Relay**. Add each image hostname (and any redirect/CDN hostname) to the Worker variable `ALLOWED_DOMAINS`. The default allowed browser origin is `https://tareks04.github.io`.

## GitHub Pages deployment

The repository includes a GitHub Actions workflow at `.github/workflows/static.yml`. GitHub Pages should use **GitHub Actions** as its deployment source. Each push to `main` deploys `index.html` from the repository root.

## Important limitations

- Library data is stored in the current browser's Local Storage. It does not automatically synchronize across devices or browsers. Use JSON backup to move data.
- The relay only fetches hostnames explicitly listed in its allowlist; it is not an unrestricted public proxy.
- The relay cannot make private, password-protected, expired, unavailable, or otherwise blocked upstream images accessible.
- PDF generation uses the PDF-Lib browser build from jsDelivr, so an internet connection is needed to load that library.
- PDF generation stops on the first page-fetch or validation failure. It will not silently omit failed pages.
- This is a standalone web implementation; Android-only native print and file picker APIs are replaced with browser download, preview, and print workflows.
