function enhanceEmbedSrc(raw: string): string {
  const src = raw.trim();
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  const set = (u: URL, key: string, val: string) => u.searchParams.set(key, val);
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // ── YouTube → /embed/ with autoplay + mute ─────────────────
  if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
    let videoId = "";
    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/")[2] || "";
    } else if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") || "";
    }

    if (videoId) {
      const embed = new URL(`https://www.youtube.com/embed/${videoId}`);
      set(embed, "autoplay", "1");
      set(embed, "mute", "1");
      set(embed, "rel", "0");
      set(embed, "controls", "0");
      set(embed, "playsinline", "1");
      set(embed, "fs", "1");
      set(embed, "loop", "1");
      set(embed, "playlist", videoId);
      set(embed, "iv_load_policy", "3");
      set(embed, "modestbranding", "1");
      set(embed, "disablekb", "1");
      return embed.toString();
    }
    return src;
  }

  // ── Google Drive → /preview + autoplay ─────────────────────
  if (host === "drive.google.com") {
    const m = url.pathname.match(/^\/file\/d\/([\w-]+)/);
    let id = m ? m[1] : "";
    if (!id) {
      const openId = url.searchParams.get("id");
      if (/\/open/.test(url.pathname) && openId) id = openId;
    }
    if (id) {
      const prev = new URL(`https://drive.google.com/file/d/${id}/preview`);
      set(prev, "autoplay", "1");
      set(prev, "mute", "1");
      return prev.toString();
    }
  }

  return src;
}

export function normalizeBlogEmbedUrls(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/(src=["'])([^"']+)(["'])/g, (_m, a, src, c) => a + enhanceEmbedSrc(src) + c);
}