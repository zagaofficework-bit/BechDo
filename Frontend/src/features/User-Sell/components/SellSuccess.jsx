//Sell|Success

// src/pages/sell/SellSuccess.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function SellSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const listing  = location.state?.listing;

  useEffect(() => { toast.success("Device listed successfully! 🎉"); }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center space-y-5">

        {/* Checkmark */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto"
          style={{ background: "#e8f4fd", border: "1px solid #cce4f6" }}>
          <svg className="w-8 h-8" style={{ color: "#0077b6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900">Device Listed!</h2>
          <p className="text-sm text-gray-400 mt-1">
            Your device has been listed. Sellers will contact you soon.
          </p>
        </div>

        {listing && (
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-sm space-y-2 text-left">
            <Row label="Device"     value={listing.device} />
            <Row label="Category"   value={listing.category} />
            <Row label="Price"      value={`₹${listing.finalPrice.toLocaleString("en-IN")}`} />
            <Row label="Status"     value={listing.status} />
            <Row label="Listing ID" value={listing.listingId} mono />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-gray-300 transition"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition"
            style={{ background: "#0077b6" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#005f8f"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0077b6"; }}
          >
            My Listings
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className={`text-gray-700 text-xs ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}