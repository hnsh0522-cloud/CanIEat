import useThemeStore from "../store/useThemeStore.js";

/**
 * 다크 모드: cyan 계열 유지
 * 라이트 모드: cyan → teal 변환
 */
export default function useAccentClasses() {
  const isDark = useThemeStore((state) => state.isDark);

  return {
    textAccent: isDark ? "text-cyan-300" : "text-teal-600",
    textAccent700: isDark ? "text-cyan-400" : "text-teal-700",
    borderAccent: isDark ? "border-cyan-300" : "border-teal-600",
    borderAccent20: isDark ? "border-cyan-300/20" : "border-teal-600/20",
    borderAccent10: isDark ? "border-cyan-300/10" : "border-teal-600/10",
    borderAccent30: isDark ? "border-cyan-300/30" : "border-teal-600/30",
    borderAccent40: isDark ? "border-cyan-300/40" : "border-teal-600/40",
    border2Accent: isDark ? "border-2 border-cyan-300" : "border-2 border-teal-600",
    bgAccent: isDark ? "bg-cyan-300" : "bg-teal-600",
    bgAccent10: isDark ? "bg-cyan-300/10" : "bg-teal-600/10",
    hoverBgAccent: isDark ? "hover:bg-cyan-300" : "hover:bg-teal-600",
    hoverBgAccent10: isDark ? "hover:bg-cyan-300/10" : "hover:bg-teal-600/10",
    hoverTextAccent: isDark ? "hover:text-cyan-300" : "hover:text-teal-600",
    hoverBgAccent700: isDark ? "hover:bg-cyan-400" : "hover:bg-teal-700",
    focusBorderAccent: isDark
      ? "focus:border-cyan-300"
      : "focus:border-teal-600",
    accentColor: isDark ? "accent-cyan-300" : "accent-teal-600",
    btnOutline:
      isDark
        ? "border-2 border-cyan-300 bg-transparent text-cyan-300 hover:bg-cyan-300 hover:text-gray-900"
        : "border-2 border-teal-600 bg-transparent text-teal-600 hover:bg-teal-600 hover:text-gray-900",
    btnSolid:
      isDark
        ? "bg-cyan-300 text-gray-900 hover:bg-cyan-400"
        : "bg-teal-600 text-gray-900 hover:bg-teal-700",
    userBubble: isDark ? "bg-cyan-300 text-gray-900" : "bg-teal-600 text-gray-900",
    badgeAccent:
      isDark
        ? "border border-cyan-300/40 bg-cyan-300/10 text-cyan-300"
        : "border border-teal-600/40 bg-teal-600/10 text-teal-600",
  };
}
