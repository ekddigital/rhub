# Download Hub — server dependencies

The Download Hub (`/tools/vid`) uses **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** as the unified extractor for YouTube, Facebook, Instagram, TikTok, X (Twitter), and Vimeo.

## Quick install (recommended)

Uses the same **TTYD terminal API** as document conversion (`src/lib/terminal/client.ts` → `executeRemoteCommand`). No manual SSH.

1. Set `TTYD_BASE_URL` and `TTYD_KEY` in `.env` (same vars as doc/LaTeX admin features).
2. In the Download Hub UI, click **Install on server (via terminal)**, or:

   ```bash
   curl -X POST http://localhost:3000/api/tools/vid/setup
   # Production: Authorization: Bearer $ADMIN_API_KEY
   ```

   Commands run on the **TTYD target host** via `POST /api/ttyd/execute` (HTTP — no WebSocket layer).

3. **Verify:**

   ```bash
   curl -s http://127.0.0.1:3000/api/tools/vid/setup   # GET — remote + local status
   curl -s http://127.0.0.1:3000/api/tools/vid/health | jq .
   ```

### Fallback: shell script on the VPS

If the API is unavailable, run on the Linux host (browser ttyd or an existing shell session):

```bash
bash scripts/download-hub/install-server-deps.sh
```

This installs yt-dlp to `~/bin/yt-dlp` and ffmpeg via `apt-get`.

## Production deploy checklist

1. **Configure TTYD** in production `.env`:

   ```bash
   TTYD_BASE_URL="https://ttyd.ekddigital.com"
   TTYD_KEY="api_…"
   ADMIN_API_KEY="…"   # optional; without it, setup only works from localhost
   ```

2. **Install dependencies** on the TTYD host:

   ```bash
   curl -X POST https://your-rhub-host/api/tools/vid/setup \
     -H "Authorization: Bearer $ADMIN_API_KEY"
   ```

3. **Set binary paths** if not on default PATH (restart Next.js after):

   ```bash
   YT_DLP_BIN=/home/hetawk/bin/yt-dlp
   FFMPEG_BIN=/usr/bin/ffmpeg
   ```

4. **Smoke test:**

   ```bash
   curl -s http://127.0.0.1:3000/api/tools/vid/health | jq .
   ```

## TTYD host must match the Node host

`executeRemoteCommand` installs on whatever machine `TTYD_BASE_URL` points at. `yt-dlp`/`ffmpeg` are **spawned locally** by the Next.js process.

| Setup                                        | Result                                                                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| rhub on **production VPS**, TTYD → same VPS  | Install + health both work                                                                                                                   |
| rhub on **Mac (dev)**, TTYD → production VPS | Remote install can succeed, but downloads still run from the local Next.js host. Use production rhub on the VPS for real download execution. |
| TTYD → wrong VPS                             | Point TTYD at the host where rhub/Node runs                                                                                                  |

Set `YT_DLP_BIN` / `FFMPEG_BIN` after install if binaries are not on default PATH.

## yt-dlp binary resolution

The server resolves, in order:

1. `YT_DLP_BIN` / `YTDLP_BIN` env var
2. `~/bin/yt-dlp`, `/opt/homebrew/bin/yt-dlp`, `/usr/local/bin/yt-dlp`, `/usr/bin/yt-dlp`

Install via TTYD API or set `YT_DLP_BIN` to a server path.

Check dependencies: `GET /api/tools/vid/health` → `{ ytDlp, ffmpeg, paths, hints, ttydConfigured, terminalUrl }`.

Install via API: `POST /api/tools/vid/setup` (localhost or `ADMIN_API_KEY`).

## Dependencies

| Tool       | Required? | Role                                                                   |
| ---------- | --------- | ---------------------------------------------------------------------- |
| **yt-dlp** | Yes       | Metadata + all downloads                                               |
| **ffmpeg** | For MP3   | Converts best audio to `.mp3` via `--extract-audio --audio-format mp3` |

MP3 downloads **fail with a clear error** when ffmpeg is missing — they do not silently serve M4A/WebM labeled as MP3.

## Session API (watch pages)

