import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const filename = slug ? slug[slug.length - 1] : "service";
  const cleanName = filename.replace(/\.svg$/, "").replace(/[^a-zA-Z0-9_-]/g, "");
  const label = cleanName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" fill="none">
  <defs>
    <linearGradient id="g_${cleanName}" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00668a" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0072b2" stop-opacity="0.04"/>
    </linearGradient>
    <linearGradient id="b_${cleanName}" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0072b2"/>
      <stop offset="100%" stop-color="#004d66"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="16" fill="url(#g_${cleanName})"/>
  <rect x="0.75" y="0.75" width="78.5" height="78.5" rx="15.25" stroke="#0072b2" stroke-opacity="0.2" stroke-width="1.5"/>
  <circle cx="40" cy="36" r="18" fill="white" fill-opacity="0.85"/>
  <path d="M30 42L36 30L44 42M33 38H41M47 30V42M50 36H45" stroke="url(#b_${cleanName})" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="40" y="66" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="700" fill="#004d66">${label.length > 13 ? label.slice(0, 12) + "…" : label}</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
