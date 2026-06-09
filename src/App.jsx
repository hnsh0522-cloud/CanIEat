import { useState } from "react";
import {
  Link,
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AnalyzePage from "./pages/AnalyzePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import AiChatPage from "./pages/AiChatPage";
import ResultPage from "./pages/ResultPage.jsx";
import useThemeStore from "./store/useThemeStore.js";
import useAuthStore from "./store/useAuthStore";
import MyPage from "./pages/MyPage";

console.log(import.meta.env.VITE_API_BASE_URL);

const navItems = [
  { label: "홈", path: "/" },
  { label: "분석하기", path: "/analyze" },
  { label: "소개", path: "/about" },
  { label: "문의", path: "/contact" },
  { label: "AI 질문", path: "/ai-chat" },
];

function SunIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MenuIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isLoggedIn, logout } = useAuthStore();
  const { isDark, toggleDark } = useThemeStore();

  const appBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const navBgClass = isDark ? "bg-[#1e293b]" : "bg-[#ffffff]";
  const navTextClass = isDark ? "text-slate-200" : "text-[#1e293b]";
  const navHoverTextClass = isDark
    ? "hover:text-white"
    : "hover:text-[#0f172a]";

  const loginBtnClass = isDark
    ? "rounded-lg border border-cyan-400 px-4 py-2 text-sm font-semibold text-cyan-400 transition-all duration-200 hover:bg-cyan-400 hover:text-gray-900"
    : "rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 transition-all duration-200 hover:bg-teal-700 hover:text-white";

  const signupBtnClass = isDark
    ? "rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-cyan-500"
    : "rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-teal-800";

  const toggleBtnClass = isDark
    ? "rounded-lg px-3 py-2 text-cyan-400 transition-all duration-200 hover:bg-cyan-400/10"
    : "rounded-lg px-3 py-2 text-teal-700 transition-all duration-200 hover:bg-teal-700/10";

  const mobileLinkClass = `block rounded-lg px-4 py-3 text-base ${navTextClass} no-underline transition-colors hover:bg-cyan-500/15 ${navHoverTextClass}`;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate("/");
  };

  return (
    <div className={`m-0 min-h-screen pt-14 md:pt-[50px] ${appBgClass}`}>
      <nav
        className={`fixed left-0 top-0 z-[1000] w-full ${navBgClass} border-b border-teal-700/20`}
      >
        <div className="flex items-center justify-between px-4 py-0 md:px-6">
          <Link
            to="/"
            className="text-teal-700 font-bold text-base py-3 md:text-lg md:py-4"
            onClick={closeMobileMenu}
          >
            식품 안전 분석
          </Link>

          <ul className="hidden list-none m-0 p-0 md:flex">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  className={`block px-5 py-[15px] ${navTextClass} no-underline transition-colors hover:bg-cyan-500/15 ${navHoverTextClass}`}
                  to={item.path}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={toggleDark}
              className={toggleBtnClass}
              aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
              title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {isDark ? <MoonIcon /> : <SunIcon />}
            </button>

            <div className="hidden items-center gap-2 md:flex">
              {isLoggedIn ? (
                <>
                  <Link to="/mypage">
                    <button type="button" className={loginBtnClass}>
                      마이페이지
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg bg-red-400 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-500"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <button type="button" className={loginBtnClass}>
                      로그인
                    </button>
                  </Link>
                  <Link to="/signup">
                    <button type="button" className={signupBtnClass}>
                      회원가입
                    </button>
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className={`rounded-lg p-2 md:hidden ${navTextClass} ${toggleBtnClass}`}
              aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            className={`border-t border-teal-700/20 px-4 py-3 md:hidden ${navBgClass}`}
          >
            <ul className="m-0 list-none space-y-1 p-0">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`${mobileLinkClass} ${
                      location.pathname === item.path
                        ? "bg-cyan-500/15 font-semibold"
                        : ""
                    }`}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-col gap-2 border-t border-teal-700/20 pt-3">
              {isLoggedIn ? (
                <>
                  <Link to="/mypage" onClick={closeMobileMenu}>
                    <button type="button" className={`w-full ${loginBtnClass}`}>
                      마이페이지
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg bg-red-400 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-500"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMobileMenu}>
                    <button type="button" className={`w-full ${loginBtnClass}`}>
                      로그인
                    </button>
                  </Link>
                  <Link to="/signup" onClick={closeMobileMenu}>
                    <button
                      type="button"
                      className={`w-full ${signupBtnClass}`}
                    >
                      회원가입
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/ai-chat" element={<AiChatPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
