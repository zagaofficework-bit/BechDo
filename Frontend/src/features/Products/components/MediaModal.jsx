
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal }                              from "react-dom";

export function buildMediaList(images = [], video = null) {
  const list = (images ?? []).map(url => ({ type: "image", url }));
  if (video) list.push({ type: "video", url: video });
  return list;
}

function ArrowBtn({ dir, onClick, disabled }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className={`absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full
        bg-black/50 hover:bg-white/20 backdrop-blur-sm text-white
        flex items-center justify-center transition-all duration-150
        disabled:opacity-20 disabled:cursor-default
        ${dir === "left" ? "left-3 md:left-5" : "right-3 md:right-5"}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d={dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

function MediaModal({ media, initialIndex = 0, onClose }) {
  const [index,    setIndex]    = useState(initialIndex);
  const [animKey,  setAnimKey]  = useState(0); // remount media on change for animation
  const touchStartX = useRef(null);
  const total   = media.length;
  const current = media[index];

  const goTo = useCallback((i) => {
    setIndex(i);
    setAnimKey(k => k + 1);
  }, []);

  const prev = useCallback(() => { if (index > 0)           goTo(index - 1); }, [index, goTo]);
  const next = useCallback(() => { if (index < total - 1)   goTo(index + 1); }, [index, total, goTo]);

  // Keyboard
  useEffect(() => {
    const handler = e => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Touch swipe
  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = e => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta >  50) next();
    if (delta < -50) prev();
    touchStartX.current = null;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/96"
      style={{ animation: "mmFadeIn 0.18s ease" }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @keyframes mmFadeIn  { from { opacity: 0 }                          to { opacity: 1 } }
        @keyframes mmZoomIn  { from { opacity: 0; transform: scale(0.93) }  to { opacity: 1; transform: scale(1) } }
      `}</style>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        onClick={e => e.stopPropagation()}>
        <span className="text-white/60 text-sm font-semibold">
          {index + 1} / {total}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white
            flex items-center justify-center transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Main viewer ── */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-16"
        onClick={e => e.stopPropagation()}>

        <ArrowBtn dir="left"  onClick={prev} disabled={index === 0} />
        <ArrowBtn dir="right" onClick={next} disabled={index === total - 1} />

        <div key={animKey} className="w-full h-full flex items-center justify-center"
          style={{ animation: "mmZoomIn 0.2s ease" }}>
          {current.type === "image" ? (
            <img
              src={current.url}
              alt={`media-${index}`}
              className="max-h-full max-w-full object-contain rounded-lg select-none"
              draggable={false}
            />
          ) : (
            <video
              key={current.url}
              src={current.url}
              controls
              autoPlay
              className="max-h-full max-w-full rounded-lg"
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      {total > 1 && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto"
          onClick={e => e.stopPropagation()}
        >
          {media.map((item, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                i === index
                  ? "border-white scale-110 shadow-[0_0_0_2px_rgba(255,255,255,0.4)]"
                  : "border-white/20 hover:border-white/60 opacity-60 hover:opacity-100"
              }`}
            >
              {item.type === "image" ? (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

export default MediaModal;