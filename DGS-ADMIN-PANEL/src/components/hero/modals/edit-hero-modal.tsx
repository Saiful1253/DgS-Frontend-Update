/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical, RefreshCcw, Eye, EyeOff, Youtube, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HeroSection, HeroImageOps } from "@/types/hero";
import { heroSectionSchema } from "@/zod/hero.validation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface EditHeroModalProps {
  hero: HeroSection;
  onSave: (heroData: any, imageOps: HeroImageOps) => Promise<boolean>;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function EditHeroModal({ hero, onSave, trigger, disabled = false }: EditHeroModalProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [headline, setHeadline] = useState(hero.headline || "");
  const [subHeadline, setSubHeadline] = useState(hero.sub_headline || "");
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState(hero.primary_cta_label || "");
  const [primaryCtaLink, setPrimaryCtaLink] = useState(hero.primary_cta_link || "");
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState(hero.secondary_cta_label || "");
  const [secondaryCtaLink, setSecondaryCtaLink] = useState(hero.secondary_cta_link || "");
  const [status, setStatus] = useState<"active" | "inactive" | "draft">(hero.status === "active" ? "active" : hero.status === "inactive" ? "inactive" : "draft");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Unified Media State (Existing + New)
  const [visualMedia, setVisualMedia] = useState<any[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<(string | number)[]>([]);
  const [imagesToReplace, setImagesToReplace] = useState<{ id: string | number; file: File; previewUrl: string; is_active: boolean }[]>([]);
  const [imagesToAdd, setImagesToAdd] = useState<{ tempId: string; file: File; previewUrl: string; is_active: boolean }[]>([]);
  const [videosToAdd, setVideosToAdd] = useState<{ tempId: string; media_url: string; is_active: boolean }[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingMediaId, setReplacingMediaId] = useState<string | number | null>(null);

  useEffect(() => {
    if (open) {
      setHeadline(hero.headline || "");
      setSubHeadline(hero.sub_headline || "");
      setPrimaryCtaLabel(hero.primary_cta_label || "");
      setPrimaryCtaLink(hero.primary_cta_link || "");
      setSecondaryCtaLabel(hero.secondary_cta_label || "");
      setSecondaryCtaLink(hero.secondary_cta_link || "");
      setStatus(hero.status === "active" ? "active" : hero.status === "inactive" ? "inactive" : "draft");
      setVisualMedia(hero.media.sort((a: any, b: any) => a.sort_order - b.sort_order));
      setImagesToDelete([]);
      setImagesToReplace([]);
      setImagesToAdd([]);
      setVideosToAdd([]);
      setYoutubeUrl("");
      setYoutubeError("");
      setErrors({});
    }

    return () => {
      visualMedia.forEach(m => {
        if (m.previewUrl && m.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(m.previewUrl);
        }
      });
    };
  }, [open, hero]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleAddImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} exceeds 5MB limit.`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    const newAdded = validFiles.map(file => ({
      tempId: `new-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      is_active: true
    }));
    setImagesToAdd(prev => [...prev, ...newAdded]);
    setVisualMedia(prev => [...prev, ...newAdded]);
  };

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,12})/);
    return m ? m[1] : null;
  };

  const handleAddYouTube = () => {
    const rawInput = youtubeUrl.trim();
    if (!rawInput) {
      setYoutubeError("Paste a YouTube link first");
      return;
    }
    const vId = extractYouTubeId(rawInput);
    if (!vId) {
      setYoutubeError("Invalid video URL. USAGE: watch?v= | youtu.be | /embed/ | /shorts/ | <iframe>");
      return;
    }
    setYoutubeError("");
    const cleanUrl = `https://www.youtube.com/watch?v=${vId}`;
    const item = {
      tempId: `yt-${crypto.randomUUID()}`,
      media_type: "youtube",
      media_url: cleanUrl,
      youtubeId: vId,
      is_active: true,
      previewUrl: `https://img.youtube.com/vi/${vId}/maxresdefault.jpg`,
    };
    setVideosToAdd(prev => [...prev, { tempId: item.tempId, media_url: cleanUrl, is_active: true }]);
    setVisualMedia(prev => [...prev, item]);
    setYoutubeUrl("");
  };

  const handleToggleMediaStatus = (id: string | number) => {
    setVisualMedia(prev => prev.map(m => {
      const isMatch = (m.id || m.tempId) === id;
      if (isMatch) {
        const newStatus = !m.is_active;

        setImagesToReplace(replaces => replaces.map(r => r.id === id ? { ...r, is_active: newStatus } : r));
        setImagesToAdd(adds => adds.map(a => a.tempId === id ? { ...a, is_active: newStatus } : a));
        setVideosToAdd(videos => videos.map(v => v.tempId === id ? { ...v, is_active: newStatus } : v));

        return { ...m, is_active: newStatus };
      }
      return m;
    }));
  };

  const handleReplaceClick = (id: string | number) => {
    setReplacingMediaId(id);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = (files: FileList | null) => {
    if (!files || files.length === 0 || !replacingMediaId) return;
    const file = files[0];
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File ${file.name} exceeds 5MB limit.`);
      setReplacingMediaId(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);

    setImagesToReplace(prev => {
      const filtered = prev.filter(r => r.id !== replacingMediaId);
      const currentMedia = visualMedia.find(m => (m.id || m.tempId) === replacingMediaId);
      return [...filtered, { id: replacingMediaId, file, previewUrl, is_active: currentMedia?.is_active ?? true }];
    });

    setVisualMedia(prev => prev.map(m => {
      if ((m.id || m.tempId) === replacingMediaId) {
        return { ...m, previewUrl, media_url: previewUrl, isReplaced: true };
      }
      return m;
    }));
    setReplacingMediaId(null);
  };

  const handleDelete = (id: string | number, isNew: boolean) => {
    if (isNew) {
      setImagesToAdd(prev => prev.filter(img => img.tempId !== id));
      setVideosToAdd(prev => prev.filter(v => v.tempId !== id));
    } else {
      setImagesToDelete(prev => [...prev, id]);
    }
    setVisualMedia(prev => prev.filter(m => (m.id || m.tempId) !== id));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setVisualMedia((items) => {
        const oldIndex = items.findIndex((i) => (i.id || i.tempId) === active.id);
        const newIndex = items.findIndex((i) => (i.id || i.tempId) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setErrors({});
    const payload = { headline, sub_headline: subHeadline, primary_cta_label: primaryCtaLabel, primary_cta_link: primaryCtaLink, secondary_cta_label: secondaryCtaLabel, secondary_cta_link: secondaryCtaLink, status };
    const parsed = heroSectionSchema.safeParse(payload);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])));
      return;
    }

    if (visualMedia.length === 0) {
      toast.error("hero section must have at least one media asset");
      return;
    }

    setSubmitting(true);
    try {
      const imageOps: HeroImageOps = {
        imagesToDelete,
        imagesToReplace: imagesToReplace.map(r => ({ id: r.id, file: r.file, is_active: r.is_active })),
        imagesToAdd: imagesToAdd.filter(img => visualMedia.some(m => m.tempId === img.tempId)).map(i => ({ tempId: i.tempId, file: i.file, is_active: i.is_active })),
        videosToAdd: videosToAdd.filter(v => visualMedia.some(m => m.tempId === v.tempId)),
        newOrder: visualMedia.map(m => ({ id: m.id || m.tempId, is_active: m.is_active }))
      };
      const success = await onSave(parsed.data, imageOps);
      if (success) {
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !disabled && handleOpenChange(v)}>
      <DialogTrigger asChild>
        {trigger && React.isValidElement(trigger) ? React.cloneElement(trigger as any, { disabled }) : trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Hero Section</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">Hero Media Assets :</label>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => handleAddImages(e.target.files)} />
              <input type="file" accept="image/*" className="hidden" ref={replaceInputRef} onChange={(e) => handleReplaceFile(e.target.files)} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Image(s)
              </button>
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <Input
                  value={youtubeUrl}
                  onChange={(e) => { setYoutubeUrl(e.target.value); setYoutubeError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddYouTube(); } }}
                  placeholder="Paste YouTube link (watch?v= / youtu.be / embed / shorts)"
                  className="flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddYouTube}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                  Add Video
                </button>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-slate-400">
              Photo expected — JPG / PNG / WebP etc., max 5MB per image, up to 10 images per upload.
            </p>
            {youtubeError && <p className="text-[10px] font-bold text-red-500">{youtubeError}</p>}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visualMedia.map(m => m.id || m.tempId)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {visualMedia.map((media, idx) => (
                    <SortableItem
                      key={media.id || media.tempId}
                      media={media}
                      index={idx}
                      onDelete={() => handleDelete(media.id || media.tempId, !!media.tempId)}
                      onReplace={() => handleReplaceClick(media.id || media.tempId)}
                      onToggleStatus={() => handleToggleMediaStatus(media.id || media.tempId)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold">Headline :</label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className={errors.headline ? "border-red-500" : ""} />
            {errors.headline && <p className="text-[10px] font-bold text-red-500">{errors.headline}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold">Sub-headline / Intro Text :</label>
            <Input value={subHeadline} onChange={(e) => setSubHeadline(e.target.value)} className={errors.sub_headline ? "border-red-500" : ""} />
            {errors.sub_headline && <p className="text-[10px] font-bold text-red-500">{errors.sub_headline}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold">Primary CTA Label :</label>
              <Input value={primaryCtaLabel} onChange={(e) => setPrimaryCtaLabel(e.target.value)} className={errors.primary_cta_label ? "border-red-500" : ""} />
              {errors.primary_cta_label && <p className="text-[10px] font-bold text-red-500">{errors.primary_cta_label}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Primary CTA Link :</label>
              <Input value={primaryCtaLink} onChange={(e) => setPrimaryCtaLink(e.target.value)} className={errors.primary_cta_link ? "border-red-500" : ""} />
              {errors.primary_cta_link && <p className="text-[10px] font-bold text-red-500">{errors.primary_cta_link}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Secondary CTA Label (optional) :</label>
              <Input value={secondaryCtaLabel} onChange={(e) => setSecondaryCtaLabel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Secondary CTA Link (optional) :</label>
              <Input value={secondaryCtaLink} onChange={(e) => setSecondaryCtaLink(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">Status :</label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "active" | "inactive" | "draft")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="active">Active (Exclusive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-primary" />
                Publishing Rule :
              </label>
              <div className="h-9 px-3 rounded-md border border-slate-200 bg-slate-50 flex items-center text-xs text-slate-600 shadow-2xs">
                <p className="text-[11px] leading-snug text-slate-600 truncate">
                  <span className="font-semibold text-slate-900">Active</span> publishes this variant & deactivates others.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={submitting} className="bg-primary text-white hover:bg-primary/90 font-semibold">
            {submitting ? "Updating..." : "Update Hero Section"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SortableItemProps {
  media: any;
  index: number;
  onDelete: () => void;
  onReplace: () => void;
  onToggleStatus: () => void;
}

const resolveVideoPoster = (media: any): string | null => {
  if (media.previewUrl) return media.previewUrl;
  const url = media.media_url || "";
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,12})/);
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/maxresdefault.jpg`;
  return null;
};

function SortableItem({ media, index, onDelete, onReplace, onToggleStatus }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: media.id || media.tempId });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={cn(
      "relative aspect-square rounded-lg border-2 overflow-hidden group transition-all",
      media.is_active ? "border-muted" : "border-slate-300 grayscale opacity-75",
      isDragging && "opacity-50"
    )}>
      <div className="absolute inset-0">
        <Image
          src={media.media_type === "youtube" ? (resolveVideoPoster(media) || media.media_url) : (media.media_url || media.previewUrl)}
          alt=""
          fill
          sizes="200px"
          className="object-cover"
        />
        {media.media_type === "youtube" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg"><Youtube size={18} className="text-white" /></div>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-black/50 touch-overlay group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
        <div className="flex gap-2">
          <div {...attributes} {...listeners} className="p-1.5 bg-white text-slate-600 rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
            <GripVertical size={14} />
          </div>
          <button onClick={onToggleStatus} className={cn(
            "p-1.5 rounded-full hover:scale-110 transition-transform",
            media.is_active ? "bg-white text-green-600" : "bg-slate-500 text-white"
          )}>
            {media.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          {media.media_type !== "youtube" && (
            <button onClick={onReplace} className="p-1.5 bg-white text-blue-500 rounded-full hover:scale-110 transition-transform">
              <RefreshCcw size={14} />
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 bg-white text-red-500 rounded-full hover:scale-110 transition-transform">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="absolute top-1 left-1 flex flex-col gap-1">
        {media.media_type === "youtube" && (
          <div className="bg-red-600 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm self-start">Video</div>
        )}
        {media.tempId && (
          <div className="bg-yellow-500 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm self-start">New</div>
        )}
        {media.isReplaced && (
          <div className="bg-blue-500 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm self-start">Replaced</div>
        )}
        {!media.is_active && (
          <div className="bg-red-500 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm self-start">Hidden</div>
        )}
      </div>
      <div className="absolute bottom-1 right-1 bg-slate-900/50 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">#{index + 1}</div>
    </div>
  );
}
