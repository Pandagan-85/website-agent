/**
 * Veronica Schembri Chatbot Frontend - v3.0 Smart Logging
 * SECURE: Logs solo in development, produzione pulita
 */

// =====================================
// IMPORTS MODULI SPECIALIZZATI
// =====================================

import {
  CHATBOT_CONFIG,
  getValidAPIEndpoint,
  showAPIConfigError,
  isDevelopmentMode,
  devLog,
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

import {
  setupCrossPageSync,
  coordinateMultipleInstances,
  monitorSyncPerformance,
} from "./modules/cross-page-sync.js";

import {
  initDebugTools,
  setupPerformanceMonitoring,
} from "./modules/debug-tools.js";

// ✅ SOLO IN DEV MODE
devLog("✅ Moduli chatbot importati");

(function () {
  "use strict";

  // =====================================
  // CONFIGURAZIONE INIZIALE
  // =====================================

  try {
    devLog("🔧 Configurazione iniziale...");
    CHATBOT_CONFIG.API.ENDPOINT = getValidAPIEndpoint();

    // ✅ SICURO: Non espone URL in produzione
    devLog("🔗 API configurato");
  } catch (error) {
    devLog("❌ Errore configurazione:", error.message);
    return;
  }

  // =====================================
  // INIZIALIZZAZIONE
  // =====================================

  function initializeChatbot() {
    devLog("🤖 Inizializzazione chatbot...");

    try {
      if (!CHATBOT_CONFIG.API.ENDPOINT) {
        devLog("❌ API endpoint mancante");
        showAPIConfigError();
        return false;
      }

      devLog("✅ Configurazione valida");

      // Injection CSS base
      injectBaseStyles();

      // Container setup
      let container = document.getElementById("veronica-chatbot-container");
      if (!container) {
        devLog("📦 Creando container...");
        container = document.createElement("div");
        container.id = "veronica-chatbot-container";
        container.className = "veronica-chatbot-floating";
        document.body.appendChild(container);
      }

      // Verifica React
      if (typeof React === "undefined" || typeof ReactDOM === "undefined") {
        devLog("❌ React non disponibile");
        return false;
      }

      devLog("⚛️ Montaggio componente React...");

      // Mount React component
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(VeronicaChatbot));

      devLog("✅ Chatbot inizializzato");

      // Cleanup loading indicator
      const loadingElement = document.getElementById(
        "veronica-chatbot-loading"
      );
      if (loadingElement) {
        setTimeout(() => (loadingElement.style.display = "none"), 1000);
      }

      return true;
    } catch (error) {
      devLog("❌ Errore inizializzazione:", error.message);
      return false;
    }
  }

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  function injectBaseStyles() {
    if (!document.getElementById("veronica-chatbot-base-css")) {
      devLog("🎨 Iniettando CSS base...");
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
      devLog("✅ React disponibile");
      callback();
    } else {
      devLog("⏳ Aspettando React...");
      setTimeout(() => waitForReact(callback), 100);
    }
  }

  // =====================================
  // ENTRY POINT
  // =====================================

  waitForReact(() => {
    try {
      devLog("🔄 Setup cross-page sync...");
      setupCrossPageSync();

      devLog("🚀 Avvio chatbot...");
      const success = initializeChatbot();

      if (success) {
        // Debug tools solo in development
        if (isDevelopmentMode()) {
          devLog("🐛 Inizializzazione debug tools...");
          initDebugTools();
          setupPerformanceMonitoring();
        }

        // ✅ SICURO: Evento senza dati sensibili
        window.dispatchEvent(
          new CustomEvent("veronicaChatbotReady", {
            detail: { status: "ready" },
          })
        );

        devLog("🎉 Chatbot pronto!");
      } else {
        devLog("❌ Inizializzazione fallita");
      }
    } catch (error) {
      devLog("❌ Errore critico:", error.message);

      // Fallback user-friendly senza dettagli tecnici
      const errorContainer = document.createElement("div");
      errorContainer.style.cssText = `
                position: fixed; bottom: 20px; right: 20px;
                background: #fee2e2; color: #dc2626; padding: 12px;
                border-radius: 8px; font-family: sans-serif;
                font-size: 14px; z-index: 999999; max-width: 300px;
            `;
      errorContainer.innerHTML = `
                <strong>Chat temporaneamente non disponibile</strong><br>
                <a href="#" onclick="window.location.reload()" style="color: #dc2626;">Riprova</a>
            `;
      document.body.appendChild(errorContainer);
      setTimeout(() => errorContainer.remove(), 5000);
    }
  });
})();
