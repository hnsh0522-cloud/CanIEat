import { useState } from "react";
import { Link } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";

const recentConversations = [
  "카제인 성분에 대해 질문",
  "밀 알레르기 관련 문의",
  "땅콩 성분 확인",
  "아황산류 식품 목록",
  "유제품 알레르기 성분",
];

function PanelToggleIcon({ className = "h-5 w-5" }) {
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

function SidebarCloseIcon({ className = "h-5 w-5" }) {
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
      <rect x="3" y="3" width="18" height="18" rx="1" />
    </svg>
  );
}

function PlusIcon({ className = "h-5 w-5" }) {
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon({ className = "h-5 w-5" }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

function ChatListIcon({ className = "h-5 w-5" }) {
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
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MoreVerticalIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5" }) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" />
    </svg>
  );
}

async function askGemini(question) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `당신은 식품 성분 및 알레르기 전문 AI 어시스턴트입니다.

규칙:
1. 반드시 한국어로만 답변
2. 마크다운 문법 사용 금지 (**, ##, -, * 등 사용 금지)
3. 일반 텍스트로만 작성
4. 문단 구분은 줄바꿈으로만 표현
5. 일반인이 이해하기 쉬운 언어로 설명
6. 답변은 간결하게 핵심만 전달
7. 유저가 식품이나 알레르기가 아닌 정보를 물어볼 경우에는 '저는 식품 관련 AI입니다. 최근에 음식을 먹다가 문제가 생겼나요?.' 라고 답변해주세요.

사용자 질문: ${question}`,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error("API_ERROR");
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("EMPTY_RESPONSE");
  }

  return text;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(0);
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();

  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const pageTextClass = isDark ? "text-slate-100" : "text-[#1e293b]";
  const headingTextClass = isDark ? "text-white" : "text-[#1e293b]";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const cardBgClass = isDark ? "bg-[#1e293b]" : "bg-[#ffffff]";

  const sidebarBgClass = isDark ? "bg-[#1a1a1a]" : "bg-[#f5f5f5]";
  const sidebarTextClass = isDark ? "text-white" : "text-gray-900";
  const sidebarMutedClass = isDark ? "text-slate-400" : "text-gray-500";
  const sidebarHoverClass = isDark
    ? "hover:bg-white/10"
    : "hover:bg-teal-600/10";
  const sidebarIconClass = isDark ? "text-teal-400" : "text-teal-700";
  const sidebarDividerClass = isDark ? "border-white/10" : "border-gray-300";
  const activeRecentClass = isDark
    ? "bg-teal-400/15 text-teal-400"
    : "bg-teal-600/10 text-teal-700";

  const assistantBubbleClass = isDark
    ? "border border-cyan-300/20 bg-[#1e293b] text-slate-200"
    : `border ${accent.borderAccent20} bg-[#ffffff] text-[#1e293b]`;
  const textareaClassName = isDark
    ? "flex-1 resize-none rounded-xl border border-slate-600 bg-[#1e293b] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
    : `flex-1 resize-none rounded-xl border border-slate-300 bg-[#ffffff] px-4 py-3 text-sm text-[#1e293b] placeholder-slate-500 ${accent.focusBorderAccent} focus:outline-none`;
  const sidebarToggleBtnClass = isDark
    ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-teal-400 transition-colors hover:bg-teal-400/10"
    : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-teal-700 transition-colors hover:bg-teal-100/10";

  const menuItemClass = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${sidebarTextClass} ${sidebarHoverClass}`;

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const aiMessage = await askGemini(question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiMessage },
      ]);
    } catch (error) {
      const errorMessage =
        error.message === "API_KEY_MISSING"
          ? "API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 추가해주세요."
          : "AI 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setActiveConversationId(null);
  };

  return (
    <div
      className={`m-0 box-border flex min-h-[calc(100dvh-3.5rem)] flex-col md:min-h-[calc(100vh-50px)] md:pt-[50px] pt-14 ${pageBgClass} ${pageTextClass}`}
    >
      <div className="relative flex min-h-0 flex-1">
        {isSidebarOpen && (
          <button
            type="button"
            className="absolute inset-0 z-10 bg-black/40 md:hidden"
            aria-label="사이드바 닫기"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={`absolute z-20 h-full shrink-0 overflow-hidden transition-all duration-300 md:relative md:z-auto ${
            isSidebarOpen ? "w-[260px]" : "w-0"
          }`}
        >
          <aside
            className={`flex h-full w-[260px] flex-col border-r ${accent.borderAccent20} ${sidebarBgClass} ${sidebarTextClass}`}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm font-bold">식품 안전 분석</span>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${sidebarIconClass} ${sidebarHoverClass}`}
                aria-label="사이드바 닫기"
              >
                <SidebarCloseIcon />
              </button>
            </div>

            <div className="space-y-0.5 px-2 pb-2">
              <button
                type="button"
                onClick={handleNewConversation}
                className={menuItemClass}
              >
                <span className={sidebarIconClass}>
                  <PlusIcon />
                </span>
                새 대화
              </button>
              <button type="button" className={menuItemClass}>
                <span className={sidebarIconClass}>
                  <SearchIcon />
                </span>
                검색
              </button>
              <button type="button" className={menuItemClass}>
                <span className={sidebarIconClass}>
                  <ChatListIcon />
                </span>
                대화 목록
              </button>
            </div>

            <div className={`mx-3 border-t ${sidebarDividerClass}`} />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-3">
              <p
                className={`mb-2 px-2 text-xs font-medium ${sidebarMutedClass}`}
              >
                최근 항목
              </p>
              <ul className="flex-1 space-y-0.5 overflow-y-auto">
                {recentConversations.map((title, index) => (
                  <li key={title} className="group relative">
                    <div
                      className={`flex items-center rounded-lg transition-colors ${
                        activeConversationId === index
                          ? activeRecentClass
                          : sidebarHoverClass
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveConversationId(index)}
                        className={`min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm ${sidebarTextClass}`}
                      >
                        {title}
                      </button>
                      <button
                        type="button"
                        className={`mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 ${sidebarIconClass} ${sidebarHoverClass}`}
                        aria-label={`${title} 더보기`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVerticalIcon />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`border-t px-3 py-3 ${sidebarDividerClass}`}>
              <Link
                to="/login"
                className={`flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${sidebarHoverClass}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-teal-400/20 text-teal-400" : "bg-teal-600/15 text-teal-700"}`}
                >
                  <UserIcon />
                </div>
                <span className={`text-sm font-medium ${sidebarTextClass}`}>
                  사용자
                </span>
              </Link>
            </div>
          </aside>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div
            className={`border-b ${accent.borderAccent20} px-4 py-4 md:px-6`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className={sidebarToggleBtnClass}
                aria-label={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
                title={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
              >
                <PanelToggleIcon />
              </button>
              <div className="min-w-0 flex-1">
                <h1
                  className={`text-lg font-bold md:text-xl ${headingTextClass}`}
                >
                  AI 식품 성분 질문
                </h1>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  식품 성분이나 알레르기에 대해 자유롭게 질문해보세요
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className={`text-sm ${mutedTextClass}`}>
                    식품 성분, 알레르기 정보에 대해 궁금한 것을 물어보세요
                  </p>
                  <div className="mt-6 space-y-2">
                    {[
                      "카제인이 유제품 성분인가요?",
                      "밀 알레르기가 있을 때 피해야 할 성분은?",
                      "아황산류는 어떤 식품에 들어있나요?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className={`block w-full rounded-lg border px-4 py-2 text-sm transition-colors ${accent.borderAccent30} ${accent.textAccent} ${accent.hoverBgAccent10}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:max-w-[70%] ${
                    msg.role === "user"
                      ? accent.userBubble
                      : assistantBubbleClass
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={`rounded-2xl border ${accent.borderAccent20} ${cardBgClass} px-4 py-3 text-sm ${mutedTextClass}`}
                >
                  분석 중...
                </div>
              </div>
            )}
          </div>

          <div
            className={`border-t ${accent.borderAccent20} px-4 py-4 md:px-6`}
          >
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="식품 성분이나 알레르기에 대해 질문해보세요 (Enter로 전송)"
                rows={2}
                className={textareaClassName}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 md:px-5 ${accent.btnOutline}`}
              >
                전송
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Shift + Enter로 줄바꿈 가능
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
