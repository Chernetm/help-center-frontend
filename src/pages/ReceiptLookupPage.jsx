import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getExternalReceipt } from "../api/external";
import { Button } from "../components/ui/Button";

export default function ReceiptLookupPage() {
    const [id, setId] = useState("");
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (e) => {
        e.preventDefault();
        const searchId = id.trim();
        if (!searchId) return;

        setLoading(true);
        setError("");
        setReceipt(null);

        try {
            const data = await getExternalReceipt(searchId);
            setReceipt(data);
        } catch (err) {
            console.error("Lookup error:", err);
            if (err.response?.status === 404) {
                setError("No record found for the provided ID.");
            } else if (err.response?.status === 502 || err.response?.status === 504) {
                setError("External service timeout. Please try again later.");
            } else {
                setError("Unable to retrieve information at this time.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4">
            <div className="max-w-xl mx-auto">
                <header className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block p-3 bg-blue-600 rounded-2xl shadow-lg mb-6"
                    >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </motion.div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Receipt Lookup</h1>
                    <p className="text-slate-500 text-lg">Enter your Order ID to retrieve your digital summary</p>
                </header>

                <motion.form 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onSubmit={handleSearch}
                    className="relative group mb-16"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white p-2 rounded-2xl shadow-sm flex items-center border border-slate-100">
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            placeholder="Enter Order ID (e.g. 1001)"
                            className="flex-grow px-6 py-4 text-lg bg-transparent border-none focus:ring-0 text-slate-900 placeholder-slate-400 font-medium"
                        />
                        <Button
                            type="submit"
                            disabled={loading || !id.trim()}
                            className="px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-md disabled:bg-slate-300"
                        >
                            {loading ? "Searching..." : "Lookup"}
                        </Button>
                    </div>
                </motion.form>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-5 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-center font-semibold mb-8 shadow-sm flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {receipt && (
                        <motion.div
                            key="receipt"
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
                        >
                            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                    </svg>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Transaction Ref</h2>
                                            <p className="text-3xl font-mono font-bold tracking-tight">#{receipt.order_id || receipt.id || id}</p>
                                        </div>
                                        <div className="px-4 py-1.5 bg-blue-500/20 backdrop-blur-md rounded-full border border-blue-400/30">
                                            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">
                                                {receipt.status || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 mt-6 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-slate-400 text-xs font-medium uppercase mb-0.5">Department</p>
                                            <p className="font-semibold text-lg">{receipt.department || 'General'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-400 text-xs font-medium uppercase mb-0.5">Record Date</p>
                                            <p className="font-semibold text-lg">{receipt.created_at ? new Date(receipt.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-8">
                                <section>
                                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Description</h3>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-700 leading-relaxed text-lg">
                                        "{receipt.description || 'Professional record summary provided via automated digital system.'}"
                                    </div>
                                </section>

                                <section className="grid grid-cols-2 gap-8 py-2">
                                    <div>
                                        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Urgency Level</h4>
                                        <p className={`font-bold text-xl uppercase ${receipt.urgency === 'high' ? 'text-red-600' : 'text-slate-800'}`}>
                                            {receipt.urgency || 'Normal'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Internal ID</h4>
                                        <p className="font-bold text-xl text-slate-800">
                                            {receipt.ID || 'N/A'}
                                        </p>
                                    </div>
                                </section>

                                <div className="h-px bg-slate-100"></div>

                                <section className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Last Updated</h4>
                                        <p className="text-xl font-bold text-slate-900">
                                            {receipt.updated_at ? new Date(receipt.updated_at).toLocaleDateString() : 'Just now'}
                                        </p>
                                    </div>
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center group">
                                        <span>Print Record</span>
                                        <svg className="w-5 h-5 ml-2 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                    </button>
                                </section>
                            </div>

                            {/* Perforated Edge Footer */}
                            <div className="bg-slate-50 py-4 flex justify-between px-2 overflow-hidden">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-white flex-shrink-0 -mt-7"></div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <footer className="mt-20 text-center text-slate-400 text-sm font-medium">
                    <p>&copy; {new Date().getFullYear()} Customer Help Center Support</p>
                    <p className="mt-1">Digital Receipt Integration v1.0</p>
                </footer>
            </div>
        </div>
    );
}
