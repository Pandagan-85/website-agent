/**
 * Veronica Schembri Chatbot Frontend
 * React-based chatbot widget
 */

(function () {
  "use strict";

  // Wait for React to be available
  function waitForReact(callback) {
    if (typeof React !== "undefined" && typeof ReactDOM !== "undefined") {
      callback();
    } else {
      setTimeout(() => waitForReact(callback), 100);
    }
  }

  // Chatbot Component
  function VeronicaChatbot() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isMinimized, setIsMinimized] = React.useState(false);
    const [messages, setMessages] = React.useState([]);
    const [inputValue, setInputValue] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [isEmbedded, setIsEmbedded] = React.useState(false);

    const config = window.veronicaChatbotConfig || {};

    React.useEffect(() => {
      // Check if this is embedded mode
      const container = document.getElementById("veronica-chatbot-embedded");
      if (container) {
        setIsEmbedded(true);
        setIsOpen(true);
      }

      // Add initial message
      if (config.initialMessage) {
        setMessages([
          {
            id: Date.now(),
            text: config.initialMessage,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }
    }, []);

    const sendMessage = async (text) => {
      if (!text.trim()) return;

      const userMessage = {
        id: Date.now(),
        text: text,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);

      try {
        const response = await fetch(config.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-10).map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const botMessage = {
          id: Date.now() + 1,
          text:
            data.response ||
            "Mi dispiace, non sono riuscita a elaborare la tua richiesta.",
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Chatbot error:", error);
        const errorMessage = {
          id: Date.now() + 1,
          text: "Mi dispiace, c'è stato un problema di connessione. Riprova più tardi.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      sendMessage(inputValue);
    };

    const formatMessage = (text) => {
      // Simple markdown-like formatting
      return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
    };

    // Embedded version
    if (isEmbedded) {
      return React.createElement(
        "div",
        {
          className: `veronica-chatbot-embedded ${
            config.theme === "dark" ? "dark" : "light"
          }`,
          style: {
            width: "100%",
            height: config.height || "500px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: config.theme === "dark" ? "#1f2937" : "#ffffff",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
        },
        [
          // Header
          React.createElement(
            "div",
            {
              key: "header",
              style: {
                padding: "16px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor:
                  config.theme === "dark" ? "#374151" : "#f9fafb",
                borderRadius: "12px 12px 0 0",
              },
            },
            [
              React.createElement(
                "div",
                {
                  key: "title",
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  },
                },
                [
                  React.createElement(
                    "div",
                    {
                      key: "avatar",
                      style: {
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "12px",
                      },
                    },
                    "VS"
                  ),
                  React.createElement(
                    "div",
                    {
                      key: "info",
                    },
                    [
                      React.createElement(
                        "h3",
                        {
                          key: "name",
                          style: {
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: "600",
                            color:
                              config.theme === "dark" ? "#f9fafb" : "#111827",
                          },
                        },
                        "Veronica Schembri"
                      ),
                      React.createElement(
                        "p",
                        {
                          key: "role",
                          style: {
                            margin: 0,
                            fontSize: "12px",
                            color:
                              config.theme === "dark" ? "#9ca3af" : "#6b7280",
                          },
                        },
                        "AI Engineer"
                      ),
                    ]
                  ),
                ]
              ),
            ]
          ),

          // Messages area
          React.createElement(
            "div",
            {
              key: "messages",
              style: {
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              },
            },
            messages.map((message) =>
              React.createElement(
                "div",
                {
                  key: message.id,
                  style: {
                    display: "flex",
                    justifyContent:
                      message.sender === "user" ? "flex-end" : "flex-start",
                  },
                },
                React.createElement("div", {
                  style: {
                    maxWidth: "80%",
                    padding: "8px 12px",
                    borderRadius: "12px",
                    backgroundColor:
                      message.sender === "user"
                        ? "#3b82f6"
                        : config.theme === "dark"
                        ? "#374151"
                        : "#f3f4f6",
                    color:
                      message.sender === "user"
                        ? "white"
                        : config.theme === "dark"
                        ? "#f9fafb"
                        : "#111827",
                    fontSize: "14px",
                    lineHeight: "1.4",
                  },
                  dangerouslySetInnerHTML: {
                    __html: formatMessage(message.text),
                  },
                })
              )
            )
          ),

          // Loading indicator
          isLoading &&
            React.createElement(
              "div",
              {
                key: "loading",
                style: {
                  padding: "16px",
                  display: "flex",
                  justifyContent: "flex-start",
                },
              },
              React.createElement(
                "div",
                {
                  style: {
                    padding: "8px 12px",
                    backgroundColor:
                      config.theme === "dark" ? "#374151" : "#f3f4f6",
                    borderRadius: "12px",
                    fontSize: "14px",
                    color: config.theme === "dark" ? "#f9fafb" : "#111827",
                  },
                },
                "🤔 Sto pensando..."
              )
            ),

          // Input area
          React.createElement(
            "form",
            {
              key: "form",
              onSubmit: handleSubmit,
              style: {
                padding: "16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: "8px",
              },
            },
            [
              React.createElement("input", {
                key: "input",
                type: "text",
                value: inputValue,
                onChange: (e) => setInputValue(e.target.value),
                placeholder: "Scrivi un messaggio...",
                disabled: isLoading,
                style: {
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor:
                    config.theme === "dark" ? "#374151" : "white",
                  color: config.theme === "dark" ? "#f9fafb" : "#111827",
                },
              }),
              React.createElement(
                "button",
                {
                  key: "submit",
                  type: "submit",
                  disabled: !inputValue.trim() || isLoading,
                  style: {
                    padding: "8px 16px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor:
                      !inputValue.trim() || isLoading
                        ? "not-allowed"
                        : "pointer",
                    opacity: !inputValue.trim() || isLoading ? 0.6 : 1,
                  },
                },
                "💬"
              ),
            ]
          ),
        ]
      );
    }

    // Floating widget version
    return React.createElement(
      "div",
      {
        className: "veronica-chatbot-floating",
        style: {
          position: "fixed",
          bottom: "20px",
          right: config.position === "bottom-left" ? "auto" : "20px",
          left: config.position === "bottom-left" ? "20px" : "auto",
          zIndex: 999999,
        },
      },
      [
        // Trigger button
        !isOpen &&
          React.createElement(
            "button",
            {
              key: "trigger",
              onClick: () => setIsOpen(true),
              style: {
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
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
          ),

        // Chat window
        isOpen &&
          React.createElement(
            "div",
            {
              key: "chat",
              style: {
                width: "380px",
                height: isMinimized ? "60px" : "500px",
                backgroundColor: config.theme === "dark" ? "#1f2937" : "white",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "height 0.3s ease",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              },
            },
            [
              // Chat header
              React.createElement(
                "div",
                {
                  key: "chat-header",
                  style: {
                    padding: "16px",
                    backgroundColor:
                      config.theme === "dark" ? "#374151" : "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
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
                        gap: "12px",
                      },
                    },
                    [
                      React.createElement(
                        "div",
                        {
                          key: "header-avatar",
                          style: {
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "12px",
                          },
                        },
                        "VS"
                      ),
                      React.createElement(
                        "div",
                        {
                          key: "header-text",
                        },
                        [
                          React.createElement(
                            "h3",
                            {
                              key: "header-name",
                              style: {
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: "600",
                                color:
                                  config.theme === "dark"
                                    ? "#f9fafb"
                                    : "#111827",
                              },
                            },
                            "Veronica Schembri"
                          ),
                          React.createElement(
                            "p",
                            {
                              key: "header-role",
                              style: {
                                margin: 0,
                                fontSize: "12px",
                                color:
                                  config.theme === "dark"
                                    ? "#9ca3af"
                                    : "#6b7280",
                              },
                            },
                            "AI Engineer"
                          ),
                        ]
                      ),
                    ]
                  ),
                  React.createElement(
                    "div",
                    {
                      key: "header-controls",
                      style: { display: "flex", gap: "8px" },
                    },
                    [
                      React.createElement(
                        "button",
                        {
                          key: "minimize",
                          onClick: () => setIsMinimized(!isMinimized),
                          style: {
                            background: "none",
                            border: "none",
                            fontSize: "16px",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            color:
                              config.theme === "dark" ? "#9ca3af" : "#6b7280",
                          },
                        },
                        isMinimized ? "🔼" : "🔽"
                      ),
                      React.createElement(
                        "button",
                        {
                          key: "close",
                          onClick: () => setIsOpen(false),
                          style: {
                            background: "none",
                            border: "none",
                            fontSize: "16px",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            color:
                              config.theme === "dark" ? "#9ca3af" : "#6b7280",
                          },
                        },
                        "✕"
                      ),
                    ]
                  ),
                ]
              ),

              // Chat content (only show if not minimized)
              !isMinimized && [
                // Messages
                React.createElement(
                  "div",
                  {
                    key: "chat-messages",
                    style: {
                      flex: 1,
                      overflowY: "auto",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    },
                  },
                  messages.map((message) =>
                    React.createElement(
                      "div",
                      {
                        key: message.id,
                        style: {
                          display: "flex",
                          justifyContent:
                            message.sender === "user"
                              ? "flex-end"
                              : "flex-start",
                        },
                      },
                      React.createElement("div", {
                        style: {
                          maxWidth: "80%",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          backgroundColor:
                            message.sender === "user"
                              ? "#3b82f6"
                              : config.theme === "dark"
                              ? "#374151"
                              : "#f3f4f6",
                          color:
                            message.sender === "user"
                              ? "white"
                              : config.theme === "dark"
                              ? "#f9fafb"
                              : "#111827",
                          fontSize: "14px",
                          lineHeight: "1.4",
                        },
                        dangerouslySetInnerHTML: {
                          __html: formatMessage(message.text),
                        },
                      })
                    )
                  )
                ),

                // Loading
                isLoading &&
                  React.createElement(
                    "div",
                    {
                      key: "chat-loading",
                      style: {
                        padding: "0 16px 16px",
                        display: "flex",
                        justifyContent: "flex-start",
                      },
                    },
                    React.createElement(
                      "div",
                      {
                        style: {
                          padding: "8px 12px",
                          backgroundColor:
                            config.theme === "dark" ? "#374151" : "#f3f4f6",
                          borderRadius: "12px",
                          fontSize: "14px",
                          color:
                            config.theme === "dark" ? "#f9fafb" : "#111827",
                        },
                      },
                      "🤔 Sto pensando..."
                    )
                  ),

                // Input
                React.createElement(
                  "form",
                  {
                    key: "chat-form",
                    onSubmit: handleSubmit,
                    style: {
                      padding: "16px",
                      borderTop: "1px solid #e5e7eb",
                      display: "flex",
                      gap: "8px",
                    },
                  },
                  [
                    React.createElement("input", {
                      key: "chat-input",
                      type: "text",
                      value: inputValue,
                      onChange: (e) => setInputValue(e.target.value),
                      placeholder: "Scrivi un messaggio...",
                      disabled: isLoading,
                      style: {
                        flex: 1,
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor:
                          config.theme === "dark" ? "#374151" : "white",
                        color: config.theme === "dark" ? "#f9fafb" : "#111827",
                      },
                    }),
                    React.createElement(
                      "button",
                      {
                        key: "chat-submit",
                        type: "submit",
                        disabled: !inputValue.trim() || isLoading,
                        style: {
                          padding: "8px 16px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "14px",
                          cursor:
                            !inputValue.trim() || isLoading
                              ? "not-allowed"
                              : "pointer",
                          opacity: !inputValue.trim() || isLoading ? 0.6 : 1,
                        },
                      },
                      "💬"
                    ),
                  ]
                ),
              ],
            ]
          ),
      ]
    );
  }

  // Initialize chatbot
  function initChatbot() {
    // For embedded mode
    const embeddedContainer = document.getElementById(
      "veronica-chatbot-embedded"
    );
    if (embeddedContainer) {
      ReactDOM.render(React.createElement(VeronicaChatbot), embeddedContainer);
      return;
    }

    // For floating widget
    if (
      window.veronicaChatbotConfig &&
      window.veronicaChatbotConfig.enabled === "1"
    ) {
      // Create container for floating widget
      const container = document.createElement("div");
      container.id = "veronica-chatbot-floating-container";
      document.body.appendChild(container);

      ReactDOM.render(React.createElement(VeronicaChatbot), container);
    }
  }

  // Start when DOM and React are ready
  document.addEventListener("DOMContentLoaded", function () {
    waitForReact(initChatbot);
  });

  // Also try to start immediately if DOM is already loaded
  if (document.readyState === "loading") {
    // DOM not ready
  } else {
    waitForReact(initChatbot);
  }
})();
