import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSend(value);
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        {/* Loading indicator */}
        {isLoading && (
          <div className="chat-input-loading">
            <div className="spinner" />
            <span>Searching AniList...</span>
          </div>
        )}

        {/* Input field */}
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <div className="chat-input-field-wrapper">
            <div className="halftone-overlay" />
            <input
              ref={inputRef}
              className="chat-input-field"
              type="text"
              placeholder="Ask about any anime or manga..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!value.trim() || isLoading}
              aria-label="Send message"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                send
              </span>
            </button>
          </div>
        </form>

        <p className="chat-input-disclaimer">
          AniAsk can make mistakes. Verify important info.
        </p>
      </div>
    </div>
  );
}
