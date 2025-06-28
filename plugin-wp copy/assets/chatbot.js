/**
 * Veronica Schembri Chatbot Frontend - Sicurezza Graduale
 * React-based chatbot widget con protezioni minimali
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

  // SICUREZZA: Sanitizzazione base
  function sanitizeInput(input) {
    if (!input || typeof input !== "string") return "";

    // Step 1: Pre-validazione - blocca se sospetto
    if (!validateInput(input)) {
      console.warn("🔒 Input bloccato dalla pre-validazione");
      return "[CONTENUTO BLOCCATO]";
    }

    // Step 2: Lista entità da rimuovere/sostituire
    const suspiciousEntities = [
      // Script tags
      { pattern: /&lt;script[^>]*&gt;/gi, replacement: "[SCRIPT-BLOCKED]" },
      { pattern: /&#60;script[^>]*&#62;/gi, replacement: "[SCRIPT-BLOCKED]" },
      {
        pattern: /&amp;lt;script[^>]*&amp;gt;/gi,
        replacement: "[SCRIPT-BLOCKED]",
      },

      // Iframe tags
      { pattern: /&lt;iframe[^>]*&gt;/gi, replacement: "[IFRAME-BLOCKED]" },
      { pattern: /&#60;iframe[^>]*&#62;/gi, replacement: "[IFRAME-BLOCKED]" },
      {
        pattern: /&amp;lt;iframe[^>]*&amp;gt;/gi,
        replacement: "[IFRAME-BLOCKED]",
      },

      // Event handlers
      { pattern: /on\w+\s*=/gi, replacement: "[EVENT-BLOCKED]=" },

      // JavaScript protocols
      { pattern: /javascript:/gi, replacement: "[JS-BLOCKED]:" },
      { pattern: /vbscript:/gi, replacement: "[VBS-BLOCKED]:" },
    ];

    let sanitized = input;

    // Step 3: Applica le sostituzioni
    suspiciousEntities.forEach(({ pattern, replacement }) => {
      sanitized = sanitized.replace(pattern, replacement);
    });

    // Step 4: Rimuovi tag script tradizionali (backup)
    sanitized = sanitized
      .replace(/<script[^>]*>.*?<\/script>/gis, "[SCRIPT-BLOCKED]")
      .replace(/<iframe[^>]*>/gis, "[IFRAME-BLOCKED]")
      .replace(/<object[^>]*>/gis, "[OBJECT-BLOCKED]")
      .trim();

    return sanitized;
  }

  // SICUREZZA: Validazione input
  function validateInput(input) {
    if (!input || typeof input !== "string") return false;
    if (input.length > 1000) return false;
    if (input.trim().length === 0) return false;

    // Step 1: Decodifica multipla per catturare codifiche annidate
    let decodedInput = input;
    const maxIterations = 5;
    let iteration = 0;

    do {
      const previous = decodedInput;
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = decodedInput;
      decodedInput = tempDiv.textContent || tempDiv.innerText || "";
      iteration++;

      if (decodedInput === previous || iteration >= maxIterations) break;
    } while (true);

    // Step 2: Pattern sospetti estesi
    const forbiddenPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /data:text\/html/i,
      /vbscript:/i,
      /<img[^>]*onerror/i,
      /<[^>]*on\w+\s*=/i, // Qualsiasi tag con eventi
    ];

    // Step 3: Controlla sia input originale che decodificato
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(input) || pattern.test(decodedInput)) {
        console.warn("🔒 Pattern sospetto rilevato:", pattern.toString());
        return false;
      }
    }

    // Step 4: Entità HTML sospette (tutte le varianti)
    const suspiciousEntities = [
      // Script variants
      "&lt;script",
      "&#60;script",
      "&#x3c;script",
      "&#x3C;script",
      "&amp;lt;script",
      "&amp;#60;script",
      "&amp;#x3c;script",

      // Iframe variants
      "&lt;iframe",
      "&#60;iframe",
      "&#x3c;iframe",
      "&#x3C;iframe",
      "&amp;lt;iframe",
      "&amp;#60;iframe",
      "&amp;#x3c;iframe",

      // Object variants
      "&lt;object",
      "&#60;object",
      "&#x3c;object",
      "&#x3C;object",
      "&amp;lt;object",
      "&amp;#60;object",
      "&amp;#x3c;object",

      // Event handlers (anche codificati)
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "&#111;&#110;&#101;&#114;&#114;&#111;&#114;", // onerror codificato

      // Protocols
      "javascript:",
      "vbscript:",
      "data:text/html",
    ];

    // Step 5: Controlla case-insensitive
    const inputLower = input.toLowerCase();
    for (const entity of suspiciousEntities) {
      if (inputLower.includes(entity.toLowerCase())) {
        console.warn("🔒 Entità sospetta rilevata:", entity);
        return false;
      }
    }

    // Step 6: Pattern di codifica avanzati
    const encodingPatterns = [
      /&amp;(lt|gt|quot|#\d+|#x[0-9a-f]+);/i, // Doppia codifica
      /&#x?[0-9a-f]+;.*script/i, // Hex/decimal + script
      /&[a-z]+;.*on\w+/i, // Entità + eventi
      /(&amp;)+/i, // Multiple &amp;
    ];

    for (const pattern of encodingPatterns) {
      if (pattern.test(input)) {
        console.warn("🔒 Pattern di codifica sospetto:", pattern.toString());
        return false;
      }
    }

    return true;
  }

  // Markdown formatting function (ORIGINALE - MANTENIAMO)
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
    const [error, setError] = React.useState("");
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

    // SICUREZZA: Input handler con validazione
    const handleInputChange = (e) => {
      const value = e.target.value;
      setError("");

      if (value.length > 1000) {
        setError("Messaggio troppo lungo (max 1000 caratteri)");
        return;
      }

      setInputValue(value);
    };

    const sendMessage = async (text) => {
      // SICUREZZA: Validazione multipla
      if (!validateInput(text)) {
        setError("Input contiene contenuto non permesso o non valido");
        return;
      }

      // SICUREZZA: Sanitizza input con controllo aggiuntivo
      const sanitizedText = sanitizeInput(text);

      // Controlla se la sanitizzazione ha bloccato contenuto
      if (
        sanitizedText.includes("[BLOCKED]") ||
        sanitizedText.includes("CONTENUTO BLOCCATO")
      ) {
        setError("Contenuto non permesso rilevato e bloccato");
        return;
      }

      const userMessage = {
        id: Date.now(),
        text: sanitizedText,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(config.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // SICUREZZA: Aggiungi nonce
            "X-WP-Nonce": config.nonce,
          },
          body: JSON.stringify({
            message: sanitizedText,
            history: messages.slice(-10).map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            // SICUREZZA: Includi nonce nel body
            _wpnonce: config.nonce,
          }),
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Richiesta non autorizzata");
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
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
        setError(error.message || "Errore di connessione");

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
      if (!inputValue.trim() || inputValue.length > 1000) return;
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
                "AI Engineer · Sicilia · 🔒 Sicuro"
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

          // Input area with error display
          React.createElement(
            "div",
            {
              key: "input-area",
              style: {
                padding: "16px",
                borderTop: "1px solid #e5e7eb",
                backgroundColor: config.theme === "dark" ? "#374151" : "white",
              },
            },
            [
              // Error message
              error &&
                React.createElement(
                  "div",
                  {
                    key: "error",
                    style: {
                      padding: "8px 12px",
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      fontSize: "14px",
                      marginBottom: "8px",
                    },
                  },
                  error
                ),

              // Input form
              React.createElement(
                "form",
                {
                  key: "form",
                  onSubmit: handleSubmit,
                  style: {
                    display: "flex",
                    gap: "8px",
                  },
                },
                [
                  React.createElement("input", {
                    key: "input",
                    type: "text",
                    value: inputValue,
                    onChange: handleInputChange,
                    placeholder: "Scrivi un messaggio... (max 1000 caratteri)",
                    disabled: isLoading,
                    maxLength: 1000,
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
                      disabled:
                        !inputValue.trim() ||
                        isLoading ||
                        inputValue.length > 1000,
                      style: {
                        padding: "8px 16px",
                        backgroundColor: "#f66061",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor:
                          !inputValue.trim() ||
                          isLoading ||
                          inputValue.length > 1000
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          !inputValue.trim() ||
                          isLoading ||
                          inputValue.length > 1000
                            ? 0.6
                            : 1,
                      },
                    },
                    "💬"
                  ),
                ]
              ),

              // Character counter
              React.createElement(
                "div",
                {
                  key: "counter",
                  style: {
                    marginTop: "4px",
                    fontSize: "12px",
                    color: inputValue.length > 900 ? "#dc2626" : "#6b7280",
                    textAlign: "right",
                  },
                },
                `${inputValue.length}/1000 caratteri · 🔒 Sicuro`
              ),
            ]
          ),
        ]
      );
    }

    // Floating widget version (MOBILE RESPONSIVE - MANTENIAMO ORIGINALE)
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

        // Chat window - MOBILE RESPONSIVE (MANTENIAMO ORIGINALE CON AGGIUNTE SICUREZZA)
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
              // Chat header con sicurezza indicator
              React.createElement(
                "div",
                {
                  key: "chat-header",
                  style: {
                    padding: window.innerWidth <= 768 ? "12px 16px" : "16px",
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
                          fontSize: window.innerWidth <= 768 ? "15px" : "16px",
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
                              window.innerWidth <= 768 ? "11px" : "12px",
                            opacity: 0.7,
                          },
                        },
                        "AI Engineer · 🔒 Sicuro"
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
                              window.innerWidth <= 768 ? "14px" : "16px",
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
                              window.innerWidth <= 768 ? "14px" : "16px",
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

              // Messages (STESSO CONTENUTO DELL'EMBEDDED)
              !isMinimized &&
                React.createElement(
                  "div",
                  {
                    key: "chat-messages",
                    style: {
                      flex: 1,
                      overflowY: "auto",
                      padding: window.innerWidth <= 768 ? "12px" : "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: window.innerWidth <= 768 ? "8px" : "12px",
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
                                : "10px 14px",
                            backgroundColor:
                              message.sender === "user" ? "#f66061" : "#f3f4f6",
                            color:
                              message.sender === "user" ? "white" : "#374151",
                            borderRadius: "12px",
                            maxWidth: window.innerWidth <= 768 ? "90%" : "85%",
                            wordWrap: "break-word",
                            fontSize:
                              window.innerWidth <= 768 ? "13px" : "14px",
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

              // Input area (CON SICUREZZA AGGIUNTA)
              !isMinimized &&
                React.createElement(
                  "div",
                  {
                    key: "chat-input-area",
                    style: {
                      padding: window.innerWidth <= 768 ? "12px" : "16px",
                      borderTop: "1px solid #e5e7eb",
                      backgroundColor:
                        config.theme === "dark" ? "#374151" : "white",
                    },
                  },
                  [
                    // Error display
                    error &&
                      React.createElement(
                        "div",
                        {
                          key: "error",
                          style: {
                            padding: "6px 10px",
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            fontSize: "12px",
                            marginBottom: "8px",
                          },
                        },
                        error
                      ),

                    // Form
                    React.createElement(
                      "form",
                      {
                        key: "chat-form",
                        onSubmit: handleSubmit,
                        style: {
                          display: "flex",
                          gap: "8px",
                        },
                      },
                      [
                        React.createElement("input", {
                          key: "chat-input",
                          type: "text",
                          value: inputValue,
                          onChange: handleInputChange,
                          placeholder: "Scrivi... (max 1000)",
                          disabled: isLoading,
                          maxLength: 1000,
                          style: {
                            flex: 1,
                            padding:
                              window.innerWidth <= 768
                                ? "8px 10px"
                                : "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize:
                              window.innerWidth <= 768 ? "16px" : "14px", // Mobile: 16px previene zoom su iOS
                            outline: "none",
                            backgroundColor:
                              config.theme === "dark" ? "#4b5563" : "white",
                            color:
                              config.theme === "dark" ? "#f9fafb" : "#111827",
                          },
                        }),
                        React.createElement(
                          "button",
                          {
                            key: "chat-submit",
                            type: "submit",
                            disabled:
                              !inputValue.trim() ||
                              isLoading ||
                              inputValue.length > 1000,
                            style: {
                              padding:
                                window.innerWidth <= 768
                                  ? "8px 12px"
                                  : "8px 16px",
                              backgroundColor: "#f66061",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              fontSize:
                                window.innerWidth <= 768 ? "13px" : "14px",
                              cursor:
                                !inputValue.trim() ||
                                isLoading ||
                                inputValue.length > 1000
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                !inputValue.trim() ||
                                isLoading ||
                                inputValue.length > 1000
                                  ? 0.6
                                  : 1,
                              minWidth:
                                window.innerWidth <= 768 ? "40px" : "auto",
                            },
                          },
                          "💬"
                        ),
                      ]
                    ),

                    // Character counter
                    React.createElement(
                      "div",
                      {
                        key: "counter",
                        style: {
                          marginTop: "4px",
                          fontSize: "11px",
                          color:
                            inputValue.length > 900 ? "#dc2626" : "#6b7280",
                          textAlign: "right",
                        },
                      },
                      `${inputValue.length}/1000 · 🔒 Sicuro`
                    ),
                  ]
                ),
            ]
          ),
      ]
    );
  }

  // Initialize chatbot (MANTENIAMO ORIGINALE)
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

  // Start when DOM and React are ready (MANTENIAMO ORIGINALE)
  document.addEventListener("DOMContentLoaded", function () {
    waitForReact(initChatbot);
  });

  // Also try to start immediately if DOM is already loaded
  if (document.readyState === "loading") {
    // DOM not ready
  } else {
    waitForReact(initChatbot);
  }

  // SICUREZZA: Log di inizializzazione
  console.log("🔒 Veronica Chatbot Sicuro v1.0.1 - Pronto");
})();
