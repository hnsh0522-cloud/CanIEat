import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/auth";
import { canIEat, saveAnalysisResult } from "../api/food";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import useAnalysisStore from "../store/useAnalysisStore.js";
import useAuthStore from "../store/useAuthStore.js";

function RiskPill({ riskLevel }) {
  if (!riskLevel) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-400/80 bg-slate-400/10 px-3 py-1 text-sm font-semibold text-slate-400">
        분석 중...
      </div>
    );
  }
  const normalizedRiskLevel = riskLevel.toLowerCase();
  if (normalizedRiskLevel === "unsafe") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-red-400/80 bg-red-400/10 px-3 py-1 text-sm font-semibold text-red-400">
        <span aria-hidden>🚫</span>
        섭취 불가
      </div>
    );
  }

  if (normalizedRiskLevel === "caution") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/80 bg-orange-400/10 px-3 py-1 text-sm font-semibold text-orange-400">
        <span aria-hidden>⚠️</span>
        주의 필요
      </div>
    );
  }

  if (normalizedRiskLevel === "safe") {
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

function RiskTypeBadges({ riskTypes, isLoading, mutedTextClass, isDark }) {
  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-400/60 bg-slate-400/10 px-3 py-1 text-xs font-semibold text-slate-400">
        분석 중...
      </div>
    );
  }
  if (riskTypes.length === 0) {
    return <span className={`text-xs ${mutedTextClass}`}>판정 항목 없음</span>;
  }

  return riskTypes.map(({ allergy, type }, index) => {
    const isMatch = type?.toLowerCase() === "match";
    const badgeClass = isMatch
      ? "border-red-400/60 bg-red-400/10 text-red-400"
      : type?.toLowerCase() === "unmatch"
        ? "border-green-400/60 bg-green-400/10 text-green-400"
        : isDark
          ? "border-slate-400/60 bg-slate-400/10 text-slate-400"
          : "border-slate-500/60 bg-slate-500/10 text-slate-600";

    const statusLabel = isMatch
      ? "일치"
      : type?.toLowerCase() === "unmatch"
        ? "불일치"
        : type || "-";

    return (
      <div
        key={`${allergy}-${type}-${index}`}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}
      >
        {allergy}: {statusLabel}
      </div>
    );
  });
}

function ResultField({
  label,
  value,
  isLoading,
  accent,
  mutedTextClass,
  internalTextClass,
}) {
  const displayValue = Array.isArray(value) ? value.join(", ") : value;

  return (
    <div>
      <p className={`text-sm font-semibold ${accent.textAccent}`}>{label}</p>
      <p
        className={`mt-2 text-sm leading-relaxed whitespace-pre-line ${internalTextClass}`}
      >
        {isLoading ? (
          <span className={mutedTextClass}>불러오는 중...</span>
        ) : (
          displayValue || <span className={mutedTextClass}>-</span>
        )}
      </p>
    </div>
  );
}

