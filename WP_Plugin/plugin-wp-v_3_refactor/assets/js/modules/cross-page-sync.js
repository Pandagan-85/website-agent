/**
 * Cross-Page Sync Module - Sincronizzazione tra Pagine
 * Estratto da chatbot.js originale (righe 1501-1600 circa)
 * Gestisce sincronizzazione cross-tab, cleanup sessioni e persistenza UI
 */

import { getStorageConfig, isDevelopmentMode, devLog } from "./config.js";
import { ChatStorageManager } from "./storage.js";

// =====================================
// GESTIONE CROSS-PAGE SYNC
// =====================================

/**
 * Setup sincronizzazione cross-page
 * Estratto dalla funzione setupCrossPageSync() originale
 */
export function setupCrossPageSync() {
  const config = getStorageConfig();

  devLog("🔄 Setting up cross-page sync...");

  // Storage event listener per sincronizzazione cross-tab
  window.addEventListener("storage", function (e) {
    // Sync stato UI tra pagine
    if (e.key === config.storageKeys.UI_STATE) {
      devLog("🔄 Sync stato UI da altra pagina");
      // Il componente React si aggiornerà automaticamente al prossimo render

      // Dispatch custom event per notificare i componenti
      window.dispatchEvent(
        new CustomEvent("veronicaChatbotUIStateChanged", {
          detail: { newValue: e.newValue, oldValue: e.oldValue },
        })
      );
    }

    // Sync messaggi tra pagine
    if (e.key === config.storageKeys.MESSAGES) {
      devLog("🔄 Sync messaggi da altra pagina");
      // Il componente React si aggiornerà automaticamente

      // Dispatch custom event per notificare i componenti
      window.dispatchEvent(
        new CustomEvent("veronicaChatbotMessagesChanged", {
          detail: { newValue: e.newValue, oldValue: e.oldValue },
        })
      );
    }

    // Sync sessione tra pagine
    if (e.key === config.storageKeys.SESSION) {
      devLog("🔄 Sync sessione da altra pagina");

      // Dispatch custom event per notificare i componenti
      window.dispatchEvent(
        new CustomEvent("veronicaChatbotSessionChanged", {
          detail: { newValue: e.newValue, oldValue: e.oldValue },
        })
      );
    }
  });

  // Cleanup automatico sessioni scadute (ogni 5 minuti)
  setupAutomaticCleanup();

  // Gestione visibilità pagina per ottimizzazioni
  setupVisibilityChangeHandling();

  // Setup beforeunload per sincronizzazione finale
  setupBeforeUnloadHandling();

  devLog("✅ Cross-page sync configurato");
}

/**
 * Setup cleanup automatico
 * Estratto dalla logica di cleanup del file originale
 */
function setupAutomaticCleanup() {
  const config = getStorageConfig();

  setInterval(() => {
    try {
      const storage = new ChatStorageManager();
      const session = storage.getOrCreateSession();

      // Se la sessione è stata ricreata, significa che era scaduta
      const storedSession = localStorage.getItem(config.storageKeys.SESSION);
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        if (sessionData.sessionId !== session.sessionId) {
          devLog("🧹 Cleanup sessione scaduta eseguito");

          // Dispatch evento di cleanup
          window.dispatchEvent(
            new CustomEvent("veronicaChatbotSessionCleanedup", {
              detail: {
                oldSessionId: sessionData.sessionId,
                newSessionId: session.sessionId,
              },
            })
          );
        }
      }
    } catch (error) {
      console.error("❌ Errore cleanup sessioni:", error);
    }
  }, 5 * 60 * 1000); // 5 minuti
}

/**
 * Setup gestione visibilità pagina
 * Estratto dalla logica di visibility change del file originale
 */
function setupVisibilityChangeHandling() {
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      devLog("👁️ Pagina tornata visibile, sync stato chatbot");

      // Verifica se ci sono stati cambiamenti mentre la pagina era nascosta
      try {
        const storage = new ChatStorageManager();
        const sessionInfo = storage.getSessionInfo();

        // Dispatch evento di riattivazione
        window.dispatchEvent(
          new CustomEvent("veronicaChatbotPageVisible", {
            detail: { sessionInfo: sessionInfo, timestamp: Date.now() },
          })
        );
      } catch (error) {
        console.error("❌ Errore verifica stato al ritorno visibilità:", error);
      }
    } else {
      devLog("👁️ Pagina nascosta, pausa sync attivo");

      // Dispatch evento di pausa
      window.dispatchEvent(
        new CustomEvent("veronicaChatbotPageHidden", {
          detail: { timestamp: Date.now() },
        })
      );
    }
  });
}

