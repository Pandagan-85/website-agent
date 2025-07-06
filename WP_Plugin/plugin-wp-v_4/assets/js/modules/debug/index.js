/**
 * Debug Module - Index Minimale per v4
 * Solo le funzioni essenziali senza dipendenze esterne
 */

import { isDevelopmentMode, devLog } from "../config.js";

/**
 * Inizializza strumenti di debug
 */
export function initDebugTools() {
  if (isDevelopmentMode()) {
    console.log("🔧 Debug tools v4 inizializzati");

    // Setup oggetto debug globale minimale
    window.VeronicaChatbotDebug = {
      version: "4.0.0",
      showInfo() {
        console.log("ℹ️ Veronica Chatbot v4.0 Debug Info");
      },
      hardReset() {
        if (confirm("Reset completo del chatbot?")) {
          localStorage.clear();
          window.location.reload();
        }
      },
    };

    devLog("🐛 Debug tools disponibili: window.VeronicaChatbotDebug");
  } else {
    devLog("Debug tools disabilitati (production mode)");
  }
}

/**
 * Setup monitoring performance
 */
export function setupPerformanceMonitoring() {
  if (isDevelopmentMode()) {
    console.log("📊 Performance monitoring v4 attivato");

    // Basic performance tracking
    window.VeronicaChatbotPerf = {
      startTime: Date.now(),
      marks: {},

      mark(name) {
        this.marks[name] = Date.now();
        console.log(`⏱️ Performance mark: ${name}`);
      },

      measure(name, startMark) {
        const duration = Date.now() - (this.marks[startMark] || this.startTime);
        console.log(`📏 Performance measure: ${name} = ${duration}ms`);
        return duration;
      },
    };

    devLog("📊 Performance tools disponibili: window.VeronicaChatbotPerf");
  }
}

// ===== STUB FUNCTIONS per evitare errori =====

export function setupErrorTracking() {
  console.log("🔧 Error tracking (stub)");
}

export function logError() {
  console.log("🔧 Log error (stub)");
}

export function getErrorReport() {
  console.log("🔧 Error report (stub)");
}

export function clearErrorLog() {
  console.log("🔧 Clear errors (stub)");
}

export function measureRenderTime() {
  console.log("🔧 Measure render (stub)");
}

export function measureAPITime() {
  console.log("🔧 Measure API (stub)");
}

export function getPerformanceReport() {
  console.log("🔧 Performance report (stub)");
}

export function clearPerformanceData() {
  console.log("🔧 Clear performance (stub)");
}

export function createDevPanel() {
  console.log("🔧 Dev panel (stub)");
}

export function addDevCommand() {
  console.log("🔧 Dev command (stub)");
}

export function logDevEvent() {
  console.log("🔧 Dev event (stub)");
}

export function showStorageStats() {
  console.log("🔧 Storage stats (stub)");
}

export function exportDebugData() {
  console.log("🔧 Export debug (stub)");
}
