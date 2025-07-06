/**
 * Input Validation Module - Validazione e Sanitizzazione Input
 * Estratto da security.js
 */

import { isDevelopmentMode, devLog } from "../config.js";
import { logSecurityEvent } from "./security-logging.js";

// =====================================
// SANITIZZAZIONE INPUT UTENTE
// =====================================

/**
 * Sanitizza input utente rimuovendo contenuto pericoloso
 * Estratto dalla funzione sanitizeInput() originale
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== "string") return "";

  // Pre-validazione rigorosa
  if (!validateInputSecure(input)) {
    devLog("🔒 Input bloccato dalla pre-validazione");
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

/**
 * Validazione input base
 * Estratto dalla funzione validateInput() originale
 */
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

/**
 * Validazione input sicura avanzata
 * Estratto dalla funzione validateInputSecure() originale
 */
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
    devLog("🔒 Pattern XSS rilevato");
    return false;
  }

  return true;
}

// =====================================
// ESCAPE HTML
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
 * Unescape HTML entities sicuro
 */
export function unescapeHtmlSafe(text) {
  const allowedEntities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };

  let result = text;
  for (const [entity, char] of Object.entries(allowedEntities)) {
    result = result.replace(new RegExp(entity, "g"), char);
  }

  return result;
}

// =====================================
// CONTENT CLEANING
// =====================================

/**
 * Pulisce contenuto preservando formattazione sicura
 */
export function sanitizePreservingFormat(input) {
  // Permetti solo formattazione markdown sicura
  const allowedFormatting = [
    /\*\*([^*]+)\*\*/g, // Bold
    /\*([^*]+)\*/g, // Italic
    /`([^`]+)`/g, // Code
    /\[([^\]]+)\]\(([^)]+)\)/g, // Links (validati)
  ];

  let sanitized = sanitizeInput(input);

  // Ripristina formattazione markdown sicura
  allowedFormatting.forEach((pattern, index) => {
    const matches = input.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        const replacement = match.replace(/[<>]/g, "");
        sanitized = sanitized.replace("[TAG-RIMOSSO]", replacement);
      });
    }
  });

  return sanitized;
}
