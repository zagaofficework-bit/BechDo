import { useState, useRef, useEffect } from "react";
export default function LazyImage({
  src,
  alt = "",
  className = "",
  style,
  fallback = "https://placehold.co/200x200/f1f5f9/94a3b8?text=📱",
  onError: onErrorProp,
  ...props
}) {
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState(false);
  const [visible, setVisible] = useState(false);
  const imgRef = useRef(null);
  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={style} {...props}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
      )}
      {visible && (
        <img
          src={error ? fallback : src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            setError(true);
            setLoaded(true);
            if (onErrorProp) onErrorProp(e);
          }}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}