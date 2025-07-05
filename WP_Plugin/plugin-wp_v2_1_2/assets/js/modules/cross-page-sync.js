/**
 * Veronica Chatbot - Cross-Page Sync Module
 * Codice estratto da chatbot.js (righe 1700-1800 circa)
 * Gestisce sincronizzazione tra pagine e cleanup sessioni
 */

import { CHATBOT_CONFIG } from "./config.js";
import { ChatStorageManager } from "./storage.js";

// =====================================
// GESTIONE CROSS-PAGE SYNC
// =====================================

export function setupCrossPageSync() {
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
