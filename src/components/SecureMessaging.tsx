import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Send, 
  Image, 
  Clock, 
  CheckCheck, 
  User, 
  PhoneCall, 
  Video,
  ChevronRight,
  Smile,
  Paperclip,
  Activity
} from "lucide-react";
import { DashboardState, saveState } from "../data";
import { Message, Conversation } from "../types";

interface SecureMessagingProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
}

export default function SecureMessaging({ state, onChangeState }: SecureMessagingProps) {
  const { messages, conversations, activeUserRole } = state;

  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || "conv_doc_1");
  const [typedMessage, setTypedMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const filteredMessages = messages.filter((msg) => msg.conversationId === activeConvId);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((c) => {
    return c.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.doctorSpecialty.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeConvId, isTyping]);

  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: activeConvId,
      senderId: "pat_1",
      senderRole: "patient",
      text: typedMessage.trim(),
      timestamp: new Date().toISOString(),
      read: true
    };

    // Update conversation snippet
    const updatedConversations = conversations.map((c) => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessageText: typedMessage.trim(),
          lastMessageTime: new Date().toISOString()
        };
      }
      return c;
    });

    const updatedState = {
      ...state,
      messages: [...state.messages, newMsg],
      conversations: updatedConversations
    };

    onChangeState(updatedState);
    saveState(updatedState);
    setTypedMessage("");

    // SIMULATED AUTOMATED RESPONSE TYPING!
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      const doctorReplyText = getDoctorReply(typedMessage, activeConversation.doctorName);
      const replyMsg: Message = {
        id: `msg_reply_${Date.now()}`,
        conversationId: activeConvId,
        senderId: activeConversation.doctorId,
        senderRole: "doctor",
        text: doctorReplyText,
        timestamp: new Date().toISOString(),
        read: false
      };

      // Add notify alert
      const replyNotif = {
        id: `not_reply_${Date.now()}`,
        type: "message" as const,
        title: `Message from ${activeConversation.doctorName}`,
        body: doctorReplyText,
        timestamp: new Date().toISOString(),
        read: false
      };

      const finalState = {
        ...state,
        messages: [...updatedState.messages, replyMsg],
        conversations: updatedConversations.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              lastMessageText: doctorReplyText,
              lastMessageTime: new Date().toISOString(),
              unreadCount: c.unreadCount + 1
            };
          }
          return c;
        }),
        notifications: [replyNotif, ...updatedState.notifications]
      };

      onChangeState(finalState);
      saveState(finalState);
    }, 2500);
  };

  // Pre-configured simulation answers for natural conversations!
  const getDoctorReply = (prompt: string, doctorName: string) => {
    const text = prompt.toLowerCase();
    if (text.includes("refill") || text.includes("prescription")) {
      return `Hello, this is ${doctorName}. I received your refill query. I have initiated the pharmacy benefits verification. You should receive a pickup text from Walgreens within a few hours.`;
    }
    if (text.includes("bp") || text.includes("blood pressure") || text.includes("vitals")) {
      return `Thank you for sharing your daily vital logs. Your parameters are well within your personal target thresholds. Keep up the consistent morning logs, they are highly valuable.`;
    }
    if (text.includes("hello") || text.includes("hi")) {
      return `Hello Sarah! I hope you are feeling well today. Let me know if you need to review any of your recent lab panel results or adjust schedule timings.`;
    }
    return `Thank you for reaching out. I have flagged your message for clinical review and will consult with the medical team. We will check in on your upcoming scheduled visit, or follow up earlier if urgent.`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4" id="secure-messaging-portal">
      <div className="grid grid-cols-1 md:grid-cols-12 border border-natural-border rounded-[28px] overflow-hidden shadow-xl bg-white h-[600px]">
        
        {/* LEFT PANEL: Conversation lists */}
        <div className="md:col-span-4 border-r border-natural-border flex flex-col h-full bg-natural-beige/10">
          
          <div className="p-4 border-b border-natural-border bg-white space-y-3 shrink-0">
            <span className="font-serif font-extrabold text-sm text-natural-dark-sage tracking-tight block text-left">Clinical Messaging</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-natural-muted" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-natural-bg border border-natural-border rounded-lg text-xs outline-none focus:bg-white focus:border-natural-sage transition-all text-left text-natural-dark-sage font-bold"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-natural-border-light">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-natural-muted text-xs">No active conversations found</div>
            ) : (
              filteredConversations.map((conv) => {
                const active = conv.id === activeConvId;
                return (
                  <div 
                    key={conv.id} 
                    onClick={() => {
                      setActiveConvId(conv.id);
                      // Clear unread count on click
                      const clearedConversations = conversations.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c);
                      onChangeState({ ...state, conversations: clearedConversations });
                    }}
                    className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors text-left ${
                      active ? "bg-natural-beige/25 border-l-4 border-natural-sage" : "hover:bg-natural-bg/30"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-natural-border-light">
                      <img src={conv.doctorAvatar} alt={conv.doctorName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5 text-xs text-natural-text">
                      <div className="flex justify-between items-start">
                        <span className="font-serif font-bold text-natural-dark-sage block truncate">{conv.doctorName}</span>
                        <span className="text-[9px] text-natural-muted font-bold">{conv.lastMessageTime.split("T")[1]?.slice(0, 5) || ""}</span>
                      </div>
                      <span className="text-[10px] text-natural-sage font-bold block">{conv.doctorSpecialty}</span>
                      <p className="text-[11px] text-natural-muted truncate leading-tight font-medium">{conv.lastMessageText}</p>
                      {conv.unreadCount > 0 && (
                        <span className="inline-block bg-natural-terracotta text-white font-bold text-[9px] px-2 py-0.5 rounded-full mt-1">
                          {conv.unreadCount} New
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Chat Thread */}
        <div className="md:col-span-8 flex flex-col h-full bg-white text-xs text-natural-text">
          {activeConversation ? (
            <>
              {/* Header Info */}
              <div className="p-4 border-b border-natural-border flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center space-x-3 text-left">
                  <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-natural-border-light">
                    <img src={activeConversation.doctorAvatar} alt={activeConversation.doctorName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-natural-dark-sage text-xs block leading-tight">{activeConversation.doctorName}</span>
                    <div className="flex items-center space-x-1.5 text-[10px] text-natural-muted mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-natural-sage" />
                      <span className="font-bold">{activeConversation.doctorResponseTime || "Usually responds in 1 hour"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => alert(`Dialing secure clinical line for ${activeConversation.doctorName}...`)}
                    className="p-2 hover:bg-natural-bg border border-natural-border hover:border-natural-sage rounded-lg text-natural-muted hover:text-natural-dark-sage transition-colors cursor-pointer"
                  >
                    <PhoneCall className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    onClick={() => alert(`Pre-booking secure video call with ${activeConversation.doctorName}...`)}
                    className="p-2 hover:bg-natural-bg border border-natural-border hover:border-natural-sage rounded-lg text-natural-muted hover:text-natural-dark-sage transition-colors cursor-pointer"
                  >
                    <Video className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-natural-bg/10">
                {filteredMessages.map((msg) => {
                  const isPatient = msg.senderRole === "patient";
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isPatient ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-2xl text-left space-y-1 shadow-xs ${
                        isPatient 
                          ? "bg-natural-dark-sage text-white rounded-tr-none" 
                          : "bg-white text-natural-text rounded-tl-none border border-natural-border"
                      }`}>
                        <p className="text-xs leading-relaxed">{msg.text}</p>
                        <div className="flex justify-end items-center space-x-1 text-[9px] opacity-60">
                          <span>{msg.timestamp.split("T")[1]?.slice(0, 5) || ""}</span>
                          {isPatient && <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Simulated typing bubble */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-natural-text border border-natural-border p-3 rounded-2xl rounded-tl-none shadow-xs space-y-1">
                      <div className="flex space-x-1 items-center py-1">
                        <div className="h-1.5 w-1.5 bg-natural-sage rounded-full animate-bounce" />
                        <div className="h-1.5 w-1.5 bg-natural-sage rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="h-1.5 w-1.5 bg-natural-sage rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[9px] text-natural-muted block font-bold">{activeConversation.doctorName} is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Chat Controls */}
              <div className="p-3.5 border-t border-natural-border bg-white shrink-0 flex items-center space-x-2">
                <button 
                  onClick={() => alert("Simulating local image capture... JPG attached.")}
                  className="p-2 hover:bg-natural-beige rounded-lg text-natural-muted hover:text-natural-sage transition-colors cursor-pointer"
                  title="Attach screenshot/photo"
                >
                  <Image className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => alert("Simulating document attach...")}
                  className="p-2 hover:bg-natural-beige rounded-lg text-natural-muted hover:text-natural-sage transition-colors cursor-pointer"
                  title="Attach records file"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                
                <input 
                  type="text" 
                  placeholder="Type secure clinical message..." 
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 px-4 py-2 bg-natural-bg border border-natural-border rounded-xl text-xs outline-none focus:bg-white focus:border-natural-sage transition-all text-left text-natural-dark-sage font-bold"
                />

                <button 
                  onClick={handleSendMessage}
                  disabled={!typedMessage.trim()}
                  className="p-2.5 bg-natural-sage hover:bg-natural-dark-sage disabled:opacity-50 text-white rounded-xl shadow-md shadow-natural-sage/10 transition-colors cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5 fill-white stroke-none" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-natural-muted text-center space-y-2">
              <span className="font-serif font-bold text-natural-dark-sage block text-base">Select a Conversation</span>
              <p className="text-[10px] text-natural-muted max-w-xs mx-auto">Choose a specialist clinical staff member on the left panel to trigger HIPAA-encrypted dialogue.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
