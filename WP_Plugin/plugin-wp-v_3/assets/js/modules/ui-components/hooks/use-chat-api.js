/**
 * useChatAPI Hook - Logic API e Communication
 * Estratto da ui-components.js
 */

import { sanitizeInput } from "../security.js";
import { isDevelopmentMode, devLog } from "../config.js";

/**
 * Hook per gestire comunicazione API
 */
export function useChatAPI(state, config) {
  const {
    addMessage,
    storageManager,
    session,
    setIsLoading,
    setError,
    setInputValue,
    isLoading,
  } = state;

  // ===== GESTIONE CHAT API =====
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
        devLog("🔗 API Request:", {
          messageLength: sanitizedMessage.length,
          hasThreadId: !!session.sessionId,
        });

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

        devLog("✅ API Response received:", {
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text();
          devLog("❌ API Error Response:", errorText);
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}\n${errorText}`
          );
        }

        const data = await response.json();
        devLog("✅ API Response data received");

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
        devLog("❌ Error Details:", {
          name: error.name,
          message: error.message,
        });

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
      config?.apiUrl,
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
      sendMessage(state.inputValue);
    },
    [sendMessage, state.inputValue]
  );

  return {
    sendMessage,
    handleSubmit,
  };
}
