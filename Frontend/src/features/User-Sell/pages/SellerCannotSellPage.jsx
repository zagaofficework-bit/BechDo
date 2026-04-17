import { useNavigate } from "react-router-dom";

export default function SellerCannotSellPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6">
          {/* ban icon */}
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Sellers can't list old devices
        </h1>
        <p className="text-gray-500 mb-8">
          This feature is only for regular users. List your products directly from the Seller Dashboard.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded cursor-pointer">
            Go back
          </button>
          <button onClick={() => navigate("/seller-dashboard")} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded cursor-pointer">
            Seller Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}