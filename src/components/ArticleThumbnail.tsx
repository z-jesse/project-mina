import { useState } from 'react'

// Retained for feed and discovery layouts; topic pages use one shared image.
export default function ArticleThumbnail({
  src,
  alt = '',
}: {
  src?: string
  alt?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string>()

  if (!src || src === failedSrc) return null

  return (
    <img
      className="aspect-video h-auto w-44 max-w-full shrink-0 rounded-[5px] bg-[#e8e9e2] object-cover max-sm:w-[104px]"
      src={src}
      alt={alt}
      width={176}
      height={99}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      ref={(image) => {
        // Also catch failures that happened before React hydrated the page.
        if (image?.complete && image.naturalWidth === 0) setFailedSrc(src)
      }}
    />
  )
}
