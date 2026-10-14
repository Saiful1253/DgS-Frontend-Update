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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Image as ImageIcon,
  Upload,
  Globe,
  X,
  Star,
  Link2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Search,
  UserRound,
  FolderPlus,
  UserPlus,
  Check,
  Hash,
  Sparkles,
  ListChecks,
  CalendarClock,
  Clock3,
  Lock,
  Rocket,
  FileText,
  Eye,
  Archive,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { blogSchema, blogDraftSchema, blogFileSchema } from "@/zod/blog.validation";
import {
  listBlogCategories,
  createBlogCategory,
  listBlogAuthors,
  createBlogAuthor,
  uploadBlogAuthorAvatar,
  listBlogTags,
  listBlogs,
} from "@/services/blog/blog.service"
import { listPublicServices } from "@/services/service/service.service";
import RichTextEditor from "@/components/common/rich-text-editor";
import UnsavedChangesDialog from "./unsaved-changes-dialog";
import AuthorSearch, { initialsOf } from "../../author-search";
import CoAuthorPicker from "../../co-author-picker";
import OptionPicker, { PickerOption } from "../../option-picker";
import { normalizeBlogEmbedUrls } from "@/lib/blog-content";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BlogPost, BlogCoAuthor, BlogAuthor, ServiceOption } from "@/types/blog";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DATA_SIZE = 10 * 1024 * 1024; // 10MB

