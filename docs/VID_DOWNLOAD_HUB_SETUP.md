# Download Hub (`/tools/vid`) — YouTube Bot-Block Mitigation & Server Setup

This document captures everything done to make the Download Hub work reliably
against YouTube's IP-level bot wall, and how the fix survives VPS reboots.
**All mitigations are free.** No paid services, no third-party API keys.

---

## 1. Problem

YouTube began returning the following for the rhub VPS IP across every
`player_client` (web, ios, mweb, tv, tv_embedded, web_safari, web_creator,
android_vr):

> Sign in to confirm you're not a bot. Use --cookies-from-browser or --cookies
> for the authentication.

This affected **metadata fetch** (`yt-dlp --dump-single-json`) as well as
downloads. URLs like `https://youtu.be/4OjS0RiDAL8` and any
`youtube.com/shorts/...` link failed identically.

Root cause: VPS shared-hosting IP got flagged. Cookies/PO Tokens alone do not
clear a heavily flagged IP. **The only durable, free fix is to change the
outbound IP** that yt-dlp uses when talking to YouTube.

---

## 2. Solution Overview (all free, all server-side)

| Layer            | Component                            | Role                                                    |
| ---------------- | ------------------------------------ | ------------------------------------------------------- |
| Outbound IP      | **Cloudflare WARP** (proxy mode)     | Routes yt-dlp through Cloudflare's edge → fresh IP      |
| Player tokens    | **bgutil PO Token provider**         | Supplies fresh PO Tokens to extend longevity            |
| Extractor        | **yt-dlp nightly**                   | Latest player-client + signature decryption             |
| App wiring       | `YT_DLP_PROXY` env var               | Tells yt-dlp to use WARP's SOCKS5 endpoint              |
| Process keepup   | **PM2** + `pm2-hetawk` systemd unit  | Resurrects bgutil-pot + models-static on reboot         |
| Network keepup   | `warp-svc` systemd unit, Always On   | Reconnects WARP on reboot, holds the tunnel forever     |

End-to-end verified working against the previously blocked
`https://youtu.be/4OjS0RiDAL8`.

---

## 3. Server-Side Setup (one-time, on VPS)

SSH target: `ssh -p 7722 hetawk@mail.es.ekddigital.com` (Ubuntu 24.04, Node
22.x, Python 3.12).

### 3.1 yt-dlp nightly

Stable yt-dlp lagged behind YouTube's extractor changes. Use nightly:

```bash
mkdir -p ~/bin
curl -fsSL https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp \
  -o ~/bin/yt-dlp
chmod +x ~/bin/yt-dlp
~/bin/yt-dlp --version   # e.g. 2026.05.25.234532
```

The rhub app picks this up via the `YT_DLP_BIN` env var (already set to
`/home/hetawk/bin/yt-dlp`).

### 3.2 Cloudflare WARP (proxy mode)

Free tier, no account needed. Registers anonymously.

```bash
# Add Cloudflare repo (Ubuntu 24.04 / noble)
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg \
  | sudo gpg --yes --dearmor -o /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ noble main" \
  | sudo tee /etc/apt/sources.list.d/cloudflare-client.list
sudo apt update
sudo apt install -y cloudflare-warp

# Register + switch to proxy mode on port 40000
warp-cli --accept-tos registration new
warp-cli mode proxy
warp-cli proxy port 40000
warp-cli connect

# Make persistent
warp-cli enable-always-on
sudo systemctl enable --now warp-svc
```

Verify:

```bash
warp-cli status                 # Status update: Connected
warp-cli settings | grep -E 'Mode|Port|Always'
# Mode: WarpProxy
# Port: 40000
# Always On: true
systemctl is-enabled warp-svc   # enabled
```

### 3.3 bgutil PO Token provider (helps token longevity)

```bash
# Plugin (yt-dlp side)
mkdir -p ~/.config/yt-dlp/plugins
curl -fsSL -o ~/.config/yt-dlp/plugins/bgutil-ytdlp-pot-provider.zip \
  https://github.com/Brainicism/bgutil-ytdlp-pot-provider/releases/latest/download/bgutil-ytdlp-pot-provider.zip

# Companion HTTP server
git clone https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git ~/bgutil-ytdlp-pot-provider
cd ~/bgutil-ytdlp-pot-provider/server
npm ci
npx tsc

# Run under PM2 on port 4416
pm2 start build/main.js --name bgutil-pot -- --port 4416
pm2 save
```

Verify the plugin is loaded by yt-dlp:

```bash
~/bin/yt-dlp -v 2>&1 | head | grep bgutil
# [debug] Loaded provider: bgutil:http-1.3.1 (external)
curl -fsS http://127.0.0.1:4416/ping
# {"server_uptime": ..., "version":"1.3.1"}
```

### 3.4 models-static (existing, unrelated, restored)

Static file server for `~/models/` on `0.0.0.0:8181`, used by other lab work.
Restored after a `pm2 update` step accidentally cleared the dump:

```bash
pm2 serve /home/hetawk/models 8181 --name models-static
pm2 save --force
```

### 3.5 PM2 boot persistence

Already established:

```bash
pm2 startup systemd -u hetawk --hp /home/hetawk     # one-time
systemctl is-enabled pm2-hetawk   # enabled
cat ~/.pm2/dump.pm2                # contains bgutil-pot + models-static
```

