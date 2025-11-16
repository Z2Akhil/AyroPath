import { createContext, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollContext = createContext();

export const ScrollToTopProvider = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // change to "auto" if you don't want animation
    });
  }, [location.pathname]);

  return (
    <ScrollContext.Provider value={{}}>
      {children}
    </ScrollContext.Provider>
  );
};

// Optional if you ever want to use context later
export const useScrollToTop = () => useContext(ScrollContext);
