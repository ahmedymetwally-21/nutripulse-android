export const INITIAL_FOOD_DB = [
  { id: "f1", name: "Cooked Chicken Breast", category: "Protein", unit: "100g", defaultAmount: 200, isServing: false, cal: 165, carb: 0, prot: 31, fat: 3.6, fib: 0, sug: 0, sod: 74, pot: 256, calc: 15, iro: 1.0, vitc: 0 },
  { id: "f2", name: "Canned Tuna (in Water, Drained)", category: "Protein", unit: "1 Large Can (145g)", defaultAmount: 1, isServing: true, cal: 160, carb: 0, prot: 36, fat: 1.2, fib: 0, sug: 0, sod: 360, pot: 340, calc: 18, iro: 2.1, vitc: 0 },
  { id: "f3", name: "Grilled Salmon Fillet", category: "Protein", unit: "100g", defaultAmount: 150, isServing: false, cal: 208, carb: 0, prot: 20.4, fat: 13.4, fib: 0, sug: 0, sod: 59, pot: 363, calc: 12, iro: 0.8, vitc: 0 },
  { id: "f4", name: "Lean Ground Beef (5% Fat)", category: "Protein", unit: "100g", defaultAmount: 150, isServing: false, cal: 137, carb: 0, prot: 21.4, fat: 5.0, fib: 0, sug: 0, sod: 66, pot: 348, calc: 12, iro: 2.5, vitc: 0 },
  { id: "f5", name: "Whole Large Egg (Boiled/Poached)", category: "Protein", unit: "1 Egg (50g)", defaultAmount: 2, isServing: true, cal: 72, carb: 0.4, prot: 6.3, fat: 4.8, fib: 0, sug: 0.2, sod: 71, pot: 69, calc: 28, iro: 0.9, vitc: 0 },
  { id: "f6", name: "Egg Whites (Liquid/Boiled)", category: "Protein", unit: "1 Large White", defaultAmount: 4, isServing: true, cal: 17, carb: 0.2, prot: 3.6, fat: 0.1, fib: 0, sug: 0.2, sod: 55, pot: 54, calc: 2, iro: 0, vitc: 0 },
  { id: "f7", name: "Grilled Shish Tawook (Chicken Skewers)", category: "Regional", unit: "100g", defaultAmount: 200, isServing: false, cal: 185, carb: 2.5, prot: 28, fat: 6.8, fib: 0.3, sug: 1.0, sod: 420, pot: 280, calc: 24, iro: 1.2, vitc: 2 },
  { id: "f8", name: "Beef/Lamb Kofta Kebab (Grilled)", category: "Regional", unit: "100g", defaultAmount: 150, isServing: false, cal: 255, carb: 2.0, prot: 22, fat: 17.5, fib: 0.5, sug: 0.5, sod: 480, pot: 310, calc: 26, iro: 2.7, vitc: 1 },
  { id: "f9", name: "Chicken Shawarma (Meat Only, No Bread)", category: "Regional", unit: "100g", defaultAmount: 180, isServing: false, cal: 198, carb: 1.8, prot: 26.5, fat: 9.2, fib: 0.2, sug: 0.5, sod: 540, pot: 260, calc: 20, iro: 1.4, vitc: 1 },
  { id: "f10", name: "Cottage Cheese (Low Fat 2%)", category: "Dairy", unit: "100g", defaultAmount: 150, isServing: false, cal: 81, carb: 4.3, prot: 10.5, fat: 2.3, fib: 0, sug: 4.0, sod: 306, pot: 120, calc: 111, iro: 0.1, vitc: 0 },
  { id: "f11", name: "Greek Yogurt (0% Fat, Plain)", category: "Dairy", unit: "1 Container (170g)", defaultAmount: 1, isServing: true, cal: 100, carb: 6.1, prot: 17.3, fat: 0.6, fib: 0, sug: 5.5, sod: 61, pot: 240, calc: 189, iro: 0.1, vitc: 0 },
  { id: "f12", name: "Cooked White Basmati Rice", category: "Carbs", unit: "100g", defaultAmount: 150, isServing: false, cal: 130, carb: 28.2, prot: 2.7, fat: 0.3, fib: 0.4, sug: 0.1, sod: 1, pot: 35, calc: 10, iro: 0.2, vitc: 0 },
  { id: "f13", name: "Cooked Brown Rice", category: "Carbs", unit: "100g", defaultAmount: 150, isServing: false, cal: 112, carb: 23.5, prot: 2.6, fat: 0.9, fib: 1.8, sug: 0.4, sod: 5, pot: 43, calc: 10, iro: 0.4, vitc: 0 },
  { id: "f14", name: "Rolled Oats (Dry Weight)", category: "Carbs", unit: "100g", defaultAmount: 60, isServing: false, cal: 389, carb: 66.3, prot: 16.9, fat: 6.9, fib: 10.6, sug: 0.9, sod: 2, pot: 429, calc: 54, iro: 4.7, vitc: 0 },
  { id: "f15", name: "Baked Sweet Potato", category: "Carbs", unit: "100g", defaultAmount: 200, isServing: false, cal: 90, carb: 20.7, prot: 2.0, fat: 0.2, fib: 3.3, sug: 6.5, sod: 36, pot: 475, calc: 38, iro: 0.7, vitc: 19.6 },
  { id: "f16", name: "Boiled/Baked White Potato", category: "Carbs", unit: "100g", defaultAmount: 200, isServing: false, cal: 87, carb: 20.1, prot: 1.9, fat: 0.1, fib: 1.8, sug: 0.9, sod: 4, pot: 379, calc: 5, iro: 0.3, vitc: 13.0 },
  { id: "f17", name: "Whole Wheat Arabic Bread (1 Loaf)", category: "Regional", unit: "1 Loaf (60g)", defaultAmount: 1, isServing: true, cal: 160, carb: 33.5, prot: 5.8, fat: 1.1, fib: 4.2, sug: 0.8, sod: 280, pot: 110, calc: 15, iro: 1.8, vitc: 0 },
  { id: "f18", name: "Foul Medames (Fava Beans, No Oil)", category: "Regional", unit: "100g", defaultAmount: 200, isServing: false, cal: 110, carb: 19.6, prot: 7.6, fat: 0.4, fib: 5.4, sug: 1.8, sod: 250, pot: 268, calc: 36, iro: 1.5, vitc: 1.2 },
  { id: "f19", name: "Lentil Soup (Shorbat Adas)", category: "Regional", unit: "1 Bowl (250ml)", defaultAmount: 1, isServing: true, cal: 165, carb: 26.0, prot: 10.5, fat: 2.2, fib: 6.5, sug: 2.5, sod: 410, pot: 440, calc: 32, iro: 3.1, vitc: 4.0 },
  { id: "f20", name: "Hummus (Traditional Chickpea Dip)", category: "Regional", unit: "100g", defaultAmount: 60, isServing: false, cal: 166, carb: 14.3, prot: 7.9, fat: 9.6, fib: 6.0, sug: 0.3, sod: 379, pot: 228, calc: 38, iro: 2.4, vitc: 0 },
  { id: "f20b", name: "Koshary (Traditional Egyptian Bowl)", category: "Regional", unit: "100g", defaultAmount: 250, isServing: false, cal: 168, carb: 29.5, prot: 5.2, fat: 3.1, fib: 3.4, sug: 2.2, sod: 310, pot: 195, calc: 22, iro: 1.6, vitc: 3.0 },
  { id: "f21", name: "Banana (Medium)", category: "Fruits & Veg", unit: "1 Medium (118g)", defaultAmount: 1, isServing: true, cal: 105, carb: 27.0, prot: 1.3, fat: 0.4, fib: 3.1, sug: 14.4, sod: 1, pot: 422, calc: 6, iro: 0.3, vitc: 10.3 },
  { id: "f22", name: "Apple (Medium)", category: "Fruits & Veg", unit: "1 Medium (182g)", defaultAmount: 1, isServing: true, cal: 95, carb: 25.1, prot: 0.5, fat: 0.3, fib: 4.4, sug: 18.9, sod: 2, pot: 195, calc: 11, iro: 0.2, vitc: 8.4 },
  { id: "f23", name: "Orange (Medium)", category: "Fruits & Veg", unit: "1 Orange (140g)", defaultAmount: 1, isServing: true, cal: 66, carb: 16.5, prot: 1.3, fat: 0.2, fib: 3.4, sug: 13.0, sod: 0, pot: 250, calc: 56, iro: 0.1, vitc: 74.5 },
  { id: "f24", name: "Dates (Medjool / Sukkari)", category: "Regional", unit: "1 Date (24g)", defaultAmount: 3, isServing: true, cal: 66, carb: 18.0, prot: 0.4, fat: 0.0, fib: 1.6, sug: 16.0, sod: 0, pot: 167, calc: 15, iro: 0.2, vitc: 0 },
  { id: "f25", name: "Steamed Broccoli", category: "Fruits & Veg", unit: "100g", defaultAmount: 150, isServing: false, cal: 35, carb: 7.2, prot: 2.4, fat: 0.4, fib: 3.3, sug: 1.4, sod: 41, pot: 293, calc: 40, iro: 0.7, vitc: 64.9 },
  { id: "f26", name: "Mixed Green Salad (Cucumber, Tomato, Lettuce)", category: "Fruits & Veg", unit: "1 Large Bowl (200g)", defaultAmount: 1, isServing: true, cal: 36, carb: 7.5, prot: 1.8, fat: 0.3, fib: 2.6, sug: 4.1, sod: 18, pot: 410, calc: 35, iro: 0.9, vitc: 24.0 },
  { id: "f27", name: "Avocado (Fresh)", category: "Fats", unit: "100g", defaultAmount: 100, isServing: false, cal: 160, carb: 8.5, prot: 2.0, fat: 14.7, fib: 6.7, sug: 0.7, sod: 7, pot: 485, calc: 12, iro: 0.6, vitc: 10.0 },
  { id: "f28", name: "Raw Almonds", category: "Fats", unit: "100g", defaultAmount: 30, isServing: false, cal: 579, carb: 21.6, prot: 21.2, fat: 49.9, fib: 12.5, sug: 4.4, sod: 1, pot: 733, calc: 269, iro: 3.7, vitc: 0 },
  { id: "f29", name: "Extra Virgin Olive Oil", category: "Fats", unit: "1 Tbsp (14g)", defaultAmount: 1, isServing: true, cal: 119, carb: 0, prot: 0, fat: 13.5, fib: 0, sug: 0, sod: 0, pot: 0, calc: 0, iro: 0.1, vitc: 0 },
  { id: "f30", name: "Natural Peanut Butter", category: "Fats", unit: "1 Tbsp (16g)", defaultAmount: 1, isServing: true, cal: 94, carb: 3.2, prot: 4.0, fat: 8.0, fib: 1.0, sug: 1.5, sod: 73, pot: 104, calc: 8, iro: 0.3, vitc: 0 },
  { id: "f31", name: "Whey Protein Isolate (1 Scoop)", category: "Supplements", unit: "1 Scoop (30g)", defaultAmount: 1, isServing: true, cal: 115, carb: 1.5, prot: 25.0, fat: 0.5, fib: 0, sug: 1.0, sod: 120, pot: 150, calc: 130, iro: 0.3, vitc: 0 },
  { id: "f32", name: "Black Coffee / Americano (Unsweetened)", category: "Drinks", unit: "1 Cup (240ml)", defaultAmount: 1, isServing: true, cal: 2, carb: 0, prot: 0.3, fat: 0, fib: 0, sug: 0, sod: 5, pot: 116, calc: 5, iro: 0, vitc: 0 }
];

