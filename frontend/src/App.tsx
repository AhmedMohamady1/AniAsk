import { useEffect, useRef } from "react";
import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import { useChat } from "./hooks/useChat";

export default function App() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <div className="app-layout">
      <Sidebar onNewChat={clearMessages} />

      <main className="main-content">
        <div className="chat-canvas">
          {hasMessages ? (
            <div className="chat-thread">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={chatEndRef} />
            </div>
          ) : (
            <WelcomeScreen onSuggestionClick={sendMessage} />
          )}
        </div>

        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}
