import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setShowSignup(false);
    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:3000/api/auth/login/user",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404 || res.status === 401) {
          setShowSignup(true);
        }
        throw new Error(data.error || "Login failed");
      }

      // ✅ store admin token
      localStorage.setItem("adminToken", data.token);

      setMessage("Login successful ✅");

      // ✅ redirect to protected route
      navigate("/agent");

    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">
          Admin Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* name */}
          <div>
            <label className="block text-sm font-medium">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* MESSAGE */}
        {message && (
          <p className="mt-4 text-center text-sm text-red-600">
            {message}
          </p>
        )}

        {(
          <div className="mt-4 text-center">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/admin-register")}
              className="text-blue-600 font-semibold hover:underline"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

