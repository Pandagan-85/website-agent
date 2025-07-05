/**
 * Veronica Chatbot - UI Handlers Module
 * Event handlers e business logic
 */

import { CHATBOT_CONFIG } from "./config.js";
import { sanitizeInput } from "./security.js";

// =====================================
// CUSTOM HOOKS PER EVENT HANDLERS
// =====================================

/**
 * Hook principale per tutti gli event handlers
 */
export function useChatHandlers(state, config) {
  const {
    storageManager,
    session,
    setSession,
    messages,
    setMessages,
    uiState,
    setUIState,
    inputValue,
    setInputValue,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = state;

  // ===== PERSISTENZA UI STATE =====
  const updateUIState = React.useCallback(
    (newState) => {
      const updatedState = { ...uiState, ...newState };
      setUIState(updatedState);
      storageManager.saveUIState(updatedState);
    },
    [uiState, setUIState, storageManager]
  );

  // ===== GESTIONE MESSAGGI =====
  const addMessage = React.useCallback(
    (message) => {
      const sanitizedMessage = {
        ...message,
        content:
          message.sender === "user"
            ? sanitizeInput(message.content)
            : message.content, // Bot messages NON vengono sanitizzati
        id:
          message.id ||
          `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: message.timestamp || Date.now(),
      };

      const newMessage = storageManager.addMessage(sanitizedMessage);
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    [storageManager, setMessages]
  );

  // ===== GESTIONE CHAT =====
  const sendMessage = React.useCallback(
    async (message) => {
      if (!message.trim() || isLoading) return;

      const sanitizedMessage = sanitizeInput(message);
      if (sanitizedMessage.includes("[CONTENUTO BLOCCATO]")) {
        setError("Messaggio non valido. Riprova.");
        return;
      }

      setIsLoading(true);
      setError("");

      // Aggiungi messaggio utente
      addMessage({
        type: "user",
        content: sanitizedMessage,
        sender: "user",
      });

      try {
        storageManager.updateSessionActivity();

        // Debug sicuro
        if (
          window.location.hostname === "localhost" ||
          window.location.hostname.includes("dev")
        ) {
          console.group("🔗 API Request Debug (dev only)");
          console.log("Message length:", sanitizedMessage.length);
          console.log("Has Thread ID:", !!session.sessionId);
          console.log("Request timestamp:", new Date().toISOString());
          console.groupEnd();
        }

        const requestBody = {
          message: sanitizedMessage,
          thread_id: session.sessionId,
        };

        const response = await fetch(config.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(CHATBOT_CONFIG.API.TIMEOUT),
        });

        // Debug response
        if (
          window.location.hostname === "localhost" ||
          window.location.hostname.includes("dev")
        ) {
          console.log("✅ API Response received (dev):", {
            status: response.status,
            ok: response.ok,
          });
        } else {
          console.log("✅ API Response received");
        }

        if (!response.ok) {
          const errorText = await response.text();
          if (
            window.location.hostname === "localhost" ||
            window.location.hostname.includes("dev")
          ) {
            console.error("❌ API Error Response (dev):", errorText);
          } else {
            console.error("❌ API Error:", response.status);
          }
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}\n${errorText}`
          );
        }

        const data = await response.json();
        if (
          window.location.hostname === "localhost" ||
          window.location.hostname.includes("dev")
        ) {
          console.log("✅ API Response data (dev):", data);
        } else {
          console.log("✅ API Response received");
        }

        // Aggiungi risposta bot
        addMessage({
          type: "bot",
          content:
            data.response ||
            data.message ||
            "Mi dispiace, non ho ricevuto una risposta valida.",
          sender: "bot",
        });
      } catch (error) {
        // Debug errori
        if (
          window.location.hostname === "localhost" ||
          window.location.hostname.includes("dev")
        ) {
          console.group("❌ Error Details (dev)");
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.groupEnd();
        } else {
          console.error("❌ Connection error occurred");
        }

        // Gestione errori specifica
        let errorMessage = "Ops! Qualcosa è andato storto.";

        if (error.name === "TimeoutError" || error.name === "AbortError") {
          errorMessage =
            "⏱️ Timeout: la richiesta ha impiegato troppo tempo. Il server potrebbe essere lento.";
        } else if (error.name === "TypeError") {
          if (error.message.includes("fetch")) {
            errorMessage = `🌐 Errore di rete: ${error.message}. Verifica la connessione e l'URL API.`;
          } else if (error.message.includes("JSON")) {
            errorMessage =
              "📄 Il server ha restituito una risposta non valida (non JSON).";
          } else if (error.message.includes("CORS")) {
            errorMessage =
              "🔒 Errore CORS: il server non permette richieste da questo dominio.";
          } else {
            errorMessage = `🔧 Errore tecnico: ${error.message}`;
          }
        } else if (error.message.includes("HTTP")) {
          if (error.message.includes("404")) {
            errorMessage =
              "🔍 Endpoint non trovato (404). Verifica l'URL API nelle impostazioni.";
          } else if (error.message.includes("500")) {
            errorMessage =
              "⚠️ Errore interno del server (500). Il backend ha un problema.";
          } else if (error.message.includes("403")) {
            errorMessage =
              "🚫 Accesso negato (403). Problema di autenticazione.";
          } else {
            errorMessage = `🔗 Errore server: ${error.message}`;
          }
        } else {
          errorMessage = `⚠️ Errore imprevisto: ${error.message}`;
        }

        addMessage({
          type: "bot",
          content: errorMessage,
          sender: "bot",
          isError: true,
        });
      } finally {
        setIsLoading(false);
        setInputValue("");
      }
    },
    [
      isLoading,
      config.apiUrl,
      session.sessionId,
      storageManager,
      addMessage,
      setIsLoading,
      setError,
      setInputValue,
    ]
  );

  // ===== GESTIONE FORM =====
  const handleSubmit = React.useCallback(
    (e) => {
      e.preventDefault();
      sendMessage(inputValue);
    },
    [sendMessage, inputValue]
  );

  // ===== CONTROLLI UI =====
  const toggleOpen = React.useCallback(() => {
    updateUIState({ isOpen: !uiState.isOpen, isMinimized: false });
  }, [uiState.isOpen, updateUIState]);

  const toggleMinimize = React.useCallback(() => {
    updateUIState({ isMinimized: !uiState.isMinimized });
  }, [uiState.isMinimized, updateUIState]);

  const closeChat = React.useCallback(() => {
    updateUIState({ isOpen: false, isMinimized: false });
  }, [updateUIState]);

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
      console.log("🔄 Conversazione resettata");
    }
  }, [storageManager, setSession, setMessages]);

  return {
    sendMessage,
    addMessage,
    updateUIState,
    handleSubmit,
    toggleOpen,
    toggleMinimize,
    closeChat,
    resetConversation,
  };
}
