import React, { useEffect, useState } from "react";
import socket from "../socket";
import { jwtDecode } from "jwt-decode";

export default function AgentChat() {
  const [agentId, setAgentId] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // 🔐 Decode agent token
  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setAgentId(decoded.userId);
        console.log("AGENT ID:", decoded.userId);
      } catch (err) {
        console.error("Invalid admin token", err);
      }
    }

    setAuthLoaded(true);
  }, []);

  // 📥 Fetch assigned tickets (only when agentId ready)
  useEffect(() => {
    if (!authLoaded || !agentId) return;

    fetch(`http://localhost:3000/api/agents/${agentId}/tickets`)
      .then(res => res.json())
      .then(setTickets)
      .catch(console.error);
  }, [authLoaded, agentId]);

  // 🎧 Join socket room when ticket selected
  useEffect(() => {
    if (selectedTicket) {
      socket.emit("joinTicket", selectedTicket.id);
      setMessages(selectedTicket.chats || []);
    }
  }, [selectedTicket]);

  // 📡 Real-time receive
  useEffect(() => {
    socket.on("newMessage", chat => {
      setMessages(prev => [...prev, chat]);
    });

    return () => socket.off("newMessage");
  }, []);

  // 🔒 Close ticket
  const closeTicket = async (ticketId) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/tickets/${ticketId}/close`,
        { method: "PUT" }
      );

      if (!res.ok) throw new Error("close failed");

      setTickets(prev =>
        prev.map(t =>
          t.id === ticketId ? { ...t, isClosed: true } : t
        )
      );

      if (selectedTicket?.id === ticketId)
        setSelectedTicket(prev => ({ ...prev, isClosed: true }));

    } catch (err) {
      console.error(err);
    }
  };

  // 📨 Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !agentId || selectedTicket.isClosed) return;

    await fetch(
      `http://localhost:3000/api/agents/${selectedTicket.id}/chats`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          message: newMessage,
        }),
      }
    );

    setNewMessage("");
  };

  const isChatDisabled = selectedTicket?.isClosed;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* LEFT */}
      <div className="w-1/3 bg-white border-r overflow-y-auto">
        <h2 className="p-4 font-bold border-b">Assigned Tickets</h2>

        {!authLoaded ? (
          <div className="p-4 text-center text-gray-500">Loading…</div>
        ) : tickets.length ? (
          tickets.map(ticket => (
            <div
              key={ticket.id}
              className={`p-4 border-b hover:bg-gray-100 ${
                selectedTicket?.id === ticket.id ? "bg-gray-200" : ""
              }`}
            >
              <div
                onClick={() => setSelectedTicket(ticket)}
                className="cursor-pointer"
              >
                <div className="font-semibold">
                  {ticket.customer.name}
                </div>
                <div className="text-sm text-gray-500">
                  Ticket #{ticket.id}{" "}
                  {ticket.isClosed && (
                    <span className="text-red-500 font-bold">
                      (CLOSED)
                    </span>
                  )}
                </div>
              </div>

              {!ticket.isClosed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTicket(ticket.id);
                  }}
                  className="mt-2 text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                >
                  Close Ticket
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 text-gray-500">No tickets</div>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex flex-col">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b bg-white">
              <div className="font-bold">
                {selectedTicket.customer.name}
                {isChatDisabled && (
                  <span className="ml-2 text-sm text-red-500 font-bold">
                    (CLOSED)
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {selectedTicket.customer.phoneNumber}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-2">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`max-w-[70%] p-2 rounded ${
                    m.senderType === "agent"
                      ? "bg-green-100 self-end text-right"
                      : "bg-gray-200 self-start text-left"
                  }`}
                >
                  <div className="text-sm">{m.message}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>

            {isChatDisabled ? (
              <div className="p-4 bg-white text-center text-gray-500">
                This ticket is closed.
              </div>
            ) : (
              <div className="p-4 bg-white flex space-x-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="flex-1 border rounded p-2"
                  placeholder="Reply to customer…"
                />
                <button
                  onClick={sendMessage}
                  className="bg-green-600 text-white px-4 rounded"
                >
                  Send
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a ticket to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
