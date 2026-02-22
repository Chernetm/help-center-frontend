import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import socket from '../../../socket';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getCases,
    getTicketRating,
    getCustomerTickets,
    rateTicket,
    createTicket,
    sendMessage as apiSendMessage,
    markMessagesAsRead
} from '../../../api/cases';

import TicketList from './TicketList';
import ChatWindow from './ChatWindow';
import CaseSelectorModal from './CaseSelectorModal';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

export default function CustomerChat() {

    const [tickets, setTickets] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const selectedTicketRef = React.useRef(null);

    // Update ref whenever selectedTicket changes
    useEffect(() => {
        selectedTicketRef.current = selectedTicket;
    }, [selectedTicket]);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // ⭐ RATING
    const [rating, setRating] = useState(null);

    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobileView(mobile);
            // If we switch to desktop, reset mobile specific state
            if (!mobile) setShowChatOnMobile(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    // ---------------- INIT ----------------
    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem("customerToken");
                if (!token) return;

                const decoded = jwtDecode(token);
                setUserInfo(decoded);

                const [ticketsData, casesData] = await Promise.all([
                    getCustomerTickets(),
                    getCases()
                ]);
                console.log("Tickets Data:", ticketsData);
                console.log("Cases Data:", casesData);

                // Calculate unread counts
                const processedTickets = (ticketsData || []).map(ticket => ({
                    ...ticket,
                    unreadCount: ticket.chats?.filter(c => c.senderType !== 'customer' && !c.isRead).length || 0
                }));

                setTickets(processedTickets);
                setCases(casesData || []);

                // Join all ticket rooms to receive real-time unread count updates
                processedTickets.forEach(t => {
                    socket.emit("joinTicket", t.id);
                });
            } catch (err) {
                console.error("Init load failed:", err);
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    // ---------------- SELECT TICKET & MARK READ ----------------
    const handleSelectTicket = async (ticket) => {
        const updatedTicket = { ...ticket, unreadCount: 0 };
        setSelectedTicket(updatedTicket);

        setTickets(prev => prev.map(t =>
            t.id === ticket.id ? { ...t, unreadCount: 0 } : t
        ));

        // Call API
        try {
            await markMessagesAsRead(ticket.id, 'customer');
        } catch (err) {
            console.error("Failed to mark messages as read", err);
        }
    };

    // ---------------- ON SELECT TICKET (SIDE EFFECTS) ----------------
    useEffect(() => {
        if (!selectedTicket || !socket) return;

        socket.emit("joinTicket", selectedTicket.id);
        console.log("Joined ticket room:", selectedTicket.id);
        setMessages(selectedTicket.chats || []);

        if (isMobileView) {
            setShowChatOnMobile(true);
        }

        const loadRating = async () => {
            try {
                const data = await getTicketRating(selectedTicket.id);
                setRating(data || null);
            } catch (err) {
                setRating(null);
            }
        };

        if (selectedTicket.status === "closed")
            loadRating();
        else
            setRating(null);

    }, [selectedTicket?.id, isMobileView]); // Only re-run if ID changes

    // ---------------- JOIN TICKET ROOM ----------------
    useEffect(() => {
        if (!selectedTicket?.id || !socket) return;
        socket.emit("joinTicket", selectedTicket.id);
        console.log("CustomerChat: Emitted joinTicket for", selectedTicket.id);
    }, [selectedTicket?.id]);

    const ticketsRef = React.useRef([]);
    useEffect(() => {
        ticketsRef.current = tickets;
    }, [tickets]);

    // ---------------- SOCKET LISTENERS ----------------
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (chat) => {
            console.log("CustomerChat: Received newMessage", chat);
            const currentSelected = selectedTicketRef.current;

            // Update selected ticket messages if open
            if (currentSelected && Number(currentSelected.id) === Number(chat.ticketId)) {
                setMessages(prev => {
                    const exists = prev.find(m =>
                        (m.id && chat.id && m.id === chat.id) ||
                        (m.tempId && chat.tempId && m.tempId === chat.tempId) ||
                        (m.message === chat.message && Math.abs(new Date(m.createdAt) - new Date(chat.createdAt)) < 2000)
                    );
                    if (exists) {
                        return prev.map(m => (m.tempId === chat.tempId || m.id === chat.id) ? chat : m);
                    }
                    return [...prev, chat];
                });

                if (chat.senderType !== 'customer') {
                    markMessagesAsRead(chat.ticketId, 'customer').catch(console.error);
                }
            }

            // Update ticket list (unread count / last message)
            setTickets(prev => prev.map(t => {
                if (Number(t.id) === Number(chat.ticketId)) {
                    const isSelected = currentSelected && Number(currentSelected.id) === Number(chat.ticketId);
                    return {
                        ...t,
                        chats: [...(t.chats || []), chat],
                        unreadCount: isSelected ? 0 : (t.unreadCount || 0) + 1,
                        updatedAt: chat.createdAt
                    };
                }
                return t;
            }));
        };

        const handleMessagesRead = ({ ticketId, readBy }) => {
            const currentSelected = selectedTicketRef.current;
            if (readBy === 'admin') {
                if (currentSelected && Number(currentSelected.id) === Number(ticketId)) {
                    setMessages(prev => prev.map(m =>
                        m.senderType === 'customer' ? { ...m, isRead: true } : m
                    ));
                }
            } else if (readBy === 'customer') {
                setTickets(prev => prev.map(t =>
                    Number(t.id) === Number(ticketId) ? { ...t, unreadCount: 0 } : t
                ));
            }
        };

        const handleAdminStatusChanged = ({ adminId, isOnline }) => {
            setTickets(prev => prev.map(t => {
                if (t.agent && Number(t.agent.id) === Number(adminId)) {
                    return { ...t, agent: { ...t.agent, isOnline } };
                }
                return t;
            }));

            setSelectedTicket(prev => {
                if (prev && prev.agent && Number(prev.agent.id) === Number(adminId)) {
                    return { ...prev, agent: { ...prev.agent, isOnline } };
                }
                return prev;
            });
        };

        const handleConnect = () => {
            console.log("CustomerChat: Socket connected/reconnected");
            // Re-join all ticket rooms
            ticketsRef.current.forEach(t => {
                socket.emit("joinTicket", t.id);
            });
            console.log("CustomerChat: Re-joined all ticket rooms");
        };

        const handleTicketClosed = (ticketId) => {
            console.log("CustomerChat: Ticket closed", ticketId);
            setTickets(prev => prev.map(t =>
                Number(t.id) === Number(ticketId) ? { ...t, status: 'closed', isClosed: true } : t
            ));
            if (selectedTicketRef.current && Number(selectedTicketRef.current.id) === Number(ticketId)) {
                setSelectedTicket(prev => ({ ...prev, status: 'closed', isClosed: true }));
            }
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("messagesRead", handleMessagesRead);
        socket.on("adminStatusChanged", handleAdminStatusChanged);
        socket.on("ticketClosed", handleTicketClosed);
        socket.on("connect", handleConnect);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messagesRead", handleMessagesRead);
            socket.off("adminStatusChanged", handleAdminStatusChanged);
            socket.off("ticketClosed", handleTicketClosed);
            socket.off("connect", handleConnect);
        };
    }, []); // Only once

    // ---------------- CREATE TICKET ----------------
    const handleCreateTicket = async (caseId) => {
        try {
            const caseObj = cases.find(c => c.id === caseId);

            const newTicket = await createTicket({
                customerId: userInfo.userId || userInfo.id,
                caseId,
                subject: `Help with ${caseObj?.name}`,
                description: "Started new conversation"
            });

            setTickets(prev => {
                if (prev.find(t => String(t.id) === String(newTicket.id))) {
                    console.log("CustomerChat: Ticket already exists, selecting it.", newTicket.id);
                    return prev.map(t => String(t.id) === String(newTicket.id) ? newTicket : t);
                }
                return [newTicket, ...prev];
            });
            setSelectedTicket(newTicket);

        } catch (err) {
            console.error("Create ticket failed:", err);
            alert("Could not create ticket");
        }
    };

    // ---------------- SEND MESSAGE ----------------
    const handleSendMessage = async (msgText, file) => {
        if (!selectedTicket || (!msgText?.trim() && !file)) return;

        const tempId = Date.now();
        let mediaUrl = "";
        let mediaType = "";
        let audioDuration = 0;

        if (file) {
            try {
                const uploadRes = await uploadToCloudinary(file);
                mediaUrl = uploadRes.secure_url;
                mediaType = file.type.startsWith("audio") ? "audio" : "image";
                audioDuration = uploadRes.duration || 0;
            } catch (err) {
                console.error("Upload failed", err);
                return;
            }
        }

        const optimisticMsg = {
            id: null,
            tempId,
            ticketId: selectedTicket.id,
            senderType: "customer",
            message: msgText,
            mediaUrl,
            mediaType,
            audioDuration,
            createdAt: new Date().toISOString(),
            isRead: false
        };

        // Optimistic Update
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage("");

        try {
            await apiSendMessage({
                ticketId: selectedTicket.id,
                senderType: "customer",
                message: msgText,
                mediaUrl,
                mediaType,
                audioDuration,
                tempId // Pass tempId so backend can echo it back for matching
            });
        } catch (err) {
            console.error("Send failed", err);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.tempId !== tempId));
            setNewMessage(msgText);
        }
    };

    // ---------------- ⭐ RATE TICKET ----------------
    const handleRateTicket = async (score, comment) => {
        if (!selectedTicket) return;

        try {
            const res = await rateTicket(
                selectedTicket.id,
                { score, comment }
            );

            setRating(res);   // store full object
            alert("Thanks for your rating!");

        } catch (err) {
            console.error("Rating failed", err);
            alert(err?.response?.data?.message || "Rating failed");
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-100 relative">

            <AnimatePresence mode="wait">
                {/* List View: Visible on Desktop or on Mobile when no chat is showing */}
                {(!isMobileView || !showChatOnMobile) && (
                    <motion.div
                        key="list"
                        initial={isMobileView ? { x: -300, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        exit={isMobileView ? { x: -300, opacity: 0 } : false}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`${isMobileView ? 'absolute inset-0 z-10' : 'relative'} h-full w-full md:w-auto overflow-hidden`}
                    >
                        <TicketList
                            tickets={tickets}
                            selectedTicket={selectedTicket}
                            onSelectTicket={handleSelectTicket}
                            isLoading={isLoading}
                            onOpenNewTicket={() => setIsModalOpen(true)}
                            isMobileView={isMobileView}
                        />
                    </motion.div>
                )}

                {/* Chat View: Visible on Desktop or on Mobile when showing chat */}
                {(!isMobileView || showChatOnMobile) && (
                    <motion.div
                        key="chat"
                        initial={isMobileView ? { x: 300, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        exit={isMobileView ? { x: 300, opacity: 0 } : false}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`${isMobileView ? 'absolute inset-0 z-20' : 'flex-1'} h-full bg-[#E4EBEF]`}
                    >
                        <ChatWindow
                            selectedTicket={selectedTicket}
                            messages={messages}
                            newMessage={newMessage}
                            onNewMessageChange={setNewMessage}
                            onSendMessage={handleSendMessage}

                            // ⭐ PASS RATING
                            rating={rating}
                            onSubmitRating={handleRateTicket}

                            isMobile={isMobileView}
                            onBack={() => setShowChatOnMobile(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <CaseSelectorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                cases={cases}
                onSelectCase={handleCreateTicket}
            />

        </div>
    );
}
