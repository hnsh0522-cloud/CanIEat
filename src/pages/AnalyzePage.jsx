import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import useAuthStore from "../store/useAuthStore.js";
import useAnalysisStore from "../store/useAnalysisStore.js";

const initialForm = {
  foodName: "",
  companyName: "",
  productNumber: "",
  ingredients: "",
  expiryDate: "",
  allergies: "",
};

export default function AnalyzePage() {
  const [form, setForm] = useState(initialForm);
  const [autoFillMode, setAutoFillMode] = useState(0);
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

  const handleAutoFill = () => {
    if (autoFillMode % 2 === 0) {
      setForm({
        foodName: "두부 김치찌개",
        companyName: "(주)샘플식품",
        productNumber: "",
        ingredients: "두부, 김치, 고춧가루",
        expiryDate: "제조일로부터 6개월까지",
      });
    } else {
      setForm({
        foodName: "즉석밥",
        companyName: "",
        productNumber: "2024012345678",
        ingredients: "",
        expiryDate: "",
      });
    }
    setAutoFillMode((m) => m + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.foodName.trim()) {
      alert("식품명은 필수 입력 항목입니다.");
      return;
    }
    const userAllergies = isLoggedIn ? user.allergies : [];
    setAnalysis(form, userAllergies);
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
                value={form.productNumber}
                onChange={handleChange}
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
                <p className={`rounded-lg border px-4 py-3 text-sm ${isDark ? "border-slate-600 bg-[#0f172a] text-slate-300" : "border-slate-300 bg-slate-50 text-slate-700"}`}>
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
              <button type="submit" className={buttonClassName}>
                분석하기
              </button>
              <button
                type="button"
                onClick={handleAutoFill}
                className={buttonClassName}
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
