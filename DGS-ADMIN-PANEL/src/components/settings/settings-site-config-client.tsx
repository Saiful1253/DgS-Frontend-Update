"use client";

import React, { useState } from "react";
import { SiteConfig } from "@/types/settings";
import { saveSiteConfig, uploadCompanyLogo } from "@/services/settings/settings.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit2, UploadCloud, Globe, Phone, Mail, MapPin, MessageSquare, Facebook, Instagram, Twitter, FileText, ShieldAlert, Search } from "lucide-react";
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
  const [tempLogoFile, setTempLogoFile] = useState<File | null>(null);
  const [tempLogoUrl, setTempLogoUrl] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Temporary Form States inside Modal
  const [formState, setFormState] = useState<SiteConfig>({ ...initialConfig });

  const handleOpenModal = () => {
    setFormState({ ...config });
    setTempLogoFile(null);
    setTempLogoUrl("");
    setFieldErrors({});
    setIsOpen(true);
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

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTempLogoFile(file);
    setTempLogoUrl(URL.createObjectURL(file));
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

      // Upload logo first if a new file is chosen
      if (tempLogoFile) {
        const formData = new FormData();
        formData.append("file", tempLogoFile);
        const uploadRes = await uploadCompanyLogo(formData);
        if (uploadRes.success && uploadRes.data?.url) {
          finalConfig.company_logo = uploadRes.data.url;
          if (uploadRes.data.public_id) {
            finalConfig.company_logo_public_id = uploadRes.data.public_id;
          }
        } else {
          toast.error(uploadRes.message || "Failed to upload logo");
          setSaving(false);
          return;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mt-2">Site Configuration</h2>
          <p className="text-sm font-medium text-muted-foreground">Manage company branding, logo, locations, and social media integrations.</p>
        </div>
        <Button 
          onClick={handleOpenModal} 
          variant="secondary" 
          className="font-bold uppercase text-xs h-10 px-8 shadow-sm"
        >
          <Edit2 className="size-3.5 mr-1" />
          Edit Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* General Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 h-full flex flex-col justify-start">
          <div className="flex items-center gap-2 border-b pb-3">
            <Globe className="size-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Company Identity</h3>
          </div>

          {/* Logo & Company Name Header Section */}
          <div className="flex flex-col items-center text-center border-b pb-5">
            {/* Logo container */}
            <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 mb-3">
              {config.company_logo ? (
                <Image src={config.company_logo} alt="Company Logo" fill sizes="96px" className="object-contain p-2" />
              ) : (
                <div className="text-slate-300 flex flex-col items-center justify-center">
                  <UploadCloud className="size-8" />
                  <span className="text-[10px] mt-1 font-semibold uppercase tracking-wider">No Logo</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Company Name</span>
              <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                {config.company_name || <span className="text-slate-400 italic font-normal">Not set</span>}
              </span>
            </div>
          </div>

          {/* Company Details Stack */}
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <MessageSquare className="size-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Short Description (Invoice Tagline)</span>
                <span className="text-sm text-slate-700 font-semibold mt-0.5 break-words">
                  {config.company_short_description || <span className="text-slate-400 italic font-normal">Not set</span>}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                <FileText className="size-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Long Description (Footer)</span>
                <span className="text-sm text-slate-600 leading-relaxed mt-1 whitespace-pre-wrap break-words">
                  {config.company_description || <span className="text-slate-400 italic font-normal">Not set</span>}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                <FileText className="size-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Copyright Year</span>
                <span className="text-sm text-slate-700 font-semibold mt-0.5">
                  {config.copyright_year || <span className="text-slate-400 italic font-normal">2026 (Fallback)</span>}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                <FileText className="size-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Footer Copyright Text</span>
                <span className="text-sm text-slate-700 font-semibold mt-0.5">
                  {config.footer_text || <span className="text-slate-400 italic font-normal">All rights reserved. (Fallback)</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Social Details */}
        <div className="flex flex-col gap-6 h-full">
          {/* Contact Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col justify-start space-y-6">
          <div className="flex items-center gap-2 border-b pb-3">
            <Phone className="size-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Contact details</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <Phone className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone number</span>
                <span className="text-sm font-semibold text-slate-800 mt-0.5">
                  {config.company_phone || <span className="text-slate-400 italic font-normal">Not set</span>}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <Mail className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email address</span>
                <span className="text-sm font-semibold text-slate-800 mt-0.5">
                  {config.company_email || <span className="text-slate-400 italic font-normal">Not set</span>}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 col-span-full">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <MapPin className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Business address</span>
                <span className="text-sm font-semibold text-slate-800 mt-0.5">
                  {config.company_address || <span className="text-slate-400 italic font-normal">Not set</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Integrations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col justify-start space-y-6">
          <div className="flex items-center gap-2 border-b pb-3">
            <MessageSquare className="size-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Social integrations</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <MessageSquare className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">WhatsApp support number</span>
                <span className="text-sm font-semibold text-slate-800 mt-0.5">
                  {config.whatsapp_number || <span className="text-slate-400 italic font-normal">Not set</span>}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <Facebook className="size-4" />
              </div>
              <div className="flex flex-col max-w-[200px] sm:max-w-xs overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Facebook URL</span>
                <span className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                  {config.facebook_url || <span className="text-slate-400 italic font-normal">Not set</span>}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <Instagram className="size-4" />
              </div>
              <div className="flex flex-col max-w-[200px] sm:max-w-xs overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Instagram URL</span>
                <span className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                  {config.instagram_url || <span className="text-slate-400 italic font-normal">Not set</span>}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-col sm:flex-row gap-4">
                <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Twitter className="size-4" />
                </div>
                <div className="flex flex-col max-w-[200px] sm:max-w-xs overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Twitter URL</span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                    {config.twitter_url || <span className="text-slate-400 italic font-normal">Not set</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Defaults Section */}
        {(
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col justify-start space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-sky-mist text-primary">
                  <Search className="size-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">SEO & Search Indexing</h3>
                <Badge variant="outline" className="text-[10px] bg-sky-mist/50 text-primary border-primary/20 font-medium">
                  Metadata
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5">
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
            {/* Logo uploader */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                {tempLogoUrl ? (
                  <Image src={tempLogoUrl} alt="Logo preview" fill sizes="96px" className="object-contain p-1.5" />
                ) : formState.company_logo ? (
                  <Image src={formState.company_logo} alt="Logo current" fill sizes="96px" className="object-contain p-1.5" />
                ) : (
                  <UploadCloud className="size-8 text-slate-300" />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-slate-600 block">Brand Logo image</Label>
                <input type="file" accept="image/*" id="modal-logo-file" onChange={handleLogoFileChange} className="hidden" />
                <label htmlFor="modal-logo-file" className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold uppercase text-slate-700 cursor-pointer shadow-sm transition">
                  <UploadCloud className="size-3.5" />
                  Choose File
                </label>
                <p className="text-[10px] text-slate-400 font-medium">PNG or JPEG format suggested. Replaces old logo on save.</p>
              </div>
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
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">WhatsApp support number :</Label>
                <Input value={formState.whatsapp_number ?? ""} onChange={(e) => handleFieldChange("whatsapp_number", e.target.value)} placeholder="e.g. 8801711000000" className="h-10" />
                {fieldErrors.whatsapp_number && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.whatsapp_number}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Facebook URL :</Label>
                <Input value={formState.facebook_url ?? ""} onChange={(e) => handleFieldChange("facebook_url", e.target.value)} className="h-10" />
                {fieldErrors.facebook_url && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.facebook_url}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Instagram URL :</Label>
                <Input value={formState.instagram_url ?? ""} onChange={(e) => handleFieldChange("instagram_url", e.target.value)} className="h-10" />
                {fieldErrors.instagram_url && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.instagram_url}</span>
                )}
              </div>
              <div>
                <Label className="block text-xs font-medium text-slate-500 mb-1 italic">Twitter URL :</Label>
                <Input value={formState.twitter_url ?? ""} onChange={(e) => handleFieldChange("twitter_url", e.target.value)} className="h-10" />
                {fieldErrors.twitter_url && (
                  <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">{fieldErrors.twitter_url}</span>
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
