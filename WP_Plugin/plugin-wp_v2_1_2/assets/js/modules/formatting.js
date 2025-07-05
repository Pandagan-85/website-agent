/**
 * Veronica Chatbot - Formatting Module
 * Codice estratto da chatbot.js (righe 601-750 circa)
 * Gestisce rendering e formattazione messaggi
 */

// =====================================
// RENDERING CONTENUTO MESSAGGI
// =====================================

export function renderMessageContent(message, config) {
  const baseStyle = {
    maxWidth: "85%",
    padding: "12px 16px",
    fontSize: "14px",
    lineHeight: "1.4",
    wordWrap: "break-word",
  };

  if (message.sender === "user") {
    // MESSAGGI UTENTE: Solo testo puro, sempre
    return React.createElement(
      "div",
      {
        style: {
          ...baseStyle,
          borderRadius: "18px 18px 4px 18px",
          backgroundColor: "#f66061",
          color: "white",
        },
      },
      message.content // Solo testo, niente HTML
    );
  } else {
    // MESSAGGI BOT: HTML processato da markdown
    const processedContent = formatBotMessageSafely(
      message.content || message.text || ""
    );

    return React.createElement("div", {
      style: {
        ...baseStyle,
        borderRadius: "18px 18px 18px 4px",
        backgroundColor: message.isError
          ? "#fee2e2"
          : config.theme === "dark"
          ? "#374151"
          : "#f3f4f6",
        color: message.isError
          ? "#dc2626"
          : config.theme === "dark"
          ? "#f9fafb"
          : "#111827",
      },
      dangerouslySetInnerHTML: {
        __html: processedContent,
      },
    });
  }
}

// =====================================
// FORMATTAZIONE SICURA MESSAGGI BOT
// =====================================

export function formatBotMessageSafely(text) {
  if (!text) return "";

  console.log("🔧 Processing markdown:", text.substring(0, 100) + "...");

  // Step 1: Solo sicurezza di base
  let formatted = text
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, "")
    .replace(/javascript:/gi, "[JS-REMOVED]");

  // Step 2: Markdown semplice → HTML
  formatted = formatted
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Headers
    .replace(
      /^### (.*$)/gm,
      '<h3 style="margin: 12px 0 8px 0; font-weight: bold; color: inherit;">$1</h3>'
    )
    .replace(
      /^## (.*$)/gm,
      '<h2 style="margin: 14px 0 10px 0; font-weight: bold; color: inherit;">$1</h2>'
    )
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #f66061; text-decoration: underline;">$1</a>'
    )
    // Liste
    .replace(/^- (.+)$/gm, '<li style="margin-bottom: 4px;">$1</li>')
    // Newlines
    .replace(/\n/g, "<br>");

  // Step 3: Wrappa liste in <ul>
  formatted = formatted
    .replace(
      /(<li[^>]*>.*?<\/li>)(<br>(<li[^>]*>.*?<\/li>))*(<br>)?/g,
      '<ul style="margin: 8px 0; padding-left: 20px;">$&</ul>'
    )
    .replace(/<br>(<li|<\/ul>)/g, "$1")
    .replace(/(<ul[^>]*>)<br>/g, "$1");

  console.log("✅ Result:", formatted.substring(0, 200) + "...");
  return formatted;
}