/**
 * Setup gestione beforeunload
 * Gestisce sincronizzazione finale prima del reload/chiusura
 */
function setupBeforeUnloadHandling() {
  window.addEventListener("beforeunload", function (e) {
    try {
      // Aggiorna ultima attività prima della chiusura
      const storage = new ChatStorageManager();
      storage.updateSessionActivity();

      devLog("🔄 Stato sincronizzato prima della chiusura pagina");

      // Non mostrare dialog di conferma per il chatbot
      // return undefined;
    } catch (error) {
      console.error("❌ Errore sincronizzazione beforeunload:", error);
    }
  });
}

// =====================================
// GESTIONE MULTI-TAB COORDINATION
// =====================================

/**
 * Coordina stato tra multiple tab
 * Funzione estratta dalla logica di coordinamento originale
 */
export function coordinateMultipleInstances() {
  const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const config = getStorageConfig();

  // Registra questa tab come attiva
  const activeTabs = JSON.parse(
    localStorage.getItem("veronica_chatbot_active_tabs") || "[]"
  );
  activeTabs.push({
    tabId: tabId,
    timestamp: Date.now(),
    url: window.location.href,
  });

  // Mantieni solo tab attive (ultime 10 minuti)
  const cutoff = Date.now() - 10 * 60 * 1000;
  const recentTabs = activeTabs.filter((tab) => tab.timestamp > cutoff);

  localStorage.setItem(
    "veronica_chatbot_active_tabs",
    JSON.stringify(recentTabs)
  );

  devLog("🗂️ Tab registrata per coordinamento:", {
    tabId: tabId,
    totalTabs: recentTabs.length,
  });

  // Cleanup al caricamento pagina
  window.addEventListener("beforeunload", () => {
    try {
      const currentTabs = JSON.parse(
        localStorage.getItem("veronica_chatbot_active_tabs") || "[]"
      );
      const filteredTabs = currentTabs.filter((tab) => tab.tabId !== tabId);
      localStorage.setItem(
        "veronica_chatbot_active_tabs",
        JSON.stringify(filteredTabs)
      );
    } catch (error) {
      console.error("❌ Errore cleanup tab:", error);
    }
  });

  return tabId;
}

/**
 * Verifica se questa è la tab master
 * Determina quale tab dovrebbe gestire operazioni globali
 */
export function isMasterTab() {
  try {
    const activeTabs = JSON.parse(
      localStorage.getItem("veronica_chatbot_active_tabs") || "[]"
    );
    const cutoff = Date.now() - 10 * 60 * 1000;
    const recentTabs = activeTabs.filter((tab) => tab.timestamp > cutoff);

    // La tab più vecchia è la master
    if (recentTabs.length === 0) return true;

    const oldestTab = recentTabs.reduce((oldest, current) =>
      current.timestamp < oldest.timestamp ? current : oldest
    );

    // Se siamo l'unica tab o la più vecchia, siamo master
    return recentTabs.length === 1 || oldestTab.url === window.location.href;
  } catch (error) {
    console.error("❌ Errore verifica master tab:", error);
    return true; // Default a master in caso di errore
  }
}

// =====================================
// SYNC HELPERS
// =====================================

/**
 * Forza sincronizzazione immediata
 * Utility per forzare sync quando necessario
 */
export function forceSyncNow() {
  try {
    const storage = new ChatStorageManager();

    // Aggiorna timestamp di attività
    storage.updateSessionActivity();

    // Dispatch evento di sync forzato
    window.dispatchEvent(
      new CustomEvent("veronicaChatbotForcedSync", {
        detail: {
          timestamp: Date.now(),
          action: "manual_sync",
        },
      })
    );

    devLog("🔄 Sincronizzazione forzata completata");
    return true;
  } catch (error) {
    console.error("❌ Errore sync forzato:", error);
    return false;
  }
}

/**
 * Ottieni stato di sincronizzazione
 * Utility per debugging dello stato sync
 */
