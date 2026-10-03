import { PostMedia, resolveApiUrl } from "../../lib/api";

type Props = { media?: PostMedia[]; imageUrl?: string | null; videoUrl?: string | null; title: string };
type Item = { id: string | number; type: "image" | "video"; url: string };

export default function PostMediaView({ media = [], imageUrl, videoUrl, title }: Props) {
  const items: Item[] = media.length
    ? media.map((m) => ({ id: m.id, type: m.media_type === "video" ? "video" : "image", url: m.url }))
    : [
        ...(imageUrl ? [{ id: "legacy-image", type: "image" as const, url: imageUrl }] : []),
        ...(videoUrl ? [{ id: "legacy-video", type: "video" as const, url: videoUrl }] : []),
      ];
  if (!items.length) return null;

  return (
    <div className="vfx-media">
      {items.map((item) => {
        const src = resolveApiUrl(item.url) ?? undefined;
        return item.type === "video" ? (
          // playsInline: without it iOS forces fullscreen on play. preload=metadata: don't pull 100MB on scroll.
          <video key={item.id} src={src} controls playsInline preload="metadata" aria-label={`Video attached to ${title}`} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={item.id} src={src} alt={`Image attached to "${title}"`} loading="lazy" decoding="async" />
        );
      })}
    </div>
  );
}
