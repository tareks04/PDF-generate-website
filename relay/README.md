# Cloudflare image relay setup

The GitHub Pages website runs entirely in the browser. It cannot read image bytes from a third-party host unless that host permits CORS. The Worker in this folder performs the fetch server-side and returns only validated JPEG bytes.

## 1. Create the Worker

1. Sign in to Cloudflare Dashboard.
2. Open **Workers & Pages** → **Create** → **Create Worker**.
3. Give it a name such as `pdf-generate-image-relay` and deploy the starter.
4. Open the Worker → **Edit code**.
5. Replace the starter code with all contents of this repository's `relay/worker.js`.
6. Save and deploy.

The Worker URL will look like:

`https://pdf-generate-image-relay.<your-subdomain>.workers.dev`

## 2. Set the allowlist variables

In the Worker settings, add these **Variables and Secrets** (plain text variables; no secrets are needed):

- `ALLOWED_DOMAINS` (required): comma-separated exact hostnames that contain your book images. Example: `ai-data.udvash-unmesh.com,cdn.example.org`. Do not include `https://`, paths, wildcards, or broad public suffixes. A listed domain also permits its subdomains.
- `ALLOWED_ORIGINS` (optional): comma-separated exact browser origins allowed to call this Worker. The default is `https://tareks04.github.io`. Keep that default for this GitHub Pages site unless you use a custom domain.

Save the variables and **Deploy** the Worker again. If the image host redirects to a CDN, add that CDN hostname to `ALLOWED_DOMAINS` too.

## 3. Test the Worker

Open:

`https://<your-worker>.workers.dev/health`

It should return:

`{"ok":true,"service":"Smart Page Library image relay"}`

The website Settings page also has a **Test Relay** button. It checks the health endpoint from the browser and verifies CORS is configured.

## 4. Connect it to the website

1. Open [PDF-generate-website](https://tareks04.github.io/PDF-generate-website/).
2. Go to **Settings**.
3. Paste your Worker URL into **Optional Relay Endpoint URL** (trailing slash is optional).
4. Save settings and click **Test Relay**.
5. Retry the scanner.

The website appends `?url=<encoded image URL>` to this endpoint.

## Security notes

- This Worker is intentionally **not an open proxy**. It rejects all image hosts unless they match `ALLOWED_DOMAINS`.
- It rejects IP-literal, localhost and local-network hostnames, and re-validates every redirect target against the same allowlist.
- It does not forward browser cookies or authorization headers.
- It limits image responses to 25 MB and requires JPEG magic bytes (`FF D8 FF`).
- Do not set `ALLOWED_DOMAINS` to broad domains such as `com`, `net`, `github.io`, or `udvash-unmesh.com` unless every subdomain is trusted. Prefer the exact hostname used by the image URL.
- The relay only fixes browser CORS access. It cannot make a private, password-protected, expired, blocked, or unavailable upstream image public.
