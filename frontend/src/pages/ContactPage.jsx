import { useNavigate } from "react-router-dom";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";

export default function ContactPage() {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();

  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const pageTextClass = isDark ? "text-white" : "text-[#1e293b]";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const formBgClass = isDark ? "bg-[#1e293b]" : "bg-[#ffffff]";
  const inputClassName = isDark
    ? "w-full rounded-lg border-2 border-cyan-300 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-200"
    : `w-full rounded-lg border-2 border-teal-600 bg-[#ffffff] px-4 py-3 text-[#1e293b] placeholder:text-slate-500 outline-none transition ${accent.focusBorderAccent}`;
  const textareaClassName = inputClassName;

  const handleSubmit = (event) => {
    event.preventDefault();
    alert("문의가 접수되었습니다");
    navigate("/");
  };

  return (
    <div
      className={`m-0 box-border min-h-screen pt-[50px] ${pageBgClass} ${pageTextClass}`}
    >
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10">
        <section className="text-center">
          <h1
            className={`text-3xl font-bold tracking-tight md:text-4xl ${
              isDark ? "text-white" : "text-[#1e293b]"
            }`}
          >
            문의하기
          </h1>
          <p className={`mt-3 text-base md:text-lg ${accent.textAccent}`}>
            궁금한 점이 있으시면 언제든지 문의해주세요
          </p>
          <p className={`mt-1 text-sm ${mutedTextClass}`}>
            빠른 답변을 위해 이름과 이메일을 입력해주세요.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className={`mt-10 rounded-xl ${accent.border2Accent} ${formBgClass} p-6`}
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="contact-name"
                className={`mb-2 block text-sm font-medium ${accent.textAccent}`}
              >
                이름
              </label>
              <input
                id="contact-name"
                type="text"
                placeholder="이름을 입력해주세요"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className={`mb-2 block text-sm font-medium ${accent.textAccent}`}
              >
                이메일
              </label>
              <input
                id="contact-email"
                type="email"
                placeholder="example@email.com"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className={`mb-2 block text-sm font-medium ${accent.textAccent}`}
              >
                문의 내용
              </label>
              <textarea
                id="contact-message"
                rows="6"
                placeholder="문의하실 내용을 입력해주세요"
                className={textareaClassName}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`mt-6 rounded-xl bg-transparent px-8 py-3 text-lg font-semibold transition-all duration-200 ${accent.btnOutline}`}
          >
            제출하기
          </button>
        </form>
      </main>
    </div>
  );
}
