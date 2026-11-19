import { useState, useMemo } from "react";
import {
  X,
  Clock,
  Check,
  AlertTriangle,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Utensils,
  ChevronDown,
  ChevronUp,
  Edit3,
  CheckCircle2
} from "lucide-react";
import { MEAL_TYPES } from "../data/defaultData";
import {
  computeRecipeNutrition,
  computeIngredientNutrition,
  evaluateRecipeAgainstPantry,
  getStepIncrement,
  formatQty,
  formatQtyUnit
} from "../utils/kitchenEngine";
import { useLanguage } from "../i18n/useLanguage";

export default function RecipeCookModal({
  recipe,
  homeInventory,
  allFoods,
  todayKey,
  defaultMeal,
  onClose,
  onEditRecipe,
  onLogRecipeMeal,
  onUpdateRecipeDefault
}) {
  const { t, translateMeal, translateCategory } = useLanguage();
  const [draftIngredients, setDraftIngredients] = useState(() =>
    recipe ? recipe.ingredients.map((ing) => ({ ...ing })) : []
  );
  const [selectedMeal, setSelectedMeal] = useState(defaultMeal || MEAL_TYPES[0]);
  const [deductInventory, setDeductInventory] = useState(true);
  const [showMicros, setShowMicros] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState({});

  const isModified = useMemo(() => {
    if (!recipe || draftIngredients.length !== recipe.ingredients.length) return false;
    return draftIngredients.some((draft, idx) => {
      const orig = recipe.ingredients[idx];
      return Math.abs((Number(draft.quantity) || 0) - (Number(orig.quantity) || 0)) > 0.001;
    });
  }, [recipe, draftIngredients]);

  const liveNutrition = useMemo(
    () => computeRecipeNutrition(draftIngredients, allFoods),
    [draftIngredients, allFoods]
  );

  const liveEvaluation = useMemo(() => {
    if (!recipe) return null;
    return evaluateRecipeAgainstPantry(
      { ...recipe, ingredients: draftIngredients },
      homeInventory,
      allFoods,
      todayKey
    );
  }, [recipe, draftIngredients, homeInventory, allFoods, todayKey]);

  if (!recipe) return null;

  const updateIngredientQty = (ingId, nextVal) => {
    const clean = Math.max(0, Number(nextVal) || 0);
    const rounded = Math.round(clean * 100) / 100;
    setDraftIngredients((prev) =>
      prev.map((ing) => (ing.id === ingId ? { ...ing, quantity: rounded } : ing))
    );
  };

  const stepIngredientQty = (ing, direction) => {
    const step = getStepIncrement(ing.unit, ing.isServing);
    const next = Math.max(0, (Number(ing.quantity) || 0) + direction * step);
    updateIngredientQty(ing.id, next);
  };

  const handleResetDefaults = () => {
    setDraftIngredients(recipe.ingredients.map((ing) => ({ ...ing })));
  };

  const handleLogThisTimeOnly = () => {
    onLogRecipeMeal({
      recipe,
      usedIngredients: draftIngredients,
      nutrition: liveNutrition,
      meal: selectedMeal,
      deductInventory,
      wasCustomized: isModified
    });
    setDraftIngredients(recipe.ingredients.map((ing) => ({ ...ing })));
    onClose();
  };

  const handleSaveAsDefault = () => {
    onUpdateRecipeDefault(recipe.id, draftIngredients);
  };

  const toggleStep = (idx) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedStepsCount = Object.values(checkedSteps).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={recipe.name}
    >
      <div className="bg-[#0b1120] border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-4 pt-3 pb-3 border-b border-slate-800/90 bg-[#090d16]/95 shrink-0">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="truncate">{translateCategory(recipe.category)}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-cyan-300 font-semibold whitespace-nowrap shrink-0 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  {t("minShort", { min: recipe.cookingTime })}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-0.5 leading-snug">
                {recipe.name}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditRecipe(recipe);
                }}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition"
                aria-label={t("editRecipeTitle")}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h3 className="text-xs font-bold text-slate-200">{t("liveRecipeNutrition")}</h3>
                <p className="text-[11px] text-slate-400">{t("liveNutritionSub")}</p>
              </div>
              <div className="text-end tabular-nums" dir="ltr">
                <span className="text-2xl font-black text-emerald-400 leading-none">
                  {liveNutrition.cal}
                </span>
                <span className="block text-[10px] text-slate-400 font-semibold">kcal</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center tabular-nums">
              <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl py-2 px-1">
                <span className="text-[10px] text-slate-400 block">{t("protein")}</span>
                <strong dir="ltr" className="text-sm font-extrabold text-rose-400 inline-block">
                  {liveNutrition.prot}g
                </strong>
              </div>
              <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl py-2 px-1">
                <span className="text-[10px] text-slate-400 block">{t("carbs")}</span>
                <strong dir="ltr" className="text-sm font-extrabold text-amber-400 inline-block">
                  {liveNutrition.carb}g
                </strong>
              </div>
              <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl py-2 px-1">
                <span className="text-[10px] text-slate-400 block">{t("fat")}</span>
                <strong dir="ltr" className="text-sm font-extrabold text-purple-400 inline-block">
                  {liveNutrition.fat}g
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMicros(!showMicros)}
              className="w-full mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400 hover:text-slate-200 transition text-start"
            >
              <span>{t("microsShortLabel")}</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold whitespace-nowrap shrink-0">
                {showMicros ? (
                  <>
                    {t("hide")} <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    {t("show")} <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </span>
            </button>

            {showMicros && (
              <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px] tabular-nums">
                {[
                  { label: t("fiber"), val: `${liveNutrition.fib}g`, cls: "text-emerald-400" },
                  { label: t("sugar"), val: `${liveNutrition.sug}g`, cls: "text-pink-400" },
                  { label: t("sodium"), val: `${liveNutrition.sod}mg`, cls: "text-amber-400" },
                  { label: t("potassium"), val: `${liveNutrition.pot}mg`, cls: "text-cyan-400" },
                  { label: t("calcium"), val: `${liveNutrition.calc}mg`, cls: "text-indigo-400" },
                  { label: t("iron"), val: `${liveNutrition.iro}mg`, cls: "text-rose-400" },
                  { label: t("vitaminC"), val: `${liveNutrition.vitc}mg`, cls: "text-orange-400" }
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-slate-950/90 border border-slate-800/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between"
                  >
                    <span className="text-slate-400">{m.label}</span>
                    <strong dir="ltr" className={m.cls}>{m.val}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {t("adjustIngredients", { count: draftIngredients.length })}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {liveEvaluation?.isReady
                    ? t("allAvailableInPantry")
                    : t("missingCurrentAmounts", { count: liveEvaluation?.missingCount || 0 })}
                </p>
              </div>
              {isModified && (
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-xl active:scale-95 transition whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t("reset")}
                </button>
              )}
            </div>

            {isModified && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-2 text-[11px] text-amber-200 leading-relaxed">
                {t("modifiedBanner")}
              </div>
            )}

            <div className="space-y-2">
              {draftIngredients.map((ing, idx) => {
                const status = liveEvaluation?.ingredientStatuses[idx];
                const ingNutr = computeIngredientNutrition(ing, allFoods);
                const origQty = recipe.ingredients[idx]?.quantity ?? ing.quantity;
                const changed = Math.abs((Number(ing.quantity) || 0) - (Number(origQty) || 0)) > 0.001;

                return (
                  <div
                    key={ing.id}
                    className={`rounded-2xl border p-3 transition ${
                      changed
                        ? "bg-amber-950/20 border-amber-500/40"
                        : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {status?.isAvailable ? (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <p className="text-xs font-bold text-slate-100 truncate">{ing.name}</p>
                        </div>
                        <div
                          dir="ltr"
                          className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums"
                        >
                          <span className="text-emerald-400 font-semibold">
                            {Math.round(ingNutr.cal)} kcal
                          </span>
                          <span>P: {ingNutr.prot.toFixed(1)}g</span>
                          <span>C: {ingNutr.carb.toFixed(1)}g</span>
                          <span>F: {ingNutr.fat.toFixed(1)}g</span>
                        </div>
                      </div>
                      <div className="text-end shrink-0 text-[11px] tabular-nums">
                        {status?.isAvailable ? (
                          <span className="text-emerald-400 font-semibold">
                            {t("inPantryAmt", {
                              qty: formatQtyUnit(status.availableQty, ing.unit)
                            })}
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold">
                            {t("needMoreAmt", {
                              qty: formatQtyUnit(status?.missingQty || ing.quantity, ing.unit)
                            })}
                          </span>
                        )}
                        {changed && (
                          <span className="block text-[10px] text-amber-300">
                            {t("defaultAmt", { qty: formatQtyUnit(origQty, ing.unit) })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2.5" dir="ltr">
                      <button
                        type="button"
                        onClick={() => stepIngredientQty(ing, -1)}
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-950 border border-slate-700 text-slate-200 flex items-center justify-center active:scale-95 transition"
                        aria-label={`Decrease ${ing.name}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex-1 flex items-center bg-slate-950 border border-slate-700 focus-within:border-emerald-500 rounded-xl px-3 min-h-[44px]">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={ing.quantity}
                          onChange={(e) => updateIngredientQty(ing.id, e.target.value)}
                          className="w-full bg-transparent text-sm font-bold text-white tabular-nums focus:outline-none"
                          aria-label={`${ing.name} amount`}
                        />
                        <span className="text-xs font-semibold text-slate-400 ml-2 whitespace-nowrap shrink-0">
                          {ing.unit}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => stepIngredientQty(ing, 1)}
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 flex items-center justify-center active:scale-95 transition"
                        aria-label={`Increase ${ing.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {liveEvaluation && liveEvaluation.missingItems.length > 0 && (
            <section className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-3.5 space-y-1.5">
              <h3 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t("missingIngredientsTitle", { count: liveEvaluation.missingItems.length })}
              </h3>
              <ul className="space-y-1 text-xs text-rose-200/90 tabular-nums">
                {liveEvaluation.missingItems.map((m) => (
                  <li key={m.ingredient.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{m.ingredient.name}</span>
                    <strong dir="ltr" className="text-rose-300 whitespace-nowrap shrink-0">
                      {formatQtyUnit(m.missingQty, m.ingredient.unit)}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">{t("cookingInstructions")}</h3>
              <span className="text-xs text-slate-400 tabular-nums">
                {t("stepsDoneCount", {
                  done: completedStepsCount,
                  total: (recipe.steps || []).length
                })}
              </span>
            </div>
            <ol className="space-y-2">
              {(recipe.steps || []).map((step, idx) => {
                const done = Boolean(checkedSteps[idx]);
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => toggleStep(idx)}
                      className={`w-full text-start flex items-start gap-2.5 p-2.5 rounded-xl border transition ${
                        done
                          ? "bg-emerald-950/30 border-emerald-500/30 text-slate-400 line-through"
                          : "bg-slate-950/80 border-slate-800/90 text-slate-200"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums ${
                          done
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-emerald-400"
                        }`}
                      >
                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      <span className="text-xs leading-relaxed">{step}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#090d16] space-y-2.5 shrink-0 safe-bottom-nav">
          <div className="flex items-center gap-2.5">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 block mb-1">{t("logToMealSlot")}</label>
              <select
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {MEAL_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {translateMeal(m)}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 mt-4 cursor-pointer min-h-[40px]">
              <input
                type="checkbox"
                checked={deductInventory}
                onChange={(e) => setDeductInventory(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 rounded"
              />
              <span className="text-[11px] font-semibold text-slate-200 whitespace-nowrap">
                {t("deductPantry")}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleLogThisTimeOnly}
              className="w-full min-h-[46px] bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition whitespace-nowrap"
            >
              <Utensils className="w-4 h-4 shrink-0" />
              <span>{t("useThisTimeOnlyBtn", { kcal: formatQty(liveNutrition.cal) })}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAsDefault}
              disabled={!isModified}
              className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                isModified
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30 active:scale-[0.98]"
                  : "bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>
                {isModified ? t("updateRecipeDefaultBtn") : t("adjustToUpdateDefault")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
