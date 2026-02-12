import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - AryoPath",
  description: "AryoPath Admin Panel",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Sidebar/Nav will go here */}
      <div className="flex">
        <aside className="w-64 min-h-screen bg-gray-900 text-white">
          <div className="p-4">
            <h1 className="text-xl font-bold">AryoPath Admin</h1>
          </div>
          <nav className="mt-4">
            <a href="/admin/dashboard" className="block px-4 py-2 hover:bg-gray-800">
              Dashboard
            </a>
            <a href="/admin/orders" className="block px-4 py-2 hover:bg-gray-800">
              Orders
            </a>
            <a href="/admin/products" className="block px-4 py-2 hover:bg-gray-800">
              Products
            </a>
            <a href="/admin/users" className="block px-4 py-2 hover:bg-gray-800">
              Users
            </a>
            <a href="/admin/analytics" className="block px-4 py-2 hover:bg-gray-800">
              Analytics
            </a>
            <a href="/admin/settings" className="block px-4 py-2 hover:bg-gray-800">
              Settings
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
