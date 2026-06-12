import { createContext, useContext, useState } from "react";

const PremiumContext = createContext();

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(true);
  const [chatCount, setChatCount] = useState(0);
  const [suggestionCount, setSuggestionCount] = useState(0);

  const FREE_CHAT_LIMIT = 999;
  const FREE_SUGGESTION_LIMIT = 999;

  const canChat = isPremium || chatCount < FREE_CHAT_LIMIT;
  const canGetSuggestions = isPremium || suggestionCount < FREE_SUGGESTION_LIMIT;

  const incrementChat = () => setChatCount(c => c + 1);
  const incrementSuggestion = () => setSuggestionCount(c => c + 1);

  return (
    <PremiumContext.Provider value={{
      isPremium, setIsPremium,
      canChat, canGetSuggestions,
      chatCount, suggestionCount,
      chatRemaining: Math.max(0, FREE_CHAT_LIMIT - chatCount),
      suggestionRemaining: Math.max(0, FREE_SUGGESTION_LIMIT - suggestionCount),
      incrementChat, incrementSuggestion,
      FREE_CHAT_LIMIT, FREE_SUGGESTION_LIMIT,
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => useContext(PremiumContext);
