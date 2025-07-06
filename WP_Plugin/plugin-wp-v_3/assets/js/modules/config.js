/**
 * Config Module - Configurazione e Gestione API
 * Estratto da chatbot.js originale (righe 10-150 circa)
 * Gestisce configurazione, endpoint API e validazione URL
 */

// =====================================
// CONFIGURAZIONE GLOBALE
// =====================================

export const CHATBOT_CONFIG = {
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000,
  CONVERSATION_TIMEOUT: 24 * 60 * 60 * 1000,
  MAX_MESSAGES: 100,
  STORAGE_KEYS: {
    SESSION: "veronica_chatbot_session",
    MESSAGES: "veronica_chatbot_messages",
    UI_STATE: "veronica_chatbot_ui_state",
  },
  API: {
    ENDPOINT: null, // Sarà impostato dinamicamente
    TIMEOUT: 30000,
  },
};

// =====================================
// GESTIONE ENDPOINT API
// =====================================

/**
 * Ottieni endpoint API valido
 * Estratto dalla funzione getValidAPIEndpoint() originale
 */
export function getValidAPIEndpoint() {
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
      if (configUrl.startsWith("http://") || configUrl.startsWith("https://")) {
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
  return null;
}

/**
 * Mostra errore configurazione API
 * Estratto dalla funzione showAPIConfigError() originale
 */
export function showAPIConfigError() {
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
// UTILITY CONFIGURATION
// =====================================

/**
 * Ottieni configurazione completa per JavaScript
 */
export function getJSConfig() {
  const wpConfig = window.veronicaChatbotConfig || {};

  return {
    apiUrl: getValidAPIEndpoint(),
    theme: wpConfig.theme || "light",
    position: wpConfig.position || "bottom-right",
    sessionDuration:
      wpConfig.sessionDuration || CHATBOT_CONFIG.SESSION_DURATION,
    conversationTimeout:
      wpConfig.conversationTimeout || CHATBOT_CONFIG.CONVERSATION_TIMEOUT,
    maxMessages: wpConfig.maxMessages || CHATBOT_CONFIG.MAX_MESSAGES,
    enablePersistence: wpConfig.enablePersistence !== false,
    enableCrossPageSync: wpConfig.enableCrossPageSync !== false,
    debugMode: wpConfig.debugMode || false,
    version: wpConfig.version || "3.0.0",
  };
}

/**
 * Verifica se siamo in modalità development
 */
export function isDevelopmentMode() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname.includes("dev") ||
    window.veronicaChatbotConfig?.debugMode
  );
}

/**
 * Log sicuro per development
 */
export function devLog(...args) {
  if (isDevelopmentMode()) {
    console.log(...args);
  }
}

/**
 * Ottieni configurazione storage dinamica
 */
export function getStorageConfig() {
  const jsConfig = getJSConfig();

  return {
    sessionDuration: jsConfig.sessionDuration,
    conversationTimeout: jsConfig.conversationTimeout,
    maxMessages: jsConfig.maxMessages,
    enablePersistence: jsConfig.enablePersistence,
    enableCrossPageSync: jsConfig.enableCrossPageSync,
    storageKeys: CHATBOT_CONFIG.STORAGE_KEYS,
  };
}

/**
 * Ottieni configurazione UI dinamica
 */
export function getUIConfig() {
  const jsConfig = getJSConfig();

  return {
    theme: jsConfig.theme,
    position: jsConfig.position,
    debugMode: jsConfig.debugMode,
  };
}

/**
 * Verifica validità configurazione
 */
export function validateConfig() {
  const apiEndpoint = getValidAPIEndpoint();
  const jsConfig = getJSConfig();

  const issues = [];

  if (!apiEndpoint) {
    issues.push("API endpoint not configured");
  }

  if (!jsConfig.theme || !["light", "dark"].includes(jsConfig.theme)) {
    issues.push("Invalid theme configuration");
  }

  if (
    !jsConfig.position ||
    !["bottom-right", "bottom-left"].includes(jsConfig.position)
  ) {
    issues.push("Invalid position configuration");
  }

  return {
    valid: issues.length === 0,
    issues: issues,
    config: jsConfig,
  };
}
