 
"use client";

import React, { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle, Layers } from "lucide-react";

interface Props {
  serviceOptions: string[];
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const EMPTY = {
  full_name: "",
  email: "",
  company_name: "",
  designation: "",
  country: "",
  mobile_number: "",
  message: "",
};

const inputClass =
  "w-full h-11 px-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors";

export default function ContactForm({ serviceOptions }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleService = (name: string) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.full_name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          service_requirements: selected,
          source_page_url: window.location.href,
          recaptchaToken: await getRecaptchaToken(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.message || "We could not send your message. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("sent");
      setForm(EMPTY);
      setSelected([]);
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <div className="p-10 rounded-2xl bg-slate-900/60 border border-emerald-500/30 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Message received</h2>
        <p className="text-slate-400">
          Thanks for reaching out — we will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Full Name *
          </label>
          <input
            id="contact-name"
            required
            maxLength={255}
            value={form.full_name}
            onChange={update("full_name")}
            className={inputClass}
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email *
          </label>
          <input
            id="contact-email"
            type="email"
            required
            maxLength={255}
            value={form.email}
            onChange={update("email")}
            className={inputClass}
            placeholder="jane@company.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-company" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Company
          </label>
          <input
            id="contact-company"
            maxLength={255}
            value={form.company_name}
            onChange={update("company_name")}
            className={inputClass}
            placeholder="Acme S.p.A."
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-designation" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Role / Designation
          </label>
          <input
            id="contact-designation"
            maxLength={255}
            value={form.designation}
            onChange={update("designation")}
            className={inputClass}
            placeholder="CTO"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-country" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Country
          </label>
          <input
            id="contact-country"
            maxLength={100}
            value={form.country}
            onChange={update("country")}
            className={inputClass}
            placeholder="Italy"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-mobile" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mobile
          </label>
          <input
            id="contact-mobile"
            maxLength={50}
            value={form.mobile_number}
            onChange={update("mobile_number")}
            className={inputClass}
            placeholder="+39 ..."
          />
        </div>
      </div>

      {serviceOptions.length > 0 && (
        <div className="mt-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            What do you need? (optional)
          </span>
          <div className="flex flex-wrap gap-2">
            {serviceOptions.map((name) => {
              const active = selected.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleService(name)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "bg-cyan-500 text-slate-950 border-cyan-500 font-bold"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-cyan-500/50"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-1.5">
        <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Project Details
        </label>
        <textarea
          id="contact-message"
          rows={6}
          maxLength={5000}
          value={form.message}
          onChange={update("message")}
          className={`${inputClass} h-auto py-3 resize-y`}
          placeholder="What are you building, and by when?"
        />
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}

/**
 * reCAPTCHA v3 token, only when a site key is configured. The backend's
 * RecaptchaGuard short-circuits when RECAPTCHA_SECRET_KEY is absent, so the form
 * must not demand a widget it cannot supply.
 */
async function getRecaptchaToken(): Promise<string | undefined> {
  if (!RECAPTCHA_SITE_KEY || typeof window === "undefined") return undefined;

  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-recaptcha="${key}"]`);
    if (existing) return resolve();
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${key}`;
    script.async = true;
    script.dataset.recaptcha = key;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("reCAPTCHA failed to load"));
    document.head.appendChild(script);
  });

  const grecaptcha = (window as Window & {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (key: string, opts: { action: string }) => Promise<string>;
    };
  }).grecaptcha;
  if (!grecaptcha) return undefined;

  return new Promise<string | undefined>((resolve) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute(key, { action: "contact" })
        .then((token: string) => resolve(token))
        .catch(() => resolve(undefined));
    });
  });
}
