import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";
import {
  confirmPassword,
  getApiErrorMessage,
  registerRequest,
} from "../api/auth.js";

const PASSWORD_RULE_HINT = "영문 대/소문자, 숫자, 특수문자 포함 8~16자";
const ALLOWED_SPECIAL_CHARS = "!@#$%^&*-_";
const PASSWORD_RULE_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*\-_])[A-Za-z\d!@#$%^&*\-_]{8,16}$/;

function getPasswordRuleMessage(value) {
  if (!value) return "";
  if (PASSWORD_RULE_REGEX.test(value)) {
    return "비밀번호 보안 규칙을 만족합니다.";
  }
  if (value.length < 8 || value.length > 16) {
    return "비밀번호는 8~16자로 입력해주세요.";
  }
  if (!/[A-Z]/.test(value)) {
    return "영문 대문자를 최소 1개 이상 포함해주세요.";
  }
  if (!/[a-z]/.test(value)) {
    return "영문 소문자를 최소 1개 이상 포함해주세요.";
  }
  if (!/\d/.test(value)) {
    return "숫자를 최소 1개 이상 포함해주세요.";
  }
  if (
    !new RegExp(`[${ALLOWED_SPECIAL_CHARS.replace(/[-]/g, "\\-")}]`).test(value)
  ) {
    return `특수문자(${ALLOWED_SPECIAL_CHARS.split("").join(" ")})를 최소 1개 이상 포함해주세요.`;
  }
  return `허용되지 않은 문자가 포함되어 있습니다. 특수문자는 ${ALLOWED_SPECIAL_CHARS.split("").join(" ")} 만 사용할 수 있습니다.`;
}

export default function SignupPage() {
  const navigate = useNavigate();

  // 1. 상태 선언 (누락되었던 input 상태 추가)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const isPasswordValid = PASSWORD_RULE_REGEX.test(password);
  const passwordRuleMessage = getPasswordRuleMessage(password);
  const isPasswordConfirmEmpty = !passwordConfirm;
  const isPasswordMatched = confirmPassword(password, passwordConfirm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !passwordConfirm.trim()
    ) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    if (!isPasswordValid) {
      alert(PASSWORD_RULE_HINT);
      return;
    }
    if (!confirmPassword(password, passwordConfirm)) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerRequest({
        email: email.trim(),
        password,
        nickname: name.trim(),
      });
      if (!response.success) {
        throw new Error(response.message || "회원가입에 실패했습니다.");
      }
      alert(response.message || "회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (error) {
      alert(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
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
          가입 정보를 입력해주세요
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className={`mb-1 block text-sm font-medium ${labelTextClass}`}
            >
              닉네임
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
            <p className={`mt-1 text-xs ${mutedTextClass}`}>
              {PASSWORD_RULE_HINT}
            </p>
            {passwordRuleMessage && (
              <p
                className={`mt-1 text-xs ${
                  isPasswordValid ? "text-green-400" : "text-red-400"
                }`}
              >
                {passwordRuleMessage}
              </p>
            )}

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
            {!isPasswordConfirmEmpty && (
              <p
                className={`mt-1 text-xs ${
                  isPasswordMatched ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPasswordMatched
                  ? "✓ 비밀번호가 일치합니다."
                  : "✕ 비밀번호가 일치하지 않습니다."}
              </p>
            )}

            <span className={`ml-2 text-xs ${accent.textAccent}`}>
              빠른 답변을 위해 이름과 이메일을 입력해주세요.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isPasswordValid}
            className={`mt-2 w-full rounded-xl px-8 py-3 text-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${accent.btnOutline}`}
          >
            {isSubmitting ? "가입 중..." : "회원가입"}
          </button>
        </form>

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
