/**
 * Debug Tools Module - Utilities di Debug e Sviluppo
 * Estratto da chatbot.js originale (righe 1601-1800 circa)
 * Utilities di debug disponibili solo in development mode
 */

import { getJSConfig, isDevelopmentMode, devLog } from "./config.js";
import { ChatStorageManager } from "./storage.js";
import { getSyncStatus, resetSyncState } from "./cross-page-sync.js";

// =====================================
// DEBUGGING E UTILITIES
// =====================================

/**
 * Inizializza strumenti di debug
 * Estratto dalla logica di debug del file originale
 */
export function initDebugTools() {
  // Funzioni globali per debugging (solo in dev)
  if (isDevelopmentMode()) {
    // Oggetto debug globale
    window.VeronicaChatbotDebug = {
      /**
       * Mostra info sessione corrente
       * Estratto dal metodo showSessionInfo() originale
       */
      showSessionInfo() {
        const storage = new ChatStorageManager();
        const sessionInfo = storage.getSessionInfo();
        const config = getJSConfig();
        const syncStatus = getSyncStatus();

        console.group("🐛 Veronica Chatbot Debug Info v3.0");
        console.log("📊 Sessione:", {
          sessionId: sessionInfo.session.sessionId,
          created: new Date(sessionInfo.session.created),
          lastActivity: new Date(sessionInfo.session.lastActivity),
          messageCount: sessionInfo.session.messageCount,
          pageViews: sessionInfo.session.pageViews,
          age: `${Math.round(sessionInfo.session.age / (1000 * 60 * 60))} ore`,
          isExpired: sessionInfo.session.age > config.sessionDuration,
        });

        console.log("💬 Storage:", {
          messageCount: sessionInfo.storage.messageCount,
          messagesSize: `${sessionInfo.storage.messagesSize} bytes`,
          storageAvailable: sessionInfo.storage.storageAvailable,
          uiState: sessionInfo.storage.uiState,
        });

        console.log("🔄 Sincronizzazione:", syncStatus);

        console.log("⚙️ Configurazione:", config);

        console.log("🌐 Ambiente:", {
          userAgent: navigator.userAgent.substring(0, 100),
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
          cookiesEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
        });

        console.groupEnd();
      },

      /**
       * Reset manuale completo
       * Estratto dal metodo hardReset() originale
       */
      hardReset() {
        if (confirm("⚠️ HARD RESET: Cancellare TUTTI i dati del chatbot?")) {
          const storage = new ChatStorageManager();
          storage.resetSession();
          resetSyncState();

          // Force reload per reinizializzare tutto
          console.log("🔄 Hard reset completato, ricaricando pagina...");
          window.location.reload();
        }
      },

      /**
       * Test connessione API
       * Estratto dal metodo testAPI() originale
       */
      async testAPI() {
        const config = getJSConfig();
        const apiUrl = config.apiUrl;

        console.log("🔗 Testing API connection to:", apiUrl);

        try {
          const testMessage = "Test connessione API da debug console v3.0";
          const testThreadId = `debug_${Date.now()}`;

          const startTime = performance.now();

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: testMessage,
              thread_id: testThreadId,
            }),
            signal: AbortSignal.timeout(10000),
          });

          const endTime = performance.now();
          const responseTime = Math.round(endTime - startTime);

          console.log("🔗 API Test Result:", {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
            url: apiUrl,
            responseTime: `${responseTime}ms`,
            headers: Object.fromEntries(response.headers.entries()),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("📥 Response data:", data);
            console.log("✅ API connection successful!");

            return {
              success: true,
              responseTime: responseTime,
              data: data,
            };
          } else {
            const errorText = await response.text();
            console.error("❌ API error response:", errorText);

            return {
              success: false,
              error: `HTTP ${response.status}: ${errorText}`,
              responseTime: responseTime,
            };
          }
        } catch (error) {
          console.error("❌ API Test failed:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });

          return {
            success: false,
            error: error.message,
          };
        }
      },

      /**
       * Simula errori per testing
       * Estratto dal metodo simulateStorageError() originale
       */
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

      /**
       * Mostra statistiche storage
       * Estratto dal metodo showStorageStats() originale
       */
      showStorageStats() {
        const storage = new ChatStorageManager();
        const stats = storage.getStorageStats();

        if (!stats.available) {
          console.log("❌ localStorage non disponibile");
          return;
        }

        console.group("💾 Storage Statistics");
        console.log(
          "Total localStorage size:",
          `${stats.totalSize} bytes (${(stats.totalSize / 1024).toFixed(2)} KB)`
        );
        console.log(
          "Chatbot data size:",
          `${stats.chatbotSize} bytes (${(stats.chatbotSize / 1024).toFixed(
            2
          )} KB)`
        );
        console.log("Chatbot keys:", stats.chatbotKeys);
        console.log("Chatbot percentage:", `${stats.percentage.toFixed(2)}%`);
        console.log(
          "Estimated remaining space:",
          `${stats.estimatedRemaining} bytes (${(
            stats.estimatedRemaining / 1024
          ).toFixed(2)} KB)`
        );

        if (stats.estimatedRemaining < 100000) {
          // < 100KB
          console.warn("⚠️ Storage space running low!");
        }

        console.groupEnd();

        return stats;
      },

      /**
       * Esporta dati chatbot per backup
       * Estratto dal metodo exportData() originale
       */
      exportData() {
        const storage = new ChatStorageManager();
        const config = getJSConfig();
        const syncStatus = getSyncStatus();

        const exportData = {
          metadata: {
            timestamp: new Date().toISOString(),
            version: "3.0.0",
            userAgent: navigator.userAgent,
            url: window.location.href,
          },
          chatbot: storage.exportData(),
          config: config,
          sync: syncStatus,
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `veronica-chatbot-v3-backup-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);
        console.log("📦 Dati chatbot v3.0 esportati");

        return exportData;
      },

      /**
       * Importa dati chatbot da backup
       * Estratto dal metodo importData() originale
       */
      importData(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          try {
            const importData = JSON.parse(e.target.result);
            const storage = new ChatStorageManager();

            // Validazione versione
            if (
              importData.metadata?.version &&
              importData.metadata.version !== "3.0.0"
            ) {
              console.warn(
                "⚠️ Importing data from different version:",
                importData.metadata.version
              );
            }

            // Importa dati chatbot
            if (importData.chatbot) {
              const success = storage.importData(importData.chatbot);
              if (success) {
                console.log("📥 Dati chatbot importati con successo");
              } else {
                console.error("❌ Errore importazione dati chatbot");
                return;
              }
            }

            console.log(
              "📥 Dati importati, ricarica la pagina per vedere i cambiamenti"
            );
            console.log("Dati importati:", importData);

            if (confirm("Dati importati. Ricaricare la pagina?")) {
              window.location.reload();
            }
          } catch (error) {
            console.error("❌ Errore importazione:", error);
          }
        };
        reader.readAsText(file);
      },

      /**
       * Benchmark performance
       * Nuovo metodo per test performance
       */
      async benchmarkPerformance() {
        console.log("🏃‍♂️ Avvio benchmark performance...");

        const storage = new ChatStorageManager();
        const results = {};

        // Test storage speed
        console.time("Storage Write");
        for (let i = 0; i < 100; i++) {
          storage.addMessage({
            content: `Test message ${i}`,
            sender: "user",
            timestamp: Date.now(),
          });
        }
        console.timeEnd("Storage Write");

        // Test storage read
        console.time("Storage Read");
        for (let i = 0; i < 100; i++) {
          storage.loadMessages();
        }
        console.timeEnd("Storage Read");

        // Test API simulation
        if (confirm("Testare anche performance API? (richiesta reale)")) {
          console.time("API Request");
          try {
            await this.testAPI();
            console.timeEnd("API Request");
          } catch (error) {
            console.timeEnd("API Request");
            console.error("API test failed:", error);
          }
        }

        console.log("📊 Benchmark completato");
      },

      /**
       * Monitora eventi in tempo reale
       * Nuovo metodo per monitoring eventi
       */
      monitorEvents(duration = 30000) {
        const events = [
          "veronicaChatbotUIStateChanged",
          "veronicaChatbotMessagesChanged",
          "veronicaChatbotSessionChanged",
          "veronicaChatbotPageVisible",
          "veronicaChatbotPageHidden",
        ];

        const eventCounts = {};
        const listeners = [];

        console.log(`📡 Monitoring eventi per ${duration / 1000} secondi...`);
        console.log("Eventi monitorati:", events);

        events.forEach((eventType) => {
          eventCounts[eventType] = 0;

          const listener = (e) => {
            eventCounts[eventType]++;
            console.log(`📡 ${eventType}:`, e.detail);
          };

          window.addEventListener(eventType, listener);
          listeners.push({ eventType, listener });
        });

        // Stop monitoring dopo duration
        setTimeout(() => {
          listeners.forEach(({ eventType, listener }) => {
            window.removeEventListener(eventType, listener);
          });

          console.group("📊 Event Monitoring Results");
          console.log(`Durata: ${duration / 1000} secondi`);
          console.log("Eventi rilevati:", eventCounts);

          const totalEvents = Object.values(eventCounts).reduce(
            (a, b) => a + b,
            0
          );
          console.log(`Totale eventi: ${totalEvents}`);
          console.log(
            `Media eventi/secondo: ${(totalEvents / (duration / 1000)).toFixed(
              2
            )}`
          );
          console.groupEnd();
        }, duration);
      },

      /**
       * Analizza memoria utilizzata
       * Nuovo metodo per analisi memoria
       */
      analyzeMemoryUsage() {
        if (performance.memory) {
          const memory = performance.memory;

          console.group("🧠 Memory Usage Analysis");
          console.log(
            "Used JS Heap Size:",
            `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`
          );
          console.log(
            "Total JS Heap Size:",
            `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`
          );
          console.log(
            "JS Heap Size Limit:",
            `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
          );

          const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
          console.log(`Memory Usage: ${usage.toFixed(2)}%`);

          if (usage > 80) {
            console.warn("⚠️ High memory usage detected!");
          }

          console.groupEnd();

          return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            usagePercent: usage,
          };
        } else {
          console.log("❌ Performance.memory not available in this browser");
          return null;
        }
      },

      /**
       * Test stress del sistema
       * Nuovo metodo per stress testing
       */
      stressTest(iterations = 1000) {
        console.log(`🔥 Avvio stress test con ${iterations} iterazioni...`);

        const storage = new ChatStorageManager();
        const startTime = performance.now();
        let errors = 0;

        for (let i = 0; i < iterations; i++) {
          try {
            // Simula operazioni intensive
            storage.addMessage({
              content: `Stress test message ${i} - ${Math.random().toString(
                36
              )}`,
              sender: i % 2 === 0 ? "user" : "bot",
              timestamp: Date.now() + i,
            });

            // Ogni 100 iterazioni, carica messaggi
            if (i % 100 === 0) {
              storage.loadMessages();
              storage.getSessionInfo();
            }
          } catch (error) {
            errors++;
            if (errors === 1) {
              console.error("❌ Primo errore durante stress test:", error);
            }
          }
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.group("🔥 Stress Test Results");
        console.log(`Iterazioni: ${iterations}`);
        console.log(`Durata: ${duration.toFixed(2)}ms`);
        console.log(
          `Media per operazione: ${(duration / iterations).toFixed(2)}ms`
        );
        console.log(
          `Errori: ${errors} (${((errors / iterations) * 100).toFixed(2)}%)`
        );
        console.log(
          `Operazioni/secondo: ${((iterations / duration) * 1000).toFixed(2)}`
        );
        console.groupEnd();

        return {
          iterations,
          duration,
          errors,
          avgTimePerOp: duration / iterations,
          opsPerSecond: (iterations / duration) * 1000,
        };
      },

      /**
       * Pulisci tutto per testing
       * Nuovo metodo per pulizia completa
       */
      cleanAll() {
        if (confirm("🧹 Pulire tutti i dati per testing?")) {
          // Pulisci localStorage chatbot
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("veronica_chatbot_")) {
              localStorage.removeItem(key);
            }
          });

          // Reset sync state
          resetSyncState();

          console.log("🧹 Tutti i dati del chatbot puliti");

          if (confirm("Ricaricare la pagina?")) {
            window.location.reload();
          }
        }
      },

      /**
       * Ottieni report diagnostico completo
       * Nuovo metodo per diagnostica completa
       */
      getDiagnosticReport() {
        const storage = new ChatStorageManager();
        const config = getJSConfig();
        const syncStatus = getSyncStatus();
        const storageStats = this.showStorageStats();
        const memoryInfo = this.analyzeMemoryUsage();

        const report = {
          timestamp: new Date().toISOString(),
          version: "3.0.0",
          environment: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            url: window.location.href,
          },
          config: config,
          session: storage.getSessionInfo(),
          sync: syncStatus,
          storage: storageStats,
          memory: memoryInfo,
          performance: {
            timing: performance.timing,
            navigation: performance.navigation,
          },
        };

        console.group("🔍 Diagnostic Report");
        console.log("Report completo:", report);
        console.groupEnd();

        return report;
      },
    };

    // Log disponibilità debug tools
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
    console.log(
      "  • VeronicaChatbotDebug.benchmarkPerformance() - Test performance"
    );
    console.log(
      "  • VeronicaChatbotDebug.monitorEvents(30000) - Monitor eventi"
    );
    console.log(
      "  • VeronicaChatbotDebug.analyzeMemoryUsage() - Analisi memoria"
    );
    console.log("  • VeronicaChatbotDebug.stressTest(1000) - Stress test");
    console.log(
      "  • VeronicaChatbotDebug.getDiagnosticReport() - Report diagnostico"
    );
    console.log("  • VeronicaChatbotDebug.cleanAll() - Pulisci tutto");
  } else {
    devLog("Debug tools non disponibili (non in development mode)");
  }
}

