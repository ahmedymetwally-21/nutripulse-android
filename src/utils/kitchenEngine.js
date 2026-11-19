// Core calculation, expiration, unit-conversion, recommendation, and JSON import engine for Kitchen & Pantry

export function shiftDate(dateStr, deltaDays) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().split("T")[0];
}

export function daysUntilDate(targetDateStr, todayStr) {
  if (!targetDateStr) return 999;
  const target = new Date(targetDateStr + "T12:00:00");
  const today = new Date(todayStr + "T12:00:00");
  if (isNaN(target.getTime()) || isNaN(today.getTime())) return 999;
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function getExpirationStatus(expirationDate, todayStr) {
  if (!expirationDate) {
    return { status: "fresh", daysLeft: 999, label: "Fresh", shortLabel: "No expiry" };
  }
  const daysLeft = daysUntilDate(expirationDate, todayStr);
  if (daysLeft < 0) {
    const overdue = Math.abs(daysLeft);
    return {
      status: "expired",
      daysLeft,
      label: overdue === 1 ? "Expired 1d ago" : `Expired ${overdue}d ago`,
      shortLabel: "Expired"
    };
  }
  if (daysLeft === 0) {
    return { status: "expiring", daysLeft: 0, label: "Expires Today", shortLabel: "Today" };
  }
  if (daysLeft <= 3) {
    return {
      status: "expiring",
      daysLeft,
      label: `Expiring in ${daysLeft}d`,
      shortLabel: `${daysLeft}d left`
    };
  }
  return {
    status: "fresh",
    daysLeft,
    label: `Fresh · ${daysLeft}d left`,
    shortLabel: "Fresh"
  };
}

// Unit normalization & conversion
const MASS_TO_G = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.3495,
  lb: 453.592,
  lbs: 453.592
};

const VOL_TO_ML = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
  cup: 240,
  cups: 240
};

const COUNT_SYNONYMS = {
  egg: "egg",
  eggs: "egg",
  white: "white",
  whites: "white",
  can: "can",
  cans: "can",
  loaf: "loaf",
  loaves: "loaf",
  bowl: "bowl",
  bowls: "bowl",
  container: "container",
  containers: "container",
  scoop: "scoop",
  scoops: "scoop",
  piece: "piece",
  pieces: "piece",
  pcs: "piece",
  serving: "serving",
  servings: "serving",
  medium: "piece",
  large: "piece",
  unit: "piece",
  units: "piece",
  date: "date",
  dates: "date",
  slice: "slice",
  slices: "slice"
};

export function normalizeUnit(unit) {
  return String(unit || "servings").trim().toLowerCase();
}

export function getUnitFamily(unit) {
  const u = normalizeUnit(unit);
  if (u in MASS_TO_G) return "mass";
  if (u in VOL_TO_ML) return "volume";
  return `count:${COUNT_SYNONYMS[u] || u}`;
}

export function convertQuantity(qty, fromUnit, toUnit) {
  const num = Number(qty) || 0;
  const f = normalizeUnit(fromUnit);
  const t = normalizeUnit(toUnit);
  if (f === t) return num;
  if (f in MASS_TO_G && t in MASS_TO_G) {
    return (num * MASS_TO_G[f]) / MASS_TO_G[t];
  }
  if (f in VOL_TO_ML && t in VOL_TO_ML) {
    return (num * VOL_TO_ML[f]) / VOL_TO_ML[t];
  }
  const fCount = COUNT_SYNONYMS[f] || f;
  const tCount = COUNT_SYNONYMS[t] || t;
  if (fCount === tCount) return num;
  return null;
}

export function isWeightOrVolumeUnit(unit) {
  const u = normalizeUnit(unit);
  return u === "g" || u === "gram" || u === "grams" || u === "kg" || u === "ml" || u === "l";
}

export function getStepIncrement(unit, isServing) {
  const u = normalizeUnit(unit);
  if (u === "g" || u === "gram" || u === "grams" || u === "ml") return 25;
  if (u === "kg" || u === "l") return 0.1;
  if (u === "tbsp" || u === "tsp" || u === "cup" || u === "cups") return 0.5;
  if (!isServing && isWeightOrVolumeUnit(u)) return 25;
  return 0.5;
}

export function formatQty(val) {
  const n = Number(val) || 0;
  if (Math.abs(n - Math.round(n)) < 0.01) return String(Math.round(n));
  return String(Number(n.toFixed(1)));
}

