import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/auth.js";
import { deleteAnalysisResults } from "../api/food.js";
import api from "../api/index.js";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import useAuthStore from "../store/useAuthStore.js";

const riskStyles = {
  SAFE: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    dot: "bg-emerald-500",
  },
  CAUTION: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    dot: "bg-amber-500",
  },
  UNSAFE: {
    badge: "border-red-500/30 bg-red-500/10 text-red-500",
    dot: "bg-red-500",
  },
};

const riskLabels = {
  SAFE: "안전",
  CAUTION: "주의 필요",
  UNSAFE: "섭취 불가",
};

function HistoryIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </svg>
  );
}

export default function AnalysisHistoryPage() {
  const { isDark } = useThemeStore();
  const { isLoggedIn } = useAuthStore();
  const accent = useAccentClasses();
  const [analysisRecords, setAnalysisRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingAnalysisId, setDeletingAnalysisId] = useState(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!isLoggedIn) {
      return () => {
        isActive = false;
      };
    }

    const loadAnalysisRecords = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await api.get("/analysis/load");
        const body = response.data;

        if (!body?.success || !Array.isArray(body.data)) {
          throw new Error(
            body?.message || "분석 기록 응답 형식이 올바르지 않습니다.",
          );
        }

        if (isActive) {
          setAnalysisRecords(body.data);
        }
      } catch (error) {
        console.error("Analysis history load error:", error);
        if (isActive) {
          setErrorMessage(
            error.response?.data?.message ||
              error.message ||
              "분석 기록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadAnalysisRecords();
    return () => {
      isActive = false;
    };
  }, [isLoggedIn]);

  const handleDeleteAnalysis = async (analysisId) => {
    if (
      isBulkDeleting ||
      deletingAnalysisId !== null ||
      !window.confirm("이 분석 기록을 삭제할까요? 삭제한 기록은 복구할 수 없습니다.")
    ) {
      return;
    }

    setDeletingAnalysisId(analysisId);
    setDeleteErrorMessage("");
    try {
      const result = await deleteAnalysisResults([analysisId]);
      if (
        !result?.success ||
        !result.deleted_analysis_ids?.includes(analysisId)
      ) {
        throw new Error(result?.message || "분석 기록을 삭제하지 못했습니다.");
      }
      setAnalysisRecords((records) =>
        records.filter((record) => record.analysis_id !== analysisId),
      );
      setSelectedAnalysisIds((selectedIds) =>
        selectedIds.filter((id) => id !== analysisId),
      );
    } catch (error) {
      console.error("Analysis history delete error:", error);
      setDeleteErrorMessage(getApiErrorMessage(error));
    } finally {
      setDeletingAnalysisId(null);
    }
  };

  const toggleAnalysisSelection = (analysisId) => {
    setSelectedAnalysisIds((selectedIds) =>
      selectedIds.includes(analysisId)
        ? selectedIds.filter((id) => id !== analysisId)
        : [...selectedIds, analysisId],
    );
  };

  const handleBulkDelete = async () => {
    if (
      selectedAnalysisIds.length === 0 ||
      isBulkDeleting ||
      deletingAnalysisId !== null ||
      !window.confirm(
        `선택한 ${selectedAnalysisIds.length}개의 분석 기록을 삭제할까요? 삭제한 기록은 복구할 수 없습니다.`,
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    setDeleteErrorMessage("");
    try {
      const result = await deleteAnalysisResults(selectedAnalysisIds);
      const deletedIds = result?.deleted_analysis_ids;
      if (!Array.isArray(deletedIds) || deletedIds.length === 0) {
        throw new Error(result?.message || "분석 기록을 삭제하지 못했습니다.");
      }

      setAnalysisRecords((records) =>
        records.filter((record) => !deletedIds.includes(record.analysis_id)),
      );
      setSelectedAnalysisIds([]);
      setIsSelectionMode(false);

      if (!result.success || deletedIds.length !== selectedAnalysisIds.length) {
        setDeleteErrorMessage(
          result.message || "일부 분석 기록을 삭제하지 못했습니다.",
        );
      }
    } catch (error) {
      console.error("Bulk analysis history delete error:", error);
      setDeleteErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const pageTextClass = isDark ? "text-slate-100" : "text-[#1e293b]";
  const headingTextClass = isDark ? "text-white" : "text-[#1e293b]";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const cardBgClass = isDark ? "bg-[#1e293b]" : "bg-white";
  const borderClass = isDark ? "border-slate-700" : "border-slate-200";
  const tagClass = isDark
    ? "border-slate-600 bg-slate-800 text-slate-300"
    : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div
      className={`m-0 box-border min-h-screen pt-14 md:pt-[50px] ${pageBgClass} ${pageTextClass}`}
    >
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 md:px-6 md:pt-12">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent.bgAccent10} ${accent.textAccent}`}
            >
              <HistoryIcon />
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight md:text-3xl ${headingTextClass}`}>
                분석 기록
              </h1>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                이전에 확인한 식품의 분석 결과를 모아볼 수 있어요.
              </p>
            </div>
          </div>
        </header>

        <section aria-label="분석 기록 목록">
          {!isLoggedIn ? (
            <p className={`py-8 text-center text-sm ${mutedTextClass}`}>
              분석 기록을 저장하기 위해서는 로그인이 필요합니다.{" "}
              <Link
                to="/login"
                className={`font-semibold underline underline-offset-4 ${accent.textAccent}`}
              >
                로그인
              </Link>
            </p>
          ) : (
          <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-base font-semibold ${headingTextClass}`}>
              최근 기록
            </h2>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${mutedTextClass}`}>
                총 {analysisRecords.length}건
              </span>
              {analysisRecords.length > 0 && (
                isSelectionMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={
                        selectedAnalysisIds.length === 0 ||
                        isBulkDeleting ||
                        deletingAnalysisId !== null
                      }
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBulkDeleting
                        ? "삭제 중..."
                        : `선택 삭제 (${selectedAnalysisIds.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedAnalysisIds([]);
                      }}
                      disabled={isBulkDeleting}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                          : "border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSelectionMode(true)}
                    disabled={deletingAnalysisId !== null}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                  >
                    일괄 삭제
                  </button>
                )
              )}
            </div>
          </div>

          {deleteErrorMessage && (
            <p className="mb-3 text-sm text-red-500" role="alert">
              {deleteErrorMessage}
            </p>
          )}

          {isLoading ? (
            <p className={`py-8 text-center text-sm ${mutedTextClass}`}>
              분석 기록을 불러오는 중입니다...
            </p>
          ) : errorMessage ? (
            <p className="py-8 text-center text-sm text-red-500">
              {errorMessage}
            </p>
          ) : analysisRecords.length === 0 ? (
            <p className={`py-8 text-center text-sm ${mutedTextClass}`}>
              아직 분석 기록이 없습니다.
            </p>
          ) : (
          <div className="space-y-3">
            {analysisRecords.map((record) => {
              const riskStyle = riskStyles[record.risk_level] ?? {
                badge: "border-slate-400/30 bg-slate-400/10 text-slate-500",
                dot: "bg-slate-400",
              };
              const createdAt = new Date(record.created_at);

              return (
                <article
                  key={record.analysis_id}
                  className={`rounded-2xl border ${borderClass} ${cardBgClass} p-5 shadow-sm transition-shadow hover:shadow-md md:p-6`}
                >
                  <div className="flex gap-3">
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedAnalysisIds.includes(record.analysis_id)}
                      onChange={() => toggleAnalysisSelection(record.analysis_id)}
                      disabled={isBulkDeleting || deletingAnalysisId !== null}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-teal-600 disabled:cursor-not-allowed"
                      aria-label={`${record.product_name} 분석 기록 선택`}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className={`text-lg font-bold ${headingTextClass}`}>
                          {record.product_name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${riskStyle.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${riskStyle.dot}`}
                            aria-hidden="true"
                          />
                          {riskLabels[record.risk_level] ?? record.risk_level}
                        </span>
                      </div>
                      <p className={`text-sm ${mutedTextClass}`}>
                        {record.result_message}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <time
                        className={`text-sm ${mutedTextClass}`}
                        dateTime={record.created_at}
                      >
                        {createdAt.toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnalysis(record.analysis_id)}
                        disabled={
                          deletingAnalysisId !== null || isBulkDeleting
                        }
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`${record.product_name} 분석 기록 삭제`}
                      >
                        {deletingAnalysisId === record.analysis_id
                          ? "삭제 중..."
                          : "삭제"}
                      </button>
                    </div>
                  </div>

                  <div className={`mt-5 border-t ${borderClass} pt-4`}>
                    <p className={`mb-2 text-xs font-semibold ${mutedTextClass}`}>
                      알레르기 성분 / 감지된 식품 성분 / 알레르기 성분 일치 여부
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(record.detected_allergens ?? []).map((detectedAllergen) => {
                        const isMatched = detectedAllergen.risk_type === "MATCH";
                        return (
                          <span
                            key={detectedAllergen.allergy_id}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                              isMatched
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                                : tagClass
                            }`}
                          >
                            {detectedAllergen.allergy_name} /{" "}
                            {detectedAllergen.detected_ingredient ?? "감지되지 않음"} /{" "}
                            {detectedAllergen.risk_type}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  </div>
                  </div>
                </article>
              );
            })}
          </div>
          )}
          </>
          )}
        </section>
      </main>
    </div>
  );
}