export default function ResultPage() {
  const { lastResult } = useAnalysisStore();
  const { isLoggedIn, user } = useAuthStore();
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();
  const [analysis, setAnalysis] = useState({
    risk_level: "",
    detected_ingredients: [],
    risk_type: [],
    result_message: "",
    allergy_reason: "",
    precaution_reason: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedAnalysis, setHasSavedAnalysis] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const requestedAnalysisKey = useRef(null);

  useEffect(() => {
    if (!lastResult) return;

    const requestBody = {
      food_name: lastResult.productName,
      ...(lastResult.manufactureDate
        ? { manufacture_date: lastResult.manufactureDate }
        : {}),
      ...(lastResult.consumptionAmount
        ? { consumption_amount: lastResult.consumptionAmount }
        : {}),
      expiration_date: lastResult.expiryDate ?? "",
      ingredients:
        lastResult.ingredients ??
        (lastResult.rawMaterial
          ? lastResult.rawMaterial
              .split(/[,，、]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : []),
      allergies: lastResult.userAllergies ?? user?.allergies ?? [],
      precautions: lastResult.userPrecautions ?? user?.precautions ?? [],
    };
    const requestKey = JSON.stringify(requestBody);

    if (requestedAnalysisKey.current === requestKey) return;
    requestedAnalysisKey.current = requestKey;

    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await canIEat(requestBody);
        const data = result.data ?? result;
        setAnalysis({
          risk_level: data.risk_level ?? "",
          detected_ingredients: Array.isArray(data.detected_ingredients)
            ? data.detected_ingredients
            : [],
          risk_type: Array.isArray(data.risk_type) ? data.risk_type : [],
          result_message: data.result_message ?? "",
          allergy_reason:
            data.allergy_reason ?? data.reasoning?.allergy ?? "",
          precaution_reason:
            data.precaution_reason ?? data.reasoning?.precautions ?? "",
        });
      } catch (err) {
        console.error("canIEat API error:", err);
        setError("분석 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        if (requestedAnalysisKey.current === requestKey) {
          requestedAnalysisKey.current = null;
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [isLoggedIn, lastResult, user]);

  if (!lastResult) {
    return <Navigate to="/analyze" replace />;
  }

  const {
    risk_level,
    detected_ingredients,
    risk_type,
    result_message,
    allergy_reason,
    precaution_reason,
  } = analysis;

  const handleSaveAnalysis = async () => {
    if (
      !isLoggedIn ||
      isLoading ||
      !risk_level ||
      isSaving ||
      hasSavedAnalysis
    ) {
      return;
    }

    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");
    try {
      const result = await saveAnalysisResult({
        product_name: lastResult.productName,
        risk_level,
        detected_ingredients,
        risk_type,
        result_message,
      });

      if (!result?.success) {
        throw new Error(result?.message || "분석 기록 저장에 실패했습니다.");
      }
      setHasSavedAnalysis(true);
      setSaveMessage("분석 기록에 저장되었습니다.");
    } catch (saveRequestError) {
      console.error("Analysis save API error:", saveRequestError);
      setSaveError(getApiErrorMessage(saveRequestError));
    } finally {
      setIsSaving(false);
    }
  };

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
            검색하신 제품의 알레르기 및 주의사항 분석 결과입니다
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
              <div className="flex flex-wrap justify-end gap-2">
                <RiskTypeBadges
                  riskTypes={risk_type}
                  isLoading={isLoading}
                  mutedTextClass={mutedTextClass}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>

          <div
            className={`mt-4 space-y-4 rounded-xl border ${accent.borderAccent10} ${surfaceBgClass} p-4`}
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
              label="입력 섭취량"
              value={lastResult.consumptionAmount || "미입력"}
              isLoading={isLoading}
              accent={accent}
              mutedTextClass={mutedTextClass}
              internalTextClass={internalTextClass}
            />

            <ResultField
              label="알레르기 판단 이유 (allergy_reason)"
              value={allergy_reason}
              isLoading={isLoading}
              accent={accent}
              mutedTextClass={mutedTextClass}
              internalTextClass={internalTextClass}
            />

            <ResultField
              label="주의사항 판단 이유 (precaution_reason)"
              value={precaution_reason}
              isLoading={isLoading}
              accent={accent}
              mutedTextClass={mutedTextClass}
              internalTextClass={internalTextClass}
            />

            <div>
              <p className={`text-sm font-semibold ${accent.textAccent}`}>
                감지된 알레르기 성분
              </p>
              {isLoading ? (
                <p className={`mt-2 text-sm ${mutedTextClass}`}>불러오는 중...</p>
              ) : detected_ingredients.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {detected_ingredients.map(
                    ({ ingredient, allergy }, index) => (
                      <li
                        key={`${ingredient}-${allergy}-${index}`}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          isDark
                            ? "border-slate-700 bg-slate-900/30"
                            : "border-slate-200 bg-white/70"
                        }`}
                      >
                        <span className={`font-semibold ${internalTextClass}`}>
                          {ingredient || "성분 정보 없음"}
                        </span>
                        <span className={`mx-2 ${mutedTextClass}`}>·</span>
                        <span className={mutedTextClass}>
                          관련 알레르기: {allergy || "정보 없음"}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p className={`mt-2 text-sm ${mutedTextClass}`}>
                  감지된 알레르기 성분이 없습니다.
                </p>
              )}
            </div>

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
          {isLoggedIn && (
            <div>
              <button
                type="button"
                onClick={handleSaveAnalysis}
                disabled={
                  isLoading || !risk_level || isSaving || hasSavedAnalysis
                }
                className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${accent.btnSolid}`}
              >
                {isSaving
                  ? "저장 중..."
                  : hasSavedAnalysis
                    ? "저장 완료"
                    : "분석 기록 저장"}
              </button>
            </div>
          )}
          <Link
            to="/analyze"
            className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${accent.btnOutline}`}
          >
            다시 검색하기
          </Link>
        </div>
        {saveMessage && (
          <p className="mt-3 text-center text-sm text-green-500" role="status">
            {saveMessage}
          </p>
        )}
        {saveError && (
          <p className="mt-3 text-center text-sm text-red-400" role="alert">
            {saveError}
          </p>
        )}
      </main>
    </div>
  );
}
