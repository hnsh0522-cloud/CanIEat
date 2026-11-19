import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { fetchUserState, getApiErrorMessage } from "../api/auth";
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
  // 1. updatePrecautions 추가 구조분해할당
  const {
    user,
    logout,
    updateAllergies,
    updatePrecautions,
    updateUserState,
  } = useAuthStore();
  const { isDark } = useThemeStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingUserState, setIsLoadingUserState] = useState(true);
  const [isSavingUserState, setIsSavingUserState] = useState(false);

  // 2. 알레르기와 주의사항(precautions) State 분리 관리
  const [selectedAllergies, setSelectedAllergies] = useState(
    user.allergies ?? [],
  );
  const [selectedPrecautions, setSelectedPrecautions] = useState(
    user.precautions ?? [],
  );
  const [customPrecaution, setCustomPrecaution] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadUserState = async () => {
      try {
        const userState = await fetchUserState();

        if (isMounted) {
          updateUserState(userState);
          setSelectedAllergies(userState.allergies);
          setSelectedPrecautions(userState.precautions);
        }
      } catch (error) {
        if (isMounted) {
          alert(getApiErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoadingUserState(false);
        }
      }
    };

    loadUserState();
    return () => {
      isMounted = false;
    };
  }, [updateUserState]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleAllergy = (item) => {
    setSelectedAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  // 3. 주의사항/특이사항 추가 함수
  const addCustomPrecaution = () => {
    const item = customPrecaution.trim();
    if (!item || selectedPrecautions.includes(item)) return;
    setSelectedPrecautions((prev) => [...prev, item]);
    setCustomPrecaution("");
  };

  // 4. 주의사항/특이사항 삭제 함수
  const removePrecaution = (itemToRemove) => {
    setSelectedPrecautions((prev) =>
      prev.filter((item) => item !== itemToRemove),
    );
  };

  const handleSave = async () => {
    setIsSavingUserState(true);
    try {
      const response = await api.post("/MyPage/saveUserState", {
        email: user.email,
        allergies: selectedAllergies,
        restrictions: selectedPrecautions,
      });
      const result = response.data;

      if (!result.success) {
        const details = [result.message || "사용자 상태 저장에 실패했습니다."];
        if (result.unknown_allergies?.length) {
          details.push(`등록되지 않은 알레르기: ${result.unknown_allergies.join(", ")}`);
        }
        if (result.changes) {
          const changeLabels = {
            deleted_allergies: "삭제된 알레르기",
            added_allergies: "추가된 알레르기",
            deleted_restrictions: "삭제된 주의사항",
            added_restrictions: "추가된 주의사항",
          };
          Object.entries(changeLabels).forEach(([key, label]) => {
            const changes = result.changes[key];
            if (Array.isArray(changes) && changes.length > 0) {
              details.push(`${label}: ${changes.join(", ")}`);
            }
          });
        }
        alert(details.join("\n"));
        return;
      }

      updateAllergies(selectedAllergies);
      updatePrecautions(selectedPrecautions);
      setIsEditing(false);
      alert(result.message || "알레르기 및 주의사항 정보가 업데이트되었습니다.");
    } catch (error) {
      alert(getApiErrorMessage(error));
    } finally {
      setIsSavingUserState(false);
    }
  };

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
              닉네임: <span className="font-semibold">{user.nickname}</span>
            </p>
            <p
              className={`text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}
            >
              이메일: <span className="font-semibold">{user.email}</span>
            </p>
          </div>
        </div>

        {/* 알레르기 및 주의사항 설정 카드 */}
        <div
          className={`mb-6 rounded-2xl border p-6 ${isDark ? "bg-[#1e293b] border-teal-300/20" : "bg-white border-teal-200"}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              className={`text-lg font-bold ${isDark ? "text-teal-400" : "text-teal-700"}`}
            >
              내 알레르기 및 주의사항 설정
            </h2>
            {!isEditing && (
              <button
                onClick={() => {
                  setSelectedAllergies(user.allergies ?? []);
                  setSelectedPrecautions(user.precautions ?? []);
                  setIsEditing(true);
                }}
                className={`rounded-lg border px-3 py-1 text-sm transition-all ${isDark ? "border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-gray-900" : "border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white"}`}
              >
                수정하기
              </button>
            )}
          </div>

          {!isEditing ? (
            /* 읽기 모드 (알레르기 & 주의사항 각각 표시) */
            <div className="space-y-4">
              <div>
                <p
                  className={`mb-2 text-xs font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}
                >
                  등록된 알레르기
                </p>
                <div className="flex flex-wrap gap-2">
                  {isLoadingUserState ? (
                    <p className="text-sm text-slate-400">불러오는 중...</p>
                  ) : user.allergies && user.allergies.length > 0 ? (
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
              </div>

              <div>
                <p
                  className={`mb-2 text-xs font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}
                >
                  등록된 주의사항 / 특이사항
                </p>
                <div className="flex flex-wrap gap-2">
                  {isLoadingUserState ? (
                    <p className="text-sm text-slate-400">불러오는 중...</p>
                  ) : user.precautions && user.precautions.length > 0 ? (
                    user.precautions.map((p) => (
                      <span
                        key={p}
                        className={`rounded-full border px-3 py-1 text-sm ${isDark ? "border-amber-400 text-amber-400" : "border-amber-600 text-amber-700"}`}
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">
                      설정된 주의사항이 없어요
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 수정 모드 */
            <div>
              <div
                className={`space-y-4 rounded-lg border p-4 ${isDark ? "border-slate-600 bg-[#0f172a]" : "border-gray-200 bg-gray-50"}`}
              >
                {/* 1. 알레르기 카테고리 선택 */}
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

                {/* 2. 주의사항 / 특이사항 입력 구역 */}
                <div>
                  <p
                    className={`mb-2 text-xs font-bold ${isDark ? "text-amber-400" : "text-amber-700"}`}
                  >
                    주의사항 및 특이사항
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPrecaution}
                      onChange={(e) => setCustomPrecaution(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomPrecaution();
                        }
                      }}
                      placeholder="예시: 임산부, 과민성 대장 증후군 (Enter 입력)"
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${isDark ? "border-slate-600 bg-[#1e293b] text-white placeholder-slate-500 focus:border-amber-400" : "border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:border-amber-600"}`}
                    />
                    <button
                      type="button"
                      onClick={addCustomPrecaution}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-amber-600 shrink-0"
                    >
                      추가
                    </button>
                  </div>

                  {/* 추가된 주의사항 태그 목록 */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedPrecautions.map((item) => (
                      <span
                        key={item}
                        className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${isDark ? "border-amber-400 text-amber-400" : "border-amber-600 text-amber-700"}`}
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removePrecaution(item)}
                          className="ml-1 text-xs hover:text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 저장 / 취소 버튼 */}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSavingUserState}
                  className={`rounded-xl border-2 px-6 py-2 text-sm font-semibold transition-all ${isDark ? "border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-gray-900" : "border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white"}`}
                >
                  {isSavingUserState ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAllergies(user.allergies ?? []);
                    setSelectedPrecautions(user.precautions ?? []);
                    setCustomPrecaution("");
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
