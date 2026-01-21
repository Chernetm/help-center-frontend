import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import socket from '../../../socket';
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

    const [isMobileView, setIsMobileView] = useState(false);
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);

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

        if (isMobileView) setShowChatOnMobile(true);

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
            const currentSelected = selectedTicketRef.current;
            if (currentSelected?.id) {
                socket.emit("joinTicket", currentSelected.id);
            }
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("messagesRead", handleMessagesRead);
        socket.on("adminStatusChanged", handleAdminStatusChanged);
        socket.on("connect", handleConnect);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messagesRead", handleMessagesRead);
            socket.off("adminStatusChanged", handleAdminStatusChanged);
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
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedTicket) return;

        const msgContent = newMessage;
        const tempId = Date.now();
        const optimisticMsg = {
            id: null,
            tempId,
            ticketId: selectedTicket.id,
            senderType: "customer",
            message: msgContent,
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
                message: msgContent,
                tempId // Pass tempId so backend can echo it back for matching
            });
        } catch (err) {
            console.error("Send failed", err);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.tempId !== tempId));
            setNewMessage(msgContent);
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
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-100">

            <div className={`${(isMobileView && showChatOnMobile) ? 'hidden' : 'block'} h-full w-full md:w-auto`}>
                <TicketList
                    tickets={tickets}
                    selectedTicket={selectedTicket}
                    onSelectTicket={handleSelectTicket}
                    isLoading={isLoading}
                    onOpenNewTicket={() => setIsModalOpen(true)}
                    isMobileView={isMobileView}
                />
            </div>

            <div className={`${(isMobileView && !showChatOnMobile) ? 'hidden' : 'block'} flex-1 h-full`}>
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
            </div>

            <CaseSelectorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                cases={cases}
                onSelectCase={handleCreateTicket}
            />

        </div>
    );
}
