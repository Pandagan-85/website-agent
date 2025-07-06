/**
 * Veronica Schembri Chatbot Frontend - v4.0 Modular Architecture
 * REFACTORED: Struttura modulare migliorata per manutenibilità
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

      // Injection CSS di base per il container
      if (!document.getElementById("veronica-chatbot-base-css")) {
        const style = document.createElement("style");
        style.id = "veronica-chatbot-base-css";
        style.textContent = `
          #veronica-chatbot-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-sizing: border-box;
          }
          .veronica-chatbot-floating {
            position: relative;
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
      const jsConfig = getJSConfig(); // ← Usa la funzione giusta
      if (jsConfig.enableCrossPageSync) {
        // ← Usa la proprietà giusta
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
    let container = document.getElementById("veronica-chatbot-container"); // ← Usa ID originale
    if (!container) {
      container = document.createElement("div");
      container.id = "veronica-chatbot-container"; // ← ID originale
      container.className = "veronica-chatbot-floating"; // ← Classe originale
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
    const root = ReactDOM.createRoot ? ReactDOM.createRoot(container) : null;

    if (root) {
      // React 18+
      root.render(React.createElement(VeronicaChatbot));
      devLog("⚛️ App React 18+ renderizzata");
    } else {
      // React 17 fallback
      ReactDOM.render(React.createElement(VeronicaChatbot), container);
      devLog("⚛️ App React 17 renderizzata");
    }
  }

  // =====================================
  // AUTO-INIZIALIZZAZIONE
  // =====================================

  // Aspetta DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChatbot);
  } else {
    // DOM già pronto
    initializeChatbot();
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    devLog("👋 Cleanup chatbot v4.0...");

    // Cleanup cross-page sync se attivo
    if (window.VeronicaChatbotSync) {
      window.VeronicaChatbotSync.cleanup?.();
    }

    // Cleanup debug tools se attivi
    if (window.VeronicaChatbotDebug) {
      window.VeronicaChatbotDebug.cleanup?.();
    }
  });

  // =====================================
  // GLOBAL ERROR HANDLING
  // =====================================

  window.addEventListener("error", (e) => {
    if (e.filename && e.filename.includes("chatbot")) {
      console.error("🚨 Chatbot v4.0 Error:", e.error);

      // Log in debug se disponibile
      if (isDevelopmentMode() && window.VeronicaChatbotDebug) {
        window.VeronicaChatbotDebug.logError?.(e.error);
      }
    }
  });
})();