// =====================================
// ERROR TRACKING E REPORTING
// =====================================

/**
 * Setup tracking errori globale
 * Nuovo sistema per tracking errori
 */
export function setupErrorTracking() {
  if (!isDevelopmentMode()) return;

  const errors = [];

  // Global error handler
  window.addEventListener("error", (e) => {
    if (e.filename && e.filename.includes("chatbot")) {
      const errorInfo = {
        timestamp: Date.now(),
        type: "javascript_error",
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
        url: window.location.href,
      };

      errors.push(errorInfo);
      console.error("🐛 Chatbot Error Tracked:", errorInfo);

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.shift();
      }
    }
  });

  // Unhandled promise rejection handler
  window.addEventListener("unhandledrejection", (e) => {
    if (e.reason && e.reason.toString().includes("chatbot")) {
      const errorInfo = {
        timestamp: Date.now(),
        type: "promise_rejection",
        reason: e.reason.toString(),
        stack: e.reason?.stack,
        url: window.location.href,
      };

      errors.push(errorInfo);
      console.error("🐛 Chatbot Promise Rejection Tracked:", errorInfo);

      if (errors.length > 50) {
        errors.shift();
      }
    }
  });

  // Expose errors via debug object
  if (window.VeronicaChatbotDebug) {
    window.VeronicaChatbotDebug.getErrors = () => {
      console.group("🐛 Tracked Errors");
      console.log(`Total errors: ${errors.length}`);
      errors.forEach((error, index) => {
        console.log(
          `${index + 1}.`,
          new Date(error.timestamp).toISOString(),
          error
        );
      });
      console.groupEnd();

      return errors;
    };

    window.VeronicaChatbotDebug.clearErrors = () => {
      errors.length = 0;
      console.log("🧹 Error tracking cleared");
    };
  }

  devLog("🐛 Error tracking attivato");
}

