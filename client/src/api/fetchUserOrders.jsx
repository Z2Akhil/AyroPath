import { axiosInstance } from "./axiosInstance";

const fetchUserOrders = async () => {
  try {
    const response = await axiosInstance.get("/orders/user");

    if (response.data?.success) {
      return response.data.data; // ✅ return array of orders
    } else {
      console.warn("⚠️ Unexpected API response:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
};

export default fetchUserOrders;
