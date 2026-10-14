import { NextResponse } from "next/server";
import { publicFetch } from "@/lib/server-fetch";

const MAX_LENGTHS: Record<string, number> = {
  full_name: 255,
  email: 255,
  company_name: 255,
  designation: 255,
  country: 100,
  mobile_number: 50,
  message: 5000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public contact form → `POST /leads/inquiry`.
 *
 * The four CTAs on the site (navbar desktop + mobile, services page, company
 * page) all pointed at /contact, which did not exist — every one of them 404'd.
 * The form posts here so the backend URL stays server-side; the backend's
 * RecaptchaGuard is a no-op unless RECAPTCHA_SECRET_KEY is configured, and this
 * handler only forwards `recaptchaToken` when the site key produced one.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }

  const fullName = String(body.full_name ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (!fullName || !email) {
    return NextResponse.json(
      { success: false, message: "Name and email are required" },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { success: false, message: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {
    type: "contact",
    source_channel: "website_contact_page",
    full_name: fullName.slice(0, MAX_LENGTHS.full_name),
    email: email.slice(0, MAX_LENGTHS.email),
  };

  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (field === "full_name" || field === "email") continue;
    const value = body[field];
    if (typeof value === "string" && value.trim()) {
      payload[field] = value.trim().slice(0, max);
    }
  }

  if (Array.isArray(body.service_requirements)) {
    const selected = body.service_requirements
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .slice(0, 25);
    if (selected.length) payload.service_requirements = selected;
  }

  if (typeof body.source_page_url === "string" && body.source_page_url.trim()) {
    payload.source_page_url = body.source_page_url.trim().slice(0, 500);
  }

  if (typeof body.recaptchaToken === "string" && body.recaptchaToken.trim()) {
    payload.recaptchaToken = body.recaptchaToken.trim();
  }

  try {
    const res = await publicFetch.post("/leads/inquiry", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    let data: { message?: string | string[] } | null = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const message =
        data?.message ??
        (Array.isArray(data?.message) ? data.message.join(", ") : undefined) ??
        "We could not send your message. Please try again.";
      return NextResponse.json({ success: false, message }, { status: res.status });
    }

    return NextResponse.json(
      { success: true, message: "Thanks — we will be in touch shortly." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Contact service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