// =====================================
// PERFORMANCE MONITORING
// =====================================

/**
 * Setup monitoring performance
 * Sistema per monitoraggio performance in development
 */
export function setupPerformanceMonitoring() {
  if (!isDevelopmentMode()) return;

  const metrics = {
    apiCalls: [],
    storageOps: [],
    renders: [],
  };

  // Monitor fetch calls
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const startTime = performance.now();
    const url = args[0];

    try {
      const response = await originalFetch.apply(this, args);
      const endTime = performance.now();

      if (url.includes && (url.includes("chat") || url.includes("api"))) {
        metrics.apiCalls.push({
          timestamp: Date.now(),
          url: url,
          method: args[1]?.method || "GET",
          duration: endTime - startTime,
          status: response.status,
          ok: response.ok,
        });

        // Keep only last 100 calls
        if (metrics.apiCalls.length > 100) {
          metrics.apiCalls.shift();
        }
      }

      return response;
    } catch (error) {
      const endTime = performance.now();

      if (url.includes && (url.includes("chat") || url.includes("api"))) {
        metrics.apiCalls.push({
          timestamp: Date.now(),
          url: url,
          method: args[1]?.method || "GET",
          duration: endTime - startTime,
          error: error.message,
        });
      }

      throw error;
    }
  };

  // Expose metrics via debug object
  if (window.VeronicaChatbotDebug) {
    window.VeronicaChatbotDebug.getPerformanceMetrics = () => {
      const avgApiTime =
        metrics.apiCalls.length > 0
          ? metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0) /
            metrics.apiCalls.length
          : 0;

      const successfulCalls = metrics.apiCalls.filter(
        (call) => call.ok || call.status === 200
      ).length;
      const successRate =
        metrics.apiCalls.length > 0
          ? (successfulCalls / metrics.apiCalls.length) * 100
          : 0;

      console.group("📊 Performance Metrics");
      console.log(`API Calls: ${metrics.apiCalls.length}`);
      console.log(`Average API Time: ${avgApiTime.toFixed(2)}ms`);
      console.log(`Success Rate: ${successRate.toFixed(2)}%`);
      console.log("Recent API calls:", metrics.apiCalls.slice(-10));
      console.groupEnd();

      return {
        apiCalls: metrics.apiCalls,
        averageApiTime: avgApiTime,
        successRate: successRate,
      };
    };
  }

  devLog("📊 Performance monitoring attivato");
}
