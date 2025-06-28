/**
 * Veronica Schembri Chatbot Frontend - Fix XSS Completo
 * React-based chatbot widget con protezioni complete
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

  // =============== SICUREZZA: FUNZIONI DI SANITIZZAZIONE AVANZATE ===============

  /**
   * Lista completa di tag e attributi pericolosi
   */
  const DANGEROUS_PATTERNS = {
    tags: [
      "script",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "link",
      "meta",
      "style",
      "base",
      "frame",
      "frameset",
      "applet",
      "bgsound",
      "isindex",
      "layer",
      "blink",
      "comment",
      "xml",
      "nextid",
    ],
    attributes: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "onchange",
      "onsubmit",
      "onreset",
      "onselect",
      "onunload",
      "onbeforeunload",
      "onkeydown",
      "onkeyup",
      "onkeypress",
      "onmousedown",
      "onmouseup",
      "onmousemove",
      "onmouseout",
      "onmouseenter",
      "onmouseleave",
      "ondblclick",
      "oncontextmenu",
      "onwheel",
      "ontouchstart",
      "ontouchend",
      "ontouchmove",
      "onpointerdown",
      "onpointerup",
      "onpointermove",
      "javascript:",
      "vbscript:",
      "data:",
      "livescript:",
    ],
    protocols: ["javascript:", "vbscript:", "data:", "livescript:", "mocha:"],
  };

  /**
   * Sanitizzazione SICURA che rimuove tutto l'HTML pericoloso
   */
  function secureSanitize(input) {
    if (!input || typeof input !== "string") return "";

    // Step 1: Log del tentativo
    if (containsXSS(input)) {
      console.warn("🔒 TENTATIVO XSS BLOCCATO:", input.substring(0, 100));
      return "[CONTENUTO BLOCCATO PER SICUREZZA]";
    }

    // Step 2: Decodifica HTML entities in modo sicuro
    let sanitized = input;

    // Decodifica solo entità numeriche sicure (non hex)
    sanitized = sanitized.replace(/&#(\d+);/g, (match, num) => {
      const code = parseInt(num, 10);
      // Blocca codici sospetti (< > " ' &)
      if (
        code === 60 ||
        code === 62 ||
        code === 34 ||
        code === 39 ||
        code === 38
      ) {
        return `[ENTITY-${code}-BLOCKED]`;
      }
      // Permetti solo caratteri stampabili sicuri
      if (code >= 32 && code <= 126 && code !== 60 && code !== 62) {
        return String.fromCharCode(code);
      }
      return `[ENTITY-${code}-BLOCKED]`;
    });

    // Step 3: Rimuovi tutte le entità hex (più pericolose)
    sanitized = sanitized.replace(/&#x[0-9a-fA-F]+;/g, "[HEX-ENTITY-BLOCKED]");

    // Step 4: Rimuovi entità nominate sospette
    const suspiciousEntities = ["&lt;", "&gt;", "&quot;", "&apos;", "&amp;"];
    suspiciousEntities.forEach((entity) => {
      sanitized = sanitized.replace(
        new RegExp(entity, "gi"),
        "[ENTITY-BLOCKED]"
      );
    });

    // Step 5: Rimuovi TUTTI i tag HTML (più sicuro)
    sanitized = sanitized.replace(/<[^>]*>/g, "[TAG-REMOVED]");

    // Step 6: Rimuovi tutti i protocolli pericolosi
    DANGEROUS_PATTERNS.protocols.forEach((protocol) => {
      sanitized = sanitized.replace(
        new RegExp(protocol, "gi"),
        "[PROTOCOL-BLOCKED]"
      );
    });

    // Step 7: Rimuovi pattern di eventi JavaScript
    sanitized = sanitized.replace(/on\w+\s*=/gi, "[EVENT-BLOCKED]=");

    return sanitized.trim();
  }

  /**
   * Detecta potenziali tentativi XSS
   */
  function containsXSS(input) {
    if (!input || typeof input !== "string") return false;

    const suspicious = [
      /<script/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<img/i,
      /<svg/i,
      /javascript:/i,
      /vbscript:/i,
      /data:/i,
      /on\w+\s*=/i,
      /&lt;script/i,
      /&#60;script/i,
      /&#x3c;script/i,
      /&lt;iframe/i,
      /&#60;iframe/i,
      /&#x3c;iframe/i,
      /onerror/i,
      /onload/i,
      /onclick/i,
      /onmouseover/i,
      /alert\s*\(/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,
      /&amp;lt;/i,
      /&amp;gt;/i, // Doppia codifica
      /<\/script>/i,
      /<\/iframe>/i,
    ];

    return suspicious.some((pattern) => pattern.test(input));
  }

  /**
   * Validazione input POTENZIATA
   */
  function validateInput(input) {
    if (!input || typeof input !== "string") return false;
    if (input.length > 1000) return false;
    if (input.trim().length === 0) return false;

    // Controllo diretto per XSS
    if (containsXSS(input)) {
      console.warn("🔒 Input respinto per contenuto XSS");
      return false;
    }

    return true;
  }

  /**
   * Rendering sicuro del testo per INPUT UTENTE (SENZA dangerouslySetInnerHTML)
   */
  function createSafeTextElement(text, isUserInput = true) {
    if (!text || typeof text !== "string") {
      return React.createElement("span", {}, "");
    }

    if (isUserInput) {
      // Per input utente: sanitizzazione completa, niente HTML
      const safeText = secureSanitize(text);
      return React.createElement("span", {}, safeText);
    } else {
      // Per risposte bot: markdown sicuro consentito
      return createSafeMarkdownElement(text);
    }
  }

  /**
   * Rendering sicuro del markdown SOLO per risposte del bot
   */
  function createSafeMarkdownElement(text) {
    if (!text || typeof text !== "string") {
      return React.createElement("span", {}, "");
    }

    // Step 1: Sanitizzazione di base (rimuovi script e eventi pericolosi)
    let sanitized = text
      .replace(/<script[^>]*>.*?<\/script>/gis, "[SCRIPT-BLOCKED]")
      .replace(/<iframe[^>]*>.*?<\/iframe>/gis, "[IFRAME-BLOCKED]")
      .replace(/on\w+\s*=/gi, "[EVENT-BLOCKED]=")
      .replace(/javascript:/gi, "[JS-BLOCKED]:")
      .replace(/vbscript:/gi, "[VBS-BLOCKED]:");

    // Step 2: Processa markdown in modo sicuro
    const lines = sanitized.split("\n");
    const elements = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Headers
      if (line.startsWith("### ")) {
        elements.push(
          React.createElement(
            "h3",
            {
              key: currentIndex++,
              style: { margin: "8px 0", fontWeight: "bold", fontSize: "1.1em" },
            },
            line.substring(4)
          )
        );
        continue;
      }

      if (line.startsWith("## ")) {
        elements.push(
          React.createElement(
            "h2",
            {
              key: currentIndex++,
              style: {
                margin: "10px 0",
                fontWeight: "bold",
                fontSize: "1.2em",
              },
            },
            line.substring(3)
          )
        );
        continue;
      }

      if (line.startsWith("# ")) {
        elements.push(
          React.createElement(
            "h1",
            {
              key: currentIndex++,
              style: {
                margin: "12px 0",
                fontWeight: "bold",
                fontSize: "1.3em",
              },
            },
            line.substring(2)
          )
        );
        continue;
      }

      // Paragrafo normale con bold e link
      const processedLine = processInlineMarkdown(line, currentIndex);
      if (processedLine) {
        elements.push(
          React.createElement(
            "p",
            {
              key: currentIndex++,
              style: { margin: "4px 0", lineHeight: "1.5" },
            },
            processedLine
          )
        );
      }
    }

    return React.createElement(
      "div",
      {},
      elements.length > 0 ? elements : text
    );
  }

  /**
   * Processa markdown inline (bold, link) in modo sicuro
   */
  function processInlineMarkdown(text, baseIndex) {
    if (!text.trim()) return null;

    const parts = [];
    let currentText = text;
    let partIndex = 0;

    // Processa **bold**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Aggiungi testo prima del bold
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(...processLinks(beforeText, baseIndex + partIndex));
          partIndex += beforeText.length;
        }
      }

      // Aggiungi elemento bold
      parts.push(
        React.createElement(
          "strong",
          {
            key: `${baseIndex}-bold-${partIndex++}`,
          },
          match[1]
        )
      );

      lastIndex = match.index + match[0].length;
    }

    // Aggiungi testo rimanente
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(...processLinks(remainingText, baseIndex + partIndex));
      }
    }

    return parts.length > 0 ? parts : processLinks(text, baseIndex);
  }

  /**
   * Processa link in modo sicuro
   */
  function processLinks(text, baseIndex) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let partIndex = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      // Testo prima del link
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }

      // Validazione URL sicura
      const url = match[2];
      const linkText = match[1];

      if (isValidUrl(url)) {
        parts.push(
          React.createElement(
            "a",
            {
              key: `${baseIndex}-link-${partIndex++}`,
              href: url,
              target: "_blank",
              rel: "noopener noreferrer",
              style: { color: "#f66061", textDecoration: "underline" },
            },
            linkText
          )
        );
      } else {
        parts.push(`[${linkText}](${url})`); // Fallback come testo
      }

      lastIndex = match.index + match[0].length;
    }

    // Testo rimanente
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    return parts.length > 0 ? parts : [text];
  }

  /**
   * Validazione URL sicura
   */
  function isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      // Permetti solo HTTP/HTTPS
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Gestione input con validazione totale
   */
  function handleInputChange(e, setInputValue, setError) {
    const value = e.target.value;
    setError("");

    // Controllo lunghezza
    if (value.length > 1000) {
      setError("Messaggio troppo lungo (max 1000 caratteri)");
      return;
    }

    // Controllo XSS in tempo reale
    if (containsXSS(value)) {
      setError("⚠️ Contenuto non permesso rilevato");
      setInputValue(""); // Pulisce l'input immediatamente
      return;
    }

    setInputValue(value);
  }

  // Wait for React to be available
  function waitForReact(callback) {
    if (typeof React !== "undefined" && typeof ReactDOM !== "undefined") {
      callback();
    } else {
      setTimeout(() => waitForReact(callback), 100);
    }
  }

  // =============== CHATBOT COMPONENT CON SICUREZZA TOTALE ===============
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

      // Add initial message (SANITIZZATO)
      if (config.initialMessage) {
        setMessages([
          {
            id: Date.now(),
            text: secureSanitize(config.initialMessage),
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }
    }, []);

    /**
     * Gestione input con validazione XSS
     */
    const handleInputChangeSecure = (e) => {
      handleInputChange(e, setInputValue, setError);
    };

    /**
     * Invio messaggio con controlli di sicurezza multipli
     */
    const sendMessage = async (text) => {
      // CONTROLLO 1: Validazione base
      if (!validateInput(text)) {
        setError("❌ Input non valido o contiene contenuto pericoloso");
        setInputValue(""); // Pulisce l'input
        return;
      }

      // CONTROLLO 2: Doppio controllo XSS
      if (containsXSS(text)) {
        setError("🔒 Contenuto XSS rilevato e bloccato");
        setInputValue(""); // Pulisce l'input
        return;
      }

      // CONTROLLO 3: Sanitizzazione finale
      const sanitizedText = secureSanitize(text);

      // CONTROLLO 4: Verifica se la sanitizzazione ha rimosso contenuto
      if (
        sanitizedText.includes("[BLOCKED]") ||
        sanitizedText.includes("[REMOVED]")
      ) {
        setError("🚫 Contenuto pericoloso rimosso per sicurezza");
        setInputValue(""); // Pulisce l'input
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
            "X-WP-Nonce": config.nonce,
          },
          body: JSON.stringify({
            message: sanitizedText,
            history: messages.slice(-10).map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: secureSanitize(msg.text), // Sanitizza anche la history
            })),
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

        // SICUREZZA: Sanitizza anche la risposta del bot (MA PRESERVA MARKDOWN)
        const botResponse =
          data.response ||
          "Mi dispiace, non sono riuscita a elaborare la tua richiesta.";

        const botMessage = {
          id: Date.now() + 1,
          text: botResponse, // NON sanitizziamo qui, lo faremo nel rendering
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

    // =============== RENDERING SICURO DEI MESSAGGI ===============
    const renderMessage = (message) => {
      return React.createElement(
        "div",
        {
          key: message.id,
          style: {
            display: "flex",
            justifyContent:
              message.sender === "user" ? "flex-end" : "flex-start",
          },
        },
        React.createElement(
          "div",
          {
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
          },
          // USA createSafeTextElement con flag per distinguere user vs bot
          createSafeTextElement(message.text, message.sender === "user")
        )
      );
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
                "AI Engineer · Sicilia · 🛡️ Protetto XSS"
              ),
            ]
          ),

          // Messages (RENDERING SICURO)
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
              ...messages.map(renderMessage),
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

          // Input area with STRONG error display
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
              // Error message con stile prominente
              error &&
                React.createElement(
                  "div",
                  {
                    key: "error",
                    style: {
                      padding: "12px 16px",
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      border: "2px solid #f87171",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "12px",
                      textAlign: "center",
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
                    onChange: handleInputChangeSecure,
                    placeholder:
                      "Scrivi un messaggio sicuro... (max 1000 caratteri)",
                    disabled: isLoading,
                    maxLength: 1000,
                    style: {
                      flex: 1,
                      padding: "8px 12px",
                      border: error ? "2px solid #f87171" : "1px solid #d1d5db",
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
                        inputValue.length > 1000 ||
                        error,
                      style: {
                        padding: "8px 16px",
                        backgroundColor: error ? "#6b7280" : "#f66061",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
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
                      },
                    },
                    "💬"
                  ),
                ]
              ),

              // Character counter con indicatore sicurezza
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
                `${inputValue.length}/1000 caratteri · 🛡️ Protetto XSS`
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

        // Chat window - STESSA LOGICA SICURA DELL'EMBEDDED
        isOpen &&
          React.createElement(
            "div",
            {
              key: "chat",
              style: {
                width:
                  window.innerWidth <= 768 ? "calc(100vw - 40px)" : "380px",
                maxWidth: "400px",
                height: isMinimized
                  ? "60px"
                  : window.innerWidth <= 768
                  ? "70vh"
                  : "500px",
                backgroundColor: config.theme === "dark" ? "#1f2937" : "white",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "height 0.3s ease, width 0.3s ease",
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
                      "🐼 Veronica Schembri"
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
                        "AI Engineer · XSS Protected"
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

              // Messages - USA RENDERING SICURO
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
                        React.createElement(
                          "div",
                          {
                            style: {
                              padding:
                                window.innerWidth <= 768
                                  ? "8px 12px"
                                  : "10px 14px",
                              backgroundColor:
                                message.sender === "user"
                                  ? "#f66061"
                                  : "#f3f4f6",
                              color:
                                message.sender === "user" ? "white" : "#374151",
                              borderRadius: "12px",
                              maxWidth:
                                window.innerWidth <= 768 ? "90%" : "85%",
                              wordWrap: "break-word",
                              fontSize:
                                window.innerWidth <= 768 ? "13px" : "14px",
                              lineHeight: "1.5",
                            },
                          },
                          // USA createSafeTextElement con flag user/bot
                          createSafeTextElement(
                            message.text,
                            message.sender === "user"
                          )
                        )
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

              // Input area - STESSA LOGICA SICURA
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
                            padding: "8px 12px",
                            backgroundColor: "#fee2e2",
                            color: "#dc2626",
                            border: "2px solid #f87171",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            marginBottom: "8px",
                            textAlign: "center",
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
                        style: { display: "flex", gap: "8px" },
                      },
                      [
                        React.createElement("input", {
                          key: "chat-input",
                          type: "text",
                          value: inputValue,
                          onChange: handleInputChangeSecure,
                          placeholder: "Scrivi sicuro... (max 1000)",
                          disabled: isLoading,
                          maxLength: 1000,
                          style: {
                            flex: 1,
                            padding:
                              window.innerWidth <= 768
                                ? "8px 10px"
                                : "8px 12px",
                            border: error
                              ? "2px solid #f87171"
                              : "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize:
                              window.innerWidth <= 768 ? "16px" : "14px",
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
                              inputValue.length > 1000 ||
                              error,
                            style: {
                              padding:
                                window.innerWidth <= 768
                                  ? "8px 12px"
                                  : "8px 16px",
                              backgroundColor: error ? "#6b7280" : "#f66061",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              fontSize:
                                window.innerWidth <= 768 ? "13px" : "14px",
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
                      `${inputValue.length}/1000 · 🛡️ Protetto XSS`
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

  // SICUREZZA: Log di inizializzazione
  console.log("🛡️ Veronica Chatbot XSS-Protected v1.0.2 - Pronto");
})();
