/**
 * MessageList Component - Lista messaggi con welcome
 * Estratto da ui-components.js
 */

import { MessageBubble } from "./message-bubble.js";

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
 * Area messaggi con welcome message e lista messaggi
 */
export function MessageList({ messages, config, isLoading, messagesEndRef }) {
  return React.createElement(
    "div",
    {
      className: "veronica-chatbot-messages",
    },
    [
      // Welcome message se nessun messaggio
      messages.length === 0 &&
        React.createElement(
          "div",
          {
            key: "welcome",
            className: buildClassName("veronica-chatbot-welcome", {
              "theme-dark": config.theme === "dark",
            }),
          },
          [
            React.createElement(
              "div",
              {
                key: "emoji",
                className: "veronica-chatbot-welcome-emoji",
              },
              "👋"
            ),
            React.createElement(
              "div",
              { key: "text" },
              "Ciao! Sono l'assistente AI di Veronica Schembri. Come posso aiutarti oggi?"
            ),
          ]
        ),

      // Lista messaggi
      ...messages.map((msg, index) =>
        React.createElement(MessageBubble, {
          key: msg.id || `msg-${index}`,
          message: msg,
          config: config,
          index: index,
        })
      ),

      // Loading indicator
      isLoading &&
        React.createElement(
          "div",
          {
            key: "loading",
            className: "veronica-chatbot-typing",
          },
          React.createElement(
            "div",
            {
              className: buildClassName("veronica-chatbot-typing-content", {
                "theme-dark": config.theme === "dark",
              }),
            },
            "L'assistente AI di Veronica sta scrivendo..."
          )
        ),

      // Auto-scroll target
      React.createElement("div", {
        key: "scroll-target",
        ref: messagesEndRef,
      }),
    ]
  );
}
