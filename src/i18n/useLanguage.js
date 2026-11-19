import { createContext, useContext } from "react";

export const LanguageContext = createContext({
  lang: "en",
  isRtl: false,
  setLang: () => {},
  t: (key) => key,
  translateMeal: (m) => m,
  translateCategory: (c) => c,
  translateGoalTag: (g) => g
});

export function useLanguage() {
  return useContext(LanguageContext);
}
