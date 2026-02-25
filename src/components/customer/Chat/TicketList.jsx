import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageCircle } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../../ui/Button';
import { formatTelegramDate } from '../../../utils/dateUtils';

export default function TicketList({
    tickets,
    selectedTicket,
    onSelectTicket,
    isLoading,
    onOpenNewTicket,
    isMobileView,
    onLoadMore,
    hasMore,
    isFetchingMore
}) {
    const scrollRef = React.useRef(null);

    const handleScroll = () => {
        if (!scrollRef.current || !hasMore || isFetchingMore) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            onLoadMore();
        }
    };

    if (isLoading) {
        return (
            <div className="h-full bg-white border-r border-gray-200 flex flex-col">
                <div className="h-16 px-4 border-b border-gray-100 flex items-center bg-white shrink-0">
                    <div className="h-6 w-24 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-3 flex gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse shrink-0"></div>
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse"></div>
                                <div className="h-3 bg-gray-50 rounded w-full animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={clsx("h-full bg-white flex flex-col relative",
            // On desktop we keep fixed width, on mobile it fills the container
            !isMobileView ? "w-full md:w-80 lg:w-96 border-r border-gray-200" : "w-full"
        )}>
            {/* Header */}
            <div className="h-16 px-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                <h2 className="font-bold text-lg text-gray-800">Messages</h2>
            </div>

            {/* List */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-2 space-y-1"
            >
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
                                        {ticket.agent?.name || "..."}
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

                {isFetchingMore && (
                    <div className="py-2 text-center text-xs text-gray-400 animate-pulse">
                        Loading more...
                    </div>
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
