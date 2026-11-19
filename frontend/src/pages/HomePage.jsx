
import { Link } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import FoodScrollSection from "../components/FoodScrollSection.jsx";

export default function HomePage() {
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();

  const pageBgClass = isDark
    ? "bg-[#0f172a]"
    : "bg-[#f8fafc]";

  const pageTextClass = isDark
    ? "text-slate-100"
    : "text-[#1e293b]";

  const headingTextClass = isDark
    ? "text-white"
    : "text-[#1e293b]";

  return (
    <div
      className={`m-0 box-border min-h-screen pt-[50px] ${pageBgClass} ${pageTextClass}`}
    >
      <ul className="m-0 flex list-none justify-center p-0"></ul>

      <main
        className="
          relative mx-auto flex min-h-[80vh]
          max-w-5xl items-center justify-center
          overflow-hidden px-5 pb-24 pt-14
          text-center sm:px-8
        "
      >
        {/* 은은한 배경 장식 */}
        <div
          aria-hidden="true"
          className={`
            pointer-events-none absolute
            -left-20 top-12 h-64 w-64
            rounded-full blur-3xl
            ${
              isDark
                ? "bg-cyan-400/10"
                : "bg-teal-200/35"
            }
          `}
        />

        <div
          aria-hidden="true"
          className={`
            pointer-events-none absolute
            -right-20 bottom-10 h-72 w-72
            rounded-full blur-3xl
            ${
              isDark
                ? "bg-blue-400/10"
                : "bg-sky-200/30"
            }
          `}
        />

        <div className="relative z-10 w-full">

          {/* 상단 안내 배지 */}
          <span
            className={`
              inline-flex items-center gap-2
              rounded-full border px-4 py-2
              text-xs font-bold tracking-[0.12em]
              sm:text-sm
              ${
                isDark
                  ? "border-cyan-300/20 bg-cyan-300/5"
                  : "border-teal-600/15 bg-teal-600/5"
              }
              ${accent.textAccent}
            `}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${accent.bgAccent}`}
            />

            AI 기반 식품 알레르기 분석
          </span>

          {/* 기존 제목 유지 */}
          <h1
            className={`
              mt-8
              text-3xl sm:text-4xl lg:text-[42px]
              font-extrabold leading-[1.23]
              tracking-[-0.045em]
              ${headingTextClass}
            `}
          >
            당신의 음식은 안전한가요?

            <br />

            <span
              className={`
                bg-gradient-to-r bg-clip-text
                text-transparent
                ${
                  isDark
                    ? "from-cyan-300 via-teal-200 to-sky-300"
                    : "from-teal-700 via-emerald-600 to-cyan-600"
                }
              `}
            >
              안전 분석을 해보세요
            </span>
          </h1>

          {/* 간단한 서비스 설명 */}
          <p
            className={`
              mx-auto mt-7 max-w-xl
              text-base leading-8 sm:text-lg
              ${
                isDark
                  ? "text-slate-300"
                  : "text-slate-600"
              }
            `}
          >
            식품 성분과 알레르기 정보를 비교해
            <br className="hidden sm:block" />
            {" "}주의할 성분을 쉽고 빠르게 확인하세요.
          </p>

          {/* 분석하기 버튼 */}
          <Link
            to="/analyze"
            className={`
              group mt-10 inline-flex
              items-center justify-center gap-4
              rounded-2xl px-9 py-4
              text-base font-bold text-white
              shadow-xl transition-all duration-300
              hover:-translate-y-1 hover:shadow-2xl
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-4
              focus-visible:outline-teal-500
              motion-reduce:transform-none
              sm:text-lg
              ${
                isDark
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 shadow-cyan-900/25 hover:from-cyan-400 hover:to-teal-400"
                  : "bg-gradient-to-r from-teal-700 to-emerald-600 shadow-teal-700/25 hover:from-teal-800 hover:to-emerald-700"
              }
            `}
          >
            식품 분석하기

            <span
              aria-hidden="true"
              className="
                text-xl transition-transform
                duration-300
                group-hover:translate-x-1
                motion-reduce:transform-none
              "
            >
              →
            </span>
          </Link>

          {/* 스크롤 유도 */}
          <p
            className={`
              mt-8 text-sm
              ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }
            `}
          >
            스크롤해서 식품 성분 확인 방법을 살펴보세요 ↓
          </p>

        </div>
      </main>

      {/* 기존에 추가했던 음식 스크롤 섹션 유지 */}
      <FoodScrollSection />

    </div>
  );
}
