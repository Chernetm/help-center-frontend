import { useEffect, useState } from "react";
import { fetchUserPerformance } from "../api/adminApi";
import { logoutAdmin } from "../api/auth";
import UserPerformanceCard from "../components/UserPerformanceCard";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchUserPerformance();
        console.log("Fetched User Performance Data:", data);
        console.log("Data Type:", data?.length ? typeof data[0] : "No data");
        setUsers(data || []);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      localStorage.removeItem("adminId");
      localStorage.removeItem("adminToken"); // Just in case it was there
      window.location.href = "/admin-login";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading Analytics...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-50 p-6 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to load performance data</h3>
        <p className="text-red-600/70 max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
        >
          Try Again
        </button>
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Team <span className="text-indigo-600">Performance</span>
          </h1>
          <p className="text-gray-500 mt-1">Real-time engagement and activity metrics for all agents.</p>
        </div>

        <div className="flex gap-3">
          <a href="/dashboard" className="px-6 py-3 bg-white text-gray-600 font-bold rounded-2xl border border-gray-100 hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
            Switch Dashboard
          </a>
          <a href="/dashboard/super" className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-2xl border border-indigo-100 hover:bg-indigo-50 transition shadow-sm flex items-center gap-2">
            Team Settings
          </a>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 transition shadow-sm flex items-center gap-2"
          >
            Logout
          </button>
        </div>
      </div>

      {!users || users.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400 text-lg">No active agents found in the system.</p>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {users.map(user => (
            <UserPerformanceCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
