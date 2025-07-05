/**
 * Veronica Schembri Chatbot Frontend - Persistenza Completa
 * Gestione sessioni e cronologia chat persistenti tra pagine
 */

(function () {
  "use strict";

  // =====================================
  // CONFIGURAZIONE E COSTANTI
  // =====================================

  const CHATBOT_CONFIG = {
    SESSION_DURATION: 7 * 24 * 60 * 60 * 1000,
    CONVERSATION_TIMEOUT: 24 * 60 * 60 * 1000,
    MAX_MESSAGES: 100,
    STORAGE_KEYS: {
      SESSION: "veronica_chatbot_session",
      MESSAGES: "veronica_chatbot_messages",
      UI_STATE: "veronica_chatbot_ui_state",
    },
    API: {
      ENDPOINT: getValidAPIEndpoint(), // ← SOLUZIONE
      TIMEOUT: 30000,
    },
  };
  // 🎯 FUNZIONE PER OTTENERE ENDPOINT VALIDO
  function getValidAPIEndpoint() {
    // Debug: vedi cosa abbiamo
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("dev")
    ) {
      console.log("🔍 Config debug (dev only):", {
        hasApiUrl: !!window.veronicaChatbotConfig?.apiUrl,
        currentHost: window.location.hostname,
      });
    }

    const configUrl = window.veronicaChatbotConfig?.apiUrl;

    // Se abbiamo un URL configurato, validalo
    if (configUrl) {
      try {
        // Se è già assoluto, usalo
        if (
          configUrl.startsWith("http://") ||
          configUrl.startsWith("https://")
        ) {
          if (
            window.location.hostname === "localhost" ||
            window.location.hostname.includes("dev")
          ) {
            console.log("✅ Using configured absolute URL (dev)");
          }
          return configUrl;
        }

        // Se è relativo, costruisci URL assoluto
        if (configUrl.startsWith("/")) {
          const absoluteUrl = window.location.origin + configUrl;
          if (
            window.location.hostname === "localhost" ||
            window.location.hostname.includes("dev")
          ) {
            console.log("🔧 Converted relative to absolute (dev)");
          }
          return absoluteUrl;
        }

        // Se non ha protocollo, aggiungi quello corrente
        const withProtocol = `${window.location.protocol}//${configUrl}`;
        if (
          window.location.hostname === "localhost" ||
          window.location.hostname.includes("dev")
        ) {
          console.log("🔧 Added protocol (dev)");
        }
        return withProtocol;
      } catch (error) {
        if (
          window.location.hostname === "localhost" ||
          window.location.hostname.includes("dev")
        ) {
          console.error("❌ Invalid API URL format (dev):", error.message);
        }
      }
    }

    // FALLBACK SICURI (in ordine di preferenza)
    const fallbacks = [
      // 1. Prova stesso dominio + /chat
      `${window.location.origin}/chat`,

      // 2. Se siamo su localhost, prova porta 8000
      window.location.hostname === "localhost"
        ? "http://localhost:8000/chat"
        : null,

      // 3. Se siamo su un subdominio, prova dominio principale
      window.location.hostname.includes(".")
        ? `${window.location.protocol}//${window.location.hostname
            .split(".")
            .slice(-2)
            .join(".")}/chat`
        : null,

      // 4. Ultimo fallback: errore esplicito
      null,
    ].filter(Boolean);

    for (const fallback of fallbacks) {
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname.includes("dev")
      ) {
        console.warn(`⚠️ Trying fallback API URL (dev)`);
      }
      return fallback;
    }

    // Se arriviamo qui, c'è un problema grave
    console.error("❌ No valid API endpoint found!");

    // Mostra errore visibile all'utente
    showAPIConfigError();

    return null;
  }

  // 🚨 MOSTRA ERRORE CONFIGURAZIONE
  function showAPIConfigError() {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fee2e2;
    color: #dc2626;
    padding: 20px;
    border-radius: 12px;
    border: 2px solid #fecaca;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 999999;
    max-width: 350px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  `;

    errorDiv.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 12px;">⚠️</div>
    <strong>Chatbot Configuration Error</strong><br><br>
    L'URL dell'API non è configurato.<br><br>
    <strong>Per l'amministratore:</strong><br>
    Vai su <em>WordPress Admin → Impostazioni → Veronica Chatbot</em><br>
    e configura l'URL API corretto.<br><br>
    <button onclick="this.parentElement.remove()" style="
      background: #dc2626; 
      color: white; 
      border: none; 
      padding: 8px 16px; 
      border-radius: 6px;
      cursor: pointer;
      margin-top: 10px;
    ">Chiudi</button>
  `;

    document.body.appendChild(errorDiv);

    // Auto-remove dopo 15 secondi
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 15000);
  }

  // =====================================
  // GESTIONE SESSIONI E STORAGE
  // =====================================

  class ChatStorageManager {
    constructor() {
      this.isStorageAvailable = this.checkStorageAvailability();
    }

    checkStorageAvailability() {
      try {
        const test = "__storage_test__";
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        console.warn(
          "💾 LocalStorage non disponibile, usando memoria temporanea"
        );
        return false;
      }
    }

    // ===== GESTIONE SESSIONE =====

    getOrCreateSession() {
      if (!this.isStorageAvailable) {
        return this.createNewSession();
      }

      try {
        const stored = localStorage.getItem(
          CHATBOT_CONFIG.STORAGE_KEYS.SESSION
        );
        const now = Date.now();

        if (stored) {
          const sessionData = JSON.parse(stored);
          const sessionAge = now - sessionData.created;
          const lastActivity = now - sessionData.lastActivity;

          // Reset se troppo vecchia o inattiva
          if (
            sessionAge > CHATBOT_CONFIG.SESSION_DURATION ||
            lastActivity > CHATBOT_CONFIG.CONVERSATION_TIMEOUT
          ) {
            console.log("🔄 Reset sessione per timeout");
            return this.createNewSession();
          }

          // Aggiorna last activity
          sessionData.lastActivity = now;
          this.saveSession(sessionData);
          return sessionData;
        }

        return this.createNewSession();
      } catch (error) {
        console.error("❌ Errore recupero sessione:", error);
        return this.createNewSession();
      }
    }

    createNewSession() {
      const sessionData = {
        sessionId: `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        created: Date.now(),
        lastActivity: Date.now(),
        messageCount: 0,
        pageViews: 1,
      };

      this.saveSession(sessionData);
      console.log("✨ Nuova sessione creata:", sessionData.sessionId);
      return sessionData;
    }

    saveSession(sessionData) {
      if (!this.isStorageAvailable) return;

      try {
        localStorage.setItem(
          CHATBOT_CONFIG.STORAGE_KEYS.SESSION,
          JSON.stringify(sessionData)
        );
      } catch (error) {
        console.error("❌ Errore salvataggio sessione:", error);
      }
    }

    updateSessionActivity() {
      if (!this.isStorageAvailable) return;

      try {
        const stored = localStorage.getItem(
          CHATBOT_CONFIG.STORAGE_KEYS.SESSION
        );
        if (stored) {
          const sessionData = JSON.parse(stored);
          sessionData.lastActivity = Date.now();
          sessionData.messageCount = (sessionData.messageCount || 0) + 1;
          this.saveSession(sessionData);
        }
      } catch (error) {
        console.error("❌ Errore aggiornamento attività:", error);
      }
    }

    resetSession() {
      if (this.isStorageAvailable) {
        localStorage.removeItem(CHATBOT_CONFIG.STORAGE_KEYS.SESSION);
        localStorage.removeItem(CHATBOT_CONFIG.STORAGE_KEYS.MESSAGES);
        localStorage.removeItem(CHATBOT_CONFIG.STORAGE_KEYS.UI_STATE);
      }
      return this.createNewSession();
    }

    // ===== GESTIONE MESSAGGI =====

    loadMessages() {
      if (!this.isStorageAvailable) return [];

      try {
        const stored = localStorage.getItem(
          CHATBOT_CONFIG.STORAGE_KEYS.MESSAGES
        );
        if (stored) {
          const messages = JSON.parse(stored);

          // ✅ SEMPLIFICATO: Carica messaggi così come sono, senza elaborazioni
          if (
            Array.isArray(messages) &&
            messages.length <= CHATBOT_CONFIG.MAX_MESSAGES
          ) {
            console.log("📥 Loaded", messages.length, "messages from storage");
            return messages;
          }
        }
      } catch (error) {
        console.error("❌ Errore caricamento messaggi:", error);
      }

      return [];
    }

    saveMessages(messages) {
      if (!this.isStorageAvailable) return;

      try {
        // Limita numero messaggi per evitare overflow storage
        const limitedMessages = messages.slice(-CHATBOT_CONFIG.MAX_MESSAGES);
        localStorage.setItem(
          CHATBOT_CONFIG.STORAGE_KEYS.MESSAGES,
          JSON.stringify(limitedMessages)
        );
      } catch (error) {
        console.error("❌ Errore salvataggio messaggi:", error);
        // Se storage pieno, rimuovi messaggi più vecchi
        if (error.name === "QuotaExceededError") {
          const reducedMessages = messages.slice(
            -Math.floor(CHATBOT_CONFIG.MAX_MESSAGES / 2)
          );
          this.saveMessages(reducedMessages);
        }
      }
    }

    addMessage(message) {
      const messages = this.loadMessages();

      const newMessage = {
        id:
          message.id ||
          `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        content: message.content || message.text || "",
        sender: message.sender,
        timestamp: message.timestamp || Date.now(),
        isError: message.isError || false,
      };

      // NON processare qui - lascia che sia il rendering a farlo
      console.log(
        "💾 Saving message:",
        newMessage.sender,
        newMessage.content.substring(0, 50)
      );

      messages.push(newMessage);
      this.saveMessages(messages);
      return newMessage;
    }

    // ===== GESTIONE STATO UI =====

    loadUIState() {
      if (!this.isStorageAvailable) {
        return { isOpen: false, isMinimized: false };
      }

      try {
        const stored = localStorage.getItem(
          CHATBOT_CONFIG.STORAGE_KEYS.UI_STATE
        );
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error("❌ Errore caricamento stato UI:", error);
      }

      return { isOpen: false, isMinimized: false };
    }

    saveUIState(state) {
      if (!this.isStorageAvailable) return;

      try {
        localStorage.setItem(
          CHATBOT_CONFIG.STORAGE_KEYS.UI_STATE,
          JSON.stringify(state)
        );
      } catch (error) {
        console.error("❌ Errore salvataggio stato UI:", error);
      }
    }
  }

  // =====================================
  // SANITIZZAZIONE E SICUREZZA
  // =====================================

  function sanitizeInput(input) {
    if (!input || typeof input !== "string") return "";

    // Pre-validazione rigorosa
    if (!validateInputSecure(input)) {
      console.warn("🔒 Input bloccato dalla pre-validazione");
      logSecurityEvent("xss_attempt_blocked", input);
      return "[CONTENUTO BLOCCATO]";
    }

    // Rimozione COMPLETA di tutto l'HTML per input utente
    let sanitized = input
      // Rimuovi tutti i tag HTML
      .replace(/<[^>]*>/g, "[TAG-RIMOSSO]")
      // Rimuovi tutte le entità HTML
      .replace(/&[a-zA-Z0-9#]+;/g, "[ENTITY-RIMOSSA]")
      // Rimuovi protocolli pericolosi
      .replace(/javascript:/gi, "[JS-BLOCCATO]")
      .replace(/vbscript:/gi, "[VBS-BLOCCATO]")
      .replace(/data:/gi, "[DATA-BLOCCATO]")
      // Rimuovi event handlers
      .replace(/on\w+\s*=/gi, "[EVENT-BLOCCATO]");

    return sanitized.slice(0, 1000); // Limita lunghezza
  }

  function validateInput(input) {
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /&lt;script/i,
      /&#60;script/i,
    ];

    return !suspiciousPatterns.some((pattern) => pattern.test(input));
  }

  function isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return ["http:", "https:", "mailto:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  function validateInputSecure(input) {
    if (!input || typeof input !== "string") return false;
    if (input.length > 1000) return false;
    if (input.trim().length === 0) return false;

    // Lista completa di pattern XSS
    const xssPatterns = [
      // Tag pericolosi
      /<script/i,
      /<\/script>/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<img/i,
      /<svg/i,
      /<form/i,
      /<input/i,
      /<textarea/i,

      // Entità codificate di script
      /&lt;script/i,
      /&#60;script/i,
      /&#x3c;script/i,
      /&amp;lt;script/i,

      // Protocolli pericolosi
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /data:image\/svg/i,

      // Event handlers
      /on\w+\s*=/i,
      /onerror/i,
      /onload/i,
      /onclick/i,
      /onmouseover/i,

      // Funzioni pericolose
      /alert\s*\(/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,

      // Codifiche multiple
      /&amp;lt;/i,
      /&amp;gt;/i,
      /&#x/i,

      // Base64 sospetto
      /data:.*base64/i,

      // Expression CSS
      /expression\s*\(/i,

      // Import/require
      /import\s+/i,
      /require\s*\(/i,
    ];

    // Controlla pattern XSS
    const hasXSS = xssPatterns.some((pattern) => pattern.test(input));
    if (hasXSS) {
      console.warn("🔒 Pattern XSS rilevato:", input.substring(0, 50));
      return false;
    }

    return true;
  }

  function renderMessageContent(message, config) {
    const baseStyle = {
      maxWidth: "85%",
      padding: "12px 16px",
      fontSize: "14px",
      lineHeight: "1.4",
      wordWrap: "break-word",
    };

    if (message.sender === "user") {
      // MESSAGGI UTENTE: Solo testo puro, sempre
      return React.createElement(
        "div",
        {
          style: {
            ...baseStyle,
            borderRadius: "18px 18px 4px 18px",
            backgroundColor: "#f66061",
            color: "white",
          },
        },
        message.content // Solo testo, niente HTML
      );
    } else {
      // MESSAGGI BOT: HTML processato da markdown
      const processedContent = formatBotMessageSafely(
        message.content || message.text || ""
      );

      return React.createElement("div", {
        style: {
          ...baseStyle,
          borderRadius: "18px 18px 18px 4px",
          backgroundColor: message.isError
            ? "#fee2e2"
            : config.theme === "dark"
            ? "#374151"
            : "#f3f4f6",
          color: message.isError
            ? "#dc2626"
            : config.theme === "dark"
            ? "#f9fafb"
            : "#111827",
        },
        dangerouslySetInnerHTML: {
          __html: processedContent,
        },
      });
    }
  }

  function formatBotMessageSafely(text) {
    if (!text) return "";

    console.log("🔧 Processing markdown:", text.substring(0, 100) + "...");

    // Step 1: Solo sicurezza di base
    let formatted = text
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<iframe[^>]*>.*?<\/iframe>/gis, "")
      .replace(/javascript:/gi, "[JS-REMOVED]");

    // Step 2: Markdown semplice → HTML
    formatted = formatted
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Headers
      .replace(
        /^### (.*$)/gm,
        '<h3 style="margin: 12px 0 8px 0; font-weight: bold; color: inherit;">$1</h3>'
      )
      .replace(
        /^## (.*$)/gm,
        '<h2 style="margin: 14px 0 10px 0; font-weight: bold; color: inherit;">$1</h2>'
      )
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #f66061; text-decoration: underline;">$1</a>'
      )
      // Liste
      .replace(/^- (.+)$/gm, '<li style="margin-bottom: 4px;">$1</li>')
      // Newlines
      .replace(/\n/g, "<br>");

    // Step 3: Wrappa liste in <ul>
    formatted = formatted
      .replace(
        /(<li[^>]*>.*?<\/li>)(<br>(<li[^>]*>.*?<\/li>))*(<br>)?/g,
        '<ul style="margin: 8px 0; padding-left: 20px;">$&</ul>'
      )
      .replace(/<br>(<li|<\/ul>)/g, "$1")
      .replace(/(<ul[^>]*>)<br>/g, "$1");

    console.log("✅ Result:", formatted.substring(0, 200) + "...");
    return formatted;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function logSecurityEvent(eventType, content) {
    if (window.veronicaChatbotConfig?.debugMode) {
      console.group("🛡️ Security Event");
      console.log("Type:", eventType);
      console.log("Content:", content.substring(0, 100));
      console.log("Timestamp:", new Date().toISOString());
      console.log("User Agent:", navigator.userAgent);
      console.groupEnd();
    }

    // Opzionale: invia al backend per monitoraggio
    if (window.veronicaChatbotConfig?.apiUrl) {
      fetch(
        window.veronicaChatbotConfig.apiUrl.replace("/chat", "/security-log"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: eventType,
            content: content.substring(0, 200),
            timestamp: new Date().toISOString(),
            url: window.location.href,
          }),
        }
      ).catch(() => {}); // Silent fail
    }
  }

  // =====================================
  // COMPONENTE CHATBOT PRINCIPALE
  // =====================================

  function VeronicaChatbot() {
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
    const { isOpen, isMinimized } = uiState;

    // Messaggi con persistenza
    const [messages, setMessages] = React.useState(() =>
      storageManager.loadMessages()
    );

    // Stato chat
    const [inputValue, setInputValue] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    // Configurazione
    const config = React.useMemo(() => {
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

    // Se non abbiamo config valida, non renderizzare
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

          // 🔍 DEBUG DETTAGLIATO
          // console.group("🔗 API Request Debug");
          // console.log("Message:", sanitizedMessage);
          // console.log("Thread ID:", session.sessionId);
          // console.log("Request timestamp:", new Date().toISOString());

          const requestBody = {
            message: sanitizedMessage,
            thread_id: session.sessionId,
          };

          // console.log("Request body:", requestBody);

          const response = await fetch(config.apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(CHATBOT_CONFIG.API.TIMEOUT),
          });

          // console.log("Response received:");
          // console.log("- Status:", response.status);
          // console.log("- Status Text:", response.statusText);
          // console.log("- OK:", response.ok);
          // console.log(
          //   "- Headers:",
          //   Object.fromEntries(response.headers.entries())
          // );
          // console.log("- URL:", response.url);
          // console.groupEnd();

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

          // 🎯 GESTIONE ERRORI SPECIFICA
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
      [isLoading, config.apiUrl, session.sessionId, storageManager, addMessage]
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
      updateUIState({ isOpen: !isOpen, isMinimized: false });
    }, [isOpen, updateUIState]);

    const toggleMinimize = React.useCallback(() => {
      updateUIState({ isMinimized: !isMinimized });
    }, [isMinimized, updateUIState]);

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
    }, [storageManager]);

    // ===== AUTO-SCROLL =====
    const messagesEndRef = React.useRef(null);

    React.useEffect(() => {
      if (messagesEndRef.current && isOpen && !isMinimized) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [messages, isOpen, isMinimized]);

    // ===== WELCOME BACK MESSAGE =====
    React.useEffect(() => {
      if (messages.length > 0 && isOpen) {
        const now = Date.now();
        const lastActivity = now - session.lastActivity;

        if (lastActivity > 60 * 60 * 1000) {
          // > 1 ora
          const hours = Math.round(lastActivity / (1000 * 60 * 60));
          console.log(`💭 Bentornato! Ultima attività ${hours} ore fa`);
        }
      }
    }, [isOpen, messages.length, session.lastActivity]);

    // ===== RENDER =====
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
        !isOpen &&
          React.createElement(
            "button",
            {
              key: "trigger",
              onClick: toggleOpen,
              style: {
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f66061, #8b5cf6)",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                transition: "transform 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
              onMouseOver: (e) => (e.target.style.transform = "scale(1.1)"),
              onMouseOut: (e) => (e.target.style.transform = "scale(1)"),
            },
            "💬"
          ),

        // Chat window
        isOpen &&
          React.createElement(
            "div",
            {
              key: "chat",
              style: {
                width:
                  window.innerWidth <= 768 ? "calc(100vw - 40px)" : "380px",
                maxWidth: "400px",
                height: isMinimized
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
              React.createElement(
                "div",
                {
                  key: "header",
                  style: {
                    padding: "16px",
                    backgroundColor:
                      config.theme === "dark" ? "#374151" : "#f9fafb",
                    borderBottom: isMinimized ? "none" : "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: config.theme === "dark" ? "#f9fafb" : "#111827",
                  },
                },
                [
                  React.createElement(
                    "div",
                    {
                      key: "header-info",
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      },
                    },
                    [
                      React.createElement("span", { key: "avatar" }, "🐼"),
                      !isMinimized &&
                        React.createElement("div", { key: "header-text" }, [
                          React.createElement(
                            "div",
                            {
                              key: "name",
                              style: { fontWeight: "600", fontSize: "14px" },
                            },
                            "Veronica Schembri AI Chatbot"
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "status",
                              style: { fontSize: "12px", opacity: 0.7 },
                            },
                            `Online • ${messages.length} messaggi`
                          ),
                        ]),
                    ]
                  ),
                  React.createElement(
                    "div",
                    {
                      key: "header-controls",
                      style: { display: "flex", gap: "8px" },
                    },
                    [
                      // Reset button
                      messages.length > 0 &&
                        !isMinimized &&
                        React.createElement(
                          "button",
                          {
                            key: "reset",
                            onClick: resetConversation,
                            style: {
                              background: "none",
                              border: "none",
                              fontSize: "16px",
                              cursor: "pointer",
                              opacity: 0.7,
                              padding: "4px",
                            },
                            title: "Nuova conversazione",
                          },
                          "🔄"
                        ),
                      // Minimize button
                      React.createElement(
                        "button",
                        {
                          key: "minimize",
                          onClick: toggleMinimize,
                          style: {
                            background: "none",
                            border: "none",
                            fontSize: "16px",
                            cursor: "pointer",
                            opacity: 0.7,
                            padding: "4px",
                          },
                        },
                        isMinimized ? "🔼" : "🔽"
                      ),
                      // Close button
                      React.createElement(
                        "button",
                        {
                          key: "close",
                          onClick: closeChat,
                          style: {
                            background: "none",
                            border: "none",
                            fontSize: "16px",
                            cursor: "pointer",
                            opacity: 0.7,
                            padding: "4px",
                          },
                        },
                        "✕"
                      ),
                    ]
                  ),
                ]
              ),

              // Messages area
              !isMinimized &&
                React.createElement(
                  "div",
                  {
                    key: "messages",
                    style: {
                      flex: 1,
                      overflowY: "auto",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    },
                  },
                  [
                    // Welcome message se nessun messaggio
                    messages.length === 0 &&
                      React.createElement(
                        "div",
                        {
                          key: "welcome",
                          style: {
                            textAlign: "center",
                            color:
                              config.theme === "dark" ? "#9ca3af" : "#6b7280",
                            fontSize: "14px",
                            padding: "20px",
                          },
                        },
                        [
                          React.createElement(
                            "div",
                            {
                              key: "emoji",
                              style: { fontSize: "48px", marginBottom: "16px" },
                            },
                            "👋"
                          ),
                          React.createElement(
                            "div",
                            { key: "text" },
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
                          style: {
                            display: "flex",
                            justifyContent:
                              msg.sender === "user" ? "flex-end" : "flex-start",
                            marginBottom: "8px",
                          },
                        },
                        renderMessageContent(msg, config) // ✅ Usa funzione sicura
                      )
                    ),

                    // Loading indicator
                    isLoading &&
                      React.createElement(
                        "div",
                        {
                          key: "loading",
                          style: {
                            display: "flex",
                            justifyContent: "flex-start",
                            marginBottom: "8px",
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              maxWidth: "85%",
                              padding: "12px 16px",
                              borderRadius: "18px 18px 18px 4px",
                              backgroundColor:
                                config.theme === "dark" ? "#374151" : "#f3f4f6",
                              color:
                                config.theme === "dark" ? "#f9fafb" : "#111827",
                              fontSize: "14px",
                            },
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
              !isMinimized &&
                React.createElement(
                  "form",
                  {
                    key: "input-form",
                    onSubmit: handleSubmit,
                    style: {
                      padding: "16px",
                      borderTop: "1px solid #e5e7eb",
                      backgroundColor:
                        config.theme === "dark" ? "#1f2937" : "white",
                    },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        display: "flex",
                        gap: "8px",
                        alignItems: "flex-end",
                      },
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
                        style: {
                          flex: 1,
                          padding: "8px 12px",
                          border: error
                            ? "2px solid #f87171"
                            : "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: window.innerWidth <= 768 ? "16px" : "14px",
                          outline: "none",
                          backgroundColor:
                            config.theme === "dark" ? "#4b5563" : "white",
                          color:
                            config.theme === "dark" ? "#f9fafb" : "#111827",
                          resize: "none",
                          maxHeight: "100px",
                        },
                        onKeyDown: (e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        },
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
                          style: {
                            padding:
                              window.innerWidth <= 768
                                ? "8px 12px"
                                : "8px 16px",
                            backgroundColor: error ? "#6b7280" : "#f66061",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize:
                              window.innerWidth <= 768 ? "13px" : "14px",
                            cursor:
                              !inputValue.trim() ||
                              isLoading ||
                              inputValue.length > 1000 ||
                              error
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              !inputValue.trim() ||
                              isLoading ||
                              inputValue.length > 1000 ||
                              error
                                ? 0.6
                                : 1,
                            minWidth:
                              window.innerWidth <= 768 ? "50px" : "60px",
                          },
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

  // =====================================
  // INIZIALIZZAZIONE E MOUNT
  // =====================================

  function initializeChatbot() {
    // Injection CSS mobile responsive
    if (!document.getElementById("veronica-chatbot-mobile-css")) {
      const style = document.createElement("style");
      style.id = "veronica-chatbot-mobile-css";
      style.textContent = `
        @media (max-width: 768px) {
          .veronica-chatbot-floating {
            left: 20px !important;
            right: 20px !important;
          }
        }
        
        /* Miglioramenti generali */
        .veronica-chatbot-floating * {
          box-sizing: border-box;
        }
        
        /* Fix scroll per iOS */
        .veronica-chatbot-floating .messages-area {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Prevenzione zoom iOS */
        .veronica-chatbot-floating input,
        .veronica-chatbot-floating textarea {
          font-size: 16px !important;
        }
        
        @media (min-width: 769px) {
          .veronica-chatbot-floating input,
          .veronica-chatbot-floating textarea {
            font-size: 14px !important;
          }
        }
        
        /* Animazioni smooth */
        .veronica-chatbot-floating {
          transition: all 0.3s ease;
        }
        
        /* Loading animation */
        @keyframes chatbot-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .veronica-chatbot-loading {
          animation: chatbot-pulse 2s infinite;
        }
        
        /* Scroll personalizzato */
        .veronica-chatbot-messages::-webkit-scrollbar {
          width: 6px;
        }
        
        .veronica-chatbot-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .veronica-chatbot-messages::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .veronica-chatbot-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `;
      document.head.appendChild(style);
    }

    // Trova o crea container
    let container = document.getElementById("veronica-chatbot-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "veronica-chatbot-container";
      container.className = "veronica-chatbot-floating";
      document.body.appendChild(container);
    }

    // Mount React component
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(VeronicaChatbot));

    console.log("✅ Veronica Chatbot inizializzato con persistenza completa");

    // Rimuovi indicatore di caricamento se presente
    const loadingElement = document.getElementById("veronica-chatbot-loading");
    if (loadingElement) {
      setTimeout(() => {
        loadingElement.style.display = "none";
      }, 1000);
    }
  }

  // =====================================
  // GESTIONE CROSS-PAGE SYNC
  // =====================================

  // Listener per storage events (sync tra tab/pagine)
  function setupCrossPageSync() {
    // Storage event listener per sincronizzazione cross-tab
    window.addEventListener("storage", function (e) {
      // Sync stato UI tra pagine
      if (e.key === CHATBOT_CONFIG.STORAGE_KEYS.UI_STATE) {
        console.log("🔄 Sync stato UI da altra pagina");
        // Il componente React si aggiornerà automaticamente al prossimo render
      }

      // Sync messaggi tra pagine
      if (e.key === CHATBOT_CONFIG.STORAGE_KEYS.MESSAGES) {
        console.log("🔄 Sync messaggi da altra pagina");
        // Il componente React si aggiornerà automaticamente
      }

      // Sync sessione tra pagine
      if (e.key === CHATBOT_CONFIG.STORAGE_KEYS.SESSION) {
        console.log("🔄 Sync sessione da altra pagina");
      }
    });

    // Cleanup automatico sessioni scadute (ogni 5 minuti)
    setInterval(() => {
      try {
        const storage = new ChatStorageManager();
        const session = storage.getOrCreateSession();

        // Se la sessione è stata ricreata, significa che era scaduta
        const storedSession = localStorage.getItem(
          CHATBOT_CONFIG.STORAGE_KEYS.SESSION
        );
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          if (sessionData.sessionId !== session.sessionId) {
            console.log("🧹 Cleanup sessione scaduta eseguito");
          }
        }
      } catch (error) {
        console.error("❌ Errore cleanup sessioni:", error);
      }
    }, 5 * 60 * 1000); // 5 minuti

    // Gestione visibilità pagina per ottimizzazioni
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        console.log("👁️ Pagina tornata visibile, sync stato chatbot");
        // Il React component si aggiornerà automaticamente
      }
    });
  }

  // =====================================
  // DEBUGGING E UTILITIES
  // =====================================

  // Funzioni globali per debugging (solo in dev)
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname.includes("dev") ||
    window.veronicaChatbotConfig?.debugMode
  ) {
    window.VeronicaChatbotDebug = {
      // Mostra info sessione corrente
      showSessionInfo() {
        const storage = new ChatStorageManager();
        const session = storage.getOrCreateSession();
        const messages = storage.loadMessages();
        const uiState = storage.loadUIState();

        console.group("🐛 Veronica Chatbot Debug Info");
        console.log("📊 Sessione:", {
          sessionId: session.sessionId,
          created: new Date(session.created),
          lastActivity: new Date(session.lastActivity),
          messageCount: session.messageCount,
          pageViews: session.pageViews,
          age: `${Math.round(
            (Date.now() - session.created) / (1000 * 60 * 60)
          )} ore`,
        });
        console.log("💬 Messaggi in storage:", {
          count: messages.length,
          size: JSON.stringify(messages).length + " bytes",
          samples: messages.slice(-3),
        });
        console.log("🎨 Stato UI:", uiState);
        console.log("💾 Storage disponibile:", storage.isStorageAvailable);
        console.log("⚙️ Configurazione:", {
          ...CHATBOT_CONFIG,
          wpConfig: window.veronicaChatbotConfig,
        });
        console.groupEnd();
      },

      // Reset manuale completo
      hardReset() {
        if (confirm("⚠️ HARD RESET: Cancellare TUTTI i dati del chatbot?")) {
          const storage = new ChatStorageManager();
          storage.resetSession();

          // Force reload per reinizializzare tutto
          window.location.reload();
        }
      },

      // Test connessione API
      async testAPI() {
        const config = window.veronicaChatbotConfig || {};
        const apiUrl = config.apiUrl || CHATBOT_CONFIG.API.ENDPOINT;

        console.log("🔗 Testing API connection to:", apiUrl);

        try {
          const testMessage = "Test connessione API da debug console";
          const testThreadId = `debug_${Date.now()}`;

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: testMessage,
              thread_id: testThreadId,
            }),
            signal: AbortSignal.timeout(10000),
          });

          console.log("🔗 API Test Result:", {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
            url: apiUrl,
            headers: Object.fromEntries(response.headers.entries()),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("📥 Response data:", data);
            console.log("✅ API connection successful!");
          } else {
            const errorText = await response.text();
            console.error("❌ API error response:", errorText);
          }
        } catch (error) {
          console.error("❌ API Test failed:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }
      },

      // Simula storage error per testing
      simulateStorageError() {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function () {
          throw new Error("QuotaExceededError: Quota exceeded (simulated)");
        };

        console.log(
          "🧪 localStorage.setItem temporaneamente disabilitato per 5 secondi"
        );

        setTimeout(() => {
          localStorage.setItem = originalSetItem;
          console.log("✅ localStorage.setItem ripristinato");
        }, 5000);
      },

      // Mostra statistiche storage
      showStorageStats() {
        let totalSize = 0;
        let chatbotSize = 0;

        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            const size = localStorage[key].length;
            totalSize += size;

            if (key.startsWith("veronica_chatbot_")) {
              chatbotSize += size;
            }
          }
        }

        console.group("💾 Storage Statistics");
        console.log("Total localStorage size:", totalSize, "bytes");
        console.log("Chatbot data size:", chatbotSize, "bytes");
        console.log(
          "Chatbot percentage:",
          ((chatbotSize / totalSize) * 100).toFixed(2) + "%"
        );
        console.log(
          "Estimated remaining space:",
          5 * 1024 * 1024 - totalSize,
          "bytes"
        ); // Assume 5MB limit
        console.groupEnd();
      },

      // Esporta dati chatbot per backup
      exportData() {
        const storage = new ChatStorageManager();
        const exportData = {
          session: storage.getOrCreateSession(),
          messages: storage.loadMessages(),
          uiState: storage.loadUIState(),
          timestamp: new Date().toISOString(),
          version: window.veronicaChatbotConfig?.version || "unknown",
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `veronica-chatbot-backup-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);
        console.log("📦 Dati chatbot esportati");
      },

      // Importa dati chatbot da backup
      importData(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          try {
            const importData = JSON.parse(e.target.result);
            const storage = new ChatStorageManager();

            if (importData.session) {
              storage.saveSession(importData.session);
            }
            if (importData.messages) {
              storage.saveMessages(importData.messages);
            }
            if (importData.uiState) {
              storage.saveUIState(importData.uiState);
            }

            console.log(
              "📥 Dati chatbot importati, ricarica la pagina per vedere i cambiamenti"
            );
            if (confirm("Dati importati. Ricaricare la pagina?")) {
              window.location.reload();
            }
          } catch (error) {
            console.error("❌ Errore importazione:", error);
          }
        };
        reader.readAsText(file);
      },
    };

    console.log("🐛 Debug utilities disponibili: window.VeronicaChatbotDebug");
    console.log("📋 Comandi disponibili:");
    console.log(
      "  • VeronicaChatbotDebug.showSessionInfo() - Info sessione corrente"
    );
    console.log("  • VeronicaChatbotDebug.testAPI() - Test connessione API");
    console.log("  • VeronicaChatbotDebug.hardReset() - Reset completo");
    console.log(
      "  • VeronicaChatbotDebug.showStorageStats() - Statistiche storage"
    );
    console.log("  • VeronicaChatbotDebug.exportData() - Esporta backup");
  }

  // =====================================
  // GESTIONE ERRORI GLOBALI
  // =====================================

  // Gestione errori JavaScript globali
  window.addEventListener("error", function (e) {
    if (e.filename && e.filename.includes("chatbot.js")) {
      console.error("❌ Errore Chatbot:", {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
    }
  });

  // Gestione errori promise non catturate
  window.addEventListener("unhandledrejection", function (e) {
    if (e.reason && e.reason.toString().includes("chatbot")) {
      console.error("❌ Promise rejection Chatbot:", e.reason);
    }
  });

  // =====================================
  // ENTRY POINT
  // =====================================

  function waitForReact(callback) {
    if (typeof React !== "undefined" && typeof ReactDOM !== "undefined") {
      callback();
    } else {
      console.log("⏳ Aspettando React...");
      setTimeout(() => waitForReact(callback), 100);
    }
  }

  // Avvio chatbot quando React è disponibile
  waitForReact(() => {
    try {
      // Setup cross-page sync
      setupCrossPageSync();

      // Inizializza chatbot
      initializeChatbot();

      // Log inizializzazione con info dettagliate
      const config = window.veronicaChatbotConfig || {};
      console.log("🚀 Veronica Chatbot caricato con successo!", {
        version: config.version || "unknown",
        features: {
          persistenza: "✅ Sessioni e messaggi",
          crossPage: "✅ Sync tra pagine",
          responsive: "✅ Mobile + Desktop",
          sicurezza: "✅ Input sanitization",
          storage: localStorage ? "✅ LocalStorage" : "⚠️ Memory only",
          debug: config.debugMode ? "✅ Debug attivo" : "ℹ️ Debug disattivo",
        },
        config: {
          apiUrl: config.apiUrl,
          theme: config.theme,
          position: config.position,
          sessionDuration: `${Math.round(
            (config.sessionDuration || CHATBOT_CONFIG.SESSION_DURATION) /
              (24 * 60 * 60 * 1000)
          )} giorni`,
          conversationTimeout: `${Math.round(
            (config.conversationTimeout ||
              CHATBOT_CONFIG.CONVERSATION_TIMEOUT) /
              (60 * 60 * 1000)
          )} ore`,
        },
      });

      // Notifica WordPress del caricamento completato (se in WordPress)
      if (typeof wp !== "undefined" && wp.hooks) {
        wp.hooks.doAction("veronica_chatbot_loaded");
      }

      // Dispatch evento personalizzato per integrazione
      window.dispatchEvent(
        new CustomEvent("veronicaChatbotReady", {
          detail: {
            version: config.version,
            config: config,
          },
        })
      );
    } catch (error) {
      console.error("❌ Errore inizializzazione Veronica Chatbot:", error);

      // Fallback: mostra messaggio di errore minimale
      const errorContainer = document.createElement("div");
      errorContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #fee2e2;
        color: #dc2626;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        font-family: sans-serif;
        font-size: 14px;
        z-index: 999999;
        max-width: 300px;
      `;
      errorContainer.innerHTML = `
        <strong>Chatbot Error</strong><br>
        Impossibile caricare il chatbot. 
        <a href="#" onclick="window.location.reload()" style="color: #dc2626; text-decoration: underline;">
          Ricarica la pagina
        </a>
      `;

      document.body.appendChild(errorContainer);

      // Rimuovi messaggio di errore dopo 10 secondi
      setTimeout(() => {
        if (errorContainer.parentNode) {
          errorContainer.parentNode.removeChild(errorContainer);
        }
      }, 10000);
    }
  });
})();
