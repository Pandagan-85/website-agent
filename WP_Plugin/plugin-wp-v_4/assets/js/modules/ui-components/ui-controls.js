/**
 * UI Controls Component - Controlli Header Chatbot
 * Estratto da ui-components.js originale - gestisce minimize, close, reset
 */

import { buildClassName } from "./ui-utils.js";

/**
 * Componente UIControls
 * Gestisce tutti i controlli nell'header del chatbot
 */
export function UIControls({
  isMinimized,
  onToggleMinimize,
  onClose,
  onReset,
  showReset = true,
}) {
  return React.createElement(
    "div",
    { className: "veronica-chatbot-header-controls" }, // ← Classe originale

    // ===== RESET BUTTON =====
    showReset &&
      React.createElement(
        "button",
        {
          className: "veronica-chatbot-header-btn", // ← Classe originale
          onClick: onReset,
          title: "Nuova conversazione",
          "aria-label": "Nuova conversazione",
        },
        "🔄"
      ),

    // ===== MINIMIZE BUTTON =====
    React.createElement(
      "button",
      {
        className: "veronica-chatbot-header-btn", // ← Classe originale
        onClick: onToggleMinimize,
        title: isMinimized ? "Ripristina chat" : "Minimizza chat",
        "aria-label": isMinimized ? "Ripristina chat" : "Minimizza chat",
      },
      isMinimized ? "🔼" : "🔽"
    ),

    // ===== CLOSE BUTTON =====
    React.createElement(
      "button",
      {
        className: "veronica-chatbot-header-btn", // ← Classe originale
        onClick: onClose,
        title: "Chiudi chat",
        "aria-label": "Chiudi chat",
      },
      "✕"
    )
  );
}

/**
 * Reset Icon Component
 */
function ResetIcon() {
  return React.createElement(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("path", {
      d: "M1 4v6h6",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
    React.createElement("path", {
      d: "M3.51 15a9 9 0 1 0 2.13-9.36L1 10",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    })
  );
}

/**
 * Minimize Icon Component
 */
function MinimizeIcon() {
  return React.createElement(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("path", {
      d: "M6 9l6 6 6-6",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    })
  );
}

/**
 * Restore Icon Component
 */
function RestoreIcon() {
  return React.createElement(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("path", {
      d: "M18 15l-6-6-6 6",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    })
  );
}

/**
 * Close Icon Component
 */
function CloseIcon() {
  return React.createElement(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("path", {
      d: "M18 6L6 18",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
    React.createElement("path", {
      d: "M6 6l12 12",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    })
  );
}

/**
 * Settings Icon Component (per futuro uso)
 */
export function SettingsIcon() {
  return React.createElement(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "3",
      stroke: "currentColor",
      strokeWidth: "2",
    }),
    React.createElement("path", {
      d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
      stroke: "currentColor",
      strokeWidth: "2",
    })
  );
}
