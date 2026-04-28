import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const allergyCategories = [
  {
    category: "곡류 / 견과류",
    items: ["메밀", "밀", "땅콩", "대두", "호두", "잣"],
  },
  {
    category: "육류",
    items: ["돼지고기", "닭고기", "쇠고기"],
  },
  {
    category: "해산물",
    items: ["고등어", "게", "새우", "오징어", "조개류", "굴", "전복", "홍합"],
  },
  {
    category: "기타",
    items: ["난류", "우유", "복숭아", "토마토", "아황산류"],
  },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [selectedAllergies, setSelectedAllergies] = useState([]);

  const toggleAllergy = (item) => {
    setSelectedAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const handleSubmit = () => {
    alert("회원가입이 완료되었습니다!");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] py-10">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-300/20 bg-[#1e293b] p-8 shadow-lg">
        {/* 제목 */}
        <h1 className="mb-2 text-center text-3xl font-bold text-white">
          회원가입
        </h1>
        <p className="mb-8 text-center text-sm text-slate-400">
          회원가입 후 맞춤 알레르기 알림을 받아보세요
        </p>

        <div className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              이름
            </label>
            <input
              type="text"
              placeholder="이름을 입력해주세요"
              className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
            />
          </div>

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

          {/* 알레르기 선택 */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">
              알레르기 선택
              <span className="ml-2 text-xs text-cyan-300">
                빠른 답변을 위해 이름과 이메일을 입력해주세요.
              </span>
            </label>

            <div className="space-y-4 rounded-lg border border-slate-600 bg-[#0f172a] p-4">
              {allergyCategories.map((cat) => (
                <div key={cat.category}>
                  {/* 카테고리 제목 */}
                  <p className="mb-2 text-xs font-bold text-cyan-300">
                    {cat.category}
                  </p>
                  {/* 체크박스 목록 */}
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item) => (
                      <label
                        key={item}
                        className="flex cursor-pointer items-center gap-1"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAllergies.includes(item)}
                          onChange={() => toggleAllergy(item)}
                          className="accent-cyan-300"
                        />
                        <span className="text-sm text-slate-300">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 선택된 알레르기 표시 */}
            {selectedAllergies.length > 0 && (
              <p className="mt-2 text-xs text-cyan-300">
                선택된 알레르기: {selectedAllergies.join(", ")}
              </p>
            )}
          </div>

          {/* 회원가입 버튼 */}
          <button
            onClick={handleSubmit}
            className="mt-2 w-full rounded-xl border-2 border-cyan-300 bg-transparent px-8 py-3 text-lg font-semibold text-cyan-300 transition-all duration-200 hover:bg-cyan-300 hover:text-gray-900"
          >
            회원가입
          </button>
        </div>

        {/* 로그인 링크 */}
        <p className="mt-6 text-center text-sm text-slate-400">
          이미 회원이신가요?{" "}
          <Link to="/login" className="text-cyan-300 hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
