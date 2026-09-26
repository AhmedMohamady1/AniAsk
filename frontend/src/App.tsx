import { useCallback, useEffect, useRef, useState } from "react";
import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";
import HomePage from "./components/HomePage";
import MyListPage from "./components/MyListPage";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import { useChat } from "./hooks/useChat";
import { useConversations } from "./hooks/useConversations";
import type { PageTab } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<PageTab>("home");

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

  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    setExistingMessages,
  } = useChat({
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

  // Ask AI about a specific anime from Home or My List
  const handleAskAI = useCallback(
    (animeTitle: string) => {
      setActiveTab("chatbot");
      sendMessage(`Tell me about "${animeTitle}" and why I should watch it.`);
    },
    [sendMessage]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="app-root">
      {/* Global Top Navigation Bar on every page */}
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main App Body */}
      <div className="app-body">
        {/* Home Page Tab */}
        <div
          className="tab-panel tab-panel--home"
          style={{ display: activeTab === "home" ? "block" : "none" }}
        >
          <HomePage
            onAskAI={handleAskAI}
            onNavigateToChat={() => setActiveTab("chatbot")}
          />
        </div>

        {/* Chatbot Tab */}
        <div
          className="tab-panel tab-panel--chatbot"
          style={{ display: activeTab === "chatbot" ? "flex" : "none" }}
        >
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
        </div>

        {/* My List Tab */}
        <div
          className="tab-panel tab-panel--mylist"
          style={{ display: activeTab === "mylist" ? "block" : "none" }}
        >
          <MyListPage
            onNavigateHome={() => setActiveTab("home")}
            onNavigateToChat={() => setActiveTab("chatbot")}
          />
        </div>
      </div>
    </div>
  );
}
