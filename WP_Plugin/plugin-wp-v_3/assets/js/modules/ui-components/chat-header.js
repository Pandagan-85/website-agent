/**
 * ChatHeader Component - Header con controlli
 * Estratto da ui-components.js
 */

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
 * Header del chatbot con controlli
 */
export function ChatHeader({
  config,
  messages,
  isMinimized,
  onToggleMinimize,
  onClose,
  onReset,
}) {
  return React.createElement(
    "div",
    {
      className: buildClassName("veronica-chatbot-header", {
        "theme-dark": config.theme === "dark",
        minimized: isMinimized,
      }),
    },
    [
      // Header Info
      React.createElement(
        "div",
        {
          key: "header-info",
          className: "veronica-chatbot-header-info",
        },
        [
          React.createElement(
            "span",
            {
              key: "avatar",
              className: "veronica-chatbot-header-avatar",
            },
            "🐼"
          ),
          !isMinimized &&
            React.createElement(
              "div",
              {
                key: "header-text",
                className: "veronica-chatbot-header-text",
              },
              [
                React.createElement(
                  "div",
                  {
                    key: "name",
                    className: "veronica-chatbot-header-name",
                  },
                  "Veronica Schembri AI Chatbot"
                ),
                React.createElement(
                  "div",
                  {
                    key: "status",
                    className: "veronica-chatbot-header-status",
                  },
                  `Online • ${messages.length} messaggi`
                ),
              ]
            ),
        ]
      ),

      // Header Controls
      React.createElement(
        "div",
        {
          key: "header-controls",
          className: "veronica-chatbot-header-controls",
        },
        [
          // Reset button
          messages.length > 0 &&
            !isMinimized &&
            React.createElement(
              "button",
              {
                key: "reset",
                onClick: onReset,
                className: buildClassName("veronica-chatbot-header-btn", {
                  "theme-dark": config.theme === "dark",
                }),
                title: "Nuova conversazione",
                "aria-label": "Inizia nuova conversazione",
              },
              "🔄"
            ),

          // Minimize button
          React.createElement(
            "button",
            {
              key: "minimize",
              onClick: onToggleMinimize,
              className: buildClassName("veronica-chatbot-header-btn", {
                "theme-dark": config.theme === "dark",
              }),
              "aria-label": isMinimized ? "Espandi chat" : "Minimizza chat",
            },
            isMinimized ? "🔼" : "🔽"
          ),

          // Close button
          React.createElement(
            "button",
            {
              key: "close",
              onClick: onClose,
              className: buildClassName("veronica-chatbot-header-btn", {
                "theme-dark": config.theme === "dark",
              }),
              "aria-label": "Chiudi chat",
            },
            "✕"
          ),
        ]
      ),
    ]
  );
}
