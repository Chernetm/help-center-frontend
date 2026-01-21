import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Activity, Settings, ArrowRight } from "lucide-react";

const DashboardSelector = () => {
    const navigate = useNavigate();

    const options = [
        {
            title: "Admin Dashboard",
            description: "Monitor team performance, agent activity, and real-time metrics.",
            icon: Users,
            path: "/dashboard/admin",
            color: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-200",
            label: "Performance & Tickets"
        },
        {
            title: "SuperAdmin Console",
            description: "Manage administrators, define roles, and oversee departmental settings.",
            icon: Shield,
            path: "/dashboard/super",
            color: "from-purple-500 to-fuchsia-600",
            shadow: "shadow-purple-200",
            label: "System & Management"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="max-w-5xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                        Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Administrator</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Please select the environment you wish to access. Your permissions grant you full access to both consoles.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {options.map((option, index) => (
                        <motion.button
                            key={option.title}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => navigate(option.path)}
                            className="group relative bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 text-left overflow-hidden"
                        >
                            {/* Decorative Background Icon */}
                            <option.icon className="absolute -right-8 -bottom-8 w-48 h-48 text-gray-50 group-hover:text-gray-100/50 transition-colors duration-500" />

                            <div className="relative z-10">
                                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${option.color} text-white shadow-lg ${option.shadow} mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                    <option.icon className="w-8 h-8" />
                                </div>

                                <span className="block text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">
                                    {option.label}
                                </span>

                                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                                    {option.title}
                                </h3>

                                <p className="text-gray-500 leading-relaxed mb-8">
                                    {option.description}
                                </p>

                                <div className="flex items-center text-sm font-bold text-gray-900 group-hover:gap-2 transition-all">
                                    Enter Dashboard
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Hover Border Effect */}
                            <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${option.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                        </motion.button>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-400 font-medium"
                >
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        System Online
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        v2.4.0 Stable
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardSelector;
