
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";

// 자주 묻는 질문
const faqItems = [
  {
    question: "AI 분석 결과만 보고 먹어도 되나요?",
    answer:
      "AI 분석은 참고용입니다. 실제 제품의 원재료명과 알레르기 표시를 반드시 확인하고, 불확실한 경우 섭취하지 마세요.",
  },
  {
    question: "분석 결과와 포장지의 정보가 다르면요?",
    answer:
      "제품의 최신 포장지에 적힌 원재료명과 알레르기 표시를 우선 확인해 주세요. 제품 정보는 변경될 수 있습니다.",
  },
  {
    question: "성분 정보가 누락될 수도 있나요?",
    answer:
      "네. 입력하거나 조회된 정보가 불완전하면 분석에도 누락이 생길 수 있습니다. 표시되지 않은 성분이 없다고 단정할 수는 없습니다.",
  },
];

export default function AboutDetails() {
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();

  const previewRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // 스크롤 등장 애니메이션
  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;

    if (
      !window.IntersectionObserver ||
      window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const card = isDark
    ? "border-white/10 bg-[#1e293b]"
    : "border-slate-200 bg-white";

  const muted = isDark
    ? "text-slate-300"
    : "text-slate-600";

  const soft = isDark
    ? "bg-[#0f172a]"
    : "bg-slate-50";

  return (
    <div className="mt-20 space-y-20">

      {/* ========================= */}
      {/* 분석 결과 미리보기 */}
      {/* ========================= */}

      <section
        ref={previewRef}
        className={`
          grid items-center gap-10
          md:grid-cols-2
          transition-all duration-700 ease-out
          motion-reduce:transition-none
          ${
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }
        `}
      >

        {/* 왼쪽 설명 */}
        <div>
          <p
            className={`
              text-xs font-bold tracking-[0.2em]
              ${accent.textAccent}
            `}
          >
            ANALYSIS PREVIEW
          </p>

          <h2 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
            분석 결과는
            <br />
            이렇게 확인해요
          </h2>

          <p className={`mt-5 text-base leading-8 ${muted}`}>
            식품 분석 결과에서 주의 등급과
            관련 성분을 구분해 확인할 수 있어요.
          </p>

          {/* 핵심 안내 */}
          <div className="mt-8 space-y-5">

            <div className="flex items-start gap-4">
              <span
                className={`
                  flex h-10 w-10 shrink-0
                  items-center justify-center rounded-xl
                  font-bold
                  ${accent.bgAccent10}
                  ${accent.textAccent}
                `}
              >
                01
              </span>

              <div>
                <h3 className="font-semibold">
                  주의 등급 확인
                </h3>
                <p className={`mt-1 text-sm ${muted}`}>
                  분석 결과의 상태를 먼저 살펴봐요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span
                className={`
                  flex h-10 w-10 shrink-0
                  items-center justify-center rounded-xl
                  font-bold
                  ${accent.bgAccent10}
                  ${accent.textAccent}
                `}
              >
                02
              </span>

              <div>
                <h3 className="font-semibold">
                  관련 성분 확인
                </h3>
                <p className={`mt-1 text-sm ${muted}`}>
                  어떤 성분을 주의해야 하는지 확인해요.
                </p>
              </div>
            </div>

          </div>

          <Link
            to="/analyze"
            className={`
              mt-8 inline-flex items-center gap-3
              rounded-xl px-6 py-3
              text-sm font-bold
              transition-all duration-300
              hover:-translate-y-1
              motion-reduce:transform-none
              ${
                isDark
                  ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                  : "bg-teal-700 text-white hover:bg-teal-800"
              }
            `}
          >
            직접 분석해 보기
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* 오른쪽 가상 분석 화면 */}
        <div
          className={`
            rounded-3xl border p-6
            shadow-xl shadow-black/10
            transition-shadow duration-300
            hover:shadow-2xl
            ${card}
          `}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">
              식품 분석 결과
            </h3>

            <span
              className={`
                rounded-full px-3 py-1
                text-xs font-semibold
                ${accent.bgAccent10}
                ${accent.textAccent}
              `}
            >
              가상 예시
            </span>
          </div>

          {/* 제품 정보 */}
          <div className={`mt-6 rounded-xl p-4 ${soft}`}>
            <p className={`text-xs ${muted}`}>
              예시 제품
            </p>

            <p className="mt-2 font-bold">
              우유가 포함된 과자
            </p>

            <p className={`mt-2 text-xs ${muted}`}>
              우유 알레르기를 선택한 경우의 예시
            </p>
          </div>

          {/* 주의 메시지 */}
          <div
            className={`
              mt-4 rounded-xl border p-5
              ${
                isDark
                  ? "border-amber-400/30 bg-amber-400/10"
                  : "border-amber-200 bg-amber-50"
              }
            `}
          >
            <p
              className={`
                text-sm font-bold
                ${
                  isDark
                    ? "text-amber-200"
                    : "text-amber-800"
                }
              `}
            >
              ● 주의 성분 발견
            </p>

            <p
              className={`
                mt-2 text-sm leading-6
                ${
                  isDark
                    ? "text-amber-100"
                    : "text-amber-900"
                }
              `}
            >
              우유 알레르기가 있다면
              성분 표시를 확인하세요.
            </p>
          </div>

          {/* 예시 성분 */}
          <div className="mt-5">
            <p className={`mb-3 text-sm ${muted}`}>
              예시 원재료:
            </p>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-lg px-4 py-2 text-sm ${soft}`}
              >
                밀가루
              </span>

              <span
                className={`
                  rounded-lg px-4 py-2
                  text-sm font-semibold
                  ${
                    isDark
                      ? "bg-amber-400/15 text-amber-200"
                      : "bg-amber-100 text-amber-800"
                  }
                `}
              >
                우유
              </span>
            </div>
          </div>

          <p className={`mt-6 text-xs leading-5 ${muted}`}>
            * 실제 분석 결과가 아닌 UI 설명용 예시입니다.
          </p>
        </div>
      </section>

      {/* ========================= */}
      {/* FAQ */}
      {/* ========================= */}

      <section className="pb-8">

        <div className="text-center">
          <p
            className={`
              text-xs font-bold tracking-[0.2em]
              ${accent.textAccent}
            `}
          >
            FAQ
          </p>

          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
            자주 묻는 질문
          </h2>

          <p className={`mt-3 text-sm ${muted}`}>
            서비스를 이용하기 전 알아두면 좋은 내용이에요.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">

          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;

            return (
              <div
                key={item.question}
                className={`
                  overflow-hidden rounded-2xl border
                  ${card}
                `}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() =>
                    setOpenFaq(isOpen ? null : index)
                  }
                  className="
                    flex w-full items-center
                    justify-between gap-4
                    px-5 py-5 text-left
                    font-semibold
                    transition-colors duration-200
                    hover:bg-slate-500/5
                  "
                >
                  <span>{item.question}</span>

                  <span
                    aria-hidden="true"
                    className={`
                      shrink-0 text-xl
                      transition-transform duration-300
                      ${isOpen ? "rotate-45" : ""}
                    `}
                  >
                    +
                  </span>
                </button>

                <div
                  id={`faq-answer-${index}`}
                  hidden={!isOpen}
                  className={`
                    border-t px-5 pb-5 pt-4
                    text-sm leading-7
                    ${
                      isDark
                        ? "border-white/10"
                        : "border-slate-100"
                    }
                    ${muted}
                  `}
                >
                  {item.answer}
                </div>
              </div>
            );
          })}

        </div>
      </section>

    </div>
  );
}
