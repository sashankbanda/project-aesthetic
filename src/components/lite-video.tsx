"use client";
// Lite YouTube embed — thumbnail (free to hot-link from YouTube's image
// CDN) with a play button; the real iframe player loads only on tap, so
// exercise cards stay instant and nothing phones home until the user
// asks for the video. youtube-nocookie keeps tracking out of the app.
import { useState } from "react";
import { Play } from "lucide-react";

export default function LiteVideo({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      aria-label={`Play demo: ${title}`}
      className="pressable relative block aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        loading="lazy"
        className="h-full w-full object-cover opacity-90"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm">
          <Play size={22} className="ml-0.5" fill="currentColor" />
        </span>
      </span>
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
        Demo · YouTube
      </span>
    </button>
  );
}
