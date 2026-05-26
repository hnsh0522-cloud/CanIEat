import { Link, BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AnalyzePage from "./pages/AnalyzePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import AiChatPage from "./pages/AiChatPage";
import ResultPage from "./pages/ResultPage.jsx";

const navItems = [
  { label: "홈", path: "/" },
  { label: "분석하기", path: "/analyze" },
  { label: "소개", path: "/about" },
  { label: "문의", path: "/contact" },
  { label: "AI 질문", path: "/ai-chat" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="m-0 min-h-screen bg-[#0f172a] pt-[50px]">
        {/* 네비게이션 */}
        <nav className="fixed left-0 top-0 z-[1000] w-full bg-[#1e293b] border-b border-cyan-300/20">
          <div className="flex items-center justify-between px-6 py-0">
            {/* 왼쪽 - 로고 or 서비스명 */}
            <Link to="/" className="text-cyan-300 font-bold text-lg py-4">
              🌿 식품 안전 분석
            </Link>

            {/* 가운데 - 메뉴 */}
            <ul className="flex list-none m-0 p-0">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    className="block px-5 py-[15px] text-slate-200 no-underline transition-colors hover:bg-cyan-500/15 hover:text-white"
                    to={item.path}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* 오른쪽 - 로그인/회원가입 버튼 */}
            <div className="flex items-center gap-2">
              <Link to="/login">
                <button className="rounded-lg border border-cyan-300 px-4 py-2 text-sm font-semibold text-cyan-300 transition-all duration-200 hover:bg-cyan-300 hover:text-gray-900">
                  로그인
                </button>
              </Link>
              <Link to="/signup">
                <button className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-cyan-400">
                  회원가입
                </button>
              </Link>
            </div>
          </div>
        </nav>

        {/* 라우팅 */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/ai-chat" element={<AiChatPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
