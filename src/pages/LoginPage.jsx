import { Link } from "react-router-dom";

export default function LoginPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("로그인 기능은 준비 중입니다.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-md rounded-2xl border border-cyan-300/20 bg-[#1e293b] p-8 shadow-lg">
        {/* 제목 */}
        <h1 className="mb-2 text-center text-3xl font-bold text-white">
          로그인
        </h1>
        <p className="mb-8 text-center text-sm text-slate-400">
          서비스를 이용하려면 로그인해주세요
        </p>

        {/* 폼 */}
        <div className="space-y-4">
          {/* 이메일 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              이메일
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              비밀번호
            </label>
            <input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            onClick={handleSubmit}
            className="mt-2 w-full rounded-xl border-2 border-cyan-300 bg-transparent px-8 py-3 text-lg font-semibold text-cyan-300 transition-all duration-200 hover:bg-cyan-300 hover:text-gray-900"
          >
            로그인
          </button>
        </div>

        {/* 회원가입 링크 */}
        <p className="mt-6 text-center text-sm text-slate-400">
          아직 회원이 아니신가요?{" "}
          <Link to="/signup" className="text-cyan-300 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
