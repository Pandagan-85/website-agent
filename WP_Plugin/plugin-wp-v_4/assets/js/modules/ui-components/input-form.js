/**
 * Input Form Component - Gestione Input e Invio Messaggi
 * CORRETTO: Usa classi CSS originali v3_ok
 */

import { sanitizeInput } from "../security.js";
import { isDevelopmentMode, devLog } from "../config.js";

/**
 * Componente InputForm - USA CLASSI ORIGINALI v3_ok
 */
export function InputForm({ onSendMessage, isLoading, theme }) {
  const [inputValue, setInputValue] = React.useState("");
  const [error, setError] = React.useState("");

  // ===== GESTIONE SUBMIT =====
  const handleSubmit = React.useCallback(
    (e) => {
      e.preventDefault();

      if (!inputValue.trim() || isLoading) {
        return;
      }

      // Validazione e sanitizzazione
      const sanitizedMessage = sanitizeInput(inputValue);
      if (sanitizedMessage.includes("[CONTENUTO BLOCCATO]")) {
        setError("Messaggio non valido. Riprova.");
        return;
      }

      // Clear error e invia
      setError("");
      onSendMessage(inputValue);
      setInputValue("");
    },
    [inputValue, isLoading, onSendMessage]
  );

  // ===== GESTIONE KEYPRESS =====
  const handleKeyPress = React.useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  // ===== INPUT CHANGE =====
  const handleInputChange = React.useCallback(
    (e) => {
      setInputValue(e.target.value);
      if (error) {
        setError("");
      }
    },
    [error]
  );

  // ===== CSS CLASSES ORIGINALI v3_ok =====
  let formClasses = "veronica-chatbot-input-form"; // ← CLASSE ORIGINALE
  if (theme === "dark") {
    formClasses += " theme-dark";
  }

  let inputClasses = "veronica-chatbot-input"; // ← CLASSE ORIGINALE
  if (error) {
    inputClasses += " error";
  }
  if (theme === "dark") {
    inputClasses += " theme-dark";
  }

  // ===== RENDER =====
  return React.createElement(
    "form",
    {
      className: formClasses,
      onSubmit: handleSubmit,
    },
    React.createElement(
      "div",
      { className: "veronica-chatbot-input-container" }, // ← CLASSE ORIGINALE
      [
        // ===== TEXTAREA =====
        React.createElement("textarea", {
          key: "input",
          className: inputClasses,
          placeholder:
            error ||
            (isLoading
              ? "Veronica sta scrivendo..."
              : "Scrivi un messaggio..."),
          value: inputValue,
          onChange: handleInputChange,
          onKeyDown: handleKeyPress,
          disabled: isLoading,
          rows: 1,
          "aria-label": "Scrivi il tuo messaggio",
        }),

        // ===== SEND BUTTON =====
        React.createElement(
          "button",
          {
            key: "submit",
            type: "submit",
            className: "veronica-chatbot-submit", // ← CLASSE ORIGINALE
            disabled: !inputValue.trim() || isLoading,
            "aria-label": "Invia messaggio",
          },
          isLoading ? "..." : "Invia"
        ),
      ]
    )
  );
}

/**
 * Send Icon Component
 */
function SendIcon() {
  return React.createElement(
    "svg",
    {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("path", {
      d: "M22 2L11 13",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
    React.createElement("path", {
      d: "M22 2L15 22L11 13L2 9L22 2Z",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    })
  );
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner() {
  return React.createElement(
    "div",
    { className: "veronica-chatbot-spinner" },
    React.createElement(
      "svg",
      {
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
      },
      React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeDasharray: "60",
        strokeDashoffset: "60",
        className: "veronica-chatbot-spinner-circle",
      })
    )
  );
}

/**
 * Character Counter Component (per futuro uso)
 */
export function CharacterCounter({ current, max = 1000 }) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;

  return React.createElement(
    "div",
    {
      className: buildClassName("veronica-chatbot-char-counter", {
        "veronica-chatbot-char-counter--warning": isNearLimit,
        "veronica-chatbot-char-counter--error": isAtLimit,
      }),
    },
    `${current}/${max}`
  );
}
