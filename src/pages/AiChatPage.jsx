import { useState } from "react";

export default function AiChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "현재 AI 연동 준비 중입니다. 백엔드 연동 후 실제 답변이 제공됩니다.",
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="m-0 box-border flex min-h-screen flex-col bg-[#0f172a] pt-[50px] text-slate-100">
      {/* 상단 제목 */}
      <div className="border-b border-cyan-300/20 px-6 py-4">
        <h1 className="text-xl font-bold text-white">🤖 AI 식품 성분 질문</h1>
        <p className="mt-1 text-sm text-slate-400">
          식품 성분이나 알레르기에 대해 자유롭게 질문해보세요
        </p>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-4xl">🌿</p>
              <p className="text-sm text-slate-400">
                식품 성분, 알레르기 정보에 대해 궁금한 것을 물어보세요
              </p>
              {/* 예시 질문 */}
              <div className="mt-6 space-y-2">
                {[
                  "카제인이 유제품 성분인가요?",
                  "밀 알레르기가 있을 때 피해야 할 성분은?",
                  "아황산류는 어떤 식품에 들어있나요?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="block w-full rounded-lg border border-cyan-300/30 px-4 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-300/10"
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
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-cyan-300 text-gray-900"
                  : "border border-cyan-300/20 bg-[#1e293b] text-slate-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* 로딩 표시 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-cyan-300/20 bg-[#1e293b] px-4 py-3 text-sm text-slate-400">
              분석 중...
            </div>
          </div>
        )}
      </div>

      {/* 입력창 */}
      <div className="border-t border-cyan-300/20 px-6 py-4">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="식품 성분이나 알레르기에 대해 질문해보세요 (Enter로 전송)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-slate-600 bg-[#1e293b] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="rounded-xl border-2 border-cyan-300 px-5 py-3 text-sm font-semibold text-cyan-300 transition-all duration-200 hover:bg-cyan-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            전송
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Shift + Enter로 줄바꿈 가능
        </p>
      </div>
    </div>
  );
}
