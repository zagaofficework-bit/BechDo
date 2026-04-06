import { lazy, memo, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminProvider } from "./context/admin.context";
import { AuthProvider } from "./context/auth.context";
import { BuySellProvider } from "./context/buysell.context";
import { ProductProvider } from "./context/product.context";
import { SubscriptionProvider } from "./context/subscription.context";
import { SellFlowProvider } from "./context/sellflow.context"; // ← added
import { useAuth } from "./hooks/useAuth";
import NavBar from "./features/Auth/components/NavBar";
import SubDefectPage from "./features/User-Sell/components/SubdefectSelection";
import {
  PhonesPage,
  LaptopsPage,
  TabletsPage,
  SmartwatchPage,
  TVPage,
} from "./features/Products/pages/Devicepages";
import SellPhones from "./features/User-Sell/pages/SellPhones";
import SellTablets from "./features/User-Sell/pages/SellTablets";
import SellTelevisions from "./features/User-Sell/pages/SellTelevisions";
import SellSmartwatchs from "./features/User-Sell/pages/SellSmartwatchs";
import SellLaptops from "./features/User-Sell/pages/SellLaptops";
import SelectModel from "./features/User-Sell/components/SelectModel";
import ChooseVariant from "./features/User-Sell/components/ChooseVariant";
import BasePrice from "./features/User-Sell/components/BasePrice";
import YesNo from "./features/User-Sell/components/YesNo";
import DefectSelection from "./features/User-Sell/components/DefectSelection";
import AccessorySelection from "./features/User-Sell/components/AccessorySelection";
import FinalPrice from "./features/User-Sell/components/FinalPrice";
import SellSuccess from "./features/User-Sell/components/SellSuccess";
import NotFound from "./features/Auth/pages/NotFound";
import { Toaster } from "react-hot-toast";
import AboutPage from "./features/common/About";
import Blog from "./features/common/Blog";
import Support from "./features/common/Support";
import NearbyDevicesPage from "./features/Auth/pages/NearbyDevicesPage";
import { RouteErrorBoundary } from "./features/common/ErrorBoundary";

// ─── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Home = lazy(() => import("./features/Auth/pages/Home"));
const Login = lazy(() => import("./features/Auth/pages/Login"));
const Signup = lazy(() => import("./features/Auth/pages/Signup"));
const OtpGeneration = lazy(() => import("./features/Auth/pages/OtpGeneration"));
const SubscriptionFlow = lazy(
  () => import("./features/SellerDashboard/SubscriptionFlow"),
);
const AdminDashboard = lazy(() => import("./features/Admin/pages/Admindashboard"));
const SellerDashboard = lazy(
  () => import("./features/SellerDashboard/Sellerdashboard"),
);
const AddProduct = lazy(() => import("./features/SellerDashboard/AddProduct"));
const Sellerorders = lazy(
  () => import("./features/SellerDashboard/Sellerorders"),
);
const ProfilePage = lazy(() => import("./features/Auth/pages/ProfilePage"));
const ProductDetails = lazy(
  () => import("./features/Products/pages/ProductDetails"),
);
const Wishlist = lazy(() => import("./features/Transactions/Whishlist"));
const CartPage = lazy(() => import("./features/Transactions/CartPage"));
const AllReviewsPage = lazy(
  () => import("./features/Products/pages/AllReviewsPage"),
);

// ─── Loading screen ────────────────────────────────────────────────────────────
const LoadingScreen = memo(() => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f1f5f9",
      fontFamily: "sans-serif",
      color: "#94a3b8",
      fontSize: 14,
      gap: 10,
    }}
  >
    <span
      style={{
        width: 18,
        height: 18,
        border: "2px solid #cbd5e1",
        borderTopColor: "#1132d4",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        display: "inline-block",
      }}
    />
    Loading…
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
));
LoadingScreen.displayName = "LoadingScreen";

// ─── Route guards ──────────────────────────────────────────────────────────────
function AdminRoute({ children }) {
  const { user, isAuthenticated, initializing } = useAuth();
  if (initializing) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function SellerRoute({ children }) {
  const { user, isAuthenticated, initializing } = useAuth();
  if (initializing) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "seller") return <Navigate to="/subscribe" replace />;
  return children;
}

function UserProfileRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ─── Layouts ──────────────────────────────────────────────────────────────────
const MainLayout = memo(({ children }) => (
  <>
    <NavBar />
    {children}
  </>
));
MainLayout.displayName = "MainLayout";

