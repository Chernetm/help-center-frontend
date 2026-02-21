import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired } from "../utils/authUtils";

const ProtectedAdminRoute = () => {
  const adminId = localStorage.getItem("adminId");
  const token = localStorage.getItem("adminToken");

  // not logged in or expired
  const expired = token && isTokenExpired(token);
  if (!adminId || !token || expired) {
    if (expired) {
      // perform cleanup
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminId");
      localStorage.removeItem("role");
      // Or use clearAuthData() if imported, but let's keep it simple or import it. 
      // Actually, let's just clear specific admin items to be safe, or use the util.
      // Importing clearAuthData from ../utils/authUtils is better.
    }
    return <Navigate to="/admin-login" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
