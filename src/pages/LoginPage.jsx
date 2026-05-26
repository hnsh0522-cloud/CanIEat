import { Link } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";

export default function LoginPage() {
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();

  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const cardBgClass = isDark ? "bg-[#1e293b]" : "bg-[#ffffff]";
  const headingTextClass = isDark ? "text-white" : "text-[#1e293b]";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const labelTextClass = isDark ? "text-slate-300" : "text-slate-700";
  const inputClassName = isDark
    ? "w-full rounded-lg border border-slate-600 bg-[#0f172a] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
    : `w-full rounded-lg border border-slate-300 bg-[#ffffff] px-4 py-3 text-[#1e293b] placeholder-slate-500 ${accent.focusBorderAccent} focus:outline-none`;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("로그인 기능은 준비 중입니다.");
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center ${pageBgClass}`}
    >
      <div
        className={`w-full max-w-md rounded-2xl border ${accent.borderAccent20} ${cardBgClass} p-8 shadow-lg`}
      >
        <h1
          className={`mb-2 text-center text-3xl font-bold ${headingTextClass}`}
        >
          로그인
        </h1>
        <p className={`mb-8 text-center text-sm ${mutedTextClass}`}>
          서비스를 이용하려면 로그인해주세요
        </p>

        <div className="space-y-4">
          <div>
            <label
              className={`mb-1 block text-sm font-medium ${labelTextClass}`}
            >
              이메일
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className={inputClassName}
            />
          </div>

          <div>
            <label
              className={`mb-1 block text-sm font-medium ${labelTextClass}`}
            >
              비밀번호
            </label>
            <input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              className={inputClassName}
            />
          </div>

          <button
            onClick={handleSubmit}
            className={`mt-2 w-full rounded-xl px-8 py-3 text-lg font-semibold transition-all duration-200 ${accent.btnOutline}`}
          >
            로그인
          </button>
        </div>

        <p className={`mt-6 text-center text-sm ${mutedTextClass}`}>
          아직 회원이 아니신가요?{" "}
          <Link to="/signup" className={`${accent.textAccent} hover:underline`}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
