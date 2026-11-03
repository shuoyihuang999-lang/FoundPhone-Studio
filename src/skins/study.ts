import { useEffect, useRef } from "react";
import type { Props } from "./shared";
import type { UiValue } from "../schema";

export type StudyEvent = {
  type: string;
  appId: string;
  itemId?: string;
  title?: string;
  tags?: string[];
  at: number;
  durationMs?: number;
  value?: string;
};

const eventCache = new Map<string, StudyEvent[]>();

export function recordStudyEvent(
  p: Pick<Props, "appId" | "ui" | "onUi">,
  type: string,
  item?: { id?: string; title?: string; meta?: Record<string, string> },
  extra: { durationMs?: number; value?: string } = {},
) {
  const appId = p.appId || "unknown";
  let events = eventCache.get(appId);
  if (!events) {
    try {
      const raw = p.ui?.studyEvents;
      events = typeof raw === "string" ? JSON.parse(raw) as StudyEvent[] : [];
    } catch {
      events = [];
    }
  }
  const tags = (item?.meta?.tags || "")
    .split(/[，,、]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  const next = [
    ...events,
    {
      type,
      appId,
      itemId: item?.id,
      title: item?.title,
      tags,
      at: Date.now(),
      ...extra,
    },
  ].slice(-3000);
  eventCache.set(appId, next);
  p.onUi?.("studyEvents", JSON.stringify(next) as UiValue);
}

export function useStudyTracking(p: Props) {
  const latest = useRef(p);
  latest.current = p;
  useEffect(() => {
    const started = Date.now();
    recordStudyEvent(latest.current, "app_open");
    const root =
      document.querySelector<HTMLElement>(".catalog-scroll") ||
      document.querySelector<HTMLElement>(".wx-moments") ||
      undefined;
    const active = new Map<Element, { at: number; id: string; title: string; tags: string }>();
    const nodes = document.querySelectorAll<HTMLElement>("[data-study-id]");
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                const node = entry.target as HTMLElement;
                const id = node.dataset.studyId || "";
                const title = node.dataset.studyTitle || "";
                const tags = node.dataset.studyTags || "";
                if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
                  if (!active.has(node)) {
                    active.set(node, { at: Date.now(), id, title, tags });
                    recordStudyEvent(latest.current, "item_view", {
                      id,
                      title,
                      meta: { tags },
                    });
                  }
                } else {
                  const seen = active.get(node);
                  if (seen) {
                    active.delete(node);
                    const durationMs = Date.now() - seen.at;
                    if (durationMs >= 500) {
                      recordStudyEvent(
                        latest.current,
                        "item_dwell",
                        { id: seen.id, title: seen.title, meta: { tags: seen.tags } },
                        { durationMs },
                      );
                    }
                  }
                }
              }
            },
            { root: root ?? null, threshold: [0, 0.55, 1] },
          );
    if (observer) nodes.forEach((node) => observer.observe(node));
    return () => {
      observer?.disconnect();
      for (const seen of active.values()) {
        const durationMs = Date.now() - seen.at;
        if (durationMs >= 500) {
          recordStudyEvent(
            latest.current,
            "item_dwell",
            { id: seen.id, title: seen.title, meta: { tags: seen.tags } },
            { durationMs },
          );
        }
      }
      recordStudyEvent(latest.current, "app_dwell", undefined, {
        durationMs: Date.now() - started,
      });
    };
  }, [p.appId]);
}
