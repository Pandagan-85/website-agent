/**
 * Input Form Component - Versione pulita (senza debug)
 */

import { sanitizeInput } from "../security.js";
import { isDevelopmentMode, devLog } from "../config.js";

/**
 * Componente InputForm - Versione finale pulita
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

  // ===== CSS CLASSES =====
  let formClasses = "veronica-chatbot-input-form";
  if (theme === "dark") {
    formClasses += " theme-dark";
  }

  let inputClasses = "veronica-chatbot-input";
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
      { className: "veronica-chatbot-input-container" },
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
            className: "veronica-chatbot-submit",
            disabled: !inputValue.trim() || isLoading,
            "aria-label": "Invia messaggio",
          },
          isLoading ? "..." : "Invia"
        ),
      ]
    )
  );
}
