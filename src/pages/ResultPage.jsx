import { Link } from "react-router-dom";

const dummyProducts = [
  {
    id: 1,
    productName: "초코바",
    manufacturer: "롯데제과",
    allergies: ["땅콩", "밀", "우유"],
    rawMaterial: "밀가루, 설탕, 땅콩, 우유, 카카오",
    isDanger: true,
    dangerItems: ["땅콩"],
  },
  {
    id: 2,
    productName: "그릭요거트",
    manufacturer: "남양유업",
    allergies: ["우유"],
    rawMaterial: "탈지분유, 유산균",
    isDanger: true,
    dangerItems: ["우유"],
  },
];

function DangerPill({ isDanger }) {
  if (isDanger) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/80 bg-orange-400/10 px-3 py-1 text-sm font-semibold text-orange-400">
        <span aria-hidden>⚠️</span>
        위험 성분이 포함되어 있습니다
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-green-400/80 bg-green-400/10 px-3 py-1 text-sm font-semibold text-green-400">
      <span aria-hidden>✅</span>
      안전한 제품입니다
    </div>
  );
}

export default function ResultPage() {
  const product = dummyProducts[0];

  return (
    <div className="m-0 box-border min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-[50px] text-slate-100">
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10">
        {/* 상단 제목 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            분석 <span className="text-cyan-300">결과</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
            검색하신 제품의 알레르기 정보입니다
          </p>
        </div>

        {/* 제품 카드 (API 연동 전: 첫 번째 더미 데이터만 표시) */}
        <section className="rounded-2xl border border-cyan-300/20 bg-[#1e293b] p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-white">
                {product.productName}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                제조사:{" "}
                <span className="text-slate-100">{product.manufacturer}</span>
              </p>
            </div>
            <div className="shrink-0">
              <DangerPill isDanger={product.isDanger} />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-cyan-300/10 bg-slate-950/20 p-4">
            <p className="text-sm font-semibold text-cyan-300">원재료</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              {product.rawMaterial}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-cyan-300/10 bg-slate-950/20 p-4 space-y-5">
            <div>
              <p className="text-sm font-semibold text-cyan-300">
                포함된 알레르기 성분
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.allergies.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-300"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-orange-400">
                ⚠️ 주의 성분
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.dangerItems?.length ? (
                  product.dangerItems.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-orange-400 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-400"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">주의 성분이 없습니다</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 하단 버튼 */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/analyze"
            className="inline-flex items-center justify-center rounded-xl border-2 border-cyan-300 px-6 py-3 text-sm font-semibold text-cyan-300 transition-all duration-200 hover:bg-cyan-300 hover:text-gray-900"
          >
            다시 검색하기
          </Link>
          <Link
            to="/ai-chat"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-300 px-6 py-3 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-cyan-400"
          >
            AI에게 질문하기 →
          </Link>
        </div>
      </main>
    </div>
  );
}

