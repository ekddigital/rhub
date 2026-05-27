export const FFMPEG_REQUIRED_MESSAGE =
  "MP3 conversion requires ffmpeg on the server. Install ffmpeg (e.g. brew install ffmpeg) or choose Audio M4A instead.";

export const FFMPEG_INSTALL_HINT_DEV = "brew install ffmpeg";

export const FFMPEG_INSTALL_HINT_LINUX =
  "sudo apt-get install -y ffmpeg (on the Linux VPS)";

export const FFMPEG_INSTALL_HINT_TTYD =
  'Use "Install on server" above, or run sudo apt-get install -y ffmpeg on the VPS.';

export const YT_DLP_MISSING_CODE = "YT_DLP_MISSING";

export const YT_DLP_NOT_INSTALLED_MESSAGE =
  "yt-dlp is not installed or not available on the server.";

export const YT_DLP_INSTALL_HINT_DEV = "brew install yt-dlp";

export const YT_DLP_INSTALL_HINT_TTYD =
  'Use "Install on server" above to install yt-dlp on the VPS.';

export const YT_DLP_INSTALL_HINT_LINUX =
  "On the Linux VPS: configure TTYD_BASE_URL + TTYD_KEY in .env, then use Install on server — or install yt-dlp manually to ~/bin/yt-dlp.";

/** Repo-relative path shown in dev UI (not a public URL). */
export const YT_DLP_README_PATH = "src/lib/download-hub/README.md";
