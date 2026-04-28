import { Link } from "react-router-dom";

export default function AnalyzePage() {
  return (
    <div className="m-0 box-border min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-[50px] text-slate-100">
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        <div className="mb-8 text-center">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
            <span
              className="h-1.5 w-1.5 rounded-full bg-cyan-400"
              aria-hidden="true"
            ></span>
            분석 모드
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            음식 사진 <span className="text-cyan-300">안전 분석</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
            아래 영역에{" "}
            <strong className="font-semibold text-slate-200">
              카메라로 찍은 음식 사진
            </strong>
            을 올려 분석을 시작하세요. 갤러리에서 선택하거나 촬영한 이미지를
            사용할 수 있습니다.
          </p>
          <ol
            className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 md:text-sm"
            aria-label="분석 단계"
          >
            <li className="flex items-center gap-2 rounded-md bg-slate-800/80 px-3 py-1.5 ring-1 ring-cyan-500/20">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-slate-950">
                1
              </span>
              사진 준비
            </li>
            <li className="text-cyan-600/80" aria-hidden="true">
              →
            </li>
            <li className="flex items-center gap-2 rounded-md bg-slate-800/50 px-3 py-1.5 ring-1 ring-slate-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-slate-200">
                2
              </span>
              업로드
            </li>
            <li className="text-cyan-600/80" aria-hidden="true">
              →
            </li>
            <li className="flex items-center gap-2 rounded-md bg-slate-800/50 px-3 py-1.5 ring-1 ring-slate-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-slate-200">
                3
              </span>
              분석 결과
            </li>
          </ol>
        </div>

        <form className="flex justify-center" action="#" method="post">
          <button
            type="button"
            className="group relative flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-cyan-400/45 bg-slate-900/60 px-8 py-12 text-center shadow-xl shadow-cyan-950/30 transition-all hover:border-cyan-400 hover:bg-slate-900/80 hover:shadow-cyan-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 md:max-w-lg"
          >
            <span className="absolute right-4 top-4 rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-200">
              분석용 이미지
            </span>
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-slate-800/80 ring-1 ring-cyan-400/30 transition-transform group-hover:scale-105">
              <img
                className="h-20 w-20 object-contain drop-shadow-lg"
                src="/pictures/camera.png"
                alt="카메라 아이콘: 음식 사진을 촬영하거나 파일로 선택할 수 있음을 나타냄"
              />
            </div>
            <div className="space-y-1">
              <span className="block text-lg font-semibold text-white md:text-xl">
                음식 사진을 넣어 주세요
              </span>
              <span className="block text-sm text-cyan-100/80">
                탭하면 갤러리에서 선택 · 카메라로 바로 촬영 가능
              </span>
            </div>
            <span className="rounded-lg bg-slate-800/90 px-4 py-2 text-xs font-medium text-slate-400 ring-1 ring-slate-600 group-hover:text-cyan-200/90">
              지원: JPG, PNG 등 이미지 파일
            </span>
          </button>
        </form>
      </main>
    </div>
  );
}
