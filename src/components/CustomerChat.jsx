
import React, { useEffect, useState } from "react";
import socket from "../socket";
import { jwtDecode } from "jwt-decode";
import client from "../api/client";

export default function CasesChat() {
  const [customerId, setCustomerId] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [cases, setCases] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);

  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Rating state
  const [rating, setRating] = useState(null);
  const [newScore, setNewScore] = useState(0);
  const [newComment, setNewComment] = useState("");

  // Decode token
  useEffect(() => {
    const token = localStorage.getItem("customerToken");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCustomerId(decoded.userId);
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
    setAuthLoaded(true);
  }, []);

  // Fetch case types
  useEffect(() => {
    client.get("/cases")
      .then(res => setCases(res.data || []))
      .catch(err => console.error("Error fetching cases:", err))
      .finally(() => setIsLoadingCases(false));
  }, []);

  // Fetch customer tickets
  useEffect(() => {
    if (!authLoaded || !customerId) {
      if (authLoaded) setIsLoadingTickets(false); // Stop loading if auth loaded but no customerId
      return;
    }

    // Use correct endpoint which infers customer from token
    client.get("/customer/tickets")
      .then(res => setTickets(res.data || []))
      .catch(err => {
        console.error("Error fetching tickets:", err);
        setTickets([]);
      })
      .finally(() => setIsLoadingTickets(false));
  }, [authLoaded, customerId]);

  // Handle selected ticket
  useEffect(() => {
    if (!selectedTicket) return;

    socket.emit("joinTicket", selectedTicket.id);
    setMessages(selectedTicket.chats || []);

    // Fetch rating if closed
    if (selectedTicket.status === "closed") {
      client.get(`/customer/tickets/${selectedTicket.id}/rating`)
        .then(res => setRating(res.data || null))
        .catch(() => setRating(null));
    } else {
      setRating(null);
      setNewScore(0);
      setNewComment("");
    }
  }, [selectedTicket]);

  // Real-time messages
  useEffect(() => {
    socket.on("newMessage", chat => {
      setMessages(prev => [...prev, chat]);
    });

    return () => socket.off("newMessage");
  }, []);

  // Ticket closed update
  useEffect(() => {
    socket.on("ticketClosed", ticketId => {
      setTickets(prev =>
        prev.map(t => (t.id === ticketId ? { ...t, status: "closed" } : t))
      );
    });

    return () => socket.off("ticketClosed");
  }, []);

  // Create/select ticket
  const handleSelectCase = async caseId => {
    if (!caseId || !customerId) return;

    const existing = tickets.find(
      t => t.caseId === parseInt(caseId) && t.status !== "closed"
    );

    if (existing) {
      setSelectedTicket(existing);
      return;
    }

    setIsCreatingTicket(true);

    try {
      const res = await client.post("/customer/tickets", { caseId: parseInt(caseId) });
      const ticket = res.data;

      setTickets(prev => {
        // Prevent duplicates if backend returns an existing ticket we somehow missed
        if (prev.find(t => t.id === ticket.id)) {
          return prev.map(t => t.id === ticket.id ? ticket : t);
        }
        return [...prev, ticket];
      });
      setSelectedTicket(ticket);
    } catch (err) {
      console.error("Error creating ticket:", err);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      await client.post(
        `/customer/tickets/messages`, // Correct endpoint
        {
          message: newMessage,
          ticketId: selectedTicket.id,
          // customerId is inferred from token in backend, but we can send if needed (handler gets it from token)
        }
      );
      // Note: socket will push the new message back to us
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + (err.response?.data?.error || err.message));
    }
  };

  const canChat = selectedTicket?.status === "assigned";

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* LEFT: Tickets */}
      <div className="w-1/3 bg-white border-r overflow-y-auto">
        <h2 className="p-4 font-bold border-b">Your Tickets</h2>

        {!authLoaded ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : isLoadingTickets ? (
          <div className="p-4 text-center text-gray-500">Loading tickets...</div>
        ) : (
          (tickets || []).map(ticket => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`p-4 cursor-pointer border-b hover:bg-gray-100 ${selectedTicket?.id === ticket.id ? "bg-gray-200" : ""
                }`}
            >
              <div className="font-semibold">{ticket.case?.name || "Unknown Case"}</div>
              <div className="text-sm text-gray-500">
                Agent: {ticket.agent?.name || "Not assigned"}
              </div>
              <div className="text-xs text-gray-400">
                Status: {ticket.status}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CENTER: Chat */}
      <div className="flex-1 flex flex-col">
        {isCreatingTicket ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Creating new ticket...
          </div>
        ) : selectedTicket ? (
          <>
            <div className="p-4 border-b bg-white">
              <div className="font-bold">
                Chat with {selectedTicket.agent?.name || "Waiting for agent"}
              </div>
              <div className="text-sm text-gray-500">
                Case: {selectedTicket.case?.name || "Unknown Case"}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-2">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`max-w-[70%] p-2 rounded ${m.senderType === "customer"
                    ? "bg-blue-100 self-end text-right"
                    : "bg-gray-200 self-start text-left"
                    }`}
                >
                  <div className="text-sm">{m.message}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}

              {/* ⭐ Rating Box */}
              {selectedTicket.status === "closed" && (
                <div className="self-center mt-4 bg-white border rounded-lg shadow p-4 text-center max-w-sm">
                  <div className="font-semibold text-gray-700 mb-2">
                    Ticket Closed — Your Rating
                  </div>

                  {rating ? (
                    <>
                      <div className="flex justify-center mb-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <span
                            key={n}
                            className={`text-2xl ${n <= rating.score ? "text-yellow-400" : "text-gray-300"}`}
                          >★</span>
                        ))}
                      </div>
                      {rating.comment && (
                        <div className="text-sm italic text-gray-600">“{rating.comment}”</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center mb-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setNewScore(n)}
                            className={`text-2xl ${n <= newScore ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment (optional)"
                        className="w-full border rounded p-2 text-sm mb-2"
                      />
                      <button
                        onClick={async () => {
                          if (newScore === 0) return alert("Please select a rating");
                          try {
                            const res = await client.post(`/customer/tickets/${selectedTicket.id}/rating`, {
                              score: newScore,
                              comment: newComment
                            });
                            setRating(res.data);
                          } catch (err) {
                            alert(err.response?.data?.message || err.message);
                          }
                        }}
                        className="bg-blue-600 text-white px-4 py-1 rounded"
                      >
                        Submit Rating
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Input — hidden if closed */}
            {selectedTicket.status !== "closed" && (
              <div className="p-4 bg-white flex space-x-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={!canChat}
                  className="flex-1 border rounded p-2"
                  placeholder={canChat ? "Type a message…" : "Waiting for agent…"}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!canChat}
                  className="bg-blue-600 text-white px-4 rounded"
                >
                  Send
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a ticket or case to start chatting
          </div>
        )}
      </div>

      {/* RIGHT: Case Selector */}
      <div className="w-1/4 bg-white border-l p-4">
        <h2 className="font-bold mb-2">Case Types</h2>
        <select
          className="w-full border rounded p-2"
          onChange={e => handleSelectCase(e.target.value)}
        >
          <option value="">-- Select Case --</option>
          {cases.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.department})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
