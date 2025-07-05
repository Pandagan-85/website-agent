/**
 * Veronica Chatbot - UI State Module
 * State management e configurazione UI
 */

import { getValidAPIEndpoint } from "./config.js";
import { ChatStorageManager } from "./storage.js";

// =====================================
// CUSTOM HOOKS PER STATE MANAGEMENT
// =====================================

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

  return {
    storageManager,
    session,
    setSession,
    uiState,
    setUIState,
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    setIsLoading,
    error,
    setError,
  };
}

/**
 * Hook per configurazione UI
 */
export function useUIConfig() {
  return React.useMemo(() => {
    const apiUrl = getValidAPIEndpoint();

    if (!apiUrl) {
      console.error("❌ Cannot initialize chatbot without valid API URL");
      return null;
    }

    return {
      theme: window.veronicaChatbotConfig?.theme || "light",
      position: window.veronicaChatbotConfig?.position || "bottom-right",
      apiUrl: apiUrl,
    };
  }, []);
}

/**
 * Hook per gestire persistenza UI state
 */
export function useUIStatePersistence(uiState, setUIState, storageManager) {
  const updateUIState = React.useCallback(
    (newState) => {
      const updatedState = { ...uiState, ...newState };
      setUIState(updatedState);
      storageManager.saveUIState(updatedState);
    },
    [uiState, setUIState, storageManager]
  );

  return { updateUIState };
}
