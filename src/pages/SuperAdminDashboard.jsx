import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Shield,
  Briefcase,
  Search,
  Edit2,
  Check,
  X,
  Users,
  Activity,
  Layers,
  TrendingUp,
  MoreVertical,
  Filter
} from "lucide-react";
import { getAdmins, getAdminCases, updateAdmin } from "../api/admin";

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, color, trend }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between transition-transform hover:scale-[1.02] duration-300">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      {trend && (
        <p className={`text-xs font-medium mt-2 flex items-center ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          <TrendingUp className="w-3 h-3 mr-1" />
          {trend}% from last month
        </p>
      )}
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminsData, casesData] = await Promise.all([
          getAdmins(),
          getAdminCases(),
        ]);
        setAdmins(adminsData);
        const uniqueDepartments = [
          ...new Set(casesData.map((c) => c.department).filter(Boolean)),
        ];
        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (uid) => {
    try {
      await updateAdmin(uid, editFormData);
      setAdmins((prev) =>
        prev.map((admin) =>
          admin.uid === uid ? { ...admin, ...editFormData } : admin
        )
      );
      setEditingAdmin(null);
      setEditFormData({});
    } catch (error) {
      console.error("Error updating admin:", error);
      alert("Failed to update admin");
    }
  };

  const startEdit = (admin) => {
    setEditingAdmin(admin.uid);
    setEditFormData({
      role: admin.role,
      department: admin.department,
      status: admin.status || "Active",
    });
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Computed Stats
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter(a => a.status === 'Active' || !a.status).length;
  const superAdmins = admins.filter(a => a.role === 'super_admin').length;
  const totalDepartments = departments.length; // Or unique departments from admins

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Super Admin <span className="text-indigo-600">Console</span>
            </h1>
            <p className="text-gray-500 mt-1 text-lg">
              Manage system access, roles, and departmental oversight.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 font-medium shadow-sm hover:bg-gray-50 transition">
              Switch Dashboard
            </a>
            <button className="bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 font-medium shadow-sm hover:bg-gray-50 transition">
              Export Report
            </button>
            <button className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Security Log
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Total Administrators"
            value={totalAdmins}
            color="bg-blue-500"
            trend={12}
          />
          <StatCard
            icon={Activity}
            title="Active Now"
            value={activeAdmins}
            color="bg-emerald-500"
            trend={5}
          />
          <StatCard
            icon={Shield}
            title="Super Admins"
            value={superAdmins}
            color="bg-purple-500"
          />
          <StatCard
            icon={Layers}
            title="Departments"
            value={totalDepartments}
            color="bg-orange-500"
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Toolbar */}
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-500" />
              Admin List
            </h2>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="p-2.5 bg-gray-50 text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-100 transition">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Profile</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-12 text-gray-500">Loading data...</td></tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-gray-500">No admins match your search.</td></tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.uid} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${admin.role === 'super_admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                            }`}>
                            {admin.firstName?.[0]}{admin.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{admin.firstName} {admin.lastName}</div>
                            <div className="text-xs text-gray-500">{admin.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {editingAdmin === admin.uid ? (
                          <select
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={editFormData.role || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                          >
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="agent">Agent</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${admin.role === 'super_admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : admin.role === 'agent'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                            {admin.role === 'super_admin' && <Shield className="w-3 h-3 mr-1" />}
                            {admin.role || "N/A"}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {editingAdmin === admin.uid ? (
                          <select
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={editFormData.department || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                          >
                            <option value="">Select Dept</option>
                            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center text-sm text-gray-600">
                            <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                            {admin.department || "Unassigned"}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {editingAdmin === admin.uid ? (
                          <select
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={editFormData.status || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                          </select>
                        ) : (
                          <div className="flex items-center">
                            <span className={`flex w-2.5 h-2.5 rounded-full mr-2 ${admin.status === 'Active' || !admin.status
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                              : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                              }`}></span>
                            <span className={`text-sm font-medium ${admin.status === 'Active' || !admin.status ? 'text-gray-700' : 'text-red-600'
                              }`}>
                              {admin.status || "Active"}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {editingAdmin === admin.uid ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(admin.uid)}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingAdmin(null)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(admin)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (Visual only for now) */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {filteredAdmins.length} admins</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
