/**
 * Message List Component - Gestione Lista Messaggi
 * CORRETTO: Usa classi CSS originali v3_ok
 */

import { isDevelopmentMode, devLog } from "../config.js";
import { MessageItem } from "./message-item.js";
import { scrollToBottom } from "./ui-utils.js";

/**
 * Componente MessageList - USA CLASSI ORIGINALI v3_ok
 */
export function MessageList({ messages, theme, isLoading, error }) {
  const messagesEndRef = React.useRef(null);

  // ===== AUTO-SCROLL EFFECT =====
  React.useEffect(() => {
    scrollToBottom(messagesEndRef.current);
  }, [messages]);

  // ===== RENDER =====
  return React.createElement(
    "div",
    { className: "veronica-chatbot-messages" }, // ← CLASSE ORIGINALE

    // ===== WELCOME MESSAGE se nessun messaggio =====
    messages.length === 0 &&
      React.createElement(
        "div",
        {
          className:
            theme === "dark"
              ? "veronica-chatbot-welcome theme-dark"
              : "veronica-chatbot-welcome", // ← CLASSE ORIGINALE
        },
        React.createElement(
          "div",
          { className: "veronica-chatbot-welcome-emoji" }, // ← CLASSE ORIGINALE
          "👋"
        ),
        React.createElement(
          "div",
          null,
          "Ciao! Sono l'assistente AI di Veronica Schembri. Come posso aiutarti oggi?"
        )
      ),

    // ===== MESSAGES LIST =====
    ...messages.map((message) =>
      React.createElement(MessageItem, {
        key: message.id,
        message,
        theme,
      })
    ),

    // ===== LOADING INDICATOR =====
    isLoading &&
      React.createElement(
        "div",
        { className: "veronica-chatbot-typing" }, // ← CLASSE ORIGINALE
        React.createElement(
          "div",
          {
            className:
              theme === "dark"
                ? "veronica-chatbot-typing-content theme-dark"
                : "veronica-chatbot-typing-content", // ← CLASSE ORIGINALE
          },
          "L'assistente AI di Veronica sta scrivendo..."
        )
      ),

    // ===== ERROR MESSAGE =====
    error &&
      React.createElement(
        "div",
        { className: "veronica-chatbot-message bot" }, // ← CLASSE ORIGINALE
        React.createElement(
          "div",
          { className: "veronica-chatbot-message-content error" }, // ← CLASSE ORIGINALE
          "⚠️ ",
          error
        )
      ),

    // ===== SCROLL ANCHOR =====
    React.createElement("div", { ref: messagesEndRef })
  );
}

/**
 * Loading Indicator Component separato
 * Per riusabilità
 */
export function LoadingIndicator({ theme }) {
  return React.createElement(
    "div",
    {
      className: `veronica-chatbot-message veronica-chatbot-message--bot${
        theme === "dark" ? " veronica-chatbot-message--dark" : ""
      }`,
    },
    React.createElement(
      "div",
      {
        className:
          "veronica-chatbot-message__content veronica-chatbot-message__content--loading",
      },
      React.createElement(
        "div",
        { className: "veronica-chatbot-typing-indicator" },
        React.createElement("span", {
          className: "veronica-chatbot-typing-dot",
        }),
        React.createElement("span", {
          className: "veronica-chatbot-typing-dot",
        }),
        React.createElement("span", {
          className: "veronica-chatbot-typing-dot",
        })
      )
    )
  );
}

/**
 * Error Message Component separato
 * Per riusabilità
 */
export function ErrorMessage({ error, theme }) {
  if (!error) return null;

  return React.createElement(
    "div",
    {
      className: `veronica-chatbot-message veronica-chatbot-message--error${
        theme === "dark" ? " veronica-chatbot-message--dark" : ""
      }`,
    },
    React.createElement(
      "div",
      { className: "veronica-chatbot-message__content" },
      "⚠️ ",
      error
    )
  );
}
