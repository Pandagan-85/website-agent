/**
 * Content Security Module - CSP, URL Validation, CORS
 * Estratto da security.js
 */

import { isDevelopmentMode, devLog } from "../config.js";

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

/**
 * Valida URL con whitelist di domini
 */
export function validateUrlWithWhitelist(url, allowedDomains = []) {
  if (!isValidUrl(url)) return false;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();

    // Se non c'è whitelist, permetti tutto (con protocolli sicuri)
    if (allowedDomains.length === 0) {
      return ["http:", "https:"].includes(urlObj.protocol);
    }

    // Controlla se il dominio è nella whitelist
    return allowedDomains.some((allowedDomain) => {
      // Exact match
      if (domain === allowedDomain.toLowerCase()) return true;

      // Subdomain match (se inizia con .)
      if (allowedDomain.startsWith(".")) {
        return domain.endsWith(allowedDomain.toLowerCase());
      }

      return false;
    });
  } catch {
    return false;
  }
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

/**
 * Genera CSP header string
 */
export function generateCSPHeader(options = {}) {
  const defaultCSP = {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'", "https:"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  const csp = { ...defaultCSP, ...options };

  return Object.entries(csp)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}

// =====================================
// CORS VALIDATION
// =====================================

/**
 * Valida origin per CORS
 */
export function validateCORSOrigin(origin, allowedOrigins = []) {
  if (!origin) return false;

  // Normalize origin
  const normalizedOrigin = origin.toLowerCase();

  return allowedOrigins.some((allowed) => {
    const normalizedAllowed = allowed.toLowerCase();

    // Exact match
    if (normalizedOrigin === normalizedAllowed) return true;

    // Wildcard subdomain match
    if (normalizedAllowed.startsWith("*.")) {
      const domain = normalizedAllowed.slice(2);
      return (
        normalizedOrigin.endsWith(`.${domain}`) || normalizedOrigin === domain
      );
    }

    return false;
  });
}

// =====================================
// SAFE CONTENT RENDERING
// =====================================

/**
 * Verifica se il contenuto è sicuro per il rendering
 */
export function isSafeForRendering(content) {
  if (!content || typeof content !== "string") return false;

  // Check dimensioni ragionevoli
  if (content.length > 100000) return false; // 100KB max

  // Check per contenuto binario
  if (/[\x00-\x08\x0E-\x1F]/.test(content)) return false;

  // Check CSP compliance
  const cspCheck = checkCSPCompliance(content);
  if (!cspCheck.compliant) return false;

  return true;
}

/**
 * Sanitizza contenuto per rendering sicuro
 */
export function sanitizeForRendering(content, options = {}) {
  if (!content || typeof content !== "string") return "";

  const {
    allowImages = true,
    allowLinks = true,
    allowBasicFormatting = true,
    maxLength = 10000,
  } = options;

  let sanitized = content.slice(0, maxLength);

  // Rimuovi script e contenuto pericoloso
  sanitized = sanitized
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "");

  // Gestisci immagini
  if (!allowImages) {
    sanitized = sanitized.replace(/<img[^>]*>/gi, "[IMMAGINE RIMOSSA]");
  }

  // Gestisci link
  if (!allowLinks) {
    sanitized = sanitized.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, "[LINK RIMOSSO]");
  }

  // Gestisci formattazione
  if (!allowBasicFormatting) {
    sanitized = sanitized.replace(/<[^>]*>/g, "");
  }

  return sanitized;
}

// =====================================
// FEATURE DETECTION
// =====================================

/**
 * Rileva feature potenzialmente pericolose nel contenuto
 */
export function detectUnsafeFeatures(content) {
  const unsafeFeatures = {
    scripts: /<script/i.test(content),
    iframes: /<iframe/i.test(content),
    objects: /<object/i.test(content),
    embeds: /<embed/i.test(content),
    forms: /<form/i.test(content),
    eventHandlers: /on\w+\s*=/i.test(content),
    javascriptUrls: /javascript:/i.test(content),
    dataUrls: /data:(?!image\/)/i.test(content), // Allow data images
    metaRefresh: /<meta[^>]*refresh/i.test(content),
    linkTags: /<link[^>]*>/i.test(content),
  };

  const detectedFeatures = Object.entries(unsafeFeatures)
    .filter(([_, detected]) => detected)
    .map(([feature, _]) => feature);

  return {
    hasUnsafeFeatures: detectedFeatures.length > 0,
    features: detectedFeatures,
    riskLevel:
      detectedFeatures.length > 3
        ? "high"
        : detectedFeatures.length > 1
        ? "medium"
        : detectedFeatures.length > 0
        ? "low"
        : "safe",
  };
}
