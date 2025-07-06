/**
 * Message Item Component - Versione pulita (senza debug)
 */

import { formatBotMessageSafely } from "../formatting.js";
import { isDevelopmentMode, devLog } from "../config.js";
import { formatMessageTimestamp } from "./ui-utils.js";

/**
 * Componente MessageItem - Versione finale pulita
 */
export function MessageItem({ message, theme }) {
  // ===== EARLY RETURN PER MESSAGGI INVALIDI =====
  if (!message || !message.sender) {
    if (isDevelopmentMode()) {
      console.warn("⚠️ Invalid message:", message);
    }
    return null;
  }

  // ===== PROCESSING CONTENUTO =====
  const processedContent = React.useMemo(() => {
    if (message.sender === "bot") {
      // Bot messages: usa formatting avanzato per HTML
      return formatBotMessageSafely(message.content || "");
    } else {
      // User messages: ritorna solo la stringa
      return message.content || "";
    }
  }, [message.content, message.sender]);

  // ===== CSS CLASSES =====
  const messageClasses = `veronica-chatbot-message ${message.sender}`;

  let contentClasses = `veronica-chatbot-message-content ${message.sender}`;
  if (theme === "dark") {
    contentClasses += " theme-dark";
  }
  if (message.isError) {
    contentClasses += " error";
  }

  // ===== RENDER =====
  return React.createElement(
    "div",
    {
      className: messageClasses,
      "data-message-id": message.id,
      "data-sender": message.sender,
    },

    // ===== MESSAGE CONTENT =====
    React.createElement(
      "div",
      {
        className: contentClasses,
        // Solo bot messages usano dangerouslySetInnerHTML
        ...(message.sender === "bot"
          ? { dangerouslySetInnerHTML: { __html: processedContent } }
          : {}),
      },
      // User messages mostrano processedContent come testo
      message.sender === "user" ? processedContent : undefined
    )
  );
}
