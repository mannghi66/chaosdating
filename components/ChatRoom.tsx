
import React, { useState, useEffect, useRef } from 'react';
// Session type is not exported in some versions of @supabase/supabase-js
type Session = any;
import { Profile } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

interface ChatRoomProps {
  match: Profile;
  session: Session;
  onBack: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ match, session, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load persistent chat history on mount
  useEffect(() => {
    const storageKey = `chat_${session.user.id}_${match.id}`;
    const savedMessages = localStorage.getItem(storageKey);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }
  }, [match.id, session.user.id]);

  // Save persistent chat history on change
  useEffect(() => {
    const storageKey = `chat_${session.user.id}_${match.id}`;
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, match.id, session.user.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateAIResponse = async (userMessage: string, history: Message[]) => {
    // Khởi tạo AI ngay trước khi dùng để đảm bảo lấy đúng API_KEY từ môi trường
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables.");
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    setIsTyping(true);

    // Format lịch sử trò chuyện để model hiểu ngữ cảnh
    const recentHistory = history.slice(-6).map(msg => {
      const sender = msg.senderId === session.user.id ? 'User' : match.username;
      return `${sender}: ${msg.text}`;
    }).join('\n');

    const systemInstruction = `
      You are roleplaying as a user on a dating app called "chaosdating".
      Persona:
      - Username: ${match.username}
      - Bio: ${match.bio || 'A mysterious person looking for fun.'}
      - Interests: ${(match.interests || []).join(', ') || 'Surprises, chatting, life.'}

      CRITICAL RULES:
      1. Always stay in character as ${match.username}.
      2. Respond briefly (max 20 words).
      3. Be flirty, quirky, and Gen-Z friendly.
      4. Respond in the same language as the user (Vietnamese if they speak Vietnamese).
      5. Do not use generic assistant prefixes like "As an AI...".
    `;

    const prompt = `
      Current Chat Context:
      ${recentHistory}

      Write the next message from ${match.username} to the User.
    `;

    try {
      // Giả lập độ trễ để tăng cảm giác thật
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.9,
          topP: 0.95,
        }
      });

      const aiText = response.text?.trim() || "Hmm, I'm thinking of something clever to say... 😉";

      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: match.id,
        text: aiText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Chat AI error:", error);
      // Fallback message nếu lỗi API
      const fallbackMsg: Message = {
        id: Date.now().toString(),
        senderId: match.id,
        text: "Mạng của tớ hơi lag một chút, tớ sẽ rep cậu sau nhé! 💌",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      senderId: session.user.id,
      text: inputValue.trim(),
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    
    generateAIResponse(userMsg.text, newHistory);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <header className="bg-white border-b border-pink-100 p-4 flex items-center gap-4 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-pink-50 rounded-full transition-colors text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={match.avatar_url || `https://api.dicebear.com/8.x/adventurer/svg?seed=${match.username}`} 
              alt={match.username} 
              className="w-10 h-10 rounded-full border-2 border-pink-200"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className="font-black text-gray-800 tracking-tight">{match.username}</h2>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Active Now</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-pink-50/30">
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-50">
             <div className="text-4xl mb-2">✨</div>
             <p className="text-sm font-medium">It's a Match! Don't be shy, say something!</p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.senderId === session.user.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div 
                className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-pink-100'
                }`}
              >
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                <span className={`text-[9px] block mt-1 opacity-70 ${isMe ? 'text-white' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-pink-100 shadow-sm flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-pink-100 pb-8 sm:pb-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-pink-50/50 border border-secondary/30 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim()}
            className="bg-primary text-white p-3 rounded-full shadow-lg shadow-pink-200 hover:bg-pink-600 disabled:bg-pink-300 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatRoom;
