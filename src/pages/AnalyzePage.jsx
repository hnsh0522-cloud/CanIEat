import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import useAuthStore from "../store/useAuthStore.js";
import useAnalysisStore from "../store/useAnalysisStore.js";
import { getFoodDetail } from "../api/food";

const initialForm = {
  foodName: "",
  companyName: "",
  productNumber: "",
  ingredients: "", // UI 입력창 렌더링을 위해 문자열 상태 유지
  expiryDate: "",
  allergies: "",
};

export default function AnalyzePage() {
  const [form, setForm] = useState(initialForm);
  const [autoFillMode, setAutoFillMode] = useState(0);
  const [reportNumber, setReportNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const { isLoggedIn, user } = useAuthStore();
  const { setAnalysis } = useAnalysisStore();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 자동 입력 요청 시 처리 로직
  const handleAutoFill = async () => {
    if (!reportNumber.trim() && !form.foodName.trim()) {
      alert("품목번호 또는 식품명을 입력해주세요.");
      return;
    }

    const params = new URLSearchParams();
    if (reportNumber.trim()) params.set("report_number", reportNumber.trim());
    if (form.foodName.trim()) params.set("food_name", form.foodName.trim());
    if (form.companyName.trim())
      params.set("company_name", form.companyName.trim());

    setIsLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(
        `${API_BASE_URL}/getFoodDetail?${params.toString()}`,
      );

      if (!res.ok) throw new Error(`HTTP 에러! 상태코드: ${res.status}`);
      const data = await res.json();

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
        // 받아오는 정보가 List(배열)이든 문자열이든 가공해서 UI에는 콤마 문자열로 보여줌
        ingredients: data.ingredients
          ? Array.isArray(data.ingredients)
            ? data.ingredients.join(", ")
            : String(data.ingredients)
          : prev.ingredients,
        allergies: data.allergies ?? prev.allergies,
      }));

      alert("✅ 자동 입력 완료");
    } catch (err) {
      console.error(err);
      alert(`자동 입력 실패: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 최종 폼 제출 핸들러 (List 변환 적용 공정)
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("버튼 클릭됨");

    // ⭕ 원료 및 성분 문자열을 쉼표 단위로 쪼개서 공백 제거 후 완전한 List(Array)로 변환
    // 예: "정제수, 대두 ,밀" -> ["정제수", "대두", "밀"]
    const processedIngredients = form.ingredients
      ? form.ingredients
          .split(/[,，、]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    // 알레르기 정보 처리 (로그인 유저 정보 배열 혹은 비회원 입력 파싱)
    const processedAllergies = isLoggedIn
      ? (user.allergies ?? [])
      : form.allergies
        ? form.allergies
            .split(/[,，、]/)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    // 백엔드로 전송할 최종 API payload 객체 구조화
    const requestPayload = {
      report_number: reportNumber || form.productNumber,
      food_name: form.foodName,
      company_name: form.companyName,
      ingredients: processedIngredients, // ⬅️ 완전한 List 형태로 주입 완료!
      expiry_date: form.expiryDate,
      allergies: processedAllergies, // ⬅️ 알레르기 역시 List 형태로 동기화
    };

    console.log("백엔드로 전송할 데이터:", requestPayload);

    setIsLoading(true);
    try {
      // 팩토리나 API 함수 구조 규격에 맞게 맵핑하여 데이터 전달
      const data = await getFoodDetail(requestPayload);
      navigate("/result", { state: { foodData: data } });
    } catch (error) {
      alert("식품 정보를 가져오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }

    const data = await res.json();
    console.log("백엔드가 보내준 리얼 데이터 구조:", data);
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
              <input
                type="text"
                name="ingredients"
                value={form.ingredients}
                onChange={handleChange}
                placeholder="원료 및 성분을 입력해주세요"
                className={inputClassName}
              />
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
                placeholder="소비기한을 입력해주세요"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                className={`mb-1 block text-sm font-medium ${labelTextClass}`}
              >
                알레르기 정보{" "}
                {isLoggedIn ? "(회원 정보 자동 적용)" : "(비회원일 경우 입력)"}
              </label>
              {isLoggedIn ? (
                <p
                  className={`rounded-lg border px-4 py-3 text-sm ${isDark ? "border-slate-600 bg-[#0f172a] text-slate-300" : "border-slate-300 bg-slate-50 text-slate-700"}`}
                >
                  {user.allergies.length > 0
                    ? user.allergies.join(", ")
                    : "설정된 알레르기가 없습니다. 마이페이지에서 설정해주세요."}
                </p>
              ) : (
                <input
                  type="text"
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  placeholder="알레르기를 쉼표로 구분해 입력해주세요 (예: 땅콩, 우유)"
                  className={inputClassName}
                />
              )}
            </div>

            <div className="mt-2 flex flex-col gap-3">
              <button
                type="submit"
                className={buttonClassName}
                disabled={isLoading}
              >
                {isLoading ? "로딩 중..." : "분석하기"}
              </button>
              <button
                type="button"
                onClick={handleAutoFill}
                className={buttonClassName}
                disabled={isLoading}
              >
                자동 입력
              </button>
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
    </div>
  );
}
