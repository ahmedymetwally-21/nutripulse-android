import { useState, useMemo, useRef } from "react";
import {
  Clock,
  Check,
  AlertTriangle,
  ShoppingBag,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Upload,
  Clipboard,
  Copy,
  Search,
  ChefHat,
  Refrigerator,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import {
  getExpirationStatus,
  rankRecipes,
  buildShoppingList,
  parseInventoryJson,
  parseRecipesJson,
  formatQtyUnit,
  getStepIncrement
} from "../utils/kitchenEngine";
import { useLanguage } from "../i18n/useLanguage";
import RecipeCookModal from "./RecipeCookModal";
import RecipeEditorModal from "./RecipeEditorModal";
import PantryEditorModal from "./PantryEditorModal";

export default function KitchenTab({
  homeInventory,
  setHomeInventory,
  recipes,
  setRecipes,
  allFoods,
  todayKey,
  selectedMeal,
  onLogRecipeMeal,
  triggerToast,
  initialSubTab = "cook",
  initialOpenRecipeId = null
}) {
  const { t, translateCategory } = useLanguage();
  const [subTab, setSubTab] = useState(initialSubTab); // "cook" | "recipes" | "pantry"

  // Modals
  const [activeCookRecipeId, setActiveCookRecipeId] = useState(initialOpenRecipeId);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showRecipeEditor, setShowRecipeEditor] = useState(false);
  const [editingPantryItem, setEditingPantryItem] = useState(null);
  const [showPantryEditor, setShowPantryEditor] = useState(false);

  // Filters & search
  const [pantrySearch, setPantrySearch] = useState("");
  const [pantryFilter, setPantryFilter] = useState("all"); // all | expiring | expired | fresh
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeCatFilter, setRecipeCatFilter] = useState("All");

  // JSON Import drawers & errors
  const [showPantryJsonPaste, setShowPantryJsonPaste] = useState(false);
  const [pantryJsonText, setPantryJsonText] = useState("");
  const [pantryJsonError, setPantryJsonError] = useState("");
  const pantryFileRef = useRef(null);

  const [showRecipeJsonPaste, setShowRecipeJsonPaste] = useState(false);
  const [recipeJsonText, setRecipeJsonText] = useState("");
  const [recipeJsonError, setRecipeJsonError] = useState("");
  const recipeFileRef = useRef(null);

  // Inline confirmations & shopping list
  const [confirmClearPantry, setConfirmClearPantry] = useState(false);
  const [confirmDeleteRecipeId, setConfirmDeleteRecipeId] = useState(null);
  const [showShoppingList, setShowShoppingList] = useState(true);
  const [shoppingScope, setShoppingScope] = useState("near");

  const getLocalizedExpiryLabel = (expiryInfo) => {
    if (expiryInfo.status === "expired") {
      const overdue = Math.abs(expiryInfo.daysLeft);
      return overdue === 1
        ? t("expExpiredOne")
        : t("expExpiredMany", { days: overdue });
    }
    if (expiryInfo.status === "expiring") {
      return expiryInfo.daysLeft === 0
        ? t("expToday")
        : t("expSoon", { days: expiryInfo.daysLeft });
    }
    if (expiryInfo.daysLeft >= 999) return t("expFresh");
    return t("expFreshDays", { days: expiryInfo.daysLeft });
  };

  // Computed Pantry Stats & Sorted List
  const enrichedInventory = useMemo(() => {
    return homeInventory
      .map((item) => ({
        ...item,
        expiryInfo: getExpirationStatus(item.expirationDate, todayKey)
      }))
      .sort((a, b) => a.expiryInfo.daysLeft - b.expiryInfo.daysLeft);
  }, [homeInventory, todayKey]);

  const pantryCounts = useMemo(() => {
    return enrichedInventory.reduce(
      (acc, item) => {
        acc[item.expiryInfo.status] += 1;
        return acc;
      },
      { expired: 0, expiring: 0, fresh: 0 }
    );
  }, [enrichedInventory]);

  const filteredPantry = useMemo(() => {
    const q = pantrySearch.trim().toLowerCase();
    return enrichedInventory.filter((item) => {
      const matchesStatus = pantryFilter === "all" || item.expiryInfo.status === pantryFilter;
      const matchesSearch = !q || item.name.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [enrichedInventory, pantryFilter, pantrySearch]);

  // Smart Recommendation Engine
  const { readyRecipes, partialRecipes, allEvaluated } = useMemo(
    () => rankRecipes(recipes, homeInventory, allFoods, todayKey),
    [recipes, homeInventory, allFoods, todayKey]
  );

  // Shopping list derived from partial recipes
  const shoppingListItems = useMemo(() => {
    const subset =
      shoppingScope === "near"
        ? partialRecipes.filter((r) => r.missingCount <= 2)
        : partialRecipes;
    const effective = subset.length > 0 ? subset : partialRecipes;
    return buildShoppingList(effective);
  }, [partialRecipes, shoppingScope]);

  // Recipe library filtering
  const recipeCategories = useMemo(() => {
    const cats = new Set(recipes.map((r) => r.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [recipes]);

  const filteredEvaluatedRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    return allEvaluated.filter((ev) => {
      const matchesCat = recipeCatFilter === "All" || ev.recipe.category === recipeCatFilter;
      const matchesSearch =
        !q ||
        ev.recipe.name.toLowerCase().includes(q) ||
        ev.recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [allEvaluated, recipeCatFilter, recipeSearch]);

  const activeCookRecipe = useMemo(
    () => recipes.find((r) => r.id === activeCookRecipeId) || null,
    [recipes, activeCookRecipeId]
  );

  // Pantry Handlers
  const handleSavePantryItem = (item) => {
    setHomeInventory((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.map((p) => (p.id === item.id ? item : p));
      }
      return [item, ...prev];
    });
    setShowPantryEditor(false);
    setEditingPantryItem(null);
    triggerToast(t("toastSavedPantry", { name: item.name }));
  };

  const handleDeletePantryItem = (id) => {
    setHomeInventory((prev) => prev.filter((p) => p.id !== id));
    triggerToast(t("toastRemovedPantry"));
  };

  const handleAdjustPantryQty = (item, direction) => {
    const step = getStepIncrement(item.unit, false);
    const nextQty = Math.max(0, +(Number(item.quantity) + direction * step).toFixed(2));
    if (nextQty <= 0) {
      setHomeInventory((prev) => prev.filter((p) => p.id !== item.id));
      triggerToast(t("toastFinishedPantry", { name: item.name }));
    } else {
      setHomeInventory((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, quantity: nextQty } : p))
      );
    }
  };

  const processPantryJson = (rawText) => {
    setPantryJsonError("");
    try {
      const imported = parseInventoryJson(rawText, allFoods, todayKey);
      setHomeInventory((prev) => [...imported, ...prev]);
      setPantryJsonText("");
      setShowPantryJsonPaste(false);
      triggerToast(t("toastImportedPantry", { count: imported.length }));
    } catch (err) {
      setPantryJsonError(err.message || "Invalid JSON format.");
    }
  };

  const handlePantryFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => processPantryJson(String(evt.target?.result || ""));
    reader.readAsText(file);
    e.target.value = "";
  };

  // Recipe Handlers
  const handleSaveRecipe = (saved) => {
    setRecipes((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      if (exists) return prev.map((r) => (r.id === saved.id ? saved : r));
      return [saved, ...prev];
    });
    setShowRecipeEditor(false);
    setEditingRecipe(null);
    triggerToast(t("toastSavedRecipe", { name: saved.name }));
  };

  const handleDeleteRecipe = (id) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setConfirmDeleteRecipeId(null);
    triggerToast(t("toastDeletedRecipe"));
  };

  const handleUpdateRecipeDefault = (recipeId, updatedIngredients) => {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? { ...r, ingredients: updatedIngredients.map((i) => ({ ...i })) }
          : r
      )
    );
    triggerToast(t("toastUpdatedRecipeDefault"));
  };

  const processRecipesJson = (rawText) => {
    setRecipeJsonError("");
    try {
      const imported = parseRecipesJson(rawText, allFoods);
      setRecipes((prev) => {
        const importedNames = new Set(imported.map((r) => r.name.toLowerCase()));
        return [...imported, ...prev.filter((r) => !importedNames.has(r.name.toLowerCase()))];
      });
      setRecipeJsonText("");
      setShowRecipeJsonPaste(false);
      triggerToast(t("toastImportedRecipes", { count: imported.length }));
    } catch (err) {
      setRecipeJsonError(err.message || "Invalid recipe JSON format.");
    }
  };

  const handleRecipeFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => processRecipesJson(String(evt.target?.result || ""));
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCopyShoppingList = async () => {
    if (shoppingListItems.length === 0) return;
    const text = shoppingListItems
      .map((it) => `- ${it.name}: ${formatQtyUnit(it.quantity, it.unit)}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      triggerToast(t("toastCopiedShopping"));
    } catch {
      triggerToast(t("toastShoppingReady"));
    }
  };

  const renderRecipeCard = (ev, showManageControls = false) => {
    const {
      recipe,
      isReady,
      missingCount,
      availableItems,
      missingItems,
      nutrition,
      usesExpiringSoon,
      expiringIngredientNames
    } = ev;

    return (
      <article
        key={recipe.id}
        className={`rounded-3xl border p-4 shadow-xl transition ${
          isReady
            ? usesExpiringSoon
              ? "bg-gradient-to-br from-emerald-950/50 via-slate-900 to-amber-950/30 border-emerald-500/40"
              : "bg-slate-900/90 border-emerald-500/35"
            : "bg-slate-900/90 border-slate-800"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="truncate">{translateCategory(recipe.category)}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-cyan-300 font-semibold whitespace-nowrap shrink-0 tabular-nums">
                <Clock className="w-3 h-3" />
                {t("minShort", { min: recipe.cookingTime })}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white mt-0.5 leading-snug">
              {recipe.name}
            </h3>
          </div>

          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border whitespace-nowrap shrink-0 ${
              isReady
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                : missingCount === 1
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/40"
            }`}
          >
            {isReady
              ? t("readyBadge")
              : missingCount === 1
                ? t("missingOneBadge")
                : t("missingManyBadge", { count: missingCount })}
          </span>
        </div>

        {usesExpiringSoon && (
          <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {t("usesExpiringSoon")} <strong>{expiringIngredientNames.join(", ")}</strong>
            </span>
          </div>
        )}

        <div
          dir="ltr"
          className="mt-2.5 flex items-center justify-center sm:justify-start gap-2 text-xs tabular-nums text-slate-300 bg-slate-950/75 border border-slate-800/80 rounded-xl px-3 py-2"
        >
          <strong className="text-emerald-400 font-extrabold">{nutrition.cal} kcal</strong>
          <span className="text-slate-600">·</span>
          <span>
            P <strong className="text-rose-400">{nutrition.prot}g</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span>
            C <strong className="text-amber-400">{nutrition.carb}g</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span>
            F <strong className="text-purple-400">{nutrition.fat}g</strong>
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {availableItems.length > 0 && (
            <div className="space-y-1">
              {availableItems.map((a) => (
                <div
                  key={a.ingredient.id}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="flex items-center gap-1.5 text-slate-300 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{a.ingredient.name}</span>
                  </span>
                  <span
                    dir="ltr"
                    className="text-emerald-400/90 font-semibold whitespace-nowrap shrink-0 tabular-nums"
                  >
                    {formatQtyUnit(a.requiredQty, a.ingredient.unit)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {missingItems.length > 0 && (
            <div className="bg-rose-950/25 border border-rose-500/25 rounded-xl p-2.5 space-y-1">
              <span className="text-[10px] font-bold text-rose-300 block">
                {t("missingToBuy")}
              </span>
              {missingItems.map((m) => (
                <div
                  key={m.ingredient.id}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="flex items-center gap-1.5 text-rose-200 min-w-0">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{m.ingredient.name}</span>
                  </span>
                  <span className="text-rose-300 font-bold whitespace-nowrap shrink-0 tabular-nums">
                    {t("needPrefix", {
                      qty: formatQtyUnit(m.missingQty, m.ingredient.unit)
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCookRecipeId(recipe.id)}
            className="flex-1 min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs px-3 flex items-center justify-center gap-1.5 active:scale-[0.98] transition whitespace-nowrap"
          >
            <ChefHat className="w-4 h-4 shrink-0" />
            {t("cookAndAdjust")}
          </button>

          {showManageControls && (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingRecipe(recipe);
                  setShowRecipeEditor(true);
                }}
                className="min-h-[44px] min-w-[44px] bg-slate-950 border border-slate-700 text-slate-300 hover:text-white rounded-xl flex items-center justify-center active:scale-95 transition"
                aria-label={`Edit ${recipe.name}`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              {confirmDeleteRecipeId === recipe.id ? (
                <button
                  type="button"
                  onClick={() => handleDeleteRecipe(recipe.id)}
                  className="min-h-[44px] px-3 bg-rose-500 text-white font-bold rounded-xl text-xs whitespace-nowrap shrink-0"
                >
                  {t("confirm")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteRecipeId(recipe.id)}
                  className="min-h-[44px] min-w-[44px] bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center justify-center active:scale-95 transition"
                  aria-label={`Delete ${recipe.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sub-Navigation Segmented Control */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        {[
          { id: "cook", label: t("cookToday"), icon: ChefHat, count: readyRecipes.length },
          { id: "recipes", label: t("recipesTab"), icon: BookOpen, count: recipes.length },
          { id: "pantry", label: t("pantryTab"), icon: Refrigerator, count: homeInventory.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSubTab(tab.id);
                setConfirmDeleteRecipeId(null);
              }}
              className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition whitespace-nowrap ${
                active
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] tabular-nums ${
                  active ? "text-slate-900/80" : "text-slate-500"
                }`}
              >
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= 1. COOK TODAY (SMART RECOMMENDER) ================= */}
      {subTab === "cook" && (
        <div className="space-y-4">
          <section className="grid grid-cols-3 gap-2 tabular-nums">
            <button
              type="button"
              onClick={() => {
                setPantryFilter("fresh");
                setSubTab("pantry");
              }}
              className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 text-start active:scale-95 transition"
            >
              <span className="text-[10px] font-semibold text-emerald-400 block">
                {t("freshStock")}
              </span>
              <strong className="text-lg font-black text-white">{pantryCounts.fresh}</strong>
            </button>
            <button
              type="button"
              onClick={() => {
                setPantryFilter("expiring");
                setSubTab("pantry");
              }}
              className="bg-slate-900/90 border border-amber-500/35 rounded-2xl p-3 text-start active:scale-95 transition"
            >
              <span className="text-[10px] font-semibold text-amber-300 block">
                {t("expiring13d")}
              </span>
              <strong className="text-lg font-black text-amber-300">{pantryCounts.expiring}</strong>
            </button>
            <button
              type="button"
              onClick={() => {
                setPantryFilter("expired");
                setSubTab("pantry");
              }}
              className="bg-slate-900/90 border border-rose-500/35 rounded-2xl p-3 text-start active:scale-95 transition"
            >
              <span className="text-[10px] font-semibold text-rose-400 block">
                {t("expired")}
              </span>
              <strong className="text-lg font-black text-rose-400">{pantryCounts.expired}</strong>
            </button>
          </section>

          <section className="space-y-2.5">
            <div className="px-1">
              <h2 className="text-sm font-extrabold text-emerald-300">
                {t("readyToCookNow", { count: readyRecipes.length })}
              </h2>
              <p className="text-[11px] text-slate-400">{t("readyToCookSub")}</p>
            </div>

            {readyRecipes.length === 0 ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 text-center space-y-2">
                <p className="text-xs font-bold text-slate-200">{t("noReadyRecipesTitle")}</p>
                <p className="text-[11px] text-slate-400">{t("noReadyRecipesSub")}</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPantryItem(null);
                    setShowPantryEditor(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3.5 py-2 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" /> {t("addPantryIngredient")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {readyRecipes.map((ev) => renderRecipeCard(ev, false))}
              </div>
            )}
          </section>

          {partialRecipes.length > 0 && (
            <section className="space-y-2.5">
              <div className="px-1">
                <h2 className="text-sm font-extrabold text-amber-300">
                  {t("closestMatches", { count: partialRecipes.length })}
                </h2>
                <p className="text-[11px] text-slate-400">{t("closestMatchesSub")}</p>
              </div>
              <div className="space-y-3">
                {partialRecipes.map((ev) => renderRecipeCard(ev, false))}
              </div>
            </section>
          )}

          {shoppingListItems.length > 0 && (
            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
              <button
                type="button"
                onClick={() => setShowShoppingList(!showShoppingList)}
                className="w-full flex items-center justify-between text-start"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <h2 className="text-sm font-extrabold text-white">
                      {t("quickShoppingList", { count: shoppingListItems.length })}
                    </h2>
                    <p className="text-[11px] text-slate-400">{t("shoppingListSub")}</p>
                  </div>
                </div>
                {showShoppingList ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showShoppingList && (
                <>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShoppingScope("near")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          shoppingScope === "near"
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        {t("missing12Filter")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShoppingScope("all")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          shoppingScope === "all"
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        {t("allPartialFilter")}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyShoppingList}
                      className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl active:scale-95 transition whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5" /> {t("copyList")}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {shoppingListItems.map((item) => (
                      <div
                        key={item.key}
                        className="bg-slate-950/80 border border-slate-800/80 rounded-2xl px-3 py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {t("forRecipes", { names: item.recipes.join(", ") })}
                          </p>
                        </div>
                        <span
                          dir="ltr"
                          className="text-xs font-extrabold text-amber-300 whitespace-nowrap shrink-0 tabular-nums"
                        >
                          {formatQtyUnit(item.quantity, item.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      )}

      {/* ================= 2. MY RECIPES MANAGER ================= */}
      {subTab === "recipes" && (
        <div className="space-y-4">
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-white truncate">
                  {t("recipesManagerTitle", { count: recipes.length })}
                </h2>
                <p className="text-[11px] text-slate-400">{t("recipesManagerSub")}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRecipe(null);
                  setShowRecipeEditor(true);
                }}
                className="min-h-[40px] bg-emerald-500 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1 active:scale-95 transition whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" /> {t("newRecipe")}
              </button>
            </div>

            <input
              ref={recipeFileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRecipeFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => recipeFileRef.current?.click()}
                className="min-h-[42px] bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 font-bold px-3 py-2 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 active:scale-95 transition whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" /> {t("uploadRecipesJson")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRecipeJsonPaste(!showRecipeJsonPaste);
                  setRecipeJsonError("");
                }}
                className="min-h-[42px] bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 active:scale-95 transition whitespace-nowrap"
              >
                <Clipboard className="w-3.5 h-3.5" />
                {showRecipeJsonPaste ? t("closePasteBox") : t("pasteRecipeJson")}
              </button>
            </div>

            {recipeJsonError && (
              <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-200">
                {recipeJsonError}
              </div>
            )}

            {showRecipeJsonPaste && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <textarea
                  dir="ltr"
                  rows="5"
                  placeholder='{"name": "Protein Beef Bowl", "category": "Dinner", "cookingTime": 20, "steps": ["Brown lean beef", "Serve over rice"], "ingredients": [{"name": "Lean Ground Beef (5% Fat)", "quantity": 200, "unit": "g"}, {"name": "Cooked White Basmati Rice", "quantity": 150, "unit": "g"}]}'
                  value={recipeJsonText}
                  onChange={(e) => setRecipeJsonText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => processRecipesJson(recipeJsonText)}
                  className="w-full min-h-[42px] bg-emerald-500 text-slate-950 font-black py-2 rounded-xl text-xs"
                >
                  {t("importPastedRecipes")}
                </button>
              </div>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("searchRecipesPlaceholder")}
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-8 pe-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {recipeCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setRecipeCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border transition ${
                    recipeCatFilter === cat
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  {translateCategory(cat)}
                </button>
              ))}
            </div>
          </section>

          {filteredEvaluatedRecipes.length === 0 ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center space-y-2">
              <p className="text-xs font-bold text-slate-200">{t("noMatchingRecipes")}</p>
              <p className="text-[11px] text-slate-400">{t("noMatchingRecipesSub")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvaluatedRecipes.map((ev) => renderRecipeCard(ev, true))}
            </div>
          )}
        </div>
      )}

      {/* ================= 3. HOME PANTRY INVENTORY ================= */}
      {subTab === "pantry" && (
        <div className="space-y-4">
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-white truncate">
                  {t("pantryHeaderTitle", { count: homeInventory.length })}
                </h2>
                <p className="text-[11px] text-slate-400">{t("pantryHeaderSub")}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPantryItem(null);
                  setShowPantryEditor(true);
                }}
                className="min-h-[40px] bg-emerald-500 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1 active:scale-95 transition whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" /> {t("addItem")}
              </button>
            </div>

            <input
              ref={pantryFileRef}
              type="file"
              accept=".json,application/json"
              onChange={handlePantryFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => pantryFileRef.current?.click()}
                className="min-h-[42px] bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 font-bold px-3 py-2 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 active:scale-95 transition whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" /> {t("uploadPantryJson")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPantryJsonPaste(!showPantryJsonPaste);
                  setPantryJsonError("");
                }}
                className="min-h-[42px] bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 active:scale-95 transition whitespace-nowrap"
              >
                <Clipboard className="w-3.5 h-3.5" />
                {showPantryJsonPaste ? t("closePasteBox") : t("pastePantryJson")}
              </button>
            </div>

            {pantryJsonError && (
              <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-200">
                {pantryJsonError}
              </div>
            )}

            {showPantryJsonPaste && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <textarea
                  dir="ltr"
                  rows="5"
                  placeholder='[{"name": "Cooked Chicken Breast", "quantity": 600, "unit": "g", "purchaseDate": "2026-11-18", "expirationDate": "2026-11-21"}]'
                  value={pantryJsonText}
                  onChange={(e) => setPantryJsonText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => processPantryJson(pantryJsonText)}
                  className="w-full min-h-[42px] bg-emerald-500 text-slate-950 font-black py-2 rounded-xl text-xs"
                >
                  {t("importPastedIngredients")}
                </button>
              </div>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("filterPantryPlaceholder")}
                value={pantrySearch}
                onChange={(e) => setPantrySearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-8 pe-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { id: "all", label: t("filterAll", { count: homeInventory.length }) },
                  { id: "expiring", label: t("filterExpiring", { count: pantryCounts.expiring }) },
                  { id: "expired", label: t("filterExpired", { count: pantryCounts.expired }) },
                  { id: "fresh", label: t("filterFresh", { count: pantryCounts.fresh }) }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPantryFilter(f.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap shrink-0 transition ${
                      pantryFilter === f.id
                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {homeInventory.length > 0 &&
                (confirmClearPantry ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setHomeInventory([]);
                        setConfirmClearPantry(false);
                        triggerToast(t("toastClearedPantry"));
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500 text-white whitespace-nowrap"
                    >
                      {t("clearAllConfirm")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearPantry(false)}
                      className="px-2 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 text-slate-300"
                    >
                      {t("no")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearPantry(true)}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 whitespace-nowrap shrink-0 px-2 py-1"
                  >
                    {t("clearAll")}
                  </button>
                ))}
            </div>
          </section>

          {filteredPantry.length === 0 ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center space-y-2">
              <p className="text-xs font-bold text-slate-200">
                {homeInventory.length === 0 ? t("pantryEmptyTitle") : t("pantryNoMatchTitle")}
              </p>
              <p className="text-[11px] text-slate-400">{t("pantryEmptySub")}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPantry.map((item) => {
                const { status } = item.expiryInfo;
                const badgeLabel = getLocalizedExpiryLabel(item.expiryInfo);
                const badgeClass =
                  status === "expired"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : status === "expiring"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/35";

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3.5 transition ${
                      status === "expired"
                        ? "bg-rose-950/20 border-rose-500/35"
                        : status === "expiring"
                          ? "bg-amber-950/15 border-amber-500/35"
                          : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs font-extrabold text-white truncate">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          {t("boughtAndExp", {
                            bought: item.purchaseDate || "—",
                            exp: item.expirationDate || "—"
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border whitespace-nowrap shrink-0 ${badgeClass}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustPantryQty(item, -1)}
                          className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-950 border border-slate-700 text-slate-300 flex items-center justify-center active:scale-90 transition"
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span
                          dir="ltr"
                          className="text-sm font-black text-emerald-400 px-2 tabular-nums"
                        >
                          {formatQtyUnit(item.quantity, item.unit)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustPantryQty(item, 1)}
                          className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 flex items-center justify-center active:scale-90 transition"
                          aria-label={`Increase ${item.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPantryItem(item);
                            setShowPantryEditor(true);
                          }}
                          className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-950 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePantryItem(item.id)}
                          className="min-h-[38px] min-w-[38px] rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center active:scale-95 transition"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeCookRecipe && (
        <RecipeCookModal
          key={activeCookRecipe.id}
          recipe={activeCookRecipe}
          homeInventory={homeInventory}
          allFoods={allFoods}
          todayKey={todayKey}
          defaultMeal={selectedMeal}
          onClose={() => setActiveCookRecipeId(null)}
          onEditRecipe={(rec) => {
            setEditingRecipe(rec);
            setShowRecipeEditor(true);
          }}
          onLogRecipeMeal={onLogRecipeMeal}
          onUpdateRecipeDefault={handleUpdateRecipeDefault}
        />
      )}

      {showRecipeEditor && (
        <RecipeEditorModal
          initialRecipe={editingRecipe}
          allFoods={allFoods}
          onClose={() => {
            setShowRecipeEditor(false);
            setEditingRecipe(null);
          }}
          onSave={handleSaveRecipe}
        />
      )}

      {showPantryEditor && (
        <PantryEditorModal
          initialItem={editingPantryItem}
          allFoods={allFoods}
          todayKey={todayKey}
          onClose={() => {
            setShowPantryEditor(false);
            setEditingPantryItem(null);
          }}
          onSave={handleSavePantryItem}
        />
      )}
    </div>
  );
}
