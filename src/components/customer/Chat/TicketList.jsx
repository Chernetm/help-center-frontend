import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageCircle } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../../ui/Button';
import { formatTelegramDate } from '../../../utils/dateUtils';

export default function TicketList({ tickets, selectedTicket, onSelectTicket, isLoading, onOpenNewTicket, isMobileView }) {

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-white border-r">
                <div className="animate-pulse text-gray-400">Loading chats...</div>
            </div>
        );
    }

    return (
        <div className={clsx("h-full bg-white flex flex-col relative",
            // On desktop we keep fixed width, on mobile it fills the container
            !isMobileView ? "w-full md:w-80 lg:w-96 border-r border-gray-200" : "w-full"
        )}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="font-bold text-lg text-gray-800">Messages</h2>
                {/* Mobile-only new ticket button in header (optional, or rely on FAB) */}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                        <MessageCircle size={32} className="mb-2 opacity-50" />
                        No conversations yet
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <motion.div
                            key={ticket.id}
                            onClick={() => onSelectTicket(ticket)}
                            whileHover={{ backgroundColor: "#f3f4f6" }}
                            className={clsx(
                                "p-3 rounded-xl cursor-pointer transition-colors flex gap-3",
                                selectedTicket?.id === ticket.id ? "bg-indigo-50" : "bg-white"
                            )}
                        >
                            {/* Avatar Placeholder */}
                            <div className="relative shrink-0">
                                <div className={clsx(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold",
                                    ticket.isClosed ? "bg-gray-400" : "bg-gradient-to-br from-indigo-500 to-purple-500"
                                )}>
                                    {ticket.agent?.name ? ticket.agent.name[0].toUpperCase() : "A"}
                                </div>
                                {!ticket.isClosed && ticket.agent?.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {ticket.agent?.name || "Support Agent"}
                                    </h3>
                                    <div className="flex flex-col items-end ml-2">
                                        <span className={clsx("text-xs whitespace-nowrap", ticket.unreadCount > 0 ? "text-indigo-500 font-medium" : "text-gray-400")}>
                                            {formatTelegramDate(ticket.chats && ticket.chats.length > 0 ? ticket.chats[ticket.chats.length - 1].createdAt : ticket.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <div className="text-sm text-gray-500 truncate flex-1 pr-2">
                                        {ticket.isClosed
                                            ? <span className="text-red-500 font-medium text-[10px] border border-red-200 bg-red-50 px-1 rounded">Closed</span>
                                            : (ticket.chats && ticket.chats.length > 0 ? ticket.chats[ticket.chats.length - 1].message : ticket.case.name)
                                        }
                                    </div>
                                    {ticket.unreadCount > 0 && (
                                        <span className="min-w-[20px] h-5 flex items-center justify-center bg-indigo-500 text-white text-[10px] font-bold rounded-full px-1.5 shadow-sm">
                                            {ticket.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Floating Action Button (FAB) */}
            <div className="absolute bottom-6 right-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenNewTicket}
                    className="bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center hover:bg-indigo-700 transition"
                >
                    <Plus size={28} />
                </motion.button>
            </div>
        </div>
    );
}
