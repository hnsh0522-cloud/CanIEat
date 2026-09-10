import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import useAuthStore from "../store/useAuthStore";
import { confirmPassword } from "../api/auth.js";

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

  // 1. 상태 선언 (누락되었던 input 상태 추가)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [customAllergy, setCustomAllergy] = useState("");

  // 2. Custom Hooks 호출 (useAuthStore를 컴포넌트 내부 최상단으로 이동)
  const { login } = useAuthStore();
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();

  const pageBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const cardBgClass = isDark ? "bg-[#1e293b]" : "bg-[#ffffff]";
  const headingTextClass = isDark ? "text-white" : "text-[#1e293b]";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const labelTextClass = isDark ? "text-slate-300" : "text-slate-700";
  const inputClassName = isDark
    ? "w-full rounded-lg border border-slate-600 bg-[#0f172a] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
    : `w-full rounded-lg border border-slate-300 bg-[#ffffff] px-4 py-3 text-[#1e293b] placeholder-slate-500 ${accent.focusBorderAccent} focus:outline-none`;
  const allergyBoxBgClass = isDark ? "bg-[#0f172a]" : "bg-[#f8fafc]";
  const allergyBoxBorderClass = isDark
    ? "border-slate-600"
    : "border-slate-200";

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

  const handleSubmit = () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !passwordConfirm.trim()
    ) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    if (!confirmPassword(password, passwordConfirm)) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    login(name, email, selectedAllergies);
    alert("회원가입이 완료되었습니다!");
    navigate("/");
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center py-10 ${pageBgClass}`}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border ${accent.borderAccent20} ${cardBgClass} p-8 shadow-lg`}
      >
        <h1
          className={`mb-2 text-center text-3xl font-bold ${headingTextClass}`}
        >
          회원가입
        </h1>
        <p className={`mb-8 text-center text-sm ${mutedTextClass}`}>
          회원가입 후 맞춤 알레르기 알림을 받아보세요
        </p>

        <div className="space-y-4">
          <div>
            <label
              className={`mb-1 block text-sm font-medium ${labelTextClass}`}
            >
              이름
            </label>
            <input
              type="text"
              placeholder="이름을 입력해주세요"
              className={inputClassName}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label
              className={`mb-1 block text-sm font-medium ${labelTextClass}`}
            >
              이메일
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className={inputClassName}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              className={`mb-1 block text-sm font-medium ${labelTextClass}`}
            >
              비밀번호
            </label>
            <input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              className={inputClassName}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label
              className={`mb-1 mt-4 block text-sm font-medium ${labelTextClass}`}
            >
              비밀번호 확인
            </label>
            <input
              type="password"
              placeholder="비밀번호를 다시 입력해주세요"
              className={inputClassName}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />

            <span className={`ml-2 text-xs ${accent.textAccent}`}>
              빠른 답변을 위해 이름과 이메일을 입력해주세요.
            </span>
          </div>

          <div>
            <label
              className={`mb-3 block text-sm font-medium ${labelTextClass}`}
            >
              알레르기 선택 및 특이사항
            </label>

            <div
              className={`space-y-4 rounded-lg border ${allergyBoxBorderClass} ${allergyBoxBgClass} p-4`}
            >
              {allergyCategories.map((cat) => (
                <div key={cat.category}>
                  <p className={`mb-2 text-xs font-bold ${accent.textAccent}`}>
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
                          className={accent.accentColor}
                        />
                        <span className={`text-sm ${labelTextClass}`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <p className={`mb-2 text-xs font-bold ${accent.textAccent}`}>
                  특이사항
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
                  placeholder="예시: 과민성 대장 증후군"
                  className={inputClassName}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAllergies
                    .filter(
                      (a) =>
                        !allergyCategories.some((cat) => cat.items.includes(a)),
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
                          className={accent.accentColor}
                        />
                        <span className={`text-sm ${labelTextClass}`}>
                          {item}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
            {selectedAllergies.length > 0 && (
              <p className={`mt-2 text-xs ${accent.textAccent}`}>
                선택된 알레르기: {selectedAllergies.join(", ")}
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className={`mt-2 w-full rounded-xl px-8 py-3 text-lg font-semibold transition-all duration-200 ${accent.btnOutline}`}
          >
            회원가입
          </button>
        </div>

        <p className={`mt-6 text-center text-sm ${mutedTextClass}`}>
          이미 회원이신가요?{" "}
          <Link to="/login" className={`${accent.textAccent} hover:underline`}>
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
