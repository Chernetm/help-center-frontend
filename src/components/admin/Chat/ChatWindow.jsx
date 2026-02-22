import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Paperclip, MoreVertical, Mic, Trash2, Square, Play, Pause, Image as ImageIcon, X } from 'lucide-react';
import { formatChatDateHeader } from '../../../utils/dateUtils';

// --- Helper Components ---

const TelegramAudioPlayer = ({ src, duration }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
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
        setCurrentTime(current);
        if (total) {
            setProgress((current / total) * 100);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
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
                    <span>{formatTime(currentTime)}</span>
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
    const [previewAudioUrl, setPreviewAudioUrl] = useState(null);
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
            if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
        };
    }, [filePreview, previewAudioUrl]);

    // Update preview URL when recorded audio changes
    useEffect(() => {
        if (recordedAudio) {
            const url = URL.createObjectURL(recordedAudio);
            setPreviewAudioUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewAudioUrl(null);
        }
    }, [recordedAudio]);

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
                    const isImage = m.mediaType === 'image' || m.type === 'image' || (m.mediaUrl && m.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) || m.image;
                    const isAudio = m.mediaType === 'audio' || m.type === 'audio' || (m.mediaUrl && m.mediaUrl.match(/\.(webm|mp3|wav|ogg)$/i)) || m.audio;
                    const mediaUrl = m.mediaUrl || m.image || m.audio;

                    return (
                        <div key={m.id || m.createdAt || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm text-[15px]
                                ${isMe ? 'bg-[#EEFFDE] rounded-br-none' : 'bg-white rounded-bl-none'} text-gray-900`}>

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
                                        <TelegramAudioPlayer src={mediaUrl} duration={m.audioDuration || m.duration} />
                                    </div>
                                )}

                                {m.message && <div className="leading-snug break-words whitespace-pre-wrap">{m.message}</div>}

                                <div className={`flex items-center justify-end gap-1 mt-1 select-none text-[11px] ${isMe ? 'text-[#4fae4e]' : 'text-gray-400'}`}>
                                    {new Date(m.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                    {isMe && (
                                        <span className="ml-1 text-xs">
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
                    <div className="flex items-center justify-between bg-red-50 px-4 py-2 rounded-full mb-1">
                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
                            <span className="text-red-600 font-bold tracking-tight">{formatTime(recordDuration)}</span>
                            <span className="text-red-400 text-xs font-medium">Recording voice message...</span>
                        </div>
                        <button onClick={stopRecording} className="text-red-600 p-2 hover:bg-red-100 rounded-full transition-colors">
                            <Square size={20} fill="currentColor" />
                        </button>
                    </div>
                )}

                {/* 🎧 PREVIEW */}
                {recordedAudio && !isRecording && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl mb-1 border border-gray-100">
                        <button onClick={cancelRecording} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 size={20} />
                        </button>
                        <div className="flex-1">
                            {previewAudioUrl && (
                                <TelegramAudioPlayer
                                    src={previewAudioUrl}
                                    duration={formatTime(recordDuration)}
                                />
                            )}
                        </div>
                        <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95">
                            <Send size={18} fill="currentColor" />
                        </button>
                    </div>
                )}

                {/* NORMAL INPUT */}
                {!isRecording && !recordedAudio && (
                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className={`p-2.5 rounded-full transition-all ${selectedFile ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <Paperclip size={24} />
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,audio/*"
                            hidden
                            onChange={handleFileSelect}
                        />

                        <div className="flex-1 relative">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Message..."
                                rows="1"
                                className="w-full bg-gray-100 rounded-[20px] px-4 py-2.5 outline-none text-gray-900 border border-transparent focus:border-indigo-200 focus:bg-white transition-all resize-none max-h-32 min-h-[44px]"
                                style={{ height: 'auto' }}
                                ref={(el) => {
                                    if (el) {
                                        el.style.height = 'auto';
                                        el.style.height = el.scrollHeight + 'px';
                                    }
                                }}
                            />
                        </div>

                        <div className="flex items-center self-end pb-0.5">
                            {!newMessage.trim() && !selectedFile ? (
                                <button
                                    onClick={startRecording}
                                    className="p-2.5 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                >
                                    <Mic size={24} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSend}
                                    className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send size={18} fill="currentColor" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
