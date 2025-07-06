/**
 * UI Components Main Orchestrator - REFACTORED
 * Da 400+ righe → 80 righe pulite
 */

import {
  getJSConfig,
  getUIConfig,
  isDevelopmentMode,
  devLog,
} from "../config.js";
import { useChatState } from "./hooks/use-chat-state.js";
import { useChatAPI } from "./hooks/use-chat-api.js";
import { ChatTrigger } from "./chat-trigger.js";
import { ChatHeader } from "./chat-header.js";
import { MessageList } from "./message-list.js";
import { ChatInput } from "./chat-input.js";

/**
 * Helper per costruire nomi di classi CSS dinamicamente
 */
function buildClassName(baseClass, modifiers = {}) {
  const classes = [baseClass];

  Object.entries(modifiers).forEach(([modifier, condition]) => {
    if (condition) {
      classes.push(modifier);
    }
  });

  return classes.join(" ");
}

/**
 * Componente VeronicaChatbot principale - REFACTORED
 * RIDOTTO da 400+ righe a ~80 righe
 */
export function VeronicaChatbot() {
  // ===== CONFIGURAZIONE =====
  const config = React.useMemo(() => {
    const jsConfig = getJSConfig();
    const uiConfig = getUIConfig();

    if (!jsConfig.apiUrl) {
      console.error("❌ Cannot initialize chatbot without valid API URL");
      return null;
    }

    return { ...jsConfig, ...uiConfig };
  }, []);

  // ===== STATE MANAGEMENT =====
  const state = useChatState();
  const { sendMessage, handleSubmit } = useChatAPI(state, config);

  // ===== REFS =====
  const messagesEndRef = React.useRef(null);

  // ===== UI HANDLERS =====
  const toggleOpen = React.useCallback(() => {
    state.updateUIState({ isOpen: !state.uiState.isOpen, isMinimized: false });
  }, [state.uiState.isOpen, state.updateUIState]);

  const toggleMinimize = React.useCallback(() => {
    state.updateUIState({ isMinimized: !state.uiState.isMinimized });
  }, [state.uiState.isMinimized, state.updateUIState]);

  const closeChat = React.useCallback(() => {
    state.updateUIState({ isOpen: false, isMinimized: false });
  }, [state.updateUIState]);

  // ===== EFFECTS =====

  // Auto-scroll effect
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
        devLog(`💭 Bentornato! Ultima attività ${hours} ore fa`);
      }
    }
  }, [state.uiState.isOpen, state.messages.length, state.session.lastActivity]);

  // ===== RENDER =====

  // Se non abbiamo config valida, mostra errore
  if (!config) {
    return React.createElement(
      "div",
      { className: "veronica-chatbot-error-container" },
      "❌ Chatbot: URL API non configurato"
    );
  }

  return React.createElement(
    "div",
    {
      className: buildClassName("veronica-chatbot-container", {
        "theme-dark": config.theme === "dark",
      }),
    },
    [
      // Trigger button
      !state.uiState.isOpen &&
        React.createElement(ChatTrigger, {
          key: "trigger",
          onClick: toggleOpen,
          theme: config.theme,
        }),

      // Chat window
      state.uiState.isOpen &&
        React.createElement(
          "div",
          {
            key: "chat",
            className: buildClassName("veronica-chatbot-window", {
              "theme-dark": config.theme === "dark",
              minimized: state.uiState.isMinimized,
              "position-left": config.position === "bottom-left",
            }),
          },
          [
            // Header
            React.createElement(ChatHeader, {
              key: "header",
              config,
              messages: state.messages,
              isMinimized: state.uiState.isMinimized,
              onToggleMinimize: toggleMinimize,
              onClose: closeChat,
              onReset: state.resetConversation,
            }),

            // Messages area
            !state.uiState.isMinimized &&
              React.createElement(MessageList, {
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
                onSubmit: handleSubmit,
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
