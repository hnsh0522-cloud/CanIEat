import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import useAuthStore from "../store/useAuthStore.js";
import useAnalysisStore from "../store/useAnalysisStore.js";
import { fetchUserState, getApiErrorMessage } from "../api/auth.js";
import { extractFoodInfoFromImage, getFoodDetail } from "../api/food.js";

const allergyCategories = [
  {
    category: "곡류 / 견과류",
    items: ["메밀", "밀", "땅콩", "대두", "호두", "잣"],
  },
  { category: "육류", items: ["돼지고기", "닭고기", "쇠고기"] },
  {
    category: "해산물",
    items: ["고등어", "게", "새우", "오징어", "조개류", "굴", "전복", "홍합"],
  },
  { category: "기타", items: ["난류", "우유", "복숭아", "토마토", "아황산류"] },
];

const initialForm = {
  foodName: "",
  companyName: "",
  productNumber: "",
  ingredients: [],
  consumptionAmount: "",
  manufactureDate: "",
  expiryDate: "",
  precautions: "", // 주의사항 입력용 상태 추가
};

const MAX_IMAGE_UPLOAD_SIZE = 6 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2560;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const prepareImageForUpload = async (image) => {
  if (
    SUPPORTED_IMAGE_TYPES.has(image.type) &&
    image.size <= MAX_IMAGE_UPLOAD_SIZE
  ) {
    return image;
  }

  if (typeof createImageBitmap !== "function") {
    throw new Error(
      "이 브라우저에서는 촬영한 사진을 처리할 수 없습니다. JPEG, PNG 또는 WEBP 파일을 선택해주세요.",
    );
  }

  let bitmap;
  try {
    try {
      bitmap = await createImageBitmap(image);
    } catch {
      throw new Error(
        "촬영한 사진 형식을 변환할 수 없습니다. JPEG, PNG 또는 WEBP로 다시 촬영해주세요.",
      );
    }

    if (!bitmap.width || !bitmap.height) {
      throw new Error("사진 크기를 확인할 수 없습니다.");
    }

    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("사진을 변환할 수 없습니다.");
    }

    let blob;
    let quality = 0.88;
    do {
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (!blob) {
        throw new Error("사진을 JPEG 형식으로 변환할 수 없습니다.");
      }
      quality -= 0.12;
    } while (blob.size > MAX_IMAGE_UPLOAD_SIZE && quality >= 0.64);

    if (blob.size > 10 * 1024 * 1024) {
      throw new Error("사진 크기를 10MB 이하로 줄일 수 없습니다.");
    }

    const fileName = image.name.replace(/\.[^.]+$/, "") || "captured-food";
    return new File([blob], `${fileName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    if (error instanceof Error && error.message) throw error;
    throw new Error(
      "사진을 읽을 수 없습니다. JPEG, PNG 또는 WEBP 사진을 사용해주세요.",
    );
  } finally {
    bitmap?.close();
  }
};

const normalizeIngredients = (value) => {
  const ingredients = Array.isArray(value) ? value : String(value).split(",");
  return ingredients
    .map((ingredient) =>
      typeof ingredient === "string"
        ? { name: ingredient.trim(), amount: "" }
        : {
            name: String(ingredient.name ?? "").trim(),
            amount: String(ingredient.amount ?? "").trim(),
          },
    )
    .filter((ingredient) => ingredient.name);
};

const parsePrecautions = (value) =>
  value
    .split("\n")
    .map((precaution) => precaution.trim())
    .filter(Boolean);

export default function AnalyzePage() {
  const { isLoggedIn, user, updateUserState } = useAuthStore();
  const { setAnalysis } = useAnalysisStore();
  const [form, setForm] = useState(initialForm);
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientAmountInput, setIngredientAmountInput] = useState("");
  const [precautionInput, setPrecautionInput] = useState("");
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [reportNumber, setReportNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isLoadingUserState, setIsLoadingUserState] = useState(isLoggedIn);
  const [userStateError, setUserStateError] = useState("");
  const actionInProgress = useRef(false);
  const imageFileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();

  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const pageTextClass = isDark ? "text-slate-100" : "text-[#1e293b]";
  const headingTextClass = isDark ? "text-white" : "text-[#1e293b]";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const formBgClass = isDark ? "bg-[#1e293b]" : "bg-[#ffffff]";
  const labelTextClass = isDark ? "text-slate-300" : "text-slate-700";
  const inputClassName = isDark
    ? "w-full rounded-lg border border-slate-600 bg-[#0f172a] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
    : `w-full rounded-lg border border-slate-300 bg-[#ffffff] px-4 py-3 text-[#1e293b] placeholder-slate-500 ${accent.focusBorderAccent} focus:outline-none`;
  const buttonClassName = `w-full rounded-xl px-8 py-3 text-lg font-semibold transition-all duration-200 ${accent.btnOutline}`;

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoadingUserState(false);
      setUserStateError("");
      return undefined;
    }

    let isMounted = true;
    setIsLoadingUserState(true);
    setUserStateError("");

    fetchUserState()
      .then((userState) => {
        if (isMounted) updateUserState(userState);
      })
      .catch((error) => {
        console.error("사용자 상태 조회 오류:", error);
        if (isMounted) setUserStateError(getApiErrorMessage(error));
      })
      .finally(() => {
        if (isMounted) setIsLoadingUserState(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, updateUserState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAllergy = (item) => {
    setSelectedAllergies((prev) =>
      prev.includes(item) ? prev.filter((allergy) => allergy !== item) : [...prev, item],
    );
  };

  const addIngredient = () => {
    const ingredient = ingredientInput.trim().replace(/,+$/, "").trim();
    if (!ingredient) return;
    const amount = ingredientAmountInput.trim();

    setForm((prev) => {
      const ingredients = normalizeIngredients(prev.ingredients);
      const existingIndex = ingredients.findIndex(
        (item) => item.name === ingredient,
      );
      if (existingIndex >= 0) {
        if (amount) ingredients[existingIndex] = { name: ingredient, amount };
        else return prev;
        return { ...prev, ingredients };
      }
      return {
        ...prev,
        ingredients: [...ingredients, { name: ingredient, amount }],
      };
    });
    setIngredientInput("");
    setIngredientAmountInput("");
  };

  const removeIngredient = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      ingredients: normalizeIngredients(prev.ingredients).filter(
        (_, index) => index !== indexToRemove,
      ),
    }));
  };

  const addPrecaution = () => {
    const precaution = precautionInput.trim();
    if (!precaution) return;

    setForm((prev) => {
      const precautions = parsePrecautions(prev.precautions);
      if (precautions.includes(precaution)) return prev;
      return { ...prev, precautions: [...precautions, precaution].join("\n") };
    });
    setPrecautionInput("");
  };

  const removePrecaution = (precautionToRemove) => {
    setForm((prev) => ({
      ...prev,
      precautions: parsePrecautions(prev.precautions)
        .filter((precaution) => precaution !== precautionToRemove)
        .join("\n"),
    }));
  };

  const handleImageSelect = async (event) => {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image || actionInProgress.current) return;

    actionInProgress.current = true;
    setIsLoading(true);
    setIsAnalyzingImage(true);
    setIsPhotoModalOpen(false);

    try {
      const uploadImage = await prepareImageForUpload(image);
      const data = await extractFoodInfoFromImage(uploadImage);
      if (
        !data.food_name &&
        !data.company_name &&
        !data.report_number &&
        !data.expiration_date &&
        !data.ingredients.length &&
        !data.nutrition.length
      ) {
        throw new Error("사진에서 식품 정보를 찾지 못했습니다.");
      }

      const extractedIngredients = [
        ...normalizeIngredients(data.ingredients),
        ...normalizeIngredients(data.nutrition),
      ];

      setForm((prev) => {
        const ingredientsByName = new Map();
        normalizeIngredients([
          ...prev.ingredients,
          ...extractedIngredients,
        ]).forEach((ingredient) => {
          const existingIngredient = ingredientsByName.get(ingredient.name);
          if (
            !existingIngredient ||
            (!existingIngredient.amount && ingredient.amount)
          ) {
            ingredientsByName.set(ingredient.name, ingredient);
          }
        });

        return {
          ...prev,
          foodName: data.food_name || prev.foodName,
          companyName: data.company_name || prev.companyName,
          productNumber: data.report_number || prev.productNumber,
          expiryDate: data.expiration_date || prev.expiryDate,
          ingredients: Array.from(ingredientsByName.values()),
        };
      });

      if (data.report_number) setReportNumber(data.report_number);
      alert("사진에서 식품 정보를 가져왔습니다. 입력된 내용을 확인해주세요.");
    } catch (error) {
      console.error("사진 식품 정보 추출 오류:", error);
      alert(`사진 분석 실패: ${getApiErrorMessage(error)}`);
    } finally {
      actionInProgress.current = false;
      setIsLoading(false);
      setIsAnalyzingImage(false);
    }
  };

  // 자동 입력 요청 시 처리 로직
  const handleAutoFill = async () => {
    if (actionInProgress.current) return;

    if (!reportNumber.trim() && !form.foodName.trim()) {
      alert("품목번호 또는 식품명을 입력해주세요.");
      return;
    }

    const params = new URLSearchParams();
    if (reportNumber.trim()) params.set("report_number", reportNumber.trim());
    if (form.foodName.trim()) params.set("food_name", form.foodName.trim());
    if (form.companyName.trim())
      params.set("company_name", form.companyName.trim());

    actionInProgress.current = true;
    setIsLoading(true);
    try {
      const data = await getFoodDetail(Object.fromEntries(params.entries()));

      if (data.message) {
        alert(data.message);
        return;
      }

      if (data.report_number || data.productNumber) {
        setReportNumber(data.report_number ?? data.productNumber);
      }

      setForm((prev) => ({
        ...prev,
        foodName: data.food_name ?? data.foodName ?? prev.foodName,
        companyName: data.company_name ?? data.companyName ?? prev.companyName,
        productNumber:
          data.report_number ?? data.productNumber ?? prev.productNumber,
        expiryDate: data.expiration_date ?? data.expiryDate ?? prev.expiryDate,
        ingredients: data.ingredients
          ? normalizeIngredients(data.ingredients)
          : prev.ingredients,
        precautions: data.precautions
          ? Array.isArray(data.precautions)
            ? data.precautions.join("\n")
            : String(data.precautions)
          : prev.precautions,
      }));

      alert("✅ 자동 입력 완료");
    } catch (err) {
      console.error(err);
      alert(`자동 입력 실패: ${err.message}`);
    } finally {
      actionInProgress.current = false;
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (actionInProgress.current) return;

    if (!form.foodName.trim()) {
      alert("식품명은 필수 입력 항목입니다.");
      return;
    }

    if (isLoggedIn && (isLoadingUserState || userStateError)) {
      alert(
        userStateError ||
          "회원 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    actionInProgress.current = true;

    // 1. 알레르기 가공
    const userAllergies = isLoggedIn ? (user.allergies ?? []) : selectedAllergies;

    // 2. 주의사항 가공 (줄바꿈 구분 -> 배열)
    const guestPrecautions = [
      ...new Set([
        ...parsePrecautions(form.precautions),
        ...parsePrecautions(precautionInput),
      ]),
    ];
    const userPrecautions = isLoggedIn
      ? (user.precautions ?? [])
      : guestPrecautions;

    // 스토어 전송 (필요 시 setAnalysis 인수 구조에 맞게 커스텀)
    setAnalysis(
      {
        ...form,
        ingredients: normalizeIngredients([
          ...form.ingredients,
          ...(ingredientInput.trim()
            ? [
                {
                  name: ingredientInput.trim().replace(/,+$/, "").trim(),
                  amount: ingredientAmountInput.trim(),
                },
              ]
            : []),
        ]).filter(
          (ingredient, index, ingredients) =>
            ingredients.findIndex((item) => item.name === ingredient.name) ===
            index,
        ),
        productNumber: reportNumber || form.productNumber,
      },
      userAllergies,
      userPrecautions,
    );
    navigate("/result");
  };

  return (
    <div
      className={`m-0 box-border min-h-screen pt-[50px] ${pageBgClass} ${pageTextClass}`}
    >
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        <div className="mb-8 text-center">
          <h1
            className={`text-3xl font-bold tracking-tight ${headingTextClass} md:text-4xl`}
          >
            식품 <span className={accent.textAccent}>안전 분석</span>
          </h1>
          <p
            className={`mt-3 text-sm leading-relaxed ${mutedTextClass} md:text-base`}
          >
            품목 보고 번호 또는 제품명을 입력해주세요
          </p>
        </div>

        <div className="mx-auto mb-4 w-full max-w-md">
          <button
            type="button"
            onClick={() => setIsPhotoModalOpen(true)}
            disabled={isLoading}
            className={buttonClassName}
          >
            {isAnalyzingImage
              ? "사진 분석 중..."
              : "사진으로 식품 정보 가져오기"}
          </button>
        </div>

        <div
          className={`mx-auto w-full max-w-md rounded-2xl border ${accent.borderAccent20} ${formBgClass} p-8 shadow-lg`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                식품명 (필수)
              </label>
              <input
                type="text"
                name="foodName"
                value={form.foodName}
                onChange={handleChange}
                placeholder="식품명을 입력해주세요"
                className={inputClassName}
                required
              />
            </div>

            <div>
              <label
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                업체명 (선택)
              </label>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="업체명을 입력해주세요"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                품목번호 (선택)
              </label>
              <input
                type="text"
                name="productNumber"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                placeholder="품목번호를 입력해주세요"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                원료 및 성분 (선택)
              </label>
              <p
                id="ingredients-help"
                className={`mb-2 text-xs ${mutedTextClass}`}
              >
                재료명과 성분량(선택)을 입력하세요. 입력하지 않으면 AI가 식품명을
                바탕으로 원료 및 성분을 추정해 분석합니다.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  aria-label="재료명"
                  aria-describedby="ingredients-help ingredients-warning"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addIngredient();
                    }
                  }}
                  placeholder="재료명"
                  className={`${inputClassName} sm:flex-[2]`}
                />
                <input
                  type="text"
                  value={ingredientAmountInput}
                  onChange={(e) => setIngredientAmountInput(e.target.value)}
                  aria-label="성분량 (선택)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addIngredient();
                    }
                  }}
                  placeholder="성분량 (선택)"
                  className={`${inputClassName} sm:flex-1`}
                />
                <button
                  type="button"
                  onClick={addIngredient}
                  className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${accent.btnOutline}`}
                >
                  추가
                </button>
              </div>
              {form.ingredients.length > 0 && (
                <ul
                  className="mt-2 flex flex-wrap gap-2"
                  aria-label="입력한 원료 및 성분"
                >
                  {form.ingredients.map((ingredient, index) => (
                    <li
                      key={`${ingredient.name}-${index}`}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                        isDark
                          ? "bg-slate-700 text-slate-100"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span>
                        {ingredient.name}
                        {ingredient.amount ? ` (${ingredient.amount})` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        aria-label={`${ingredient.name} 삭제`}
                        className="ml-1 rounded-full px-1 font-semibold hover:text-red-500"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label
                htmlFor="consumptionAmount"
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                섭취량 (선택)
              </label>
              <input
                id="consumptionAmount"
                type="text"
                name="consumptionAmount"
                value={form.consumptionAmount}
                onChange={handleChange}
                placeholder="예: 1개 (약 30g), 100g"
                aria-describedby="consumption-amount-help"
                className={inputClassName}
              />
              <p
                id="consumption-amount-help"
                className={`mt-2 text-xs ${mutedTextClass}`}
              >
                입력한 섭취량을 분석 시 참고합니다. 정확한 단위와 양을 입력해주세요.
              </p>
            </div>

            <div>
              <label
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                제조일 (선택)
              </label>
              <input
                type="date"
                name="manufactureDate"
                value={form.manufactureDate}
                onChange={handleChange}
                aria-describedby="manufacture-date-help"
                className={inputClassName}
              />
              <p
                id="manufacture-date-help"
                className={`mt-2 text-xs ${mutedTextClass}`}
              >
                입력하지 않으면 오늘 날짜를 제조일로 사용합니다.
              </p>
            </div>

            <div>
              <label
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                소비기한 (선택)
              </label>
              <input
                type="text"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                aria-describedby="expiry-date-help"
                placeholder="소비기한을 입력해주세요"
                className={inputClassName}
              />
              <p
                id="expiry-date-help"
                className={`mt-2 text-xs leading-relaxed ${mutedTextClass}`}
              >
                YYYY-MM-DD 날짜 또는 기간으로 입력해주세요. 기간은 년, 개월, 주일,
                일 단위로 입력할 수 있습니다. (예: 2026-12-31, 1년 2개월 3주일 4일)
              </p>
            </div>

            {/* 알레르기 정보 영역 */}
            <div>
              <label
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                알레르기 정보{" "}
                {isLoggedIn ? "(회원 정보 자동 적용)" : "(비회원일 경우 입력)"}
              </label>
              <p className={`mb-2 text-xs leading-relaxed ${mutedTextClass}`}>
                알레르기 분석 시 선택하신 항목과 관련된 성분도 함께 확인해 교차
                반응 가능성을 검토합니다. AI 분석은 참고용이며 개인별 반응을 모두
                판단할 수는 없습니다.
              </p>
              {isLoggedIn ? (
                isLoadingUserState ? (
                  <p className={`text-sm ${mutedTextClass}`}>
                    회원 정보를 불러오는 중...
                  </p>
                ) : userStateError ? (
                  <p className="text-sm text-red-500">{userStateError}</p>
                ) : (
                  <p
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      isDark
                        ? "border-slate-600 bg-[#0f172a] text-slate-300"
                        : "border-slate-300 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {user?.allergies && user.allergies.length > 0
                      ? user.allergies.join(", ")
                      : "설정된 알레르기가 없습니다. 마이페이지에서 설정해주세요."}
                  </p>
                )
              ) : (
                <div
                  className={`space-y-4 rounded-lg border p-4 ${
                    isDark
                      ? "border-slate-600 bg-[#0f172a]"
                      : "border-slate-300 bg-slate-50"
                  }`}
                >
                  {allergyCategories.map((category) => (
                    <div key={category.category}>
                      <p
                        className={`mb-2 text-xs font-bold ${accent.textAccent}`}
                      >
                        {category.category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {category.items.map((item) => (
                          <label
                            key={item}
                            className="flex cursor-pointer items-center gap-1"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAllergies.includes(item)}
                              onChange={() => toggleAllergy(item)}
                              className="accent-teal-500"
                            />
                            <span
                              className={`text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}
                            >
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 주의사항 정보 영역 (추가됨) */}
            <div>
              <label
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                사용자 주의사항{" "}
                {isLoggedIn ? "(회원 정보 자동 적용)" : "(비회원일 경우 입력)"}
              </label>
              <p className={`mb-2 text-xs leading-relaxed ${mutedTextClass}`}>
                식품 자체의 보관·취급 주의사항이 아니라, 분석에 반영할 사용자의 개인
                주의사항을 입력하거나 확인하는 항목입니다.
              </p>
              {isLoggedIn ? (
                isLoadingUserState ? (
                  <p className={`text-sm ${mutedTextClass}`}>
                    회원 정보를 불러오는 중...
                  </p>
                ) : userStateError ? (
                  <p className="text-sm text-red-500">{userStateError}</p>
                ) : (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      isDark
                        ? "border-slate-600 bg-[#0f172a] text-slate-300"
                        : "border-slate-300 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {user?.precautions && user.precautions.length > 0 ? (
                      <ul className="list-inside list-disc space-y-1">
                        {user.precautions.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      "설정된 주의사항이 없습니다. 마이페이지에서 설정해주세요."
                    )}
                  </div>
                )
              ) : (
                <>
                  <input
                    type="text"
                    value={precautionInput}
                    onChange={(e) => setPrecautionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPrecaution();
                      }
                    }}
                    placeholder="주의사항을 입력하고 Enter를 눌러주세요"
                    className={inputClassName}
                  />
                  {parsePrecautions(form.precautions).length > 0 && (
                    <ul
                      className="mt-2 flex flex-wrap gap-2"
                      aria-label="입력한 주의사항"
                    >
                      {parsePrecautions(form.precautions).map(
                        (precaution, index) => (
                          <li
                            key={`${precaution}-${index}`}
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                              isDark
                                ? "bg-slate-700 text-slate-100"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <span>{precaution}</span>
                            <button
                              type="button"
                              onClick={() => removePrecaution(precaution)}
                              aria-label={`${precaution} 삭제`}
                              className="ml-1 rounded-full px-1 font-semibold hover:text-red-500"
                            >
                              ×
                            </button>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="mt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleAutoFill}
                className={buttonClassName}
                disabled={isLoading}
              >
                {isAnalyzingImage
                  ? "사진 분석 중..."
                  : isLoading
                    ? "자동 입력 중..."
                    : "자동 입력"}
              </button>
              <button
                type="submit"
                className={buttonClassName}
                disabled={isLoading}
              >
                {isLoading ? "로딩 중..." : "분석하기"}
              </button>
            </div>
            <div className="space-y-2">
              <p
                id="ingredients-warning"
                className={`text-xs leading-relaxed ${
                  isDark ? "text-amber-300" : "text-amber-700"
                }`}
              >
                입력한 원료 및 성분만 분석에 반영됩니다.
                입력하지 않은 성분은 분석되지 않을 수 있으니 제품에 표시된 정보를
                빠짐없이 입력해주세요.
              </p>
              <p className={`text-xs leading-relaxed ${mutedTextClass}`}>
                자동 입력 정보는 식품안전나라에 등록된 제품 정보를 바탕으로
                제공됩니다. 제품 정보가 정확하지 않을 수 있으니 입력된 내용을
                확인해주세요.
              </p>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className={`text-sm ${mutedTextClass}`}>
            <Link
              to="/ai-chat"
              className={`${accent.textAccent} transition-colors hover:underline ${
                isDark ? "hover:text-white" : accent.hoverTextAccent
              }`}
            >
              AI에게 직접 질문하기 →
            </Link>
          </p>
        </div>
      </main>

      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
      />

      {isPhotoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-modal-title"
            className={`w-full max-w-sm rounded-2xl p-6 shadow-xl ${formBgClass}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="photo-modal-title"
                className={`text-lg font-bold ${headingTextClass}`}
              >
                사진 가져오기
              </h2>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                aria-label="사진 가져오기 창 닫기"
                className={`rounded-lg px-3 py-1 text-xl ${mutedTextClass}`}
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                className={buttonClassName}
              >
                사진을 파일에서 가져오기
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={buttonClassName}
              >
                사진 직접 촬영하기
              </button>
            </div>
            <p className={`mt-4 text-xs leading-relaxed ${mutedTextClass}`}>
              식품명, 원료 및 표시된 영양성분이 잘 보이도록 촬영해주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
