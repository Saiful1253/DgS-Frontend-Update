/**
 * Server-only English → Bangla translation.
 *
 * Combines an instant static dictionary for common brand & UI phrases with
 * multi-client Google Translate fallback. Results are memoised in a module-level
 * cache so strings are translated once per server process.
 */

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const CLIENT_KEYS = ["dict-chrome-ex", "gtrans", "gtx"] as const;

const MAX_CACHE_ENTRIES = 12000;
const MAX_BATCH_CHARS = 1000;
const MAX_CONCURRENCY = 3;
const FETCH_TIMEOUT_MS = 12000;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

export function toBanglaDigits(str: string): string {
  return str.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);
}

export function postProcessBangla(str: string): string {
  let s = str;
  s = s.replace(/Milanova Technologies/gi, "মিলানোভা টেকনোলজিস");
  s = s.replace(/Milanova/gi, "মিলানোভা");
  s = s.replace(/Digital Gas Service/gi, "ডিজিটাল গ্যাস সার্ভিস");
  s = toBanglaDigits(s);
  return s;
}

export const STATIC_DICTIONARY: Record<string, string> = {
  // Navigation & Branding
  "Home": "হোম",
  "About": "আমাদের সম্পর্কে",
  "About Us": "আমাদের সম্পর্কে",
  "Company": "কোম্পানি",
  "Services": "সেবাসমূহ",
  "Our Services": "আমাদের সেবাসমূহ",
  "Products": "পণ্যসমূহ",
  "All Products": "সকল পণ্য",
  "Certificates": "সনদপত্রসমূহ",
  "Certifications": "সনদপত্রসমূহ",
  "Accreditations": "অনুমোদনসমূহ",
  "Portfolio": "পোর্টফোলিও",
  "Projects": "প্রকল্পসমূহ",
  "Blogs": "ব্লগ",
  "Blog": "ব্লগ",
  "Articles": "প্রবন্ধসমূহ",
  "Contact": "যোগাযোগ",
  "Contact Us": "যোগাযোগ করুন",
  "Digital Gas Service": "ডিজিটাল গ্যাস সার্ভিস",
  "Milanova Technologies": "মিলানোভা টেকনোলজিস",
  "Milanova": "মিলানোভা",
  "English": "English",
  "Bangla": "বাংলা",

  // CTAs & Actions
  "Get a Quote": "কোটেশন পান",
  "Request a Quote": "কোটেশন অনুরোধ করুন",
  "Explore Services": "সেবাসমূহ দেখুন",
  "Explore": "অন্বেষণ করুন",
  "Call Us": "কল করুন",
  "Call Now": "এখনই কল করুন",
  "Emergency Call": "জরুরী কল",
  "WhatsApp": "হোয়াটসঅ্যাপ",
  "Read More": "আরও পড়ুন",
  "Learn More": "আরও জানুন",
  "View All": "সব দেখুন",
  "View Details": "বিস্তারিত দেখুন",
  "View Certificate": "সনদপত্র দেখুন",
  "Download": "ডাউনলোড",
  "Download Document": "নথি ডাউনলোড",
  "Submit": "জমা দিন",
  "Send Message": "বার্তা পাঠান",
  "Search": "অনুসন্ধান",
  "Search Products": "পণ্য অনুসন্ধান করুন",
  "Search…": "অনুসন্ধান…",
  "Clear": "মুছে ফেলুন",
  "Close": "বন্ধ করুন",
  "Back": "পেছনে",
  "Next": "পরবর্তী",
  "Previous": "পূর্ববর্তী",
  "Load More": "আরও দেখুন",
  "Loading…": "লোড হচ্ছে…",

  // Accreditations & Section Labels
  "LEGAL ACCREDITATIONS": "আইনি স্বীকৃতি ও অনুমোদন",
  "Government & Regulatory Certifications": "সরকারি ও নিয়ন্ত্রণকারী সনদপত্রসমূহ",
  "Bangladesh Govt. Approved": "বাংলাদেশ সরকার অনুমোদিত",
  "Verified & Active License": "যাচাইকৃত ও সক্রিয় লাইসেন্স",
  "Fire Safety Standard": "অগ্নি নিরাপত্তা মান",
  "Global Accreditation": "আন্তর্জাতিক স্বীকৃতি",
  "Need Regulatory Approvals?": "আইনি বা নিয়ন্ত্রণকারী অনুমোদন প্রয়োজন?",
  "Get Approval Support": "অনুমোদন সহায়তা নিন",
  "Titas Gas 1st Class License": "তিতাস গ্যাস ১ম শ্রেণির লাইসেন্স",
  "Titas Gas 1st Class Contractor License": "তিতাস গ্যাস ১ম শ্রেণির ঠিকাদার লাইসেন্স",
  "Department of Explosives Approval": "বিস্ফোরক পরিদপ্তর অনুমোদন",
  "Dept of Explosives Bulk Gas Approval": "বিস্ফোরক বাল্ক গ্যাস অনুমোদন বিভাগ",
  "Fire Service & Civil Defence NOC": "ফায়ার সার্ভিস ও সিভিল ডিফেন্স এনওসি",
  "ISO 9001:2015 Quality Management": "আইএসও ৯০০১:২০১৫ কোয়ালিটি ম্যানেজমেন্ট",
  "BERC Registered Contractor": "বিইআরসি তালিকাভুক্ত ঠিকাদার",
  "BERC Registered Gas Contractor": "বিইআরসি নিবন্ধিত গ্যাস ঠিকাদার",
  "Download PDF": "পিডিএফ ডাউনলোড",
  "Download PDF Document": "পিডিএফ নথি ডাউনলোড",
  "Request a copy": "একটি অনুলিপি অনুরোধ করুন",
  "Legal Accreditations": "আইনি স্বীকৃতি ও অনুমোদন",
  "Verify with the issuing authority": "ইস্যুকারী কর্তৃপক্ষের সাথে যাচাই করুন",
  "Certificate viewer": "সনদপত্র প্রদর্শনকারী",
  "Issuing authority": "ইস্যুকারী কর্তৃপক্ষ",
  "The scanned document for this certificate is available on request — ask us and we will send a copy along with its verification details.": "এই সনদপত্রের স্ক্যান করা কপি অনুরোধ সাপেক্ষে পাওয়া যাবে — আমাদের বলুন এবং আমরা যাচাইকরণের বিবরণ সহ একটি অনুলিপি পাঠাব।",

  // Services & Engineering Specialty
  "FLAGSHIP ENGINEERING SPECIALTY • #1 TURNKEY RETICULATION CONTRACTOR": "প্রধান ইঞ্জিনিয়ারিং বিশেষত্ব • ১ নম্বর টার্নকি রেটিকুলেশন ঠিকাদার",
  "BNBC 2020 & NFPA 58 CERTIFIED": "BNBC ২০২০ ও NFPA ৫৮ সার্টিফাইড",
  "500+ RESIDENTIAL & COMMERCIAL TOWERS": "৫০০+ আবাসিক ও বাণিজ্যিক টাওয়ার",
  "HIGHEST DEMAND IN BD": "বাংলাদেশে সর্বোচ্চ চাহিদাসম্পন্ন",
  "Automated Digital Vaporizer & Dual Regulator": "অটোমেটেড ডিজিটাল ভ্যাপোরাইজার ও ডুয়াল রেগুলেটর",
  "AUTO-FAILSAFE": "অটো-ফেইলসেফ",
  "NATIONAL LEADER IN RETICULATION SYSTEMS": "রেটিকুলেশন সিস্টেমে জাতীয় পথিকৃৎ",
  "Central LPG Reticulation System": "সেন্ট্রাল এলপিজি রেটিকুলেশন সিস্টেম",
  "Auto-Regulated Manifold": "স্বয়ংক্রিয় নিয়ন্ত্রিত ম্যানিফোল্ড",
  "Dual stage regulators & automated multi-cylinder vaporizers for seamless constant pressure.": "অবিচ্ছিন্ন স্থির চাপের জন্য ডুয়াল স্টেজ রেগুলেটর এবং স্বয়ংক্রিয় মাল্টি-সিলিন্ডার ভ্যাপোরাইজার।",
  "Prepaid Smart LoRa Meters": "প্রিপেইড স্মার্ট লোরা মিটার",
  "Individual prepaid telemetry digital meters per apartment with remote top-up and billing.": "রিমোট টপ-আপ এবং বিলিং সহ অ্যাপার্টমেন্ট প্রতি পৃথক প্রিপেইড টেলিমেট্রি ডিজিটাল মিটার।",
  "Automated Safety Shut-Off": "স্বয়ংক্রিয় সুরক্ষা শাট-অফ",
  "Optical sniffer sensors with fast solenoid shut-off valves at apartment and bank intake.": "অ্যাপার্টমেন্ট ও ব্যাংক ইনটেকে দ্রুত সোলেনয়েড শাট-অফ ভালভ সহ অপটিক্যাল স্নিফার সেন্সর।",
  "100% Hydro-Tested & Certified": "১০০% হাইড্রো-পরীক্ষিত ও প্রত্যয়িত",
  "Full nitrogen purging, hydrostatic testing up to 1.5x operating limit, and Titas Gas licensing liaison.": "পূর্ণ নাইট্রোজেন পার্জিং, কার্যসীমার ১.৫ গুণ পর্যন্ত হাইড্রোস্ট্যাটিক পরীক্ষা এবং তিতাস গ্যাস লাইসেন্সিং সমন্বয়।",
  "NFPA 58 • BNBC Code 2020 • Dept. of Explosives Approved": "NFPA ৫৮ • BNBC কোড ২০২০ • বিস্ফোরক অধিদপ্তর অনুমোদিত",
  "Request Reticulation Design Blueprint & Audit": "রেটিকুলেশন ডিজাইন ব্লুপ্রিন্ট ও অডিট অনুরোধ করুন",
  "Direct Expert Hotline": "সরাসরি বিশেষজ্ঞ হটলাইন",
  "ADDITIONAL SPECIALIZED ENGINEERING & PIPELINE NETWORKS": "অতিরিক্ত বিশেষায়িত প্রকৌশল ও পাইপলাইন নেটওয়ার্ক",
  "Turnkey Industrial & Regulatory Services": "টার্নকি শিল্প ও নিয়ন্ত্রক পরিষেবা",
  "AutoGas Plant & Pipeline": "অটোগ্যাস প্ল্যান্ট ও পাইপলাইন",
  "Industrial Pipe Network": "শিল্প পাইপ নেটওয়ার্ক",
  "Utility Gas (RMS & TBS)": "ইউটিলিটি গ্যাস (আরএমএস ও টিবিএস)",
  "Fire Hydrant & Safety Grids": "ফায়ার হাইড্রেন্ট ও সুরক্ষা গ্রিড",
  "Explosives approved bullet tanks": "বিস্ফোরক অধিদপ্তর অনুমোদিত বুলেট ট্যাংক",
  "ATEX certified wiring & barriers": "ATEX প্রত্যয়িত ওয়্যারিং ও বাধা",
  "Seamless Sch 40/80 carbon steel": "সিমলেস Sch 40/80 কার্বন স্টিল",
  "100% X-ray certified weld tests": "১০০% এক্স-রে প্রত্যয়িত ওয়েল্ড পরীক্ষা",
  "RMS station assembly & testing": "আরএমএস স্টেশন সংযোজন ও পরীক্ষা",
  "Direct utility load approval liaison": "সরাসরি ইউটিলিটি লোড অনুমোদন সমন্বয়",
  "NFPA 20 industrial pump houses": "NFPA ২০ শিল্প পাম্প হাউস",
  "Fire Service NOC clearance": "ফায়ার সার্ভিস এনওসি ছাড়পত্র",
  "Station Specs": "স্টেশন স্পেক্স",
  "Explore Piping": "পাইপিং এক্সপ্লোর করুন",
  "RMS Licensing": "আরএমএস লাইসেন্সিং",
  "Inspect Hydrants": "হাইড্রেন্ট পরিদর্শন করুন",
  "Turnkey Blueprint": "টার্নকি ব্লুপ্রিন্ট",
  "Industrial Grade": "শিল্প মানসম্পন্ন",
  "Titas Enlisted": "তিতাস তালিকাভুক্ত",
  "Certified Safety": "প্রত্যয়িত সুরক্ষা",
  "Govt. Certified": "সরকারি প্রত্যয়িত",

  // Common UI & Footer
  "Quick Links": "দ্রুত লিঙ্ক",
  "All Rights Reserved": "সর্বস্বত্ব সংরক্ষিত",
  "Privacy Policy": "গোপনীয়তা নীতি",
  "Terms & Conditions": "শর্তাবলী",
  "Terms of Service": "ব্যবহারের শর্তাবলী",
  "Email": "ইমেইল",
  "Phone": "ফোন",
  "Address": "ঠিকানা",
  "Head Office": "প্রধান কার্যালয়",
  "Branch Office": "শাখা কার্যালয়",
  "Follow Us": "আমাদের ফলো করুন",
};

