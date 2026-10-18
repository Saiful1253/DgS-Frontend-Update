/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
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
import { Plus, Trash2, GripVertical, Eye, EyeOff, Youtube, Upload, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { resolveCta, isPhone } from "@/lib/cta-resolver";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { heroSectionSchema } from "@/zod/hero.validation";
import { uploadHeroIconAction } from "@/actions/upload.actions";
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

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,12})/);
  return m ? m[1] : null;
};

interface CreateHeroModalProps {
  onAddHero: (
    heroData: any,
    images: { tempId: string; file: File; is_active: boolean }[],
    videos: { tempId: string; media_url: string; is_active: boolean }[],
    order: { tempId: string; type: string; is_active: boolean }[]
  ) => Promise<boolean>;
  disabled?: boolean;
}



export default function CreateHeroModal({ onAddHero, disabled = false }: CreateHeroModalProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States (start empty, no auto-fill)
  const [headline, setHeadline] = useState("");
  const [highlightText, setHighlightText] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [subHeadline, setSubHeadline] = useState("");
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState("");
  const [primaryCtaLink, setPrimaryCtaLink] = useState("");
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState("");
  const [secondaryCtaLink, setSecondaryCtaLink] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "draft">("draft");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Media Queue (images + youtube videos in one ordered list)
  const [mediaQueue, setMediaQueue] = useState<any[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setHeadline("");
      setHighlightText("");
      setBadgeText("");
      setSubHeadline("");
      setPrimaryCtaLabel("");
      setPrimaryCtaLink("");
      setSecondaryCtaLabel("");
      setSecondaryCtaLink("");
      setStatus("draft");
      setMediaQueue([]);
      setYoutubeUrl("");
      setYoutubeError("");
      setErrors({});
    }
    setOpen(newOpen);
  };

  React.useEffect(() => {
    return () => {
      mediaQueue.forEach(item => {
        if (item.type === "image" && item.previewUrl && item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [mediaQueue]);

  const handleAddImagesQueue = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} exceeds 5MB limit.`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) return;

    const newAdded = validFiles.map((file) => ({
      id: `new-${crypto.randomUUID()}`,
      type: "image",
      file,
      previewUrl: URL.createObjectURL(file),
      is_active: true,
    }));

    setMediaQueue((prev) => [...prev, ...newAdded]);
  };

  const handleAddYouTube = () => {
    const url = youtubeUrl.trim();
    if (!url) {
      setYoutubeError("Paste a YouTube link first");
      return;
    }
    const ytId = getYouTubeId(url);
    if (!ytId) {
      setYoutubeError("Invalid video URL. USAGE\nYouTube: watch?v= | youtu.be | /embed/ | /shorts/");
      return;
    }
    setYoutubeError("");
    const tempId = `yt-${crypto.randomUUID()}`;
    setMediaQueue((prev) => [
      ...prev,
      {
        id: tempId,
        type: "youtube",
        media_url: url,
        youtubeId: ytId,
        previewUrl: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
        is_active: true,
      },
    ]);
    setYoutubeUrl("");
  };

  const handleToggleMediaStatus = (id: string) => {
    setMediaQueue(prev => prev.map(item =>
      item.id === id ? { ...item, is_active: !item.is_active } : item
    ));
  };

  const handleDeleteAdded = (id: string) => {
    setMediaQueue((prev) => {
      const target = prev.find(item => item.id === id);
      if (target && target.type === "image" && target.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(item => item.id !== id);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMediaQueue((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setErrors({});

    let finalPrimaryLabel = primaryCtaLabel.trim();
    let finalPrimaryLink = primaryCtaLink.trim();

    // Wise normalization: if only one is provided, pair them up
    if (!finalPrimaryLink && finalPrimaryLabel) {
      finalPrimaryLink = finalPrimaryLabel;
    } else if (!finalPrimaryLabel && finalPrimaryLink) {
      finalPrimaryLabel = finalPrimaryLink;
    }

    let finalSecondaryLabel = secondaryCtaLabel?.trim() || "";
    let finalSecondaryLink = secondaryCtaLink?.trim() || "";
    if (!finalSecondaryLink && finalSecondaryLabel && isPhone(finalSecondaryLabel)) {
      finalSecondaryLink = finalSecondaryLabel;
    } else if (!finalSecondaryLabel && finalSecondaryLink) {
      finalSecondaryLabel = finalSecondaryLink;
    }

    const payload = {
      headline,
      sub_headline: subHeadline,
      badge_text: badgeText,
      highlight_text: highlightText,
      primary_cta_label: finalPrimaryLabel,
      primary_cta_link: finalPrimaryLink,
      secondary_cta_label: finalSecondaryLabel,
      secondary_cta_link: finalSecondaryLink,
      status,
    };

    const parsed = heroSectionSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errs: Record<string, string | undefined> = {};
      Object.keys(fieldErrors).forEach((key) => {
        errs[key] = fieldErrors[key as keyof typeof fieldErrors]?.[0];
      });
      setErrors(errs);
      return;
    }

    if (mediaQueue.length === 0) {
      setErrors((prev) => ({ ...prev, images: "at least one media asset is required" }));
      toast.error("please add at least one image or video");
      return;
    }

    setSubmitting(true);
    try {
      const images = mediaQueue.filter(m => m.type === "image").map(i => ({ tempId: i.id, file: i.file, is_active: i.is_active }));
      const videos = mediaQueue.filter(m => m.type === "youtube").map(v => ({ tempId: v.id, media_url: v.media_url, is_active: v.is_active }));
      const order = mediaQueue.map(m => ({ tempId: m.id, type: m.type, is_active: m.is_active }));
      const success = await onAddHero(parsed.data, images as any, videos, order);
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
        <Button className="h-10 px-4 w-full sm:w-auto bg-primary text-white hover:bg-primary/90 font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5" disabled={disabled}>
          <Plus className="w-4 h-4" />
          <span>Add Hero Section</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Hero Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Main Content</h3>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700">Top Badge Text (Optional)</label>
                <span className="text-[10px] text-slate-400 font-normal truncate">e.g. TITAS GAS 1ST CLASS CONTRACTOR • GOVT. APPROVED</span>
              </div>
              <Input
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. TITAS GAS 1ST CLASS CONTRACTOR • GOVT. APPROVED"
              />
              <p className="text-[10px] text-slate-400">Pill badge above headline. Use &quot;•&quot; to highlight the second segment.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Headline *</label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Safe & Reliable Gas & Pipeline Engineering Solutions"
                className={errors.headline ? "border-red-500" : ""}
              />
              {errors.headline && <p className="text-xs text-red-500 font-medium">{errors.headline}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Headline Highlight Text (Optional)</label>
              <Input
                value={highlightText}
                onChange={(e) => setHighlightText(e.target.value)}
                placeholder="e.g. Gas & Pipeline"
              />
              <p className="text-[10px] text-slate-400">Word or phrase inside headline to colorize (default: #ff5722).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Sub-headline / Description *</label>
              <textarea
                value={subHeadline}
                onChange={(e) => setSubHeadline(e.target.value)}
                rows={3}
                className={cn(
                  "w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                  errors.sub_headline ? "border-red-500" : ""
                )}
                placeholder="e.g. Digital Gas Service – Titas Gas 1st Class Enlisted Contractor..."
              />
              {errors.sub_headline && <p className="text-xs text-red-500 font-medium">{errors.sub_headline}</p>}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Call-to-Action (CTA) Buttons</h4>
                <span className="text-[10px] text-slate-400 font-medium">Smart detection: Phone number, WhatsApp, or Page URL</span>
              </div>
              {(() => {
                const pResolved = resolveCta(primaryCtaLink, primaryCtaLabel);
                const sResolved = resolveCta(secondaryCtaLink, secondaryCtaLabel);
                const hasP = !!(primaryCtaLabel?.trim() || primaryCtaLink?.trim());
                const hasS = !!(secondaryCtaLabel?.trim() || secondaryCtaLink?.trim());

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">Primary CTA Label / Button Name *</label>
                          {hasP && (
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1",
                              pResolved.kind === "phone" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              pResolved.kind === "whatsapp" ? "bg-green-50 text-green-700 border border-green-200" :
                              "bg-sky-50 text-sky-700 border border-sky-200"
                            )}>
                              {pResolved.kind === "phone" ? <Phone size={9} /> : pResolved.kind === "whatsapp" ? <MessageCircle size={9} /> : <ExternalLink size={9} />}
                              {pResolved.kind === "phone" ? `Call (${pResolved.href})` : pResolved.kind === "whatsapp" ? "WhatsApp" : "Web Link"}
                            </span>
                          )}
                        </div>
                        <Input
                          value={primaryCtaLabel}
                          onChange={(e) => setPrimaryCtaLabel(e.target.value)}
                          placeholder="e.g. Call Us Now or 01778277178"
                          className={errors.primary_cta_label ? "border-red-500" : ""}
                        />
                        {errors.primary_cta_label && <p className="text-xs text-red-500 font-medium">{errors.primary_cta_label}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Primary CTA Link or Phone / WhatsApp *</label>
                        <Input
                          value={primaryCtaLink}
                          onChange={(e) => setPrimaryCtaLink(e.target.value)}
                          placeholder="e.g. 01778277178, #services, or wa.me/..."
                          className={errors.primary_cta_link ? "border-red-500" : ""}
                        />
                        {errors.primary_cta_link && <p className="text-xs text-red-500 font-medium">{errors.primary_cta_link}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">Secondary CTA Label / Button Name (Optional)</label>
                          {hasS && (
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1",
                              sResolved.kind === "phone" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              sResolved.kind === "whatsapp" ? "bg-green-50 text-green-700 border border-green-200" :
                              "bg-sky-50 text-sky-700 border border-sky-200"
                            )}>
                              {sResolved.kind === "phone" ? <Phone size={9} /> : sResolved.kind === "whatsapp" ? <MessageCircle size={9} /> : <ExternalLink size={9} />}
                              {sResolved.kind === "phone" ? `Call (${sResolved.href})` : sResolved.kind === "whatsapp" ? "WhatsApp" : "Web Link"}
                            </span>
                          )}
                        </div>
                        <Input
                          value={secondaryCtaLabel}
                          onChange={(e) => setSecondaryCtaLabel(e.target.value)}
                          placeholder="e.g. 01778-277178 or Explore"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Secondary CTA Link or Phone / WhatsApp (Optional)</label>
                        <Input
                          value={secondaryCtaLink}
                          onChange={(e) => setSecondaryCtaLink(e.target.value)}
                          placeholder="e.g. tel:01778277178 or wa.me/8801778..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
              <p className="text-[10px] text-slate-500 italic">
                * If you enter a phone number (e.g. 01778-277178), it will show a call icon and trigger a direct call. If you enter a WhatsApp link or number, it will open WhatsApp chat. Otherwise, it functions as a regular website button link.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Publication Status</label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active (Live)</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Media Assets Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Media Carousel Queue</h3>
              <span className="text-xs text-slate-500 font-medium">{mediaQueue.length} items</span>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-slate-50 border-slate-300 text-xs font-bold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Upload Images
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleAddImagesQueue(e.target.files)}
                />
              </div>

              <div className="flex gap-2">
                <Input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste YouTube Link (e.g. https://www.youtube.com/watch?v=...)"
                  className="h-9 text-xs bg-white border-slate-300"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddYouTube}
                  className="h-9 bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-1 px-3"
                >
                  <Youtube className="w-4 h-4" />
                  Add Video
                </Button>
              </div>
              {youtubeError && <p className="text-xs text-red-500 font-medium whitespace-pre-line">{youtubeError}</p>}
            </div>

            {/* Drag and drop sortable list */}
            {mediaQueue.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={mediaQueue.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {mediaQueue.map((item) => (
                      <SortableMediaRow
                        key={item.id}
                        item={item}
                        onToggleStatus={() => handleToggleMediaStatus(item.id)}
                        onDelete={() => handleDeleteAdded(item.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={submitting}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={submitting} className="bg-primary text-white hover:bg-primary/90">
            {submitting ? "Saving..." : "Create Hero Section"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SortableMediaRow({ item, onToggleStatus, onDelete }: { item: any; onToggleStatus: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center justify-between p-2.5 rounded-lg border bg-white shadow-2xs", !item.is_active && "opacity-50 bg-slate-50")}>
      <div className="flex items-center gap-3">
        <button type="button" {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600 p-1">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="relative w-12 h-10 rounded overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
          <Image src={item.previewUrl} alt="media preview" fill className="object-cover" />
          {item.type === "youtube" && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Youtube className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <div className="text-xs">
          <p className="font-bold text-slate-800 uppercase tracking-wider">{item.type}</p>
          <p className="text-slate-500 font-mono text-[11px] truncate max-w-[220px]">
            {item.type === "image" ? item.file?.name : item.media_url}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button type="button" variant="ghost" size="icon" onClick={onToggleStatus} className="h-8 w-8 text-slate-500 hover:text-slate-800">
          {item.is_active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
