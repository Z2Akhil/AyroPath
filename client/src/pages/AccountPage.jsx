import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useUser } from '../context/userContext';
import { User, Edit3, Save, Phone, Lock, Loader, ShoppingCart, FileText } from 'lucide-react';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import Modal from '../components/Modal';
import fetchUserOrders from "../api/fetchUserOrders";   // ⬅️ ADD THIS

const AccountPage = () => {
  const { user, updateProfile, loading: userLoading } = useUser();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ----------- NEW: Order States -----------
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  // PREFILL USER DATA
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setState(user.state || '');
    }
  }, [user]);


  // ----------- NEW: Fetch Orders from Backend -----------
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        const data = await fetchUserOrders(); // ← calls backend
        setOrders(data || []);
      } catch (err) {
        setOrdersError("Unable to load orders.");
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, []);


  // SAVE PROFILE
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      const result = await updateProfile({
        firstName,
        lastName,
        email,
        address,
        city,
        state
      });

      setProfileSuccess(result.message || 'Profile updated!');
      setIsEditingProfile(false);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileCancel = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setAddress(user?.address || '');
    setCity(user?.city || '');
    setState(user?.state || '');
    setIsEditingProfile(false);
    setProfileError('');
    setProfileSuccess('');
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader className="animate-spin text-blue-600 h-10 w-10" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 bg-gray-50 min-h-[calc(100vh-200px)]">

      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* ------------------- PROFILE SECTION ------------------- */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md border border-gray-100 self-start">

          {/* Profile Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <User size={20} className="text-blue-600" /> My Profile
            </h2>

            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Edit3 size={14} /> Edit
              </button>
            )}
          </div>

          {profileError && (
            <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded">
              {profileError}
            </p>
          )}
          {profileSuccess && (
            <p className="text-green-600 text-sm mb-4 p-3 bg-green-50 rounded">
              {profileSuccess}
            </p>
          )}

          {/* Editing Mode */}
          {isEditingProfile ? (
            <form onSubmit={handleProfileSave} className="space-y-4">

              <div>
                <label className="block text-sm mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSavingProfile}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSavingProfile}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSavingProfile}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSavingProfile}
                  className="w-full px-3 py-2 border rounded text-sm"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isSavingProfile}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={isSavingProfile}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded">
                  {isSavingProfile ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleProfileCancel}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  Cancel
                </button>
              </div>

            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Name:</span> {firstName} {lastName}</p>
              <p><span className="font-medium">Phone:</span> {user.mobileNumber}</p>
              {email && <p><span className="font-medium">Email:</span> {email}</p>}
              {address && <p><span className="font-medium">Address:</span> {address}</p>}
              {(city || state) && <p><span className="font-medium">Location:</span> {city}, {state}</p>}

              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Lock size={14} /> Change Password
              </button>
            </div>
          )}
        </div>


        {/* ------------------- MY ORDERS SECTION ------------------- */}
        <div className="md:col-span-2 space-y-6">

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> My Orders
              </h2>

              <Link
                to="/order-history"
                className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                History
              </Link>
            </div>

            {ordersLoading && (
              <div className="flex justify-center py-6">
                <Loader className="animate-spin text-blue-600 h-8 w-8" />
              </div>
            )}

            {ordersError && (
              <p className="text-red-600 text-sm mt-4 bg-red-50 p-3 rounded">
                {ordersError}
              </p>
            )}

            {!ordersLoading && !ordersError && (
              <div className="mt-4 space-y-3">

                {orders.filter(order =>
                  order.status &&
                  !["DONE", "REPORTED", "CANCELLED", "FAILED"].includes(order.status.toUpperCase())
                ).length === 0 ? (
                  <p className="text-gray-500 text-sm">You haven't placed any orders yet.</p>
                ) : (
                  orders.filter(order =>
                    order.status &&
                    !["DONE", "REPORTED", "CANCELLED", "FAILED"].includes(order.status.toUpperCase())
                  ).map((order) => (
                    <div
                      key={order.orderId}
                      className="border border-gray-200 bg-gray-50 p-4 rounded-md shadow-sm"
                    >
                      <p className="font-semibold text-gray-900">
                        Order #{order.orderId}
                      </p>

                      <p className="text-gray-700 text-sm">
                        Package: {order.package?.name}
                      </p>

                      <p className="text-gray-600 text-sm">
                        Amount: ₹{order.package?.price}
                      </p>

                      <p className="text-gray-500 text-sm">
                        Appointment: {order.appointment?.date}
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        Status:{" "}
                        <span className="text-blue-600">{order.status || "PENDING"}</span>
                      </p>
                    </div>
                  ))
                )}

              </div>
            )}
          </div>

        </div>
      </div>

      {/* PASSWORD MODAL */}
      {showChangePasswordModal && (
        <Modal onClose={() => setShowChangePasswordModal(false)} showCloseButton={true}>
          <ForgotPasswordForm onClose={() => setShowChangePasswordModal(false)} />
        </Modal>
      )}
    </div>
  );
};

export default AccountPage;
