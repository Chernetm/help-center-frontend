import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquarePlus } from 'lucide-react';
import { Button } from '../../ui/Button';

export default function CaseSelectorModal({ isOpen, onClose, cases, onSelectCase }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquarePlus className="text-indigo-600" size={20} />
                            New Ticket
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <p className="text-sm text-gray-500 mb-4">Select a topic to start a conversation:</p>
                        <div className="space-y-2">
                            {cases.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        onSelectCase(c.id);
                                        onClose();
                                    }}
                                    className="w-full text-left p-3 rounded-xl border hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                >
                                    <div className="font-semibold text-gray-800 group-hover:text-indigo-700">{c.name}</div>
                                    <div className="text-xs text-gray-500">{c.department}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
