"use client";

import React, { useState } from "react";
import RichTextEditor from "@/components/common/rich-text-editor";
import { Button } from "@/components/ui/button";
import { saveSiteConfig } from "@/services/settings/settings.service";
import { toast } from "sonner";
import { Save, FileText } from "lucide-react";

interface Props {
  pageKey: "terms_and_conditions" | "privacy_policy";
  pageTitle: string;
  initialContent: string;
}

export default function SettingsPagesClient({
  pageKey,
  pageTitle,
  initialContent,
}: Props) {
  const [savedContent, setSavedContent] = useState(initialContent);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveSiteConfig({ [pageKey]: content });
      if (res.success) {
        setSavedContent(content);
        toast.success(`${pageTitle} updated successfully.`);
      } else {
        toast.error(res.message || "Failed to update page content.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{pageTitle}</h3>
            <p className="text-xs text-muted-foreground">
              Modify the rich text content displayed on the client.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <Button
            onClick={handleSave}
            disabled={saving || content === savedContent}
            className="font-bold flex items-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <RichTextEditor
          value={content}
          onChange={(newContent) => setContent(newContent)}
          placeholder={`Write the ${pageTitle.toLowerCase()} here...`}
          className="min-h-[350px]"
        />
      </div>
    </div>
  );
}
