import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserProvider';
import { ProductProvider } from './context/ProductContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';

import { SiteSettingsProvider } from './context/SiteSettingsContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ToastContainer from './components/Toast';
import LandingPage from './pages/LandingPage';
import PackagePage from './pages/PackagePage';
import OfferPage from './pages/OfferPage';
import TestPage from './pages/TestPage';
import PackageDetailedPage from './pages/PackageDetailedPage';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import CartPage from './pages/CartPage';
import OrderPage from './pages/OrderPage';
import OrderHistory from './pages/OrderHistory'
import { OrderSuccessProvider } from './context/OrderSuccessContext';
import { ScrollToTopProvider } from './context/ScrollToTopProvider';
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
                      <main className="grow">
                        <Routes>
                          <Route path="/" element={<LandingPage />} />
                          <Route path="/packages" element={<PackagePage />} />
                          <Route path="/packages/:slug" element={<PackageDetailedPage />} />
                          <Route path="/tests" element={<TestPage />} />
                          <Route path="/offers" element={<OfferPage />} />
                          <Route path="/account" element={<AccountPage />} />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/orders" element={<OrderPage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/order-history" element={<OrderHistory />} />
                          <Route path="/popular-packages" element={<Navigate to="/packages" replace />} />
                          <Route path="/all-tests" element={<Navigate to="/tests" replace />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
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
