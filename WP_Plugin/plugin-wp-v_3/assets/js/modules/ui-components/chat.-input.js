/**
 * ChatInput Component - Form input con validazione
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
 * Area input con form e controlli
 */
export function ChatInput({
  inputValue,
  setInputValue,
  onSubmit,
  isLoading,
  error,
  setError,
  config,
}) {
  return React.createElement(
    "form",
    {
      onSubmit,
      className: buildClassName("veronica-chatbot-input-form", {
        "theme-dark": config.theme === "dark",
      }),
    },
    React.createElement(
      "div",
      {
        className: "veronica-chatbot-input-container",
      },
      [
        // Textarea input
        React.createElement("textarea", {
          key: "input",
          value: inputValue,
          onChange: (e) => {
            setInputValue(e.target.value);
            setError("");
          },
          placeholder: error || "Scrivi un messaggio...",
          disabled: isLoading,
          rows: 1,
          className: buildClassName("veronica-chatbot-input", {
            "theme-dark": config.theme === "dark",
            error: !!error,
          }),
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          },
          "aria-label": "Scrivi il tuo messaggio",
        }),

        // Submit button
        React.createElement(
          "button",
          {
            key: "submit",
            type: "submit",
            disabled:
              !inputValue.trim() ||
              isLoading ||
              inputValue.length > 1000 ||
              error,
            className: "veronica-chatbot-submit",
            "aria-label": "Invia messaggio",
          },
          isLoading ? "..." : "Invia"
        ),
      ]
    )
  );
}
