import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { UserProvider } from './context/UserProvider';
import { ProductProvider } from './context/ProductContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';

import { SiteSettingsProvider } from './context/SiteSettingsContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ToastContainer from './components/Toast';
import VerificationAlert from './components/VerificationAlert';
import LandingPage from './pages/LandingPage';
import PackagePage from './pages/PackagePage';
import OfferPage from './pages/OfferPage';
import TestPage from './pages/TestPage';
import PackageDetailedPage from './pages/PackageDetailedPage';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import CartPage from './pages/CartPage';
import OrderPage from './pages/OrderPage';
import OrderHistory from './pages/OrderHistory';
import VerifyEmail from './pages/VerifyEmail';
import { OrderSuccessProvider } from './context/OrderSuccessContext';
import { ScrollToTopProvider } from './context/ScrollToTopProvider';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);
function App() {
  return (
    <ToastProvider>
      <UserProvider>
        <ProductProvider>
          <CartProvider>
            <SiteSettingsProvider>
              <Router>
                <OrderSuccessProvider>
                  <ScrollToTopProvider>
                    <div className="min-h-screen flex flex-col">
                      <Header />
                      <VerificationAlert />
                      <main className="grow">
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/packages" element={<PackagePage />} />
                            <Route path="/packages/:slug/:type/:code" element={<PackageDetailedPage />} />
                            <Route path="/tests" element={<TestPage />} />
                            <Route path="/offers" element={<OfferPage />} />
                            <Route path="/account" element={<AccountPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/orders" element={<OrderPage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route path="/order-history" element={<OrderHistory />} />
                            <Route path="/popular-packages" element={<Navigate to="/packages" replace />} />
                            <Route path="/all-tests" element={<Navigate to="/tests" replace />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            <Route path="/verify-email/:token" element={<VerifyEmail />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </Suspense>
                      </main>
                      <Footer />
                      <ToastContainer />
                    </div>
                  </ScrollToTopProvider>
                </OrderSuccessProvider>
              </Router>
            </SiteSettingsProvider>
          </CartProvider>
        </ProductProvider>
      </UserProvider>
    </ToastProvider>
  );
}

export default App;
