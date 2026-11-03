import * as React from "react";
import type { Props } from "./shared";
export type StudyEvent = { type: string; appId: string; itemId?: string; title?: string; tags?: string[]; at: number; durationMs?: number; value?: string };
const eventCache: { events: StudyEvent[] } = { events: [] };
export function recordStudyEvent(p: Pick<Props, "appId" | "ui" | "onUi">, type: string, item?: { id?: string; title?: string; meta?: Record<string, string> }, extra: { durationMs?: number; value?: string } = {}) {
  let events = eventCache.events;
  if (!events.length) {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("foundphone-study-events") : null;
      events = raw ? JSON.parse(raw) as StudyEvent[] : [];
    } catch { events = []; }
  }
  const tags = (item?.meta?.tags || "").split(/[，,、]/).map((tag) => tag.trim()).filter(Boolean);
  const next = [...events, { type, appId: p.appId || "unknown", itemId: item?.id, title: item?.title, tags, at: Date.now(), ...extra }].slice(-3000);
  eventCache.events = next;
  try { if (typeof localStorage !== "undefined") localStorage.setItem("foundphone-study-events", JSON.stringify(next)); } catch { /* storage may be disabled */ }
}
export function resetStudyEvents() {
  eventCache.events = [];
  try { localStorage.removeItem("foundphone-study-events"); } catch { /* storage may be disabled */ }
}
export function readStudyEvents(): StudyEvent[] {
  try {
    const raw = localStorage.getItem("foundphone-study-events");
    return raw ? JSON.parse(raw) as StudyEvent[] : [];
  } catch { return []; }
}
export function useStudyTracking(p: Props) {
  const latest = React.useRef(p);
  latest.current = p;
  React.useEffect(() => {
    const started = Date.now();
    recordStudyEvent(latest.current, "app_open");
    const root = document.querySelector<HTMLElement>(".catalog-scroll") || document.querySelector<HTMLElement>(".wx-moments") || undefined;
    const mutationRoot = document.querySelector<HTMLElement>(".wechat-ui") || root;
    const active = new Map<Element, { at: number; id: string; title: string; tags: string }>();
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const node = entry.target as HTMLElement;
        const id = node.dataset.studyId || "";
        const title = node.dataset.studyTitle || "";
        const tags = node.dataset.studyTags || "";
        if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
          if (!active.has(node)) {
            active.set(node, { at: Date.now(), id, title, tags });
            recordStudyEvent(latest.current, "item_view", { id, title, meta: { tags } });
          }
        } else {
          const seen = active.get(node);
          if (seen) {
            active.delete(node);
            const durationMs = Date.now() - seen.at;
            if (durationMs >= 500) recordStudyEvent(latest.current, "item_dwell", { id: seen.id, title: seen.title, meta: { tags: seen.tags } }, { durationMs });
          }
        }
      }
    }, { root: root ?? null, threshold: [0, 0.55, 1] });
    const observeNodes = (scope: ParentNode) => {
      if (observer) scope.querySelectorAll<HTMLElement>("[data-study-id]").forEach((node) => observer.observe(node));
    };
    observeNodes(document);
    const mutation = typeof MutationObserver === "undefined" ? null : new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.matches("[data-study-id]")) observer?.observe(node);
          observeNodes(node);
        }
      });
    });
    if (mutationRoot && mutation) mutation.observe(mutationRoot, { childList: true, subtree: true });
    return () => {
      mutation?.disconnect();
      observer?.disconnect();
      for (const seen of active.values()) {
        const durationMs = Date.now() - seen.at;
        if (durationMs >= 500) recordStudyEvent(latest.current, "item_dwell", { id: seen.id, title: seen.title, meta: { tags: seen.tags } }, { durationMs });
      }
      recordStudyEvent(latest.current, "app_dwell", undefined, { durationMs: Date.now() - started });
    };
  }, [p.appId]);
}
