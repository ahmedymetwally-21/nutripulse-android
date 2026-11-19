import { useEffect, useMemo } from "react";
import { LanguageContext } from "./useLanguage";
import {
  translate,
  translateMealLabel,
  translateCategoryLabel,
  translateGoalTagLabel
} from "./translations";

export function LanguageProvider({ lang, setLang, children }) {
  const isRtl = lang === "ar";

  useEffect(() => {
    try {
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    } catch {
      // Ignore in non-DOM environments
    }
  }, [lang, isRtl]);

  const value = useMemo(
    () => ({
      lang,
      isRtl,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      translateMeal: (meal) => translateMealLabel(meal, lang),
      translateCategory: (cat) => translateCategoryLabel(cat, lang),
      translateGoalTag: (tag) => translateGoalTagLabel(tag, lang)
    }),
    [lang, isRtl, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
