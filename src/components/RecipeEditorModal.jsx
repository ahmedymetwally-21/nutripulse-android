import { useState, useMemo } from "react";
import { X, Plus, Trash2, Clock } from "lucide-react";
import { RECIPE_CATEGORIES, UNIT_SUGGESTIONS } from "../data/defaultData";
import {
  computeRecipeNutrition,
  inferUnitFromFood,
  isWeightOrVolumeUnit
} from "../utils/kitchenEngine";
import { useLanguage } from "../i18n/useLanguage";

function createBlankIngredient() {
  return {
    id: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: "",
    foodId: null,
    quantity: 100,
    unit: "g",
    isServing: false,
    nutritionPerUnit: {
      cal: 0,
      carb: 0,
      prot: 0,
      fat: 0,
      fib: 0,
      sug: 0,
      sod: 0,
      pot: 0,
      calc: 0,
      iro: 0,
      vitc: 0
    }
  };
}

export default function RecipeEditorModal({
  initialRecipe,
  allFoods,
  onClose,
  onSave
}) {
  const { t, translateCategory } = useLanguage();
  const isEditing = Boolean(initialRecipe);

  const [name, setName] = useState(initialRecipe?.name || "");
  const [category, setCategory] = useState(initialRecipe?.category || RECIPE_CATEGORIES[0]);
  const [cookingTime, setCookingTime] = useState(initialRecipe?.cookingTime ?? 20);
  const [ingredients, setIngredients] = useState(() =>
    initialRecipe?.ingredients?.length
      ? initialRecipe.ingredients.map((i) => ({
          ...i,
          nutritionPerUnit: { ...(i.nutritionPerUnit || {}) }
        }))
      : [createBlankIngredient()]
  );
  const [steps, setSteps] = useState(() =>
    initialRecipe?.steps?.length ? [...initialRecipe.steps] : [""]
  );
  const [formError, setFormError] = useState("");

  const previewNutrition = useMemo(
    () => computeRecipeNutrition(ingredients, allFoods),
    [ingredients, allFoods]
  );

  const handleLinkFood = (ingId, foodId) => {
    if (!foodId) {
      setIngredients((prev) =>
        prev.map((ing) => (ing.id === ingId ? { ...ing, foodId: null } : ing))
      );
      return;
    }
    const food = allFoods.find((f) => f.id === foodId);
    if (!food) return;
    const inferredUnit = inferUnitFromFood(food);
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === ingId
          ? {
              ...ing,
              foodId: food.id,
              name: food.name,
              unit: inferredUnit,
              quantity: food.defaultAmount || (food.isServing ? 1 : 100),
              isServing: Boolean(food.isServing),
              nutritionPerUnit: {
                cal: food.cal || 0,
                carb: food.carb || 0,
                prot: food.prot || 0,
                fat: food.fat || 0,
                fib: food.fib || 0,
                sug: food.sug || 0,
                sod: food.sod || 0,
                pot: food.pot || 0,
                calc: food.calc || 0,
                iro: food.iro || 0,
                vitc: food.vitc || 0
              }
            }
          : ing
      )
    );
  };

  const updateIngredientField = (ingId, field, value) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== ingId) return ing;
        if (field === "unit") {
          const nextServing = ing.foodId ? ing.isServing : !isWeightOrVolumeUnit(value);
          return { ...ing, unit: value, isServing: nextServing };
        }
        return { ...ing, [field]: value };
      })
    );
  };

  const updateIngredientNutrition = (ingId, nutrKey, val) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === ingId
          ? {
              ...ing,
              foodId: null,
              nutritionPerUnit: {
                ...(ing.nutritionPerUnit || {}),
                [nutrKey]: Number(val) || 0
              }
            }
          : ing
      )
    );
  };

  const addIngredientRow = () => {
    setIngredients((prev) => [...prev, createBlankIngredient()]);
  };

  const removeIngredientRow = (ingId) => {
    setIngredients((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== ingId) : prev));
  };

  const updateStep = (idx, text) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? text : s)));
  };

  const addStep = () => setSteps((prev) => [...prev, ""]);
  const removeStep = (idx) => {
    setSteps((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError(t("errEnterRecipeName"));
      return;
    }
    const validIngredients = ingredients
      .filter((ing) => ing.name.trim())
      .map((ing) => ({
        ...ing,
        name: ing.name.trim(),
        quantity: Math.max(0.1, Number(ing.quantity) || 1),
        unit: ing.unit.trim() || "g"
      }));

    if (validIngredients.length === 0) {
      setFormError(t("errAddOneIngredient"));
      return;
    }

    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);

    onSave({
      id: initialRecipe?.id || `rec_${Date.now()}`,
      name: name.trim(),
      category: category.trim() || "High-Protein Cut",
      cookingTime: Math.max(1, Number(cookingTime) || 15),
      ingredients: validIngredients,
      steps: cleanSteps.length > 0 ? cleanSteps : ["Combine ingredients and cook to preference."]
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? t("editRecipeTitle") : t("createRecipeTitle")}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#0b1120] border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3.5 border-b border-slate-800 bg-[#090d16] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-white">
              {isEditing ? t("editRecipeTitle") : t("createRecipeTitle")}
            </h2>
            <p className="text-[11px] text-slate-400 tabular-nums">
              {t("estTotal")}{" "}
              <span dir="ltr" className="inline-block">
                <strong className="text-emerald-400">{previewNutrition.cal} kcal</strong> · P:{" "}
                {previewNutrition.prot}g · C: {previewNutrition.carb}g · F: {previewNutrition.fat}g
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {formError && (
            <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-200">
              {formError}
            </div>
          )}

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">{t("recipeNameLabel")}</label>
              <input
                type="text"
                required
                placeholder={t("recipeNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {t("categoryMealTag")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {RECIPE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {translateCategory(c)}
                    </option>
                  ))}
                  {!RECIPE_CATEGORIES.includes(category) && (
                    <option value={category}>{translateCategory(category)}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t("cookingTimeMin")}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200">
                {t("ingredientsCount", { count: ingredients.length })}
              </h3>
              <button
                type="button"
                onClick={addIngredientRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1.5 rounded-xl active:scale-95 transition whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> {t("addIngredient")}
              </button>
            </div>

            {ingredients.map((ing, idx) => (
              <div
                key={ing.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    {t("ingredientNum", { num: idx + 1 })}
                  </span>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(ing.id)}
                      className="text-rose-400 hover:text-rose-300 p-1 rounded-lg"
                      aria-label="Remove ingredient"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    {t("pickFoodDbLabel")}
                  </label>
                  <select
                    value={ing.foodId || ""}
                    onChange={(e) => handleLinkFood(ing.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{t("customIngredientOpt")}</option>
                    {allFoods.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.cal} kcal / {f.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    required
                    placeholder={t("ingredientNamePlaceholder")}
                    value={ing.name}
                    onChange={(e) => updateIngredientField(ing.id, "name", e.target.value)}
                    className="col-span-6 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  />
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    placeholder={t("qtyPlaceholder")}
                    value={ing.quantity}
                    onChange={(e) => updateIngredientField(ing.id, "quantity", e.target.value)}
                    className="col-span-3 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white tabular-nums"
                  />
                  <input
                    type="text"
                    list="recipe-unit-suggestions"
                    placeholder={t("unitPlaceholder")}
                    value={ing.unit}
                    onChange={(e) => updateIngredientField(ing.id, "unit", e.target.value)}
                    className="col-span-3 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  />
                </div>

                {!ing.foodId && (
                  <div className="pt-1.5 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {t("customNutrPer", {
                          unit: ing.isServing ? `1 ${ing.unit || "unit"}` : "100g/ml"
                        })}
                      </span>
                      <label className="inline-flex items-center gap-1 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(ing.isServing)}
                          onChange={(e) =>
                            updateIngredientField(ing.id, "isServing", e.target.checked)
                          }
                          className="accent-emerald-500"
                        />
                        {t("perOneUnit")}
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { key: "cal", ph: "kcal" },
                        { key: "prot", ph: t("proteinG") },
                        { key: "carb", ph: t("carbsG") },
                        { key: "fat", ph: t("fatG") }
                      ].map((n) => (
                        <input
                          key={n.key}
                          type="number"
                          step="any"
                          placeholder={n.ph}
                          value={ing.nutritionPerUnit?.[n.key] ?? ""}
                          onChange={(e) =>
                            updateIngredientNutrition(ing.id, n.key, e.target.value)
                          }
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white tabular-nums"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <datalist id="recipe-unit-suggestions">
              {UNIT_SUGGESTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200">
                {t("stepsBuilderTitle", { count: steps.length })}
              </h3>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/40 px-2.5 py-1.5 rounded-xl active:scale-95 transition whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> {t("addStep")}
              </button>
            </div>

            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-6 h-8 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                  {idx + 1}
                </span>
                <textarea
                  rows="2"
                  placeholder={t("stepPlaceholder", { num: idx + 1 })}
                  value={step}
                  onChange={(e) => updateStep(idx, e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="min-h-[36px] min-w-[36px] text-rose-400 flex items-center justify-center rounded-lg"
                    aria-label={`Remove step ${idx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#090d16] flex gap-2 shrink-0 safe-bottom-nav">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="flex-2 min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg px-5 active:scale-[0.98] transition"
          >
            {isEditing ? t("saveRecipeChanges") : t("createRecipeBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}
