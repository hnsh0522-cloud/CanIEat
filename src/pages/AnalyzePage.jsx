import { useState } from "react";
import { Link } from "react-router-dom";

const initialForm = {
  foodName: "",
  companyName: "",
  productNumber: "",
  ingredients: "",
  expiryDate: "",
};

const inputClassName =
  "w-full rounded-lg border border-slate-600 bg-[#0f172a] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none";

const buttonClassName =
  "w-full rounded-xl border-2 border-cyan-300 bg-transparent px-8 py-3 text-lg font-semibold text-cyan-300 transition-all duration-200 hover:bg-cyan-300 hover:text-gray-900";

export default function AnalyzePage() {
  const [form, setForm] = useState(initialForm);
  const [autoFillMode, setAutoFillMode] = useState(0);

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
    alert("분석 기능은 준비 중입니다.");
  };

  return (
    <div className="m-0 box-border min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-[50px] text-slate-100">
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        {/* 상단 제목 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            식품 <span className="text-cyan-300">안전 분석</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
            품목 보고 번호 또는 제품명을 입력해주세요
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="mx-auto w-full max-w-md rounded-2xl border border-cyan-300/20 bg-[#1e293b] p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
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
              <label className="mb-1 block text-sm font-medium text-slate-300">
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
              <label className="mb-1 block text-sm font-medium text-slate-300">
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
              <label className="mb-1 block text-sm font-medium text-slate-300">
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
              <label className="mb-1 block text-sm font-medium text-slate-300">
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

        {/* 하단 링크 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            <Link
              to="/ai-chat"
              className="text-cyan-300 transition-colors hover:text-white hover:underline"
            >
              AI에게 직접 질문하기 →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
