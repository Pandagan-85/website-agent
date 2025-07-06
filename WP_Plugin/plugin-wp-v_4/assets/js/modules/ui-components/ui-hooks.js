/**
 * Custom React Hooks - Con filtro ripetizione introduzione
 * NUOVO: Rimuove l'introduzione ripetitiva dalle risposte bot
 */

import {
  sanitizeInput,
  validateInputSecure,
  logSecurityEvent,
} from "../security.js";
import { isDevelopmentMode, devLog } from "../config.js";

/**
 * Rimuove l'introduzione ripetitiva dalle risposte bot
 */
function cleanBotResponse(content, isFirstMessage = false) {
  if (!content || typeof content !== "string") return content;

  // Pattern per riconoscere l'introduzione
  const introPatterns = [
    /^👋\s*Ciao!\s*Sono\s+l['']assistente\s+AI\s+di\s+Veronica\s+Schembri[^.]*\.\s*/i,
    /^Ciao!\s*Sono\s+l['']assistente\s+AI\s+di\s+Veronica\s+Schembri[^.]*\.\s*/i,
    /^Sono\s+l['']assistente\s+AI\s+di\s+Veronica\s+Schembri[^.]*\.\s*/i,
    /^👋[^.]*Veronica\s+Schembri[^.]*\.\s*/i,
  ];

  // Se è il primo messaggio, mantieni l'introduzione
  if (isFirstMessage) {
    return content;
  }

  // Altrimenti, rimuovi l'introduzione
  let cleanedContent = content;
  for (const pattern of introPatterns) {
    cleanedContent = cleanedContent.replace(pattern, "");
  }

  // Rimuovi spazi extra all'inizio
  cleanedContent = cleanedContent.trim();

  // Se dopo la pulizia il contenuto è vuoto, usa quello originale
  return cleanedContent || content;
}

/**
 * Hook per gestione stato UI (open, minimized, etc.)
 */
export function useUIState(storageManager) {
  // Stato UI con persistenza
  const [uiState, setUIState] = React.useState(() =>
    storageManager.loadUIState()
  );

  // Funzione per aggiornare stato UI
  const updateUIState = React.useCallback(
    (newState) => {
      const updatedState = { ...uiState, ...newState };
      setUIState(updatedState);
      storageManager.saveUIState(updatedState);
    },
    [uiState, storageManager]
  );

  // Controlli UI specifici
  const toggleOpen = React.useCallback(() => {
    updateUIState({ isOpen: !uiState.isOpen, isMinimized: false });
  }, [uiState.isOpen, updateUIState]);

  const toggleMinimize = React.useCallback(() => {
    updateUIState({ isMinimized: !uiState.isMinimized });
  }, [uiState.isMinimized, updateUIState]);

  const closeChat = React.useCallback(() => {
    updateUIState({ isOpen: false, isMinimized: false });
  }, [updateUIState]);

  return {
    uiState,
    updateUIState,
    toggleOpen,
    toggleMinimize,
    closeChat,
  };
}

/**
 * Hook per gestione sessione chat
 */
export function useChatSession(storageManager) {
  const [session, setSession] = React.useState(() =>
    storageManager.getOrCreateSession()
  );

  const resetSession = React.useCallback(() => {
    const newSession = storageManager.resetSession();
    setSession(newSession);
    return newSession;
  }, [storageManager]);

  const updateSessionActivity = React.useCallback(() => {
    storageManager.updateSessionActivity();
    setSession(storageManager.getOrCreateSession());
  }, [storageManager]);

  return {
    session,
    resetSession,
    updateSessionActivity,
  };
}

/**
 * Hook per gestione messaggi e invio
 * NUOVO: Con filtro introduzione ripetitiva
 */
