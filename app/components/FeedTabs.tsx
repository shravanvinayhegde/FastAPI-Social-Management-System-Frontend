"use client";

type Mode = "new" | "top";
type FeedTabsProps = { mode: Mode; onChange: (mode: Mode) => void };

const TABS: { id: Mode; label: string }[] = [
  { id: "new", label: "New" },
  { id: "top", label: "Top" },
];

/** Sticky, full-width, 48px-high underline tabs (the pattern used by X "For you/Following"). */
export default function FeedTabs({ mode, onChange }: FeedTabsProps) {
  return (
    <div className="vfx-tabs" role="tablist" aria-label="Sort posts">
      {TABS.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={mode === t.id} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
