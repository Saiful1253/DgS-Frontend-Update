"use client";

import { useEffect, useRef } from "react";

import { useLanguage } from "@/context/LanguageContext";
import { translateTextsAction } from "@/actions/translate.actions";
import { postProcessBangla, STATIC_DICTIONARY } from "@/lib/translate";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "IFRAME",
  "SVG",
  "PATH",
]);

const SKIP_SELECTOR = '[data-no-translate], [translate="no"]';
const TRANS_ATTRS = ["placeholder", "title", "alt", "aria-label", "aria-description"] as const;

export const clientCache = new Map<string, string>();

// Pre-fill client cache with the static dictionary so modal & UI text translates synchronously
for (const [key, value] of Object.entries(STATIC_DICTIONARY)) {
  const norm = key.trim().replace(/\s+/g, " ");
  clientCache.set(norm, value);
  clientCache.set(norm.toLowerCase(), value);
}

function normalizeCore(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function isTranslatable(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return false;
  if (SKIP_TAGS.has(parent.tagName)) return false;
  if (parent.isContentEditable) return false;
  if (parent.closest(SKIP_SELECTOR)) return false;
  return /\S/.test(node.nodeValue ?? "");
}

function collectTextNodes(root: Node, out: Text[]): void {
  if (root.nodeType === Node.TEXT_NODE) {
    const text = root as Text;
    if (isTranslatable(text)) out.push(text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current: Node | null;
  while ((current = walker.nextNode())) {
    const text = current as Text;
    if (isTranslatable(text)) out.push(text);
  }
}

type AttrItem = {
  el: Element;
  attr: (typeof TRANS_ATTRS)[number];
  raw: string;
  core: string;
};

function collectAttrItems(root: Node, out: AttrItem[]): void {
  if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    const elRoot = root as Element;
    elRoot.querySelectorAll("*").forEach((n) => out.push(...getAttrs(n)));
  }
  if (root.nodeType === Node.ELEMENT_NODE) out.push(...getAttrs(root as Element));
}

function getAttrs(el: Element): AttrItem[] {
  if (el.closest(SKIP_SELECTOR)) return [];
  if (SKIP_TAGS.has(el.tagName)) return [];
  if ((el as HTMLElement).isContentEditable) return [];
  const list: AttrItem[] = [];
  for (const attr of TRANS_ATTRS) {
    if (!el.hasAttribute(attr)) continue;
    const raw = el.getAttribute(attr) ?? "";
    if (!/\S/.test(raw)) continue;
    list.push({ el, attr, raw, core: normalizeCore(raw) });
  }
  return list;
}

export default function AutoTranslate() {
  const { locale } = useLanguage();
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const touchedRef = useRef<Set<Text>>(new Set());
  const attrOriginalsRef = useRef<WeakMap<Element, Map<string, string>>>(new WeakMap());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originals = originalsRef.current;
    const touched = touchedRef.current;
    const attrOriginals = attrOriginalsRef.current;

    const getAttrMap = (el: Element): Map<string, string> => {
      let m = attrOriginals.get(el);
      if (!m) {
        m = new Map();
        attrOriginals.set(el, m);
      }
      return m;
    };

    const applyCached = (groups: Map<string, Text[]>, attrGroups: Map<string, AttrItem[]>) => {
      for (const [core, bucket] of groups) {
        let translated = clientCache.get(core);
        if (translated) {
          translated = postProcessBangla(translated);
        } else {
          const processed = postProcessBangla(core);
          if (processed !== core) {
            translated = processed;
          }
        }

        if (!translated || translated === core) continue;

        for (const node of bucket) {
          const raw = originals.get(node) ?? node.nodeValue ?? "";
          if (!originals.has(node)) originals.set(node, raw);
          const leading = raw.match(/^\s*/)?.[0] ?? "";
          const trailing = raw.match(/\s*$/)?.[0] ?? "";
          const next = `${leading}${translated}${trailing}`;
          if (node.nodeValue !== next) node.nodeValue = next;
          touched.add(node);
        }
      }

      for (const [core, bucket] of attrGroups) {
        let translated = clientCache.get(core);
        if (translated) {
          translated = postProcessBangla(translated);
        } else {
          const processed = postProcessBangla(core);
          if (processed !== core) {
            translated = processed;
          }
        }

        if (!translated || translated === core) continue;

        for (const a of bucket) {
          const am = getAttrMap(a.el);
          if (!am.has(a.attr)) am.set(a.attr, a.raw);
          const raw = am.get(a.attr) ?? a.raw;
          const leading = raw.match(/^\s*/)?.[0] ?? "";
          const trailing = raw.match(/\s*$/)?.[0] ?? "";
          const next = `${leading}${translated}${trailing}`;
          try {
            if (a.el.getAttribute(a.attr) !== next) a.el.setAttribute(a.attr, next);
          } catch {}
        }
      }
    };

    const translateNodes = async (nodes: Text[], attrs: AttrItem[]) => {
      const groups = new Map<string, Text[]>();
      for (const node of nodes) {
        const raw = originals.get(node) ?? node.nodeValue ?? "";
        const core = normalizeCore(raw);
        if (!core) continue;
        const bucket = groups.get(core);
        if (bucket) bucket.push(node);
        else groups.set(core, [node]);
      }

      const attrGroups = new Map<string, AttrItem[]>();
      for (const a of attrs) {
        if (!a.core) continue;
        const bucket = attrGroups.get(a.core);
        if (bucket) bucket.push(a);
        else attrGroups.set(a.core, [a]);
      }

      if (groups.size === 0 && attrGroups.size === 0) return;

      // 1. Immediately synchronously translate all known / cached phrases
      applyCached(groups, attrGroups);

      // 2. Collect any unknown phrases to fetch asynchronously
      const missing: string[] = [];
      for (const core of groups.keys()) {
        if (!clientCache.has(core)) missing.push(core);
      }
      for (const core of attrGroups.keys()) {
        if (!clientCache.has(core)) missing.push(core);
      }

      if (missing.length > 0) {
        try {
          const fresh = await translateTextsAction(missing);
          for (const [key, value] of Object.entries(fresh)) clientCache.set(key, value);
          // 3. Re-apply cached translations for newly fetched items
          applyCached(groups, attrGroups);
        } catch {}
      }
    };

    if (locale !== "bn") {
      document.documentElement.classList.remove("i18n-ready");
      for (const node of touched) {
        const original = originals.get(node);
        if (original !== undefined && node.nodeValue !== original) node.nodeValue = original;
      }
      touched.clear();
      attrOriginalsRef.current = new WeakMap();
      return;
    }

    let observer: MutationObserver | null = null;
    let timer: number | null = null;
    let cancelled = false;

    const pendingNodes = new Set<Text>();
    const pendingAttrs = new Set<AttrItem>();

    const flush = () => {
      timer = null;
      const batchNodes = Array.from(pendingNodes);
      pendingNodes.clear();
      const batchAttrs = Array.from(pendingAttrs);
      pendingAttrs.clear();
      if (batchNodes.length > 0 || batchAttrs.length > 0) void translateNodes(batchNodes, batchAttrs);
    };

    // Defer observation & initial translation after React hydration completely completes
    const runTranslation = () => {
      if (cancelled) return;

      const initialText: Text[] = [];
      const initialAttr: AttrItem[] = [];
      collectTextNodes(document.body, initialText);
      collectAttrItems(document.body, initialAttr);
      void translateNodes(initialText, initialAttr).finally(() => {
        document.documentElement.classList.add("i18n-ready");
      });

      observer = new MutationObserver((mutations) => {
        let changed = false;
        for (const mutation of mutations) {
          if (mutation.type === "characterData") {
            const node = mutation.target as Text;
            const core = normalizeCore(originals.get(node) ?? "");
            const translated = core ? clientCache.get(core) : undefined;
            if (translated && (node.nodeValue ?? "").includes(translated)) continue;
            if (node.nodeValue && /\S/.test(node.nodeValue)) {
              pendingNodes.add(node);
              changed = true;
            }
          } else if (mutation.type === "childList") {
            const addedNodesBatch: Text[] = [];
            const addedAttrsBatch: AttrItem[] = [];
            for (const added of Array.from(mutation.addedNodes)) {
              collectTextNodes(added, addedNodesBatch);
              collectAttrItems(added, addedAttrsBatch);
            }
            if (addedNodesBatch.length > 0 || addedAttrsBatch.length > 0) {
              // Immediately translate known terms synchronously
              void translateNodes(addedNodesBatch, addedAttrsBatch);
            }
          }
        }
        if (changed) {
          if (timer !== null) {
            window.clearTimeout(timer);
            timer = null;
          }
          flush();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    };

    let rafId: number | null = null;
    let timerId: NodeJS.Timeout | null = null;

    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        timerId = setTimeout(runTranslation, 100);
      });
    });

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timerId !== null) clearTimeout(timerId);
      if (observer) observer.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [locale]);

  return null;
}
