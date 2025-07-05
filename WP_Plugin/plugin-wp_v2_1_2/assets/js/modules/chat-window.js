/**
 * Veronica Chatbot - Chat Window Module
 * Componente principale che assembla tutti gli altri
 */

import { useChatState, useUIConfig } from "./ui-state.js";
import { useChatHandlers } from "./ui-handlers.js";
import {
  ChatTrigger,
  ChatHeader,
  ChatMessages,
  ChatInput,
} from "./ui-components.js";

// =====================================
// COMPONENTE CHATBOT PRINCIPALE
// =====================================

export function VeronicaChatbot() {
  // State management
  const state = useChatState();
  const config = useUIConfig();

  // Event handlers
  const handlers = useChatHandlers(state, config);

  // Auto-scroll effect
  const messagesEndRef = React.useRef(null);
  React.useEffect(() => {
    if (
      messagesEndRef.current &&
      state.uiState.isOpen &&
      !state.uiState.isMinimized
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.messages, state.uiState.isOpen, state.uiState.isMinimized]);

  // Welcome back effect
  React.useEffect(() => {
    if (state.messages.length > 0 && state.uiState.isOpen) {
      const now = Date.now();
      const lastActivity = now - state.session.lastActivity;

      if (lastActivity > 60 * 60 * 1000) {
        // > 1 ora
        const hours = Math.round(lastActivity / (1000 * 60 * 60));
        console.log(`💭 Bentornato! Ultima attività ${hours} ore fa`);
      }
    }
  }, [state.uiState.isOpen, state.messages.length, state.session.lastActivity]);

  // Se non abbiamo config valida, mostra errore
  if (!config) {
    return React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#fee2e2",
          color: "#dc2626",
          padding: "12px",
          borderRadius: "8px",
          fontSize: "12px",
          zIndex: 999999,
        },
      },
      "❌ Chatbot: URL API non configurato"
    );
  }

  // ===== RENDER PRINCIPALE =====
  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        bottom: window.innerWidth <= 768 ? "20px" : "20px",
        right:
          window.innerWidth <= 768
            ? "auto"
            : config.position === "bottom-left"
            ? "auto"
            : "20px",
        left:
          window.innerWidth <= 768
            ? "20px"
            : config.position === "bottom-left"
            ? "20px"
            : "auto",
        zIndex: 999999,
      },
    },
    [
      // Trigger button
      !state.uiState.isOpen &&
        React.createElement(ChatTrigger, {
          key: "trigger",
          onClick: handlers.toggleOpen,
        }),

      // Chat window
      state.uiState.isOpen &&
        React.createElement(
          "div",
          {
            key: "chat",
            style: {
              width: window.innerWidth <= 768 ? "calc(100vw - 40px)" : "380px",
              maxWidth: "400px",
              height: state.uiState.isMinimized
                ? "60px"
                : window.innerWidth <= 768
                ? "70vh"
                : "500px",
              backgroundColor: config.theme === "dark" ? "#1f2937" : "white",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transition: "height 0.3s ease",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
          },
          [
            // Header
            React.createElement(ChatHeader, {
              key: "header",
              config,
              messages: state.messages,
              isMinimized: state.uiState.isMinimized,
              onToggleMinimize: handlers.toggleMinimize,
              onClose: handlers.closeChat,
              onReset: handlers.resetConversation,
            }),

            // Messages area
            !state.uiState.isMinimized &&
              React.createElement(ChatMessages, {
                key: "messages",
                messages: state.messages,
                config,
                isLoading: state.isLoading,
                messagesEndRef,
              }),

            // Input area
            !state.uiState.isMinimized &&
              React.createElement(ChatInput, {
                key: "input",
                inputValue: state.inputValue,
                setInputValue: state.setInputValue,
                onSubmit: handlers.handleSubmit,
                isLoading: state.isLoading,
                error: state.error,
                setError: state.setError,
                config,
              }),
          ]
        ),
    ]
  );
}
