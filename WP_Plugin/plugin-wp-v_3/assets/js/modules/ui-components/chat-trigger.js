/**
 * ChatTrigger Component - Floating Button
 * Estratto da ui-components.js
 */

/**
 * Pulsante trigger floating per aprire la chat
 */
export function ChatTrigger({ onClick, theme }) {
  return React.createElement(
    "button",
    {
      onClick,
      className: `veronica-chatbot-trigger ${
        theme === "dark" ? "theme-dark" : ""
      }`,
      "aria-label": "Apri chat con Veronica",
    },
    "💬"
  );
}
