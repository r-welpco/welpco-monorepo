# PWA Setup & Testing

This app is set up as a [Progressive Web App (PWA)](https://nextjs.org/docs/app/guides/progressive-web-apps). Follow these steps to finish setup and test on your phone.

## 1. Add PWA icons

The manifest expects these files in `apps/web/public/`:

- `icon-192x192.png` (192×192 px)
- `icon-512x512.png` (512×512 px)

**Options:**

- **[realfavicongenerator.net](https://realfavicongenerator.net/)** — Upload your logo or `apps/web/public/favicon.ico`, then download the package and copy the PNGs into `public/`.
- **Export from SVG** — Use `apps/web/public/logos/Welpco_Isotype_Primary_Reg_128x128.svg` in Figma, Illustrator, or an online converter to export 192×192 and 512×512 PNGs.

Place the two PNGs in `apps/web/public/` with the exact names above.

## 2. Testing on your phone

PWAs require **HTTPS** (except `localhost` on some browsers). To test the install flow on your phone:

### Option A: Deployed URL (easiest)

1. Deploy the web app (e.g. Vercel, your staging URL).
2. On your phone, open **Chrome** (Android) or **Safari** (iOS) and go to `https://your-app-url.com`.
3. **Android (Chrome):** Use “Add to Home screen” from the menu (⋮) or the install banner if shown.
4. **iOS (Safari):** Tap the Share button (⎋) → “Add to Home Screen” (➕).

### Option B: Local dev over HTTPS (same network)

1. Start the dev server with HTTPS:
   ```bash
   cd apps/web && pnpm next dev --experimental-https -p 8081
   ```
2. Find your machine’s local IP (e.g. `192.168.1.10` on Mac: System Settings → Network).
3. On your phone (same Wi‑Fi), open `https://YOUR_IP:8081` (e.g. `https://192.168.1.10:8081`).
4. Accept the browser’s self-signed certificate warning (required for local HTTPS).
5. Use “Add to Home screen” (Android) or Share → “Add to Home Screen” (iOS) as above.

### Option C: Tunnel (e.g. ngrok)

1. Run the web app locally: `pnpm dev` (from monorepo root).
2. In another terminal: `ngrok http 8081` (or your web port).
3. Open the `https://….ngrok.io` URL on your phone and install as above.

## 3. Verify manifest

- Open `https://your-origin/manifest.webmanifest` (or your app URL). You should see the JSON manifest with `name`, `short_name`, `icons`, and `display: "standalone"`.
- In Chrome DevTools → Application → Manifest, check that the manifest loads and icons are valid.

## 4. Optional: Push notifications & service worker

For web push and offline support, see the [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) (steps 2–5): VAPID keys, `public/sw.js`, and Server Actions for subscription and sending notifications.
