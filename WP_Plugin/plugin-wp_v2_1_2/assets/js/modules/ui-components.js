/**
 * Veronica Chatbot - UI Components Module
 * Componenti React individuali riutilizzabili
 */

import { renderMessageContent } from "./formatting.js";

// =====================================
// COMPONENTI UI INDIVIDUALI
// =====================================

/**
 * Pulsante trigger floating
 */
export function ChatTrigger({ onClick }) {
  return React.createElement(
    "button",
    {
      onClick,
      style: {
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #f66061, #8b5cf6)",
        border: "none",
        color: "white",
        fontSize: "24px",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        transition: "transform 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      onMouseOver: (e) => (e.target.style.transform = "scale(1.1)"),
      onMouseOut: (e) => (e.target.style.transform = "scale(1)"),
    },
    "💬"
  );
}

/**
 * Header del chatbot
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
      style: {
        padding: "16px",
        backgroundColor: config.theme === "dark" ? "#374151" : "#f9fafb",
        borderBottom: isMinimized ? "none" : "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: config.theme === "dark" ? "#f9fafb" : "#111827",
      },
    },
    [
      React.createElement(
        "div",
        {
          key: "header-info",
          style: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
          },
        },
        [
          React.createElement("span", { key: "avatar" }, "🐼"),
          !isMinimized &&
            React.createElement("div", { key: "header-text" }, [
              React.createElement(
                "div",
                {
                  key: "name",
                  style: { fontWeight: "600", fontSize: "14px" },
                },
                "Veronica Schembri AI Chatbot"
              ),
              React.createElement(
                "div",
                {
                  key: "status",
                  style: { fontSize: "12px", opacity: 0.7 },
                },
                `Online • ${messages.length} messaggi`
              ),
            ]),
        ]
      ),
      React.createElement(
        "div",
        {
          key: "header-controls",
          style: { display: "flex", gap: "8px" },
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
                style: {
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  opacity: 0.7,
                  padding: "4px",
                },
                title: "Nuova conversazione",
              },
              "🔄"
            ),
          // Minimize button
          React.createElement(
            "button",
            {
              key: "minimize",
              onClick: onToggleMinimize,
              style: {
                background: "none",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                opacity: 0.7,
                padding: "4px",
              },
            },
            isMinimized ? "🔼" : "🔽"
          ),
          // Close button
          React.createElement(
            "button",
            {
              key: "close",
              onClick: onClose,
              style: {
                background: "none",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                opacity: 0.7,
                padding: "4px",
              },
            },
            "✕"
          ),
        ]
      ),
    ]
  );
}

/**
 * Area messaggi
 */
export function ChatMessages({ messages, config, isLoading, messagesEndRef }) {
  return React.createElement(
    "div",
    {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      },
    },
    [
      // Welcome message se nessun messaggio
      messages.length === 0 &&
        React.createElement(
          "div",
          {
            key: "welcome",
            style: {
              textAlign: "center",
              color: config.theme === "dark" ? "#9ca3af" : "#6b7280",
              fontSize: "14px",
              padding: "20px",
            },
          },
          [
            React.createElement(
              "div",
              {
                key: "emoji",
                style: { fontSize: "48px", marginBottom: "16px" },
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
        React.createElement(
          "div",
          {
            key: msg.id || `msg-${index}`,
            style: {
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: "8px",
            },
          },
          renderMessageContent(msg, config)
        )
      ),

      // Loading indicator
      isLoading &&
        React.createElement(
          "div",
          {
            key: "loading",
            style: {
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "8px",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                maxWidth: "85%",
                padding: "12px 16px",
                borderRadius: "18px 18px 18px 4px",
                backgroundColor:
                  config.theme === "dark" ? "#374151" : "#f3f4f6",
                color: config.theme === "dark" ? "#f9fafb" : "#111827",
                fontSize: "14px",
              },
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

/**
 * Area input
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
      style: {
        padding: "16px",
        borderTop: "1px solid #e5e7eb",
        backgroundColor: config.theme === "dark" ? "#1f2937" : "white",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
        },
      },
      [
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
          style: {
            flex: 1,
            padding: "8px 12px",
            border: error ? "2px solid #f87171" : "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: window.innerWidth <= 768 ? "16px" : "14px",
            outline: "none",
            backgroundColor: config.theme === "dark" ? "#4b5563" : "white",
            color: config.theme === "dark" ? "#f9fafb" : "#111827",
            resize: "none",
            maxHeight: "100px",
          },
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          },
        }),
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
            style: {
              padding: window.innerWidth <= 768 ? "8px 12px" : "8px 16px",
              backgroundColor: error ? "#6b7280" : "#f66061",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: window.innerWidth <= 768 ? "13px" : "14px",
              cursor:
                !inputValue.trim() ||
                isLoading ||
                inputValue.length > 1000 ||
                error
                  ? "not-allowed"
                  : "pointer",
              opacity:
                !inputValue.trim() ||
                isLoading ||
                inputValue.length > 1000 ||
                error
                  ? 0.6
                  : 1,
              minWidth: window.innerWidth <= 768 ? "50px" : "60px",
            },
          },
          isLoading ? "..." : "Invia"
        ),
      ]
    )
  );
}