export const DEFAULT_GOALS = {
  cal: 1900, carb: 145, prot: 170, fat: 55, water: 3500, steps: 10000,
  fastingHours: 16, targetWeight: 110, heightCm: 181, fib: 30, sug: 40,
  sod: 2300, pot: 3500, calc: 1000, iro: 18, vitc: 90
};

export const MEAL_TYPES = [
  "Meal 1 (Break-Fast)",
  "Meal 2 (Main)",
  "Snack / Shake",
  "Breakfast",
  "Lunch",
  "Dinner"
];

export const RECIPE_CATEGORIES = [
  "High-Protein Cut",
  "Meal 1 (Break-Fast)",
  "Lunch / Main",
  "Quick Bowl",
  "Breakfast",
  "Dinner",
  "Post-Workout"
];

export const UNIT_SUGGESTIONS = [
  "g",
  "kg",
  "ml",
  "L",
  "eggs",
  "whites",
  "cans",
  "tbsp",
  "loaves",
  "bowls",
  "containers",
  "scoops",
  "pieces",
  "servings"
];

function offsetDate(baseDateStr, deltaDays) {
  const d = new Date(baseDateStr + "T12:00:00");
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().split("T")[0];
}

export function getDefaultHomeInventory(todayStr) {
  return [
    {
      id: "inv_1",
      name: "Cooked Chicken Breast",
      foodId: "f1",
      quantity: 650,
      unit: "g",
      purchaseDate: offsetDate(todayStr, -2),
      expirationDate: offsetDate(todayStr, 2)
    },
    {
      id: "inv_2",
      name: "Steamed Broccoli",
      foodId: "f25",
      quantity: 400,
      unit: "g",
      purchaseDate: offsetDate(todayStr, -3),
      expirationDate: offsetDate(todayStr, 1)
    },
    {
      id: "inv_3",
      name: "Cooked White Basmati Rice",
      foodId: "f12",
      quantity: 500,
      unit: "g",
      purchaseDate: offsetDate(todayStr, -1),
      expirationDate: offsetDate(todayStr, 4)
    },
    {
      id: "inv_4",
      name: "Whole Large Egg (Boiled/Poached)",
      foodId: "f5",
      quantity: 12,
      unit: "eggs",
      purchaseDate: offsetDate(todayStr, -4),
      expirationDate: offsetDate(todayStr, 10)
    },
    {
      id: "inv_5",
      name: "Egg Whites (Liquid/Boiled)",
      foodId: "f6",
      quantity: 10,
      unit: "whites",
      purchaseDate: offsetDate(todayStr, -2),
      expirationDate: offsetDate(todayStr, 6)
    },
    {
      id: "inv_6",
      name: "Extra Virgin Olive Oil",
      foodId: "f29",
      quantity: 20,
      unit: "tbsp",
      purchaseDate: offsetDate(todayStr, -20),
      expirationDate: offsetDate(todayStr, 180)
    },
    {
      id: "inv_7",
      name: "Canned Tuna (in Water, Drained)",
      foodId: "f2",
      quantity: 3,
      unit: "cans",
      purchaseDate: offsetDate(todayStr, -15),
      expirationDate: offsetDate(todayStr, 240)
    },
    {
      id: "inv_8",
      name: "Rolled Oats (Dry Weight)",
      foodId: "f14",
      quantity: 800,
      unit: "g",
      purchaseDate: offsetDate(todayStr, -10),
      expirationDate: offsetDate(todayStr, 120)
    },
    {
      id: "inv_9",
      name: "Whey Protein Isolate (1 Scoop)",
      foodId: "f31",
      quantity: 25,
      unit: "scoops",
      purchaseDate: offsetDate(todayStr, -12),
      expirationDate: offsetDate(todayStr, 180)
    },
    {
      id: "inv_10",
      name: "Avocado (Fresh)",
      foodId: "f27",
      quantity: 150,
      unit: "g",
      purchaseDate: offsetDate(todayStr, -6),
      expirationDate: offsetDate(todayStr, -1)
    }
  ];
}

