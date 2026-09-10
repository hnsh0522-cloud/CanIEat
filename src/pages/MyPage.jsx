import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useThemeStore from "../store/useThemeStore";

const allergyCategories = [
  {
    category: "곡류 / 견과류",
    items: ["메밀", "밀", "땅콩", "대두", "호두", "잣"],
  },
  { category: "육류", items: ["돼지고기", "닭고기", "쇠고기"] },
  {
    category: "해산물",
    items: ["고등어", "게", "새우", "오징어", "조개류", "굴", "전복", "홍합"],
  },
  { category: "기타", items: ["난류", "우유", "복숭아", "토마토", "아황산류"] },
];

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout, updateAllergies } = useAuthStore();
  const { isDark } = useThemeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState(user.allergies);
  const [customAllergy, setCustomAllergy] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleAllergy = (item) => {
    setSelectedAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const addCustomAllergy = () => {
    const item = customAllergy.trim();
    if (!item || selectedAllergies.includes(item)) return;
    setSelectedAllergies((prev) => [...prev, item]);
    setCustomAllergy("");
  };

  const handleSave = () => {
    updateAllergies(selectedAllergies);
    setIsEditing(false);
    alert("알레르기 정보가 업데이트되었습니다.");
  };

  const presetAllergies = user.allergies.filter((a) =>
    allergyCategories.some((cat) => cat.items.includes(a)),
  );
  const customNotes = user.allergies.filter(
    (a) => !allergyCategories.some((cat) => cat.items.includes(a)),
  );

  return (
    <div
      className={`min-h-screen pt-[50px] ${isDark ? "bg-[#0f172a]" : "bg-gray-50"}`}
    >
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1
          className={`mb-8 text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          마이페이지
        </h1>

        {/* 사용자 정보 카드 */}
        <div
          className={`mb-6 rounded-2xl border p-6 ${isDark ? "bg-[#1e293b] border-teal-300/20" : "bg-white border-teal-200"}`}
        >
          <h2
            className={`mb-4 text-lg font-bold ${isDark ? "text-teal-400" : "text-teal-700"}`}
          >
            사용자 정보
          </h2>
          <div className="space-y-2">
            <p
              className={`text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}
            >
              이름: <span className="font-semibold">{user.name}</span>
            </p>
            <p
              className={`text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}
            >
              이메일: <span className="font-semibold">{user.email}</span>
            </p>
          </div>
        </div>

        {/* 알레르기 설정 카드 */}
        <div
          className={`mb-6 rounded-2xl border p-6 ${isDark ? "bg-[#1e293b] border-teal-300/20" : "bg-white border-teal-200"}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              className={`text-lg font-bold ${isDark ? "text-teal-400" : "text-teal-700"}`}
            >
              내 알레르기 설정 및 특이사항
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={`rounded-lg border px-3 py-1 text-sm transition-all ${isDark ? "border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-gray-900" : "border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white"}`}
              >
                수정하기
              </button>
            )}
          </div>

          {!isEditing ? (
            // 알레르기 배지 표시
            customNotes.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <p
                    className={`mb-2 text-xs font-bold ${isDark ? "text-teal-400" : "text-teal-700"}`}
                  >
                    알레르기
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {presetAllergies.length > 0 ? (
                      presetAllergies.map((a) => (
                        <span
                          key={a}
                          className={`rounded-full border px-3 py-1 text-sm ${isDark ? "border-teal-400 text-teal-400" : "border-teal-700 text-teal-700"}`}
                        >
                          {a}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">
                        설정된 알레르기가 없어요
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <p
                    className={`mb-2 text-xs font-bold ${isDark ? "text-teal-400" : "text-teal-700"}`}
                  >
                    특이사항
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {customNotes.map((a) => (
                      <span
                        key={a}
                        className={`rounded-full border px-3 py-1 text-sm ${isDark ? "border-teal-400 text-teal-400" : "border-teal-700 text-teal-700"}`}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.allergies.length > 0 ? (
                  user.allergies.map((a) => (
                    <span
                      key={a}
                      className={`rounded-full border px-3 py-1 text-sm ${isDark ? "border-teal-400 text-teal-400" : "border-teal-700 text-teal-700"}`}
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    설정된 알레르기가 없어요
                  </p>
                )}
              </div>
            )
          ) : (
            // 알레르기 수정 체크박스
            <div>
              <div
                className={`space-y-4 rounded-lg border p-4 ${isDark ? "border-slate-600 bg-[#0f172a]" : "border-gray-200 bg-gray-50"}`}
              >
                {allergyCategories.map((cat) => (
                  <div key={cat.category}>
                    <p
                      className={`mb-2 text-xs font-bold ${isDark ? "text-teal-400" : "text-teal-700"}`}
                    >
                      {cat.category}
                    </p>
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
                            className="accent-teal-500"
                          />
                          <span
                            className={`text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}
                          >
                            {item}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <p
                    className={`mb-2 text-xs font-bold ${isDark ? "text-teal-400" : "text-teal-700"}`}
                  >
                    특이사항 (데이터 반영을 위해서 반드시 엔터 키를 눌러주세요.)
                  </p>
                  <input
                    type="text"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomAllergy();
                      }
                    }}
                    placeholder="예시: 과민성 대장 증후군, 매운 음식을 못 먹음 등"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${isDark ? "border-slate-600 bg-[#0f172a] text-white placeholder-slate-500 focus:border-teal-400" : "border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:border-teal-700"}`}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedAllergies
                      .filter(
                        (a) =>
                          !allergyCategories.some((cat) =>
                            cat.items.includes(a),
                          ),
                      )
                      .map((item) => (
                        <label
                          key={item}
                          className="flex cursor-pointer items-center gap-1"
                        >
                          <input
                            type="checkbox"
                            checked
                            onChange={() => toggleAllergy(item)}
                            className="accent-teal-500"
                          />
                          <span
                            className={`text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}
                          >
                            {item}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSave}
                  className={`rounded-xl border-2 px-6 py-2 text-sm font-semibold transition-all ${isDark ? "border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-gray-900" : "border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white"}`}
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setSelectedAllergies(user.allergies);
                    setCustomAllergy("");
                    setIsEditing(false);
                  }}
                  className={`rounded-xl border-2 px-6 py-2 text-sm font-semibold transition-all ${isDark ? "border-slate-500 text-slate-400 hover:bg-slate-700" : "border-gray-300 text-gray-500 hover:bg-gray-100"}`}
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleLogout}
          className="w-full rounded-xl border-2 border-red-400 px-8 py-3 text-lg font-semibold text-red-400 transition-all duration-200 hover:bg-red-400 hover:text-white"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
