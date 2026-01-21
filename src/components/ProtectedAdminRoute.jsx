import { Navigate, Outlet } from "react-router-dom";

const ProtectedAdminRoute = () => {
  const adminId = localStorage.getItem("adminId");

  // not logged in
  if (!adminId) {
    return <Navigate to="/admin-login" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
