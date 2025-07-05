/**
 * Veronica Chatbot - Security Module
 * Codice estratto da chatbot.js (righe 401-600 circa)
 * Gestisce sanitizzazione, validazione e sicurezza input
 */

// =====================================
// SANITIZZAZIONE INPUT UTENTE
// =====================================

export function sanitizeInput(input) {
  if (!input || typeof input !== "string") return "";

  // Pre-validazione rigorosa
  if (!validateInputSecure(input)) {
    console.warn("🔒 Input bloccato dalla pre-validazione");
    logSecurityEvent("xss_attempt_blocked", input);
    return "[CONTENUTO BLOCCATO]";
  }

  // Rimozione COMPLETA di tutto l'HTML per input utente
  let sanitized = input
    // Rimuovi tutti i tag HTML
    .replace(/<[^>]*>/g, "[TAG-RIMOSSO]")
    // Rimuovi tutte le entità HTML
    .replace(/&[a-zA-Z0-9#]+;/g, "[ENTITY-RIMOSSA]")
    // Rimuovi protocolli pericolosi
    .replace(/javascript:/gi, "[JS-BLOCCATO]")
    .replace(/vbscript:/gi, "[VBS-BLOCCATO]")
    .replace(/data:/gi, "[DATA-BLOCCATO]")
    // Rimuovi event handlers
    .replace(/on\w+\s*=/gi, "[EVENT-BLOCCATO]");

  return sanitized.slice(0, 1000); // Limita lunghezza
}

// =====================================
// VALIDAZIONE INPUT
// =====================================

export function validateInput(input) {
  const suspiciousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /&lt;script/i,
    /&#60;script/i,
  ];

  return !suspiciousPatterns.some((pattern) => pattern.test(input));
}

export function validateInputSecure(input) {
  if (!input || typeof input !== "string") return false;
  if (input.length > 1000) return false;
  if (input.trim().length === 0) return false;

  // Lista completa di pattern XSS
  const xssPatterns = [
    // Tag pericolosi
    /<script/i,
    /<\/script>/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<img/i,
    /<svg/i,
    /<form/i,
    /<input/i,
    /<textarea/i,

    // Entità codificate di script
    /&lt;script/i,
    /&#60;script/i,
    /&#x3c;script/i,
    /&amp;lt;script/i,

    // Protocolli pericolosi
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /data:image\/svg/i,

    // Event handlers
    /on\w+\s*=/i,
    /onerror/i,
    /onload/i,
    /onclick/i,
    /onmouseover/i,

    // Funzioni pericolose
    /alert\s*\(/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,

    // Codifiche multiple
    /&amp;lt;/i,
    /&amp;gt;/i,
    /&#x/i,

    // Base64 sospetto
    /data:.*base64/i,

    // Expression CSS
    /expression\s*\(/i,

    // Import/require
    /import\s+/i,
    /require\s*\(/i,
  ];

  // Controlla pattern XSS
  const hasXSS = xssPatterns.some((pattern) => pattern.test(input));
  if (hasXSS) {
    console.warn("🔒 Pattern XSS rilevato:", input.substring(0, 50));
    return false;
  }

  return true;
}

// =====================================
// VALIDAZIONE URL
// =====================================

export function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return ["http:", "https:", "mailto:"].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// =====================================
// ESCAPE HTML
// =====================================

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// =====================================
// LOGGING EVENTI SICUREZZA
// =====================================

export function logSecurityEvent(eventType, content) {
  if (window.veronicaChatbotConfig?.debugMode) {
    console.group("🛡️ Security Event");
    console.log("Type:", eventType);
    console.log("Content:", content.substring(0, 100));
    console.log("Timestamp:", new Date().toISOString());
    console.log("User Agent:", navigator.userAgent);
    console.groupEnd();
  }

  // Opzionale: invia al backend per monitoraggio
  if (window.veronicaChatbotConfig?.apiUrl) {
    fetch(
      window.veronicaChatbotConfig.apiUrl.replace("/chat", "/security-log"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventType,
          content: content.substring(0, 200),
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      }
    ).catch(() => {}); // Silent fail
  }
}
