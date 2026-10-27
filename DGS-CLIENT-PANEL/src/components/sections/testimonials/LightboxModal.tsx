import React from "react";
import { X } from "lucide-react";

interface LightboxModalProps {
  imageUrl: string;
  onClose: () => void;
}

export default function LightboxModal({ imageUrl, onClose }: LightboxModalProps) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer z-10"
        aria-label="Close photo"
      >
        <X size={24} />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
      >
        <img
          src={imageUrl}
          alt="Enlarged review photo"
          className="max-h-[90vh] w-auto max-w-full object-contain"
        />
      </div>
    </div>
  );
}
