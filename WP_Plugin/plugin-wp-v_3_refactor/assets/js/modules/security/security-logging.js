/**
 * Security Logging Module - Event Tracking e Monitoring
 * Estratto da security.js
 */

import { isDevelopmentMode, devLog } from "../config.js";

// =====================================
// CONFIGURAZIONE LOGGING
// =====================================

/**
 * Tipi di eventi di sicurezza tracciati
 */
export const SECURITY_EVENT_TYPES = {
  XSS_ATTEMPT_BLOCKED: "xss_attempt_blocked",
  MALICIOUS_CONTENT_DETECTED: "malicious_content_detected",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  INVALID_INPUT_BLOCKED: "invalid_input_blocked",
  SUSPICIOUS_PATTERN_DETECTED: "suspicious_pattern_detected",
  CSP_VIOLATION: "csp_violation",
  CORS_VIOLATION: "cors_violation",
  URL_VALIDATION_FAILED: "url_validation_failed",
  LARGE_PAYLOAD_BLOCKED: "large_payload_blocked",
  ENCODING_ATTACK_DETECTED: "encoding_attack_detected",
};

/**
 * Configurazione livelli di log
 */
const LOG_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/**
 * Mapping eventi → livelli di priorità
 */
const EVENT_PRIORITY_MAP = {
  [SECURITY_EVENT_TYPES.XSS_ATTEMPT_BLOCKED]: LOG_LEVELS.HIGH,
  [SECURITY_EVENT_TYPES.MALICIOUS_CONTENT_DETECTED]: LOG_LEVELS.CRITICAL,
  [SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED]: LOG_LEVELS.MEDIUM,
  [SECURITY_EVENT_TYPES.INVALID_INPUT_BLOCKED]: LOG_LEVELS.LOW,
  [SECURITY_EVENT_TYPES.SUSPICIOUS_PATTERN_DETECTED]: LOG_LEVELS.MEDIUM,
  [SECURITY_EVENT_TYPES.CSP_VIOLATION]: LOG_LEVELS.HIGH,
  [SECURITY_EVENT_TYPES.CORS_VIOLATION]: LOG_LEVELS.HIGH,
  [SECURITY_EVENT_TYPES.URL_VALIDATION_FAILED]: LOG_LEVELS.MEDIUM,
  [SECURITY_EVENT_TYPES.LARGE_PAYLOAD_BLOCKED]: LOG_LEVELS.MEDIUM,
  [SECURITY_EVENT_TYPES.ENCODING_ATTACK_DETECTED]: LOG_LEVELS.HIGH,
};

// =====================================
// LOGGING PRINCIPALE
// =====================================

/**
 * Log eventi di sicurezza
 * Estratto dalla funzione logSecurityEvent() originale
 */
export function logSecurityEvent(eventType, content, metadata = {}) {
  const timestamp = new Date().toISOString();
  const priority = EVENT_PRIORITY_MAP[eventType] || LOG_LEVELS.LOW;

  // Crea evento di log strutturato
  const logEvent = {
    type: eventType,
    priority: priority,
    timestamp: timestamp,
    content: sanitizeForLogging(content),
    metadata: {
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 200),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      ...metadata,
    },
    sessionInfo: getSessionFingerprint(),
  };

  // Log locale (sempre in development)
  if (isDevelopmentMode()) {
    logToConsole(logEvent);
  }

  // Log remoto (solo per eventi critici/high priority)
  if (priority >= LOG_LEVELS.HIGH) {
    logToRemoteService(logEvent);
  }

  // Salva in storage locale per debug
  saveToLocalDebugLog(logEvent);

  return logEvent;
}

// =====================================
// LOGGING CONSOLE
// =====================================

/**
 * Log strutturato nella console (solo dev mode)
 */
function logToConsole(logEvent) {
  const priorityEmojis = {
    [LOG_LEVELS.LOW]: "ℹ️",
    [LOG_LEVELS.MEDIUM]: "⚠️",
    [LOG_LEVELS.HIGH]: "🚨",
    [LOG_LEVELS.CRITICAL]: "🔥",
  };

  const emoji = priorityEmojis[logEvent.priority] || "📝";

  console.group(`${emoji} Security Event: ${logEvent.type}`);
  console.log("🕒 Timestamp:", logEvent.timestamp);
  console.log("📊 Priority:", logEvent.priority);
  console.log("📄 Content:", logEvent.content);
  console.log("🌐 Metadata:", logEvent.metadata);
  console.log("🔑 Session:", logEvent.sessionInfo);
  console.groupEnd();
}

