import { create } from "zustand";

const KNOWN_ALLERGENS = [
  "메밀",
  "밀",
  "땅콩",
  "대두",
  "호두",
  "잣",
  "돼지고기",
  "닭고기",
  "쇠고기",
  "고등어",
  "게",
  "새우",
  "오징어",
  "조개류",
  "굴",
  "전복",
  "홍합",
  "난류",
  "우유",
  "복숭아",
  "토마토",
  "아황산류",
  "카제인",
  "유산균",
  "카카오",
  "김치",
  "두부",
];

function extractAllergens(text) {
  if (!text?.trim()) return [];
  return KNOWN_ALLERGENS.filter((allergen) => text.includes(allergen));
}

function buildAnalysisResult(form, userAllergies = [], userPrecautions = []) {
  const rawIngredients = Array.isArray(form.ingredients)
    ? form.ingredients
        .map((ingredient) =>
          typeof ingredient === "string"
            ? { name: ingredient.trim(), amount: "" }
            : {
                name: String(ingredient.name ?? "").trim(),
                amount: String(ingredient.amount ?? "").trim(),
              },
        )
        .filter((ingredient) => ingredient.name)
    : String(form.ingredients ?? "")
        .split(",")
        .map((name) => ({ name: name.trim(), amount: "" }))
        .filter((ingredient) => ingredient.name);
  const ingredientNames = rawIngredients
    .map((ingredient) => ingredient.name)
    .join(", ");
  const ingredients = rawIngredients
    .map(
      ({ name, amount }) => `${name}${amount ? ` (${amount})` : ""}`,
    )
    .join(", ");
  const detectedAllergens = extractAllergens(ingredientNames);
  const guestAllergies = form.allergies?.trim()
    ? form.allergies.split(/[,，、\s]+/).filter(Boolean)
    : [];
  const activeAllergies =
    userAllergies.length > 0 ? userAllergies : guestAllergies;

  const dangerItems = activeAllergies.filter((allergy) => {
    if (ingredientNames.includes(allergy)) return true;
    return detectedAllergens.some(
      (item) => item.includes(allergy) || allergy.includes(item),
    );
  });

  return {
    productName: form.foodName.trim(),
    manufacturer: form.companyName?.trim() || "정보 없음",
    productNumber: form.productNumber?.trim() || "",
    consumptionAmount: form.consumptionAmount?.trim() || "",
    manufactureDate: form.manufactureDate?.trim() || "",
    expiryDate: form.expiryDate?.trim() || "",
    rawMaterial: ingredients,
    ingredients: rawIngredients,
    allergies: detectedAllergens,
    isDanger: dangerItems.length > 0,
    dangerItems,
    userAllergies: activeAllergies,
    userPrecautions,
  };
}

const useAnalysisStore = create((set) => ({
  lastForm: null,
  lastResult: null,
  setAnalysis: (form, userAllergies = [], userPrecautions = []) => {
    const result = buildAnalysisResult(form, userAllergies, userPrecautions);
    set({ lastForm: form, lastResult: result });
    return result;
  },
  clearAnalysis: () => set({ lastForm: null, lastResult: null }),
}));

export default useAnalysisStore;
