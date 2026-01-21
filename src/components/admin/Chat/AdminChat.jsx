
import React, { useEffect, useState } from 'react';
import socket from '../../../socket';
import { jwtDecode } from 'jwt-decode';
import { getAgentTickets, getTicketRating, sendAgentMessage as apiSendMessage, markMessagesAsRead } from '../../../api/cases';
import TicketList from './TicketList';
import ChatWindow from './ChatWindow';
import client from '../../../api/client';

export default function AdminChat() {

    const [agentId, setAgentId] = useState(null);
    const [authLoaded, setAuthLoaded] = useState(false);

    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const selectedTicketRef = React.useRef(null);
    useEffect(() => {
        selectedTicketRef.current = selectedTicket;
    }, [selectedTicket]);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const [mobileView, setMobileView] = useState('list');

    // ⭐ RATING
    const [rating, setRating] = useState(null);

    // ---------------- AUTH ----------------
    useEffect(() => {
        const storedAdminId = localStorage.getItem("adminId");

        if (storedAdminId) {
            setAgentId(parseInt(storedAdminId, 10));
        }

        setAuthLoaded(true);

        // Authenticate Socket (Backend will use the httpOnly cookie)
        socket.emit("adminLogin", "");
    }, []);

    // ---------------- LOAD TICKETS ----------------
    useEffect(() => {
        console.log("useEffect fired", { authLoaded, agentId });

        //   if (!authLoaded || !agentId) {
        //     console.log("Blocked backend call");
        //     return;
        //   }

        getAgentTickets()
            .then((data) => {
                console.log("Backend response:", data);
                // Calculate unread counts
                const processedTickets = data.map(ticket => ({
                    ...ticket,
                    unreadCount: ticket.chats?.filter(c => c.senderType === 'customer' && !c.isRead).length || 0
                }));
                setTickets(processedTickets);
            })
            .catch(console.error);

    }, []);


    // ---------------- SELECT TICKET ----------------
    useEffect(() => {
        if (!selectedTicket) return;

        socket.emit("joinTicket", selectedTicket.id);
        setMessages(selectedTicket.chats || []);
        setMobileView('chat');

        // ⭐ FETCH RATING IF CLOSED
        const loadRating = async () => {
            try {
                const ratingData = await getTicketRating(selectedTicket.id);
                setRating(ratingData || null);

                // const res = await client.get(`/tickets/${selectedTicket.id}/rating`);
                // setRating(res.data || null);
            } catch {
                setRating(null);
            }
        };

        if (selectedTicket.status === "closed")
            loadRating();
        else
            setRating(null);

    }, [selectedTicket]);

    // ---------------- JOIN ADMIN ROOM ----------------
    useEffect(() => {
        if (agentId) {
            socket.emit("join", `admin_${agentId}`);
        }
    }, [agentId]);

    // ---------------- JOIN TICKET ROOM ----------------
    useEffect(() => {
        if (!selectedTicket?.id || !socket) return;
        socket.emit("joinTicket", selectedTicket.id);
    }, [selectedTicket?.id]);

    // ---------------- SOCKET LISTENER ----------------
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (chat) => {
            const currentSelected = selectedTicketRef.current;

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

                if (chat.senderType !== 'agent') {
                    markMessagesAsRead(chat.ticketId, 'admin').catch(console.error);
                }
            }

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
            if (readBy === 'customer') {
                if (currentSelected && Number(currentSelected.id) === Number(ticketId)) {
                    setMessages(prev => prev.map(m =>
                        m.senderType === 'agent' ? { ...m, isRead: true } : m
                    ));
                }
            } else if (readBy === 'admin') {
                setTickets(prev => prev.map(t =>
                    Number(t.id) === Number(ticketId) ? { ...t, unreadCount: 0 } : t
                ));
            }
        };

        const handleNewTicket = (ticket) => {
            setTickets(prev => {
                const exists = prev.find(t => String(t.id) === String(ticket.id));
                if (exists) return prev;
                return [ticket, ...prev];
            });
        };

        const handleConnect = () => {
            const currentSelected = selectedTicketRef.current;
            if (currentSelected?.id) {
                socket.emit("joinTicket", currentSelected.id);
            }
            if (agentId) {
                socket.emit("join", `admin_${agentId}`);
            }
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("messagesRead", handleMessagesRead);
        socket.on("ticketAssigned", handleNewTicket);
        socket.on("connect", handleConnect);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messagesRead", handleMessagesRead);
            socket.off("ticketAssigned", handleNewTicket);
            socket.off("connect", handleConnect);
        };
    }, [agentId]);

    // ---------------- SELECT TICKET & MARK READ ----------------
    const handleSelectTicket = async (ticket) => {
        // Mark as read visually
        const updatedTicket = { ...ticket, unreadCount: 0 };
        setSelectedTicket(updatedTicket);

        setTickets(prev => prev.map(t =>
            t.id === ticket.id ? { ...t, unreadCount: 0 } : t
        ));

        // Call API to mark as read
        try {
            await markMessagesAsRead(ticket.id, 'admin');
        } catch (err) {
            console.error("Failed to mark messages as read", err);
        }
    };

    // ---------------- CLOSE TICKET ----------------
    const handleCloseTicket = async (ticketId) => {
        try {
            await client.put(`/admin/tickets/${ticketId}/close`);

            setTickets(prev =>
                prev.map(t =>
                    t.id === ticketId ? { ...t, status: "closed" } : t
                )
            );

            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(prev => ({ ...prev, status: "closed" }));

                // ⭐ Load rating after closure
                const res = await client.get(`/tickets/${ticketId}/rating`);
                setRating(res.data || null);
            }

        } catch (err) {
            console.error("Failed to close ticket", err);
        }
    };

    // ---------------- SEND MESSAGE ----------------
    // ---------------- SEND MESSAGE ----------------
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedTicket || !agentId || selectedTicket.status === "closed") return;

        const msgContent = newMessage;
        const tempId = Date.now();
        const optimisticMsg = {
            id: null,
            tempId,
            ticketId: selectedTicket.id,
            senderType: "agent",
            message: msgContent,
            createdAt: new Date().toISOString(),
            isRead: false
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage("");

        try {
            await apiSendMessage({
                ticketId: selectedTicket.id,
                agentId,
                message: msgContent,
                tempId
            });

        } catch (err) {
            console.error("Failed to send message", err);
            setMessages(prev => prev.filter(m => m.tempId !== tempId));
            setNewMessage(msgContent);
        }
    };

    const handleBackToTickets = () => {
        setSelectedTicket(null);
        setMobileView('list');
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-100 overflow-hidden relative">

            <TicketList
                tickets={tickets}
                selectedTicket={selectedTicket}
                onSelectTicket={handleSelectTicket}
                onCloseTicket={handleCloseTicket}
                className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}
            />

            <ChatWindow
                selectedTicket={selectedTicket}
                messages={messages}
                newMessage={newMessage}
                onNewMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                isChatDisabled={selectedTicket?.status === "closed"}

                // ⭐ PASS RATING LIKE CUSTOMER CHAT
                rating={rating}

                onBack={handleBackToTickets}
                className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}
            />

        </div>
    );
}