// =====================================
// LOGGING REMOTO
// =====================================

/**
 * Invia eventi critici al backend per monitoraggio
 */
function logToRemoteService(logEvent) {
  // Solo se configurato un endpoint di logging
  const config = window.veronicaChatbotConfig;
  if (!config?.apiUrl) return;

  const logEndpoint = config.apiUrl.replace("/chat", "/security-log");

  // Payload ridotto per il backend
  const payload = {
    type: logEvent.type,
    priority: logEvent.priority,
    timestamp: logEvent.timestamp,
    content_hash: hashContent(logEvent.content),
    url: logEvent.metadata.url,
    session_id: logEvent.sessionInfo.sessionId,
  };

  // Invio asincrono con retry
  fetch(logEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        devLog("⚠️ Remote logging failed:", response.status);
      }
    })
    .catch((error) => {
      devLog("❌ Remote logging error:", error.message);
    });
}

// =====================================
// STORAGE LOCALE DEBUG
// =====================================

/**
 * Salva eventi in localStorage per debug offline
 */
function saveToLocalDebugLog(logEvent) {
  try {
    const debugLogKey = "veronica_security_debug_log";
    const existingLogs = JSON.parse(localStorage.getItem(debugLogKey) || "[]");

    // Mantieni solo gli ultimi 50 eventi per non saturare storage
    const updatedLogs = [...existingLogs, logEvent].slice(-50);

    localStorage.setItem(debugLogKey, JSON.stringify(updatedLogs));
  } catch (error) {
    devLog("⚠️ Could not save to debug log:", error.message);
  }
}

// =====================================
// UTILITIES
// =====================================

/**
 * Sanitizza contenuto per logging (rimuovi dati sensibili)
 */
function sanitizeForLogging(content) {
  if (!content || typeof content !== "string") return "";

  // Tronca e rimuovi possibili dati sensibili
  let sanitized = content.substring(0, 500);

  // Pattern per rimuovere possibili dati sensibili
  const sensitivePatterns = [
    /password[=:]\s*[\w\S]+/gi,
    /token[=:]\s*[\w\S]+/gi,
    /key[=:]\s*[\w\S]+/gi,
    /email[=:]\s*[\w\S]+@[\w\S]+/gi,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card-like
  ];

  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  return sanitized;
}

/**
 * Genera fingerprint sessione per tracking
 */
function getSessionFingerprint() {
  return {
    sessionId: getSessionId(),
    pageLoadTime: performance.timing?.navigationStart || Date.now(),
    referrer: document.referrer || "direct",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Ottieni session ID (crea se necessario)
 */
function getSessionId() {
  const key = "veronica_session_id";
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

/**
 * Hash veloce per content (non crittografico)
 */
function hashContent(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// =====================================
// API PUBBLICA
// =====================================

/**
 * Ottieni log di debug per troubleshooting
 */
export function getSecurityDebugLogs() {
  try {
    const debugLogKey = "veronica_security_debug_log";
    return JSON.parse(localStorage.getItem(debugLogKey) || "[]");
  } catch {
    return [];
  }
}

/**
 * Pulisci log di debug
 */
export function clearSecurityDebugLogs() {
  try {
    const debugLogKey = "veronica_security_debug_log";
    localStorage.removeItem(debugLogKey);
    devLog("🧹 Security debug logs cleared");
  } catch (error) {
    devLog("❌ Error clearing debug logs:", error.message);
  }
}

/**
 * Genera report di sicurezza
 */
export function generateSecurityReport() {
  const logs = getSecurityDebugLogs();
  const report = {
    total_events: logs.length,
    by_type: {},
    by_priority: {},
    time_range: {
      first: logs[0]?.timestamp,
      last: logs[logs.length - 1]?.timestamp,
    },
    critical_events: logs.filter((log) => log.priority === LOG_LEVELS.CRITICAL),
    recent_events: logs.slice(-10),
  };

  // Conta per tipo
  logs.forEach((log) => {
    report.by_type[log.type] = (report.by_type[log.type] || 0) + 1;
    report.by_priority[log.priority] =
      (report.by_priority[log.priority] || 0) + 1;
  });

  return report;
}