export function useMessageHandling(storageManager, session, config) {
  // Messaggi con persistenza
  const [messages, setMessages] = React.useState(() =>
    storageManager.loadMessages()
  );

  // Stato chat
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Funzione per aggiungere messaggio
  const addMessage = React.useCallback(
    (message) => {
      if (isDevelopmentMode()) {
        devLog("📝 addMessage chiamato con:", message);
      }

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

      if (isDevelopmentMode()) {
        devLog("📝 Messaggio sanitizzato:", sanitizedMessage);
      }

      // Prima aggiorna lo stato React, poi salva nello storage
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, sanitizedMessage];

        if (isDevelopmentMode()) {
          devLog("📝 Aggiornando state con:", newMessages.length, "messaggi");
        }

        // Salva nel storage in modo asincrono
        try {
          storageManager.addMessage(sanitizedMessage);
        } catch (error) {
          console.error("❌ Errore salvataggio messaggio:", error);
        }

        return newMessages;
      });

      return sanitizedMessage;
    },
    [storageManager]
  );

  // Funzione per inviare messaggio
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

      if (isDevelopmentMode()) {
        devLog("📤 Inviando messaggio utente:", sanitizedMessage);
      }

      // Aggiungi messaggio utente
      addMessage({
        type: "user",
        content: sanitizedMessage,
        sender: "user",
      });

      try {
        storageManager.updateSessionActivity();

        // Debug sicuro
        if (isDevelopmentMode()) {
          devLog("🔗 API Request Debug:", {
            messageLength: sanitizedMessage.length,
            hasThreadId: !!session.sessionId,
            timestamp: new Date().toISOString(),
          });
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
          signal: AbortSignal.timeout(30000), // 30 secondi timeout
        });

        if (isDevelopmentMode()) {
          devLog("✅ API Response received:", {
            status: response.status,
            ok: response.ok,
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          if (isDevelopmentMode()) {
            console.error("❌ API Error Response:", errorText);
          }
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}\n${errorText}`
          );
        }

        const data = await response.json();
        if (isDevelopmentMode()) {
          devLog("✅ API Response data:", data);
        }

        // NUOVO: Controlla se è il primo messaggio bot e pulisci la risposta
        const isFirstBotMessage =
          messages.filter((msg) => msg.sender === "bot").length === 0;
        const rawResponse =
          data.response ||
          data.message ||
          "Mi dispiace, non ho ricevuto una risposta valida.";
        const cleanedResponse = cleanBotResponse(
          rawResponse,
          isFirstBotMessage
        );

        if (isDevelopmentMode()) {
          devLog("🧹 Risposta pulita:", {
            isFirstBotMessage,
            originalLength: rawResponse.length,
            cleanedLength: cleanedResponse.length,
            wasFiltered: rawResponse !== cleanedResponse,
          });
        }

        // Aggiungi risposta bot pulita
        addMessage({
          type: "bot",
          content: cleanedResponse,
          sender: "bot",
        });

        if (isDevelopmentMode()) {
          devLog("📤 Messaggio bot aggiunto");
        }
      } catch (error) {
        // Debug errori
        if (isDevelopmentMode()) {
          console.group("❌ Error Details");
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.groupEnd();
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
      }
    },
    [
      isLoading,
      config?.apiUrl,
      session.sessionId,
      storageManager,
      addMessage,
      messages,
    ]
  );

  // Reset messaggi completo
  const resetMessages = React.useCallback(() => {
    setMessages([]);
    setError("");
    storageManager.saveMessages([]);
    storageManager.clearMessages?.(); // Se il metodo esiste

    if (isDevelopmentMode()) {
      devLog("🧹 Messaggi resettati completamente");
    }
  }, [storageManager]);

  // Debug dello stato messages
  React.useEffect(() => {
    if (isDevelopmentMode()) {
      devLog("📊 Stato messages aggiornato:", {
        count: messages.length,
        lastMessage: messages[messages.length - 1],
      });
    }
  }, [messages]);

  return {
    messages,
    setMessages,
    addMessage,
    sendMessage,
    resetMessages,
    isLoading,
    error,
    setError,
  };
}

/**
 * Hook per welcome back effect
 */
export function useWelcomeBack(messages, session, uiState) {
  React.useEffect(() => {
    if (messages.length > 0 && uiState.isOpen) {
      const now = Date.now();
      const lastActivity = now - session.lastActivity;

      if (lastActivity > 60 * 60 * 1000) {
        // > 1 ora
        const hours = Math.round(lastActivity / (1000 * 60 * 60));
        devLog(`💭 Bentornato! Ultima attività: ${hours}h fa`);
      }
    }
  }, [messages.length, uiState.isOpen, session.lastActivity]);
}

/**
 * Hook per auto-cleanup sessioni vecchie
 */
export function useSessionCleanup(storageManager) {
  React.useEffect(() => {
    const cleanup = () => {
      try {
        storageManager.cleanupOldSessions?.();
      } catch (error) {
        console.warn("⚠️ Errore pulizia sessioni:", error);
      }
    };

    // Cleanup immediato
    cleanup();

    // Cleanup periodico (ogni 5 minuti)
    const interval = setInterval(cleanup, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [storageManager]);
}

/**
 * Hook per gestione shortcuts da tastiera
 */
export function useKeyboardShortcuts(onToggle, onClose, onReset) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Shift + C = Toggle chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        onToggle();
      }

      // Escape = Close chat
      if (e.key === "Escape") {
        onClose();
      }

      // Ctrl/Cmd + Shift + R = Reset chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "R") {
        e.preventDefault();
        onReset();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onToggle, onClose, onReset]);
}
