/**
 * Security Module - Validazione e Sanitizzazione Input
 * Estratto da chatbot.js originale (righe 401-600 circa)
 * Gestisce protezione XSS, validazione input e logging sicurezza
 */

import { isDevelopmentMode, devLog } from "./config.js";

// =====================================
// SANITIZZAZIONE INPUT UTENTE
// =====================================

/**
 * Sanitizza input utente
 * Estratto dalla funzione sanitizeInput() originale
 */
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
    console.warn("🔒 Pattern XSS rilevato:", input.substring(0, 50));
    return false;
  }

  return true;
}

// =====================================
// VALIDAZIONE URL
// =====================================

/**
 * Verifica se URL è valido e sicuro
 * Estratto dalla funzione isValidUrl() originale
 */
export function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return ["http:", "https:", "mailto:"].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizza URL per utilizzo sicuro
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== "string") return "";

  // Rimuovi protocolli pericolosi
  const cleanUrl = url
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:/gi, "")
    .trim();

  // Valida URL pulito
  if (isValidUrl(cleanUrl)) {
    return cleanUrl;
  }

  return "";
}

// =====================================
// ESCAPE HTML
// =====================================

/**
 * Escape HTML entities
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
// LOGGING SICUREZZA
// =====================================

/**
 * Log eventi di sicurezza
 * Estratto dalla funzione logSecurityEvent() originale
 */
export function logSecurityEvent(eventType, content) {
  if (isDevelopmentMode()) {
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

// =====================================
// PATTERN DI SICUREZZA AVANZATI
// =====================================

/**
 * Pattern XSS più aggiornati e completi
 */
export const ADVANCED_XSS_PATTERNS = [
  // Script injection variants
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<script[^>]*>[^<]*<\/script>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,

  // Event handlers
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^>\s]+/gi,

  // Data URLs
  /data\s*:\s*text\/html/gi,
  /data\s*:\s*application\/javascript/gi,

  // CSS expressions
  /expression\s*\(/gi,
  /-moz-binding/gi,

  // Meta refresh
  /<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi,

  // Object/embed
  /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
  /<embed[^>]*>/gi,

  // Form injection
  /<form[^>]*>/gi,
  /<input[^>]*>/gi,
  /<textarea[^>]*>/gi,

  // Link injection
  /<link[^>]*>/gi,
  /@import/gi,

  // Frame injection
  /<i?frame[^>]*>/gi,

  // Style injection
  /<style[^>]*>[\s\S]*?<\/style>/gi,
];

/**
 * Validazione avanzata anti-XSS
 */
export function validateAdvancedXSS(input) {
  if (!input || typeof input !== "string") return false;

  // Controlla lunghezza
  if (input.length > 2000) return false;

  // Controlla pattern avanzati
  for (const pattern of ADVANCED_XSS_PATTERNS) {
    if (pattern.test(input)) {
      devLog("🔒 Advanced XSS pattern detected:", pattern.source);
      return false;
    }
  }

  return true;
}

/**
 * Sanitizzazione avanzata per content
 */
export function sanitizeContentAdvanced(content) {
  if (!content || typeof content !== "string") return "";

  let sanitized = content;

  // Rimuovi tutti i pattern pericolosi
  for (const pattern of ADVANCED_XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REMOVED]");
  }

  // Ulteriori pulizie
  sanitized = sanitized
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Control characters
    .replace(/\s{2,}/g, " ") // Multiple spaces
    .trim();

  return sanitized;
}

// =====================================
// CONTENT SECURITY POLICY
// =====================================

/**
 * Verifica CSP compliance
 */
export function checkCSPCompliance(content) {
  const violations = [];

  // Check for inline scripts
  if (/<script[^>]*>[\s\S]*?<\/script>/i.test(content)) {
    violations.push("inline-script");
  }

  // Check for inline styles
  if (/<style[^>]*>[\s\S]*?<\/style>/i.test(content)) {
    violations.push("inline-style");
  }

  // Check for event handlers
  if (/on\w+\s*=/i.test(content)) {
    violations.push("inline-event-handlers");
  }

  // Check for data URLs
  if (/data:/i.test(content)) {
    violations.push("data-urls");
  }

  return {
    compliant: violations.length === 0,
    violations: violations,
  };
}

// =====================================
// RATE LIMITING & ABUSE PROTECTION
// =====================================

/**
 * Simple rate limiting per input
 */
class InputRateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = new Map();
  }

  isAllowed(identifier = "default") {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Rimuovi richieste fuori dalla finestra temporale
    const validRequests = userRequests.filter(
      (time) => now - time < this.timeWindow
    );

    if (validRequests.length >= this.maxRequests) {
      devLog("🚨 Rate limit exceeded for:", identifier);
      return false;
    }

    // Aggiungi la richiesta corrente
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  getRemainingRequests(identifier = "default") {
    const userRequests = this.requests.get(identifier) || [];
    const now = Date.now();
    const validRequests = userRequests.filter(
      (time) => now - time < this.timeWindow
    );

    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Export instance globale
export const inputRateLimiter = new InputRateLimiter();

// =====================================
// SECURITY UTILITIES
// =====================================

/**
 * Genera hash sicuro per input (per tracking anonimo)
 */
export async function generateSecureHash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifica se il contenuto è probabilmente malevolo
 */
export function detectMaliciousContent(content) {
  const suspiciousIndicators = [
    /eval\s*\(/i,
    /function\s*\(/i,
    /new\s+function/i,
    /settimeout\s*\(/i,
    /setinterval\s*\(/i,
    /xmlhttprequest/i,
    /activexobject/i,
    /\.\s*constructor/i,
    /prototype\s*\[/i,
    /document\s*\.\s*write/i,
    /document\s*\.\s*cookie/i,
    /window\s*\.\s*location/i,
    /top\s*\.\s*location/i,
    /parent\s*\.\s*location/i,
  ];

  const score = suspiciousIndicators.reduce((acc, pattern) => {
    return acc + (pattern.test(content) ? 1 : 0);
  }, 0);

  return {
    isSuspicious: score > 0,
    riskScore: score,
    maxScore: suspiciousIndicators.length,
  };
}

/**
 * Sanitizza input preservando formattazione sicura
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
