import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import AboutDetails from "../components/AboutDetails.jsx";
import "./AboutPagePolish.css";

export default function AboutPage() {
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();
  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const pageTextClass = isDark ? "text-white" : "text-[#1e293b]";
  const cardBgClass = isDark ? "bg-[#1e293b]" : "bg-[#ffffff]";

  return (
    <div
      className={`about-polish ${isDark ? "is-dark" : ""} m-0 box-border min-h-screen pt-[50px] ${pageBgClass} ${pageTextClass}`}
    >
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <section className="text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            식품 성분 AI 분석 서비스
          </h1>
          <p className={`mt-3 text-base md:text-lg ${accent.textAccent}`}>
            개인의 알레르기 정보를 바탕으로 식품 성분을 분석하고 주의할 성분을 안내합니다.
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <article
            className={`rounded-xl ${accent.border2Accent} ${cardBgClass} p-5`}
          >
            <h2 className={`text-lg font-semibold ${accent.textAccent}`}>
              알레르기 분석
            </h2>
            <p className="mt-2 text-sm">
              식품 성분에서 알레르기 유발 물질 탐지
            </p>
          </article>
          <article
            className={`rounded-xl ${accent.border2Accent} ${cardBgClass} p-5`}
          >
            <h2 className={`text-lg font-semibold ${accent.textAccent}`}>
              성분 해석
            </h2>
            <p className="mt-2 text-sm">
              전문 용어를 일반인도 이해할 수 있게 설명
            </p>
          </article>
          <article
            className={`rounded-xl ${accent.border2Accent} ${cardBgClass} p-5`}
          >
            <h2 className={`text-lg font-semibold ${accent.textAccent}`}>
              개인화 알림
            </h2>
            <p className="mt-2 text-sm">내 알레르기 기반으로 안전 여부 판단</p>
          </article>
        </section>

        <section
          className={`mt-10 rounded-xl ${accent.border2Accent} ${cardBgClass} p-6`}
        >
          <h2 className={`text-xl font-semibold ${accent.textAccent}`}>
            사용 방법 (3단계)
          </h2>
          <ol className="mt-4 space-y-3">
            <li
              className={`rounded-lg bg-transparent px-4 py-3 ${accent.border2Accent}`}
            >
              1단계: 식품명을 입력
            </li>
            <li
              className={`rounded-lg bg-transparent px-4 py-3 ${accent.border2Accent}`}
            >
              2단계: 사용자 알레르기 정보 입력 
              (회원 가입시 알레르기 정보 자동 입력)
            </li>
            <li
              className={`rounded-lg bg-transparent px-4 py-3 ${accent.border2Accent}`}
            >
              3단계: AI 분석 결과 확인
            </li>
          </ol>
        </section>

         {/* 새로 추가한 분석 미리보기와 FAQ */}
        <AboutDetails />
        
      </main>
    </div>
  );
}
