
import { useEffect, useRef, useState } from "react";
import useThemeStore from "../store/useThemeStore.js";
import useAccentClasses from "../hooks/useAccentClasses.js";

// 음식 사진과 설명

const foodItems = [
 
{
  number: "01",
  title: "식품 속 원재료,\n어디까지 확인하셨나요?",
  description:
    "식품마다 사용된 원재료가 다릅니다. 제품명뿐 아니라 원재료명과 알레르기 표시도 확인해 보세요.",
  image:
    "https://images.pexels.com/photos/15209809/pexels-photo-15209809.jpeg?auto=compress&cs=tinysrgb&w=1200",
  alt: "다양한 채소와 고기 등 식재료",
  label: "원재료 확인",
},
{
  number: "02",
  title: "주의 성분은\n꼼꼼하게 확인하세요",
  description:
    "생선, 달걀, 우유처럼 알레르기를 유발할 수 있는 성분을 확인하고 제품의 알레르기 표시를 살펴보세요.",
  image:
    "https://images.pexels.com/photos/3952075/pexels-photo-3952075.jpeg?auto=compress&cs=tinysrgb&w=1200",
  alt: "생선과 채소, 달걀 등의 식재료",
  label: "알레르기 성분 확인",
},

  {
    number: "03",
    title: "내 알레르기 기준으로\n식품을 분석하세요",
    description:
      "CanIEat에서 식품 정보를 살펴보고 나의 알레르기와 관련된 성분이 있는지 확인해 보세요.",
    image:
      "https://images.pexels.com/photos/5266120/pexels-photo-5266120.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "여러 가지 음식이 놓인 식탁",
    label: "맞춤형 식품 분석",
  },
];


// 스크롤할 때 사진이 등장하는 컴포넌트
function FoodScene({ item, index, isDark, accent }) {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const reverse = index % 2 === 1;

  useEffect(() => {
    const target = sectionRef.current;

    if (!target) return;

    // 애니메이션을 줄이는 브라우저 설정에도 대응
    if (
      !window.IntersectionObserver ||
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={sectionRef}
      className="
        grid min-h-[70vh] items-center
        gap-8 py-12
        md:grid-cols-2 md:gap-14 md:py-20
      "
    >
      {/* 음식 사진 */}

      <div className={reverse ? "md:order-2" : "md:order-1"}>
        <div
          className={`
            relative mx-auto max-w-[520px]
            transform-gpu
            transition-all duration-1000 ease-out
            motion-reduce:transform-none
            motion-reduce:transition-none
            ${
              visible
                ? "translate-y-0 rotate-0 scale-100 opacity-100 blur-0"
                : "translate-y-20 -rotate-3 scale-[0.82] opacity-0 blur-sm"
            }
          `}
        >
          <div
            className="
              group relative overflow-hidden
              rounded-[32px]
              shadow-2xl shadow-black/20
            "
          >
            <img
              src={item.image}
              alt={item.alt}
              loading="lazy"
              decoding="async"
              className="
                h-[320px] w-full object-cover
                transition-transform duration-700
                group-hover:scale-110
                sm:h-[430px]
              "
            />

            {/* 사진 하단 그라데이션 */}
            <div
              className="
                pointer-events-none absolute inset-0
                bg-gradient-to-t
                from-black/45 via-transparent to-transparent
              "
            />

            <span
              className="
                absolute bottom-5 left-6
                text-xs font-bold tracking-[0.2em]
                text-white sm:text-sm
              "
            >
              {item.label}
            </span>
          </div>
        </div>
      </div>

      {/* 사진 옆 설명 */}

      <div
        className={`
          ${reverse ? "md:order-1" : "md:order-2"}
          transform-gpu
          transition-all duration-700 delay-150 ease-out
          motion-reduce:transform-none
          motion-reduce:transition-none
          ${
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }
        `}
      >
        <p
          className={`
            text-sm font-bold tracking-[0.2em]
            ${accent.textAccent}
          `}
        >
          성분 확인 {item.number}
        </p>

        <h3
          className="
            mt-5 whitespace-pre-line
            text-3xl font-bold leading-snug
            md:text-4xl
          "
        >
          {item.title}
        </h3>

        <p
          className={`
            mt-6 max-w-md
            text-base leading-8 md:text-lg
            ${
              isDark
                ? "text-slate-300"
                : "text-slate-600"
            }
          `}
        >
          {item.description}
        </p>

        <div
          className={`
            mt-7 h-1 w-14 rounded-full
            ${accent.bgAccent}
          `}
        />
      </div>
    </article>
  );
}

// 홈 화면 아래에 추가할 전체 섹션
export default function FoodScrollSection() {
  const { isDark } = useThemeStore();
  const accent = useAccentClasses();

  return (
    <section
      className="
        mx-auto w-full max-w-6xl
        px-5 pb-20 pt-28 sm:px-8
      "
    >
      {/* 섹션 제목 */}
      <div className="mb-10 text-center">
        <p
          className={`
            text-sm font-bold tracking-[0.25em]
            ${accent.textAccent}
          `}
        >
          식품 안전 가이드
        </p>

        <h2 className="mt-4 text-2xl font-bold md:text-3xl">
          식품 성분, 이렇게 확인하세요
        </h2>

        <p
          className={`
            mt-3 text-sm
            ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }
          `}
        >
          원재료부터 개인 알레르기까지, 확인해야 할 정보를 알아보세요
        </p>
      </div>

      {/* 음식 사진 3개 */}
      {foodItems.map((item, index) => (
        <FoodScene
          key={item.number}
          item={item}
          index={index}
          isDark={isDark}
          accent={accent}
        />
      ))}
    </section>
  );
}
