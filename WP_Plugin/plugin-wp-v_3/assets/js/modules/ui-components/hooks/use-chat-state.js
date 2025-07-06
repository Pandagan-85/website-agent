/**
 * useChatState Hook - State Management Centralizzato
 * Estratto da ui-components.js
 */

import { getJSConfig, isDevelopmentMode, devLog } from "../config.js";
import { ChatStorageManager } from "../storage.js";

/**
 * Hook principale per gestire tutto lo stato del chatbot
 */
export function useChatState() {
  // Storage manager
  const [storageManager] = React.useState(() => new ChatStorageManager());

  // Stato sessione
  const [session, setSession] = React.useState(() =>
    storageManager.getOrCreateSession()
  );

  // Stato UI con persistenza
  const [uiState, setUIState] = React.useState(() =>
    storageManager.loadUIState()
  );

  // Messaggi con persistenza
  const [messages, setMessages] = React.useState(() =>
    storageManager.loadMessages()
  );

  // Stato chat
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // ===== PERSISTENZA UI STATE =====
  const updateUIState = React.useCallback(
    (newState) => {
      const updatedState = { ...uiState, ...newState };
      setUIState(updatedState);
      storageManager.saveUIState(updatedState);
    },
    [uiState, storageManager]
  );

  // ===== GESTIONE MESSAGGI =====
  const addMessage = React.useCallback(
    (message) => {
      const newMessage = storageManager.addMessage({
        ...message,
        id:
          message.id ||
          `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: message.timestamp || Date.now(),
      });
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    [storageManager]
  );

  // ===== RESET CONVERSAZIONE =====
  const resetConversation = React.useCallback(() => {
    if (
      confirm(
        "Vuoi iniziare una nuova conversazione? La cronologia attuale andrà persa."
      )
    ) {
      const newSession = storageManager.resetSession();
      setSession(newSession);
      setMessages([]);
      devLog("🔄 Conversazione resettata");
    }
  }, [storageManager]);

  return {
    // Storage
    storageManager,

    // Session
    session,
    setSession,

    // UI State
    uiState,
    setUIState,
    updateUIState,

    // Messages
    messages,
    setMessages,
    addMessage,

    // Input
    inputValue,
    setInputValue,

    // Loading & Error
    isLoading,
    setIsLoading,
    error,
    setError,

    // Actions
    resetConversation,
  };
}
