/**
 * UI Components Module - Bridge di Compatibilità per v4
 * TRANSITORIO: Re-export dal nuovo sistema modulare
 * Mantiene compatibilità con import esistenti mentre migriamo
 */

// =====================================
// RE-EXPORT DAL SISTEMA MODULARE V4
// =====================================

// Import principale dal nuovo sistema
export { VeronicaChatbot } from "./ui-components/index.js";

// Re-export utility functions se utilizzate altrove
export {
  buildClassName,
  formatMessageTimestamp,
  scrollToBottom,
} from "./ui-components/ui-utils.js";

// Re-export componenti se utilizzati singolarmente
export {
  MessageList,
  MessageItem,
  InputForm,
  UIControls,
} from "./ui-components/index.js";

// Re-export hooks se utilizzati
export {
  useUIState,
  useMessageHandling,
  useChatSession,
} from "./ui-components/hooks.js";

// =====================================
// DEPRECATION WARNING (solo in dev)
// =====================================

import { isDevelopmentMode, devLog } from "./config.js";

if (isDevelopmentMode()) {
  console.warn(
    "⚠️ DEPRECATION: ui-components.js è deprecato. " +
      "Usa import specifici da ui-components/* invece. " +
      "Questo file sarà rimosso nella v5."
  );

  devLog("📦 Bridge di compatibilità ui-components.js caricato");
}