On every change: `pm2 save --force` so the dump matches live state.

---

## 4. Application Wiring (rhub)

### 4.1 Code support (already merged)

- `src/lib/download-hub/yt-dlp.ts`
  - `resolveYtDlpProxy()` reads `YT_DLP_PROXY` / `YTDLP_PROXY`.
  - `baseYtDlpArgs()` prepends `--proxy <url>` when set, and `--cookies <file>`
    when `YT_DLP_COOKIES_FILE` / `YTDLP_COOKIES` / `YT_DLP_COOKIES` is set.
  - `extractorArgsForUrl()` chooses safe player clients per host.
  - `normalizeYouTubeUrl()` rewrites `/shorts/<id>` and `youtu.be/<id>` to
    canonical `watch?v=<id>`.
- `src/lib/download-hub/yt-dlp-errors.ts`: actionable `bot_check` message that
  references `scripts/setup-vid-cookies.sh` as a fallback.
- `src/components/tools/vid/video-downloader.tsx`: Analyze no longer blocks on
  health polling — it polls in the background and surfaces a "Try again" button.

### 4.2 Required environment variables

Set these in **EKD Digital Launchpad** (not Vercel) for the rhub project:

| Variable             | Value                              | Required | Purpose                                 |
| -------------------- | ---------------------------------- | -------- | --------------------------------------- |
| `YT_DLP_PROXY`       | `socks5://127.0.0.1:40000`         | **Yes**  | Route yt-dlp through WARP               |
| `YT_DLP_BIN`         | `/home/hetawk/bin/yt-dlp`          | Yes      | Use nightly binary                      |
| `FFMPEG_BIN`         | (existing)                         | Yes      | Merging streams                         |
| `TTYD_BASE_URL`      | (existing)                         | Yes      | Remote terminal API                     |
| `TTYD_KEY`           | (existing)                         | Yes      | Auth                                    |
| `YT_DLP_COOKIES_FILE`| `/home/hetawk/.cookies/youtube.txt`| Optional | Fallback if WARP IP ever gets flagged   |

After updating env vars, redeploy rhub from Launchpad.

---

## 5. Verification

Run after deploys or VPS reboots:

```bash
# Outbound proxy alive
warp-cli status
warp-cli settings | grep -E 'Mode|Port|Always'

# Companion services online
pm2 status
curl -fsS http://127.0.0.1:4416/ping
curl -fsSI http://127.0.0.1:8181/2026/llmshield_distilbert.json | head -1

# End-to-end metadata fetch against a previously-blocked URL
~/bin/yt-dlp --proxy socks5://127.0.0.1:40000 \
  --dump-single-json --skip-download --no-playlist \
  'https://youtu.be/4OjS0RiDAL8' | head -c 200

# Boot-time persistence
systemctl is-enabled warp-svc pm2-hetawk
python3 -c "import json; [print(p['name']) for p in json.load(open('/home/hetawk/.pm2/dump.pm2'))]"
# bgutil-pot
# models-static
```

---

## 6. Persistence Summary

On VPS reboot, the chain resurrects automatically:

1. `systemd` starts `warp-svc` → WARP daemon up.
2. WARP `Always On: true` reconnects the tunnel → port 40000 listening again.
3. `systemd` starts `pm2-hetawk` → PM2 daemon up.
4. `pm2-hetawk` calls `pm2 resurrect` against `~/.pm2/dump.pm2` → starts
   `bgutil-pot` (4416) and `models-static` (8181).
5. rhub container (next deploy) picks up `YT_DLP_PROXY=socks5://127.0.0.1:40000`
   and routes all yt-dlp traffic through WARP.

No laptop / local-machine dependency — the entire fix lives on the VPS.

---

## 7. Maintenance & Fallbacks

- **Refresh yt-dlp**: use the in-app "Install on server" button in `/tools/vid`,
  or `~/bin/yt-dlp -U` on the VPS, or re-run the nightly curl in §3.1.
- **WARP IP gets flagged later** (unlikely, but possible):
  - `warp-cli disconnect && warp-cli connect` to rotate.
  - Or fall back to cookies: run `scripts/setup-vid-cookies.sh` from a local
    machine where you're signed into YouTube, then set
    `YT_DLP_COOKIES_FILE=/home/hetawk/.cookies/youtube.txt` on Launchpad.
- **bgutil-pot stops**: `pm2 restart bgutil-pot`; check
  `pm2 logs bgutil-pot --lines 30`.
- **After any PM2 process add/remove**: always
  `pm2 save --force` so reboots stay in sync.
- **Never run** `pm2 update` without first confirming `~/.pm2/dump.pm2`
  contains every process you care about — it drops live processes during the
  in-place upgrade. (Lesson learned this session: `models-static` had to be
  manually restored after a `pm2 update`.)

---

## 8. Quick Reference

```bash
# SSH
ssh -p 7722 hetawk@mail.es.ekddigital.com

# WARP
warp-cli status
warp-cli settings
sudo systemctl restart warp-svc

# PM2
pm2 status
pm2 save --force
pm2 logs bgutil-pot --lines 50

# yt-dlp through WARP
~/bin/yt-dlp --proxy socks5://127.0.0.1:40000 -F 'https://youtu.be/<id>'
```
