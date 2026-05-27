export const FFMPEG_REQUIRED_MESSAGE =
  "MP3 conversion requires ffmpeg on the runtime server. Install it on the VPS (Install on server or apt) or choose Audio M4A instead.";

export const FFMPEG_INSTALL_HINT_DEV =
  "Install ffmpeg on the VPS: use Install on server (API/UI) or sudo apt-get install -y ffmpeg.";

export const FFMPEG_INSTALL_HINT_LINUX =
  "sudo apt-get install -y ffmpeg (on the Linux VPS)";

export const FFMPEG_INSTALL_HINT_TTYD =
  'Use "Install on server" above, or run sudo apt-get install -y ffmpeg on the VPS.';

export const YT_DLP_MISSING_CODE = "YT_DLP_MISSING";

export const YT_DLP_NOT_INSTALLED_MESSAGE =
  "yt-dlp is not installed or not available on the server.";

export const YT_DLP_INSTALL_HINT_DEV =
  "Install yt-dlp on the VPS: use Install on server (API/UI) or place yt-dlp in ~/bin/yt-dlp.";

export const YT_DLP_INSTALL_HINT_TTYD =
  'Use "Install on server" above to install yt-dlp on the VPS.';

export const YT_DLP_INSTALL_HINT_LINUX =
  "On the Linux VPS: configure TTYD_BASE_URL + TTYD_KEY in .env, then use Install on server — or install yt-dlp manually to ~/bin/yt-dlp.";

/** Repo-relative path shown in dev UI (not a public URL). */
export const YT_DLP_README_PATH = "src/lib/download-hub/README.md";
