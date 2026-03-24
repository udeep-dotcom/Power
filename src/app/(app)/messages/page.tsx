"use client";
import TopBar from "@/components/layout/TopBar";
import { messages, chatMessages, currentUser } from "@/lib/data";
import { getInitials } from "@/lib/utils";
import { Send, Search, ArrowLeft, Users } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function MessagesPage() {
  const [selected, setSelected] = useState<typeof messages[0] | null>(null);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState(chatMessages);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const send = () => {
    if (!input.trim()) return;
    setChat(prev => [...prev, { id: Date.now(), sender: "Me", text: input.trim(), time: "Now", isMe: true }]);
    setInput("");
    // Simulate reply
    setTimeout(() => {
      setChat(prev => [...prev, { id: Date.now() + 1, sender: selected?.user || "", text: "Thanks for the message! 💪", time: "Now", isMe: false }]);
    }, 1500);
  };

  if (selected) {
    return (
      <div className="animate-fade-in flex flex-col h-screen">
        {/* Header */}
        <div className="bg-[#111111] border-b border-[#1f1f1f] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xs font-bold">
            {selected.isGroup ? <Users className="w-3.5 h-3.5" /> : getInitials(selected.user)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{selected.user}</p>
            <p className="text-xs text-green-400">{selected.online ? "Online" : "Last seen today"}</p>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-20">
          {chat.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.isMe ? "flex-row-reverse" : ""}`}>
              {!msg.isMe && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-xs font-bold shrink-0">
                  {getInitials(msg.sender)}
                </div>
              )}
              <div className={`max-w-xs ${msg.isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                  msg.isMe
                    ? "bg-green-500/20 border border-green-500/30 text-white rounded-tr-none"
                    : "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-200 rounded-tl-none"
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-600">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-[#0a0a0a] border-t border-[#1f1f1f] px-4 py-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="flex-1 bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/40"
          />
          <button onClick={send} className="w-10 h-10 btn-primary rounded-xl flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Messages" />
      <div className="px-4 lg:px-6 py-5 max-w-2xl mx-auto">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            placeholder="Search messages..."
            className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/40"
          />
        </div>

        {/* Conversation list */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
          {messages.map((msg, i) => (
            <button
              key={msg.id}
              onClick={() => setSelected(msg)}
              className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-[#161616] transition-colors text-left ${i > 0 ? "border-t border-[#1a1a1a]" : ""}`}
            >
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-sm font-bold">
                  {msg.isGroup ? <Users className="w-4 h-4" /> : getInitials(msg.user)}
                </div>
                {msg.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111111]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-white truncate">{msg.user}</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{msg.time}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{msg.lastMessage}</p>
              </div>
              {msg.unread > 0 && (
                <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {msg.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* New conversation */}
        <button className="w-full mt-4 border border-dashed border-green-500/30 rounded-xl py-3 text-sm text-green-400 hover:bg-green-500/5 transition-colors font-medium flex items-center justify-center gap-2">
          + New Message
        </button>
      </div>
    </div>
  );
}