const BareLayout = ({ children }) => children;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <ProductProvider>
          <BuySellProvider>
            <SubscriptionProvider>
              <Toaster position="top-right" />
              <Suspense fallback={<LoadingScreen />}>
                <BrowserRouter>
                  <Routes>
                    {/* ── Admin ── */}
                    <Route
                      path="/admin-dashboard"
                      element={
                        <AdminRoute>
                          <RouteErrorBoundary fallbackPath="/">
                            <BareLayout>
                              <AdminDashboard />
                            </BareLayout>
                          </RouteErrorBoundary>
                        </AdminRoute>
                      }
                    />

                    {/* ── Seller ── */}
                    <Route
                      path="/seller-dashboard"
                      element={
                        <SellerRoute>
                          <RouteErrorBoundary fallbackPath="/">
                            <BareLayout>
                              <SellerDashboard />
                            </BareLayout>
                          </RouteErrorBoundary>
                        </SellerRoute>
                      }
                    />
                    <Route
                      path="/add-product"
                      element={
                        <SellerRoute>
                          <BareLayout>
                            <AddProduct />
                          </BareLayout>
                        </SellerRoute>
                      }
                    />
                    <Route
                      path="/orders"
                      element={
                        <SellerRoute>
                          <BareLayout>
                            <Sellerorders />
                          </BareLayout>
                        </SellerRoute>
                      }
                    />

                    {/* ── Protected user ── */}
                    <Route
                      path="/profile"
                      element={
                        <UserProfileRoute>
                          <BareLayout>
                            <ProfilePage />
                          </BareLayout>
                        </UserProfileRoute>
                      }
                    />

                    {/* ── Public ── */}
                    <Route
                      path="/"
                      element={
                        <MainLayout>
                          <Home />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/login"
                      element={
                        <MainLayout>
                          <Login />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/signup"
                      element={
                        <MainLayout>
                          <Signup />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/otp"
                      element={
                        <MainLayout>
                          <OtpGeneration />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/subscribe"
                      element={
                        <MainLayout>
                          <SubscriptionFlow />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/product/:id"
                      element={
                        <MainLayout>
                          <ProductDetails />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/product/:id/reviews"
                      element={
                        <MainLayout>
                          <AllReviewsPage />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/wishlist"
                      element={
                        <MainLayout>
                          <Wishlist />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <MainLayout>
                          <CartPage />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/phones"
                      element={
                        <MainLayout>
                          <PhonesPage />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/laptops"
                      element={
                        <MainLayout>
                          <LaptopsPage />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/tablets"
                      element={
                        <MainLayout>
                          <TabletsPage />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/smartwatches"
                      element={
                        <MainLayout>
                          <SmartwatchPage />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/televisions"
                      element={
                        <MainLayout>
                          <TVPage />
                        </MainLayout>
                      }
                    />
                    <Route
                      path="/nearby-devices"
                      element={
                        <BareLayout>
                          <NearbyDevicesPage />
                        </BareLayout>
                      }
                    />

                    {/* Support */}
                    <Route
                      path="/support"
                      element={
                        <MainLayout>
                          <Support />
                        </MainLayout>
                      }
                    />

                    <Route
                      path="/blog"
                      element={
                        <MainLayout>
                          <Blog />
                        </MainLayout>
                      }
                    />

                    <Route
                      path="/about"
                      element={
                        <MainLayout>
                          <AboutPage />
                        </MainLayout>
                      }
                    />

                    <Route
                      path="/sell/*"
                      element={
                        <SellFlowProvider>
                          <MainLayout>
                            <Routes>
                              <Route index element={<SellPhones />} />
                              <Route path="laptops" element={<SellLaptops />} />
                              <Route path="tablet" element={<SellTablets />} />
                              <Route
                                path="smartwatch"
                                element={<SellSmartwatchs />}
                              />
                              <Route
                                path="television"
                                element={<SellTelevisions />}
                              />
                              <Route
                                path="variant"
                                element={<ChooseVariant />}
                              />
                              <Route
                                path="base-price"
                                element={<BasePrice />}
                              />
                              <Route path="questions" element={<YesNo />} />
                              <Route
                                path="defects"
                                element={<DefectSelection />}
                              />
                              <Route
                                path="defects/:defectKey"
                                element={<SubDefectPage />}
                              />{" "}
                              {/* ← ADD THIS before :category/:brand */}
                              <Route
                                path="accessories"
                                element={<AccessorySelection />}
                              />
                              <Route
                                path="final-price"
                                element={<FinalPrice />}
                              />
                              <Route path="success" element={<SellSuccess />} />
                              <Route
                                path=":category/:brand"
                                element={<SelectModel />}
                              />{" "}
                              <Route
                                path="*"
                                element={<Navigate to="/sell" replace />}
                              />
                            </Routes>
                          </MainLayout>
                        </SellFlowProvider>
                      }
                    />

                    {/* ── Catch-all ── */}
                    <Route
                      path="*"
                      element={
                        <MainLayout>
                          <NotFound />
                        </MainLayout>
                      }
                    />
                  </Routes>
                </BrowserRouter>
              </Suspense>
            </SubscriptionProvider>
          </BuySellProvider>
        </ProductProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
