/**
 * Veronica Chatbot - Debug Tools Module
 * Codice estratto da chatbot.js (righe 1800-2000 circa)
 * Utilities di debug disponibili solo in development
 */

import { CHATBOT_CONFIG } from "./config.js";
import { ChatStorageManager } from "./storage.js";

// =====================================
// DEBUGGING E UTILITIES
// =====================================

export function initDebugTools() {
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
}
