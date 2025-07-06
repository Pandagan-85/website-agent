/**
 * UI Utilities - Funzioni di utilità per componenti UI
 * Estratto da ui-components.js originale
 */

/**
 * Helper per costruire nomi di classi CSS dinamicamente
 * Estratto dalla funzione buildClassName() originale
 */
export function buildClassName(baseClass, modifiers = {}) {
  const classes = [baseClass];

  Object.entries(modifiers).forEach(([modifier, condition]) => {
    if (condition) {
      classes.push(modifier);
    }
  });

  return classes.join(" ");
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
 * Scroll automatico al bottom
 * Estratto dalla logica di auto-scroll originale
 */
export function scrollToBottom(element) {
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

/**
 * Debounce function per ottimizzazioni
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function per ottimizzazioni
 */
export function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Genera ID univoco per messaggi
 */
export function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Verifica se elemento è visibile nel viewport
 */
export function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Calcola altezza dinamica per textarea
 */
export function calculateTextareaHeight(element, maxHeight = 120) {
  element.style.height = "auto";
  const newHeight = Math.min(element.scrollHeight, maxHeight);
  element.style.height = `${newHeight}px`;
  return newHeight;
}

/**
 * Gestisce focus trap per accessibilità
 */
export function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  element.addEventListener("keydown", handleTabKey);

  // Return cleanup function
  return () => element.removeEventListener("keydown", handleTabKey);
}

/**
 * Applica animazioni CSS con fallback
 */
export function animateElement(element, animationClass, duration = 300) {
  return new Promise((resolve) => {
    const handleAnimationEnd = () => {
      element.classList.remove(animationClass);
      element.removeEventListener("animationend", handleAnimationEnd);
      resolve();
    };

    element.addEventListener("animationend", handleAnimationEnd);
    element.classList.add(animationClass);

    // Fallback timeout
    setTimeout(() => {
      if (element.classList.contains(animationClass)) {
        handleAnimationEnd();
      }
    }, duration);
  });
}

/**
 * Copia testo negli appunti
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback per browser più vecchi
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error("Errore copia testo:", error);
    return false;
  }
}

/**
 * Rileva se l'utente è su mobile
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Gestisce resize responsive
 */
export function handleResponsiveResize(callback) {
  const debouncedCallback = debounce(callback, 250);

  window.addEventListener("resize", debouncedCallback);
  window.addEventListener("orientationchange", debouncedCallback);

  // Return cleanup function
  return () => {
    window.removeEventListener("resize", debouncedCallback);
    window.removeEventListener("orientationchange", debouncedCallback);
  };
}
