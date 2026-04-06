import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReviewCard from "./ReviewCard";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const token = () => localStorage.getItem("accessToken");

const PREVIEW_COUNT = 3; // reviews shown before "View all"

// ─── tree helpers ─────────────────────────────────────────────────────────────
function toggleLikeInTree(reviews, reviewId, userId) {
  return reviews.map((r) => {
    if (r._id === reviewId) {
      const liked = (r.likes ?? []).some((id) => (id?._id ?? id) === userId);
      const likes = liked
        ? (r.likes ?? []).filter((id) => (id?._id ?? id) !== userId)
        : [...(r.likes ?? []), userId];
      return { ...r, likes, likesCount: likes.length };
    }
    if (r.replies?.length)
      return { ...r, replies: toggleLikeInTree(r.replies, reviewId, userId) };
    return r;
  });
}

function removeFromTree(reviews, id) {
  return reviews
    .filter((r) => r._id !== id)
    .map((r) =>
      r.replies?.length ? { ...r, replies: removeFromTree(r.replies, id) } : r,
    );
}

// ─── Rating summary bar ───────────────────────────────────────────────────────
function RatingSummary({ summary }) {
  if (!summary) return null;
  return (
    <div className="flex flex-col sm:flex-row gap-6 bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-8">
      <div className="flex flex-col items-center justify-center sm:border-r border-slate-200 sm:pr-8 sm:min-w-[140px]">
        <span
          className="text-5xl font-extrabold text-slate-900"
          style={{ fontFamily: "'Sora',sans-serif" }}
        >
          {summary.averageRating}
        </span>
        <div className="flex gap-0.5 mt-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg
              key={s}
              className={`w-4 h-4 ${s <= Math.round(summary.averageRating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.ratingBreakdown?.[star] ?? 0;
          const pct =
            summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 w-4">
                {star}
              </span>
              <svg
                className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-6 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReviewSection({
  productId,
  user,
  isAuthenticated,
  productOwnerId,
}) {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  // media upload state
  const [mediaImages, setMediaImages] = useState([]); // File[]
  const [mediaPreviews, setMediaPreviews] = useState([]); // blob URLs
  const [mediaVideo, setMediaVideo] = useState(null); // File
  const [mediaVideoName, setMediaVideoName] = useState("");

  // ── Derived: does the current user already have a review with media? ────────
  const userHasMediaReview = reviews.some(
    (r) =>
      r.author?._id === user?._id &&
      !r.parentReview &&
      (r.images?.length > 0 || r.video),
  );
  // Can this new submission include media? Only if no existing media review
  const canAddMedia = !userHasMediaReview;

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchReviews = useCallback(
    async (sort = sortBy) => {
      setLoading(true);
      try {
        const res = await fetch(
          `${BASE}/products/${productId}/reviews?sortBy=${sort}&limit=50`,
        );
        const data = await res.json();
        setSummary(data.summary ?? null);
        setReviews(data.data ?? []);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [productId, sortBy],
  );

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSort = (s) => {
    setSortBy(s);
    fetchReviews(s);
  };

  // ── Submit review — OPTIMISTIC (no blink) ──────────────────────────────────
  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      setFormError("Please write a comment");
      return;
    }
    if (rating === 0) {
      setFormError("Please select a rating");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      // Use FormData so files can be attached
      const fd = new FormData();
      fd.append("comment", comment);
      fd.append("rating", rating);
      if (canAddMedia) {
        mediaImages.forEach((f) => fd.append("images", f));
        if (mediaVideo) fd.append("video", mediaVideo);
      }

      const res = await fetch(`${BASE}/products/${productId}/reviews`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` }, // NO Content-Type — browser sets multipart boundary
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message);
        return;
      }

      // Optimistic prepend — no fetchReviews() → zero blink
      const newReview = { ...data.data, replies: [], likesCount: 0, likes: [] };
      setReviews((prev) => [newReview, ...prev]);
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              totalReviews: prev.totalReviews + 1,
              averageRating: parseFloat(
                (
                  (prev.averageRating * prev.totalReviews + rating) /
                  (prev.totalReviews + 1)
                ).toFixed(1),
              ),
              ratingBreakdown: {
                ...prev.ratingBreakdown,
                [rating]: (prev.ratingBreakdown?.[rating] ?? 0) + 1,
              },
            }
          : prev,
      );

      // Reset form
      setComment("");
      setRating(0);
      setMediaImages([]);
      setMediaPreviews([]);
      setMediaVideo(null);
      setMediaVideoName("");
    } catch {
      setFormError("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
  return () => {
    mediaPreviews.forEach(url => URL.revokeObjectURL(url));
  };
}, [mediaPreviews]);

  // ── Submit reply ────────────────────────────────────────────────────────────
  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(
        `${BASE}/products/${productId}/reviews/${replyTo.reviewId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({ comment: replyText }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        // Optimistically append reply into the right card
        setReviews((prev) =>
          prev.map((r) =>
            r._id === replyTo.reviewId
              ? {
                  ...r,
                  replies: [
                    ...(r.replies ?? []),
                    { ...data.data, replies: [] },
                  ],
                }
              : r,
          ),
        );
        setReplyTo(null);
        setReplyText("");
      }
    } catch {}
  };

  // ── Like — optimistic ───────────────────────────────────────────────────────
  const handleLike = useCallback(
    async (reviewId) => {
      if (!isAuthenticated || !user?._id) return;
      setReviews((prev) => toggleLikeInTree(prev, reviewId, user._id));
      fetch(`${BASE}/products/${productId}/reviews/${reviewId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      }).catch(() => fetchReviews());
    },
    [isAuthenticated, user?._id, productId],
  );

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (reviewId) => {
      if (!window.confirm("Delete this review permanently?")) return;
      try {
        const res = await fetch(
          `${BASE}/products/${productId}/reviews/${reviewId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token()}` },
          },
        );
        if (!res.ok) {
          const d = await res.json();
          alert(d.message);
          return;
        }
        setReviews((prev) => removeFromTree(prev, reviewId));
        setSummary((prev) =>
          prev && prev.totalReviews > 0
            ? { ...prev, totalReviews: prev.totalReviews - 1 }
            : prev,
        );
      } catch {
        alert("Failed to delete review");
      }
    },
    [productId],
  );

  const cardProps = {
    user,
    isAuthenticated,
    productOwnerId,
    replyTo,
    replyText,
    setReplyTo,
    setReplyText,
    onDelete: handleDelete,
    onLike: handleLike,
    onSubmitReply: handleSubmitReply,
  };

  // Only show first PREVIEW_COUNT reviews here; rest on /reviews/:productId page
  const previewReviews = reviews.slice(0, PREVIEW_COUNT);
  const hasMore = reviews.length > PREVIEW_COUNT;

  return (
    <div className="border-t border-slate-100 bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "'Sora',sans-serif" }}
          >
            Ratings & Reviews
          </h2>
          {hasMore && (
            <button
              onClick={() => navigate(`/product/${productId}/reviews`)}
              className="text-sm font-bold text-[#1132d4] hover:underline flex items-center gap-1"
            >
              View all {reviews.length} reviews
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        <RatingSummary summary={summary} />

        {/* Write a review */}
        {isAuthenticated ? (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-8">
            <p className="text-sm font-bold text-slate-700 mb-3">
              Write a Review
            </p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-slate-500">Your rating:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`w-6 h-6 cursor-pointer transition-colors ${
                      s <= (hoverRating || rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300 fill-slate-300"
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {rating > 0 && (
                <span className="text-xs text-amber-600 font-bold">
                  {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                </span>
              )}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience with this product…"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1132d4]/30
                focus:border-[#1132d4] resize-none transition-all"
            />

            {/* ── Media upload — only if user has no existing media review ── */}
            {canAddMedia ? (
              <div className="mt-3 space-y-3">
                {/* Image picker */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">
                    📷 Add photos{" "}
                    <span className="text-slate-400 font-normal">
                      (up to 5, optional)
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mediaPreviews.map((src, i) => (
                      <div
                        key={i}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group"
                      >
                        <img
                          src={src}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMediaImages((p) =>
                              p.filter((_, idx) => idx !== i),
                            );
                            setMediaPreviews((p) =>
                              p.filter((_, idx) => idx !== i),
                            );
                          }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px]
                            items-center justify-center hidden group-hover:flex font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {mediaImages.length < 5 && (
                      <label
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1132d4]
                        flex items-center justify-center cursor-pointer text-slate-400 hover:text-[#1132d4] text-xl transition-colors"
                      >
                        +
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files).slice(
                              0,
                              5 - mediaImages.length,
                            );
                            setMediaImages((p) => [...p, ...files]);
                            setMediaPreviews((p) => [
                              ...p,
                              ...files.map((f) => URL.createObjectURL(f)),
                            ]);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Video picker */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">
                    🎥 Add a video{" "}
                    <span className="text-slate-400 font-normal">
                      (1 video, max 50MB, optional)
                    </span>
                  </p>
                  {mediaVideo ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <span className="text-xs text-emerald-700 font-semibold truncate flex-1">
                        {mediaVideoName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaVideo(null);
                          setMediaVideoName("");
                        }}
                        className="text-xs text-red-400 hover:text-red-600 font-bold flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className="flex items-center gap-2 border border-dashed border-slate-300 hover:border-[#1132d4]
                      rounded-xl px-3 py-2 cursor-pointer text-xs text-slate-400 hover:text-[#1132d4] transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                        />
                      </svg>
                      Click to attach a video
                      <input
                        type="file"
                        accept="video/mp4,video/mov,video/avi,video/mkv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (f) {
                            setMediaVideo(f);
                            setMediaVideoName(f.name);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                📎 You've already attached media to one of your reviews on this
                product. Only one review per product can have photos/video.
              </p>
            )}

            {formError && (
              <p className="text-xs text-red-500 mt-1.5 font-semibold">
                {formError}
              </p>
            )}
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="flex items-center gap-2 bg-[#1132d4] text-white text-sm font-bold px-5 py-2.5
                  rounded-xl shadow-[0_4px_14px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8]
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {submitting && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-[#1132d4]/20 rounded-2xl px-5 py-4 mb-8 text-sm text-[#1132d4] font-medium">
            <a href="/login" className="font-bold hover:underline">
              Login
            </a>{" "}
            to write a review
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
          {[
            { id: "newest", label: "Newest" },
            { id: "top_rated", label: "Top Rated" },
            { id: "most_liked", label: "Most Liked" },
            { id: "oldest", label: "Oldest" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => handleSort(s.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                sortBy === s.id
                  ? "bg-[#1132d4] text-white border-[#1132d4] shadow-[0_2px_8px_rgba(17,50,212,0.25)]"
                  : "border-slate-200 text-slate-500 hover:border-[#1132d4] hover:text-[#1132d4] bg-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Review list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-2">💬</span>
            <p className="text-slate-600 font-semibold">No reviews yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Be the first to review this product
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {previewReviews.map((review) => (
                <ReviewCard key={review._id} review={review} {...cardProps} />
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => navigate(`/product/${productId}/reviews`)}
                className="mt-6 w-full py-3 rounded-2xl border-2 border-[#1132d4]/20 text-[#1132d4]
                  text-sm font-bold hover:bg-[#1132d4] hover:text-white hover:border-[#1132d4]
                  transition-all duration-200"
              >
                View all {reviews.length} reviews →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
