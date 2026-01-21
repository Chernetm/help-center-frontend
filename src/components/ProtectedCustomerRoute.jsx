import { Navigate, Outlet } from "react-router-dom";

const ProtectedCustomerRoute = () => {
  const token = localStorage.getItem("customerToken");

  // not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedCustomerRoute;
