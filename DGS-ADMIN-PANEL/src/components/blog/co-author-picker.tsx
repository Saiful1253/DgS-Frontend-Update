"use client";

import React from "react";
import { X, BookOpen } from "lucide-react";
import { BlogAuthor, BlogCoAuthor } from "@/types/blog";
import AuthorSearch, { AuthorAvatar } from "./author-search";

interface CoAuthorPickerProps {
  authors: BlogAuthor[];
  coAuthors: BlogCoAuthor[];
  primaryAuthorName?: string;
  onAdd: (a: BlogAuthor) => void;
  onRemove: (idx: number) => void;
}

export default function CoAuthorPicker({
  authors,
  coAuthors,
  primaryAuthorName,
  onAdd,
  onRemove,
}: CoAuthorPickerProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <AuthorSearch
        authors={authors}
        multiple
        selected={null}
        primaryAuthorName={primaryAuthorName}
        checkedNames={coAuthors.map((c) => c.name)}
        onSelect={onAdd}
        placeholder="Type to search and add multiple co-authors..."
        emptyText="No matching authors. Use 'Add New Author' above to create one."
      />

      {coAuthors.length > 0 && (
        <div className="space-y-2">
          {coAuthors.map((c, i) => {
            const meta = authors.find(
              (a) => a.name.toLowerCase() === c.name.toLowerCase()
            );
            const designation = c.designation || meta?.designation;
            const bio = meta?.bio;
            const postsCount = meta?.posts_count;

            return (
              <div
                key={`${c.name}-${i}`}
                className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 shadow-2xs hover:border-slate-300 transition"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <AuthorAvatar
                    author={{ name: c.name, avatar_url: meta?.avatar_url }}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{c.name}</span>
                      {designation && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {designation}
                        </span>
                      )}
                      {Number(postsCount) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          <BookOpen className="w-2.5 h-2.5 text-slate-400" />
                          {postsCount} {postsCount === 1 ? "post" : "posts"}
                        </span>
                      )}
                    </div>
                    {bio ? (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                        {bio}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic mt-0.5">Co-author</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  title={`Remove ${c.name}`}
                  aria-label={`Remove ${c.name}`}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}