| Method | Path                                                 | Description                                                                          |
| ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET`  | `/api/tools/vid/health`                              | Dependency check; optional auto-install if `DOWNLOAD_HUB_AUTO_INSTALL_VIA_TTYD=true` |
| `GET`  | `/api/tools/vid/setup`                               | Remote + local dependency status                                                     |
| `POST` | `/api/tools/vid/setup`                               | Install yt-dlp + ffmpeg on TTYD host (admin/localhost auth)                          |
| `POST` | `/api/tools/vid/info`                                | Body `{ url }` → creates session, returns `{ id, formats[], ... }`                   |
| `GET`  | `/api/tools/vid/info/[id]`                           | Load cached session metadata                                                         |
| `POST` | `/api/tools/vid/download`                            | Body `{ sessionId, formatOptionId }` → file stream                                   |
| `GET`  | `/api/tools/vid/download?sessionId=&formatOptionId=` | Same as POST download                                                                |

Watch page route: `/tools/vid/{platform}/v/{sessionId}` (e.g. `/tools/vid/yt/v/abc123xyz`).

Sessions are stored in memory with a **45-minute TTL** (`VID_SESSION_TTL_MS` to override).

## Environment variables

| Variable                                                   | Description                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `TTYD_BASE_URL` / `TTYD_KEY`                               | Remote terminal API (required for programmatic server install; same as doc conversion) |
| `DOWNLOAD_HUB_AUTO_INSTALL_VIA_TTYD`                       | If `true`, `GET /api/tools/vid/health` runs install when deps missing (default: off)   |
| `NEXT_PUBLIC_SERVER_TERMINAL_URL`                          | Optional browser ttyd link in the health banner                                        |
| `VID_SESSION_TTL_MS`                                       | Session cache TTL in ms (default: 2700000)                                             |
| `YT_DLP_BIN` / `YTDLP_BIN`                                 | Path to `yt-dlp` executable (preferred over auto-download)                             |
| `FFMPEG_BIN`                                               | Path to ffmpeg if not on PATH                                                          |
| `ADMIN_API_KEY`                                            | Protects `POST /api/tools/vid/setup` in production                                     |
| `YT_DLP_COOKIES_FILE` / `YTDLP_COOKIES` / `YT_DLP_COOKIES` | Netscape cookies file for login-only content                                           |
| `YT_DLP_MAX_BYTES`                                         | Max download size in bytes (default: 500MB)                                            |
| `YT_DLP_INFO_TIMEOUT_MS`                                   | Metadata timeout (default: 60000)                                                      |
| `YT_DLP_FB_INFO_TIMEOUT_MS`                                | Facebook metadata timeout (default: 90000)                                             |
| `YT_DLP_DOWNLOAD_TIMEOUT_MS`                               | Download timeout (default: 180000)                                                     |
| `YT_DLP_SOCKET_TIMEOUT_SEC`                                | Per-request socket timeout (default: 15)                                               |

## Example URLs per platform

| Platform        | Examples                                                               |
| --------------- | ---------------------------------------------------------------------- |
| **YouTube**     | `https://www.youtube.com/watch?v=…`, `https://youtu.be/…`, `/shorts/…` |
| **Facebook**    | `facebook.com/watch?v=…`, `/reel/…`, `/share/v/…`, `fb.watch/…`        |
| **Instagram**   | `/reel/…`, `/p/…`, `/tv/…`, `/stories/user/id` (login may be required) |
| **TikTok**      | `tiktok.com/@user/video/…`, `vm.tiktok.com/…`, `vt.tiktok.com/…`       |
| **X (Twitter)** | `x.com/user/status/…`, `twitter.com/…/status/…`                        |
| **Vimeo**       | `vimeo.com/123456789`                                                  |

## Error messages (UI)

The API maps yt-dlp stderr to user-facing messages:

- **Private video** — only when stderr explicitly says the video is private
- **Bot check** — YouTube datacenter/VPS blocks (not the same as private)
- **Login/cookies** — Instagram stories, age gates, etc.
- **Timeout (504)** — slow Facebook share links; retry or use watch/reel URL
- **503** — yt-dlp or ffmpeg missing (`GET /api/tools/vid/health`)

## Notes

- **Private / geo-blocked** content returns a clear error in the UI; use `YT_DLP_COOKIES_FILE` when you legitimately need authenticated access.
- **Instagram stories** often require cookies; without them, yt-dlp may report login required.
- **MP3** requires ffmpeg; the format picker shows a hint when ffmpeg is unavailable on the server.
