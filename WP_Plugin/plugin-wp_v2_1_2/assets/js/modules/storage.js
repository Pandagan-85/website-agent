/**
 * Veronica Chatbot - Storage Module
 * Codice estratto da chatbot.js (righe 151-400 circa)
 * Gestisce localStorage, sessioni e messaggi
 */

import { CHATBOT_CONFIG } from "./config.js";

// =====================================
// GESTIONE SESSIONI E STORAGE
// =====================================

export class ChatStorageManager {
  constructor() {
    this.isStorageAvailable = this.checkStorageAvailability();
  }

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

  // ===== GESTIONE SESSIONE =====

  getOrCreateSession() {
    if (!this.isStorageAvailable) {
      return this.createNewSession();
    }

    try {
      const stored = localStorage.getItem(CHATBOT_CONFIG.STORAGE_KEYS.SESSION);
      const now = Date.now();

      if (stored) {
        const sessionData = JSON.parse(stored);
        const sessionAge = now - sessionData.created;
        const lastActivity = now - sessionData.lastActivity;

        // Reset se troppo vecchia o inattiva
        if (
          sessionAge > CHATBOT_CONFIG.SESSION_DURATION ||
          lastActivity > CHATBOT_CONFIG.CONVERSATION_TIMEOUT
        ) {
          console.log("🔄 Reset sessione per timeout");
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
    console.log("✨ Nuova sessione creata:", sessionData.sessionId);
    return sessionData;
  }

  saveSession(sessionData) {
    if (!this.isStorageAvailable) return;

    try {
      localStorage.setItem(
        CHATBOT_CONFIG.STORAGE_KEYS.SESSION,
        JSON.stringify(sessionData)
      );
    } catch (error) {
      console.error("❌ Errore salvataggio sessione:", error);
    }
  }

  updateSessionActivity() {
    if (!this.isStorageAvailable) return;

    try {
      const stored = localStorage.getItem(CHATBOT_CONFIG.STORAGE_KEYS.SESSION);
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

  resetSession() {
    if (this.isStorageAvailable) {
      localStorage.removeItem(CHATBOT_CONFIG.STORAGE_KEYS.SESSION);
      localStorage.removeItem(CHATBOT_CONFIG.STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(CHATBOT_CONFIG.STORAGE_KEYS.UI_STATE);
    }
    return this.createNewSession();
  }

  // ===== GESTIONE MESSAGGI =====

  loadMessages() {
    if (!this.isStorageAvailable) return [];

    try {
      const stored = localStorage.getItem(CHATBOT_CONFIG.STORAGE_KEYS.MESSAGES);
      if (stored) {
        const messages = JSON.parse(stored);

        // ✅ SEMPLIFICATO: Carica messaggi così come sono, senza elaborazioni
        if (
          Array.isArray(messages) &&
          messages.length <= CHATBOT_CONFIG.MAX_MESSAGES
        ) {
          console.log("📥 Loaded", messages.length, "messages from storage");
          return messages;
        }
      }
    } catch (error) {
      console.error("❌ Errore caricamento messaggi:", error);
    }

    return [];
  }

  saveMessages(messages) {
    if (!this.isStorageAvailable) return;

    try {
      // Limita numero messaggi per evitare overflow storage
      const limitedMessages = messages.slice(-CHATBOT_CONFIG.MAX_MESSAGES);
      localStorage.setItem(
        CHATBOT_CONFIG.STORAGE_KEYS.MESSAGES,
        JSON.stringify(limitedMessages)
      );
    } catch (error) {
      console.error("❌ Errore salvataggio messaggi:", error);
      // Se storage pieno, rimuovi messaggi più vecchi
      if (error.name === "QuotaExceededError") {
        const reducedMessages = messages.slice(
          -Math.floor(CHATBOT_CONFIG.MAX_MESSAGES / 2)
        );
        this.saveMessages(reducedMessages);
      }
    }
  }

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
    console.log(
      "💾 Saving message:",
      newMessage.sender,
      newMessage.content.substring(0, 50)
    );

    messages.push(newMessage);
    this.saveMessages(messages);
    return newMessage;
  }

  // ===== GESTIONE STATO UI =====

  loadUIState() {
    if (!this.isStorageAvailable) {
      return { isOpen: false, isMinimized: false };
    }

    try {
      const stored = localStorage.getItem(CHATBOT_CONFIG.STORAGE_KEYS.UI_STATE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("❌ Errore caricamento stato UI:", error);
    }

    return { isOpen: false, isMinimized: false };
  }

  saveUIState(state) {
    if (!this.isStorageAvailable) return;

    try {
      localStorage.setItem(
        CHATBOT_CONFIG.STORAGE_KEYS.UI_STATE,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error("❌ Errore salvataggio stato UI:", error);
    }
  }
}
