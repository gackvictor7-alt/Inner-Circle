export function PostImage({ imageUrl }: { imageUrl: string | null }) {
  if (!imageUrl) return null;

  return (
    <figure className="mt-3 overflow-hidden rounded-xl border border-border bg-surface-muted">
      {/* External imageUrl values remain supported; uploaded post images use the
          same-origin /api/media/posts route. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="max-h-[36rem] w-full object-contain"
      />
    </figure>
  );
}
