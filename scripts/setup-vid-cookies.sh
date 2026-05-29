#!/usr/bin/env bash
#
# setup-vid-cookies.sh — Upload a YouTube cookies file to the VPS so yt-dlp
# can bypass the "Sign in to confirm you're not a bot" wall.
#
# Usage:
#   ./scripts/setup-vid-cookies.sh /path/to/youtube.cookies.txt
#
# How to export the cookies file (do this in a browser logged in to YouTube):
#   1. Install the "Get cookies.txt LOCALLY" extension (Chrome/Edge/Firefox).
#   2. Open https://www.youtube.com (signed in).
#   3. Click the extension icon and export cookies for youtube.com in
#      Netscape format. Save the file locally.
#   4. Run this script with the saved file path.
#
# After upload, set this in the rhub deployment env (Vercel project settings
# or .env on the runtime host):
#
#   YT_DLP_COOKIES_FILE=/home/hetawk/.cookies/youtube.txt
#
# Refresh the cookies every few weeks; YouTube rotates session tokens.
#
set -euo pipefail

SSH_HOST="${VID_COOKIES_SSH_HOST:-hetawk@mail.es.ekddigital.com}"
SSH_PORT="${VID_COOKIES_SSH_PORT:-7722}"
REMOTE_DIR="${VID_COOKIES_REMOTE_DIR:-.cookies}"
REMOTE_FILE="${VID_COOKIES_REMOTE_FILE:-youtube.txt}"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/youtube.cookies.txt" >&2
  exit 1
fi

LOCAL_PATH="$1"

if [[ ! -f "$LOCAL_PATH" ]]; then
  echo "Error: file not found: $LOCAL_PATH" >&2
  exit 1
fi

if ! head -1 "$LOCAL_PATH" | grep -qiE '^# (HTTP Cookie File|Netscape HTTP Cookie File)'; then
  echo "Warning: $LOCAL_PATH does not look like a Netscape cookies.txt file." >&2
  echo "         The first line should start with '# Netscape HTTP Cookie File'." >&2
fi

echo "Uploading cookies to ${SSH_HOST}:~/${REMOTE_DIR}/${REMOTE_FILE} ..."

ssh -p "$SSH_PORT" "$SSH_HOST" "mkdir -p ~/${REMOTE_DIR} && chmod 700 ~/${REMOTE_DIR}"

scp -P "$SSH_PORT" "$LOCAL_PATH" "${SSH_HOST}:~/${REMOTE_DIR}/${REMOTE_FILE}"

ssh -p "$SSH_PORT" "$SSH_HOST" "chmod 600 ~/${REMOTE_DIR}/${REMOTE_FILE} && ls -l ~/${REMOTE_DIR}/${REMOTE_FILE}"

ABSOLUTE_REMOTE_PATH="$(ssh -p "$SSH_PORT" "$SSH_HOST" "echo \$HOME/${REMOTE_DIR}/${REMOTE_FILE}")"

cat <<MSG

Cookies uploaded successfully.

Set this environment variable on the rhub deployment (Vercel project settings
or .env on the runtime host), then redeploy / restart:

    YT_DLP_COOKIES_FILE=${ABSOLUTE_REMOTE_PATH}

Quick smoke test on the VPS:

    ssh -p ${SSH_PORT} ${SSH_HOST} \\
      "~/bin/yt-dlp --cookies ${ABSOLUTE_REMOTE_PATH} \\
        --no-warnings --dump-single-json --skip-download --no-playlist \\
        'https://youtu.be/4OjS0RiDAL8' | head -c 200"

If the JSON metadata prints (instead of the bot-check error), you're done.

MSG
