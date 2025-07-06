/**
 * Formatting Module - Rendering e Formattazione Messaggi
 * Estratto da chatbot.js originale (righe 601-750 circa)
 * Gestisce rendering messaggi, markdown processing e formattazione sicura
 */

import { isDevelopmentMode, devLog } from "./config.js";

// =====================================
// RENDERING CONTENUTO MESSAGGI
// =====================================

/**
 * Renderizza contenuto messaggi React
 * Estratto dalla funzione renderMessageContent() originale
 */
export function renderMessageContent(message, config) {
  const baseStyle = {
    maxWidth: "85%",
    padding: "12px 16px",
    fontSize: "14px",
    lineHeight: "1.4",
    wordWrap: "break-word",
  };

  if (message.sender === "user") {
    // MESSAGGI UTENTE: Solo testo puro, sempre
    return React.createElement(
      "div",
      {
        style: {
          ...baseStyle,
          borderRadius: "18px 18px 4px 18px",
          backgroundColor: "#f66061",
          color: "white",
        },
      },
      message.content // Solo testo, niente HTML
    );
  } else {
    // MESSAGGI BOT: HTML processato da markdown sicuro
    const processedContent = formatBotMessageSafely(
      message.content || message.text || ""
    );

    return React.createElement("div", {
      style: {
        ...baseStyle,
        borderRadius: "18px 18px 18px 4px",
        backgroundColor: message.isError
          ? "#fee2e2"
          : config.theme === "dark"
          ? "#374151"
          : "#f3f4f6",
        color: message.isError
          ? "#dc2626"
          : config.theme === "dark"
          ? "#f9fafb"
          : "#111827",
      },
      dangerouslySetInnerHTML: {
        __html: processedContent,
      },
    });
  }
}

// =====================================
// FORMATTAZIONE SICURA MESSAGGI BOT
// =====================================

/**
 * Formatta messaggi bot con markdown sicuro
 * Estratto dalla funzione formatBotMessageSafely() originale
 */
export function formatBotMessageSafely(text) {
  if (!text) return "";

  devLog("🔧 Processing markdown:", text.substring(0, 100) + "...");

  // Step 1: Solo sicurezza di base
  let formatted = text
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, "")
    .replace(/javascript:/gi, "[JS-REMOVED]");

  // Step 2: Markdown semplice → HTML
  formatted = formatted
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Headers
    .replace(
      /^### (.*$)/gm,
      '<h3 style="margin: 12px 0 8px 0; font-weight: bold; color: inherit;">$1</h3>'
    )
    .replace(
      /^## (.*$)/gm,
      '<h2 style="margin: 14px 0 10px 0; font-weight: bold; color: inherit;">$1</h2>'
    )
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #f66061; text-decoration: underline;">$1</a>'
    )
    // Liste
    .replace(/^- (.+)$/gm, '<li style="margin-bottom: 4px;">$1</li>')
    // Newlines
    .replace(/\n/g, "<br>");

  // Step 3: Wrappa liste in <ul>
  formatted = formatted
    .replace(
      /(<li[^>]*>.*?<\/li>)(<br>(<li[^>]*>.*?<\/li>))*(<br>)?/g,
      '<ul style="margin: 8px 0; padding-left: 20px;">$&</ul>'
    )
    .replace(/<br>(<li|<\/ul>)/g, "$1")
    .replace(/(<ul[^>]*>)<br>/g, "$1");

  devLog("✅ Markdown processed:", formatted.substring(0, 200) + "...");
  return formatted;
}

// =====================================
// UTILITIES FORMATTAZIONE
// =====================================

/**
 * Escape HTML per sicurezza
 * Estratto dalla funzione escapeHtml() originale
 */
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Processa URL sicuri nei messaggi
 * Estratto dalla logica di link processing originale
 */
export function processSafeLinks(text) {
  // Pattern per URL sicuri
  const urlPattern = /https?:\/\/[^\s<>"]+/g;

  return text.replace(urlPattern, (url) => {
    // Valida URL
    try {
      new URL(url);
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #f66061; text-decoration: underline;">${url}</a>`;
    } catch {
      return url; // Se URL non valido, mantieni testo originale
    }
  });
}

/**
 * Formatta timestamp per messaggi
 * Estratto dalla logica di timestamp originale
 */
export function formatMessageTimestamp(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "ora";
  if (diffMins < 60) return `${diffMins}m fa`;
  if (diffHours < 24) return `${diffHours}h fa`;
  if (diffDays < 7) return `${diffDays}g fa`;

  return date.toLocaleDateString();
}

/**
 * Pulisce contenuto per display
 * Estratto dalla logica di content cleaning originale
 */
export function cleanContentForDisplay(content) {
  if (!content || typeof content !== "string") return "";

  // Rimuovi caratteri di controllo
  let cleaned = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normalizza spazi
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Limita lunghezza se necessario
  if (cleaned.length > 5000) {
    cleaned = cleaned.substring(0, 5000) + "...";
  }

  return cleaned;
}

/**
 * Evidenzia termini di ricerca nel testo
 * Funzione di utilità per highlighting
 */
export function highlightSearchTerms(text, searchTerm) {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(
    regex,
    '<mark style="background-color: #fef08a;">$1</mark>'
  );
}

/**
 * Tronca testo preservando parole
 * Estratto dalla logica di text truncation originale
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Formatta dimensioni file
 * Utility per display di dimensioni
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Genera preview di testo
 * Estratto dalla logica di preview generation originale
 */
export function generateTextPreview(text, maxLength = 150) {
  const cleaned = cleanContentForDisplay(text);
  const truncated = truncateText(cleaned, maxLength);

  return truncated;
}

/**
 * Valida e processa markdown
 * Versione semplificata del markdown processor
 */
export function processMarkdownSafe(text) {
  if (!text) return "";

  // Solo markdown base per sicurezza
  let processed = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Code inline
    .replace(
      /`(.*?)`/g,
      '<code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px;">$1</code>'
    )
    // Newlines
    .replace(/\n/g, "<br>");

  return processed;
}

/**
 * Formatta errori per display
 * Estratto dalla logica di error formatting originale
 */
export function formatErrorMessage(error) {
  if (!error) return "Errore sconosciuto";

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.name) {
    return `${error.name}: ${error.message || "Errore"}`;
  }

  return "Si è verificato un errore";
}

/**
 * Applica tema ai messaggi
 * Estratto dalla logica di theming originale
 */
export function applyMessageTheme(baseStyle, theme, messageType) {
  const themes = {
    light: {
      user: {
        backgroundColor: "#f66061",
        color: "white",
      },
      bot: {
        backgroundColor: "#f3f4f6",
        color: "#111827",
      },
      error: {
        backgroundColor: "#fee2e2",
        color: "#dc2626",
      },
    },
    dark: {
      user: {
        backgroundColor: "#f66061",
        color: "white",
      },
      bot: {
        backgroundColor: "#374151",
        color: "#f9fafb",
      },
      error: {
        backgroundColor: "#7f1d1d",
        color: "#fca5a5",
      },
    },
  };

  const themeColors = themes[theme] || themes.light;
  const messageColors = themeColors[messageType] || themeColors.bot;

  return {
    ...baseStyle,
    ...messageColors,
  };
}