const cache = new Map<string, string>();

// Pre-fill cache with dictionary
for (const [k, v] of Object.entries(STATIC_DICTIONARY)) {
  cache.set(k.trim().toLowerCase().replace(/\s+/g, " "), v);
}

function normalizeCore(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function cacheGet(key: string): string | undefined {
  const norm = key.toLowerCase();
  const value = cache.get(norm);
  if (value === undefined) return undefined;
  cache.delete(norm);
  cache.set(norm, value);
  return value;
}

function cacheSet(key: string, value: string): void {
  const norm = key.toLowerCase();
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(norm, value);
}

async function fetchWithTimeout(text: string): Promise<string> {
  let lastError: unknown = null;

  for (const client of CLIENT_KEYS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      const url = `${ENDPOINT}?client=${client}&sl=en&tl=bn&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "user-agent": ua,
          "accept": "*/*",
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        lastError = new Error(`translate ${client} status ${res.status}`);
        continue;
      }

      const json: unknown = await res.json();
      const segments = Array.isArray(json) && Array.isArray((json as unknown[])[0])
        ? ((json as unknown[])[0] as unknown[])
        : [];

      const output = segments
        .map((seg) => (Array.isArray(seg) ? String(seg[0] ?? "") : ""))
        .join("");

      if (output && output.trim()) {
        return output;
      }
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error("All translation clients failed");
}

async function fetchTranslation(text: string): Promise<string> {
  return fetchWithTimeout(text);
}

/** Translate a batch of single-line strings in one request. */
async function translateChunk(texts: string[]): Promise<string[]> {
  if (texts.length === 1) {
    return [await fetchTranslation(texts[0])];
  }

  try {
    const joined = texts.join("\n");
    const output = await fetchTranslation(joined);
    const lines = output.split("\n");

    if (lines.length === texts.length) {
      return lines;
    }
  } catch {}

  // Fallback to sequential translation if batch split is mismatched or fails
  const results: string[] = [];
  for (const text of texts) {
    try {
      results.push(await fetchTranslation(text));
    } catch {
      results.push(text);
    }
  }
  return results;
}

export async function translateToBangla(texts: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const misses: string[] = [];
  const seen = new Set<string>();

  for (const raw of texts) {
    if (typeof raw !== "string") continue;
    const key = normalizeCore(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const cached = cacheGet(key);
    if (cached !== undefined) {
      result[key] = cached;
      continue;
    }
    misses.push(key);
  }

  if (misses.length === 0) {
    return result;
  }

  const batchable = misses.filter((t) => !t.includes("\n") && t.length <= 800);
  const solo = misses.filter((t) => t.includes("\n") || t.length > 800);

  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const text of batchable) {
    const cost = text.length + 1;
    if (current.length > 0 && currentLength + cost > MAX_BATCH_CHARS) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(text);
    currentLength += cost;
  }
  if (current.length > 0) chunks.push(current);

  for (const text of solo) {
    chunks.push([text]);
  }

  let next = 0;
  const worker = async () => {
    while (next < chunks.length) {
      const chunk = chunks[next++];
      try {
        const translated = await translateChunk(chunk);
        chunk.forEach((source, index) => {
          const value = translated[index];
          if (value) {
            const processed = postProcessBangla(value);
            result[source] = processed;
            cacheSet(source, processed);
          }
        });
      } catch {
        // Individual chunk failure; continues
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENCY, Math.max(1, chunks.length)) }, worker),
  );

  for (const [k, v] of Object.entries(result)) {
    result[k] = postProcessBangla(v);
  }

  return result;
}
