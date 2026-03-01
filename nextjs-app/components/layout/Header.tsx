'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useSiteSettings } from '@/providers/SiteSettingsProvider';
import { useCart } from '@/providers/CartProvider';
import { useAuthModal } from '@/providers/AuthModalProvider';
import { useUser } from '@/providers/UserProvider';
import { Logo } from '@/components/ui';
import SearchBar from '@/components/search/SearchBar';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Popular Packages', href: '/profiles' },
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

interface DesktopNavProps {
  user: { firstName: string; lastName: string } | null;
  onLogin: () => void;
  onLogout: () => void;
}

const DesktopNav = ({ user, onLogin, onLogout }: DesktopNavProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogoutClick = () => {
    onLogout();
    setIsDropdownOpen(false);
  };

  return (
    <div className="hidden lg:flex items-center gap-4">
      {user ? (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
              Hi, {user.firstName}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
                <Link
                  href="/account"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Account
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Login
        </button>
      )}
    </div>
  );
};

interface MobileDrawerProps {
  open: boolean;
  user: { firstName: string; lastName: string } | null;
  onLogin: () => void;
  onLogout: () => void;
  onClose: () => void;
}

const MobileDrawer = ({ open, user, onLogin, onLogout, onClose }: MobileDrawerProps) => {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
      />
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 animate-slide-in-right">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900">Hi, {user.firstName}</p>
              </div>
            ) : (
              <button
                onClick={() => { onLogin(); onClose(); }}
                className="px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg"
              >
                Login to Your Account
              </button>
            )}

            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} className="text-gray-600" />
            </button>
          </div>

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
              {user && (
                <>
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => { onLogout(); onClose(); }}
                    className="w-full text-left block px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                  >
                    Logout
                  </button>
                </>
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

interface HeaderProps {
  children?: ReactNode;
}

const Header = ({ children }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { user, logout } = useUser();
  const { cart } = useCart();
  const cartCount = cart?.items?.length || 0;
  const { settings, loading } = useSiteSettings();
  const { openAuth } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    openAuth('login');
  };

  // Show confirmation dialog instead of logging out immediately
  const handleLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setLogoutConfirmOpen(false);
    setMenuOpen(false);
    router.push('/');
  };

  // Prevent hydration mismatch by not rendering user-dependent content until mounted
  const showUserNav = mounted;

  return (
    <>
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
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
              <CartIcon count={cartCount} />
              {showUserNav ? (
                <DesktopNav
                  user={user}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                />
              ) : (
                <div className="hidden lg:block w-[100px]" />
              )}

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

      <MobileDrawer
        open={menuOpen}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onClose={() => setMenuOpen(false)}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout? You will need to login again to access your cart and orders."
        type="danger"
        confirmText="Yes, Logout"
        cancelText="Cancel"
      />

      {children}
    </>
  );
};

export default Header;