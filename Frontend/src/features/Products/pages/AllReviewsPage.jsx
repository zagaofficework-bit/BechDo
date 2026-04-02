
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate }           from "react-router-dom";
import { useAuth }                          from "../../../hooks/useAuth";
import ReviewCard                           from "../components/ReviewCard";

const BASE  = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const token = () => localStorage.getItem("accessToken");
 
function toggleLikeInTree(reviews, reviewId, userId) {
  return reviews.map(r => {
    if (r._id === reviewId) {
      const liked = (r.likes ?? []).some(id => (id?._id ?? id) === userId);
      const likes = liked
        ? (r.likes ?? []).filter(id => (id?._id ?? id) !== userId)
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
    .filter(r => r._id !== id)
    .map(r => r.replies?.length ? { ...r, replies: removeFromTree(r.replies, id) } : r);
}
 
const Stars = ({ n }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} className={`w-4 h-4 ${s <= Math.round(n) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);
 
export default function AllReviewsPage() {
  const { id: productId } = useParams();
  const navigate          = useNavigate();
  const { user, isAuthenticated } = useAuth();
 
  const [product,     setProduct]     = useState(null);
  const [summary,     setSummary]     = useState(null);
  const [reviews,     setReviews]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sortBy,      setSortBy]      = useState("newest");
  const [comment,     setComment]     = useState("");
  const [rating,      setRating]      = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formError,   setFormError]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [replyTo,     setReplyTo]     = useState(null);
  const [replyText,   setReplyText]   = useState("");
  const [mediaImages,    setMediaImages]    = useState([]);
  const [mediaPreviews,  setMediaPreviews]  = useState([]);
  const [mediaVideo,     setMediaVideo]     = useState(null);
  const [mediaVideoName, setMediaVideoName] = useState("");
 
  const userHasMediaReview = reviews.some(
    r => r.author?._id === user?._id && !r.parentReview && (r.images?.length > 0 || r.video)
  );
  const canAddMedia = !userHasMediaReview;
 
  // ── Load product title ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/products/${productId}`)
      .then(r => r.json())
      .then(d => setProduct(d.data ?? d.product ?? null))
      .catch(() => {});
  }, [productId]);
 
  // ── Fetch reviews ───────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async (sort = sortBy) => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/products/${productId}/reviews?sortBy=${sort}&limit=100`);
      const data = await res.json();
      setSummary(data.summary ?? null);
      setReviews(data.data    ?? []);
    } catch {}
    finally { setLoading(false); }
  }, [productId, sortBy]);
 
  useEffect(() => { fetchReviews(); }, [productId]);
 
  // ── Submit review — optimistic, FormData for media ─────────────────────────
  const handleSubmitReview = async () => {
    if (!comment.trim()) { setFormError("Please write a comment"); return; }
    if (rating === 0)    { setFormError("Please select a rating");  return; }
    setFormError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("comment", comment);
      fd.append("rating",  rating);
      if (canAddMedia) {
        mediaImages.forEach(f => fd.append("images", f));
        if (mediaVideo) fd.append("video", mediaVideo);
      }
      const res  = await fetch(`${BASE}/products/${productId}/reviews`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body:    fd,
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message); return; }
      const newReview = { ...data.data, replies: [], likesCount: 0, likes: [] };
      setReviews(prev => [newReview, ...prev]);
      setSummary(prev => prev ? {
        ...prev,
        totalReviews:  prev.totalReviews + 1,
        averageRating: parseFloat(
          (((prev.averageRating * prev.totalReviews) + rating) / (prev.totalReviews + 1)).toFixed(1)
        ),
        ratingBreakdown: { ...prev.ratingBreakdown, [rating]: (prev.ratingBreakdown?.[rating] ?? 0) + 1 },
      } : prev);
      setComment(""); setRating(0);
      setMediaImages([]); setMediaPreviews([]);
      setMediaVideo(null); setMediaVideoName("");
    } catch { setFormError("Failed to submit review"); }
    finally { setSubmitting(false); }
  };
 
  // ── Reply ───────────────────────────────────────────────────────────────────
  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(
        `${BASE}/products/${productId}/reviews/${replyTo.reviewId}/reply`,
        { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ comment: replyText }) }
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(prev => prev.map(r =>
          r._id === replyTo.reviewId
            ? { ...r, replies: [...(r.replies ?? []), { ...data.data, replies: [] }] }
            : r
        ));
        setReplyTo(null); setReplyText("");
      }
    } catch {}
  };
 
  // ── Like — optimistic ───────────────────────────────────────────────────────
  const handleLike = useCallback(async (reviewId) => {
    if (!isAuthenticated || !user?._id) return;
    setReviews(prev => toggleLikeInTree(prev, reviewId, user._id));
    fetch(`${BASE}/products/${productId}/reviews/${reviewId}/like`, {
      method: "POST", headers: { Authorization: `Bearer ${token()}` },
    }).catch(() => fetchReviews());
  }, [isAuthenticated, user?._id, productId]);
 
  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (reviewId) => {
    if (!window.confirm("Delete this review permanently?")) return;
    try {
      const res = await fetch(`${BASE}/products/${productId}/reviews/${reviewId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) { const d = await res.json(); alert(d.message); return; }
      setReviews(prev => removeFromTree(prev, reviewId));
      setSummary(prev => prev && prev.totalReviews > 0
        ? { ...prev, totalReviews: prev.totalReviews - 1 } : prev);
    } catch { alert("Failed to delete review"); }
  }, [productId]);
 
  const cardProps = {
    user, isAuthenticated,
    productOwnerId: product?.listedBy?._id ?? product?.listedBy,
    replyTo, replyText, setReplyTo, setReplyText,
    onDelete: handleDelete, onLike: handleLike, onSubmitReply: handleSubmitReply,
  };
 
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
 
      <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "'DM Sans',sans-serif" }}>
 
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 sticky top-0 z-20
          shadow-[0_1px_8px_rgba(17,50,212,0.05)]">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button onClick={() => navigate(`/product/${productId}`)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#1132d4] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to product
            </button>
            <div className="flex-1">
              <h1 className="text-base font-bold text-slate-800 truncate" style={{ fontFamily: "'Sora',sans-serif" }}>
                Reviews {product?.title ? `— ${product.title}` : ""}
              </h1>
              {summary && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Stars n={summary.averageRating} />
                  <span className="text-xs text-slate-500 font-medium">
                    {summary.averageRating} · {summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
 
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
 
          {/* Write review */}
          {isAuthenticated ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-700 mb-3">Write a Review</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-slate-500">Your rating:</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      className={`w-6 h-6 cursor-pointer transition-colors ${
                        s <= (hoverRating || rating) ? "text-amber-400 fill-amber-400" : "text-slate-300 fill-slate-300"
                      }`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {rating > 0 && (
                  <span className="text-xs text-amber-600 font-bold">
                    {["","Poor","Fair","Good","Great","Excellent"][rating]}
                  </span>
                )}
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                placeholder="Share your experience…"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm
                  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1132d4]/30
                  focus:border-[#1132d4] focus:bg-white resize-none transition-all" />
 
              {/* Media upload */}
              {canAddMedia ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">
                      📷 Add photos <span className="text-slate-400 font-normal">(up to 5, optional)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mediaPreviews.map((src, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <button type="button"
                            onClick={() => { setMediaImages(p => p.filter((_,idx)=>idx!==i)); setMediaPreviews(p=>p.filter((_,idx)=>idx!==i)); }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] items-center justify-center hidden group-hover:flex font-bold">×</button>
                        </div>
                      ))}
                      {mediaImages.length < 5 && (
                        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1132d4] flex items-center justify-center cursor-pointer text-slate-400 hover:text-[#1132d4] text-xl transition-colors">
                          +
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple className="hidden"
                            onChange={e => { const files=Array.from(e.target.files).slice(0,5-mediaImages.length); setMediaImages(p=>[...p,...files]); setMediaPreviews(p=>[...p,...files.map(f=>URL.createObjectURL(f))]); }} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">
                      🎥 Add a video <span className="text-slate-400 font-normal">(1 video, max 50MB, optional)</span>
                    </p>
                    {mediaVideo ? (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        <span className="text-xs text-emerald-700 font-semibold truncate flex-1">{mediaVideoName}</span>
                        <button type="button" onClick={() => { setMediaVideo(null); setMediaVideoName(""); }}
                          className="text-xs text-red-400 hover:text-red-600 font-bold">Remove</button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 border border-dashed border-slate-300 hover:border-[#1132d4] rounded-xl px-3 py-2 cursor-pointer text-xs text-slate-400 hover:text-[#1132d4] transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                        Click to attach a video
                        <input type="file" accept="video/mp4,video/mov,video/avi,video/mkv" className="hidden"
                          onChange={e => { const f=e.target.files[0]; if(f){setMediaVideo(f);setMediaVideoName(f.name);} }} />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  📎 You've already attached media to one of your reviews. Only one review per product can have photos/video.
                </p>
              )}
 
              {formError && <p className="text-xs text-red-500 mt-1.5 font-semibold">{formError}</p>}
              <div className="flex justify-end mt-3">
                <button onClick={handleSubmitReview} disabled={submitting}
                  className="flex items-center gap-2 bg-[#1132d4] text-white text-sm font-bold px-5 py-2.5
                    rounded-xl shadow-[0_4px_14px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8]
                    disabled:opacity-60 transition-all">
                  {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-[#1132d4]/20 rounded-2xl px-5 py-4 text-sm text-[#1132d4] font-medium">
              <a href="/login" className="font-bold hover:underline">Login</a> to write a review
            </div>
          )}
 
          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
            {[
              { id: "newest",     label: "Newest"     },
              { id: "top_rated",  label: "Top Rated"  },
              { id: "most_liked", label: "Most Liked" },
              { id: "oldest",     label: "Oldest"     },
            ].map(s => (
              <button key={s.id} onClick={() => { setSortBy(s.id); fetchReviews(s.id); }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  sortBy === s.id
                    ? "bg-[#1132d4] text-white border-[#1132d4]"
                    : "border-slate-200 text-slate-500 hover:border-[#1132d4] hover:text-[#1132d4] bg-white"
                }`}>{s.label}</button>
            ))}
          </div>
 
          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
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
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <span className="text-5xl block mb-3">💬</span>
              <p className="text-slate-600 font-semibold">No reviews yet</p>
              <p className="text-slate-400 text-sm mt-1">Be the first to leave one above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <ReviewCard key={review._id} review={review} {...cardProps} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}