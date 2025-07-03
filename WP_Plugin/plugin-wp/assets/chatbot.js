/**
 * Veronica Schembri Chatbot Frontend - With Markdown Support
 * React-based chatbot widget
 */

(function () {
  "use strict";

  // Inject mobile CSS
  if (!document.getElementById("veronica-chatbot-mobile-css")) {
    const style = document.createElement("style");
    style.id = "veronica-chatbot-mobile-css";
    style.textContent = `
        @media (max-width: 768px) {
            .veronica-chatbot-floating {
                left: 20px !important;
                right: 20px !important;
            }
        }
    `;
    document.head.appendChild(style);
  }

  // Markdown formatting function
  function formatMessageText(text) {
    if (!text) return "";

    return (
      text
        // Headers
        .replace(
          /### (.*?)$/gm,
          '<h3 style="margin: 8px 0; font-weight: bold; font-size: 1.1em;">$1</h3>'
        )
        .replace(
          /## (.*?)$/gm,
          '<h2 style="margin: 10px 0; font-weight: bold; font-size: 1.2em;">$1</h2>'
        )
        .replace(
          /# (.*?)$/gm,
          '<h1 style="margin: 12px 0; font-weight: bold; font-size: 1.3em;">$1</h1>'
        )

        // Bold
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

        // Links
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" style="color: #f66061; text-decoration: underline;">$1</a>'
        )

        // Handle lists
        .split("\n")
        .map((line, index, array) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("- ")) {
            const content = trimmed.replace(/^- /, "");
            // Check if this is the first item in a list
            const prevLine = array[index - 1] ? array[index - 1].trim() : "";
            const nextLine = array[index + 1] ? array[index + 1].trim() : "";

            let listItem = `<li style="margin-left: 20px; margin-bottom: 4px;">${content}</li>`;

            // Wrap in ul if it's a standalone item or first/last in sequence
            if (!prevLine.startsWith("- ") && !nextLine.startsWith("- ")) {
              listItem = `<ul style="margin: 8px 0; padding-left: 20px;">${listItem}</ul>`;
            } else if (!prevLine.startsWith("- ")) {
              listItem = `<ul style="margin: 8px 0; padding-left: 20px;">${listItem}`;
            } else if (!nextLine.startsWith("- ")) {
              listItem = `${listItem}</ul>`;
            }

            return listItem;
          }
          return line;
        })
        .join("<br>")

        // Clean up extra breaks
        .replace(/<br><br>/g, "<br>")
        .replace(/<\/ul><br><ul[^>]*>/g, "")
    );
  }

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
    const messagesEndRef = React.useRef(null);

    const config = window.veronicaChatbotConfig || {};

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
      scrollToBottom();
    }, [messages]);

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
            thread_id: "web_user_" + Date.now(),
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
      }

      setIsLoading(false);
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      sendMessage(inputValue);
    };

    // Embedded version
    if (isEmbedded) {
      return React.createElement(
        "div",
        {
          className: "veronica-chatbot-embedded",
          style: {
            width: "100%",
            height: config.height || "500px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: config.theme === "dark" ? "#1f2937" : "white",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            overflow: "hidden",
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
                color: config.theme === "dark" ? "#f9fafb" : "#111827",
              },
            },
            [
              React.createElement(
                "h3",
                {
                  key: "title",
                  style: { margin: 0, fontSize: "18px", fontWeight: "600" },
                },
                "💬 Chatta con Veronica"
              ),
              React.createElement(
                "p",
                {
                  key: "subtitle",
                  style: {
                    margin: "4px 0 0 0",
                    fontSize: "14px",
                    opacity: 0.7,
                  },
                },
                "AI Engineer · Sicilia"
              ),
            ]
          ),

          // Messages
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
            [
              ...messages.map((message) =>
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
                      padding: "12px 16px",
                      backgroundColor:
                        message.sender === "user" ? "#f66061" : "#f3f4f6",
                      color: message.sender === "user" ? "white" : "#374151",
                      borderRadius: "12px",
                      maxWidth: "85%",
                      wordWrap: "break-word",
                      lineHeight: "1.5",
                    },
                    dangerouslySetInnerHTML: {
                      __html: formatMessageText(message.text),
                    },
                  })
                )
              ),
              isLoading &&
                React.createElement(
                  "div",
                  {
                    key: "loading",
                    style: { display: "flex", justifyContent: "flex-start" },
                  },
                  React.createElement(
                    "div",
                    {
                      style: {
                        padding: "12px 16px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "12px",
                        color: "#6b7280",
                      },
                    },
                    "Veronica sta scrivendo..."
                  )
                ),
              React.createElement("div", {
                key: "end",
                ref: messagesEndRef,
              }),
            ]
          ),

          // Input
          React.createElement(
            "form",
            {
              key: "form",
              onSubmit: handleSubmit,
              style: {
                padding: "16px",
                borderTop: "1px solid #e5e7eb",
                backgroundColor: config.theme === "dark" ? "#374151" : "white",
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
                  outline: "none",
                  backgroundColor:
                    config.theme === "dark" ? "#4b5563" : "white",
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
                    backgroundColor: "#f66061",
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
          // Mobile-first positioning
          right:
            window.innerWidth <= 768
              ? "20px"
              : config.position === "bottom-left"
              ? "auto"
              : "20px",
          left:
            window.innerWidth <= 768
              ? "20px"
              : config.position === "bottom-left"
              ? "20px"
              : "auto",
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
          ),

        // Chat window - MOBILE RESPONSIVE
        isOpen &&
          React.createElement(
            "div",
            {
              key: "chat",
              style: {
                // Responsive width
                width:
                  window.innerWidth <= 768
                    ? "calc(100vw - 40px)" // Mobile: schermo - 40px (20px per lato)
                    : "380px", // Desktop: width fissa
                maxWidth: "400px", // Limite massimo
                height: isMinimized
                  ? "60px"
                  : window.innerWidth <= 768
                  ? "70vh"
                  : "500px", // Mobile più basso
                backgroundColor: config.theme === "dark" ? "#1f2937" : "white",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "height 0.3s ease, width 0.3s ease",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                // Mobile specific adjustments
                ...(window.innerWidth <= 768 && {
                  position: "relative",
                  margin: "0 auto",
                }),
              },
            },
            [
              // Chat header - MOBILE RESPONSIVE
              React.createElement(
                "div",
                {
                  key: "chat-header",
                  style: {
                    padding: window.innerWidth <= 768 ? "12px 16px" : "16px", // Mobile: padding ridotto
                    backgroundColor:
                      config.theme === "dark" ? "#374151" : "#f9fafb",
                    borderBottom: isMinimized ? "none" : "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: config.theme === "dark" ? "#f9fafb" : "#111827",
                  },
                },
                [
                  React.createElement("div", { key: "header-info" }, [
                    React.createElement(
                      "h4",
                      {
                        key: "header-title",
                        style: {
                          margin: 0,
                          fontSize: window.innerWidth <= 768 ? "15px" : "16px", // Mobile: font più piccolo
                          fontWeight: "600",
                        },
                      },
                      "💬 Veronica Schembri"
                    ),
                    !isMinimized &&
                      React.createElement(
                        "p",
                        {
                          key: "header-subtitle",
                          style: {
                            margin: "2px 0 0 0",
                            fontSize:
                              window.innerWidth <= 768 ? "11px" : "12px", // Mobile: font più piccolo
                            opacity: 0.7,
                          },
                        },
                        "AI Engineer · Online"
                      ),
                  ]),
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
                            fontSize:
                              window.innerWidth <= 768 ? "14px" : "16px", // Mobile: icone più piccole
                            cursor: "pointer",
                            opacity: 0.7,
                            color:
                              config.theme === "dark" ? "#f9fafb" : "#111827",
                            minWidth: "24px",
                            height: "24px",
                          },
                        },
                        isMinimized ? "⬆️" : "⬇️"
                      ),
                      React.createElement(
                        "button",
                        {
                          key: "close",
                          onClick: () => setIsOpen(false),
                          style: {
                            background: "none",
                            border: "none",
                            fontSize:
                              window.innerWidth <= 768 ? "14px" : "16px", // Mobile: icone più piccole
                            cursor: "pointer",
                            opacity: 0.7,
                            color:
                              config.theme === "dark" ? "#f9fafb" : "#111827",
                            minWidth: "24px",
                            height: "24px",
                          },
                        },
                        "✕"
                      ),
                    ]
                  ),
                ]
              ),

              // Messages - MOBILE RESPONSIVE
              !isMinimized &&
                React.createElement(
                  "div",
                  {
                    key: "chat-messages",
                    style: {
                      flex: 1,
                      overflowY: "auto",
                      padding: window.innerWidth <= 768 ? "12px" : "16px", // Mobile: padding ridotto
                      display: "flex",
                      flexDirection: "column",
                      gap: window.innerWidth <= 768 ? "8px" : "12px", // Mobile: gap ridotto
                    },
                  },
                  [
                    ...messages.map((message) =>
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
                            padding:
                              window.innerWidth <= 768
                                ? "8px 12px"
                                : "10px 14px", // Mobile: padding ridotto
                            backgroundColor:
                              message.sender === "user" ? "#f66061" : "#f3f4f6",
                            color:
                              message.sender === "user" ? "white" : "#374151",
                            borderRadius: "12px",
                            maxWidth: window.innerWidth <= 768 ? "90%" : "85%", // Mobile: più largo
                            wordWrap: "break-word",
                            fontSize:
                              window.innerWidth <= 768 ? "13px" : "14px", // Mobile: font più piccolo
                            lineHeight: "1.5",
                          },
                          dangerouslySetInnerHTML: {
                            __html: formatMessageText(message.text),
                          },
                        })
                      )
                    ),
                    isLoading &&
                      React.createElement(
                        "div",
                        {
                          key: "loading",
                          style: {
                            display: "flex",
                            justifyContent: "flex-start",
                          },
                        },
                        React.createElement(
                          "div",
                          {
                            style: {
                              padding:
                                window.innerWidth <= 768
                                  ? "8px 12px"
                                  : "10px 14px",
                              backgroundColor: "#f3f4f6",
                              borderRadius: "12px",
                              color: "#6b7280",
                              fontSize:
                                window.innerWidth <= 768 ? "13px" : "14px",
                            },
                          },
                          "Veronica sta scrivendo..."
                        )
                      ),
                    React.createElement("div", {
                      key: "end",
                      ref: messagesEndRef,
                    }),
                  ]
                ),

              // Input - MOBILE RESPONSIVE
              !isMinimized &&
                React.createElement(
                  "form",
                  {
                    key: "chat-form",
                    onSubmit: handleSubmit,
                    style: {
                      padding: window.innerWidth <= 768 ? "12px" : "16px", // Mobile: padding ridotto
                      borderTop: "1px solid #e5e7eb",
                      backgroundColor:
                        config.theme === "dark" ? "#374151" : "white",
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
                        padding:
                          window.innerWidth <= 768 ? "8px 10px" : "8px 12px", // Mobile: padding ridotto
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: window.innerWidth <= 768 ? "16px" : "14px", // Mobile: 16px previene zoom su iOS
                        outline: "none",
                        backgroundColor:
                          config.theme === "dark" ? "#4b5563" : "white",
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
                          padding:
                            window.innerWidth <= 768 ? "8px 12px" : "8px 16px", // Mobile: padding ridotto
                          backgroundColor: "#f66061",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: window.innerWidth <= 768 ? "13px" : "14px",
                          cursor:
                            !inputValue.trim() || isLoading
                              ? "not-allowed"
                              : "pointer",
                          opacity: !inputValue.trim() || isLoading ? 0.6 : 1,
                          minWidth: window.innerWidth <= 768 ? "40px" : "auto", // Mobile: larghezza minima
                        },
                      },
                      "💬"
                    ),
                  ]
                ),
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
