import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function embedYouTubeVideos(html?: string | null): string {
  if (!html) return "";
  const ytRegex = /<p>(?:\s*<a[^>]*href=["'](?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})[^"']*["'][^>]*>.*?<\/a>\s*|\s*(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})[^\s<]*\s*)<\/p>/gi;

  return html.replace(ytRegex, (_, id1, id2) => {
    const videoId = id1 || id2;
    if (!videoId) return _;
    return `<div class="my-4 rounded-xl overflow-hidden border border-slate-200/80 shadow-md bg-black not-prose"><div class="px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300"><span>YouTube Video</span><a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" class="text-red-400 hover:text-red-300 font-semibold underline">Watch on YouTube ↗</a></div><div class="aspect-video w-full"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>`;
  });
}

