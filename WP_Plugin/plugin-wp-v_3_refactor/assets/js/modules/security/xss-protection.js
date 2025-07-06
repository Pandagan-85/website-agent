/**
 * XSS Protection Module - Pattern Detection e Advanced Security
 * Estratto da security.js
 */

import { isDevelopmentMode, devLog } from "../config.js";

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
// CONTENT ANALYSIS
// =====================================

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

// =====================================
// HASH GENERATION
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

// =====================================
// INJECTION DETECTION
// =====================================

/**
 * Rileva tentativi di injection specifici
 */
export function detectInjectionAttempts(input) {
  const injectionPatterns = {
    sql: [
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+.*set/i,
      /exec\s*\(/i,
    ],
    xss: [/<script/i, /javascript:/i, /on\w+\s*=/i, /document\./i, /window\./i],
    command: [/\|\s*\w+/, /;\s*\w+/, /`.*`/, /\$\(.*\)/, /exec\s*\(/i],
  };

  const detected = {};

  for (const [type, patterns] of Object.entries(injectionPatterns)) {
    detected[type] = patterns.some((pattern) => pattern.test(input));
  }

  return {
    hasInjection: Object.values(detected).some(Boolean),
    types: detected,
  };
}

// =====================================
// CONTEXT-AWARE SANITIZATION
// =====================================

/**
 * Sanitizzazione basata sul contesto d'uso
 */
export function sanitizeByContext(input, context = "general") {
  if (!input || typeof input !== "string") return "";

  switch (context) {
    case "url":
      return input.replace(/[^a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]/g, "");

    case "email":
      return input.replace(/[^a-zA-Z0-9@._-]/g, "");

    case "alphanumeric":
      return input.replace(/[^a-zA-Z0-9]/g, "");

    case "text":
      return input.replace(/<[^>]*>/g, "").slice(0, 1000);

    case "search":
      return input.replace(/[<>]/g, "").replace(/['"]/g, "").slice(0, 200);

    default:
      return sanitizeContentAdvanced(input);
  }
}