export function getSyncStatus() {
  try {
    const config = getStorageConfig();
    const storage = new ChatStorageManager();
    const sessionInfo = storage.getSessionInfo();

    const activeTabs = JSON.parse(
      localStorage.getItem("veronica_chatbot_active_tabs") || "[]"
    );
    const cutoff = Date.now() - 10 * 60 * 1000;
    const recentTabs = activeTabs.filter((tab) => tab.timestamp > cutoff);

    return {
      enabled: config.enableCrossPageSync,
      storage: {
        available: storage.isStorageAvailable,
        keys: config.storageKeys,
      },
      session: sessionInfo.session,
      tabs: {
        total: recentTabs.length,
        isMaster: isMasterTab(),
        current: window.location.href,
      },
      lastSync: Date.now(),
    };
  } catch (error) {
    return {
      error: error.message,
      enabled: false,
    };
  }
}

/**
 * Resetta sincronizzazione
 * Utility per reset completo dello stato di sync
 */
export function resetSyncState() {
  try {
    // Pulisci dati tabs
    localStorage.removeItem("veronica_chatbot_active_tabs");

    // Resetta storage manager
    const storage = new ChatStorageManager();
    storage.resetSession();

    // Dispatch evento di reset
    window.dispatchEvent(
      new CustomEvent("veronicaChatbotSyncReset", {
        detail: { timestamp: Date.now() },
      })
    );

    devLog("🔄 Stato sincronizzazione resettato");
    return true;
  } catch (error) {
    console.error("❌ Errore reset sync:", error);
    return false;
  }
}

// =====================================
// EVENT LISTENERS HELPERS
// =====================================

/**
 * Setup listener per eventi di sync
 * Helper per componenti che vogliono ascoltare eventi di sync
 */
export function setupSyncEventListeners(callbacks = {}) {
  const events = [
    "veronicaChatbotUIStateChanged",
    "veronicaChatbotMessagesChanged",
    "veronicaChatbotSessionChanged",
    "veronicaChatbotSessionCleanedup",
    "veronicaChatbotPageVisible",
    "veronicaChatbotPageHidden",
    "veronicaChatbotForcedSync",
    "veronicaChatbotSyncReset",
  ];

  const listeners = [];

  events.forEach((eventType) => {
    const callback =
      callbacks[eventType] ||
      function (e) {
        devLog(`📡 Sync event: ${eventType}`, e.detail);
      };

    window.addEventListener(eventType, callback);
    listeners.push({ eventType, callback });
  });

  // Ritorna funzione per cleanup
  return function cleanup() {
    listeners.forEach(({ eventType, callback }) => {
      window.removeEventListener(eventType, callback);
    });
    devLog("🧹 Sync event listeners rimossi");
  };
}

/**
 * Notifica cambiamento stato a tutte le tab
 * Helper per notificare cambiamenti di stato
 */
export function notifyStateChange(stateType, newValue, metadata = {}) {
  try {
    const config = getStorageConfig();

    // Aggiorna localStorage per triggerare storage event
    const key = config.storageKeys[stateType.toUpperCase()];
    if (key) {
      localStorage.setItem(key, JSON.stringify(newValue));
    }

    // Dispatch anche evento locale per consistenza
    window.dispatchEvent(
      new CustomEvent(`veronicaChatbot${stateType}Changed`, {
        detail: { newValue, metadata, timestamp: Date.now() },
      })
    );

    devLog(`📡 Stato ${stateType} notificato a tutte le tab`);
    return true;
  } catch (error) {
    console.error(`❌ Errore notifica ${stateType}:`, error);
    return false;
  }
}

// =====================================
// PERFORMANCE MONITORING
// =====================================

/**
 * Monitor performance della sincronizzazione
 * Utility per monitoraggio performance
 */
export function monitorSyncPerformance() {
  let syncCount = 0;
  let lastSyncTime = Date.now();
  const syncTimes = [];

  // Monitor eventi di storage
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    const startTime = performance.now();

    const result = originalSetItem.call(this, key, value);

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (key.startsWith("veronica_chatbot_")) {
      syncCount++;
      syncTimes.push(duration);
      lastSyncTime = Date.now();

      if (isDevelopmentMode() && syncCount % 10 === 0) {
        const avgTime = syncTimes.reduce((a, b) => a + b, 0) / syncTimes.length;
        devLog(
          `📊 Sync Performance - Count: ${syncCount}, Avg: ${avgTime.toFixed(
            2
          )}ms`
        );
      }
    }

    return result;
  };

  // Ritorna statistiche
  return function getStats() {
    const avgTime =
      syncTimes.length > 0
        ? syncTimes.reduce((a, b) => a + b, 0) / syncTimes.length
        : 0;

    return {
      totalSyncs: syncCount,
      averageTime: avgTime,
      lastSync: lastSyncTime,
      recentTimes: syncTimes.slice(-10), // Ultime 10 sincronizzazioni
    };
  };
}
