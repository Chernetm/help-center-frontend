import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  Phone,
  User,
  Mail,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../components/ui/Button";

export default function AdminRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    address: "",
    image: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:8090/api/admin/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Registration failed");
      }

      navigate("/admin/login", {
        state: { message: "Admin account created successfully" },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row-reverse"
      >
        {/* Right Side - SAME AS CUSTOMER */}
        <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-30"></div>
          <div className="relative z-10 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-6">Admin Access</h2>
            <p className="text-indigo-100 mb-8">
              Create administrator accounts to manage departments and system
              operations.
            </p>
            <ul className="space-y-3 text-sm text-indigo-50 hidden md:block">
              <li>✓ Manage users</li>
              <li>✓ Department control</li>
              <li>✓ System configuration</li>
            </ul>
          </div>
        </div>

        {/* Left Side - FORM (EXACT STYLE) */}
        <div className="md:w-1/2 p-12">
          <div className="text-center md:text-left mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              Create Admin Account
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Only authorized personnel should register.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <Field
              label="First Name"
              icon={<User size={18} />}
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="John"
              required
            />

            {/* Last Name */}
            <Field
              label="Last Name"
              icon={<User size={18} />}
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Doe"
              required
            />

            {/* Phone */}
            <Field
              label="Phone Number"
              icon={<Phone size={18} />}
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="+251..."
              required
            />

            {/* Email */}
            <Field
              label="Email"
              icon={<Mail size={18} />}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@example.com"
            />

            {/* Password */}
            <Field
              label="Password"
              icon={<Lock size={18} />}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

    

            {/* Address */}
            <Field
              label="Address"
              icon={<MapPin size={18} />}
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Addis Ababa"
            />

            {/* Image */}
            <Field
              label="Profile Image URL"
              icon={<ImageIcon size={18} />}
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://..."
            />

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Creating..." : "Register Admin"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- Reusable Fields (same style) ---------------- */

const Field = ({ icon, label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        {...props}
        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
      />
    </div>
  </div>
);

const SelectField = ({ icon, label, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <select
        {...props}
        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  </div>
);
