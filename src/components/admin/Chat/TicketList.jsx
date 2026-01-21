import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, CheckCircle } from 'lucide-react';
import { formatTelegramDate } from '../../../utils/dateUtils';

export default function TicketList({ tickets, selectedTicket, onSelectTicket, onCloseTicket, className }) {

    if (!tickets) {
        return (
            <div className="h-full flex items-center justify-center bg-white border-r">
                <div className="animate-pulse text-gray-400">Loading chats...</div>
            </div>
        );
    }

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
    };

    return (
        <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>

            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="font-bold text-lg text-gray-800">Messages</h2>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                        <MessageCircle size={32} className="mb-2 opacity-50" />
                        No conversations yet
                    </div>
                ) : (
                    tickets.map((ticket) => {
                        const lastMsg = ticket.chats && ticket.chats.length > 0 ? ticket.chats[ticket.chats.length - 1] : null;
                        const isSelected = selectedTicket?.id === ticket.id;

                        return (
                            <motion.div
                                key={ticket.id}
                                onClick={() => onSelectTicket(ticket)}
                                whileHover={{ backgroundColor: "#f3f4f6" }}
                                className={`p-3 rounded-xl cursor-pointer transition-colors flex gap-3 ${isSelected ? "bg-indigo-50" : "bg-white"
                                    }`}
                            >
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${ticket.isClosed ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                    }`}>
                                    {getInitials(ticket.customer?.name)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {ticket.customer?.name || "Customer"}
                                        </h3>
                                        {/* Timestamp */}
                                        <div className="flex flex-col items-end ml-2 gap-1">
                                            <span className={`text-xs whitespace-nowrap ${ticket.unreadCount > 0 ? "text-indigo-500 font-medium" : "text-gray-400"}`}>
                                                {formatTelegramDate(lastMsg?.createdAt || ticket.updatedAt)}
                                            </span>

                                            {!ticket.isClosed && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm("Are you sure you want to close this ticket? This cannot be undone.")) {
                                                            onCloseTicket(ticket.id);
                                                        }
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    title="Close Ticket"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subject/Last Message + Badge */}
                                    <div className="flex justify-between items-center mt-0.5">
                                        <div className="text-sm text-gray-500 truncate flex-1 pr-2">
                                            {ticket.isClosed
                                                ? <span className="text-red-500 font-medium text-xs border border-red-200 bg-red-50 px-1 rounded">Closed</span>
                                                : ((lastMsg ? lastMsg.message : ticket.subject) || <span className="italic text-gray-400">No messages yet</span>)
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
                        );
                    })
                )}
            </div>
        </div>
    );
}
