import { useNavigate } from "react-router-dom";

export default function ContactPage() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    alert("문의가 접수되었습니다");
    navigate("/");
  };

  return (
    <div className="m-0 box-border min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-[50px] text-white">
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10">
        <section className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            문의하기
          </h1>
          <p className="mt-3 text-base text-cyan-300 md:text-lg">
            궁금한 점이 있으시면 언제든지 문의해주세요
          </p>
          <p className="mt-1 text-cyan-300 text-sm text-slate-400">
            빠른 답변을 위해 이름과 이메일을 입력해주세요.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-xl border-2 border-cyan-300 bg-slate-900/40 p-6"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="contact-name"
                className="mb-2 block text-sm font-medium text-cyan-300"
              >
                이름
              </label>
              <input
                id="contact-name"
                type="text"
                placeholder="이름을 입력해주세요"
                className="w-full rounded-lg border-2 border-cyan-300 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-200"
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="mb-2 block text-sm font-medium text-cyan-300"
              >
                이메일
              </label>
              <input
                id="contact-email"
                type="email"
                placeholder="example@email.com"
                className="w-full rounded-lg border-2 border-cyan-300 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-200"
              />
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="mb-2 block text-sm font-medium text-cyan-300"
              >
                문의 내용
              </label>
              <textarea
                id="contact-message"
                rows="6"
                placeholder="문의하실 내용을 입력해주세요"
                className="w-full rounded-lg border-2 border-cyan-300 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-200"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-xl border-2 border-cyan-300 bg-transparent px-8 py-3 text-lg font-semibold text-cyan-300 transition-all duration-200 hover:bg-cyan-300 hover:text-slate-900"
          >
            제출하기
          </button>
        </form>
      </main>
    </div>
  );
}
