import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../../../socket';
import {
  getAgentTickets,
  getTicketRating,
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
  const [messages, setMessages] = useState([]);
  const [rating, setRating] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const ticketsRef = useRef([]);
  const selectedTicketRef = useRef(null);

  useEffect(() => { ticketsRef.current = tickets; }, [tickets]);
  useEffect(() => { selectedTicketRef.current = selectedTicket; }, [selectedTicket]);

  // ---------------- RESPONSIVE ----------------
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (!mobile) setShowChatOnMobile(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ---------------- AUTH ----------------
  useEffect(() => {
    const storedAdminId = localStorage.getItem("adminId");
    if (storedAdminId) setAgentId(Number(storedAdminId));
    const token = localStorage.getItem("adminToken");
    socket.emit("adminLogin", token || "");
  }, []);

  // ---------------- FETCH TICKETS ----------------
  const fetchTickets = async () => {
    const data = await getAgentTickets(20, 0);

    const processed = (data || []).map(t => ({
      ...t,
      unreadCount: t.chats?.filter(c => c.senderType === "customer" && !c.isRead).length || 0
    }));

    setTickets(processed);
    processed.forEach(t => socket.emit("joinTicket", t.id));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // ---------------- SELECT TICKET ----------------
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setMessages(ticket.chats || []);
    socket.emit("joinTicket", ticket.id);

    setTickets(prev => prev.map(t =>
      Number(t.id) === Number(ticket.id) ? { ...t, unreadCount: 0 } : t
    ));

    await markMessagesAsRead(ticket.id, "admin").catch(console.error);

    if (isMobileView) setShowChatOnMobile(true);

    if (ticket.status === "closed") {
      const r = await getTicketRating(ticket.id).catch(() => null);
      setRating(r);
    } else {
      setRating(null);
    }
  };

  // ---------------- SOCKET ----------------
  useEffect(() => {
    if (!agentId) return;

    const playSound = () => {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => { });
    };

    const handleNewMessage = (chat) => {
      console.log("📨 AdminChat received message:", chat);
      const current = selectedTicketRef.current;

      if (chat.senderType === "customer") playSound();

      if (current && Number(current.id) === Number(chat.ticketId)) {
        setMessages(prev => {
          const exists = prev.find(m =>
            (m.id && chat.id && Number(m.id) === Number(chat.id)) ||
            (m.tempId && chat.tempId && String(m.tempId) === String(chat.tempId))
          );
          if (exists) {
            return prev.map(m =>
              (String(m.tempId) === String(chat.tempId) || Number(m.id) === Number(chat.id)) ? chat : m
            );
          }
          return [...prev, chat];
        });

        if (chat.senderType === "customer") {
          markMessagesAsRead(chat.ticketId, "admin").catch(console.error);
        }
      }

      setTickets(prev => {
        const idx = prev.findIndex(t => Number(t.id) === Number(chat.ticketId));
        const isSelected = current && Number(current.id) === Number(chat.ticketId);

        if (idx !== -1) {
          const updated = {
            ...prev[idx],
            chats: [...(prev[idx].chats || []), chat],
            unreadCount: isSelected ? 0 : (prev[idx].unreadCount || 0) + 1,
            updatedAt: chat.createdAt
          };

          const copy = [...prev];
          copy.splice(idx, 1);
          return [updated, ...copy];
        }

        return prev;
      });
    };

    const handleMessagesRead = ({ ticketId, readBy }) => {
      console.log(`📖 Messages read by ${readBy} in ticket ${ticketId}`);
      const current = selectedTicketRef.current;

      // Update active chat window if customer read our (agent) messages
      if (readBy === "customer" && current && Number(current.id) === Number(ticketId)) {
        setMessages(prev =>
          prev.map(m => m.senderType === "agent" ? { ...m, isRead: true } : m)
        );
      }

      // Sync sidebar unread status (handles multi-tab sync)
      if (readBy === "admin") {
        setTickets(prev =>
          prev.map(t => Number(t.id) === Number(ticketId) ? { ...t, unreadCount: 0 } : t)
        );
      }
    };

    const handleTicketAssigned = (newTicket) => {
      console.log("🎫 New ticket assigned:", newTicket);

      // Add to sidebar
      setTickets(prev => {
        const exists = prev.find(t => Number(t.id) === Number(newTicket.id));
        if (exists) return prev;
        return [newTicket, ...prev];
      });

      // Join the ticket room to get subsequent messages
      socket.emit("joinTicket", newTicket.id);

      // Play sound
      playSound();
    };

    const handleConnect = () => {
      console.log("🔁 Admin reconnected");
      const token = localStorage.getItem("adminToken");
      socket.emit("adminLogin", token || "");
      socket.emit("join", `admin_${agentId}`);
      ticketsRef.current.forEach(t => socket.emit("joinTicket", t.id));
      if (selectedTicketRef.current) socket.emit("joinTicket", selectedTicketRef.current.id);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("ticketAssigned", handleTicketAssigned);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("ticketAssigned", handleTicketAssigned);
      socket.off("connect", handleConnect);
    };
  }, [agentId]);

  // ---------------- SEND ----------------
  const handleSendMessage = async (msgText, file) => {
    if (!selectedTicket || selectedTicket.status === "closed") return;
    if (!msgText && !file) return;

    const tempId = Date.now();
    let mediaUrl = "", mediaType = "", audioDuration = 0;

    if (file) {
      const res = await uploadToCloudinary(file);
      mediaUrl = res.secure_url;
      mediaType = file.type.startsWith("audio") ? "audio" : "image";
      audioDuration = res.duration || 0;
    }

    const optimistic = {
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

    setMessages(prev => [...prev, optimistic]);

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
    } catch {
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
    }
  };

  // ---------------- CLOSE ----------------
  const handleCloseTicket = async (ticketId) => {
    await apiCloseTicket(ticketId);
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, status: "closed" } : t
    ));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, status: "closed" }));
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 overflow-hidden relative">
      {isMobileView ? (
        <AnimatePresence mode="wait">
          {!showChatOnMobile && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 z-10 w-full h-full"
            >
              <TicketList
                tickets={tickets}
                selectedTicket={selectedTicket}
                onSelectTicket={handleSelectTicket}
                onCloseTicket={handleCloseTicket}
                isLoading={isLoading}
                isMobileView={true}
              />
            </motion.div>
          )}

          {showChatOnMobile && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 z-20 w-full h-full bg-[#E4EBEF]"
            >
              <ChatWindow
                selectedTicket={selectedTicket}
                messages={messages}
                onSendMessage={handleSendMessage}
                isChatDisabled={selectedTicket?.status === "closed"}
                rating={rating}
                isMobile={true}
                onBack={() => setShowChatOnMobile(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className="flex w-full h-full overflow-hidden">
          <TicketList
            tickets={tickets}
            selectedTicket={selectedTicket}
            onSelectTicket={handleSelectTicket}
            onCloseTicket={handleCloseTicket}
            isLoading={isLoading}
            isMobileView={false}
          />
          <ChatWindow
            selectedTicket={selectedTicket}
            messages={messages}
            onSendMessage={handleSendMessage}
            isChatDisabled={selectedTicket?.status === "closed"}
            rating={rating}
            isMobile={false}
          />
        </div>
      )}
    </div>
  );
}










// import React, { useEffect, useState } from 'react';
// import socket from '../../../socket';
// import {
//   getAgentTickets,
//   getTicketRating,
//   rateTicket,
//   createTicket,
//   sendAgentMessage as apiSendMessage,
//   markMessagesAsRead,
//   getTicket,
//   closeTicket as apiCloseTicket
// } from '../../../api/cases';
// import TicketList from './TicketList';
// import ChatWindow from './ChatWindow';
// import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

// export default function AdminChat() {
//   const [agentId, setAgentId] = useState(null);
//   const [tickets, setTickets] = useState([]);
//   const [selectedTicket, setSelectedTicket] = useState(null);
//   const selectedTicketRef = React.useRef(null);
//   const ticketsRef = React.useRef([]);

//   useEffect(() => {
//     selectedTicketRef.current = selectedTicket;
//   }, [selectedTicket]);

//   useEffect(() => {
//     ticketsRef.current = tickets;
//   }, [tickets]);

//   const [messages, setMessages] = useState([]);
//   const [mobileView, setMobileView] = useState('list');
//   const [rating, setRating] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // ⭐ Lazy Loading
//   const TICKET_LIMIT = 10;
//   const [offset, setOffset] = useState(0);
//   const [hasMore, setHasMore] = useState(true);
//   const [isFetchingMore, setIsFetchingMore] = useState(false);

//   // ---------------- AUTH ----------------
//   useEffect(() => {
//     const storedAdminId = localStorage.getItem("adminId");
//     if (storedAdminId) setAgentId(parseInt(storedAdminId, 10));
//     const token = localStorage.getItem("adminToken");
//     socket.emit("adminLogin", token || "");
//   }, []);

//   const fetchTickets = async (isInitial = false) => {
//     try {
//       const currentOffset = isInitial ? 0 : offset;
//       console.log(`AdminChat: Fetching tickets limit: ${TICKET_LIMIT}, offset: ${currentOffset}`);
//       const data = await getAgentTickets(TICKET_LIMIT, currentOffset);

//       const processedTickets = (data || []).map(ticket => ({
//         ...ticket,
//         unreadCount: ticket.chats?.filter(c => c.senderType === 'customer' && !c.isRead).length || 0
//       }));

//       setTickets(prev => {
//         if (isInitial) return processedTickets;
//         // Filter out any tickets that already exist in the state to avoid duplicate keys
//         const existingIds = new Set(prev.map(t => t.id));
//         const uniqueNew = processedTickets.filter(t => !existingIds.has(t.id));
//         return [...prev, ...uniqueNew];
//       });

//       if (processedTickets.length < TICKET_LIMIT) {
//         setHasMore(false);
//       }

//       const newOffset = isInitial ? processedTickets.length : offset + processedTickets.length;
//       setOffset(newOffset);

//       // Join rooms
//       processedTickets.forEach(t => {
//         socket.emit("joinTicket", t.id);
//       });

//     } catch (err) {
//       console.error("AdminChat: Failed to fetch tickets:", err);
//     } finally {
//       if (isInitial) setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchTickets(true);
//   }, []);

//   const handleLoadMore = async () => {
//     if (isFetchingMore || !hasMore) return;
//     setIsFetchingMore(true);
//     await fetchTickets(false);
//     setIsFetchingMore(false);
//   };

//   // ---------------- SELECT TICKET & MARK READ ----------------
//   const handleSelectTicket = async (ticket) => {
//     setSelectedTicket(ticket);
//     setMobileView('chat');

//     // Mark as read visually
//     setTickets(prev => prev.map(t =>
//       Number(t.id) === Number(ticket.id) ? { ...t, unreadCount: 0 } : t
//     ));

//     // Call API to mark as read
//     try {
//       await markMessagesAsRead(ticket.id, 'admin');
//     } catch (err) {
//       console.error("Failed to mark messages as read", err);
//     }
//   };

//   useEffect(() => {
//     if (!selectedTicket) return;
//     socket.emit("joinTicket", selectedTicket.id);
//     setMessages(selectedTicket.chats || []);

//     const loadRating = async () => {
//       try {
//         const ratingData = await getTicketRating(selectedTicket.id);
//         setRating(ratingData || null);
//       } catch {
//         setRating(null);
//       }
//     };

//     if (selectedTicket.status === "closed") loadRating();
//     else setRating(null);

//   }, [selectedTicket?.id]);

//   // ---------------- CLOSE TICKET (OPTIMISTIC) ----------------
//   const handleCloseTicket = async (ticketId) => {
//     // 1. Optimistic Update
//     const previousTickets = [...tickets];
//     const previousSelected = selectedTicket ? { ...selectedTicket } : null;

//     setTickets(prev => prev.map(t =>
//       Number(t.id) === Number(ticketId) ? { ...t, status: 'closed', isClosed: true } : t
//     ));

//     if (selectedTicket && Number(selectedTicket.id) === Number(ticketId)) {
//       setSelectedTicket(prev => ({ ...prev, status: 'closed' }));
//     }

//     try {
//       await apiCloseTicket(ticketId);
//       console.log("AdminChat: Ticket closed via API", ticketId);

//       // Load rating after closure if it's the selected one
//       if (selectedTicket?.id === ticketId) {
//         const ratingData = await getTicketRating(ticketId);
//         setRating(ratingData || null);
//       }
//     } catch (err) {
//       console.error("AdminChat: Failed to close ticket", err);
//       // Revert on failure
//       setTickets(previousTickets);
//       if (previousSelected?.id === ticketId) {
//         setSelectedTicket(previousSelected);
//       }
//       alert("Failed to close ticket. Please try again.");
//     }
//   };

//   // ---------------- JOIN ADMIN ROOM ----------------
//   useEffect(() => {
//     if (agentId) socket.emit("join", `admin_${agentId}`);
//   }, [agentId]);

//   // // ---------------- SOCKET LISTENER ----------------
//   // useEffect(() => {
//   //   if (!socket) return;

//   //   const handleNewMessage = (chat) => {
//   //     const currentSelected = selectedTicketRef.current;

//   //     if (currentSelected && Number(currentSelected.id) === Number(chat.ticketId)) {
//   //       setMessages(prev => {
//   //         const exists = prev.find(m =>
//   //           (m.id && chat.id && m.id === chat.id) ||
//   //           (m.tempId && chat.tempId && m.tempId === chat.tempId)
//   //         );
//   //         if (exists) {
//   //           return prev.map(m => (m.tempId === chat.tempId || m.id === chat.id) ? chat : m);
//   //         }
//   //         return [...prev, chat];
//   //       });

//   //       if (chat.senderType !== 'agent') {
//   //         markMessagesAsRead(chat.ticketId, 'admin').catch(console.error);
//   //       }
//   //     }

//   //     setTickets(prev => {
//   //       const ticketIndex = prev.findIndex(t => Number(t.id) === Number(chat.ticketId));
//   //       const isSelected = currentSelected && Number(currentSelected.id) === Number(chat.ticketId);

//   //       if (ticketIndex !== -1) {
//   //         // Update and move to top
//   //         const updatedTicket = {
//   //           ...prev[ticketIndex],
//   //           chats: [...(prev[ticketIndex].chats || []), chat],
//   //           unreadCount: isSelected ? 0 : (prev[ticketIndex].unreadCount || 0) + 1,
//   //           updatedAt: chat.createdAt
//   //         };
//   //         const newTickets = [...prev];
//   //         newTickets.splice(ticketIndex, 1);
//   //         return [updatedTicket, ...newTickets];
//   //       } else {
//   //         // Fetch missing ticket
//   //         getTicket(chat.ticketId, 'admin').then(ticket => {
//   //           if (ticket) {
//   //             const processedTicket = {
//   //               ...ticket,
//   //               unreadCount: 1,
//   //               updatedAt: chat.createdAt
//   //             };
//   //             setTickets(current => {
//   //               if (current.find(t => Number(t.id) === Number(ticket.id))) return current;
//   //               return [processedTicket, ...current];
//   //             });
//   //             socket.emit("joinTicket", ticket.id);
//   //           }
//   //         }).catch(err => console.error("Failed to fetch missing ticket for admin:", err));
//   //         return prev;
//   //       }
//   //     });
//   //   };

//   //   const handleMessagesRead = ({ ticketId, readBy }) => {
//   //     const currentSelected = selectedTicketRef.current;
//   //     if (readBy === 'customer') {
//   //       if (currentSelected && Number(currentSelected.id) === Number(ticketId)) {
//   //         setMessages(prev => prev.map(m =>
//   //           m.senderType === 'agent' ? { ...m, isRead: true } : m
//   //         ));
//   //       }
//   //     }
//   //   };

//   //   const handleTicketAssigned = (ticket) => {
//   //     console.log("AdminChat: New ticket assigned", ticket);
//   //     setTickets(prev => {
//   //       if (prev.find(t => Number(t.id) === Number(ticket.id))) return prev;
//   //       return [ticket, ...prev];
//   //     });
//   //     socket.emit("joinTicket", ticket.id);
//   //   };

//   //   const handleConnect = () => {
//   //     console.log("AdminChat: Socket connected/reconnected");
//   //     const token = localStorage.getItem("adminToken");
//   //     socket.emit("adminLogin", token || "");
//   //     if (agentId) socket.emit("join", `admin_${agentId}`);

//   //     // Re-join all ticket rooms
//   //     ticketsRef.current.forEach(t => {
//   //       socket.emit("joinTicket", t.id);
//   //     });
//   //   };

//   //   const handleTicketClosed = (ticketId) => {
//   //     console.log("AdminChat: Ticket closed", ticketId);
//   //     setTickets(prev => prev.map(t =>
//   //       Number(t.id) === Number(ticketId) ? { ...t, status: 'closed', isClosed: true } : t
//   //     ));
//   //     if (selectedTicketRef.current && Number(selectedTicketRef.current.id) === Number(ticketId)) {
//   //       setSelectedTicket(prev => ({ ...prev, status: 'closed' }));
//   //     }
//   //   };

//   //   socket.on("newMessage", handleNewMessage);
//   //   socket.on("messagesRead", handleMessagesRead);
//   //   socket.on("ticketAssigned", handleTicketAssigned);
//   //   socket.on("ticketClosed", handleTicketClosed);
//   //   socket.on("connect", handleConnect);

//   //   return () => {
//   //     socket.off("newMessage", handleNewMessage);
//   //     socket.off("messagesRead", handleMessagesRead);
//   //     socket.off("ticketAssigned", handleTicketAssigned);
//   //     socket.off("ticketClosed", handleTicketClosed);
//   //     socket.off("connect", handleConnect);
//   //   };
//   // }, [agentId]);
//   // ---------------- SOCKET LISTENER ----------------


// useEffect(() => {
//     if (!socket || !agentId) return;
//   }, [socket, agentId]);

//   // ✅ JOIN ROOMS WHEN TICKETS LOAD
//   useEffect(() => {
//     if (!socket || !tickets.length) return;

//     tickets.forEach(t => socket.emit("joinTicket", t.id));

//     if (selectedTicket) {
//       socket.emit("joinTicket", selectedTicket.id);
//     }
//   }, [socket, tickets, selectedTicket]);

// useEffect(() => {
//   if (!socket || !agentId) return;

//   const playNotificationSound = () => {
//     const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
//     audio.volume = 0.5;
//     audio.play().catch(() => {});
//   };

//   const handleNewMessage = (chat) => {
//     const currentSelected = selectedTicketRef.current;

//     if (chat.senderType !== "agent") {
//       playNotificationSound();
//     }

//     if (currentSelected && Number(currentSelected.id) === Number(chat.ticketId)) {
//       setMessages(prev => {
//         const exists = prev.find(m =>
//           (m.id && chat.id && m.id === chat.id) ||
//           (m.tempId && chat.tempId && m.tempId === chat.tempId)
//         );

//         if (exists) {
//           return prev.map(m =>
//             (m.tempId === chat.tempId || m.id === chat.id) ? chat : m
//           );
//         }

//         return [...prev, chat];
//       });

//       if (chat.senderType !== "agent") {
//         markMessagesAsRead(chat.ticketId, "admin").catch(console.error);
//       }
//     }

//     setTickets(prev => {
//       const idx = prev.findIndex(t => Number(t.id) === Number(chat.ticketId));
//       const isSelected = currentSelected && Number(currentSelected.id) === Number(chat.ticketId);

//       if (idx !== -1) {
//         const updated = {
//           ...prev[idx],
//           chats: [...(prev[idx].chats || []), chat],
//           unreadCount: isSelected ? 0 : (prev[idx].unreadCount || 0) + 1,
//           updatedAt: chat.createdAt
//         };

//         const copy = [...prev];
//         copy.splice(idx, 1);
//         return [updated, ...copy];
//       }

//       return prev;
//     });
//   };

//   const handleConnect = () => {
//     console.log("🔁 Admin reconnected");

//     const token = localStorage.getItem("adminToken");
//     if (token) socket.emit("adminLogin", token);

//     socket.emit("join", `admin_${agentId}`);

//     ticketsRef.current.forEach(t => socket.emit("joinTicket", t.id));
//     if (selectedTicketRef.current) socket.emit("joinTicket", selectedTicketRef.current.id);
//   };

//   socket.on("newMessage", handleNewMessage);
//   socket.on("connect", handleConnect);

//   return () => {
//     socket.off("newMessage", handleNewMessage);
//     socket.off("connect", handleConnect);
//   };
// }, [socket, agentId]);
//   // ---------------- SEND MESSAGE ----------------
//   const handleSendMessage = async (msgText, file) => {
//     if (!selectedTicket || !agentId || selectedTicket.status === "closed") return;
//     if (!msgText?.trim() && !file) return;

//     const tempId = Date.now();
//     let mediaUrl = "";
//     let mediaType = "";
//     let audioDuration = 0;

//     if (file) {
//       try {
//         const uploadRes = await uploadToCloudinary(file);
//         mediaUrl = uploadRes.secure_url;
//         mediaType = file.type.startsWith("audio") ? "audio" : "image";
//         audioDuration = uploadRes.duration || 0;
//       } catch (err) {
//         console.error("Upload failed", err);
//         return;
//       }
//     }

//     const optimisticMsg = {
//       id: null,
//       tempId,
//       ticketId: selectedTicket.id,
//       senderType: "agent",
//       message: msgText,
//       mediaUrl,
//       mediaType,
//       audioDuration,
//       createdAt: new Date().toISOString(),
//       isRead: false
//     };

//     setMessages(prev => [...prev, optimisticMsg]);

//     try {
//       await apiSendMessage({
//         ticketId: selectedTicket.id,
//         agentId,
//         message: msgText,
//         mediaUrl,
//         mediaType,
//         audioDuration,
//         tempId
//       });
//     } catch (err) {
//       console.error("Failed to send message", err);
//       setMessages(prev => prev.filter(m => m.tempId !== tempId));
//     }
//   };

//   const handleBack = () => {
//     setSelectedTicket(null);
//     setMobileView('list');
//   };

//   return (
//     <div className="flex h-[calc(100vh-64px)] bg-gray-100 overflow-hidden relative">
//       <TicketList
//         tickets={tickets}
//         selectedTicket={selectedTicket}
//         onSelectTicket={handleSelectTicket}
//         onCloseTicket={handleCloseTicket}
//         isLoading={isLoading}
//         onLoadMore={handleLoadMore}
//         hasMore={hasMore}
//         isFetchingMore={isFetchingMore}
//         className={mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
//       />

//       <ChatWindow
//         selectedTicket={selectedTicket}
//         messages={messages}
//         onSendMessage={handleSendMessage}
//         isChatDisabled={selectedTicket?.status === "closed"}
//         rating={rating}
//         onBack={handleBack}
//         className={mobileView === 'list' ? 'hidden md:flex' : 'flex'}
//       />
//     </div>
//   );
// }
