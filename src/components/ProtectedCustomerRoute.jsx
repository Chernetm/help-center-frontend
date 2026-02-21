import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired } from "../utils/authUtils";

const ProtectedCustomerRoute = () => {
  const token = localStorage.getItem("customerToken");

  // not logged in or expired
  const expired = token && isTokenExpired(token);
  if (!token || expired) {
    if (expired) {
      localStorage.removeItem("customerToken");
      // Or perform full cleanup if desired
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedCustomerRoute;
