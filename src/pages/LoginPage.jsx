import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useThemeStore from "../store/useThemeStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDark } = useThemeStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    const name = email.split("@")[0];
    login(name, email);
    navigate("/");
  };

  return (
    <div
      // 2. 테마 변경 시 부드럽게 색상이 바뀌도록 transition-colors duration-200 추가
      className={`flex min-h-screen items-center justify-center transition-colors duration-200 ${isDark ? "bg-[#0f172a]" : "bg-gray-50"}`}
    >
      <div
        className={`w-full max-w-md rounded-2xl border p-8 shadow-lg transition-colors duration-200 ${isDark ? "bg-[#1e293b] border-teal-300/20" : "bg-white border-teal-200"}`}
      >
        <h1
          className={`mb-2 text-center text-3xl font-bold transition-colors duration-200 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          로그인
        </h1>
        <p className="mb-8 text-center text-sm text-slate-400">
          services를 이용하려면 로그인해주세요
        </p>

        <div className="space-y-4">
          <div>
            <label
              className={`mb-1 block text-sm font-medium transition-colors duration-200 ${isDark ? "text-slate-300" : "text-gray-700"}`}
            >
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className={`w-full rounded-lg border px-4 py-3 focus:outline-none transition-colors duration-200 ${isDark ? "border-slate-600 bg-[#0f172a] text-white placeholder-slate-500 focus:border-teal-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-teal-600"}`}
            />
          </div>

          <div>
            <label
              className={`mb-1 block text-sm font-medium transition-colors duration-200 ${isDark ? "text-slate-300" : "text-gray-700"}`}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              className={`w-full rounded-lg border px-4 py-3 focus:outline-none transition-colors duration-200 ${isDark ? "border-slate-600 bg-[#0f172a] text-white placeholder-slate-500 focus:border-teal-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-teal-600"}`}
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            className={`mt-2 w-full rounded-xl border-2 px-8 py-3 text-lg font-semibold transition-all duration-200 ${isDark ? "border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-gray-900" : "border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white"}`}
          >
            로그인
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          아직 회원이 아니신가요?{" "}
          <Link
            to="/signup"
            className={`hover:underline transition-colors duration-200 ${isDark ? "text-teal-400" : "text-teal-700"}`}
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
