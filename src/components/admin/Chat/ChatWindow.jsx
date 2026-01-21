import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Star, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { formatChatDateHeader } from '../../../utils/dateUtils';

export default function ChatWindow({
    selectedTicket,
    messages,
    newMessage,
    onNewMessageChange,
    onSendMessage,
    isChatDisabled,
    onBack,
    rating,
    className
}) {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!selectedTicket) {
        return (
            <div className={`flex-1 flex flex-col items-center justify-center bg-[#8E9CAA]/10 select-none ${className}`}>
                <div className="bg-white/50 p-4 rounded-full mb-4">
                    <span className="text-4xl">👋</span>
                </div>
                <p className="text-gray-500 font-medium">Select a chat to start messaging</p>
            </div>
        );
    }

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
    };

    return (
        <div className={`flex-1 flex flex-col h-full bg-[#E4EBEF] ${className}`}>
            {/* Telegram-ish light gray/blue background */}

            {/* Header */}
            <div className="h-16 bg-white border-b flex items-center px-4 justify-between shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    {/* Back Button (Mobile Only) */}
                    <button
                        onClick={onBack}
                        className="md:hidden text-gray-500 hover:bg-gray-100 p-2 rounded-full -ml-2"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${selectedTicket.isClosed ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                        {getInitials(selectedTicket.customer?.name)}
                    </div>

                    <div>
                        <div className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                            {selectedTicket.customer?.name || "Customer"}
                        </div>
                        <div className="text-xs text-gray-500">
                            {selectedTicket.isClosed ? 'Ticket Closed' : 'Online'}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                {/* Wallpaper Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://web.telegram.org/img/bg_0.png')] pointer-events-none mix-blend-multiply"></div>

                <div className="relative z-10 space-y-2">
                    {/* Closed Ticket Rating Display - View Only */}
                    {selectedTicket.isClosed && rating && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center mt-6 mb-6"
                        >
                            <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm text-center border border-white max-w-xs w-full">
                                <div className="font-semibold text-gray-800 text-sm mb-2">
                                    Customer Rating
                                </div>

                                <div className="space-y-2">
                                    <div className="flex gap-1 justify-center">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <Star
                                                key={n}
                                                size={24}
                                                className={n <= rating.score ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                                            />
                                        ))}
                                    </div>

                                    {rating.comment && (
                                        <div className="text-xs text-gray-600 italic px-2">
                                            “{rating.comment}”
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((m, i) => {
                            const isMe = m.senderType === 'agent';
                            const prevM = messages[i - 1];
                            const showDateHeader = !prevM || new Date(m.createdAt).toDateString() !== new Date(prevM.createdAt).toDateString();

                            return (
                                <React.Fragment key={m.id || m.createdAt}>
                                    {showDateHeader && (
                                        <div className="flex justify-center my-4 sticky top-2 z-10">
                                            <span className="bg-gray-200/80 backdrop-blur text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm font-medium">
                                                {formatChatDateHeader(m.createdAt)}
                                            </span>
                                        </div>
                                    )}
                                    <motion.div
                                        key={m.id || m.createdAt}
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`relative max-w-[85%] md:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm leading-snug text-[15px] ${isMe
                                                ? 'bg-[#EEFFDE] text-gray-900 rounded-br-none' // Telegram Light Green
                                                : 'bg-white text-gray-900 rounded-bl-none'
                                                }`}
                                        >
                                            <div>{m.message}</div>
                                            <div className={`text-[11px] mt-1 text-right ${isMe ? 'text-[#4fae4e]' : 'text-gray-400'}`}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {/* Checks */}
                                                {isMe && <span className="ml-1 text-xs">{m.isRead ? '✓✓' : '✓'}</span>}
                                            </div>
                                        </div>
                                    </motion.div>
                                </React.Fragment>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white p-2 md:p-4 border-t flex items-end gap-2 z-10">
                {isChatDisabled ? (
                    <div className="flex-1 p-3 bg-gray-50 text-gray-500 rounded-lg text-center text-sm">
                        Conversation is closed.
                    </div>
                ) : (
                    <>
                        <button className="p-3 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 hidden md:block">
                            <Paperclip size={24} />
                        </button>

                        <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 relative">
                            <input
                                value={newMessage}
                                onChange={(e) => onNewMessageChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                                placeholder="Message..."
                                className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 py-1"
                            />
                            <button className="text-gray-400 hover:text-gray-600 ml-2 hidden sm:block">
                                <Smile size={24} />
                            </button>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onSendMessage}
                            disabled={!newMessage.trim()}
                            className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-md disabled:bg-gray-300 disabled:shadow-none transition-colors"
                        >
                            {newMessage.trim() ? <Send size={24} className="ml-1" /> : <div className="w-6 h-6 flex items-center justify-center"><span className="text-xl">🎙️</span></div>}
                        </motion.button>
                    </>
                )}
            </div>
        </div>
    );
}
