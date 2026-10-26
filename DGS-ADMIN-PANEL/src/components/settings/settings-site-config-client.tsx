"use client";

import React, { useState, useRef } from "react";
import { SiteConfig } from "@/types/settings";
import { saveSiteConfig, uploadCompanyLogo, uploadSiteFavicon } from "@/services/settings/settings.service";
import ImageUploadField, { ImageUploadFieldHandle } from "@/components/common/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit2, UploadCloud, Globe, Phone, Mail, MapPin, MessageSquare, Facebook, Instagram, Twitter, FileText, ShieldAlert, Search, Linkedin, Youtube } from "lucide-react";
import Image from "next/image";
import { siteConfigValidationSchema } from "@/zod/site-config.validation";
import { Badge } from "@/components/ui/badge";

interface Props {
  initialConfig: SiteConfig;
}

export default function SettingsSiteConfigClient({
  initialConfig,
}: Props) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const logoUploadRef = useRef<ImageUploadFieldHandle>(null);
  const faviconUploadRef = useRef<ImageUploadFieldHandle>(null);

  // Temporary Form States inside Modal
  const [formState, setFormState] = useState<SiteConfig>({ ...initialConfig });
  const [coordinatesInput, setCoordinatesInput] = useState<string>(() => {
    return initialConfig.company_latitude && initialConfig.company_longitude
      ? `${initialConfig.company_latitude}, ${initialConfig.company_longitude}`
      : (initialConfig.company_latitude || initialConfig.company_longitude || "");
  });

  const handleOpenModal = () => {
    setFormState({ ...config });
    const coords =
      config.company_latitude && config.company_longitude
        ? `${config.company_latitude}, ${config.company_longitude}`
        : (config.company_latitude || config.company_longitude || "");
    setCoordinatesInput(coords);
    setFieldErrors({});
    setIsOpen(true);
  };

  const handleCoordinatesChange = (val: string) => {
    setCoordinatesInput(val);
    const clean = val.replace(/[()]/g, "").trim();
    if (!clean) {
      setFormState((prev) => ({
        ...prev,
        company_latitude: "",
        company_longitude: "",
      }));
    } else if (clean.includes(",")) {
      const parts = clean.split(",");
      setFormState((prev) => ({
        ...prev,
        company_latitude: parts[0]?.trim() || "",
        company_longitude: parts.slice(1).join(",").trim(),
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        company_latitude: clean,
        company_longitude: "",
      }));
    }

    if (fieldErrors.company_latitude || fieldErrors.company_longitude) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.company_latitude;
        delete next.company_longitude;
        return next;
      });
    }
  };

  const handleFieldChange = (key: keyof SiteConfig, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };


  const handleSave = async () => {
    // Client-side Zod validation
    const validation = siteConfigValidationSchema.safeParse(formState);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setFieldErrors(errors);
      toast.error("Please fix form errors before saving.");
      return;
    }

    setSaving(true);
    try {
      const finalConfig = { ...formState };

      // Flush logo upload if pending
      if (logoUploadRef.current?.hasPending()) {
        const uploadedLogo = await logoUploadRef.current.flush();
        if (uploadedLogo === null) {
          setSaving(false);
          return;
        }
        if (uploadedLogo) {
          finalConfig.company_logo = uploadedLogo;
        }
      }

      // Flush favicon upload if pending
      if (faviconUploadRef.current?.hasPending()) {
        const uploadedFavicon = await faviconUploadRef.current.flush();
        if (uploadedFavicon === null) {
          setSaving(false);
          return;
        }
        if (uploadedFavicon) {
          finalConfig.site_favicon = uploadedFavicon;
        }
      }

      // Save all text configurations under one action
      const res = await saveSiteConfig(finalConfig as Record<string, string>);
      if (res.success) {
        setConfig(finalConfig);
        toast.success("Site configuration saved successfully!");
        setIsOpen(false);
      } else {
        toast.error(res.message || "Failed to save configuration");
      }
    } catch {
      toast.error("Error saving site config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Brand Identity &amp; System Defaults</h2>
          <p className="text-xs font-medium text-slate-500">Live configuration currently deployed to public storefront &amp; client panel.</p>
        </div>
        <Button 
          onClick={handleOpenModal} 
          className="font-bold uppercase text-xs h-10 px-6 shadow-sm bg-[#00668a] hover:bg-[#004c69] text-white cursor-pointer"
        >
          <Edit2 className="size-3.5 mr-1.5" />
          Edit Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left Column: Company Identity & Location Map */}
        <div className="flex flex-col gap-5 h-full">
          {/* General Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Globe className="size-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Company Identity</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Col 1: Logo & Company Name */}
              <div className="flex items-center gap-3">
                <div className="relative size-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {config.company_logo ? (
                    <Image src={config.company_logo} alt="Company Logo" fill sizes="48px" className="object-contain p-1" />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center justify-center">
                      <UploadCloud className="size-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Company Name</span>
                  <span className="text-base font-extrabold text-slate-800 block truncate leading-tight mt-0.5">
                    {config.company_name || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>

              {/* Col 2: Short Description (Tagline) */}
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                  <FileText className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Short Description (Tagline)</span>
                  <span className="text-xs text-slate-700 font-semibold mt-0.5 truncate">
                    {config.company_short_description || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>

              {/* Col 1, Row 2: Long Description */}
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                  <FileText className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Long Description (Footer)</span>
                  <span className="text-xs text-slate-600 leading-relaxed mt-0.5 line-clamp-2 break-words">
                    {config.company_description || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>

              {/* Col 2, Row 2: Copyright Year & Footer Text */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center size-7 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <FileText className="size-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Copyright Year</span>
                    <span className="text-xs text-slate-700 font-semibold mt-0.5">
                      {config.copyright_year || <span className="text-slate-400 italic font-normal">2026</span>}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center size-7 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <FileText className="size-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Footer Text</span>
                    <span className="text-xs text-slate-700 font-semibold mt-0.5 truncate">
                      {config.footer_text || <span className="text-slate-400 italic font-normal">All rights reserved.</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Map Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Added Location &amp; Map</h3>
              </div>
              {config.company_latitude && config.company_longitude && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                  {config.company_latitude}, {config.company_longitude}
                </span>
              )}
            </div>

            {config.company_address && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/70 px-2.5 py-1.5 rounded-lg border border-slate-200/70 shrink-0">
                <MapPin className="size-3.5 text-blue-600 shrink-0" />
                <span className="text-slate-700 font-medium truncate flex-1">{config.company_address}</span>
              </div>
            )}

            {config.company_latitude && config.company_longitude ? (
              <div className="flex-1 flex flex-col space-y-1.5 min-h-[220px]">
                <div className="w-full flex-1 min-h-[180px] rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                  <iframe
                    title="Company Location Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(config.company_latitude)},${encodeURIComponent(config.company_longitude)}&z=15&output=embed`}
                  />
                </div>
                <div className="flex items-center justify-between pt-0.5 shrink-0">
                  <span className="text-[11px] text-slate-400">Interactive Google Map</span>
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(config.company_latitude)},${encodeURIComponent(config.company_longitude)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center gap-1.5">
                <div className="size-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">No Location Coordinates Set</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Click &ldquo;Edit Settings&rdquo; to add coordinates.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact, Social & SEO Details */}
        <div className="flex flex-col gap-5 h-full">
          {/* Contact Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3.5">
            <div className="flex items-center gap-2 border-b pb-3">
              <Phone className="size-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Contact details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Phone className="size-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone number</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5">
                    {config.company_phone || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Mail className="size-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email address</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                    {config.company_email || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Integrations */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-start space-y-3.5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Social integrations</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">All optional</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <MessageSquare className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">WhatsApp (Optional)</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                    {config.whatsapp_number || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Facebook className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Facebook URL (Optional)</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                    {config.facebook_url || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-pink-50 text-pink-600 shrink-0">
                  <Instagram className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Instagram URL (Optional)</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                    {config.instagram_url || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  <Twitter className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Twitter / X URL (Optional)</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                    {config.twitter_url || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-blue-50 text-[#0077b5] shrink-0">
                  <Linkedin className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">LinkedIn URL (Optional)</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                    {config.linkedin_url || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex items-center justify-center size-7 rounded-lg bg-red-50 text-red-600 shrink-0">
                  <Youtube className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">YouTube URL (Optional)</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                    {config.youtube_url || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>

        {/* SEO Defaults Section */}
        {(
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-start space-y-3.5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-sky-mist text-primary">
                  <Search className="size-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">SEO & Search Indexing</h3>
                <Badge variant="outline" className="text-[10px] bg-sky-mist/50 text-primary border-primary/20 font-medium">
                  Metadata
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-8 rounded-lg bg-sky-mist text-primary shrink-0 mt-0.5">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Global Title</span>
                  <span className="text-sm text-slate-700 font-semibold mt-0.5 break-words">
                    {config.site_meta_title || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-8 rounded-lg bg-sky-mist text-primary shrink-0 mt-0.5">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Global Description</span>
                  <span className="text-sm text-slate-600 leading-relaxed mt-1 break-words">
                    {config.site_meta_description || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-8 rounded-lg bg-sky-mist text-primary shrink-0 mt-0.5">
                  <Globe className="size-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Canonical Site URL</span>
                  <span className="text-sm text-slate-700 font-semibold mt-0.5 break-words">
                    {config.canonical_url || <span className="text-slate-400 italic font-normal">Not set (e.g. https://milanovatech.com)</span>}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-8 rounded-lg bg-sky-mist text-primary shrink-0 mt-0.5">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Global Keywords</span>
                  <span className="text-sm text-slate-700 font-semibold mt-0.5 break-words">
                    {config.site_meta_keywords || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>
              {config.site_og_image && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-sky-mist text-primary shrink-0 mt-0.5">
                    <Globe className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Global Social (OG) Image</span>
                    <a href={config.site_og_image} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline font-semibold mt-1 truncate max-w-xs block">
                      View Sharing Image
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Edit Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={(v) => setIsOpen(v)}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-250">
          <DialogHeader className="p-6 border-b shrink-0">
            <DialogTitle className="text-lg font-bold uppercase tracking-wide text-slate-800">Edit Site Configuration</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6 overflow-y-auto flex-1 max-h-[calc(90vh-140px)]">
            {/* Visual Assets (Brand Logo & Favicon) */}
            <div className="space-y-4 pt-1">
              <ImageUploadField
                ref={logoUploadRef}
                id="site-config-logo"
                value={formState.company_logo || ""}
                onChange={(url) => setFormState((prev) => ({ ...prev, company_logo: url }))}
                uploadAction={uploadCompanyLogo}
                label="Company Brand Logo"
                hint="PNG, JPEG, WebP or SVG max 5MB. Transparent background recommended."
                assetNoun="Brand Logo"
                acceptedLabel="Active Brand Logo"
                previewAlt="Brand Logo"
                deferUpload
              />

              <ImageUploadField
                ref={faviconUploadRef}
                id="site-config-favicon"
                value={formState.site_favicon || ""}
                onChange={(url) => setFormState((prev) => ({ ...prev, site_favicon: url }))}
                uploadAction={uploadSiteFavicon}
                label="Site Favicon (Browser Tab Icon - Optional)"
                hint="Square ICO, PNG, or SVG max 2MB. Defaults to Brand Logo if left unset."
                assetNoun="Favicon"
                acceptedLabel="Active Favicon"
                previewAlt="Site Favicon"
                deferUpload
                compact
              />
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Company Name :</Label>
                <Input value={formState.company_name ?? ""} onChange={(e) => handleFieldChange("company_name", e.target.value)} className="h-10" />
                {fieldErrors.company_name && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.company_name}</span>
                )}
              </div>
              <div className="col-span-full">
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Long Description (Footer) :</Label>
                <Textarea value={formState.company_description ?? ""} onChange={(e) => handleFieldChange("company_description", e.target.value)} className="min-h-20" />
                {fieldErrors.company_description && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.company_description}</span>
                )}
              </div>
              <div className="col-span-full">
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Short Description (Invoice Tagline) :</Label>
                <Input value={formState.company_short_description ?? ""} onChange={(e) => handleFieldChange("company_short_description", e.target.value)} className="h-10" />
                {fieldErrors.company_short_description && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.company_short_description}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Phone number :</Label>
                <Input value={formState.company_phone ?? ""} onChange={(e) => handleFieldChange("company_phone", e.target.value)} className="h-10" />
                {fieldErrors.company_phone && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.company_phone}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Email address :</Label>
                <Input type="email" value={formState.company_email ?? ""} onChange={(e) => handleFieldChange("company_email", e.target.value)} className="h-10" />
                {fieldErrors.company_email && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.company_email}</span>
                )}
              </div>
              <div className="col-span-full">
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Business address :</Label>
                <Input value={formState.company_address ?? ""} onChange={(e) => handleFieldChange("company_address", e.target.value)} className="h-10" />
                {fieldErrors.company_address && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.company_address}</span>
                )}
              </div>
              <div className="col-span-full">
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">
                  Map coordinates (Latitude, Longitude) (Optional) :
                </Label>
                <Input
                  value={coordinatesInput}
                  onChange={(e) => handleCoordinatesChange(e.target.value)}
                  placeholder="e.g. 23.8103, 90.4125"
                  className="h-10 font-mono text-sm"
                />
                {(fieldErrors.company_latitude || fieldErrors.company_longitude) && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">
                    {fieldErrors.company_latitude || fieldErrors.company_longitude}
                  </span>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter latitude and longitude separated by a comma (or copy-paste directly from Google Maps).
                </p>
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">WhatsApp support number (Optional) :</Label>
                <Input value={formState.whatsapp_number ?? ""} onChange={(e) => handleFieldChange("whatsapp_number", e.target.value)} placeholder="e.g. 01778277178" className="h-10" />
                {fieldErrors.whatsapp_number && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.whatsapp_number}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Facebook URL (Optional) :</Label>
                <Input value={formState.facebook_url ?? ""} onChange={(e) => handleFieldChange("facebook_url", e.target.value)} placeholder="https://facebook.com/..." className="h-10" />
                {fieldErrors.facebook_url && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.facebook_url}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Instagram URL (Optional) :</Label>
                <Input value={formState.instagram_url ?? ""} onChange={(e) => handleFieldChange("instagram_url", e.target.value)} placeholder="https://instagram.com/..." className="h-10" />
                {fieldErrors.instagram_url && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.instagram_url}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Twitter / X URL (Optional) :</Label>
                <Input value={formState.twitter_url ?? ""} onChange={(e) => handleFieldChange("twitter_url", e.target.value)} placeholder="https://x.com/..." className="h-10" />
                {fieldErrors.twitter_url && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.twitter_url}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">LinkedIn URL (Optional) :</Label>
                <Input value={formState.linkedin_url ?? ""} onChange={(e) => handleFieldChange("linkedin_url", e.target.value)} placeholder="https://linkedin.com/company/..." className="h-10" />
                {fieldErrors.linkedin_url && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.linkedin_url}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">YouTube URL (Optional) :</Label>
                <Input value={formState.youtube_url ?? ""} onChange={(e) => handleFieldChange("youtube_url", e.target.value)} placeholder="https://youtube.com/@..." className="h-10" />
                {fieldErrors.youtube_url && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.youtube_url}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Copyright Year :</Label>
                <Input value={formState.copyright_year ?? ""} onChange={(e) => handleFieldChange("copyright_year", e.target.value)} placeholder="e.g. 2026" className="h-10" />
                {fieldErrors.copyright_year && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.copyright_year}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Footer Copyright Text :</Label>
                <Input value={formState.footer_text ?? ""} onChange={(e) => handleFieldChange("footer_text", e.target.value)} placeholder="e.g. All rights reserved." className="h-10" />
                {fieldErrors.footer_text && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.footer_text}</span>
                )}
              </div>
              {(
                <>
                  <div className="col-span-full border-t pt-4 mt-2">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Search className="size-4 text-primary" />
                        SEO & Search Engine Indexing
                      </h4>
                    </div>
                  </div>
                  <div className="col-span-full">
                    <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Global SEO Title :</Label>
                    <Input
                      placeholder={formState.company_name || "MilanoVA Technologies"}
                      value={formState.site_meta_title ?? ""}
                      onChange={(e) => handleFieldChange("site_meta_title", e.target.value)}
                      className="h-10"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">If left empty, the company name will be used.</p>
                  </div>
                  <div className="col-span-full">
                    <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Global SEO Description :</Label>
                    <Textarea
                      placeholder={formState.company_short_description || "Short description..."}
                      value={formState.site_meta_description ?? ""}
                      onChange={(e) => handleFieldChange("site_meta_description", e.target.value)}
                      className="min-h-20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">If left empty, the company short description will be used.</p>
                  </div>
                  <div className="col-span-full">
                    <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Canonical Site URL :</Label>
                    <Input
                      placeholder="https://milanovatech.com"
                      value={formState.canonical_url ?? ""}
                      onChange={(e) => handleFieldChange("canonical_url", e.target.value)}
                      className="h-10"
                    />
                    {fieldErrors.canonical_url && (
                      <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.canonical_url}</span>
                    )}
                  </div>
                  <div className="col-span-full">
                    <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Global SEO Keywords (comma separated) :</Label>
                    <Input
                      value={formState.site_meta_keywords ?? ""}
                      onChange={(e) => handleFieldChange("site_meta_keywords", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="col-span-full">
                    <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Global Social Sharing (OG) Image URL :</Label>
                    <Input
                      placeholder={formState.company_logo || "/images/og-image.webp"}
                      value={formState.site_og_image ?? ""}
                      onChange={(e) => handleFieldChange("site_og_image", e.target.value)}
                      className="h-10"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">If left empty, the company logo will be used by default.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-slate-50/50 shrink-0 flex items-center justify-between gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase">
              <ShieldAlert className="size-3.5" />
              Uploads logo and config on Save
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsOpen(false)} disabled={saving} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold uppercase text-xs h-10 px-6">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="font-bold uppercase text-xs h-10 px-8 shadow-xs">
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
