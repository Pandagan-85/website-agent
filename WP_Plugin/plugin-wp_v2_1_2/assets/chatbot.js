/**
 * Veronica Schembri Chatbot Frontend - Versione Modulare
 * Entry point principale che importa tutti i moduli
 * REFACTORED: Da 1932 righe → 80 righe + 11 moduli
 */

// =====================================
// IMPORTS MODULI
// =====================================

import {
  CHATBOT_CONFIG,
  getValidAPIEndpoint,
  showAPIConfigError,
} from "./modules/config.js";

import { ChatStorageManager } from "./modules/storage.js";
import { VeronicaChatbot } from "./modules/chat-window.js";
import { setupCrossPageSync } from "./modules/cross-page-sync.js";
import { initDebugTools } from "./modules/debug-tools.js";

(function () {
  "use strict";

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
      // Inizializza configurazione
      CHATBOT_CONFIG.API.ENDPOINT = getValidAPIEndpoint();

      // Verifica che la configurazione sia valida
      if (!CHATBOT_CONFIG.API.ENDPOINT) {
        console.error("❌ Cannot initialize chatbot without valid API URL");
        return;
      }

      // Setup cross-page sync
      setupCrossPageSync();

      // Inizializza chatbot
      initializeChatbot();

      // Inizializza debug tools se necessario
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname.includes("dev") ||
        window.veronicaChatbotConfig?.debugMode
      ) {
        initDebugTools();
      }

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
          modules: "✅ ES6 Modules (11 moduli)",
        },
        modules: {
          config: "✅ Configurazione e API",
          storage: "✅ ChatStorageManager",
          security: "✅ Sanitizzazione",
          formatting: "✅ Rendering messaggi",
          uiState: "✅ State management",
          uiHandlers: "✅ Event handlers",
          uiComponents: "✅ React components",
          chatWindow: "✅ Main component",
          crossPageSync: "✅ Sincronizzazione",
          debugTools: "✅ Debug utilities",
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
            modules: [
              "config",
              "storage",
              "security",
              "formatting",
              "ui-state",
              "ui-handlers",
              "ui-components",
              "chat-window",
              "cross-page-sync",
              "debug-tools",
            ],
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
