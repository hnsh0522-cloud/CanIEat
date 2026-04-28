import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="m-0 box-border min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-[50px] text-slate-100">
      <ul className="m-0 flex list-none justify-center p-0">
        <li>
          <Link
            className="block border-b-2 border-cyan-400 bg-cyan-500/10 px-5 py-[15px] font-medium text-cyan-100 no-underline"
            to="/"
            aria-current="page"
          >
            홈
          </Link>
        </li>
        <li>
          <Link
            className="block px-5 py-[15px] text-slate-200 no-underline transition-colors hover:bg-cyan-500/15 hover:text-white"
            to="/analyze"
          >
            분석하기
          </Link>
        </li>
        <li>
          <a
            className="block px-5 py-[15px] text-slate-200 no-underline transition-colors hover:bg-cyan-500/15 hover:text-white"
            href="/about"
          >
            소개
          </a>
        </li>
        <li>
          <a
            className="block px-5 py-[15px] text-slate-200 no-underline transition-colors hover:bg-cyan-500/15 hover:text-white"
            href="/contact"
          >
            문의
          </a>
        </li>
      </ul>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-normal leading-relaxed text-white md:text-4xl">
            당신의 음식은 안전한가요? <br />
            <span className="text-cyan-300">안전 분석을 해보세요</span>
          </h1>

          {/* 버튼 추가 */}
          <Link to="/analyze">
            <button
              className="
    mt-6 
    rounded-xl 
    border-2 border-cyan-300
    bg-transparent 
    px-8 py-3 
    text-lg font-semibold text-cyan-300 
    hover:bg-cyan-300 hover:text-gray-900
    transition-all duration-200
  "
            >
              분석하기
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
