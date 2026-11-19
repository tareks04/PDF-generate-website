# PDF-generate-website

**Smart Page Library — Web Edition**

A browser-based web edition of the Android app in [tareks04/PDF-generate](https://github.com/tareks04/PDF-generate). The Android repository is separate and has not been modified.

## Live website

After GitHub Pages deployment, the website URL is:

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

## GitHub Pages deployment

The repository includes `.github/workflows/pages.yml`. In **Settings → Pages**, choose **GitHub Actions** as the source. Each push to `main` (or a manual workflow run) deploys `index.html` from the repository root.

## Important limitations

- Library data is stored in the current browser's Local Storage. It does not automatically synchronize across devices or browsers. Use JSON backup to move data.
- Browser CORS rules can block requests to image hosts. A relay endpoint can be configured in Settings, but you must deploy and secure that relay separately. It should allow only trusted image domains; do not use an unrestricted open proxy.
- PDF generation uses the PDF-Lib browser build from jsDelivr, so an internet connection is needed to load that library.
- The generated PDF stops on the first page-fetch or validation failure. It will not silently omit failed pages.
- This is a standalone web implementation; Android-only native print and file picker APIs have been replaced with browser download, preview and print workflows.
