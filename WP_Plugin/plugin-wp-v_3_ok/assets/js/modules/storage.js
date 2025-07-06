/**
 * Storage Module - ChatStorageManager Class
 * Estratto da chatbot.js originale (righe 151-400 circa)
 * Gestisce localStorage, sessioni utente e persistenza messaggi
 */

import { CHATBOT_CONFIG, getStorageConfig, devLog } from "./config.js";

// =====================================
// CHAT STORAGE MANAGER CLASS
// =====================================

/**
 * ChatStorageManager Class
 * Estratta completamente dal file originale
 */
export class ChatStorageManager {
  constructor() {
    this.isStorageAvailable = this.checkStorageAvailability();
    this.config = getStorageConfig();

    devLog("💾 ChatStorageManager inizializzato:", {
      storageAvailable: this.isStorageAvailable,
      config: this.config,
    });
  }

  /**
   * Controlla disponibilità localStorage
   * Estratto dal metodo checkStorageAvailability() originale
   */
  checkStorageAvailability() {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn(
        "💾 LocalStorage non disponibile, usando memoria temporanea"
      );
      return false;
    }
  }

  // =====================================
  // GESTIONE SESSIONE
  // =====================================

  /**
   * Ottieni o crea sessione
   * Estratto dal metodo getOrCreateSession() originale
   */
  getOrCreateSession() {
    if (!this.isStorageAvailable) {
      return this.createNewSession();
    }

    try {
      const stored = localStorage.getItem(this.config.storageKeys.SESSION);
      const now = Date.now();

      if (stored) {
        const sessionData = JSON.parse(stored);
        const sessionAge = now - sessionData.created;
        const lastActivity = now - sessionData.lastActivity;

        // Reset se troppo vecchia o inattiva
        if (
          sessionAge > this.config.sessionDuration ||
          lastActivity > this.config.conversationTimeout
        ) {
          devLog("🔄 Reset sessione per timeout");
          return this.createNewSession();
        }

        // Aggiorna last activity
        sessionData.lastActivity = now;
        this.saveSession(sessionData);
        return sessionData;
      }

      return this.createNewSession();
    } catch (error) {
      console.error("❌ Errore recupero sessione:", error);
      return this.createNewSession();
    }
  }

  /**
   * Crea nuova sessione
   * Estratto dal metodo createNewSession() originale
   */
  createNewSession() {
    const sessionData = {
      sessionId: `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      created: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      pageViews: 1,
    };

    this.saveSession(sessionData);
    devLog("✨ Nuova sessione creata:", sessionData.sessionId);
    return sessionData;
  }

  /**
   * Salva sessione
   * Estratto dal metodo saveSession() originale
   */
  saveSession(sessionData) {
    if (!this.isStorageAvailable) return;

    try {
      localStorage.setItem(
        this.config.storageKeys.SESSION,
        JSON.stringify(sessionData)
      );
    } catch (error) {
      console.error("❌ Errore salvataggio sessione:", error);
    }
  }

  /**
   * Aggiorna attività sessione
   * Estratto dal metodo updateSessionActivity() originale
   */
  updateSessionActivity() {
    if (!this.isStorageAvailable) return;

    try {
      const stored = localStorage.getItem(this.config.storageKeys.SESSION);
      if (stored) {
        const sessionData = JSON.parse(stored);
        sessionData.lastActivity = Date.now();
        sessionData.messageCount = (sessionData.messageCount || 0) + 1;
        this.saveSession(sessionData);
      }
    } catch (error) {
      console.error("❌ Errore aggiornamento attività:", error);
    }
  }

  /**
   * Reset sessione
   * Estratto dal metodo resetSession() originale
   */
  resetSession() {
    if (this.isStorageAvailable) {
      localStorage.removeItem(this.config.storageKeys.SESSION);
      localStorage.removeItem(this.config.storageKeys.MESSAGES);
      localStorage.removeItem(this.config.storageKeys.UI_STATE);
    }
    return this.createNewSession();
  }

  // =====================================
  // GESTIONE MESSAGGI
  // =====================================

  /**
   * Carica messaggi
   * Estratto dal metodo loadMessages() originale
   */
  loadMessages() {
    if (!this.isStorageAvailable) return [];

    try {
      const stored = localStorage.getItem(this.config.storageKeys.MESSAGES);
      if (stored) {
        const messages = JSON.parse(stored);

        // ✅ SEMPLIFICATO: Carica messaggi così come sono, senza elaborazioni
        if (
          Array.isArray(messages) &&
          messages.length <= this.config.maxMessages
        ) {
          devLog("📥 Loaded", messages.length, "messages from storage");
          return messages;
        }
      }
    } catch (error) {
      console.error("❌ Errore caricamento messaggi:", error);
    }

    return [];
  }

  /**
   * Salva messaggi
   * Estratto dal metodo saveMessages() originale
   */
  saveMessages(messages) {
    if (!this.isStorageAvailable) return;

    try {
      // Limita numero messaggi per evitare overflow storage
      const limitedMessages = messages.slice(-this.config.maxMessages);
      localStorage.setItem(
        this.config.storageKeys.MESSAGES,
        JSON.stringify(limitedMessages)
      );
    } catch (error) {
      console.error("❌ Errore salvataggio messaggi:", error);
      // Se storage pieno, rimuovi messaggi più vecchi
      if (error.name === "QuotaExceededError") {
        const reducedMessages = messages.slice(
          -Math.floor(this.config.maxMessages / 2)
        );
        this.saveMessages(reducedMessages);
      }
    }
  }

  /**
   * Aggiungi messaggio
   * Estratto dal metodo addMessage() originale
   */
  addMessage(message) {
    const messages = this.loadMessages();

    const newMessage = {
      id:
        message.id ||
        `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      content: message.content || message.text || "",
      sender: message.sender,
      timestamp: message.timestamp || Date.now(),
      isError: message.isError || false,
    };

    // NON processare qui - lascia che sia il rendering a farlo
    devLog(
      "💾 Saving message:",
      newMessage.sender,
      newMessage.content.substring(0, 50)
    );

    messages.push(newMessage);
    this.saveMessages(messages);
    return newMessage;
  }

  // =====================================
  // GESTIONE STATO UI
  // =====================================

  /**
   * Carica stato UI
   * Estratto dal metodo loadUIState() originale
   */
  loadUIState() {
    if (!this.isStorageAvailable) {
      return { isOpen: false, isMinimized: false };
    }

    try {
      const stored = localStorage.getItem(this.config.storageKeys.UI_STATE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("❌ Errore caricamento stato UI:", error);
    }

    return { isOpen: false, isMinimized: false };
  }

  /**
   * Salva stato UI
   * Estratto dal metodo saveUIState() originale
   */
  saveUIState(state) {
    if (!this.isStorageAvailable) return;

    try {
      localStorage.setItem(
        this.config.storageKeys.UI_STATE,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error("❌ Errore salvataggio stato UI:", error);
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  /**
   * Ottieni informazioni sessione corrente
   */
  getSessionInfo() {
    const session = this.getOrCreateSession();
    const messages = this.loadMessages();
    const uiState = this.loadUIState();

    return {
      session: {
        ...session,
        age: Date.now() - session.created,
        lastActivityAgo: Date.now() - session.lastActivity,
      },
      storage: {
        messageCount: messages.length,
        messagesSize: JSON.stringify(messages).length,
        uiState: uiState,
        storageAvailable: this.isStorageAvailable,
      },
      config: this.config,
    };
  }

  /**
   * Pulisci dati scaduti
   */
  cleanupExpiredData() {
    const session = this.getOrCreateSession();
    const now = Date.now();

    // Se la sessione è scaduta, reset automatico
    const sessionAge = now - session.created;
    const lastActivity = now - session.lastActivity;

    if (
      sessionAge > this.config.sessionDuration ||
      lastActivity > this.config.conversationTimeout
    ) {
      devLog("🧹 Cleanup: Sessione scaduta, reset automatico");
      return this.resetSession();
    }

    return session;
  }

  /**
   * Ottieni statistiche storage
   */
  getStorageStats() {
    if (!this.isStorageAvailable) {
      return { available: false };
    }

    let totalSize = 0;
    let chatbotSize = 0;
    let chatbotKeys = 0;

    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const size = localStorage[key].length;
          totalSize += size;

          if (key.startsWith("veronica_chatbot_")) {
            chatbotSize += size;
            chatbotKeys++;
          }
        }
      }

      return {
        available: true,
        totalSize: totalSize,
        chatbotSize: chatbotSize,
        chatbotKeys: chatbotKeys,
        percentage: totalSize > 0 ? (chatbotSize / totalSize) * 100 : 0,
        estimatedRemaining: 5 * 1024 * 1024 - totalSize, // Assume 5MB limit
      };
    } catch (error) {
      return {
        available: true,
        error: error.message,
      };
    }
  }

  /**
   * Esporta dati per backup
   */
  exportData() {
    return {
      session: this.getOrCreateSession(),
      messages: this.loadMessages(),
      uiState: this.loadUIState(),
      timestamp: Date.now(),
      version: "3.0.0",
    };
  }

  /**
   * Importa dati da backup
   */
  importData(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid import data");
    }

    try {
      if (data.session) {
        this.saveSession(data.session);
      }
      if (data.messages) {
        this.saveMessages(data.messages);
      }
      if (data.uiState) {
        this.saveUIState(data.uiState);
      }

      devLog("📥 Dati importati con successo");
      return true;
    } catch (error) {
      console.error("❌ Errore importazione dati:", error);
      return false;
    }
  }

  /**
   * Verifica integrità dati
   */
  verifyDataIntegrity() {
    const issues = [];

    try {
      // Verifica sessione
      const session = this.getOrCreateSession();
      if (!session.sessionId || !session.created) {
        issues.push("Invalid session data");
      }

      // Verifica messaggi
      const messages = this.loadMessages();
      if (messages.some((msg) => !msg.id || !msg.sender)) {
        issues.push("Invalid message data");
      }

      // Verifica UI state
      const uiState = this.loadUIState();
      if (typeof uiState !== "object") {
        issues.push("Invalid UI state data");
      }
    } catch (error) {
      issues.push(`Storage access error: ${error.message}`);
    }

    return {
      valid: issues.length === 0,
      issues: issues,
    };
  }
}
