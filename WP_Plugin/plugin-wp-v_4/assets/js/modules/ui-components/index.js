/**
 * UI Components Module - Main Export Index
 * Centralizza tutti i re-exports dei componenti UI
 */

// =====================================
// COMPONENTE PRINCIPALE
// =====================================
export { VeronicaChatbot } from "./chatbot-component.js";

// =====================================
// COMPONENTI SUB-MODULI
// =====================================
export { MessageList } from "./message-list.js";
export { MessageItem } from "./message-item.js";
export { InputForm } from "./input-form.js";
export { UIControls } from "./ui-controls.js";

// =====================================
// UTILITY FUNCTIONS
// =====================================
export {
  buildClassName,
  formatMessageTimestamp,
  scrollToBottom,
} from "./ui-utils.js";

// =====================================
// HOOKS PERSONALIZZATI
// =====================================
export { useUIState, useMessageHandling, useChatSession } from "./ui-hooks.js";
