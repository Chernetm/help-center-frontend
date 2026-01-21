import { Routes, Route, Navigate } from "react-router-dom";

import AdminRegister from "./pages/AdminRegister"; // TODO: Refactor this too later? User task didn't explicitly ask for admin register refactor, but it was in my list. I'll stick to what I did.
import Register from "./pages/Register";
import CaseRegister from "./components/CaseRegister";
import CustomerChat from "./components/customer/Chat/CustomerChat";
import Login from "./pages/Login";
import AdminChat from "./components/admin/Chat/AdminChat";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminOrders from "./components/admin/Orders/OrderForm";
import OrderLookup from "./components/customer/Orders/OrderLookup";
import ProtectedCustomerRoute from "./components/ProtectedCustomerRoute";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import DashboardSelector from "./pages/DashboardSelector";

function App() {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/home" element={<Home />} />
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      <Route path="/customer-register" element={<Register />} />
      <Route path="/admin-register" element={<AdminRegister />} />



      <Route element={<ProtectedAdminRoute />}>
        <Route path="/agent" element={<AdminChat />} />
        <Route path="/case-register" element={<CaseRegister />} />
        <Route path="/dashboard">
          <Route index element={<DashboardSelector />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="super" element={<SuperAdminDashboard />} />
          
        </Route>
        
      </Route>


      {/* <Route path="/order-status" element={<OrderLookup />} /> */}
      <Route element={<ProtectedCustomerRoute />}>
        <Route path="/help-center" element={<CustomerChat />} />
        <Route path="/order-status" element={<OrderLookup />} />
      </Route>

      <Route path="/login" element={<Login />} />

      {/* FALLBACK */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;

