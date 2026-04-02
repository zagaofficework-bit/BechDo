
import { useState }            from "react";
import MediaModal, { buildMediaList } from "./MediaModal";


const Stars = ({ n }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s}
        className={`w-3.5 h-3.5 ${s <= n ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
        viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export default function ReviewCard({
  review, depth = 0,
  user, isAuthenticated, productOwnerId,
  replyTo, replyText, setReplyTo, setReplyText,
  onDelete, onLike, onSubmitReply,
}) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  // modal state: { mediaList, initialIndex } | null
  const [modal, setModal] = useState(null);

  const initials = review.author
    ? `${review.author.firstname?.[0] ?? ""}${review.author.lastname?.[0] ?? ""}`.toUpperCase()
    : "?";

  const isAuthor = isAuthenticated &&
    user?._id && review.author?._id &&
    user._id.toString() === review.author._id.toString();

  const isProductOwner = isAuthenticated &&
    user?._id && productOwnerId &&
    user._id.toString() === productOwnerId.toString();

  const canDelete  = isAuthor || isProductOwner;
  const replyCount = review.replies?.length ?? 0;

  // Build combined media list for this review
  const mediaList = buildMediaList(review.images, review.video);

  const openModal = (startIndex) => setModal({ mediaList, initialIndex: startIndex });
  const closeModal = () => setModal(null);

  return (
    <div onClick={()=>navigate(-1)} className={depth > 0 ? "ml-8 pl-4 border-l-2 border-slate-100" : ""}>
      <div className={`bg-white rounded-2xl border border-slate-100 p-4 mb-2 ${depth === 0 ? "shadow-sm" : ""}`}>
        <div className="flex items-start gap-3">

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#1132d4]/10 flex items-center justify-center flex-shrink-0 text-[#1132d4] text-xs font-bold overflow-hidden">
            {review.author?.profilePic
              ? <img src={review.author.profilePic} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>

          <div className="flex-1 min-w-0">

            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-800">
                {`${review.author?.firstname ?? ""} ${review.author?.lastname ?? ""}`.trim() || "User"}
              </span>
              {review.rating && <Stars n={review.rating} />}
              <span className="text-xs text-slate-400 ml-auto">
                {new Date(review.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
              {canDelete && (
                <button onClick={() => onDelete(review._id)} title="Delete"
                  className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Comment */}
            <p className="text-sm mt-1.5 leading-relaxed text-slate-600">{review.comment}</p>

            {/* ── Media thumbnails ── */}
            {mediaList.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {/* Image thumbnails */}
                {(review.images ?? []).map((img, i) => (
                  <button
                    key={`img-${i}`}
                    onClick={() => openModal(i)}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100
                      hover:border-[#1132d4]/40 hover:shadow-md transition-all duration-150 group flex-shrink-0"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    {/* zoom icon on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                      </svg>
                    </div>
                  </button>
                ))}

                {/* Video thumbnail */}
                {review.video && (
                  <button
                    onClick={() => openModal(mediaList.length - 1)} // video is always last
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100
                      bg-slate-800 hover:border-[#1132d4]/40 hover:shadow-md transition-all duration-150 group flex-shrink-0"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-all">
                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <span className="absolute bottom-1 left-1 text-[9px] text-white/70 font-bold uppercase tracking-wide">
                      Video
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-2.5">
              <button onClick={() => onLike(review._id)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#1132d4] transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                {review.likesCount ?? review.likes?.length ?? 0}
              </button>

              {isAuthenticated && depth < 2 && (
                <button
                  onClick={() => {
                    setReplyTo({ reviewId: review._id, authorName: review.author?.firstname ?? "User" });
                    setRepliesOpen(true);
                  }}
                  className="text-xs text-slate-400 hover:text-[#1132d4] transition-colors font-medium"
                >
                  Reply
                </button>
              )}

              {replyCount > 0 && (
                <button
                  onClick={() => setRepliesOpen(o => !o)}
                  className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#1132d4] hover:underline"
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${repliesOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  {repliesOpen ? "Hide" : `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
                </button>
              )}
            </div>

            {/* Inline reply box */}
            {replyTo?.reviewId === review._id && (
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && onSubmitReply()}
                  placeholder={`Reply to ${replyTo.authorName}…`}
                  className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200
                    focus:outline-none focus:ring-2 focus:ring-[#1132d4]/30 focus:border-[#1132d4]"
                />
                <button onClick={onSubmitReply}
                  className="text-xs font-bold bg-[#1132d4] text-white px-4 py-2 rounded-xl hover:bg-[#0d28b8] transition-colors">
                  Send
                </button>
                <button onClick={() => { setReplyTo(null); setReplyText(""); }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2">✕</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies — accordion */}
      {replyCount > 0 && repliesOpen && (
        <div className="mb-3">
          {review.replies.map(reply => (
            <ReviewCard
              key={reply._id}
              review={reply}
              depth={depth + 1}
              user={user}
              isAuthenticated={isAuthenticated}
              productOwnerId={productOwnerId}
              replyTo={replyTo}
              replyText={replyText}
              setReplyTo={setReplyTo}
              setReplyText={setReplyText}
              onDelete={onDelete}
              onLike={onLike}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </div>
      )}

      {/* Media lightbox */}
      {modal && (
        <MediaModal
          media={modal.mediaList}
          initialIndex={modal.initialIndex}
          onClose={closeModal}
        />
      )}
    </div>
  );
}