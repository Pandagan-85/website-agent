/**
 * Veronica Schembri Chatbot Frontend - v3.0 Modular Edition
 * Entry Point Minimale - Importa tutti i moduli specializzati
 *
 * Estratto e refactorizzato da chatbot.js originale (1932 righe)
 * Ora: ~50 righe + 8 moduli specializzati
 */

// =====================================
// IMPORTS MODULI SPECIALIZZATI
// =====================================

import {
  CHATBOT_CONFIG,
  getValidAPIEndpoint,
  showAPIConfigError,
} from "./modules/config.js";
import { ChatStorageManager } from "./modules/storage.js";
import {
  sanitizeInput,
  validateInputSecure,
  logSecurityEvent,
} from "./modules/security.js";
import {
  renderMessageContent,
  formatBotMessageSafely,
} from "./modules/formatting.js";
import { VeronicaChatbot } from "./modules/ui-components.js";
import { setupCrossPageSync } from "./modules/cross-page-sync.js";
import { initDebugTools } from "./modules/debug-tools.js";

(function () {
  "use strict";

  // =====================================
  // CONFIGURAZIONE INIZIALE
  // =====================================

  // Imposta l'endpoint API all'avvio
  CHATBOT_CONFIG.API.ENDPOINT = getValidAPIEndpoint();

  // =====================================
  // INIZIALIZZAZIONE
  // =====================================

  function initializeChatbot() {
    // Verifica che la configurazione sia valida
    if (!CHATBOT_CONFIG.API.ENDPOINT) {
      console.error("❌ Cannot initialize chatbot without valid API URL");
      showAPIConfigError();
      return;
    }

    // Injection CSS base
    injectBaseStyles();

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

    console.log("✅ Veronica Chatbot v3.0 inizializzato (Modular Edition)");

    // Rimuovi indicatore di caricamento se presente
    const loadingElement = document.getElementById("veronica-chatbot-loading");
    if (loadingElement) {
      setTimeout(() => (loadingElement.style.display = "none"), 1000);
    }
  }

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  function injectBaseStyles() {
    if (!document.getElementById("veronica-chatbot-base-css")) {
      const style = document.createElement("style");
      style.id = "veronica-chatbot-base-css";
      style.textContent = `
                #veronica-chatbot-container {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .veronica-chatbot-loading {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #f66061, #8b5cf6);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    z-index: 999998;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
            `;
      document.head.appendChild(style);
    }
  }

  function waitForReact(callback) {
    if (typeof React !== "undefined" && typeof ReactDOM !== "undefined") {
      callback();
    } else {
      console.log("⏳ Aspettando React...");
      setTimeout(() => waitForReact(callback), 100);
    }
  }

  // =====================================
  // ENTRY POINT
  // =====================================

  // Avvio quando React è disponibile
  waitForReact(() => {
    try {
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

      // Log inizializzazione
      const config = window.veronicaChatbotConfig || {};
      console.log("🚀 Veronica Chatbot v3.0 caricato!", {
        version: config.version || "3.0.0",
        architecture: "Modular (8 modules)",
        features: {
          persistenza: "✅ Sessioni e messaggi",
          crossPage: "✅ Sync tra pagine",
          responsive: "✅ Mobile + Desktop",
          sicurezza: "✅ Input sanitization",
          modules: "✅ ES6 Modules",
        },
      });

      // Dispatch evento per integrazioni
      window.dispatchEvent(
        new CustomEvent("veronicaChatbotReady", {
          detail: { version: "3.0.0", architecture: "modular" },
        })
      );
    } catch (error) {
      console.error("❌ Errore inizializzazione Veronica Chatbot v3.0:", error);

      // Fallback error display
      const errorContainer = document.createElement("div");
      errorContainer.style.cssText = `
                position: fixed; bottom: 20px; right: 20px;
                background: #fee2e2; color: #dc2626; padding: 12px;
                border-radius: 8px; font-family: sans-serif;
                font-size: 14px; z-index: 999999; max-width: 300px;
            `;
      errorContainer.innerHTML = `
                <strong>Chatbot Error v3.0</strong><br>
                Impossibile caricare il chatbot modulare.
                <a href="#" onclick="window.location.reload()" style="color: #dc2626;">Ricarica</a>
            `;
      document.body.appendChild(errorContainer);
      setTimeout(() => errorContainer.remove(), 10000);
    }
  });
})();