export const INITIAL_RECIPES = [
  {
    id: "rec_1",
    name: "Garlic Lemon Chicken & Basmati Rice",
    category: "High-Protein Cut",
    cookingTime: 25,
    steps: [
      "Season chicken breast cubes with minced garlic, fresh lemon juice, black pepper, paprika, and a pinch of salt.",
      "Heat olive oil in a non-stick skillet over medium-high heat and sear the chicken for 5–6 minutes per side until golden and cooked through.",
      "Steam or blanch the broccoli florets for 4 minutes until bright green and tender-crisp.",
      "Plate warm basmati rice with the garlic lemon chicken and broccoli, drizzling any pan juices over the top."
    ],
    ingredients: [
      {
        id: "ing_1_1",
        name: "Cooked Chicken Breast",
        foodId: "f1",
        quantity: 220,
        unit: "g",
        isServing: false,
        nutritionPerUnit: { cal: 165, carb: 0, prot: 31, fat: 3.6, fib: 0, sug: 0, sod: 74, pot: 256, calc: 15, iro: 1.0, vitc: 0 }
      },
      {
        id: "ing_1_2",
        name: "Cooked White Basmati Rice",
        foodId: "f12",
        quantity: 150,
        unit: "g",
        isServing: false,
        nutritionPerUnit: { cal: 130, carb: 28.2, prot: 2.7, fat: 0.3, fib: 0.4, sug: 0.1, sod: 1, pot: 35, calc: 10, iro: 0.2, vitc: 0 }
      },
      {
        id: "ing_1_3",
        name: "Steamed Broccoli",
        foodId: "f25",
        quantity: 120,
        unit: "g",
        isServing: false,
        nutritionPerUnit: { cal: 35, carb: 7.2, prot: 2.4, fat: 0.4, fib: 3.3, sug: 1.4, sod: 41, pot: 293, calc: 40, iro: 0.7, vitc: 64.9 }
      },
      {
        id: "ing_1_4",
        name: "Extra Virgin Olive Oil",
        foodId: "f29",
        quantity: 0.5,
        unit: "tbsp",
        isServing: true,
        nutritionPerUnit: { cal: 119, carb: 0, prot: 0, fat: 13.5, fib: 0, sug: 0, sod: 0, pot: 0, calc: 0, iro: 0.1, vitc: 0 }
      }
    ]
  },
  {
    id: "rec_2",
    name: "High-Protein Egg & Broccoli Scramble",
    category: "Meal 1 (Break-Fast)",
    cookingTime: 12,
    steps: [
      "Whisk the whole eggs and liquid egg whites in a bowl with cracked black pepper, cumin, and a pinch of sea salt.",
      "Finely chop the broccoli florets and sauté in a lightly oiled non-stick pan for 3 minutes until lightly charred.",
      "Lower heat to medium-low, pour in the egg mixture, and gently fold with a spatula for 3–4 minutes until soft curds form.",
      "Remove from heat while slightly glossy so the scramble stays fluffy and tender."
    ],
    ingredients: [
      {
        id: "ing_2_1",
        name: "Whole Large Egg (Boiled/Poached)",
        foodId: "f5",
        quantity: 3,
        unit: "eggs",
        isServing: true,
        nutritionPerUnit: { cal: 72, carb: 0.4, prot: 6.3, fat: 4.8, fib: 0, sug: 0.2, sod: 71, pot: 69, calc: 28, iro: 0.9, vitc: 0 }
      },
      {
        id: "ing_2_2",
        name: "Egg Whites (Liquid/Boiled)",
        foodId: "f6",
        quantity: 4,
        unit: "whites",
        isServing: true,
        nutritionPerUnit: { cal: 17, carb: 0.2, prot: 3.6, fat: 0.1, fib: 0, sug: 0.2, sod: 55, pot: 54, calc: 2, iro: 0, vitc: 0 }
      },
      {
        id: "ing_2_3",
        name: "Steamed Broccoli",
        foodId: "f25",
        quantity: 120,
        unit: "g",
        isServing: false,
        nutritionPerUnit: { cal: 35, carb: 7.2, prot: 2.4, fat: 0.4, fib: 3.3, sug: 1.4, sod: 41, pot: 293, calc: 40, iro: 0.7, vitc: 64.9 }
      },
      {
        id: "ing_2_4",
        name: "Extra Virgin Olive Oil",
        foodId: "f29",
        quantity: 0.5,
        unit: "tbsp",
        isServing: true,
        nutritionPerUnit: { cal: 119, carb: 0, prot: 0, fat: 13.5, fib: 0, sug: 0, sod: 0, pot: 0, calc: 0, iro: 0.1, vitc: 0 }
      }
    ]
  },
  {
    id: "rec_3",
    name: "Mediterranean Tuna Salad Bowl",
    category: "Quick Bowl",
    cookingTime: 10,
    steps: [
      "Drain the canned tuna thoroughly and flake into a large mixing bowl.",
      "Toss in the chopped mixed green salad (cucumber, tomato, crisp lettuce).",
      "Drizzle with extra virgin olive oil, fresh lemon juice, dried oregano, and black pepper.",
      "Fold gently and serve chilled for a crisp, ultra-lean high-protein lunch."
    ],
    ingredients: [
      {
        id: "ing_3_1",
        name: "Canned Tuna (in Water, Drained)",
        foodId: "f2",
        quantity: 1,
        unit: "cans",
        isServing: true,
        nutritionPerUnit: { cal: 160, carb: 0, prot: 36, fat: 1.2, fib: 0, sug: 0, sod: 360, pot: 340, calc: 18, iro: 2.1, vitc: 0 }
      },
      {
        id: "ing_3_2",
        name: "Mixed Green Salad (Cucumber, Tomato, Lettuce)",
        foodId: "f26",
        quantity: 1,
        unit: "bowls",
        isServing: true,
        nutritionPerUnit: { cal: 36, carb: 7.5, prot: 1.8, fat: 0.3, fib: 2.6, sug: 4.1, sod: 18, pot: 410, calc: 35, iro: 0.9, vitc: 24.0 }
      },
      {
        id: "ing_3_3",
        name: "Extra Virgin Olive Oil",
        foodId: "f29",
        quantity: 1,
        unit: "tbsp",
        isServing: true,
        nutritionPerUnit: { cal: 119, carb: 0, prot: 0, fat: 13.5, fib: 0, sug: 0, sod: 0, pot: 0, calc: 0, iro: 0.1, vitc: 0 }
      }
    ]
  },
  {
    id: "rec_4",
    name: "Greek Yogurt & Protein Oat Bowl",
    category: "Breakfast",
    cookingTime: 5,
    steps: [
      "Add rolled oats and whey protein isolate to a bowl and stir with 120ml cold water or warm water to soften.",
      "Fold in the plain 0% Greek yogurt until thick and creamy.",
      "Slice the banana over the top and sprinkle with cinnamon if desired."
    ],
    ingredients: [
      {
        id: "ing_4_1",
        name: "Greek Yogurt (0% Fat, Plain)",
        foodId: "f11",
        quantity: 1,
        unit: "containers",
        isServing: true,
        nutritionPerUnit: { cal: 100, carb: 6.1, prot: 17.3, fat: 0.6, fib: 0, sug: 5.5, sod: 61, pot: 240, calc: 189, iro: 0.1, vitc: 0 }
      },
      {
        id: "ing_4_2",
        name: "Rolled Oats (Dry Weight)",
        foodId: "f14",
        quantity: 50,
        unit: "g",
        isServing: false,
        nutritionPerUnit: { cal: 389, carb: 66.3, prot: 16.9, fat: 6.9, fib: 10.6, sug: 0.9, sod: 2, pot: 429, calc: 54, iro: 4.7, vitc: 0 }
      },
      {
        id: "ing_4_3",
        name: "Whey Protein Isolate (1 Scoop)",
        foodId: "f31",
        quantity: 1,
        unit: "scoops",
        isServing: true,
        nutritionPerUnit: { cal: 115, carb: 1.5, prot: 25.0, fat: 0.5, fib: 0, sug: 1.0, sod: 120, pot: 150, calc: 130, iro: 0.3, vitc: 0 }
      },
      {
        id: "ing_4_4",
        name: "Banana (Medium)",
        foodId: "f21",
        quantity: 1,
        unit: "pieces",
        isServing: true,
        nutritionPerUnit: { cal: 105, carb: 27.0, prot: 1.3, fat: 0.4, fib: 3.1, sug: 14.4, sod: 1, pot: 422, calc: 6, iro: 0.3, vitc: 10.3 }
      }
    ]
  },
  {
    id: "rec_5",
    name: "Grilled Shish Tawook Arabic Wrap",
    category: "Dinner",
    cookingTime: 20,
    steps: [
      "Grill or pan-sear the marinated Shish Tawook chicken cubes over medium-high heat for 8–10 minutes until charred at the edges.",
      "Warm the whole wheat Arabic bread lightly on the grill for 20 seconds so it folds cleanly.",
      "Spread hummus down the center of the flatbread, layer with hot Shish Tawook and crisp mixed salad.",
      "Roll tightly, toast seam-side down for 1 minute, slice diagonally, and serve hot."
    ],
    ingredients: [
      {
        id: "ing_5_1",
        name: "Grilled Shish Tawook (Chicken Skewers)",
        foodId: "f7",
        quantity: 200,
        unit: "g",
        isServing: false,
        nutritionPerUnit: { cal: 185, carb: 2.5, prot: 28, fat: 6.8, fib: 0.3, sug: 1.0, sod: 420, pot: 280, calc: 24, iro: 1.2, vitc: 2 }
      },
      {
        id: "ing_5_2",
        name: "Whole Wheat Arabic Bread (1 Loaf)",
        foodId: "f17",
        quantity: 1,
        unit: "loaves",
        isServing: true,
        nutritionPerUnit: { cal: 160, carb: 33.5, prot: 5.8, fat: 1.1, fib: 4.2, sug: 0.8, sod: 280, pot: 110, calc: 15, iro: 1.8, vitc: 0 }
      },
      {
        id: "ing_5_3",
        name: "Hummus (Traditional Chickpea Dip)",
        foodId: "f20",
        quantity: 45,
        unit: "g",
        isServing: false,
        nutritionPerUnit: { cal: 166, carb: 14.3, prot: 7.9, fat: 9.6, fib: 6.0, sug: 0.3, sod: 379, pot: 228, calc: 38, iro: 2.4, vitc: 0 }
      },
      {
        id: "ing_5_4",
        name: "Mixed Green Salad (Cucumber, Tomato, Lettuce)",
        foodId: "f26",
        quantity: 0.5,
        unit: "bowls",
        isServing: true,
        nutritionPerUnit: { cal: 36, carb: 7.5, prot: 1.8, fat: 0.3, fib: 2.6, sug: 4.1, sod: 18, pot: 410, calc: 35, iro: 0.9, vitc: 24.0 }
      }
    ]
  }
];
