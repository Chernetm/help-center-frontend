import React, { useState, useEffect, useRef } from 'react';
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
  markMessagesAsRead,
  getTicket
} from '../../../api/cases';

import TicketList from './TicketList';
import ChatWindow from './ChatWindow';
import CaseSelectorModal from './CaseSelectorModal';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

export default function CustomerChat() {
  const [tickets, setTickets] = useState([]);
  const [cases, setCases] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const selectedTicketRef = useRef(null);
  const ticketsRef = useRef([]);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [rating, setRating] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const TICKET_LIMIT = 10;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { selectedTicketRef.current = selectedTicket; }, [selectedTicket]);
  useEffect(() => { ticketsRef.current = tickets; }, [tickets]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (!mobile) setShowChatOnMobile(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ---------------- INIT ----------------
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("customerToken");
        if (!token) return;

        const decoded = jwtDecode(token);
        setUserInfo(decoded);

        const casesData = await getCases();
        setCases(casesData || []);

        socket.emit("customerLogin", token);
        await fetchTickets(true);
      } catch (err) {
        console.error("Init load failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const fetchTickets = async (isInitial = false) => {
    try {
      const currentOffset = isInitial ? 0 : offset;
      const ticketsData = await getCustomerTickets(TICKET_LIMIT, currentOffset);
      console.log("Tickets Data:", ticketsData);

      const processedTickets = (ticketsData || []).map(ticket => ({
        ...ticket,
        unreadCount: ticket.unreadCount || 0
      }));

      setTickets(prev => {
        if (isInitial) return processedTickets;
        const existingIds = new Set(prev.map(t => t.id));
        const uniqueNew = processedTickets.filter(t => !existingIds.has(t.id));
        return [...prev, ...uniqueNew];
      });

      if (processedTickets.length < TICKET_LIMIT) setHasMore(false);

      if (isInitial) setOffset(processedTickets.length);
      else setOffset(prev => prev + processedTickets.length);

      processedTickets.forEach(t => socket.emit("joinTicket", t.id));
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  const handleLoadMore = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    await fetchTickets(false);
    setIsFetchingMore(false);
  };

  // ---------------- SELECT TICKET ----------------
  const handleSelectTicket = async (ticket) => {
    const updatedTicket = { ...ticket, unreadCount: 0 };
    setSelectedTicket(updatedTicket);
    setMessages(ticket.chats || []);

    setTickets(prev =>
      prev.map(t => Number(t.id) === Number(ticket.id) ? { ...t, unreadCount: 0 } : t)
    );

    socket.emit("joinTicket", ticket.id);

    try {
      await markMessagesAsRead(ticket.id, 'customer');
    } catch { }

    if (isMobileView) setShowChatOnMobile(true);

    if (ticket.status === "closed") {
      try {
        const data = await getTicketRating(ticket.id);
        setRating(data || null);
      } catch {
        setRating(null);
      }
    } else {
      setRating(null);
    }
  };

  // ---------------- SOCKET LISTENERS ----------------
  useEffect(() => {
    if (!socket) return;

    const playNotificationSound = () => {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => { });
    };

    const handleNewMessage = (chat) => {
      console.log("📨 CustomerChat received message:", chat);
      const currentSelected = selectedTicketRef.current;

      if (chat.senderType !== "customer") playNotificationSound();

      if (currentSelected && Number(currentSelected.id) === Number(chat.ticketId)) {
        setMessages(prev => {
          const exists = prev.find(m => Number(m.id) === Number(chat.id) || String(m.tempId) === String(chat.tempId));
          if (exists) return prev.map(m =>
            (Number(m.id) === Number(chat.id) || String(m.tempId) === String(chat.tempId)) ? chat : m
          );
          return [...prev, chat];
        });

        if (chat.senderType !== "customer") {
          markMessagesAsRead(chat.ticketId, "customer").catch(console.error);
        }
      }

      setTickets(prev => {
        const idx = prev.findIndex(t => Number(t.id) === Number(chat.ticketId));
        const isSelected = currentSelected && Number(currentSelected.id) === Number(chat.ticketId);

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

        getTicket(chat.ticketId, 'customer').then(ticket => {
          if (!ticket) return;
          socket.emit("joinTicket", ticket.id);
          setTickets(curr => curr.find(t => Number(t.id) === Number(ticket.id)) ? curr : [
            { ...ticket, unreadCount: 1 },
            ...curr
          ]);
        });

        return prev;
      });
    };

    const handleMessagesRead = ({ ticketId, readBy }) => {
      const currentSelected = selectedTicketRef.current;

      if (readBy === "admin" && currentSelected && Number(currentSelected.id) === Number(ticketId)) {
        setMessages(prev =>
          prev.map(m => m.senderType === "customer" ? { ...m, isRead: true } : m)
        );
      }

      if (readBy === "customer") {
        setTickets(prev =>
          prev.map(t => Number(t.id) === Number(ticketId) ? { ...t, unreadCount: 0 } : t)
        );
      }
    };

    const handleConnect = () => {
      const token = localStorage.getItem("customerToken");
      if (token) socket.emit("customerLogin", token);

      ticketsRef.current.forEach(t => socket.emit("joinTicket", t.id));
      if (selectedTicketRef.current) socket.emit("joinTicket", selectedTicketRef.current.id);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("connect", handleConnect);
    };
  }, []);

  // ---------------- CREATE TICKET ----------------
  const handleCreateTicket = async (caseId) => {
    setIsCreatingTicket(true);
    try {
      const caseObj = cases.find(c => c.id === caseId);

      const newTicket = await createTicket({
        customerId: userInfo.userId || userInfo.id,
        caseId,
        subject: `Help with ${caseObj?.name}`,
        description: "Started new conversation"
      });

      setIsModalOpen(false);

      setTickets(prev => prev.find(t => String(t.id) === String(newTicket.id))
        ? prev
        : [newTicket, ...prev]
      );

      setSelectedTicket(newTicket);
    } catch (err) {
      alert("Could not create ticket");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // ---------------- SEND MESSAGE ----------------
  const handleSendMessage = async (msgText, file) => {
    if (!selectedTicket || (!msgText?.trim() && !file)) return;

    const tempId = Date.now();
    let mediaUrl = "", mediaType = "", audioDuration = 0;

    if (file) {
      const uploadRes = await uploadToCloudinary(file);
      mediaUrl = uploadRes.secure_url;
      mediaType = file.type.startsWith("audio") ? "audio" : "image";
      audioDuration = uploadRes.duration || 0;
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
        tempId
      });
    } catch {
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
      setNewMessage(msgText);
    }
  };

  // ---------------- RATE ----------------
  const handleRateTicket = async (score, comment) => {
    if (!selectedTicket) return;
    const res = await rateTicket(selectedTicket.id, { score, comment });
    setRating(res);
    alert("Thanks for your rating!");
  };

  return (
    // ⚠️ YOUR UI IS UNCHANGED BELOW
    // (kept exactly as you wrote it)
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-100 relative">

      {isMobileView ? (
        <AnimatePresence mode="wait">
          {!showChatOnMobile && (
            <motion.div key="list" className="absolute inset-0 z-10 h-full w-full overflow-hidden">
              <TicketList
                tickets={tickets}
                selectedTicket={selectedTicket}
                onSelectTicket={handleSelectTicket}
                isLoading={isLoading}
                onOpenNewTicket={() => setIsModalOpen(true)}
                isMobileView={true}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isFetchingMore={isFetchingMore}
              />
            </motion.div>
          )}

          {showChatOnMobile && (
            <motion.div key="chat" className="absolute inset-0 z-20 h-full bg-[#E4EBEF]">
              <ChatWindow
                selectedTicket={selectedTicket}
                messages={messages}
                newMessage={newMessage}
                onNewMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                rating={rating}
                onSubmitRating={handleRateTicket}
                isMobile={true}
                onBack={() => setShowChatOnMobile(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className="flex w-full h-full overflow-hidden">
          <div className="w-80 lg:w-96 relative bg-white shrink-0">
            <TicketList
              tickets={tickets}
              selectedTicket={selectedTicket}
              onSelectTicket={handleSelectTicket}
              isLoading={isLoading}
              onOpenNewTicket={() => setIsModalOpen(true)}
              isMobileView={false}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isFetchingMore={isFetchingMore}
            />
          </div>
          <div className="flex-1 bg-[#E4EBEF]">
            <ChatWindow
              selectedTicket={selectedTicket}
              messages={messages}
              newMessage={newMessage}
              onNewMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              rating={rating}
              onSubmitRating={handleRateTicket}
              isMobile={false}
              onBack={() => { }}
            />
          </div>
        </div>
      )}

      <CaseSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cases={cases}
        onSelectCase={handleCreateTicket}
        isCreating={isCreatingTicket}
      />
    </div>
  );
}


// import React, { useState, useEffect } from 'react';
// import { jwtDecode } from 'jwt-decode';
// import socket from '../../../socket';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//     getCases,
//     getTicketRating,
//     getCustomerTickets,
//     rateTicket,
//     createTicket,
//     sendMessage as apiSendMessage,
//     markMessagesAsRead,
//     getTicket
// } from '../../../api/cases';

// import TicketList from './TicketList';
// import ChatWindow from './ChatWindow';
// import CaseSelectorModal from './CaseSelectorModal';
// import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

// export default function CustomerChat() {

//     const [tickets, setTickets] = useState([]);
//     const [cases, setCases] = useState([]);
//     const [selectedTicket, setSelectedTicket] = useState(null);
//     const selectedTicketRef = React.useRef(null);
//     const ticketsRef = React.useRef([]);

//     // Update refs whenever state changes
//     useEffect(() => {
//         selectedTicketRef.current = selectedTicket;
//     }, [selectedTicket]);

//     useEffect(() => {
//         ticketsRef.current = tickets;
//     }, [tickets]);

//     const [messages, setMessages] = useState([]);
//     const [newMessage, setNewMessage] = useState("");

//     // ⭐ RATING
//     const [rating, setRating] = useState(null);

//     const [userInfo, setUserInfo] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);

//     const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
//     const [showChatOnMobile, setShowChatOnMobile] = useState(false);

//     // ⭐ Lazy Loading
//     const TICKET_LIMIT = 10;
//     const [offset, setOffset] = useState(0);
//     const [hasMore, setHasMore] = useState(true);
//     const [isFetchingMore, setIsFetchingMore] = useState(false);
//     const [isCreatingTicket, setIsCreatingTicket] = useState(false);

//     useEffect(() => {
//         const handleResize = () => {
//             const mobile = window.innerWidth < 1024;
//             setIsMobileView(mobile);
//             // If we switch to desktop, reset mobile specific state
//             if (!mobile) setShowChatOnMobile(false);
//         };
//         window.addEventListener('resize', handleResize);
//         return () => window.removeEventListener('resize', handleResize);
//     }, []);

//     const [isModalOpen, setIsModalOpen] = useState(false);
//     // ---------------- INIT ----------------
//     const init = async () => {
//         try {
//             const token = localStorage.getItem("customerToken");
//             if (!token) return;

//             const decoded = jwtDecode(token);
//             setUserInfo(decoded);

//             const casesData = await getCases();
//             setCases(casesData || []);

//             // Login to WebSocket personal room
//             socket.emit("customerLogin", token);

//             // Initial ticket load
//             await fetchTickets(true);
//         } catch (err) {
//             console.error("Init load failed:", err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const fetchTickets = async (isInitial = false) => {
//         try {
//             const currentOffset = isInitial ? 0 : offset;
//             const ticketsData = await getCustomerTickets(TICKET_LIMIT, currentOffset);

//             console.log("Tickets Data:", ticketsData);

//             // Calculate unread counts and process
//             const processedTickets = (ticketsData || []).map(ticket => ({
//                 ...ticket,
//                 unreadCount: ticket.chats?.filter(c => c.senderType !== 'customer' && !c.isRead).length || 0
//             }));

//             setTickets(prev => {
//                 if (isInitial) return processedTickets;
//                 // Filter out any tickets that already exist in the state to avoid duplicate keys
//                 const existingIds = new Set(prev.map(t => t.id));
//                 const uniqueNew = processedTickets.filter(t => !existingIds.has(t.id));
//                 return [...prev, ...uniqueNew];
//             });

//             if (processedTickets.length < TICKET_LIMIT) {
//                 setHasMore(false);
//             }

//             if (isInitial) {
//                 setOffset(processedTickets.length);
//             } else {
//                 setOffset(prev => prev + processedTickets.length);
//             }

//             // Join rooms
//             processedTickets.forEach(t => {
//                 socket.emit("joinTicket", t.id);
//             });

//         } catch (err) {
//             console.error("Failed to fetch tickets:", err);
//         }
//     };

//     const handleLoadMore = async () => {
//         if (isFetchingMore || !hasMore) return;
//         setIsFetchingMore(true);
//         await fetchTickets(false);
//         setIsFetchingMore(false);
//     };

//     useEffect(() => {
//         init();
//     }, []);

//     // ---------------- SELECT TICKET & MARK READ ----------------
//     const handleSelectTicket = async (ticket) => {
//         const updatedTicket = { ...ticket, unreadCount: 0 };
//         setSelectedTicket(updatedTicket);

//         setTickets(prev => prev.map(t =>
//             t.id === ticket.id ? { ...t, unreadCount: 0 } : t
//         ));

//         // Call API
//         try {
//             await markMessagesAsRead(ticket.id, 'customer');
//         } catch (err) {
//             console.error("Failed to mark messages as read", err);
//         }
//     };

//     // ---------------- ON SELECT TICKET (SIDE EFFECTS) ----------------
//     useEffect(() => {
//         if (!selectedTicket || !socket) return;

//         socket.emit("joinTicket", selectedTicket.id);
//         console.log("Joined ticket room:", selectedTicket.id);
//         setMessages(selectedTicket.chats || []);

//         if (isMobileView) {
//             setShowChatOnMobile(true);
//         }

//         const loadRating = async () => {
//             try {
//                 const data = await getTicketRating(selectedTicket.id);
//                 setRating(data || null);
//             } catch (err) {
//                 setRating(null);
//             }
//         };

//         if (selectedTicket.status === "closed")
//             loadRating();
//         else
//             setRating(null);

//     }, [selectedTicket?.id, isMobileView]); // Only re-run if ID changes

//     // ---------------- JOIN TICKET ROOM ----------------
//     useEffect(() => {
//         if (!selectedTicket?.id || !socket) return;
//         socket.emit("joinTicket", selectedTicket.id);
//         console.log("CustomerChat: Emitted joinTicket for", selectedTicket.id);
//     }, [selectedTicket?.id]);

//     // ---------------- SOCKET LISTENERS ----------------
//     // useEffect(() => {
//     //     if (!socket) return;

//     //     const handleNewMessage = async (chat) => {
//     //         console.log("CustomerChat: Received newMessage", chat);
//     //         const currentSelected = selectedTicketRef.current;

//     //         // Update selected ticket messages if open
//     //         if (currentSelected && Number(currentSelected.id) === Number(chat.ticketId)) {
//     //             setMessages(prev => {
//     //                 const exists = prev.find(m =>
//     //                     (m.id && chat.id && m.id === chat.id) ||
//     //                     (m.tempId && chat.tempId && m.tempId === chat.tempId) ||
//     //                     (m.message === chat.message && Math.abs(new Date(m.createdAt) - new Date(chat.createdAt)) < 2000)
//     //                 );
//     //                 if (exists) {
//     //                     return prev.map(m => (m.tempId === chat.tempId || m.id === chat.id) ? chat : m);
//     //                 }
//     //                 return [...prev, chat];
//     //             });

//     //             if (chat.senderType !== 'customer') {
//     //                 markMessagesAsRead(chat.ticketId, 'customer').catch(console.error);
//     //             }
//     //         }

//     //         // Update ticket list (unread count / last message) & Reorder
//     //         setTickets(prev => {
//     //             const ticketIndex = prev.findIndex(t => Number(t.id) === Number(chat.ticketId));
//     //             const isSelected = currentSelected && Number(currentSelected.id) === Number(chat.ticketId);

//     //             if (ticketIndex !== -1) {
//     //                 // Update existing and move to top
//     //                 const updatedTicket = {
//     //                     ...prev[ticketIndex],
//     //                     chats: [...(prev[ticketIndex].chats || []), chat],
//     //                     unreadCount: isSelected ? 0 : (prev[ticketIndex].unreadCount || 0) + 1,
//     //                     updatedAt: chat.createdAt
//     //                 };
//     //                 const newTickets = [...prev];
//     //                 newTickets.splice(ticketIndex, 1);
//     //                 return [updatedTicket, ...newTickets];
//     //             } else {
//     //                 // Ticket not in list (possibly on another page), fetch it
//     //                 getTicket(chat.ticketId, 'customer').then(ticket => {
//     //                     if (ticket) {
//     //                         const processedTicket = {
//     //                             ...ticket,
//     //                             unreadCount: 1, // It's a new message for a non-loaded ticket
//     //                             updatedAt: chat.createdAt
//     //                         };
//     //                         setTickets(current => {
//     //                             if (current.find(t => Number(t.id) === Number(ticket.id))) return current;
//     //                             return [processedTicket, ...current];
//     //                         });
//     //                         // Also join this ticket's room just in case (though we should be in it via personal room)
//     //                         socket.emit("joinTicket", ticket.id);
//     //                     }
//     //                 }).catch(err => console.error("Failed to fetch missing ticket:", err));
//     //                 return prev;
//     //             }
//     //         });
//     //     };

//     //     const handleMessagesRead = ({ ticketId, readBy }) => {
//     //         const currentSelected = selectedTicketRef.current;
//     //         if (readBy === 'admin') {
//     //             if (currentSelected && Number(currentSelected.id) === Number(ticketId)) {
//     //                 setMessages(prev => prev.map(m =>
//     //                     m.senderType === 'customer' ? { ...m, isRead: true } : m
//     //                 ));
//     //             }
//     //         } else if (readBy === 'customer') {
//     //             setTickets(prev => prev.map(t =>
//     //                 Number(t.id) === Number(ticketId) ? { ...t, unreadCount: 0 } : t
//     //             ));
//     //         }
//     //     };

//     //     const handleAdminStatusChanged = ({ adminId, isOnline }) => {
//     //         setTickets(prev => prev.map(t => {
//     //             if (t.agent && Number(t.agent.id) === Number(adminId)) {
//     //                 return { ...t, agent: { ...t.agent, isOnline } };
//     //             }
//     //             return t;
//     //         }));

//     //         setSelectedTicket(prev => {
//     //             if (prev && prev.agent && Number(prev.agent.id) === Number(adminId)) {
//     //                 return { ...prev, agent: { ...prev.agent, isOnline } };
//     //             }
//     //             return prev;
//     //         });
//     //     };

//     //     const handleConnect = () => {
//     //         console.log("CustomerChat: Socket connected/reconnected");
//     //         const token = localStorage.getItem("customerToken");
//     //         if (token) {
//     //             socket.emit("customerLogin", token);
//     //         }
//     //         // Re-join all ticket rooms for active tickets in view
//     //         ticketsRef.current.forEach(t => {
//     //             socket.emit("joinTicket", t.id);
//     //         });
//     //         console.log("CustomerChat: Re-joined all ticket rooms");
//     //     };

//     //     const handleTicketClosed = (ticketId) => {
//     //         console.log("CustomerChat: Ticket closed", ticketId);
//     //         setTickets(prev => prev.map(t =>
//     //             Number(t.id) === Number(ticketId) ? { ...t, status: 'closed', isClosed: true } : t
//     //         ));
//     //         if (selectedTicketRef.current && Number(selectedTicketRef.current.id) === Number(ticketId)) {
//     //             setSelectedTicket(prev => ({ ...prev, status: 'closed', isClosed: true }));
//     //         }
//     //     };

//     //     socket.on("newMessage", handleNewMessage);
//     //     socket.on("messagesRead", handleMessagesRead);
//     //     socket.on("adminStatusChanged", handleAdminStatusChanged);
//     //     socket.on("ticketClosed", handleTicketClosed);
//     //     socket.on("connect", handleConnect);

//     //     return () => {
//     //         socket.off("newMessage", handleNewMessage);
//     //         socket.off("messagesRead", handleMessagesRead);
//     //         socket.off("adminStatusChanged", handleAdminStatusChanged);
//     //         socket.off("ticketClosed", handleTicketClosed);
//     //         socket.off("connect", handleConnect);
//     //     };
//     // }, []); // Only once


//     // ---------------- SOCKET LISTENERS ----------------

// // 🔌 main socket listener effect
//   useEffect(() => {
//     if (!socket) return;
//   }, [socket]);

//   // ✅ JOIN ROOMS WHEN DATA LOADS
//   useEffect(() => {
//     if (!socket || !tickets.length) return;

//     tickets.forEach(t => socket.emit("joinTicket", t.id));

//     if (selectedTicket) {
//       socket.emit("joinTicket", selectedTicket.id);
//     }
//   }, [socket, tickets, selectedTicket]);


// useEffect(() => {
//   if (!socket) return;

//   const playNotificationSound = () => {
//     const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
//     audio.volume = 0.5;
//     audio.play().catch(() => {});
//   };

//   const handleNewMessage = (chat) => {
//     const currentSelected = selectedTicketRef.current;

//     if (chat.senderType !== "customer") {
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

//       if (chat.senderType !== "customer") {
//         markMessagesAsRead(chat.ticketId, "customer").catch(console.error);
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

//   const handleMessagesRead = ({ ticketId, readBy }) => {
//     const currentSelected = selectedTicketRef.current;

//     if (readBy === "admin" && currentSelected && Number(currentSelected.id) === Number(ticketId)) {
//       setMessages(prev =>
//         prev.map(m => m.senderType === "customer" ? { ...m, isRead: true } : m)
//       );
//     }

//     if (readBy === "customer") {
//       setTickets(prev =>
//         prev.map(t => Number(t.id) === Number(ticketId) ? { ...t, unreadCount: 0 } : t)
//       );
//     }
//   };

//   const handleConnect = () => {
//     console.log("🔁 Customer reconnected");

//     const token = localStorage.getItem("customerToken");
//     if (token) socket.emit("customerLogin", token);

//     ticketsRef.current.forEach(t => socket.emit("joinTicket", t.id));
//     if (selectedTicketRef.current) socket.emit("joinTicket", selectedTicketRef.current.id);
//   };

//   socket.on("newMessage", handleNewMessage);
//   socket.on("messagesRead", handleMessagesRead);
//   socket.on("connect", handleConnect);

//   return () => {
//     socket.off("newMessage", handleNewMessage);
//     socket.off("messagesRead", handleMessagesRead);
//     socket.off("connect", handleConnect);
//   };
// }, [socket]);
//     // ---------------- CREATE TICKET ----------------
//     const handleCreateTicket = async (caseId) => {
//         setIsCreatingTicket(true);
//         try {
//             const caseObj = cases.find(c => c.id === caseId);

//             const newTicket = await createTicket({
//                 customerId: userInfo.userId || userInfo.id,
//                 caseId,
//                 subject: `Help with ${caseObj?.name}`,
//                 description: "Started new conversation"
//             });

//             // Close modal immediately on success
//             setIsModalOpen(false);

//             setTickets(prev => {
//                 if (prev.find(t => String(t.id) === String(newTicket.id))) {
//                     console.log("CustomerChat: Ticket already exists, selecting it.", newTicket.id);
//                     return prev.map(t => String(t.id) === String(newTicket.id) ? newTicket : t);
//                 }
//                 return [newTicket, ...prev];
//             });
//             setSelectedTicket(newTicket);

//         } catch (err) {
//             console.error("Create ticket failed:", err);
//             const errMsg = err?.response?.data?.error || "Could not create ticket. Please try again later.";
//             alert(errMsg);
//             // Optionally close modal on error if requested, but usually we leave it open to try another topic
//             // setIsModalOpen(false);
//         } finally {
//             setIsCreatingTicket(false);
//             setIsLoading(false); // Safety reset
//         }
//     };

//     // ---------------- SEND MESSAGE ----------------
//     const handleSendMessage = async (msgText, file) => {
//         if (!selectedTicket || (!msgText?.trim() && !file)) return;

//         const tempId = Date.now();
//         let mediaUrl = "";
//         let mediaType = "";
//         let audioDuration = 0;

//         if (file) {
//             try {
//                 const uploadRes = await uploadToCloudinary(file);
//                 mediaUrl = uploadRes.secure_url;
//                 mediaType = file.type.startsWith("audio") ? "audio" : "image";
//                 audioDuration = uploadRes.duration || 0;
//             } catch (err) {
//                 console.error("Upload failed", err);
//                 return;
//             }
//         }

//         const optimisticMsg = {
//             id: null,
//             tempId,
//             ticketId: selectedTicket.id,
//             senderType: "customer",
//             message: msgText,
//             mediaUrl,
//             mediaType,
//             audioDuration,
//             createdAt: new Date().toISOString(),
//             isRead: false
//         };

//         // Optimistic Update
//         setMessages(prev => [...prev, optimisticMsg]);
//         setNewMessage("");

//         try {
//             await apiSendMessage({
//                 ticketId: selectedTicket.id,
//                 senderType: "customer",
//                 message: msgText,
//                 mediaUrl,
//                 mediaType,
//                 audioDuration,
//                 tempId // Pass tempId so backend can echo it back for matching
//             });
//         } catch (err) {
//             console.error("Send failed", err);
//             // Remove optimistic message on failure
//             setMessages(prev => prev.filter(m => m.tempId !== tempId));
//             setNewMessage(msgText);
//         }
//     };

//     // ---------------- ⭐ RATE TICKET ----------------
//     const handleRateTicket = async (score, comment) => {
//         if (!selectedTicket) return;

//         try {
//             const res = await rateTicket(
//                 selectedTicket.id,
//                 { score, comment }
//             );

//             setRating(res);   // store full object
//             alert("Thanks for your rating!");

//         } catch (err) {
//             console.error("Rating failed", err);
//             alert(err?.response?.data?.message || "Rating failed");
//         }
//     };

//     return (
//         <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-100 relative">

//             {isMobileView ? (
//                 <AnimatePresence mode="wait">
//                     {/* List View: Visible on Mobile when no chat is showing */}
//                     {!showChatOnMobile && (
//                         <motion.div
//                             key="list"
//                             initial={{ x: -300, opacity: 0 }}
//                             animate={{ x: 0, opacity: 1 }}
//                             exit={{ x: -300, opacity: 0 }}
//                             transition={{ type: "spring", damping: 25, stiffness: 200 }}
//                             className="absolute inset-0 z-10 h-full w-full overflow-hidden"
//                         >
//                             <TicketList
//                                 tickets={tickets}
//                                 selectedTicket={selectedTicket}
//                                 onSelectTicket={handleSelectTicket}
//                                 isLoading={isLoading}
//                                 onOpenNewTicket={() => setIsModalOpen(true)}
//                                 isMobileView={true}
//                                 onLoadMore={handleLoadMore}
//                                 hasMore={hasMore}
//                                 isFetchingMore={isFetchingMore}
//                             />
//                         </motion.div>
//                     )}

//                     {/* Chat View: Visible on Mobile when showing chat */}
//                     {showChatOnMobile && (
//                         <motion.div
//                             key="chat"
//                             initial={{ x: 300, opacity: 0 }}
//                             animate={{ x: 0, opacity: 1 }}
//                             exit={{ x: 300, opacity: 0 }}
//                             transition={{ type: "spring", damping: 25, stiffness: 200 }}
//                             className="absolute inset-0 z-20 h-full bg-[#E4EBEF]"
//                         >
//                             <ChatWindow
//                                 selectedTicket={selectedTicket}
//                                 messages={messages}
//                                 newMessage={newMessage}
//                                 onNewMessageChange={setNewMessage}
//                                 onSendMessage={handleSendMessage}
//                                 rating={rating}
//                                 onSubmitRating={handleRateTicket}
//                                 isMobile={true}
//                                 onBack={() => setShowChatOnMobile(false)}
//                             />
//                         </motion.div>
//                     )}
//                 </AnimatePresence>
//             ) : (
//                 <div className="flex w-full h-full overflow-hidden">
//                     <div className="w-80 lg:w-96 relative bg-white shrink-0">
//                         <TicketList
//                             tickets={tickets}
//                             selectedTicket={selectedTicket}
//                             onSelectTicket={handleSelectTicket}
//                             isLoading={isLoading}
//                             onOpenNewTicket={() => setIsModalOpen(true)}
//                             isMobileView={false}
//                             onLoadMore={handleLoadMore}
//                             hasMore={hasMore}
//                             isFetchingMore={isFetchingMore}
//                         />
//                     </div>
//                     <div className="flex-1 bg-[#E4EBEF]">
//                         <ChatWindow
//                             selectedTicket={selectedTicket}
//                             messages={messages}
//                             newMessage={newMessage}
//                             onNewMessageChange={setNewMessage}
//                             onSendMessage={handleSendMessage}
//                             rating={rating}
//                             onSubmitRating={handleRateTicket}
//                             isMobile={false}
//                             onBack={() => { }}
//                         />
//                     </div>
//                 </div>
//             )}

//             <CaseSelectorModal
//                 isOpen={isModalOpen}
//                 onClose={() => setIsModalOpen(false)}
//                 cases={cases}
//                 onSelectCase={handleCreateTicket}
//                 isCreating={isCreatingTicket}
//             />

//         </div>
//     );
// }
