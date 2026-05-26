import {
  Link,
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
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

// 네비게이션과 라우터를 정상 구동하기 위해 내부에서 useNavigate를 쓸 수 있도록 분리해 줍니다.
function AppContent() {
  const navigate = useNavigate();

  // 모든 Hook은 컴포넌트 안쪽 최상단에 위치해야 합니다!
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

  return (
    <div className={`m-0 min-h-screen pt-[50px] ${appBgClass}`}>
      {/* 네비게이션 */}
      <nav
        className={`fixed left-0 top-0 z-[1000] w-full ${navBgClass} border-b border-teal-700/20`}
      >
        <div className="flex items-center justify-between px-6 py-0">
          {/* 왼쪽 - 로고 */}
          <Link to="/" className="text-teal-700 font-bold text-lg py-4">
            식품 안전 분석
          </Link>

          {/* 가운데 - 메뉴 */}
          <ul className="flex list-none m-0 p-0">
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

          {/* 오른쪽 - 토글 / 로그인 처리 분기 조절 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDark}
              className={toggleBtnClass}
              aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
              title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {isDark ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* 바깥에 떠돌던 삼항 연산자 UI 로직이 여기에 알맞게 정착했습니다 */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link to="/mypage">
                  <button type="button" className={loginBtnClass}>
                    마이페이지
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="rounded-lg bg-red-400 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-500"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
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
              </div>
            )}
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
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </div>
  );
}

// BrowserRouter 내부에서 useNavigate가 작동해야 하므로 App 컴포넌트가 감싸줍니다.
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
