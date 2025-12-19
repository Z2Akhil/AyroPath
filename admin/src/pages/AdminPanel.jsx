import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, ChevronDown, ChevronUp, LogOut, User, ChevronLeft, ChevronRight, Home, BarChart3, ShoppingCart, Package, Users, Bell, Settings, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MobileDrawer from "../components/auth/MobileDrawer";

export default function AdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Load sidebar state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDesktopSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleProduct = () => setProductOpen(!productOpen);

  const getCurrentPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('/home') || path === '/') return 'Home';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/orders')) return 'Orders';
    if (path.includes('/offers')) return 'Offers';
    if (path.includes('/packages')) return 'Packages';
    if (path.includes('/tests')) return 'Tests';
    if (path.includes('/users')) return 'Users';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/account')) return 'Account';
    if (path.includes('/settings')) return 'Settings';
    
    return 'Dashboard';
  };

  const currentPageTitle = getCurrentPageTitle();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className={`hidden lg:block z-40 h-full bg-white shadow-md transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
          )}
          <button
            onClick={toggleDesktopSidebar}
            className="p-1 rounded-md hover:bg-blue-800 transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5 text-white" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-white" />
            )}
          </button>
        </div>

        <nav className="p-4 space-y-2 text-gray-700">
          <NavLink
            to="home"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200`}
            title="Home"
          >
            <Home className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Home</span>}
          </NavLink>
          <NavLink
            to="reports"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200`}
            title="Analytics"
          >
            <BarChart3 className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Analytics</span>}
          </NavLink>
          <NavLink
            to="orders"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200`}
            title="Orders"
          >
            <ShoppingCart className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Orders</span>}
          </NavLink>

          <button
            onClick={toggleProduct}
            className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-between'} items-center w-full ${sidebarCollapsed ? 'px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200`}
            title="Products"
          >
            <div className="flex items-center">
              <Package className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Products</span>}
            </div>
            {!sidebarCollapsed && (productOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
          </button>

          {productOpen && !sidebarCollapsed && (
            <div className="pl-8 space-y-2 text-sm">
              <NavLink
                to="offers"
                className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200"
              >
                Offers
              </NavLink>
              <NavLink
                to="packages"
                className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200"
              >
                Packages
              </NavLink>
              <NavLink
                to="tests"
                className="block px-3 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200"
              >
                Tests
              </NavLink>
            </div>
          )}

          <NavLink
            to="users"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200`}
            title="Users"
          >
            <Users className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Users</span>}
          </NavLink>
          <NavLink
            to="notifications"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200`}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Notifications</span>}
          </NavLink>
          <NavLink
            to="settings"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200`}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Settings</span>}
          </NavLink>
          <NavLink
            to="account"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-md hover:bg-blue-50 font-medium transition-all duration-200`}
            title="Account"
          >
            <UserCircle className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Account</span>}
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="lg:hidden">
              <Menu className="text-gray-700" />
            </button>
            <h2 className="text-lg font-semibold text-gray-700">
              {currentPageTitle}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User size={16} />
                <span>{user.adminProfile?.name || user.username}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Drawer - Enhanced mobile experience */}
      <MobileDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        productOpen={productOpen}
        toggleProduct={toggleProduct}
      />
    </div>
  );
}
