/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (content: string, delta: any) => void;
  placeholder?: string;
  className?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }, "blockquote"],
    ["link", "image", "video"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "link",
  "image",
  "video",
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something amazing...",
  className,
}: RichTextEditorProps) {
  return (
    <div className={className}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={(content, delta, source, editor) => {
          onChange(content, editor.getContents());
        }}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white rounded-xl overflow-hidden border-none"
      />
      <style jsx global>{`
        .ql-editor iframe.ql-video {
          width: 100% !important;
          aspect-ratio: 16 / 9 !important;
          height: auto !important;
          min-height: 280px;
          border-radius: 0.75rem;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}
