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

function buildAnalysisResult(form, userAllergies = []) {
  const ingredients = form.ingredients?.trim() || "";
  const detectedAllergens = extractAllergens(ingredients);
  const guestAllergies = form.allergies?.trim()
    ? form.allergies.split(/[,，、\s]+/).filter(Boolean)
    : [];
  const activeAllergies = userAllergies.length > 0 ? userAllergies : guestAllergies;

  const dangerItems = activeAllergies.filter((allergy) => {
    if (ingredients.includes(allergy)) return true;
    return detectedAllergens.some(
      (item) => item.includes(allergy) || allergy.includes(item),
    );
  });

  return {
    productName: form.foodName.trim(),
    manufacturer: form.companyName?.trim() || "정보 없음",
    productNumber: form.productNumber?.trim() || "",
    expiryDate: form.expiryDate?.trim() || "",
    rawMaterial: ingredients || "성분 정보가 입력되지 않았습니다.",
    allergies: detectedAllergens,
    isDanger: dangerItems.length > 0,
    dangerItems,
    userAllergies: activeAllergies,
  };
}

const useAnalysisStore = create((set) => ({
  lastForm: null,
  lastResult: null,
  setAnalysis: (form, userAllergies = []) => {
    const result = buildAnalysisResult(form, userAllergies);
    set({ lastForm: form, lastResult: result });
    return result;
  },
  clearAnalysis: () => set({ lastForm: null, lastResult: null }),
}));

export default useAnalysisStore;
