import React, { useEffect, useState } from 'react';
import socket from '../../../socket';
import {
  getAgentTickets,
  getTicketRating,
  rateTicket,
  createTicket,
  sendAgentMessage as apiSendMessage,
  markMessagesAsRead,
  getTicket,
  closeTicket as apiCloseTicket
} from '../../../api/cases';
import TicketList from './TicketList';
import ChatWindow from './ChatWindow';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

export default function AdminChat() {
  const [agentId, setAgentId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const selectedTicketRef = React.useRef(null);
  const ticketsRef = React.useRef([]);

  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  useEffect(() => {
    ticketsRef.current = tickets;
  }, [tickets]);

  const [messages, setMessages] = useState([]);
  const [mobileView, setMobileView] = useState('list');
  const [rating, setRating] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ⭐ Lazy Loading
  const TICKET_LIMIT = 10;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // ---------------- AUTH ----------------
  useEffect(() => {
    const storedAdminId = localStorage.getItem("adminId");
    if (storedAdminId) setAgentId(parseInt(storedAdminId, 10));
    const token = localStorage.getItem("adminToken");
    socket.emit("adminLogin", token || "");
  }, []);

  const fetchTickets = async (isInitial = false) => {
    try {
      const currentOffset = isInitial ? 0 : offset;
      console.log(`AdminChat: Fetching tickets limit: ${TICKET_LIMIT}, offset: ${currentOffset}`);
      const data = await getAgentTickets(TICKET_LIMIT, currentOffset);

      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        unreadCount: ticket.chats?.filter(c => c.senderType === 'customer' && !c.isRead).length || 0
      }));

      setTickets(prev => isInitial ? processedTickets : [...prev, ...processedTickets]);

      if (processedTickets.length < TICKET_LIMIT) {
        setHasMore(false);
      }

      const newOffset = isInitial ? processedTickets.length : offset + processedTickets.length;
      setOffset(newOffset);

      // Join rooms
      processedTickets.forEach(t => {
        socket.emit("joinTicket", t.id);
      });

    } catch (err) {
      console.error("AdminChat: Failed to fetch tickets:", err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(true);
  }, []);

  const handleLoadMore = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    await fetchTickets(false);
    setIsFetchingMore(false);
  };

  // ---------------- SELECT TICKET & MARK READ ----------------
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setMobileView('chat');

    // Mark as read visually
    setTickets(prev => prev.map(t =>
      Number(t.id) === Number(ticket.id) ? { ...t, unreadCount: 0 } : t
    ));

    // Call API to mark as read
    try {
      await markMessagesAsRead(ticket.id, 'admin');
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  useEffect(() => {
    if (!selectedTicket) return;
    socket.emit("joinTicket", selectedTicket.id);
    setMessages(selectedTicket.chats || []);

    const loadRating = async () => {
      try {
        const ratingData = await getTicketRating(selectedTicket.id);
        setRating(ratingData || null);
      } catch {
        setRating(null);
      }
    };

    if (selectedTicket.status === "closed") loadRating();
    else setRating(null);

  }, [selectedTicket?.id]);

  // ---------------- CLOSE TICKET (OPTIMISTIC) ----------------
  const handleCloseTicket = async (ticketId) => {
    // 1. Optimistic Update
    const previousTickets = [...tickets];
    const previousSelected = selectedTicket ? { ...selectedTicket } : null;

    setTickets(prev => prev.map(t =>
      Number(t.id) === Number(ticketId) ? { ...t, status: 'closed', isClosed: true } : t
    ));

    if (selectedTicket && Number(selectedTicket.id) === Number(ticketId)) {
      setSelectedTicket(prev => ({ ...prev, status: 'closed' }));
    }

    try {
      await apiCloseTicket(ticketId);
      console.log("AdminChat: Ticket closed via API", ticketId);

      // Load rating after closure if it's the selected one
      if (selectedTicket?.id === ticketId) {
        const ratingData = await getTicketRating(ticketId);
        setRating(ratingData || null);
      }
    } catch (err) {
      console.error("AdminChat: Failed to close ticket", err);
      // Revert on failure
      setTickets(previousTickets);
      if (previousSelected?.id === ticketId) {
        setSelectedTicket(previousSelected);
      }
      alert("Failed to close ticket. Please try again.");
    }
  };

  // ---------------- JOIN ADMIN ROOM ----------------
  useEffect(() => {
    if (agentId) socket.emit("join", `admin_${agentId}`);
  }, [agentId]);

  // ---------------- SOCKET LISTENER ----------------
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (chat) => {
      const currentSelected = selectedTicketRef.current;

      if (currentSelected && Number(currentSelected.id) === Number(chat.ticketId)) {
        setMessages(prev => {
          const exists = prev.find(m =>
            (m.id && chat.id && m.id === chat.id) ||
            (m.tempId && chat.tempId && m.tempId === chat.tempId)
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

      setTickets(prev => {
        const ticketIndex = prev.findIndex(t => Number(t.id) === Number(chat.ticketId));
        const isSelected = currentSelected && Number(currentSelected.id) === Number(chat.ticketId);

        if (ticketIndex !== -1) {
          // Update and move to top
          const updatedTicket = {
            ...prev[ticketIndex],
            chats: [...(prev[ticketIndex].chats || []), chat],
            unreadCount: isSelected ? 0 : (prev[ticketIndex].unreadCount || 0) + 1,
            updatedAt: chat.createdAt
          };
          const newTickets = [...prev];
          newTickets.splice(ticketIndex, 1);
          return [updatedTicket, ...newTickets];
        } else {
          // Fetch missing ticket
          getTicket(chat.ticketId, 'admin').then(ticket => {
            if (ticket) {
              const processedTicket = {
                ...ticket,
                unreadCount: 1,
                updatedAt: chat.createdAt
              };
              setTickets(current => {
                if (current.find(t => Number(t.id) === Number(ticket.id))) return current;
                return [processedTicket, ...current];
              });
              socket.emit("joinTicket", ticket.id);
            }
          }).catch(err => console.error("Failed to fetch missing ticket for admin:", err));
          return prev;
        }
      });
    };

    const handleMessagesRead = ({ ticketId, readBy }) => {
      const currentSelected = selectedTicketRef.current;
      if (readBy === 'customer') {
        if (currentSelected && Number(currentSelected.id) === Number(ticketId)) {
          setMessages(prev => prev.map(m =>
            m.senderType === 'agent' ? { ...m, isRead: true } : m
          ));
        }
      }
    };

    const handleTicketAssigned = (ticket) => {
      console.log("AdminChat: New ticket assigned", ticket);
      setTickets(prev => {
        if (prev.find(t => Number(t.id) === Number(ticket.id))) return prev;
        return [ticket, ...prev];
      });
      socket.emit("joinTicket", ticket.id);
    };

    const handleConnect = () => {
      console.log("AdminChat: Socket connected/reconnected");
      const token = localStorage.getItem("adminToken");
      socket.emit("adminLogin", token || "");
      if (agentId) socket.emit("join", `admin_${agentId}`);

      // Re-join all ticket rooms
      ticketsRef.current.forEach(t => {
        socket.emit("joinTicket", t.id);
      });
    };

    const handleTicketClosed = (ticketId) => {
      console.log("AdminChat: Ticket closed", ticketId);
      setTickets(prev => prev.map(t =>
        Number(t.id) === Number(ticketId) ? { ...t, status: 'closed', isClosed: true } : t
      ));
      if (selectedTicketRef.current && Number(selectedTicketRef.current.id) === Number(ticketId)) {
        setSelectedTicket(prev => ({ ...prev, status: 'closed' }));
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("ticketAssigned", handleTicketAssigned);
    socket.on("ticketClosed", handleTicketClosed);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("ticketAssigned", handleTicketAssigned);
      socket.off("ticketClosed", handleTicketClosed);
      socket.off("connect", handleConnect);
    };
  }, [agentId]);

  // ---------------- SEND MESSAGE ----------------
  const handleSendMessage = async (msgText, file) => {
    if (!selectedTicket || !agentId || selectedTicket.status === "closed") return;
    if (!msgText?.trim() && !file) return;

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
      senderType: "agent",
      message: msgText,
      mediaUrl,
      mediaType,
      audioDuration,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await apiSendMessage({
        ticketId: selectedTicket.id,
        agentId,
        message: msgText,
        mediaUrl,
        mediaType,
        audioDuration,
        tempId
      });
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
    }
  };

  const handleBack = () => {
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
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        className={mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
      />

      <ChatWindow
        selectedTicket={selectedTicket}
        messages={messages}
        onSendMessage={handleSendMessage}
        isChatDisabled={selectedTicket?.status === "closed"}
        rating={rating}
        onBack={handleBack}
        className={mobileView === 'list' ? 'hidden md:flex' : 'flex'}
      />
    </div>
  );
}
