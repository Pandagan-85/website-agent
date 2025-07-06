/**
 * Chatbot Component - Componente React Principale
 * VERSIONE COMPLETA FUNZIONANTE: Tutto integrato e corretto
 */

import {
  getJSConfig,
  getUIConfig,
  isDevelopmentMode,
  devLog,
} from "../config.js";
import { ChatStorageManager } from "../storage.js";
import { MessageList } from "./message-list.js";
import { InputForm } from "./input-form.js";
import { useUIState, useMessageHandling, useChatSession } from "./ui-hooks.js";
import { buildClassName } from "./ui-utils.js";

/**
 * Componente VeronicaChatbot principale
 * VERSIONE DEFINITIVA: Tutti i problemi risolti
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

    return {
      ...jsConfig,
      ...uiConfig,
    };
  }, []);

  // ===== STORAGE MANAGER =====
  const [storageManager] = React.useState(() => new ChatStorageManager());

  // ===== CUSTOM HOOKS =====
  const { session, resetSession } = useChatSession(storageManager);
  const { uiState, updateUIState, toggleOpen, toggleMinimize, closeChat } =
    useUIState(storageManager);
  const {
    messages,
    setMessages,
    addMessage,
    sendMessage,
    resetMessages,
    isLoading,
    error,
    setError,
  } = useMessageHandling(storageManager, session, config);

  // ===== EARLY RETURN SE CONFIGURAZIONE NON VALIDA =====
  if (!config) {
    return React.createElement(
      "div",
      {
        className: "veronica-chatbot-error",
        style: {
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#fee2e2",
          color: "#dc2626",
          padding: "12px",
          borderRadius: "8px",
          fontSize: "14px",
          zIndex: 10000,
        },
      },
      "❌ Chatbot configuration error"
    );
  }

  // ===== RESET CONVERSAZIONE COMPLETO =====
  const handleResetConversation = React.useCallback(() => {
    if (
      confirm(
        "Vuoi iniziare una nuova conversazione? La cronologia attuale andrà persa."
      )
    ) {
      // Reset completo e immediato
      setMessages([]);
      resetMessages();
      resetSession();
      setError("");

      devLog("🔄 Conversazione resettata completamente");
    }
  }, [setMessages, resetMessages, resetSession, setError]);

  // ===== DEBUG: Verifica che sendMessage funzioni =====
  const handleSendMessage = React.useCallback(
    (message) => {
      if (isDevelopmentMode()) {
        devLog("📝 Invio messaggio:", message);
      }
      sendMessage(message);
    },
    [sendMessage]
  );

  // ===== RENDER =====
  return React.createElement(
    React.Fragment,
    null,

    // ===== FLOATING BUTTON =====
    !uiState.isOpen &&
      React.createElement(
        "button",
        {
          className: buildClassName("veronica-chatbot-trigger", {
            "position-left": config.position === "bottom-left",
          }),
          onClick: toggleOpen,
          "aria-label": "Apri chat con Veronica",
        },
        React.createElement(
          "svg",
          {
            width: "24",
            height: "24",
            viewBox: "0 0 24 24",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
          },
          React.createElement("path", {
            d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
          })
        )
      ),

    // ===== MAIN CHAT WINDOW =====
    uiState.isOpen &&
      React.createElement(
        "div",
        {
          className: buildClassName("veronica-chatbot-window", {
            "theme-dark": config.theme === "dark",
            minimized: uiState.isMinimized,
            "position-left": config.position === "bottom-left",
          }),
        },

        // ===== HEADER =====
        React.createElement(
          "div",
          {
            className: buildClassName("veronica-chatbot-header", {
              "theme-dark": config.theme === "dark",
              minimized: uiState.isMinimized,
            }),
          },
          React.createElement(
            "div",
            { className: "veronica-chatbot-header-info" },
            React.createElement(
              "span",
              { className: "veronica-chatbot-header-avatar" },
              "🐼"
            ),
            !uiState.isMinimized &&
              React.createElement(
                "div",
                { className: "veronica-chatbot-header-text" },
                React.createElement(
                  "div",
                  { className: "veronica-chatbot-header-name" },
                  "Veronica Assistente AI"
                ),
                React.createElement(
                  "div",
                  { className: "veronica-chatbot-header-status" },
                  `Online • ${messages.length} messaggi`
                )
              )
          ),
          React.createElement(
            "div",
            { className: "veronica-chatbot-header-controls" },
            React.createElement(
              "button",
              {
                className: buildClassName("veronica-chatbot-header-btn", {
                  "theme-dark": config.theme === "dark",
                }),
                onClick: toggleMinimize,
                "aria-label": uiState.isMinimized ? "Espandi" : "Minimizza",
              },
              uiState.isMinimized ? "⬆️" : "⬇️"
            ),
            React.createElement(
              "button",
              {
                className: buildClassName("veronica-chatbot-header-btn", {
                  "theme-dark": config.theme === "dark",
                }),
                onClick: handleResetConversation,
                "aria-label": "Reset conversazione",
                title: "Nuova conversazione",
              },
              "🔄"
            ),
            React.createElement(
              "button",
              {
                className: buildClassName("veronica-chatbot-header-btn", {
                  "theme-dark": config.theme === "dark",
                }),
                onClick: closeChat,
                "aria-label": "Chiudi chat",
              },
              "✖️"
            )
          )
        ),

        // ===== MESSAGES AREA =====
        !uiState.isMinimized &&
          React.createElement(MessageList, {
            messages,
            isLoading,
            error,
            theme: config.theme,
          }),

        // ===== INPUT FORM =====
        !uiState.isMinimized &&
          React.createElement(InputForm, {
            onSendMessage: handleSendMessage, // ← Usa la funzione con debug
            isLoading,
            theme: config.theme,
          })
      )
  );
}
