// OrderSuccessContext.jsx
import React, { createContext, useState, useContext } from 'react';
import SuccessOrderCard from "../components/cards/SuccessOrderCard"; // Adjust path as needed
import {useNavigate} from "react-router-dom";
const OrderSuccessContext = createContext();

export const useOrderSuccess = () => useContext(OrderSuccessContext);

export const OrderSuccessProvider = ({ children }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate=useNavigate();

  const showSuccessCard = (details) => {
    setOrderDetails(details);
    setShowSuccess(true);
  };

  const closeSuccessCard = () => {
    setShowSuccess(false);
    setOrderDetails(null);
    navigate("/");
  };

  return (
    <OrderSuccessContext.Provider value={{ showSuccessCard }}>
      {children}
      
      {/* Universal Success Card Renderer */}
      {showSuccess && orderDetails && (
        <SuccessOrderCard
          orderId={orderDetails.orderId}
          packageName={orderDetails.packageName}
          amount={orderDetails.amount}
          onClose={closeSuccessCard}
        />
      )}
    </OrderSuccessContext.Provider>
  );
};