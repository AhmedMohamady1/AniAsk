import { useCallback, useEffect, useRef } from "react";
import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import { useChat } from "./hooks/useChat";
import { useConversations } from "./hooks/useConversations";

export default function App() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    loadConversation,
    saveMessage,
    deleteConversation,
    searchConversations,
    generateTitle,
    startNewChat,
  } = useConversations();

  const { messages, isLoading, sendMessage, clearMessages, setExistingMessages } =
    useChat({
      activeConversationId,
      createConversation,
      saveMessage,
      generateTitle,
    });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = useCallback(() => {
    clearMessages();
    startNewChat();
  }, [clearMessages, startNewChat]);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      const msgs = await loadConversation(id);
      setExistingMessages(msgs);
    },
    [loadConversation, setExistingMessages]
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      // If we deleted the active conversation, clear the chat
      if (id === activeConversationId) {
        clearMessages();
      }
    },
    [deleteConversation, activeConversationId, clearMessages]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="app-layout">
      <Sidebar
        onNewChat={handleNewChat}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onSearch={searchConversations}
      />

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

