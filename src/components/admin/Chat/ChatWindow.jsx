import React, { useRef, useEffect, useState } from 'react'; 
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Paperclip, MoreVertical, Mic, Trash2, Square, Play, Pause, Image as ImageIcon, X } from 'lucide-react';
import { formatChatDateHeader } from '../../../utils/dateUtils';

// --- Helper Components ---

const TelegramAudioPlayer = ({ src, duration }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        if (total) {
            setProgress((current / total) * 100);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 bg-opacity-10 bg-black rounded-xl p-2 min-w-[200px]">
            <button 
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
            </button>
            
            <div className="flex-1 flex flex-col gap-1">
                <div className="relative h-1 bg-gray-300 rounded-full overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-100" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                    <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"}</span>
                    <span>{duration || (audioRef.current ? formatTime(audioRef.current.duration) : "0:00")}</span>
                </div>
            </div>

            <audio 
                ref={audioRef} 
                src={src} 
                onTimeUpdate={handleTimeUpdate} 
                onEnded={handleEnded}
                className="hidden" 
            />
        </div>
    );
};

export default function ChatWindow({
    selectedTicket,
    messages,
    onSendMessage,
    isChatDisabled,
    onBack,
    rating,
    className
}) {
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [newMessage, setNewMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    // 🎙 Audio States
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [recordDuration, setRecordDuration] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (filePreview) URL.revokeObjectURL(filePreview);
        };
    }, [filePreview]);

    const getInitials = (name) =>
        name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

    // ---------------- FILE PICK ----------------
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setRecordedAudio(null);
            
            // If it's an image, create a preview
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setFilePreview(url);
            } else {
                setFilePreview(null);
            }
        }
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ---------------- RECORD ----------------
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
                setRecordedAudio(file);
                clearInterval(timerRef.current);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordDuration(0);

            timerRef.current = setInterval(() => {
                setRecordDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Mic error:", err);
        }
    };

    const stopRecording = () => {
        if (!isRecording) return;
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const cancelRecording = () => {
        setRecordedAudio(null);
        setRecordDuration(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // ---------------- SEND ----------------
    const handleSend = () => {
        if (!newMessage.trim() && !selectedFile && !recordedAudio) return;

        const fileToSend = recordedAudio || selectedFile;
        onSendMessage(newMessage, fileToSend);

        setNewMessage("");
        setSelectedFile(null);
        setFilePreview(null);
        setRecordedAudio(null);
        setRecordDuration(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (!selectedTicket) return null;

    return (
        <div className={`flex-1 flex flex-col h-full bg-[#E4EBEF] ${className}`}>

            {/* HEADER */}
            <div className="h-16 bg-white border-b flex items-center px-4 justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="md:hidden p-2">
                        <ArrowLeft size={22} />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {getInitials(selectedTicket.customer?.name)}
                    </div>

                    <div>
                        <div className="font-bold">
                            {selectedTicket.customer?.name || "Customer"}
                        </div>
                        <div className="text-xs text-gray-500">
                            {selectedTicket.status === 'closed' ? 'Ticket Closed' : 'Online'}
                        </div>
                    </div>
                </div>

                <MoreVertical size={20} className="text-gray-400" />
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m, i) => {
                    const isMe = m.senderType === 'agent';
                    // Support various media properties
                    const isImage = m.type === 'image' || (m.mediaUrl && m.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) || m.image;
                    const isAudio = m.type === 'audio' || (m.mediaUrl && m.mediaUrl.match(/\.(webm|mp3|wav|ogg)$/i)) || m.audio;
                    const mediaUrl = m.mediaUrl || m.image || m.audio;

                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm text-sm
                                ${isMe ? 'bg-[#EEFFDE]' : 'bg-white'}`}>

                                {/* Image Rendering */}
                                {isImage && mediaUrl && (
                                    <div className="mb-2 rounded-lg overflow-hidden border border-gray-100">
                                        <img 
                                            src={mediaUrl} 
                                            alt="Shared media" 
                                            className="max-w-full h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                            onClick={() => window.open(mediaUrl, '_blank')}
                                        />
                                    </div>
                                )}

                                {/* Telegram-style Audio Player */}
                                {isAudio && mediaUrl && (
                                    <div className="mb-1">
                                        <TelegramAudioPlayer src={mediaUrl} duration={m.duration} />
                                    </div>
                                )}

                                {m.message && <div className="whitespace-pre-wrap">{m.message}</div>}

                                <div className="flex justify-end text-[11px] mt-1 text-gray-400">
                                    {new Date(m.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                    {isMe && (
                                        <span className="ml-1 text-green-600">
                                            {m.isRead ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="bg-white border-t p-3">

                {/* 🖼 IMAGE PREVIEW BEFORE SENDING */}
                {filePreview && (
                    <div className="relative inline-block mb-3 p-1 bg-gray-50 rounded-lg border border-gray-200">
                        <img src={filePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                        <button 
                            onClick={clearSelectedFile}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* 🎙 RECORDING BAR */}
                {isRecording && (
                    <div className="flex items-center justify-between bg-red-50 px-4 py-2 rounded-full">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-red-600 font-medium">
                                {formatTime(recordDuration)}
                            </span>
                        </div>

                        <button onClick={stopRecording} className="text-red-600">
                            <Square size={20} />
                        </button>
                    </div>
                )}

                {/* 🎧 PREVIEW */}
                {recordedAudio && !isRecording && (
                    <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full">
                        <button onClick={cancelRecording}>
                            <Trash2 size={18} className="text-red-500" />
                        </button>

                        <div className="flex-1">
                            <TelegramAudioPlayer 
                                src={URL.createObjectURL(recordedAudio)} 
                                duration={formatTime(recordDuration)} 
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            className="p-2 bg-indigo-500 text-white rounded-full"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                )}

                {/* NORMAL INPUT */}
                {!isRecording && !recordedAudio && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className={`p-2 rounded-full transition-colors ${selectedFile ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Paperclip size={20} />
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,audio/*"
                            hidden
                            onChange={handleFileSelect}
                        />

                        <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Message..."
                            className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
                        />

                        <button
                            onClick={startRecording}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <Mic size={22} />
                        </button>

                        <button
                            onClick={handleSend}
                            disabled={!newMessage.trim() && !selectedFile}
                            className={`p-2 rounded-full transition-all ${(!newMessage.trim() && !selectedFile) ? 'bg-gray-200 text-gray-400' : 'bg-indigo-500 text-white shadow-md'}`}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}


// import React, { useRef, useEffect, useState } from 'react'; 
// import { motion } from 'framer-motion';
// import { Send, ArrowLeft, Paperclip, MoreVertical, Mic, Trash2, Square } from 'lucide-react';
// import { formatChatDateHeader } from '../../../utils/dateUtils';

// export default function ChatWindow({
//     selectedTicket,
//     messages,
//     onSendMessage,
//     isChatDisabled,
//     onBack,
//     rating,
//     className
// }) {
//     const messagesEndRef = useRef(null);
//     const fileInputRef = useRef(null);

//     const [newMessage, setNewMessage] = useState("");
//     const [selectedFile, setSelectedFile] = useState(null);

//     // 🎙 Audio States
//     const [isRecording, setIsRecording] = useState(false);
//     const [recordedAudio, setRecordedAudio] = useState(null);
//     const [recordDuration, setRecordDuration] = useState(0);

//     const mediaRecorderRef = useRef(null);
//     const audioChunksRef = useRef([]);
//     const timerRef = useRef(null);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     const getInitials = (name) =>
//         name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

//     // ---------------- FILE PICK ----------------
//     const handleFileSelect = (e) => {
//         const file = e.target.files[0];
//         if (file) {
//             setSelectedFile(file);
//             setRecordedAudio(null);
//         }
//     };

//     // ---------------- RECORD ----------------
//     const startRecording = async () => {
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//             const mediaRecorder = new MediaRecorder(stream);

//             mediaRecorderRef.current = mediaRecorder;
//             audioChunksRef.current = [];

//             mediaRecorder.ondataavailable = (e) => {
//                 audioChunksRef.current.push(e.data);
//             };

//             mediaRecorder.onstop = () => {
//                 const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
//                 const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
//                 setRecordedAudio(file);
//                 clearInterval(timerRef.current);
//             };

//             mediaRecorder.start();
//             setIsRecording(true);
//             setRecordDuration(0);

//             timerRef.current = setInterval(() => {
//                 setRecordDuration(prev => prev + 1);
//             }, 1000);

//         } catch (err) {
//             console.error("Mic error:", err);
//         }
//     };

//     const stopRecording = () => {
//         if (!isRecording) return;
//         mediaRecorderRef.current?.stop();
//         setIsRecording(false);
//     };

//     const cancelRecording = () => {
//         setRecordedAudio(null);
//         setRecordDuration(0);
//     };

//     const formatTime = (seconds) => {
//         const mins = Math.floor(seconds / 60);
//         const secs = seconds % 60;
//         return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
//     };

//     // ---------------- SEND ----------------
//     const handleSend = () => {
//         if (!newMessage.trim() && !selectedFile && !recordedAudio) return;

//         const fileToSend = recordedAudio || selectedFile;
//         onSendMessage(newMessage, fileToSend);

//         setNewMessage("");
//         setSelectedFile(null);
//         setRecordedAudio(null);
//         setRecordDuration(0);
//     };

//     if (!selectedTicket) return null;

//     return (
//         <div className={`flex-1 flex flex-col h-full bg-[#E4EBEF] ${className}`}>

//             {/* HEADER */}
//             <div className="h-16 bg-white border-b flex items-center px-4 justify-between shadow-sm">
//                 <div className="flex items-center gap-3">
//                     <button onClick={onBack} className="md:hidden p-2">
//                         <ArrowLeft size={22} />
//                     </button>

//                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
//                         {getInitials(selectedTicket.customer?.name)}
//                     </div>

//                     <div>
//                         <div className="font-bold">
//                             {selectedTicket.customer?.name || "Customer"}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                             {selectedTicket.status === 'closed' ? 'Ticket Closed' : 'Online'}
//                         </div>
//                     </div>
//                 </div>

//                 <MoreVertical size={20} className="text-gray-400" />
//             </div>

//             {/* MESSAGES */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-2">
//                 {messages.map((m, i) => {
//                     const isMe = m.senderType === 'agent';
//                     const mediaUrl = m.mediaUrl || m.image || m.audio;

//                     return (
//                         <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
//                             <div className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm text-sm
//                                 ${isMe ? 'bg-[#EEFFDE]' : 'bg-white'}`}>

//                                 {mediaUrl && (
//                                     <audio controls src={mediaUrl} className="mb-1 w-full" />
//                                 )}

//                                 {m.message && <div>{m.message}</div>}

//                                 <div className="flex justify-end text-[11px] mt-1 text-gray-400">
//                                     {new Date(m.createdAt).toLocaleTimeString([], {
//                                         hour: '2-digit',
//                                         minute: '2-digit'
//                                     })}
//                                     {isMe && (
//                                         <span className="ml-1 text-green-600">
//                                             {m.isRead ? '✓✓' : '✓'}
//                                         </span>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     );
//                 })}
//                 <div ref={messagesEndRef} />
//             </div>

//             {/* INPUT AREA */}
//             <div className="bg-white border-t p-3">

//                 {/* 🎙 RECORDING BAR */}
//                 {isRecording && (
//                     <div className="flex items-center justify-between bg-red-50 px-4 py-2 rounded-full">
//                         <div className="flex items-center gap-2">
//                             <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
//                             <span className="text-red-600 font-medium">
//                                 {formatTime(recordDuration)}
//                             </span>
//                         </div>

//                         <button onClick={stopRecording} className="text-red-600">
//                             <Square size={20} />
//                         </button>
//                     </div>
//                 )}

//                 {/* 🎧 PREVIEW */}
//                 {recordedAudio && !isRecording && (
//                     <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full">
//                         <button onClick={cancelRecording}>
//                             <Trash2 size={18} className="text-red-500" />
//                         </button>

//                         <audio
//                             controls
//                             src={URL.createObjectURL(recordedAudio)}
//                             className="flex-1"
//                         />

//                         <span className="text-sm text-gray-500">
//                             {formatTime(recordDuration)}
//                         </span>

//                         <button
//                             onClick={handleSend}
//                             className="p-2 bg-indigo-500 text-white rounded-full"
//                         >
//                             <Send size={16} />
//                         </button>
//                     </div>
//                 )}

//                 {/* NORMAL INPUT */}
//                 {!isRecording && !recordedAudio && (
//                     <div className="flex items-center gap-2">
//                         <button onClick={() => fileInputRef.current.click()}>
//                             <Paperclip size={20} />
//                         </button>

//                         <input
//                             ref={fileInputRef}
//                             type="file"
//                             accept="image/*,audio/*"
//                             hidden
//                             onChange={handleFileSelect}
//                         />

//                         <input
//                             value={newMessage}
//                             onChange={(e) => setNewMessage(e.target.value)}
//                             placeholder="Message..."
//                             className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
//                         />

//                         <button
//                             onClick={startRecording}
//                             className="p-2 rounded-full text-gray-500"
//                         >
//                             <Mic size={22} />
//                         </button>

//                         <button
//                             onClick={handleSend}
//                             className="p-2 bg-indigo-500 text-white rounded-full"
//                         >
//                             <Send size={18} />
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }



// import React, { useRef, useEffect, useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Send, ArrowLeft, Paperclip, Smile, MoreVertical, Mic } from 'lucide-react';
// import { formatChatDateHeader } from '../../../utils/dateUtils';

// export default function ChatWindow({
//     selectedTicket,
//     messages,
//     onSendMessage,
//     isChatDisabled,
//     onBack,
//     rating,
//     className
// }) {
//     const messagesEndRef = useRef(null);
//     const fileInputRef = useRef(null);

//     const [newMessage, setNewMessage] = useState("");
//     const [selectedFile, setSelectedFile] = useState(null);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     if (!selectedTicket) {
//         return (
//             <div className={`flex-1 flex flex-col items-center justify-center bg-[#8E9CAA]/10 select-none ${className}`}>
//                 <div className="bg-white/50 p-4 rounded-full mb-4">
//                     <span className="text-4xl">👋</span>
//                 </div>
//                 <p className="text-gray-500 font-medium">Select a chat to start messaging</p>
//             </div>
//         );
//     }

//     const getInitials = (name) =>
//         name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

//     // ---------------- FILE PICK ----------------
//     const handleFileSelect = (e) => {
//         const file = e.target.files[0];
//         if (file) setSelectedFile(file);
//     };

//     // ---------------- SEND ----------------
//     const handleSend = () => {
//         if (!newMessage.trim() && !selectedFile) return;

//         onSendMessage(newMessage, selectedFile);

//         setNewMessage("");
//         setSelectedFile(null);
//     };

//     return (
//         <div className={`flex-1 flex flex-col h-full bg-[#E4EBEF] ${className}`}>

//             {/* Header */}
//             <div className="h-16 bg-white border-b flex items-center px-4 justify-between shadow-sm z-20 sticky top-0">
//                 <div className="flex items-center gap-3">
//                     <button onClick={onBack} className="md:hidden text-gray-500 hover:bg-gray-100 p-2 rounded-full -ml-2">
//                         <ArrowLeft size={24} />
//                     </button>

//                     <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
//                         ${selectedTicket.status === 'closed' ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
//                         {getInitials(selectedTicket.customer?.name)}
//                     </div>

//                     <div>
//                         <div className="font-bold text-gray-900 text-sm md:text-base">
//                             {selectedTicket.customer?.name || "Customer"}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                             {selectedTicket.status === 'closed' ? 'Ticket Closed' : 'Online'}
//                         </div>
//                     </div>
//                 </div>

//                 <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
//                     <MoreVertical size={20} />
//                 </button>
//             </div>

//             {/* Messages */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
//                 <div className="absolute inset-0 opacity-[0.4] bg-[url('https://web.telegram.org/img/bg_0.png')] pointer-events-none mix-blend-multiply opacity-5"></div>

//                 <div className="relative z-10 space-y-2">
//                     <AnimatePresence initial={false}>
//                         {messages.map((m, i) => {
//                             const isMe = m.senderType === 'agent';
//                             const prevM = messages[i - 1];
//                             const showDateHeader =
//                                 !prevM ||
//                                 new Date(m.createdAt).toDateString() !==
//                                 new Date(prevM.createdAt).toDateString();

//                             const mediaUrl = m.mediaUrl || m.image || m.audio;
//                             const isImage = m.mediaType === 'image' || m.image;
//                             const isAudio = m.mediaType === 'audio' || m.audio;

//                             return (
//                                 <React.Fragment key={m.id || m.createdAt || i}>
//                                     {showDateHeader && (
//                                         <div className="flex justify-center my-4 sticky top-2 z-10">
//                                             <span className="bg-gray-200/80 backdrop-blur text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm">
//                                                 {formatChatDateHeader(m.createdAt)}
//                                             </span>
//                                         </div>
//                                     )}

//                                     <motion.div
//                                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
//                                         animate={{ opacity: 1, y: 0, scale: 1 }}
//                                         className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
//                                     >
//                                         <div className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm relative text-[15px]
//                                             ${isMe ? 'bg-[#EEFFDE] rounded-br-none text-gray-900' : 'bg-white rounded-bl-none text-gray-900'}`}>

//                                             {mediaUrl && isImage && (
//                                                 <img
//                                                     src={mediaUrl}
//                                                     alt="attachment"
//                                                     className="rounded-lg mb-1 max-h-60 w-auto object-cover"
//                                                 />
//                                             )}

//                                             {mediaUrl && isAudio && (
//                                                 <audio
//                                                     controls
//                                                     src={mediaUrl}
//                                                     className="mb-1 w-full min-w-[200px]"
//                                                 />
//                                             )}

//                                             {m.message && (
//                                                 <div className="leading-snug break-words">
//                                                     {m.message}
//                                                 </div>
//                                             )}

//                                             <div className="flex items-center justify-end gap-1 mt-1 select-none">
//                                                 <span className={`text-[11px] ${isMe ? 'text-[#4fae4e]' : 'text-gray-400'}`}>
//                                                     {new Date(m.createdAt).toLocaleTimeString([], {
//                                                         hour: '2-digit',
//                                                         minute: '2-digit'
//                                                     })}
//                                                 </span>
//                                                 {isMe && (
//                                                     <span className="text-[12px] text-[#4fae4e]">
//                                                         {m.isRead ? '✓✓' : '✓'}
//                                                     </span>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </motion.div>
//                                 </React.Fragment>
//                             );
//                         })}
//                     </AnimatePresence>
//                     <div ref={messagesEndRef} />
//                 </div>
//             </div>

//             {/* Input */}
//             <div className="bg-white p-2 md:p-3 border-t flex items-end gap-2 z-20">
//                 {isChatDisabled ? (
//                     <div className="flex-1 p-3 bg-gray-50 text-gray-500 rounded-lg text-center font-medium">
//                         Conversation is closed.
//                     </div>
//                 ) : (
//                     <>
//                         {/* File picker */}
//                         <button
//                             onClick={() => fileInputRef.current.click()}
//                             className="p-3 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
//                         >
//                             <Paperclip size={24} />
//                         </button>

//                         <input
//                             ref={fileInputRef}
//                             type="file"
//                             accept="image/*,audio/*"
//                             hidden
//                             onChange={handleFileSelect}
//                         />

//                         {/* Selected File Preview */}
//                         {selectedFile && (
//                             <div className="absolute bottom-20 left-4 bg-white p-2 rounded-lg shadow-lg border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
//                                 <span className="text-xs font-bold text-indigo-600">
//                                     Using: {selectedFile.name?.substring(0, 10)}...
//                                 </span>
//                                 <button
//                                     onClick={() => setSelectedFile(null)}
//                                     className="text-red-500 hover:text-red-700"
//                                 >
//                                     ×
//                                 </button>
//                             </div>
//                         )}

//                         {/* Mic icon (NO FUNCTIONALITY) */}
//                         <motion.button
//                             whileTap={{ scale: 0.95 }}
//                             className="p-3 rounded-full text-gray-400 cursor-default"
//                         >
//                             <Mic size={24} />
//                         </motion.button>

//                         <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2">
//                             <input
//                                 value={newMessage}
//                                 onChange={(e) => setNewMessage(e.target.value)}
//                                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//                                 placeholder="Message..."
//                                 className="flex-1 bg-transparent outline-none text-gray-900"
//                             />
//                             <Smile
//                                 size={22}
//                                 className="text-gray-400 hover:text-gray-600 hidden sm:block cursor-pointer"
//                             />
//                         </div>

//                         <motion.button
//                             whileTap={{ scale: 0.9 }}
//                             onClick={handleSend}
//                             disabled={!newMessage.trim() && !selectedFile}
//                             className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-md disabled:bg-gray-300 disabled:shadow-none transition-all"
//                         >
//                             <Send
//                                 size={24}
//                                 className={!newMessage && !selectedFile ? "opacity-50" : ""}
//                             />
//                         </motion.button>
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// }