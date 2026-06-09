import { Link, Navigate } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import useAnalysisStore from "../store/useAnalysisStore.js";
import { canIEat } from "../api/food";
import { useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

function DangerPill({ isDanger }) {
  if (isDanger) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/80 bg-orange-400/10 px-3 py-1 text-sm font-semibold text-orange-400">
        <span aria-hidden>⚠️</span>
        위험 성분이 포함되어 있습니다
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-green-400/80 bg-green-400/10 px-3 py-1 text-sm font-semibold text-green-400">
      <span aria-hidden>✅</span>
      안전한 제품입니다
    </div>
  );
}

export default function ResultPage() {
  const { lastResult } = useAnalysisStore();
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();

  const { state } = useLocation();
  const { foodData } = state;
  const { user } = useAuthStore();

  if (!lastResult) {
    return <Navigate to="/analyze" replace />;
  }

  const product = lastResult;

  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const pageTextClass = isDark ? "text-slate-100" : "text-[#1e293b]";
  const headingTextClass = isDark ? "text-white" : "text-[#1e293b]";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const cardBgClass = isDark ? "bg-[#1e293b]" : "bg-[#ffffff]";
  const surfaceBgClass = isDark ? "bg-slate-950/20" : "bg-slate-100/60";
  const internalTextClass = isDark ? "text-slate-200" : "text-[#1e293b]";
  const manufacturerTextClass = isDark ? "text-slate-100" : "text-[#1e293b]";

  const handleAiAnalyze = async () => {
    const result = await canIEat({
      food_name: foodData.food_name,
      expiration_date: foodData.expiration_date,
      ingredients: foodData.ingredients,
      allergy: user.allergies, // Zustand에서 가져온 유저 알레르기
    });
    // result.risk_level → safe / caution / unsafe
    // result.result_message → 판단 이유 메시지
  };

  return (
    <div
      className={`m-0 box-border min-h-screen pt-14 md:pt-[50px] ${pageBgClass} ${pageTextClass}`}
    >
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10">
        <div className="mb-8 text-center">
          <h1
            className={`text-3xl font-bold tracking-tight ${headingTextClass} md:text-4xl`}
          >
            분석 <span className={accent.textAccent}>결과</span>
          </h1>
          <p
            className={`mt-3 text-sm leading-relaxed ${mutedTextClass} md:text-base`}
          >
            검색하신 제품의 알레르기 정보입니다
          </p>
        </div>

        <section
          className={`rounded-2xl border ${accent.borderAccent20} ${cardBgClass} p-6 shadow-lg`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className={`truncate text-xl font-bold ${headingTextClass}`}>
                {product.productName}
              </h2>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                제조사:{" "}
                <span className={manufacturerTextClass}>
                  {product.manufacturer}
                </span>
              </p>
              {product.productNumber && (
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  품목번호: {product.productNumber}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <DangerPill isDanger={product.isDanger} />
            </div>
          </div>

          <div
            className={`mt-4 rounded-xl border ${accent.borderAccent10} ${surfaceBgClass} p-4`}
          >
            <p className={`text-sm font-semibold ${accent.textAccent}`}>
              원재료
            </p>
            <p className={`mt-2 text-sm leading-relaxed ${internalTextClass}`}>
              {product.rawMaterial}
            </p>
          </div>

          <div
            className={`mt-4 rounded-xl border ${accent.borderAccent10} ${surfaceBgClass} p-4 space-y-5`}
          >
            <div>
              <p className={`text-sm font-semibold ${accent.textAccent}`}>
                포함된 알레르기 성분
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.allergies.length > 0 ? (
                  product.allergies.map((a) => (
                    <span
                      key={a}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${accent.badgeAccent}`}
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <p className={`text-sm ${mutedTextClass}`}>
                    성분에서 알려진 알레르기 유발 성분이 감지되지 않았습니다
                  </p>
                )}
              </div>
            </div>

            {product.userAllergies.length > 0 && (
              <div>
                <p className={`text-sm font-semibold ${accent.textAccent}`}>
                  내 알레르기 기준
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.userAllergies.map((a) => (
                    <span
                      key={a}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${accent.badgeAccent}`}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-orange-400">
                ⚠️ 주의 성분
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.dangerItems?.length ? (
                  product.dangerItems.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-orange-400 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-400"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <p className={`text-sm ${mutedTextClass}`}>
                    내 알레르기 기준 주의 성분이 없습니다
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/analyze"
            className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${accent.btnOutline}`}
          >
            다시 검색하기
          </Link>
          <Link
            to="/ai-chat"
            className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${accent.btnSolid}`}
          >
            AI에게 질문하기 →
          </Link>
        </div>
      </main>
    </div>
  );
}
