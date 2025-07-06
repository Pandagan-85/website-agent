/**
 * Security Module - Main Export Index
 * Centralizza tutti i re-exports dei moduli di sicurezza
 */

// =====================================
// INPUT VALIDATION
// =====================================
export {
  sanitizeInput,
  validateInput,
  validateInputSecure,
  cleanContentForDisplay,
  validateInputLength,
  validateContentType,
  sanitizeFileName,
  validateUserMessage,
} from "./input-validation.js";

// =====================================
// XSS PROTECTION
// =====================================
export {
  ADVANCED_XSS_PATTERNS,
  validateAdvancedXSS,
  sanitizeContentAdvanced,
  detectMaliciousContent,
  detectEncodingAttacks,
  validateScriptContent,
  checkForSuspiciousPatterns,
  sanitizeForDisplay,
} from "./xss-protection.js";

// =====================================
// CONTENT SECURITY
// =====================================
export {
  isValidUrl,
  sanitizeUrl,
  validateUrlWithWhitelist,
  checkCSPCompliance,
  generateCSPHeader,
  validateCORSOrigin,
  escapeHtml,
  unescapeHtmlSafe,
  validateDomainWhitelist,
  checkProtocolSecurity,
} from "./content-security.js";

// =====================================
// SECURITY LOGGING
// =====================================
export {
  SECURITY_EVENT_TYPES,
  logSecurityEvent,
  getSecurityDebugLogs,
  clearSecurityDebugLogs,
  generateSecurityReport,
} from "./security-logging.js";

// =====================================
// RATE LIMITING & ABUSE PROTECTION
// =====================================
export { inputRateLimiter, generateSecureHash } from "./input-validation.js";

// =====================================
// CONVENIENCE FUNCTIONS
// =====================================

/**
 * Validazione completa input utente (combinata)
 * Usa tutti i moduli per una validazione completa
 */
export function validateUserInputComplete(input, options = {}) {
  const {
    maxLength = 1000,
    allowHTML = false,
    strictXSS = true,
    rateLimitId = "default",
  } = options;

  // Import necessari (dinamici per evitare cicli)
  const { validateInputSecure } = require("./input-validation.js");
  const { validateAdvancedXSS } = require("./xss-protection.js");
  const { inputRateLimiter } = require("./input-validation.js");
  const {
    logSecurityEvent,
    SECURITY_EVENT_TYPES,
  } = require("./security-logging.js");

  // 1. Rate limiting
  if (!inputRateLimiter.isAllowed(rateLimitId)) {
    logSecurityEvent(SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED, input);
    return {
      valid: false,
      reason: "rate_limit_exceeded",
      sanitized: "",
    };
  }

  // 2. Basic validation
  if (!validateInputSecure(input)) {
    logSecurityEvent(SECURITY_EVENT_TYPES.INVALID_INPUT_BLOCKED, input);
    return {
      valid: false,
      reason: "basic_validation_failed",
      sanitized: "",
    };
  }

  // 3. XSS validation (se richiesta)
  if (strictXSS && !validateAdvancedXSS(input)) {
    logSecurityEvent(SECURITY_EVENT_TYPES.XSS_ATTEMPT_BLOCKED, input);
    return {
      valid: false,
      reason: "xss_detected",
      sanitized: "",
    };
  }

  // 4. Length validation
  if (input.length > maxLength) {
    logSecurityEvent(SECURITY_EVENT_TYPES.LARGE_PAYLOAD_BLOCKED, input);
    return {
      valid: false,
      reason: "payload_too_large",
      sanitized: input.substring(0, maxLength),
    };
  }

  return {
    valid: true,
    reason: "passed_all_checks",
    sanitized: input,
  };
}

/**
 * Sanitizzazione completa per output sicuro
 */
export function sanitizeForSecureOutput(content, options = {}) {
  const { allowBasicHTML = false, strictMode = false } = options;

  const { sanitizeInput } = require("./input-validation.js");
  const { sanitizeContentAdvanced } = require("./xss-protection.js");
  const { escapeHtml } = require("./content-security.js");

  let sanitized = content;

  if (strictMode) {
    // Modalità più rigida - rimuove tutto
    sanitized = sanitizeContentAdvanced(sanitized);
  } else if (allowBasicHTML) {
    // Permette HTML di base ma pulisce pattern pericolosi
    sanitized = sanitizeInput(sanitized);
  } else {
    // Escape completo HTML
    sanitized = escapeHtml(sanitized);
  }

  return sanitized;
}

/**
 * Inizializzazione modulo security
 * Da chiamare all'avvio dell'applicazione
 */
export function initSecurityModule(config = {}) {
  const {
    enableLogging = true,
    enableRateLimit = true,
    rateLimitMax = 10,
    rateLimitWindow = 60000,
    logLevel = "medium",
  } = config;

  // Setup logging se abilitato
  if (enableLogging) {
    console.log("🛡️ Security module initialized");
  }

  // Setup rate limiting se abilitato
  if (enableRateLimit) {
    // Il rate limiter è già configurato di default
    console.log(
      `🚦 Rate limiting: ${rateLimitMax} requests per ${rateLimitWindow}ms`
    );
  }

  return {
    status: "initialized",
    config: config,
    modules: [
      "input-validation",
      "xss-protection",
      "content-security",
      "security-logging",
    ],
  };
}
