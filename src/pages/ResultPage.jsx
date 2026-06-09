import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { canIEat } from "../api/food";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import useAnalysisStore from "../store/useAnalysisStore.js";
function RiskPill({ riskLevel }) {
  if (!riskLevel) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-400/80 bg-slate-400/10 px-3 py-1 text-sm font-semibold text-slate-400">
        분석 중...
      </div>
    );
  }
  if (riskLevel === "unsafe") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-red-400/80 bg-red-400/10 px-3 py-1 text-sm font-semibold text-red-400">
        <span aria-hidden>🚫</span>
        섭취 불가
      </div>
    );
  }

  if (riskLevel === "caution") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/80 bg-orange-400/10 px-3 py-1 text-sm font-semibold text-orange-400">
        <span aria-hidden>⚠️</span>
        주의 필요
      </div>
    );
  }

  if (riskLevel === "safe") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-green-400/80 bg-green-400/10 px-3 py-1 text-sm font-semibold text-green-400">
        <span aria-hidden>✅</span>
        안전
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-400/80 bg-slate-400/10 px-3 py-1 text-sm font-semibold text-slate-400">
      -
    </div>
  );
}

function RiskTypeBadge({ riskType }) {
  if (!riskType) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-400/60 bg-slate-400/10 px-3 py-1 text-xs font-semibold text-slate-400">
        분석 중...
      </div>
    );
  }
  if (riskType === "match") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-red-400/60 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-400">
        알레르기 성분 일치
      </div>
    );
  }

  if (riskType === "unmatch") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-green-400/60 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-400">
        알레르기 성분 불일치
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-400/60 bg-slate-400/10 px-3 py-1 text-xs font-semibold text-slate-400">
      -
    </div>
  );
}

function ResultField({
  label,
  value,
  isLoading,
  accent,
  mutedTextClass,
  internalTextClass,
}) {
  return (
    <div>
      <p className={`text-sm font-semibold ${accent.textAccent}`}>{label}</p>
      <p className={`mt-2 text-sm leading-relaxed whitespace-pre-line ${internalTextClass}`}>
        {isLoading ? (
          <span className={mutedTextClass}>불러오는 중...</span>
        ) : (
          value || <span className={mutedTextClass}>-</span>
        )}
      </p>
    </div>
  );
}

export default function ResultPage() {
  const { lastResult } = useAnalysisStore();
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();
  const [analysis, setAnalysis] = useState({
    risk_level: "",
    detected_ingredients: "",
    risk_type: "",
    result_message: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!lastResult) return;
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await canIEat({
          food_name: lastResult.productName,
          expiration_date: lastResult.expiryDate ?? "",
          ingredients: lastResult.rawMaterial
            ? lastResult.rawMaterial.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
            : [],
          allergies: lastResult.userAllergies ?? [],  // allergy → allergies 일 수도 있음
        });
        const data = result.data ?? result;
        setAnalysis({
          risk_level: data.risk_level ?? "",
          detected_ingredients: data.detected_ingredients ?? "",
          risk_type: data.risk_type ?? "",
          result_message: data.result_message ?? "",
        });
      } catch (err) {
        console.error("canIEat API error:", err);
        setError("분석 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalysis();
  }, [lastResult]);
  if (!lastResult) {
    return <Navigate to="/analyze" replace />;
  }
  const { risk_level, detected_ingredients, risk_type, result_message } =
    analysis;

  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const pageTextClass = isDark ? "text-slate-100" : "text-[#1e293b]";
  const headingTextClass = isDark ? "text-white" : "text-[#1e293b]";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const cardBgClass = isDark ? "bg-[#1e293b]" : "bg-[#ffffff]";
  const surfaceBgClass = isDark ? "bg-slate-950/20" : "bg-slate-100/60";
  const internalTextClass = isDark ? "text-slate-200" : "text-[#1e293b]";
  const manufacturerTextClass = isDark ? "text-slate-100" : "text-[#1e293b]";

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
            검색하신 제품의 알레르기 분석 결과입니다
          </p>
        </div>

        <section
          className={`rounded-2xl border ${accent.borderAccent20} ${cardBgClass} p-6 shadow-lg`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className={`truncate text-xl font-bold ${headingTextClass}`}>
                {lastResult.productName}
              </h2>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                제조사:{" "}
                <span className={manufacturerTextClass}>
                  {lastResult.manufacturer}
                </span>
              </p>
              {lastResult.productNumber && (
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  품목번호: {lastResult.productNumber}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <RiskPill riskLevel={isLoading ? null : risk_level} />
              <RiskTypeBadge riskType={isLoading ? null : risk_type} />
            </div>
          </div>

          <div
            className={`mt-4 rounded-xl border ${accent.borderAccent10} ${surfaceBgClass} p-4 space-y-4`}
          >
            {error && <p className="text-sm text-red-400">{error}</p>}

            <ResultField
              label="위험 수준 (risk_level)"
              value={risk_level}
              isLoading={isLoading}
              accent={accent}
              mutedTextClass={mutedTextClass}
              internalTextClass={internalTextClass}
            />

            <ResultField
              label="탐지된 성분 (detected_ingredients)"
              value={detected_ingredients}
              isLoading={isLoading}
              accent={accent}
              mutedTextClass={mutedTextClass}
              internalTextClass={internalTextClass}
            />

            <ResultField
              label="판정 유형 (risk_type)"
              value={risk_type}
              isLoading={isLoading}
              accent={accent}
              mutedTextClass={mutedTextClass}
              internalTextClass={internalTextClass}
            />

            <ResultField
              label="안내 메시지 (result_message)"
              value={result_message}
              isLoading={isLoading}
              accent={accent}
              mutedTextClass={mutedTextClass}
              internalTextClass={internalTextClass}
            />
          </div>

          <div
            className={`mt-4 rounded-xl border ${accent.borderAccent10} ${surfaceBgClass} p-4`}
          >
            <p className={`text-sm font-semibold ${accent.textAccent}`}>
              입력 원재료
            </p>
            <p className={`mt-2 text-sm leading-relaxed ${internalTextClass}`}>
              {lastResult.rawMaterial || "성분 정보가 입력되지 않았습니다."}
            </p>
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
