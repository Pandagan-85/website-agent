/**
 * Veronica Schembri Chatbot Frontend - v4.0 Modular Architecture
 * FIXED: Risolto problema posizionamento chat
 */

// =====================================
// IMPORTS MODULI SPECIALIZZATI - V4
// =====================================

import {
  CHATBOT_CONFIG,
  getValidAPIEndpoint,
  showAPIConfigError,
  isDevelopmentMode,
  devLog,
  getJSConfig,
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

// ===== IMPORT MODULARE UI COMPONENTS =====
import { VeronicaChatbot } from "./modules/ui-components/index.js";

import {
  setupCrossPageSync,
  coordinateMultipleInstances,
  monitorSyncPerformance,
} from "./modules/cross-page-sync.js";

// ===== IMPORT MODULARE DEBUG =====
import {
  initDebugTools,
  setupPerformanceMonitoring,
} from "./modules/debug/index.js";

// ✅ SOLO IN DEV MODE
devLog("✅ Moduli chatbot v4.0 importati - architettura modulare");

(function () {
  "use strict";

  // =====================================
  // CONFIGURAZIONE INIZIALE
  // =====================================

  try {
    devLog("🔧 Configurazione iniziale v4.0...");
    CHATBOT_CONFIG.API.ENDPOINT = getValidAPIEndpoint();

    // ✅ SICURO: Non espone URL in produzione
    devLog("🔗 API configurato");
  } catch (error) {
    devLog("❌ Errore configurazione:", error.message);
    return;
  }

  // =====================================
  // INIZIALIZZAZIONE MODULI
  // =====================================

  function initializeChatbot() {
    devLog("🤖 Inizializzazione chatbot v4.0...");

    try {
      if (!CHATBOT_CONFIG.API.ENDPOINT) {
        devLog("❌ API endpoint mancante");
        showAPIConfigError();
        return false;
      }

      devLog("✅ Configurazione valida");

      // Il CSS viene caricato da WordPress tramite wp_enqueue_style
      // Non serve iniettarlo via JavaScript

      // Injection CSS di base per il container (FIXED: rimosso position relative)
      if (!document.getElementById("veronica-chatbot-base-css")) {
        const style = document.createElement("style");
        style.id = "veronica-chatbot-base-css";
        style.textContent = `
          #veronica-chatbot-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-sizing: border-box;
          }
        `;
        document.head.appendChild(style);
        devLog("🎨 CSS base iniettato");
      }

      // Setup debug tools (solo in development)
      if (isDevelopmentMode()) {
        initDebugTools();
        setupPerformanceMonitoring();
        devLog("🔧 Debug tools v4.0 attivati");
      }

      // Setup cross-page sync (controlla se abilitato nella config)
      const jsConfig = getJSConfig();
      if (jsConfig.enableCrossPageSync) {
        setupCrossPageSync();
        coordinateMultipleInstances();
        devLog("🔄 Cross-page sync attivato");
      }

      // Render principale componente React
      renderChatbotApp();

      devLog("🎉 Chatbot v4.0 inizializzato con successo!");
      return true;
    } catch (error) {
      console.error("❌ Errore inizializzazione chatbot v4.0:", error);
      return false;
    }
  }

  // =====================================
  // RENDER REACT APP
  // =====================================

  function renderChatbotApp() {
    // Cerca container esistente o crea nuovo
    let container = document.getElementById("veronica-chatbot-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "veronica-chatbot-container";
      // FIXED: Rimossa classe veronica-chatbot-floating per evitare interferenze CSS
      document.body.appendChild(container);
    }

    // Verifica React disponibilità
    if (typeof React === "undefined" || typeof ReactDOM === "undefined") {
      console.error("❌ React/ReactDOM non disponibili");

      // Fallback: mostra errore
      container.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; font-size: 14px; z-index: 10000;">
          ❌ React non disponibile. Verifica la configurazione.
        </div>
      `;
      return;
    }

    // Render componente principale
    const root = ReactDOM.createRoot
      ? ReactDOM.createRoot(container)
      : {
          render: (element) => ReactDOM.render(element, container),
        };

    try {
      // Mount React component
      if (ReactDOM.createRoot) {
        root.render(React.createElement(VeronicaChatbot));
      } else {
        // Fallback per versioni più vecchie di React
        root.render(React.createElement(VeronicaChatbot));
      }

      devLog("⚛️ Componente React montato");

      // Cleanup loading indicator se presente
      const loadingElement = document.getElementById(
        "veronica-chatbot-loading"
      );
      if (loadingElement) {
        setTimeout(() => {
          loadingElement.style.display = "none";
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Errore render React:", error);
      container.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; font-size: 14px; z-index: 10000;">
          ❌ Errore rendering React: ${error.message}
        </div>
      `;
    }
  }

  // =====================================
  // EVENT LISTENERS E CLEANUP
  // =====================================

  // Cleanup su unload pagina
  window.addEventListener("beforeunload", () => {
    devLog("🧹 Cleanup chatbot...");
  });

  // =====================================
  // INIZIALIZZAZIONE AUTOMATICA
  // =====================================

  // Attendi caricamento DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChatbot);
  } else {
    // DOM già caricato
    setTimeout(initializeChatbot, 100);
  }

  // =====================================
  // GESTIONE ERRORI GLOBALI
  // =====================================

  window.addEventListener("error", (event) => {
    if (
      event.filename?.includes("chatbot") ||
      event.message?.includes("veronica")
    ) {
      devLog("❌ Errore chatbot:", event.error);

      // Mostra errore user-friendly solo in development
      if (isDevelopmentMode()) {
        console.group("🐛 Chatbot Error Details");
        console.error("Message:", event.message);
        console.error("File:", event.filename);
        console.error("Line:", event.lineno);
        console.error("Stack:", event.error?.stack);
        console.groupEnd();
      }
    }
  });

  // Export per debugging (solo in development)
  if (isDevelopmentMode()) {
    window.VeronicaChatbotDebug = {
      config: CHATBOT_CONFIG,
      reinitialize: initializeChatbot,
      getConfig: getJSConfig,
    };
    devLog("🔧 Debug interface esposta su window.VeronicaChatbotDebug");
  }
})();
