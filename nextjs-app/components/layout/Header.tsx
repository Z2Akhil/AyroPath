'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { useSiteSettings } from '@/providers/SiteSettingsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Logo } from '@/components/ui';
import SearchBar from '@/components/search/SearchBar';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Popular Packages', href: '/packages' },
  { label: 'Offers', href: '/offers' },
  { label: 'All Tests', href: '/tests' },
  { label: 'About Us', href: '/about' },
];

const CartIcon = ({ count }: { count: number }) => (
  <Link href="/cart" aria-label={`Shopping cart with ${count} items`} className="relative group cursor-pointer">
    <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors duration-300">
      <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors duration-300" />
    </div>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-linear-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
        {count}
      </span>
    )}
  </Link>
);

const DesktopNav = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { success } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    success('You have been logged out successfully');
    setShowLogoutConfirm(false);
  };

  if (showLogoutConfirm) {
    return (
      <div className="hidden lg:flex items-center gap-3">
        <span className="text-sm text-gray-600">Logout?</span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          Yes
        </button>
        <button
          onClick={() => setShowLogoutConfirm(false)}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="hidden lg:flex items-center gap-3">
        <Link href="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group">
          <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Hi, {user.name}</span>
        </Link>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="hidden lg:block px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
    >
      Login
    </Link>
  );
};

const MobileDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { success } = useToast();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    success('Logged out successfully');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 animate-slide-in-right">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            {isAuthenticated && user ? (
              <Link href="/account" onClick={onClose} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Welcome, {user.name}</p>
                  <p className="text-sm text-gray-500">Manage your account</p>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg"
              >
                Login to Your Account
              </Link>
            )}

            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {isAuthenticated && (
            <div className="px-6 pb-4 border-b border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}

          <nav className="flex-1 p-6 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navigation</p>
            <div className="space-y-2">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={onClose}
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                >
                  {label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  href="/account"
                  onClick={onClose}
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                >
                  My Orders
                </Link>
              )}
            </div>
          </nav>

          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">© {new Date().getFullYear()} Ayropath. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings, loading } = useSiteSettings();

  return (
    <>
      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>

      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 border-b border-gray-200/80 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Logo logo={settings?.logo} loading={loading} />
            
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <SearchBar />
            </div>

            <div className="flex items-center gap-4">
              <CartIcon count={0} />
              <DesktopNav />

              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Menu size={24} className="text-gray-700" />
              </button>
            </div>
          </div>

          <nav className="hidden lg:block border-t border-gray-100/80">
            <div className="flex items-center justify-between py-4">
              <ul className="flex items-center gap-8">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 relative group"
                    >
                      {label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4 text-sm">
                <Link href="/help" className="text-gray-600 hover:text-blue-600 transition-colors">Help Center</Link>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                {!loading && settings?.helplineNumber && (
                  <a href={`tel:${settings.helplineNumber}`} className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                    📞 {settings.helplineNumber}
                  </a>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>

      <div className="lg:hidden bg-white/90 backdrop-blur-xl border-b border-gray-200/80 px-4 py-3 relative z-30">
        <SearchBar />
      </div>

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default Header;