const toSlug = (val: string) =>
  val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const toKey = (val: string) =>
  val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const stripHtml = (html?: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const computeReadingTime = (html?: string) => {
  if (!html) return "";
  const text = stripHtml(html);
  if (!text) return "";
  const words = text.split(" ").filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
};

const STATUS_CARDS = [
  {
    key: "draft",
    label: "Draft",
    badge: "Private",
    desc: "Work in progress, only visible to your team",
    icon: FileText,
    color: "text-slate-600 bg-slate-100",
    activeBorder: "border-slate-800 ring-slate-800/10 bg-slate-50/50",
  },
  {
    key: "internal_review",
    label: "In Review",
    badge: "Editorial",
    desc: "Submitted for editor review & approval",
    icon: Eye,
    color: "text-amber-700 bg-amber-100",
    activeBorder: "border-amber-600 ring-amber-600/10 bg-amber-50/40",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    badge: "Timed",
    desc: "Auto-publish on designated date & time",
    icon: CalendarClock,
    color: "text-blue-700 bg-blue-100",
    activeBorder: "border-blue-600 ring-blue-600/10 bg-blue-50/40",
  },
  {
    key: "published",
    label: "Published",
    badge: "Live",
    desc: "Live immediately on public blog",
    icon: Rocket,
    color: "text-emerald-700 bg-emerald-100",
    activeBorder: "border-emerald-600 ring-emerald-600/10 bg-emerald-50/40",
  },
  {
    key: "archived",
    label: "Archived",
    badge: "Offline",
    desc: "Unlisted and hidden from public readers",
    icon: Archive,
    color: "text-purple-700 bg-purple-100",
    activeBorder: "border-purple-600 ring-purple-600/10 bg-purple-50/40",
  },
] as const;

const STEP_LABELS = ["Content", "Category & Authors", "Tags & Related", "SEO & Publish"];

interface EditBlogModalProps {
  blog: BlogPost;
  onUpdateBlog: (id: string | number, formData: FormData) => Promise<boolean>;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function EditBlogModal({
  blog,
  onUpdateBlog,
  trigger,
  disabled = false,
}: EditBlogModalProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const baselineRef = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Content States
  const [title, setTitle] = useState(blog.title);
  const [content, setContent] = useState(() => normalizeBlogEmbedUrls(blog.content || ""));
  const [contentDelta, setContentDelta] = useState<any>(blog.content_delta);
  const [slug, setSlug] = useState(blog.slug);
  const [slugAuto, setSlugAuto] = useState(false);
  const [readingTime, setReadingTime] = useState(blog.reading_time || "");
  const [readingAuto, setReadingAuto] = useState(!(blog.reading_time || "").trim());
  const [featuredImage, setFeaturedImage] = useState<{ file: File; preview: string } | null>(null);
  const [featuredImageAlt, setFeaturedImageAlt] = useState(blog.featured_image_alt || "");

  // Category States
  const [category, setCategory] = useState(blog.category || "");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false);

  // Author States
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [primaryAuthorName, setPrimaryAuthorName] = useState(blog.primary_author_name || "");
  const [coAuthors, setCoAuthors] = useState<BlogCoAuthor[]>(blog.co_authors || []);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorDesig, setNewAuthorDesig] = useState("");
  const [newAuthorBio, setNewAuthorBio] = useState("");
  const [newAuthorAvatar, setNewAuthorAvatar] = useState<{ file: File; preview: string } | null>(null);
  const [addingAuthorLoading, setAddingAuthorLoading] = useState(false);
  const [authorTarget, setAuthorTarget] = useState<"primary" | "coauthor">("primary");

  // Tags States
  const [tags, setTags] = useState<string[]>(blog.tags || []);
  const [allTags, setAllTags] = useState<PickerOption[]>([]);

  // Relations States
  const [relatedOptions, setRelatedOptions] = useState<any[]>([]);
  const [relatedIds, setRelatedIds] = useState<number[]>((blog.related_article_ids || []).map(Number));
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [relatedKeys, setRelatedKeys] = useState<string[]>(blog.related_service_keys || []);

  // Publishing States
  const [status, setStatus] = useState<string>(blog.status || "draft");
  const [publishAt, setPublishAt] = useState<string>(
    blog.scheduled_at ? new Date(blog.scheduled_at).toISOString().slice(0, 10) : ""
  );
  const [featuredStatus, setFeaturedStatus] = useState(Boolean(blog.featured_status));

  // SEO States
  const [seoTitle, setSeoTitle] = useState((blog as any).seo_meta?.meta_title || "");
  const [seoDescription, setSeoDescription] = useState(stripHtml((blog as any).seo_meta?.meta_description || ""));
  const [seoOgImage, setSeoOgImage] = useState((blog as any).seo_meta?.og_image_url || "");
  const [seoOgFile, setSeoOgFile] = useState<{ file: File; preview: string } | null>(null);
  const [seoKeywords, setSeoKeywords] = useState((blog as any).seo_meta?.keywords || "");
  const [seoIndexable, setSeoIndexable] = useState((blog as any).seo_meta?.indexable !== false);
  const [seoCanonical, setSeoCanonical] = useState(blog.canonical_url || "");
  const [seoNoFollow, setSeoNoFollow] = useState(Boolean(blog.no_follow));

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loadingLists, setLoadingLists] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ogFileInputRef = useRef<HTMLInputElement>(null);
  const authorSearchRef = useRef<HTMLDivElement>(null);

  const loadLists = async () => {
    setLoadingLists(true);
    try {
      const [catRes, authRes, tagRes, servRes, postRes] = await Promise.allSettled([
        listBlogCategories(),
        listBlogAuthors(),
        listBlogTags(),
        listPublicServices(),
        listBlogs(1, 500, "published"),
      ]);
      if (catRes.status === "fulfilled" && catRes.value.success && Array.isArray(catRes.value.data)) {
        setCategories(catRes.value.data.map((c: any) => c.name).filter(Boolean));
      }
      if (authRes.status === "fulfilled" && authRes.value.success && Array.isArray(authRes.value.data)) {
        setAuthors(authRes.value.data as BlogAuthor[]);
      }
      if (tagRes.status === "fulfilled" && tagRes.value.success && Array.isArray(tagRes.value.data)) {
        setAllTags((tagRes.value.data as any[]).map((tg) => ({ key: String(tg.name), label: `#${tg.name}`, hint: (tg.posts_count ?? tg.usages ?? 0) > 0 ? `${tg.posts_count ?? tg.usages ?? 0} posts` : undefined })));
      }
      if (servRes.status === "fulfilled" && servRes.value.success && Array.isArray(servRes.value.data)) {
        setServiceOptions(servRes.value.data as ServiceOption[]);
      }
      if (postRes.status === "fulfilled" && postRes.value.success) {
        const rawList = (postRes.value.data as any)?.data ?? [];
        const publishedList = (Array.isArray(rawList) ? rawList : []).filter(
          (b: any) => b.status === "published" && String(b.id) !== String(blog.id)
        );
        setRelatedOptions(publishedList);
      }
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setTitle(blog.title);
    setSlug(blog.slug);
    setSlugAuto(false);
    setContent(normalizeBlogEmbedUrls(blog.content || ""));
    setContentDelta(blog.content_delta);
    setCategory(blog.category || "");
    setTags(blog.tags || []);
    setReadingTime(blog.reading_time || "");
    setReadingAuto(!(blog.reading_time || "").trim());
    setPrimaryAuthorName(blog.primary_author_name || "");
    setCoAuthors(blog.co_authors || []);
    setFeaturedStatus(Boolean(blog.featured_status));
    setFeaturedImage(null);
    setFeaturedImageAlt(blog.featured_image_alt || "");
    setRelatedIds((blog.related_article_ids || []).map(Number));
    setRelatedKeys(blog.related_service_keys || []);
    setSeoTitle((blog as any).seo_meta?.meta_title || "");
    setSeoDescription(stripHtml((blog as any).seo_meta?.meta_description || ""));
    setSeoOgImage((blog as any).seo_meta?.og_image_url || "");
    setSeoOgFile(null);
    setSeoKeywords((blog as any).seo_meta?.keywords || "");
    setSeoIndexable((blog as any).seo_meta?.indexable !== false);
    setSeoCanonical(blog.canonical_url || "");
    setSeoNoFollow(Boolean(blog.no_follow));
    setStatus(blog.status || "draft");
    setPublishAt(blog.scheduled_at ? new Date(blog.scheduled_at).toISOString().slice(0, 10) : "");
    setErrors({});
    setStep(0);
    loadLists();
    baselineRef.current = baselineSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, blog]);

  const baselineSnapshot = () =>
    JSON.stringify({
      title: blog.title || "",
      slug: blog.slug || "",
      content: normalizeBlogEmbedUrls(blog.content || ""),
      category: blog.category || "",
      tags: blog.tags || [],
      readingTime: blog.reading_time || "",
      primaryAuthorName: blog.primary_author_name || "",
      coAuthors: blog.co_authors || [],
      featuredStatus: Boolean(blog.featured_status),
      featuredImage: null,
      featuredImageAlt: blog.featured_image_alt || "",
      relatedIds: (blog.related_article_ids || []).map(Number),
      relatedKeys: blog.related_service_keys || [],
      seoTitle: (blog as any).seo_meta?.meta_title || "",
      seoDescription: stripHtml((blog as any).seo_meta?.meta_description || ""),
      seoOgImage: (blog as any).seo_meta?.og_image_url || "",
      seoKeywords: (blog as any).seo_meta?.keywords || "",
      seoIndexable: (blog as any).seo_meta?.indexable !== false,
      seoCanonical: blog.canonical_url || "",
      seoNoFollow: Boolean(blog.no_follow),
    });

  const formSnapshot = () =>
    JSON.stringify({
      title,
      slug: slugAuto ? toSlug(title) || "" : slug,
      content,
      category,
      tags,
      readingTime,
      primaryAuthorName,
      coAuthors,
      featuredStatus,
      featuredImage: featuredImage?.preview || null,
      featuredImageAlt,
      relatedIds,
      relatedKeys,
      seoTitle,
      seoDescription,
      seoOgImage: seoOgFile?.preview || seoOgImage,
      seoKeywords,
      seoIndexable,
      seoCanonical,
      seoNoFollow,
    });

  const formIsDirty = () => baselineRef.current !== null && baselineRef.current !== formSnapshot();

  const attemptClose = () => {
    if (submitting) return;
    if (formIsDirty()) {
      setConfirmCloseOpen(true);
      return;
    }
    setOpen(false);
  };

  const handleDiscard = () => {
    setConfirmCloseOpen(false);
    setOpen(false);
  };

  const goToStep = (next: number) => {
    if (next < 0 || next > STEP_LABELS.length - 1) return;
    setStep(next);
    requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0 });
    });
  };

  const contentTrimmed = (html?: string) => {
    if (!html) return false;
    if (/(<(img|iframe|video|embed|blockquote))/i.test(html)) return true;
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
  };

  const validateStep = (stepIdx: number): boolean => {
    const next: Record<string, string | undefined> = {};
    if (stepIdx === 0) {
      if (!title.trim()) next.title = "Blog title is required";
    }
    if (stepIdx === 1) {
      if (!category.trim()) next.category = "Please select a category";
      if (!primaryAuthorName.trim()) next.primary_author_name = "Primary author is required";
    }
    if (stepIdx === 3) {
      if (status === "scheduled") {
        if (!publishAt) {
          next.scheduled_at = "Publish date and time is required for scheduled posts";
        } else if (new Date(publishAt) <= new Date()) {
          next.scheduled_at = "Scheduled time must be in the future";
        }
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Complete the highlighted fields before continuing.");
      return false;
    }
    return true;
  };

  const stepComplete = (stepIdx: number): boolean => {
    if (stepIdx === 0) return Boolean(title.trim());
    if (stepIdx === 1) return Boolean(category.trim() && category !== "Select category" && primaryAuthorName.trim());
    if (stepIdx === 3) {
      if (status === "scheduled") {
        return Boolean(publishAt && new Date(publishAt) > new Date());
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    goToStep(step + 1);
  };

  const handleBack = () => goToStep(step - 1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    if (featuredImage?.preview) URL.revokeObjectURL(featuredImage.preview);

    setFeaturedImage({
      file,
      preview: URL.createObjectURL(file),
    });
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const handleOgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("OG image exceeds 5MB limit.");
      return;
    }
    if (seoOgFile?.preview) URL.revokeObjectURL(seoOgFile.preview);
    setSeoOgFile({ file, preview: URL.createObjectURL(file) });
  };

  const handleRemoveOgFile = () => {
    if (seoOgFile?.preview) URL.revokeObjectURL(seoOgFile.preview);
    setSeoOgFile(null);
    if (ogFileInputRef.current) ogFileInputRef.current.value = "";
  };

  /** Reset input value so the same file can be re-selected */
  const openFilePicker = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  // ── Category on-the-fly ─────────────────────────────────────────
  const handleCategorySelect = (val: string) => {
    if (val === "__add_new_inline__") {
      setNewCategoryName("");
      setNewCategoryDesc("");
      setCategoryModalOpen(true);
      return;
    }
    if (val === "Select category" || !val) {
      setCategory("");
      return;
    }
    setCategory(val);
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddingCategoryLoading(true);
    try {
      const res = await createBlogCategory(name, newCategoryDesc.trim() || undefined);
      if (res.success) {
        setCategories((prev) => (prev.some((c) => c.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name]));
        setCategory(name);
        setCategoryModalOpen(false);
        setNewCategoryName("");
        setNewCategoryDesc("");
        setErrors((prev) => ({ ...prev, category: undefined }));
        toast.success(`Category "${name}" added.`);
      } else {
        toast.error(res.message || "Failed to create category");
      }
    } finally {
      setAddingCategoryLoading(false);
    }
  };

  // ── Authors ─────────────────────────────────────────────────────
  const addCoAuthor = (a: BlogAuthor | null, name?: string, designation?: string) => {
    if (!a && !name?.trim()) return;
    const authorName = a?.name ?? (name ?? "").trim();
    if (primaryAuthorName && primaryAuthorName.toLowerCase() === authorName.toLowerCase()) {
      toast.error(`"${authorName}" is already the primary author.`);
      return;
    }
    if (coAuthors.some((c) => c.name.toLowerCase() === authorName.toLowerCase())) {
      toast.error(`"${authorName}" is already in co-authors.`);
      return;
    }
    setCoAuthors((prev) => [
      ...prev,
      { name: authorName, designation: (a?.designation ?? (designation ?? "").trim()) || undefined },
    ]);
  };

  const removeCoAuthor = (idx: number) => setCoAuthors((prev) => prev.filter((_, i) => i !== idx));

  const primaryAuthorForPicker = React.useMemo(() => {
    const trimmed = primaryAuthorName.trim();
    if (!trimmed) return null;
    const match = authors.find((a) => (a.name || "").trim().toLowerCase() === trimmed.toLowerCase());
    if (match) return match;
    const coMatch = coAuthors.find((c) => (c.name || "").trim().toLowerCase() === trimmed.toLowerCase());
    return {
      id: -1,
      name: primaryAuthorName,
      designation: coMatch?.designation || null,
      avatar_url: null,
      bio: null,
      created_at: "",
    } as unknown as BlogAuthor;
  }, [authors, primaryAuthorName, coAuthors]);

  const handleCreateAuthor = async () => {
    const name = newAuthorName.trim();
    if (!name) {
      toast.error("Author name is required");
      return;
    }
    setAddingAuthorLoading(true);
    try {
      const res = await createBlogAuthor({ name, designation: newAuthorDesig.trim() || undefined, bio: newAuthorBio.trim() || undefined });
      if (!res.success) {
        toast.error(res.message || "Failed to create author");
        return;
      }
      const created = (res.data as BlogAuthor) ?? { id: Date.now(), name, designation: newAuthorDesig.trim() || null, bio: newAuthorBio.trim() || null, avatar_url: null, created_at: new Date().toISOString() };
      let author = created;
      if (newAuthorAvatar?.file) {
        try {
          const fd = new FormData();
          fd.append("file", newAuthorAvatar.file);
          const up = await uploadBlogAuthorAvatar(author.id, fd);
          if (up.success && up.data?.avatar_url) {
            author = { ...author, avatar_url: up.data.avatar_url };
          }
        } catch {
          /* avatar upload failure is non-fatal */
        }
      }
      setAuthors((prev) => (prev.some((x) => String(x.id) === String(author.id)) ? prev.map((x) => (String(x.id) === String(author.id) ? author : x)) : [...prev, author]));
      if (authorTarget === "coauthor") {
        addCoAuthor(author);
      } else {
        setPrimaryAuthorName(author.name);
        setErrors((prev) => ({ ...prev, primary_author_name: undefined }));
      }
      setAuthorModalOpen(false);
      setNewAuthorName("");
      setNewAuthorDesig("");
      setNewAuthorBio("");
      if (newAuthorAvatar?.preview) URL.revokeObjectURL(newAuthorAvatar.preview);
      setNewAuthorAvatar(null);
      toast.success(`Author "${author.name}" added.`);
    } finally {
      setAddingAuthorLoading(false);
    }
  };

  const handleNewAuthorAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Avatar image exceeds 5MB limit.");
      return;
    }
    if (newAuthorAvatar?.preview) URL.revokeObjectURL(newAuthorAvatar.preview);
    setNewAuthorAvatar({ file, preview: URL.createObjectURL(file) });
  };

  // ── Tags ────────────────────────────────────────────────────────
  const toggleTag = (key: string) => {
    const t = key.trim().replace(/^#+/, "");
    if (!t) return;
    if (tags.length >= 25) { toast.error("Max 25 tags"); return; }
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) { setTags((prev) => prev.filter((x) => x.toLowerCase() !== t.toLowerCase())); return; }
    setTags((prev) => [...prev, t]);
  };

  // ── Relations ───────────────────────────────────────────────────
  const toggleRelated = (id: number) =>
    setRelatedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleRelatedKey = (key: string) =>
    setRelatedKeys((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setErrors({});
    if (!validateStep(3)) return;

    const data = {
      title,
      slug: slugAuto ? (toSlug(title) || undefined) : (slug || undefined),
      content,
      content_delta: contentDelta,
      category: category || undefined,
      tags: tags.length ? tags : undefined,
      reading_time: readingTime || undefined,
      primary_author_name: primaryAuthorName.trim() || undefined,
      co_authors: coAuthors.length ? coAuthors : undefined,
      featured_image_alt: featuredImageAlt.trim() || undefined,
      featured_status: featuredStatus,
      status: (status as any) || undefined,
      scheduled_at: status === "scheduled" && publishAt ? (publishAt.includes("T") ? new Date(publishAt).toISOString() : new Date(`${publishAt}T23:59:00`).toISOString()) : undefined,
      canonical_url: seoCanonical || undefined,
      no_index: !seoIndexable,
      no_follow: seoNoFollow,
      related_article_ids: relatedIds.length ? relatedIds : undefined,
      related_service_keys: relatedKeys.length ? relatedKeys : undefined,
    };
    const parsed = blogSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])));
      setStep(0);
      goToStep(0);
      return;
    }

    if (featuredImage) {
      const fileParsed = blogFileSchema.safeParse(featuredImage.file);
      if (!fileParsed.success) {
        setErrors((prev) => ({ ...prev, file: fileParsed.error.issues[0].message }));
        setStep(0);
        goToStep(0);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (featuredImage) formData.append("file", featuredImage.file);
      if (seoOgFile) formData.append("og_image", seoOgFile.file);

      const dataStr = JSON.stringify(parsed.data);
      if (dataStr.length > MAX_DATA_SIZE) {
        toast.error(`Blog content is too large (${(dataStr.length / 1024 / 1024).toFixed(2)}MB). Max limit is 10MB. Try using smaller images.`);
        setSubmitting(false);
        return;
      }
      formData.append("data", dataStr);

      const plainContent = stripHtml(content);
      const autoExcerpt = plainContent.slice(0, 160);
      const finalMetaTitle = (seoTitle.trim() || title.trim()) || undefined;
      const finalMetaDesc = (seoDescription.trim() || autoExcerpt) || undefined;
      const finalKeywords = (seoKeywords.trim() || tags.join(", ")).trim() || undefined;

      const success = await onUpdateBlog(blog.id, formData);
      if (success) {
        const { updateBlogSeo } = await import("@/services/blog/blog.service");
        await updateBlogSeo(blog.id, {
          meta_title: finalMetaTitle,
          meta_description: finalMetaDesc,
          og_image_url: seoOgFile ? undefined : (seoOgImage.trim() || undefined),
          keywords: finalKeywords,
          indexable: seoIndexable,
          canonical_url: seoCanonical.trim() || undefined,
          no_follow: seoNoFollow,
        });
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const applySeo = async (id: string | number) => {
    try {
      const plainContent = stripHtml(content);
      const autoExcerpt = plainContent.slice(0, 160);
      const finalMetaTitle = (seoTitle.trim() || title.trim()) || undefined;
      const finalMetaDesc = (seoDescription.trim() || autoExcerpt) || undefined;
      const finalKeywords = (seoKeywords.trim() || tags.join(", ")).trim() || undefined;

      const { updateBlogSeo } = await import("@/services/blog/blog.service");
      await updateBlogSeo(id, {
        meta_title: finalMetaTitle,
        meta_description: finalMetaDesc,
        og_image_url: seoOgFile ? undefined : (seoOgImage.trim() || undefined),
        keywords: finalKeywords,
        indexable: seoIndexable,
        canonical_url: seoCanonical.trim() || undefined,
        no_follow: seoNoFollow,
      });
    } catch {
      /* applying SEO to a draft copy is best-effort */
    }
  };

  // ── Save as draft: relaxed fields ─────────────────────────────────
  // Live post (published/scheduled/archived) → create a NEW draft copy
  // so the current post is never overwritten or demoted. Posts that are
  // already drafts/in review are updated in place (no status change).
  const saveDraft = async () => {
    if (submitting) return;
    if (!title.trim()) {
      toast.error("A title is required to save as a draft.");
      setErrors((prev) => ({ ...prev, title: "Title is required" }));
      setStep(0);
      goToStep(0);
      return;
    }
    if (featuredImage) {
      const fileParsed = blogFileSchema.safeParse(featuredImage.file);
      if (!fileParsed.success) {
        setErrors((prev) => ({ ...prev, file: fileParsed.error.issues[0].message }));
        setStep(0);
        goToStep(0);
        return;
      }
    }

    const draftData = {
      title,
      slug: slugAuto ? undefined : (slug.trim() || undefined),
      content: contentTrimmed(content) ? content : undefined,
      content_delta: contentTrimmed(content) ? contentDelta : undefined,
      category: category || undefined,
      tags: tags.length ? tags : undefined,
      reading_time: readingTime || undefined,
      primary_author_name: primaryAuthorName.trim() || undefined,
      co_authors: coAuthors.length ? coAuthors : undefined,
      featured_image_alt: featuredImageAlt.trim() || undefined,
      featured_status: featuredStatus,
      status: "draft",
      canonical_url: seoCanonical || undefined,
      no_index: !seoIndexable,
      no_follow: seoNoFollow,
      related_article_ids: relatedIds.length ? relatedIds : undefined,
      related_service_keys: relatedKeys.length ? relatedKeys : undefined,
    } as const;
    const parsed = blogDraftSchema.safeParse(draftData);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])));
      setStep(0);
      goToStep(0);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (featuredImage) formData.append("file", featuredImage.file);
      if (seoOgFile) formData.append("og_image", seoOgFile.file);

      const dataStr = JSON.stringify(parsed.data);
      if (dataStr.length > MAX_DATA_SIZE) {
        toast.error(`Blog content is too large (${(dataStr.length / 1024 / 1024).toFixed(2)}MB). Max limit is 10MB.`);
        setSubmitting(false);
        return;
      }
      formData.append("data", dataStr);

      const success = await onUpdateBlog(blog.id, formData);
      if (!success) {
        toast.error("Failed to save draft.");
        setConfirmCloseOpen(false);
        return;
      }
      await applySeo(blog.id);
      toast.success("Draft saved.");
      setConfirmCloseOpen(false);
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (disabled) return;
        if (v) setOpen(true);
        else attemptClose();
      }}
    >
      <DialogTrigger asChild>
        {trigger && React.isValidElement(trigger) ? React.cloneElement(trigger as any, { disabled }) : trigger}
      </DialogTrigger>
      <DialogContent
        className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => {
          if (formIsDirty()) {
            e.preventDefault();
            setConfirmCloseOpen(true);
          }
        }}
        onEscapeKeyDown={(e) => {
          if (formIsDirty()) {
            e.preventDefault();
            setConfirmCloseOpen(true);
          }
        }}
      >
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900">
            Edit Blog Post
            <span className="ml-3 text-[10px] font-bold uppercase tracking-wider text-primary bg-sky-50 px-2 py-0.5 rounded-full align-middle">
              Step {step + 1} of {STEP_LABELS.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/40 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {STEP_LABELS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => done && goToStep(i)}
                  className={cn(
                    "flex items-center gap-1.5 min-w-0 flex-1",
                    active ? "cursor-default" : done ? "cursor-pointer" : "cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all",
                      done && "bg-emerald-500 text-white",
                      active && "bg-primary text-white ring-2 ring-primary/20",
                      !done && !active && "bg-slate-200 text-slate-400"
                    )}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden sm:block truncate text-[10px] font-bold uppercase tracking-wide",
                      active ? "text-primary" : done ? "text-emerald-600" : "text-slate-400"
                    )}
                  >
                    {label}
                  </span>
                  <div className="h-px flex-1 bg-slate-200 ml-1 hidden sm:flex overflow-hidden">
                    <div className={cn("h-full bg-emerald-400 transition-all", i < step ? "w-full opacity-60" : "w-0")} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div ref={contentRef} className="px-6 py-4 overflow-y-auto flex-1">
          {step === 0 && (
            <div className="grid gap-4">
              {/* Featured Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Featured Cover Image :</label>
                <div
                  className={cn(
                    "relative aspect-21/9 md:aspect-3/1 w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group bg-muted/20",
                    errors.file ? "border-red-500 bg-red-50/10" : "border-slate-200 hover:border-primary/60 hover:bg-slate-50/50"
                  )}
                >
                  {(featuredImage || blog.featured_image_url) ? (
                    <>
                      <Image src={featuredImage?.preview || blog.featured_image_url || ""} alt="Preview" fill sizes="700px" className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={openFilePicker}
                          className="text-xs font-semibold h-8"
                        >
                          Change Image
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div
                      className="cursor-pointer flex flex-col items-center text-center p-6 space-y-1.5 w-full h-full justify-center"
                      onClick={openFilePicker}
                    >
                      <div className="p-2.5 rounded-full bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ImageIcon size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Click to upload cover image</p>
                        <p className="text-[10px] text-slate-400">PNG, JPG, WebP up to 5MB (Recommended ratio 3:1)</p>
                      </div>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                {blog.featured_image_url && !featuredImage && <p className="text-[9px] text-muted-foreground italic text-center mt-1">Leave empty to keep existing image</p>}
                {errors.file && <p className="text-[10px] font-bold text-red-500">{errors.file}</p>}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Blog Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (slugAuto) setSlug(toSlug(e.target.value));
                    setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  className={cn("h-10 text-xs font-medium bg-white", errors.title && "border-red-500")}
                  placeholder="e.g. The Future of Sustainable Fashion"
                />
                {errors.title && <p className="text-[10px] font-bold text-red-500">{errors.title}</p>}
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" /> URL Slug :
                </label>
                <div className="flex-1 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 h-10 text-xs">
                  <span className="text-slate-400 font-medium">milanova.tech/blogs/</span>
                  <Input
                    value={slug}
                    onChange={(e) => { setSlugAuto(false); setSlug(e.target.value); }}
                    disabled={slugAuto}
                    className="flex-1 h-auto px-0 py-0 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0 text-xs font-medium disabled:opacity-60"
                    placeholder="auto-generated-from-title"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={slugAuto}
                    onChange={(e) => {
                      const auto = e.target.checked;
                      setSlugAuto(auto);
                      if (auto) setSlug(toSlug(title));
                    }}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-slate-500">Auto-generate from title</span>
                </label>
              </div>

              {/* Reading Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Reading Time :</label>
                <Input
                  value={readingTime}
                  onChange={(e) => { setReadingAuto(false); setReadingTime(e.target.value); }}
                  disabled={readingAuto}
                  className={cn("h-10 text-xs bg-white", readingAuto && "opacity-70")}
                  placeholder="e.g. 5 min read"
                />
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={readingAuto}
                    onChange={(e) => {
                      const auto = e.target.checked;
                      setReadingAuto(auto);
                      if (auto) setReadingTime(computeReadingTime(content) || readingTime);
                    }}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-slate-500">Auto-calculate from content (~1 min per 200 words)</span>
                </label>
                {errors.reading_time && <p className="text-[10px] font-bold text-red-500">{errors.reading_time}</p>}
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Content :</label>
                <div className={cn("rounded-lg border overflow-hidden bg-white", errors.content ? "border-red-500" : "border-slate-200")}>
                  <RichTextEditor
                    value={content}
                    onChange={(html: string, delta: any) => {
                      setContent(html);
                      setContentDelta(delta);
                      if (readingAuto) setReadingTime(computeReadingTime(html) || "");
                      if (contentTrimmed(html)) setErrors((prev) => ({ ...prev, content: undefined }));
                    }}
                    placeholder="e.g. We are excited to announce..."
                  />
                </div>
                {errors.content && <p className="text-[10px] font-bold text-red-500">{errors.content}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4">
              {/* Category selector (dropdown + add on the fly) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setNewCategoryName(""); setNewCategoryDesc(""); setCategoryModalOpen(true); }}
                    className="h-6 text-[10px] gap-1 px-1.5 inline-flex items-center text-primary hover:text-primary/90 hover:bg-sky-50 font-semibold rounded"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Add New Category</span>
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={category || "Select category"}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className={cn(
                      "w-full h-10 pl-3.5 pr-12 rounded-md border border-input bg-white text-sm font-medium shadow-xs appearance-none focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer",
                      !category ? "text-slate-400" : "text-slate-800",
                      errors.category && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  >
                    <option value="Select category" className="text-slate-400 font-normal">Select category</option>
                    {categories.map((c) => (
                      <option key={c} value={c} className="text-slate-800">{c}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] font-medium text-slate-400">Tip: new categories are saved instantly and selected for this post.</p>
                {errors.category && <p className="text-[10px] font-bold text-red-500">{errors.category}</p>}
              </div>

              {/* Primary Author search */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    Primary Author <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorTarget("primary");
                      setNewAuthorName("");
                      setNewAuthorDesig("");
                      setNewAuthorBio("");
                      setNewAuthorAvatar(null);
                      setAuthorModalOpen(true);
                    }}
                    className="h-6 text-[10px] gap-1 px-1.5 inline-flex items-center text-primary hover:text-primary/90 hover:bg-sky-50 font-semibold rounded"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add New Author</span>
                  </button>
                </div>

                <AuthorSearch
                  authors={authors}
                  selected={primaryAuthorForPicker}
                  onSelect={(a: BlogAuthor) => {
                    setPrimaryAuthorName(a.name);
                    setErrors((prev) => ({ ...prev, primary_author_name: undefined }));
                  }}
                  onClear={() => setPrimaryAuthorName("")}
                  placeholder="Type author name to search & select primary author..."
                  emptyText="No authors found. Use 'Add New Author' above."
                  inputRef={authorSearchRef}
                />
                {errors.primary_author_name && <p className="text-[10px] font-bold text-red-500">{errors.primary_author_name}</p>}
              </div>

              {/* Co-authors */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-slate-700 uppercase">Co-authors (Optional)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorTarget("coauthor");
                      setNewAuthorName("");
                      setNewAuthorDesig("");
                      setNewAuthorBio("");
                      setNewAuthorAvatar(null);
                      setAuthorModalOpen(true);
                    }}
                    className="h-6 text-[10px] gap-1 px-1.5 inline-flex items-center text-primary hover:text-primary/90 hover:bg-sky-50 font-semibold rounded"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add New Author</span>
                  </button>
                </div>
                <CoAuthorPicker
                  authors={authors}
                  coAuthors={coAuthors}
                  primaryAuthorName={primaryAuthorName}
                  onAdd={(a: BlogAuthor) => addCoAuthor(a)}
                  onRemove={removeCoAuthor}
                />
                {errors.co_authors && <p className="text-[10px] font-bold text-red-500">{errors.co_authors}</p>}
                <p className="text-[10px] font-medium text-slate-400">Authors are shared across blog posts with avatars, bios &amp; designations.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-primary" /> Tags
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {tags.length}/25 · shared with the Tags manager
                  </span>
                </div>
                <OptionPicker
                  options={allTags}
                  selected={tags}
                  onToggle={toggleTag}
                  allowCreate
                  onCreate={toggleTag}
                  placeholder="Search and select tags or type to create..."
                  countLabel="tags"
                  emptyText={loadingLists ? "Loading tags..." : "No tags found."}
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sky-mist text-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                        #{t}
                        <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} title={`Remove tag ${t}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.tags && <p className="text-[10px] font-bold text-red-500">{errors.tags}</p>}
              </div>

              {/* Related articles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Related Articles
                    <span className="text-[10px] font-medium text-slate-400 normal-case">({relatedIds.length} selected, multiple)</span>
                  </span>
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <OptionPicker
                  options={relatedOptions.map((p: any) => ({ key: String(p.id), label: p.title || "Untitled", hint: p.category || "Uncategorized" }))}
                  selected={relatedIds.map(String)}
                  onToggle={(key: string) => toggleRelated(Number(key))}
                  placeholder="Search published posts to link as related..."
                  countLabel="articles"
                  emptyText={loadingLists ? "Loading posts..." : "No published posts to link yet. Publish some articles first."}
                />
                {relatedIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {relatedOptions.filter((p) => relatedIds.includes(Number(p.id))).map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-[11px] font-medium">
                        {p.title}
                        <button type="button" onClick={() => toggleRelated(Number(p.id))} className="hover:text-red-500" title="Remove related article">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Related services */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-primary" /> Related Services
                    <span className="text-[10px] font-medium text-slate-400 normal-case">({relatedKeys.length} selected)</span>
                  </span>
                </div>
                <OptionPicker
                  options={serviceOptions.map((s) => ({ key: s.slug || toKey(s.name), label: s.name, hint: `${s.pillar} · ${s.slug || toKey(s.name)}` }))}
                  selected={relatedKeys}
                  onToggle={toggleRelatedKey}
                  placeholder="Search services..."
                  countLabel="services"
                  emptyText={loadingLists ? "Loading services..." : "No services found."}
                />
                {relatedKeys.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {relatedKeys.map((k) => (
                      <span key={k} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 text-[11px] font-medium">
                        {k}
                        <button type="button" onClick={() => setRelatedKeys((prev) => prev.filter((x) => x !== k))} className="hover:text-red-500" title="Remove service">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* 1. Publication Status Selection */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Rocket className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Publication Status
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Select the target lifecycle state for this blog post
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5-Status Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
                  {STATUS_CARDS.map((card) => {
                    const isSelected = status === card.key;
                    const isLocked = false;
                    const Icon = card.icon;

                    return (
                      <button
                        key={card.key}
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          if (!isLocked) {
                            setStatus(card.key);
                            if (card.key !== "scheduled") {
                              setErrors((prev) => ({ ...prev, scheduled_at: undefined }));
                            }
                          }
                        }}
                        className={cn(
                          "relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all duration-150 select-none cursor-pointer",
                          isSelected
                            ? cn("ring-2 shadow-xs", card.activeBorder)
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70",
                          isLocked && "opacity-45 cursor-not-allowed hover:bg-white hover:border-slate-200"
                        )}
                      >
                        <div className="flex items-start justify-between w-full mb-2">
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", card.color)}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          {isSelected ? (
                            <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : isLocked ? (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          ) : null}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">{card.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                            {card.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Scheduled Date Drawer */}
                {status === "scheduled" && (
                  <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-sky-50/30 to-white p-4 space-y-3 shadow-xs animate-in fade-in-50 duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-blue-100/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                          <CalendarClock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Target Auto-Publish Date</span>
                          <span className="text-[10px] text-slate-500">Pick a future date or click a preset</span>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-400 mr-0.5">Presets:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
                            setPublishAt(d.toISOString().slice(0, 10));
                            setErrors((prev) => ({ ...prev, scheduled_at: undefined }));
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-blue-200/80 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-2xs transition-all cursor-pointer"
                        >
                          Tomorrow
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                            setPublishAt(d.toISOString().slice(0, 10));
                            setErrors((prev) => ({ ...prev, scheduled_at: undefined }));
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-blue-200/80 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-2xs transition-all cursor-pointer"
                        >
                          +3 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                            setPublishAt(d.toISOString().slice(0, 10));
                            setErrors((prev) => ({ ...prev, scheduled_at: undefined }));
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-blue-200/80 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-2xs transition-all cursor-pointer"
                        >
                          +1 Week
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-0.5">
                      <div>
                        <div className="relative">
                          <Input
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={publishAt ? publishAt.slice(0, 10) : ""}
                            onChange={(e) => {
                              setPublishAt(e.target.value);
                              setErrors((prev) => ({ ...prev, scheduled_at: undefined }));
                            }}
                            className="h-10 text-xs font-semibold bg-white border-blue-200 focus-visible:ring-blue-500 shadow-2xs cursor-pointer text-slate-800"
                          />
                        </div>
                        {errors.scheduled_at && (
                          <p className="text-[10px] font-bold text-red-500 mt-1">{errors.scheduled_at}</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-blue-200/60 bg-white/80 p-2.5 flex items-start gap-2">
                        <Clock3 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Article will automatically go live via nightly cron at <strong>11:59 PM</strong> on the selected date.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Featured Slot Highlight */}
                <div
                  onClick={() => setFeaturedStatus(!featuredStatus)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                    featuredStatus
                      ? "border-amber-300/90 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50/80 text-slate-700"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-2xs",
                        featuredStatus
                          ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200/50"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <Star className={cn("w-4.5 h-4.5", featuredStatus ? "fill-white text-white" : "text-slate-400")} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">Featured Article Spotlight</span>
                        <span
                          className={cn(
                            "text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full transition-all",
                            featuredStatus
                              ? "bg-amber-100 text-amber-800 border border-amber-300/80"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          )}
                        >
                          {featuredStatus ? "Spotlight Active" : "Standard"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Showcases this post in the homepage hero carousel and top featured placements.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={featuredStatus}
                      onCheckedChange={setFeaturedStatus}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Live Google SERP Snippet Preview */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Search Engine Preview
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Live Google desktop search snippet simulation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      (seoTitle.length >= 50 && seoTitle.length <= 60)
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                      Title: {seoTitle.length || title.length}/60
                    </span>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      (seoDescription.length >= 120 && seoDescription.length <= 160)
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                      Desc: {seoDescription.length || (content ? Math.min(160, stripHtml(content).length) : 0)}/160
                    </span>
                  </div>
                </div>

                {/* Google Card Simulation */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 font-sans space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      M
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[12px] font-medium text-slate-800 leading-tight">Milanova Italy</span>
                      <span className="text-[11px] text-slate-500 truncate leading-tight">
                        https://milanova.tech › blogs › {slug || toSlug(title) || "article-slug"}
                      </span>
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <h5 className="text-[17px] font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug truncate">
                      {seoTitle.trim() || title.trim() || "Untitled Blog Post — Milanova Italy"}
                    </h5>
                  </div>
                  <p className="text-[13px] text-[#4d5156] leading-relaxed line-clamp-2">
                    <span className="text-slate-400 text-[12px] font-normal mr-1">
                      {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} —
                    </span>
                    {seoDescription.trim() ||
                      (content
                        ? stripHtml(content).slice(0, 160)
                        : "") ||
                      "No meta description specified. Google will automatically display text from the beginning of your post body."}
                  </p>
                </div>
              </div>

              {/* 3. SEO & OpenGraph Configuration */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        SEO &amp; OpenGraph Metadata
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Customize search tags, social media previews, and crawler directives
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Left Column: Meta Texts */}
                  <div className="space-y-4 flex flex-col justify-between">
                    {/* Row 1: Meta Title */}
                    <div className="space-y-1.5 min-h-[92px]">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">Meta Title</label>
                        <span className={cn(
                          "text-[10px] font-semibold",
                          seoTitle.length > 60 ? "text-red-500" : seoTitle.length >= 50 ? "text-emerald-600" : "text-slate-400"
                        )}>
                          {seoTitle.length}/60 chars {seoTitle ? "(rec: 50-60)" : ""}
                        </span>
                      </div>
                      <Input
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder={title.trim() ? `Defaults to: "${title.trim()}"` : "Defaults to Blog Title"}
                        className="bg-white text-xs h-10 border-slate-200"
                      />
                      <p className="text-[10px] text-slate-400 truncate">
                        Appears in browser tabs and search engine headline links.
                      </p>
                    </div>

                    {/* Row 2: Meta Description */}
                    <div className="space-y-1.5 min-h-[148px]">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">Meta Description</label>
                        <span className={cn(
                          "text-[10px] font-semibold",
                          seoDescription.length > 160 ? "text-red-500" : seoDescription.length >= 120 ? "text-emerald-600" : "text-slate-400"
                        )}>
                          {seoDescription.length}/160 chars {seoDescription ? "(rec: 120-160)" : ""}
                        </span>
                      </div>
                      <Textarea
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder="Defaults to auto-generated excerpt from blog content body"
                        rows={3}
                        className="bg-white text-xs resize-none border-slate-200 h-[76px]"
                      />
                      <p className="text-[10px] text-slate-400 truncate">
                        Summary snippet displayed in search result listings.
                      </p>
                    </div>

                    {/* Row 3: Custom SEO Keywords */}
                    <div className="space-y-1.5 min-h-[92px]">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Custom SEO Keywords</span>
                        <span className="text-[10px] font-normal text-slate-400">Comma-separated</span>
                      </label>
                      <Input
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        placeholder={tags.length > 0 ? `Defaults to tags: ${tags.join(", ")}` : "e.g. cloud, devops, architecture"}
                        className="bg-white text-xs h-10 border-slate-200"
                      />
                      <p className="text-[10px] text-slate-400 truncate">
                        Search crawler keywords (auto-inherits Step 3 tags if empty).
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Alt Text, Social OG Image, Canonical URL */}
                  <div className="space-y-4 flex flex-col justify-between">
                    {/* Row 1: Featured Image Alt Text */}
                    <div className="space-y-1.5 min-h-[92px]">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">
                          Featured Image Alt Text
                        </label>
                        <span className="text-[10px] text-slate-400 font-normal">Google Images</span>
                      </div>
                      <Input
                        value={featuredImageAlt}
                        onChange={(e) => setFeaturedImageAlt(e.target.value)}
                        placeholder={title.trim() ? `e.g. Cover artwork for ${title.trim()}` : "Descriptive alt text for image search"}
                        className="bg-white text-xs h-10 border-slate-200"
                      />
                      <p className="text-[10px] text-slate-400 truncate">
                        Accessibility compliance &amp; Google Image Search indexing.
                      </p>
                    </div>

                    {/* Row 2: Social Media (OG) Share Image */}
                    <div className="space-y-1.5 min-h-[148px]">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">
                          Social Media (OG) Share Image
                        </label>
                        <span className="text-[10px] text-slate-400 font-normal">LinkedIn / X / FB</span>
                      </div>
                      <input
                        id="edit-og-image-input"
                        type="file"
                        ref={ogFileInputRef}
                        accept="image/*"
                        onChange={handleOgFileChange}
                        className="sr-only"
                      />
                      <div className="h-[76px] p-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-all flex items-center gap-3">
                        {seoOgFile ? (
                          <>
                            <div className="relative h-[60px] w-[88px] rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 group">
                              <Image
                                src={seoOgFile.preview}
                                alt="OG preview"
                                fill
                                sizes="88px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 pr-1">
                              <p className="text-xs font-semibold text-slate-800 truncate">{seoOgFile.file.name}</p>
                              <p className="text-[10px] text-emerald-600 font-medium">Custom OG image attached</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <label
                                htmlFor="edit-og-image-input"
                                className="inline-flex items-center justify-center h-7 px-2 text-[10px] font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer select-none transition-colors"
                              >
                                Change
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveOgFile}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Clear image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </>
                        ) : (blog as any).custom_og_image || (blog as any).seo_meta?.og_image_url ? (
                          <>
                            <div className="relative h-[60px] w-[88px] rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                              <Image
                                src={(blog as any).custom_og_image || (blog as any).seo_meta?.og_image_url}
                                alt="OG preview"
                                fill
                                sizes="88px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 pr-1">
                              <p className="text-xs font-semibold text-slate-800 truncate">Current OG Image</p>
                              <p className="text-[10px] text-slate-400 font-medium">Synced with article</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <label
                                htmlFor="edit-og-image-input"
                                className="inline-flex items-center justify-center h-7 px-2 text-[10px] font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer select-none transition-colors"
                              >
                                Replace
                              </label>
                            </div>
                          </>
                        ) : (
                          <label
                            htmlFor="edit-og-image-input"
                            className="flex-1 flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/40 transition-colors shrink-0">
                                <Upload className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-slate-700 hover:text-primary transition-colors block">
                                  Upload custom image
                                </span>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  Recommended: 1200×630px (up to 5MB)
                                </span>
                              </div>
                            </div>
                            <span className="inline-flex items-center justify-center h-7.5 px-2.5 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shrink-0 transition-colors">
                              Browse
                            </span>
                          </label>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        Preview card image shown when shared across social channels.
                      </p>
                    </div>

                    {/* Row 3: Canonical URL */}
                    <div className="space-y-1.5 min-h-[92px]">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Canonical URL
                      </label>
                      <Input
                        value={seoCanonical}
                        onChange={(e) => setSeoCanonical(e.target.value)}
                        placeholder="https://milanova.tech/blogs/original-post"
                        className="bg-white text-xs h-10 border-slate-200"
                      />
                      {errors.canonical_url ? (
                        <p className="text-[10px] font-bold text-red-500 truncate">{errors.canonical_url}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400 truncate">
                          Prevent duplicate content penalty if cross-posting from elsewhere.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Directives Footer Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div
                    onClick={() => setSeoIndexable(!seoIndexable)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                      seoIndexable ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white"
                    )}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Allow Search Indexing</span>
                      <span className="text-[10px] text-slate-500">Google and search bots index this post (`index`)</span>
                    </div>
                    <div className="pl-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={seoIndexable}
                        onCheckedChange={setSeoIndexable}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => setSeoNoFollow(!seoNoFollow)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                      seoNoFollow ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white"
                    )}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Nofollow Outbound Links</span>
                      <span className="text-[10px] text-slate-500">Instruct search crawlers not to pass PageRank (`nofollow`)</span>
                    </div>
                    <div className="pl-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={seoNoFollow}
                        onCheckedChange={setSeoNoFollow}
                        className="data-[state=checked]:bg-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 gap-2 shrink-0">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={attemptClose} disabled={submitting}>Cancel</Button>
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={handleBack} disabled={submitting} className="gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </Button>
              )}
            </div>
            {step < STEP_LABELS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={submitting || !stepComplete(step)}
                className="gap-1 bg-primary text-white hover:bg-primary/90 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next: {STEP_LABELS[step + 1]} <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={submitting || !stepComplete(step)}
                className="gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Saving..." : <><Check className="w-4 h-4" /> Update Blog Post</>}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Add New Category Modal */}
    <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add New Category</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <label className="text-xs font-bold text-slate-700">
            Category Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
            autoFocus
            className="h-10 text-sm bg-white"
            placeholder="e.g. Software Engineering"
          />
          <label className="text-xs font-bold text-slate-700">Description</label>
          <Textarea
            value={newCategoryDesc}
            onChange={(e) => setNewCategoryDesc(e.target.value)}
            rows={3}
            className="text-xs bg-white resize-none"
            placeholder="Short description of what this category covers (optional)"
          />
          <p className="text-[10px] font-medium text-slate-400">
            Saved instantly and selected for this post automatically.
          </p>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreateCategory} disabled={addingCategoryLoading || !newCategoryName.trim()} className="bg-primary text-white hover:bg-primary/90 font-semibold">
            {addingCategoryLoading ? "Saving..." : "Save Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Add New Author Modal */}
    <Dialog open={authorModalOpen} onOpenChange={setAuthorModalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add New Author</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Author Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateAuthor()}
              autoFocus
              className="h-10 text-sm bg-white"
              placeholder="e.g. John Milano"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Designation</label>
            <Input
              value={newAuthorDesig}
              onChange={(e) => setNewAuthorDesig(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateAuthor()}
              className="h-10 text-sm bg-white"
              placeholder="e.g. Senior Cloud Architect"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">About / Bio</label>
            <Textarea
              value={newAuthorBio}
              onChange={(e) => setNewAuthorBio(e.target.value)}
              rows={3}
              className="text-xs bg-white resize-none"
              placeholder="Short bio shown with author credits (optional)"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Profile Photo</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-sky-mist text-primary flex items-center justify-center border border-primary/20 text-xs font-bold shrink-0">
                {newAuthorAvatar ? (
                  <Image src={newAuthorAvatar.preview} alt="avatar" width={56} height={56} className="object-cover w-14 h-14" />
                ) : newAuthorName ? (
                  initialsOf(newAuthorName)
                ) : (
                  <UserRound className="w-5 h-5" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewAuthorAvatarChange}
                  className="text-[11px] text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-primary"
                />
                {newAuthorAvatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (newAuthorAvatar?.preview) URL.revokeObjectURL(newAuthorAvatar.preview); setNewAuthorAvatar(null); }}
                    className="h-8 px-2 text-[11px] font-semibold text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-400">PNG, JPG, WebP up to 5MB. Uploaded after the author is created.</p>
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreateAuthor} disabled={addingAuthorLoading || !newAuthorName.trim()} className="bg-primary text-white hover:bg-primary/90 font-semibold">
            {addingAuthorLoading ? "Adding..." : "Add Author"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog
      open={confirmCloseOpen}
      onOpenChange={(v) => !submitting && setConfirmCloseOpen(v)}
      mode="edit"
      busy={submitting}
      onSaveDraft={saveDraft}
      onDiscard={handleDiscard}
    />
    </>
  );
}