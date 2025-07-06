/**
 * Message List Component - Versione pulita (senza debug)
 */

import { isDevelopmentMode, devLog } from "../config.js";
import { MessageItem } from "./message-item.js";
import { scrollToBottom } from "./ui-utils.js";

/**
 * Componente MessageList - Versione finale pulita
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
    { className: "veronica-chatbot-messages" },

    // ===== WELCOME MESSAGE se nessun messaggio =====
    messages.length === 0 &&
      React.createElement(
        "div",
        {
          className:
            theme === "dark"
              ? "veronica-chatbot-welcome theme-dark"
              : "veronica-chatbot-welcome",
        },
        React.createElement(
          "div",
          { className: "veronica-chatbot-welcome-emoji" },
          "👋"
        ),
        React.createElement(
          "div",
          null,
          "Ciao! Sono l'assistente AI di Veronica Schembri. Come posso aiutarti oggi?"
        )
      ),

    // ===== MESSAGES LIST =====
    ...messages.map((message, index) =>
      React.createElement(MessageItem, {
        key: message.id || `msg-${index}`,
        message,
        theme,
      })
    ),

    // ===== LOADING INDICATOR =====
    isLoading &&
      React.createElement(
        "div",
        { className: "veronica-chatbot-typing" },
        React.createElement(
          "div",
          {
            className:
              theme === "dark"
                ? "veronica-chatbot-typing-content theme-dark"
                : "veronica-chatbot-typing-content",
          },
          "L'assistente AI di Veronica sta scrivendo..."
        )
      ),

    // ===== ERROR MESSAGE =====
    error &&
      React.createElement(
        "div",
        { className: "veronica-chatbot-message bot" },
        React.createElement(
          "div",
          { className: "veronica-chatbot-message-content error" },
          "⚠️ ",
          error
        )
      ),

    // ===== SCROLL ANCHOR =====
    React.createElement("div", { ref: messagesEndRef })
  );
}
