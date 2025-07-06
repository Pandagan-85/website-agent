/**
 * UI Components Module - Componente React Principale (Versione Finale)
 * Estratto da chatbot.js originale (righe 751-1500 circa)
 * AGGIORNATO: Usa classi CSS invece di stili inline
 */

import {
  getJSConfig,
  getUIConfig,
  isDevelopmentMode,
  devLog,
} from "./config.js";
import { ChatStorageManager } from "./storage.js";
import {
  sanitizeInput,
  validateInputSecure,
  logSecurityEvent,
} from "./security.js";
import {
  renderMessageContent,
  formatBotMessageSafely,
  cleanContentForDisplay,
} from "./formatting.js";

// =====================================
// UTILITY FUNCTIONS
// =====================================

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

// =====================================
// COMPONENTE REACT PRINCIPALE
// =====================================

/**
 * Componente VeronicaChatbot principale
 * AGGIORNATO: Usa classi CSS dal file chatbot-styles.css
 */
export function VeronicaChatbot() {
  // Configurazione
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

  // Ref per auto-scroll
  const messagesEndRef = React.useRef(null);

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
    [storageManager]
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
        if (isDevelopmentMode()) {
          console.group("❌ Error Details");
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.groupEnd();
        }

        // Gestione errori specifica (estratta dal codice originale)
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
    [isLoading, config?.apiUrl, session.sessionId, storageManager, addMessage]
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
      devLog("🔄 Conversazione resettata");
    }
  }, [storageManager]);

  // ===== EFFECTS =====

  // Auto-scroll effect
  React.useEffect(() => {
    if (messagesEndRef.current && uiState.isOpen && !uiState.isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, uiState.isOpen, uiState.isMinimized]);

  // Welcome back effect (estratto dal codice originale)
  React.useEffect(() => {
    if (messages.length > 0 && uiState.isOpen) {
      const now = Date.now();
      const lastActivity = now - session.lastActivity;

      if (lastActivity > 60 * 60 * 1000) {
        // > 1 ora
        const hours = Math.round(lastActivity / (1000 * 60 * 60));
        devLog(`💭 Bentornato! Ultima attività ${hours} ore fa`);
      }
    }
  }, [uiState.isOpen, messages.length, session.lastActivity]);

  // ===== RENDER CON CLASSI CSS =====

  // Se non abbiamo config valida, mostra errore
  if (!config) {
    return React.createElement(
      "div",
      {
        className: "veronica-chatbot-error-container",
      },
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
      !uiState.isOpen &&
        React.createElement(
          "button",
          {
            key: "trigger",
            onClick: toggleOpen,
            className: "veronica-chatbot-trigger",
            "aria-label": "Apri chat con Veronica",
          },
          "💬"
        ),

      // Chat window
      uiState.isOpen &&
        React.createElement(
          "div",
          {
            key: "chat",
            className: buildClassName("veronica-chatbot-window", {
              "theme-dark": config.theme === "dark",
              minimized: uiState.isMinimized,
              "position-left": config.position === "bottom-left",
            }),
          },
          [
            // Header
            React.createElement(
              "div",
              {
                key: "header",
                className: buildClassName("veronica-chatbot-header", {
                  "theme-dark": config.theme === "dark",
                  minimized: uiState.isMinimized,
                }),
              },
              [
                React.createElement(
                  "div",
                  {
                    key: "header-info",
                    className: "veronica-chatbot-header-info",
                  },
                  [
                    React.createElement(
                      "span",
                      {
                        key: "avatar",
                        className: "veronica-chatbot-header-avatar",
                      },
                      "🐼"
                    ),
                    !uiState.isMinimized &&
                      React.createElement(
                        "div",
                        {
                          key: "header-text",
                          className: "veronica-chatbot-header-text",
                        },
                        [
                          React.createElement(
                            "div",
                            {
                              key: "name",
                              className: "veronica-chatbot-header-name",
                            },
                            "Veronica Schembri AI Chatbot"
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "status",
                              className: "veronica-chatbot-header-status",
                            },
                            `Online • ${messages.length} messaggi`
                          ),
                        ]
                      ),
                  ]
                ),
                React.createElement(
                  "div",
                  {
                    key: "header-controls",
                    className: "veronica-chatbot-header-controls",
                  },
                  [
                    // Reset button
                    messages.length > 0 &&
                      !uiState.isMinimized &&
                      React.createElement(
                        "button",
                        {
                          key: "reset",
                          onClick: resetConversation,
                          className: buildClassName(
                            "veronica-chatbot-header-btn",
                            {
                              "theme-dark": config.theme === "dark",
                            }
                          ),
                          title: "Nuova conversazione",
                          "aria-label": "Inizia nuova conversazione",
                        },
                        "🔄"
                      ),
                    // Minimize button
                    React.createElement(
                      "button",
                      {
                        key: "minimize",
                        onClick: toggleMinimize,
                        className: buildClassName(
                          "veronica-chatbot-header-btn",
                          {
                            "theme-dark": config.theme === "dark",
                          }
                        ),
                        "aria-label": uiState.isMinimized
                          ? "Espandi chat"
                          : "Minimizza chat",
                      },
                      uiState.isMinimized ? "🔼" : "🔽"
                    ),
                    // Close button
                    React.createElement(
                      "button",
                      {
                        key: "close",
                        onClick: closeChat,
                        className: buildClassName(
                          "veronica-chatbot-header-btn",
                          {
                            "theme-dark": config.theme === "dark",
                          }
                        ),
                        "aria-label": "Chiudi chat",
                      },
                      "✕"
                    ),
                  ]
                ),
              ]
            ),

            // Messages area
            !uiState.isMinimized &&
              React.createElement(
                "div",
                {
                  key: "messages",
                  className: "veronica-chatbot-messages",
                },
                [
                  // Welcome message se nessun messaggio
                  messages.length === 0 &&
                    React.createElement(
                      "div",
                      {
                        key: "welcome",
                        className: buildClassName("veronica-chatbot-welcome", {
                          "theme-dark": config.theme === "dark",
                        }),
                      },
                      [
                        React.createElement(
                          "div",
                          {
                            key: "emoji",
                            className: "veronica-chatbot-welcome-emoji",
                          },
                          "👋"
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "text",
                          },
                          "Ciao! Sono l'assistente AI di Veronica Schembri. Come posso aiutarti oggi?"
                        ),
                      ]
                    ),

                  // Lista messaggi
                  ...messages.map((msg, index) =>
                    React.createElement(
                      "div",
                      {
                        key: msg.id || `msg-${index}`,
                        className: `veronica-chatbot-message ${msg.sender}`,
                      },
                      React.createElement(
                        "div",
                        {
                          className: buildClassName(
                            "veronica-chatbot-message-content",
                            {
                              [msg.sender]: true,
                              "theme-dark": config.theme === "dark",
                              error: msg.isError,
                            }
                          ),
                          dangerouslySetInnerHTML:
                            msg.sender === "bot"
                              ? {
                                  __html: formatBotMessageSafely(msg.content),
                                }
                              : undefined,
                        },
                        msg.sender === "user" ? msg.content : undefined
                      )
                    )
                  ),

                  // Loading indicator
                  isLoading &&
                    React.createElement(
                      "div",
                      {
                        key: "loading",
                        className: "veronica-chatbot-typing",
                      },
                      React.createElement(
                        "div",
                        {
                          className: buildClassName(
                            "veronica-chatbot-typing-content",
                            {
                              "theme-dark": config.theme === "dark",
                            }
                          ),
                        },
                        "L'assistente AI di Veronica sta scrivendo..."
                      )
                    ),

                  // Auto-scroll target
                  React.createElement("div", {
                    key: "scroll-target",
                    ref: messagesEndRef,
                  }),
                ]
              ),

            // Input area
            !uiState.isMinimized &&
              React.createElement(
                "form",
                {
                  key: "input-form",
                  onSubmit: handleSubmit,
                  className: buildClassName("veronica-chatbot-input-form", {
                    "theme-dark": config.theme === "dark",
                  }),
                },
                React.createElement(
                  "div",
                  {
                    className: "veronica-chatbot-input-container",
                  },
                  [
                    React.createElement("textarea", {
                      key: "input",
                      value: inputValue,
                      onChange: (e) => {
                        setInputValue(e.target.value);
                        setError("");
                      },
                      placeholder: error || "Scrivi un messaggio...",
                      disabled: isLoading,
                      rows: 1,
                      className: buildClassName("veronica-chatbot-input", {
                        "theme-dark": config.theme === "dark",
                        error: !!error,
                      }),
                      onKeyDown: (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      },
                      "aria-label": "Scrivi il tuo messaggio",
                    }),
                    React.createElement(
                      "button",
                      {
                        key: "submit",
                        type: "submit",
                        disabled:
                          !inputValue.trim() ||
                          isLoading ||
                          inputValue.length > 1000 ||
                          error,
                        className: "veronica-chatbot-submit",
                        "aria-label": "Invia messaggio",
                      },
                      isLoading ? "..." : "Invia"
                    ),
                  ]
                )
              ),
          ]
        ),
    ]
  );
}
