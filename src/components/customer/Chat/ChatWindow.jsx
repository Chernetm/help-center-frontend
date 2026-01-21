import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Star, ArrowLeft, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { Button } from '../../ui/Button';
import { formatChatDateHeader } from '../../../utils/dateUtils';

export default function ChatWindow({
    selectedTicket,
    messages,
    newMessage,
    onNewMessageChange,
    onSendMessage,
    rating,
    onSubmitRating,
    onBack, // prop for mobile back navigation
    isMobile // prop to detect mobile state
}) {
    const messagesEndRef = useRef(null);
    const [newScore, setNewScore] = useState(0);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Reset rating state
    useEffect(() => {
        setNewScore(0);
        setNewComment("");
    }, [selectedTicket]);

    if (!selectedTicket) {
        // Only show placeholder on desktop. On mobile, if no ticket selected, this component shouldn't render (handled by parent switch)
        return (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#8E9CAA]/10 select-none">
                <div className="bg-white/50 p-4 rounded-full mb-4">
                    <span className="text-4xl">👋</span>
                </div>
                <p className="text-gray-500 font-medium">Select a chat to start messaging</p>
            </div>
        );
    }

    const canChat = selectedTicket.status === 'assigned';

    return (
        <div className="flex-1 flex flex-col h-full bg-[#E4EBEF]">
            {/* Telegram-ish light gray/blue background */}

            {/* Header */}
            <div className="h-16 bg-white border-b flex items-center px-4 justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    {/* Back Button (Mobile Only) */}
                    <button
                        onClick={onBack}
                        className="md:hidden text-gray-500 hover:bg-gray-100 p-2 rounded-full -ml-2"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                            {selectedTicket.agent?.name ? selectedTicket.agent.name[0] : "A"}
                        </div>
                        {selectedTicket.agent?.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                    </div>

                    <div>
                        <div className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                            {selectedTicket.agent?.name || "Support Agent"}
                        </div>
                        <div className="text-xs">
                            {selectedTicket.agent?.isOnline ? (
                                <span className="text-blue-500 font-medium">online</span>
                            ) : (
                                <span className="text-gray-500">last seen recently</span>
                            )}
                            <span className="text-gray-400 mx-1">•</span>
                            <span className="text-gray-500">{selectedTicket.case.name}</span>
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
                {/* Wallpaper Pattern Overlay (Optional) */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://web.telegram.org/img/bg_0.png')] pointer-events-none mix-blend-multiply"></div>

                <AnimatePresence initial={false}>
                    {messages.map((m, i) => {
                        const isMe = m.senderType === 'customer';
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

                {/* Rating Block */}
                {selectedTicket.status === 'closed' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center mt-6"
                    >
                        <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm text-center border border-white max-w-xs">

                            <div className="font-semibold text-gray-800 text-sm mb-2">
                                {rating ? "Your rating" : "Rate this conversation"}
                            </div>

                            {/* ⭐ SHOW EXISTING RATING */}
                            {rating && (
                                <div className="space-y-2">
                                    <div className="flex gap-1 justify-center">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <Star
                                                key={n}
                                                size={24}
                                                className={
                                                    n <= rating.score
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-gray-300"
                                                }
                                            />
                                        ))}
                                    </div>

                                    {rating.comment && (
                                        <div className="text-xs text-gray-600 italic px-2">
                                            “{rating.comment}”
                                        </div>
                                    )}

                                    <div className="text-xs text-green-600 font-medium">
                                        Thank you for your feedback!
                                    </div>
                                </div>
                            )}

                            {/* ⭐ NEW RATING FORM */}
                            {!rating && (
                                <div className="space-y-3">
                                    <div className="flex gap-1 justify-center">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button key={n} onClick={() => setNewScore(n)}>
                                                <Star
                                                    size={24}
                                                    className={
                                                        n <= newScore
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "text-gray-300"
                                                    }
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {newScore > 0 && (
                                        <>
                                            <input
                                                className="w-full text-sm border-b border-gray-300 focus:border-indigo-500 bg-transparent outline-none p-1"
                                                placeholder="Optional comment..."
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                            />

                                            <button
                                                onClick={() => onSubmitRating(newScore, newComment)}
                                                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full"
                                            >
                                                Submit
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {selectedTicket.status === 'closed' ? (
                <div className="bg-white p-4 border-t z-10">
                    <div className="p-3 bg-gray-50 text-gray-500 rounded-lg text-center text-sm">
                        Conversation is closed.
                    </div>
                </div>
            ) : (
                <div className="bg-white p-2 md:p-4 border-t flex items-end gap-2 z-10">
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
                            disabled={!canChat}
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
                        {/* Mic icon placeholder when empty */}
                    </motion.button>
                </div>
            )}
        </div>
    );
}
