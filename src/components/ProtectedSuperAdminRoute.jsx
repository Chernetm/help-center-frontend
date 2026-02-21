import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired } from "../utils/authUtils";

const ProtectedSuperAdminRoute = () => {
    const adminId = localStorage.getItem("adminId");
    const token = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role")?.trim();

    // not logged in or expired or not super_admin
    const expired = token && isTokenExpired(token);

    if (!adminId || !token || expired || role !== "super_admin") {
        if (expired) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminId");
            localStorage.removeItem("role");
        }

        // If logged in but not super_admin, redirect to admin dashboard or home
        if (adminId && token && !expired && role !== "super_admin") {
            return <Navigate to="/dashboard/admin" replace />;
        }

        return <Navigate to="/admin-login" replace />;
    }

    return <Outlet />;
};

export default ProtectedSuperAdminRoute;
