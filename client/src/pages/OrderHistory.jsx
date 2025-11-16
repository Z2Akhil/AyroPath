import { useEffect, useState } from "react";
import fetchUserOrders from "../api/fetchUserOrders";
import { Loader, FileText } from "lucide-react";

const COMPLETED = ["DONE", "REPORTED", "CANCELLED", "FAILED"];

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      const allOrders = await fetchUserOrders();

      const completedOrders = allOrders.filter((o) =>
        COMPLETED.includes(o.status?.toUpperCase())
      );

      setOrders(completedOrders);
      setLoading(false);
    };

    loadHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Order History
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-700 mb-4">
          <FileText size={20} className="text-blue-600" />
          Past Orders
        </h2>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader className="animate-spin text-blue-600 h-10 w-10" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-sm">No past orders found.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.orderId}
                className="border border-gray-200 bg-gray-50 p-4 rounded-md"
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

                <p className="font-medium text-gray-700 text-sm mt-1">
                  Status:{" "}
                  <span className="text-green-600">{order.status}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
