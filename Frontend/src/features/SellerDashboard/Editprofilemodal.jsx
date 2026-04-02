
import { memo, useRef, useState } from "react";
import {
  updateProfile,
  updateProfilePic,
  deleteProfilePic,
} from "../../services/profile.api";

// ─── Icon helper ──────────────────────────────────────────────────────────────
const Ic = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

// SVG path strings for each icon
const ICONS = {
  user:   "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  mail:   "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  phone:  "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  camera: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
  save:   "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
  trash:  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  x:      "M6 18L18 6M6 6l12 12",
};

// ─── Tiny spinner ─────────────────────────────────────────────────────────────
const Spinner = ({ className = "w-4 h-4" }) => (
  <span className={`${className} border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0`} />
);

// ─── Styled form field (label + optional left icon + input) ───────────────────
const Field = ({ label, iconKey, ...inputProps }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {iconKey && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Ic d={ICONS[iconKey]} />
        </span>
      )}
      <input
        className={`w-full ${iconKey ? "pl-9" : "pl-3"} pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50
          text-sm text-slate-800 font-medium placeholder-slate-400
          focus:outline-none focus:border-[#1132d4] focus:bg-white focus:ring-2 focus:ring-[#1132d4]/10
          transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        {...inputProps}
      />
    </div>
  </div>
);

// ─── Main modal ───────────────────────────────────────────────────────────────
const EditProfileModal = memo(({ user, onClose, onSaved }) => {

  // Pre-fill the form with the user's current data
  const [form, setForm] = useState({
    firstname: user?.firstname ?? "",
    lastname:  user?.lastname  ?? "",
    email:     user?.email     ?? "",
    mobile:    user?.mobile    ?? user?.phone ?? "",
  });

  const [saving,       setSaving]       = useState(false);
  const [picUploading, setPicUploading] = useState(false);
  const [error,        setError]        = useState(null);

  // picPreview is what the avatar shows — starts as the saved URL, can change locally
  const [picPreview, setPicPreview] = useState(user?.profilePic ?? null);

  const picRef = useRef();

  // Derive initials for the avatar fallback
  const initials = `${(user?.firstname?.[0] ?? "S")}${(user?.lastname?.[0] ?? "")}`.toUpperCase();

  // Generic setter: set("firstname") returns an onChange handler
  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  // ── Profile picture: upload ────────────────────────────────────────────────
  const handlePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local blob preview instantly so the UI feels snappy
    const localUrl = URL.createObjectURL(file);
    setPicPreview(localUrl);
    setPicUploading(true);
    setError(null);

    try {
      const res = await updateProfilePic(file);
      // Swap local blob URL for the real server URL
      setPicPreview(res.profilePic ?? localUrl);
      // Tell parent to update the user in context right away
      onSaved({ profilePic: res.profilePic });
    } catch (err) {
      setError(err.message || "Failed to upload picture");
      setPicPreview(user?.profilePic ?? null); // revert on failure
    } finally {
      setPicUploading(false);
    }
  };

  // ── Profile picture: delete ────────────────────────────────────────────────
  const handleDeletePic = async () => {
    setPicUploading(true);
    setError(null);
    try {
      await deleteProfilePic();
      setPicPreview(null);
      onSaved({ profilePic: null });
    } catch (err) {
      setError(err.message || "Failed to remove picture");
    } finally {
      setPicUploading(false);
    }
  };

  // ── Save profile text fields ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.firstname.trim()) { setError("First name is required"); return; }
    if (!form.email.trim())     { setError("Email is required");      return; }

    setSaving(true);
    setError(null);

    try {
      const res = await updateProfile(form);
      // res.data is the updated user from the backend
      onSaved(res.data ?? form);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-[0_24px_80px_rgba(17,50,212,0.18)] overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ── Coloured header ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1132d4] to-[#3b5ef5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Ic d={ICONS.user} className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Edit Profile</h2>
              <p className="text-blue-200 text-xs">Update your personal information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <Ic d={ICONS.x} className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="px-6 py-6 space-y-5 max-h-[65vh] overflow-y-auto">

          {/* Avatar + change/remove buttons */}
          <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="relative flex-shrink-0">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1132d4] to-[#3b5ef5] overflow-hidden flex items-center justify-center shadow-md">
                {picPreview
                  ? <img src={picPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-white text-lg font-black">{initials}</span>}
                {/* Upload progress overlay */}
                {picUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                    <Spinner />
                  </div>
                )}
              </div>
              {/* Camera icon button */}
              <button
                onClick={() => picRef.current?.click()}
                disabled={picUploading}
                title="Change photo"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white border border-slate-200 text-[#1132d4] flex items-center justify-center shadow-sm hover:scale-110 transition-transform disabled:opacity-50"
              >
                <Ic d={ICONS.camera} className="w-3 h-3" />
              </button>
              {/* Hidden file input */}
              <input ref={picRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {form.firstname} {form.lastname}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Verified Seller</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => picRef.current?.click()}
                  disabled={picUploading}
                  className="text-xs font-semibold text-[#1132d4] border border-[#1132d4]/30 bg-white hover:bg-[#1132d4] hover:text-white px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                >
                  Change Photo
                </button>
                {picPreview && (
                  <button
                    onClick={handleDeletePic}
                    disabled={picUploading}
                    className="text-xs font-semibold text-red-500 border border-red-200 bg-white hover:bg-red-500 hover:text-white px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              <span>⚠️</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <Ic d={ICONS.x} className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="First Name"
              iconKey="user"
              value={form.firstname}
              onChange={set("firstname")}
              placeholder="John"
            />
            <Field
              label="Last Name"
              value={form.lastname}
              onChange={set("lastname")}
              placeholder="Doe"
            />
          </div>

          {/* Email */}
          <Field
            label="Email Address"
            iconKey="mail"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="john@example.com"
          />

          {/* Mobile */}
          <Field
            label="Mobile Number"
            iconKey="phone"
            type="tel"
            value={form.mobile}
            onChange={set("mobile")}
            placeholder="+91 98765 43210"
          />

          {/* Read-only chips for non-editable info */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { label: "Account Type", value: (user?.role ?? "seller").charAt(0).toUpperCase() + (user?.role ?? "seller").slice(1) },
              { label: "Status",       value: user?.accountStatus ?? "Active"               },
              { label: "Verified",     value: user?.isVerified    ? "Yes ✓" : "Pending"     },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || picUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1132d4] hover:bg-[#0d28b8] text-white text-sm font-bold shadow-[0_4px_16px_rgba(17,50,212,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
          >
            {saving
              ? <><Spinner /> <span>Saving…</span></>
              : <><Ic d={ICONS.save} /> <span>Save Changes</span></>
            }
          </button>
        </div>
      </div>
    </div>
  );
});

EditProfileModal.displayName = "EditProfileModal";
export default EditProfileModal;