import { Link } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";

export default function HomePage() {
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();
  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const pageTextClass = isDark ? "text-slate-100" : "text-[#1e293b]";
  const headingTextClass = isDark ? "text-white" : "text-[#1e293b]";

  return (
    <div
      className={`m-0 box-border min-h-screen pt-[50px] ${pageBgClass} ${pageTextClass}`}
    >
      <ul className="m-0 flex list-none justify-center p-0"></ul>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        <div className="mb-8 text-center">
          <h1
            className={`text-2xl font-bold tracking-normal leading-relaxed ${headingTextClass} md:text-4xl`}
          >
            당신의 음식은 안전한가요? <br />
            <span className={accent.textAccent}>안전 분석을 해보세요</span>
          </h1>

          <Link to="/analyze">
            <button
              className={`mt-6 rounded-xl bg-transparent px-8 py-3 text-lg font-semibold transition-all duration-200 ${accent.btnOutline}`}
            >
              분석하기
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
