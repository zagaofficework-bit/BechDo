import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello 👋 How can I help you?" },
  ]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef(null);

  const sendMessage = () => {
    const trimmed = input.trim();

    if (!trimmed) return;

    if (trimmed.length > 500) {
      toast.error("Message too long (max 500 chars)");
      return;
    }

    const userMessage = { from: "user", text: trimmed };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { from: "bot", text: "Typing..." },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          from: "bot",
          text: "Thanks for your message! Our team will contact you soon.",
        },
      ]);
    }, 800);

    setInput("");
  };
  // ✅ Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full 
        bg-gradient-to-tr from-[#1132d4] to-[#2a4bff] text-white 
        shadow-lg flex items-center justify-center 
        hover:scale-110 transition-all duration-300"
      >
        <FontAwesomeIcon icon={faComments} />
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 
        backdrop-blur-xl bg-white/80 border border-white/40 
        rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 
          bg-gradient-to-r from-[#1132d4] to-[#2a4bff] text-white"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                🤖
              </div>
              <div>
                <p className="text-sm font-semibold">Phonify Support</p>
                <p className="text-[10px] opacity-80">Online now</p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 max-h-80 overflow-y-auto space-y-3 bg-blue-50/40 scrollbar-thin scrollbar-thumb-blue-300">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`inline-block max-w-[70%] px-3 py-2 text-sm rounded-2xl shadow-sm break-words ${
                    msg.from === "user"
                      ? "bg-gradient-to-r from-[#1132d4] to-[#2a4bff] text-white"
                      : "bg-white border border-gray-200 text-gray-700"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* 👇 Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white flex items-center gap-2">
            <input
              maxLength={500}
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 text-sm rounded-full bg-gray-100 
              focus:outline-none focus:ring-2 focus:ring-[#1132d4]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-full 
              bg-gradient-to-tr from-[#1132d4] to-[#2a4bff] 
              text-white flex items-center justify-center 
              hover:scale-110 transition"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