export function formatQtyUnit(qty, unit) {
  const q = formatQty(qty);
  const u = String(unit || "").trim();
  if (!u) return q;
  if (u === "g" || u === "kg" || u === "ml" || u === "L") return `${q}${u}`;
  return `${q} ${u}`;
}

export function inferUnitFromFood(food) {
  if (!food) return "g";
  if (!food.isServing) {
    const lower = String(food.unit || "").toLowerCase();
    if (lower.includes("ml")) return "ml";
    return "g";
  }
  const lower = String(food.unit || "").toLowerCase();
  if (lower.includes("egg") && !lower.includes("white")) return "eggs";
  if (lower.includes("white")) return "whites";
  if (lower.includes("can")) return "cans";
  if (lower.includes("tbsp")) return "tbsp";
  if (lower.includes("loaf")) return "loaves";
  if (lower.includes("bowl")) return "bowls";
  if (lower.includes("container")) return "containers";
  if (lower.includes("scoop")) return "scoops";
  if (lower.includes("date")) return "dates";
  if (lower.includes("cup")) return "cups";
  if (lower.includes("medium") || lower.includes("orange") || lower.includes("apple") || lower.includes("banana")) return "pieces";
  return "servings";
}

export function normalizeNameForMatch(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function doesInventoryMatchIngredient(invItem, ingredient) {
  if (!invItem || !ingredient) return false;
  if (invItem.foodId && ingredient.foodId && invItem.foodId === ingredient.foodId) {
    return true;
  }
  const invName = normalizeNameForMatch(invItem.name);
  const ingName = normalizeNameForMatch(ingredient.name);
  if (!invName || !ingName) return false;
  if (invName === ingName) return true;
  if (invName.length >= 4 && ingName.length >= 4) {
    if (invName.includes(ingName) || ingName.includes(invName)) return true;
  }
  return false;
}

export function computeIngredientNutrition(ingredient, allFoods = []) {
  const qty = Math.max(0, Number(ingredient.quantity) || 0);
  const linkedFood = ingredient.foodId
    ? allFoods.find((f) => f.id === ingredient.foodId)
    : null;

  const base = linkedFood || ingredient.nutritionPerUnit || {};
  const isServing = linkedFood ? Boolean(linkedFood.isServing) : Boolean(ingredient.isServing);

  let mult = 0;
  if (isServing) {
    mult = qty;
  } else {
    // Convert mass/volume to g or ml so 0.2 kg -> 200g -> mult = 2
    const u = normalizeUnit(ingredient.unit);
    if (u in MASS_TO_G) {
      mult = (qty * MASS_TO_G[u]) / 100;
    } else if (u in VOL_TO_ML) {
      mult = (qty * VOL_TO_ML[u]) / 100;
    } else {
      mult = qty / 100;
    }
  }

  return {
    cal: (Number(base.cal) || 0) * mult,
    carb: (Number(base.carb) || 0) * mult,
    prot: (Number(base.prot) || 0) * mult,
    fat: (Number(base.fat) || 0) * mult,
    fib: (Number(base.fib) || 0) * mult,
    sug: (Number(base.sug) || 0) * mult,
    sod: (Number(base.sod) || 0) * mult,
    pot: (Number(base.pot) || 0) * mult,
    calc: (Number(base.calc) || 0) * mult,
    iro: (Number(base.iro) || 0) * mult,
    vitc: (Number(base.vitc) || 0) * mult
  };
}

export function computeRecipeNutrition(ingredients = [], allFoods = []) {
  const raw = ingredients.reduce(
    (acc, ing) => {
      const n = computeIngredientNutrition(ing, allFoods);
      acc.cal += n.cal;
      acc.carb += n.carb;
      acc.prot += n.prot;
      acc.fat += n.fat;
      acc.fib += n.fib;
      acc.sug += n.sug;
      acc.sod += n.sod;
      acc.pot += n.pot;
      acc.calc += n.calc;
      acc.iro += n.iro;
      acc.vitc += n.vitc;
      return acc;
    },
    { cal: 0, carb: 0, prot: 0, fat: 0, fib: 0, sug: 0, sod: 0, pot: 0, calc: 0, iro: 0, vitc: 0 }
  );

  return {
    cal: Math.round(raw.cal),
    carb: +raw.carb.toFixed(1),
    prot: +raw.prot.toFixed(1),
    fat: +raw.fat.toFixed(1),
    fib: +raw.fib.toFixed(1),
    sug: +raw.sug.toFixed(1),
    sod: Math.round(raw.sod),
    pot: Math.round(raw.pot),
    calc: Math.round(raw.calc),
    iro: +raw.iro.toFixed(1),
    vitc: +raw.vitc.toFixed(1)
  };
}

export function evaluateRecipeAgainstPantry(recipe, homeInventory = [], allFoods = [], todayStr) {
  const freshInventory = homeInventory
    .map((item) => ({
      ...item,
      expiryInfo: getExpirationStatus(item.expirationDate, todayStr)
    }))
    .filter((item) => item.expiryInfo.status !== "expired" && (Number(item.quantity) || 0) > 0);

  const ingredientStatuses = (recipe.ingredients || []).map((ing) => {
    const requiredQty = Math.max(0, Number(ing.quantity) || 0);
    const matchingRows = freshInventory.filter((inv) => doesInventoryMatchIngredient(inv, ing));

    let availableQty = 0;
    let soonestExpiryDays = 999;
    let hasExpiringSoon = false;

    matchingRows.forEach((row) => {
      const converted = convertQuantity(row.quantity, row.unit, ing.unit);
      const effectiveQty = converted !== null ? converted : Number(row.quantity) || 0;
      if (effectiveQty > 0) {
        availableQty += effectiveQty;
        if (row.expiryInfo.daysLeft < soonestExpiryDays) {
          soonestExpiryDays = row.expiryInfo.daysLeft;
        }
        if (row.expiryInfo.status === "expiring") {
          hasExpiringSoon = true;
        }
      }
    });

    const missingQty = Math.max(0, +(requiredQty - availableQty).toFixed(2));
    const isAvailable = missingQty <= 0.01;

    return {
      ingredient: ing,
      requiredQty,
      availableQty: +availableQty.toFixed(2),
      missingQty,
      isAvailable,
      soonestExpiryDays,
      hasExpiringSoon
    };
  });

  const availableItems = ingredientStatuses.filter((s) => s.isAvailable);
  const missingItems = ingredientStatuses.filter((s) => !s.isAvailable);
  const totalCount = ingredientStatuses.length;
  const isReady = totalCount > 0 && missingItems.length === 0;
  const coverageRatio = totalCount > 0 ? availableItems.length / totalCount : 0;

  const expiringMatchDays = ingredientStatuses
    .filter((s) => s.availableQty > 0)
    .map((s) => s.soonestExpiryDays);
  const minExpiryDays = expiringMatchDays.length > 0 ? Math.min(...expiringMatchDays) : 999;
  const usesExpiringSoon = ingredientStatuses.some((s) => s.availableQty > 0 && s.hasExpiringSoon);
  const expiringIngredientNames = ingredientStatuses
    .filter((s) => s.availableQty > 0 && s.hasExpiringSoon)
    .map((s) => s.ingredient.name);

  const nutrition = computeRecipeNutrition(recipe.ingredients, allFoods);

  return {
    recipe,
    ingredientStatuses,
    availableItems,
    missingItems,
    isReady,
    missingCount: missingItems.length,
    coverageRatio,
    minExpiryDays,
    usesExpiringSoon,
    expiringIngredientNames,
    nutrition
  };
}

export function rankRecipes(recipes = [], homeInventory = [], allFoods = [], todayStr) {
  const evaluated = recipes.map((r) =>
    evaluateRecipeAgainstPantry(r, homeInventory, allFoods, todayStr)
  );

  const readyRecipes = evaluated
    .filter((e) => e.isReady)
    .sort((a, b) => {
      // Prioritize recipes using ingredients closest to expiration first
      if (a.minExpiryDays !== b.minExpiryDays) return a.minExpiryDays - b.minExpiryDays;
      return (a.recipe.cookingTime || 999) - (b.recipe.cookingTime || 999);
    });

  const partialRecipes = evaluated
    .filter((e) => !e.isReady)
    .sort((a, b) => {
      // Fewest missing ingredients first
      if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
      // Higher percentage coverage next
      if (b.coverageRatio !== a.coverageRatio) return b.coverageRatio - a.coverageRatio;
      // Soonest-expiring used ingredient next
      if (a.minExpiryDays !== b.minExpiryDays) return a.minExpiryDays - b.minExpiryDays;
      return (a.recipe.cookingTime || 999) - (b.recipe.cookingTime || 999);
    });

  return { readyRecipes, partialRecipes, allEvaluated: [...readyRecipes, ...partialRecipes] };
}

export function buildShoppingList(evaluatedRecipes = []) {
  const map = new Map();

  evaluatedRecipes.forEach((ev) => {
    ev.missingItems.forEach((m) => {
      const ing = m.ingredient;
      const key = ing.foodId
        ? `food:${ing.foodId}:${getUnitFamily(ing.unit)}`
        : `name:${normalizeNameForMatch(ing.name)}:${getUnitFamily(ing.unit)}`;

      if (map.has(key)) {
        const existing = map.get(key);
        const converted = convertQuantity(m.missingQty, ing.unit, existing.unit);
        existing.quantity = +(existing.quantity + (converted !== null ? converted : m.missingQty)).toFixed(2);
        if (!existing.recipes.includes(ev.recipe.name)) {
          existing.recipes.push(ev.recipe.name);
        }
      } else {
        map.set(key, {
          key,
          name: ing.name,
          quantity: +m.missingQty.toFixed(2),
          unit: ing.unit,
          recipes: [ev.recipe.name]
        });
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => b.recipes.length - a.recipes.length);
}

export function deductIngredientsFromInventory(homeInventory = [], usedIngredients = [], todayStr) {
  // Deep copy inventory with computed expiry days so we consume earliest-expiring non-expired items first (FEFO)
  const working = homeInventory.map((item) => ({
    ...item,
    quantity: Number(item.quantity) || 0,
    _daysLeft: daysUntilDate(item.expirationDate, todayStr)
  }));

  let deductedCount = 0;

  usedIngredients.forEach((ing) => {
    let remainingToDeduct = Math.max(0, Number(ing.quantity) || 0);
    if (remainingToDeduct <= 0) return;

    // Sort indices of matching non-expired items by soonest expiration date
    const matchIndices = working
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item._daysLeft >= 0 && item.quantity > 0 && doesInventoryMatchIngredient(item, ing))
      .sort((a, b) => a.item._daysLeft - b.item._daysLeft);

    matchIndices.forEach(({ idx }) => {
      if (remainingToDeduct <= 0.001) return;
      const batch = working[idx];
      const neededInBatchUnit = convertQuantity(remainingToDeduct, ing.unit, batch.unit);
      const deductAmt = neededInBatchUnit !== null ? neededInBatchUnit : remainingToDeduct;

      if (batch.quantity >= deductAmt) {
        batch.quantity = +(batch.quantity - deductAmt).toFixed(2);
        remainingToDeduct = 0;
        deductedCount++;
      } else {
        const consumedInIngUnit = convertQuantity(batch.quantity, batch.unit, ing.unit);
        remainingToDeduct = Math.max(
          0,
          +(remainingToDeduct - (consumedInIngUnit !== null ? consumedInIngUnit : batch.quantity)).toFixed(2)
        );
        batch.quantity = 0;
        deductedCount++;
      }
    });
  });

  const updatedInventory = working
    .filter((item) => item.quantity > 0.01 || item._daysLeft < 0)
    .map(({ _daysLeft, ...rest }) => rest);

  return { updatedInventory, deductedCount };
}

export function parseInventoryJson(rawString, allFoods = [], todayStr) {
  const parsed = JSON.parse(rawString);
  let list = null;
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && Array.isArray(parsed.homeInventory)) {
    list = parsed.homeInventory;
  } else if (parsed && Array.isArray(parsed.inventory)) {
    list = parsed.inventory;
  } else if (parsed && Array.isArray(parsed.items)) {
    list = parsed.items;
  } else if (parsed && typeof parsed === "object" && parsed.name) {
    list = [parsed];
  }

  if (!list || list.length === 0) {
    throw new Error("Expected a JSON array or object with 'name' and 'quantity'.");
  }

  return list
    .filter((item) => item && item.name)
    .map((item, idx) => {
      const nameStr = String(item.name).trim();
      const matchedFood = item.foodId
        ? allFoods.find((f) => f.id === item.foodId)
        : allFoods.find((f) => normalizeNameForMatch(f.name) === normalizeNameForMatch(nameStr));

      return {
        id: item.id || `inv_json_${Date.now()}_${idx}`,
        name: nameStr,
        foodId: matchedFood ? matchedFood.id : item.foodId || null,
        quantity: Math.max(0.1, Number(item.quantity ?? item.qty ?? item.amount) || 1),
        unit: String(item.unit || (matchedFood ? inferUnitFromFood(matchedFood) : "g")).trim(),
        purchaseDate: String(item.purchaseDate || item.startDate || todayStr).slice(0, 10),
        expirationDate: String(item.expirationDate || item.expiryDate || shiftDate(todayStr, 7)).slice(0, 10)
      };
    });
}

export function parseRecipesJson(rawString, allFoods = []) {
  const parsed = JSON.parse(rawString);
  let list = null;
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && Array.isArray(parsed.recipes)) {
    list = parsed.recipes;
  } else if (parsed && typeof parsed === "object" && parsed.name) {
    list = [parsed];
  }

  if (!list || list.length === 0) {
    throw new Error("Expected a recipe object or array of recipes with 'name' and 'ingredients'.");
  }

  return list
    .filter((r) => r && r.name)
    .map((r, rIdx) => {
      const rawSteps = Array.isArray(r.steps)
        ? r.steps
        : Array.isArray(r.instructions)
          ? r.instructions
          : typeof r.instructions === "string"
            ? r.instructions.split("\n").map((s) => s.trim()).filter(Boolean)
            : [];

      const rawIngredients = Array.isArray(r.ingredients) ? r.ingredients : [];
      const normalizedIngredients = rawIngredients
        .filter((ing) => ing && ing.name)
        .map((ing, iIdx) => {
          const nameStr = String(ing.name).trim();
          const matchedFood = ing.foodId
            ? allFoods.find((f) => f.id === ing.foodId)
            : allFoods.find((f) => normalizeNameForMatch(f.name) === normalizeNameForMatch(nameStr));

          const srcNutr = ing.nutritionPerUnit || ing.nutrition || ing;
          const unitStr = String(ing.unit || (matchedFood ? inferUnitFromFood(matchedFood) : "g")).trim();
          const isServing =
            typeof ing.isServing === "boolean"
              ? ing.isServing
              : matchedFood
                ? Boolean(matchedFood.isServing)
                : !isWeightOrVolumeUnit(unitStr);

          return {
            id: ing.id || `ing_json_${Date.now()}_${rIdx}_${iIdx}`,
            name: nameStr,
            foodId: matchedFood ? matchedFood.id : ing.foodId || null,
            quantity: Math.max(0.1, Number(ing.quantity ?? ing.qty ?? ing.amount) || (isServing ? 1 : 100)),
            unit: unitStr,
            isServing,
            nutritionPerUnit: matchedFood
              ? {
                  cal: matchedFood.cal,
                  carb: matchedFood.carb,
                  prot: matchedFood.prot,
                  fat: matchedFood.fat,
                  fib: matchedFood.fib,
                  sug: matchedFood.sug,
                  sod: matchedFood.sod,
                  pot: matchedFood.pot,
                  calc: matchedFood.calc,
                  iro: matchedFood.iro,
                  vitc: matchedFood.vitc
                }
              : {
                  cal: Number(srcNutr.cal ?? srcNutr.calories) || 0,
                  carb: Number(srcNutr.carb ?? srcNutr.carbs) || 0,
                  prot: Number(srcNutr.prot ?? srcNutr.protein) || 0,
                  fat: Number(srcNutr.fat ?? srcNutr.fats) || 0,
                  fib: Number(srcNutr.fib ?? srcNutr.fiber) || 0,
                  sug: Number(srcNutr.sug ?? srcNutr.sugar) || 0,
                  sod: Number(srcNutr.sod ?? srcNutr.sodium) || 0,
                  pot: Number(srcNutr.pot ?? srcNutr.potassium) || 0,
                  calc: Number(srcNutr.calc ?? srcNutr.calcium) || 0,
                  iro: Number(srcNutr.iro ?? srcNutr.iron) || 0,
                  vitc: Number(srcNutr.vitc ?? srcNutr.vitaminC) || 0
                }
          };
        });

      return {
        id: r.id || `rec_json_${Date.now()}_${rIdx}`,
        name: String(r.name).trim(),
        category: String(r.category || r.mealTag || "High-Protein Cut").trim(),
        cookingTime: Math.max(1, Number(r.cookingTime ?? r.cookTime ?? r.timeMinutes ?? r.time) || 15),
        steps: rawSteps.length > 0 ? rawSteps.map((s) => String(s).trim()).filter(Boolean) : ["Prepare and combine all ingredients as desired."],
        ingredients: normalizedIngredients
      };
    });
}
