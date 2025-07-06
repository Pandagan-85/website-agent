/**
 * Debug Tools Module - v4 Compatible
 * Funzioni di debug essenziali per il chatbot
 */

import { isDevelopmentMode, devLog } from "./config.js";

/**
 * Inizializza strumenti di debug
 */
export function initDebugTools() {
  if (isDevelopmentMode()) {
    console.log("🔧 Debug tools v4 inizializzati");

    // Setup oggetto debug globale
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
