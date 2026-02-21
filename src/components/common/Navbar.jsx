import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Search, HelpCircle, LogIn, User, Info, Phone, Lock, LogOut } from "lucide-react";
import clsx from "clsx";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [authStatus, setAuthStatus] = useState({
        isLogged: false,
        isAdmin: false
    });
    const location = useLocation();

    useEffect(() => {
        const isAdmin = !!localStorage.getItem("adminToken");
        const isCustomer = !!localStorage.getItem("customerToken");
        setAuthStatus({
            isLogged: isAdmin || isCustomer,
            isAdmin: isAdmin
        });
    }, [location.pathname]);

    const navLinks = [
        { name: "Home", path: "/home", icon: Home },
        { name: "About", path: "/about", icon: Info },
        { name: "Contact", path: "/contact", icon: Phone },
        { name: "Receipt", path: "/order-status", icon: Search },
        { name: "Help Center", path: "/help-center", icon: HelpCircle },
    ];

    const handleToggle = () => setIsOpen(!isOpen);

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("customerToken");
        localStorage.removeItem("adminId");
        localStorage.removeItem("role");
        window.location.href = "/";
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                            <span className="font-bold text-lg tracking-tighter">B</span>
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">Birhanena Selam</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={clsx(
                                    "text-sm font-medium transition-colors hover:text-indigo-600 relative",
                                    location.pathname === link.path ? "text-indigo-600" : "text-gray-600"
                                )}
                            >
                                {link.name}
                                {location.pathname === link.path && (
                                    <motion.div
                                        layoutId="underline"
                                        className="absolute left-0 top-full h-0.5 w-full bg-indigo-600 mt-1"
                                    />
                                )}
                            </Link>
                        ))}

                        <div className="h-6 w-px bg-gray-200 mx-4" />

                        {authStatus.isLogged ? (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    <Lock size={16} />
                                    <span>Change Password</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
                                    Login
                                </Link>
        
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={handleToggle}
                            className="text-gray-600 hover:text-indigo-600 transition-colors p-2"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                userType={authStatus.isAdmin ? "admin" : "customer"}
            />

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                                >
                                    <link.icon size={18} />
                                    <span className="font-medium">{link.name}</span>
                                </Link>
                            ))}
                            <div className="h-px bg-gray-100 my-2" />
                            {authStatus.isLogged ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            setIsPasswordModalOpen(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <Lock size={18} />
                                        <span className="font-medium">Change Password</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <LogOut size={18} />
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-indigo-600"
                                    >
                                        <LogIn size={18} />
                                        <span className="font-medium">Login</span>
                                    </Link>
                                    <Link
                                        to="/customer-register"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-indigo-600 font-medium bg-indigo-50 rounded-lg mt-2"
                                    >
                                        <User size={18} />
                                        <span>Create Account</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}


