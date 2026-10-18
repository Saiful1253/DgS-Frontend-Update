export type CtaKind = "phone" | "whatsapp" | "link";

export interface ResolvedCta {
  href: string;
  kind: CtaKind;
  target?: string;
  rel?: string;
  displayLabel: string;
}

export const digitsOnly = (v: string): string => v.replace(/[^\d+]/g, "");

export function isPhone(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim();
  if (/^tel:/i.test(v)) return true;
  // Strip common prefixes like "call:", "phone:", etc.
  const cleaned = v.replace(/^(tel|call|phone|mobile)[:\s-]*/i, "").trim();
  const digits = cleaned.replace(/[^\d]/g, "");
  // Standard phone numbers have 6 to 16 digits
  if (digits.length >= 6 && digits.length <= 16) {
    // Only contains allowed phone characters: +, numbers, spaces, dashes, dots, parentheses
    if (/^[+\d\s().-]+$/.test(cleaned)) {
      return true;
    }
  }
  return false;
}

export function extractPhone(value?: string | null): string {
  if (!value) return "";
  const v = value.trim().replace(/^tel:/i, "");
  const cleaned = v.replace(/^(tel|call|phone|mobile)[:\s-]*/i, "").trim();
  const digits = digitsOnly(cleaned);
  if (cleaned.startsWith("+")) {
    return `+${digits.replace(/^\+/, "")}`;
  }
  return digits;
}

export function isWhatsApp(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim();
  return /whatsapp|wa\.me/i.test(v);
}

export function extractWhatsApp(value?: string | null): string {
  if (!value) return "";
  const v = value.trim();
  const num = v.match(/(?:wa\.me\/|whatsapp\.com\/send\?phone=|whatsapp:\/\/send\?phone=)([\d+]+)/i)?.[1];
  if (num) return `https://wa.me/${digitsOnly(num).replace(/^\+/, "")}`;
  if (/^https?:/i.test(v)) return v;
  return `https://wa.me/${digitsOnly(v).replace(/^\+/, "")}`;
}

export function resolveCta(
  link?: string | null,
  label?: string | null
): ResolvedCta {
  const l = (link || "").trim();
  const lb = (label || "").trim();

  // If both empty
  if (!l && !lb) {
    return { href: "#", kind: "link", displayLabel: "" };
  }

  // Display label: prioritize label, fallback to link
  const displayLabel = lb || l;

  // 1. WhatsApp in link or label
  if (isWhatsApp(l)) {
    return {
      href: extractWhatsApp(l),
      kind: "whatsapp",
      target: "_blank",
      rel: "noopener noreferrer",
      displayLabel,
    };
  }
  if (!l && isWhatsApp(lb)) {
    return {
      href: extractWhatsApp(lb),
      kind: "whatsapp",
      target: "_blank",
      rel: "noopener noreferrer",
      displayLabel,
    };
  }

  // 2. Phone in link
  if (isPhone(l)) {
    const phone = extractPhone(l);
    return {
      href: `tel:${phone}`,
      kind: "phone",
      displayLabel,
    };
  }

  // 3. Phone in label (when link is empty or '#')
  if ((!l || l === "#") && isPhone(lb)) {
    const phone = extractPhone(lb);
    return {
      href: `tel:${phone}`,
      kind: "phone",
      displayLabel,
    };
  }

  // 4. Web link
  if (l && l !== "#") {
    if (/^mailto:/i.test(l)) {
      return { href: l, kind: "link", displayLabel };
    }
    if (l.startsWith("#") || l.startsWith("/")) {
      return { href: l, kind: "link", displayLabel };
    }
    if (/^https?:\/\//i.test(l)) {
      return {
        href: l,
        kind: "link",
        target: "_blank",
        rel: "noopener noreferrer",
        displayLabel,
      };
    }
    // Matches domain pattern like example.com or sub.example.co.uk
    if (/^[\w-]+\.[a-z]{2,}/i.test(l)) {
      return {
        href: `https://${l}`,
        kind: "link",
        target: "_blank",
        rel: "noopener noreferrer",
        displayLabel,
      };
    }
    return {
      href: l,
      kind: "link",
      target: "_blank",
      rel: "noopener noreferrer",
      displayLabel,
    };
  }

  // Fallback if label is a phone number even if link is something unexpected
  if (isPhone(lb)) {
    return {
      href: `tel:${extractPhone(lb)}`,
      kind: "phone",
      displayLabel,
    };
  }

  return { href: l || "#", kind: "link", displayLabel };
}
