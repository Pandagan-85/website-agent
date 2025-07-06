/**
 * Message Item Component - Singolo Messaggio
 * CORRETTO: Usa classi CSS originali v3_ok
 */

import { renderMessageContent, formatBotMessageSafely } from "../formatting.js";
import { isDevelopmentMode, devLog } from "../config.js";
import { formatMessageTimestamp } from "./ui-utils.js";

/**
 * Componente MessageItem - USA CLASSI ORIGINALI v3_ok
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
      // Bot messages: usa formatting avanzato
      return formatBotMessageSafely(message.content || "");
    } else {
      // User messages: escape HTML per sicurezza
      return renderMessageContent(message.content || "", false);
    }
  }, [message.content, message.sender]);

  // ===== CSS CLASSES ORIGINALI v3_ok =====
  const messageClasses = `veronica-chatbot-message ${message.sender}`; // ← CLASSE ORIGINALE

  let contentClasses = `veronica-chatbot-message-content ${message.sender}`; // ← CLASSE ORIGINALE
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
        dangerouslySetInnerHTML:
          message.sender === "bot" ? { __html: processedContent } : undefined,
      },
      message.sender === "user" ? processedContent : undefined
    )
  );
}

/**
 * Message Avatar Component
 * Componente separato per avatar (se necessario in futuro)
 */
export function MessageAvatar({ sender, theme }) {
  if (sender === "user") {
    return React.createElement(
      "div",
      {
        className:
          "veronica-chatbot-message__avatar veronica-chatbot-message__avatar--user",
      },
      React.createElement(
        "svg",
        {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          fill: "currentColor",
        },
        React.createElement("path", {
          d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
        })
      )
    );
  }

  return React.createElement(
    "div",
    {
      className:
        "veronica-chatbot-message__avatar veronica-chatbot-message__avatar--bot",
    },
    React.createElement(
      "svg",
      {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "currentColor",
      },
      React.createElement("circle", { cx: "12", cy: "12", r: "3" }),
      React.createElement("path", { d: "M12 1v6m0 6v6" })
    )
  );
}

/**
 * Message Actions Component
 * Per azioni sui messaggi (copy, like, etc.) - per futuro uso
 */
export function MessageActions({ message, onCopy, onRegenerate }) {
  if (message.sender !== "bot") return null;

  return React.createElement(
    "div",
    { className: "veronica-chatbot-message__actions" },

    // Copy button
    React.createElement(
      "button",
      {
        className: "veronica-chatbot-message__action",
        onClick: () => onCopy?.(message.content),
        title: "Copia messaggio",
      },
      React.createElement(
        "svg",
        { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none" },
        React.createElement("path", {
          d: "M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.83 2.83A2 2 0 0015.415 2H10a2 2 0 00-2 2z",
          stroke: "currentColor",
          strokeWidth: "2",
        }),
        React.createElement("path", {
          d: "M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2",
          stroke: "currentColor",
          strokeWidth: "2",
        })
      )
    ),

    // Regenerate button (se fornito)
    onRegenerate &&
      React.createElement(
        "button",
        {
          className: "veronica-chatbot-message__action",
          onClick: () => onRegenerate(message),
          title: "Rigenera risposta",
        },
        React.createElement(
          "svg",
          { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none" },
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
        )
      )
  );
}
