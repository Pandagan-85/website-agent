/**
 * MessageBubble Component - Singolo messaggio
 * Estratto da ui-components.js
 */

import { formatBotMessageSafely } from "../formatting.js";

/**
 * Helper per costruire nomi di classi CSS dinamicamente
 */
function buildClassName(baseClass, modifiers = {}) {
  const classes = [baseClass];

  Object.entries(modifiers).forEach(([modifier, condition]) => {
    if (condition) {
      classes.push(modifier);
    }
  });

  return classes.join(" ");
}

/**
 * Singolo messaggio nella chat
 */
export function MessageBubble({ message, config, index }) {
  return React.createElement(
    "div",
    {
      key: message.id || `msg-${index}`,
      className: `veronica-chatbot-message ${message.sender}`,
    },
    React.createElement(
      "div",
      {
        className: buildClassName("veronica-chatbot-message-content", {
          [message.sender]: true,
          "theme-dark": config.theme === "dark",
          error: message.isError,
        }),
        dangerouslySetInnerHTML:
          message.sender === "bot"
            ? {
                __html: formatBotMessageSafely(message.content),
              }
            : undefined,
      },
      message.sender === "user" ? message.content : undefined
    )
  );
}
