"use client";

import { useEffect, useRef } from "react";

import { useLanguage } from "@/context/LanguageContext";
import { translateTextsAction } from "@/actions/translate.actions";

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

const clientCache = new Map<string, string>();

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
        } catch {}
      }

      for (const [core, bucket] of groups) {
        const translated = clientCache.get(core);
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
        const translated = clientCache.get(core);
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

    if (locale !== "bn") {
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

    // Delay execution until after React finishes hydrating SSR & Suspense boundaries
    const initTimer = setTimeout(() => {
      if (cancelled) return;

      const initialText: Text[] = [];
      const initialAttr: AttrItem[] = [];
      collectTextNodes(document.body, initialText);
      collectAttrItems(document.body, initialAttr);
      const totalInitial = initialText.length + initialAttr.length;
      if (totalInitial > 150) {
        const mid = Math.min(120, initialText.length);
        void translateNodes(initialText.slice(0, mid), initialAttr.slice(0, 40)).then(() => {
          setTimeout(() => {
            if (cancelled) return;
            void translateNodes(initialText.slice(mid), initialAttr.slice(40)).then(() => {
              if (cancelled) return;
              if ("requestIdleCallback" in window) {
                requestIdleCallback(
                  () => {
                    if (cancelled) return;
                    const moreText: Text[] = [];
                    const moreAttr: AttrItem[] = [];
                    collectTextNodes(document.body, moreText);
                    collectAttrItems(document.body, moreAttr);
                    void translateNodes(moreText, moreAttr);
                  },
                  { timeout: 1500 }
                );
              }
            });
          }, 0);
        });
      } else {
        void translateNodes(initialText, initialAttr);
      }

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
            for (const added of Array.from(mutation.addedNodes)) {
              const found: Text[] = [];
              collectTextNodes(added, found);
              for (const n of found) pendingNodes.add(n);
              const foundAttr: AttrItem[] = [];
              collectAttrItems(added, foundAttr);
              for (const a of foundAttr) pendingAttrs.add(a);
              if (found.length > 0 || foundAttr.length > 0) changed = true;
            }
          }
        }
        if (changed && timer === null) {
          timer = window.setTimeout(flush, 100);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      if (observer) observer.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [locale]);

  return null;
}
