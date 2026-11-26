"use client";

import { type ReactNode, useRef } from "react";

export function EventCarousel({
  children,
  count,
}: {
  children: ReactNode;
  count: number;
}) {
  const track = useRef<HTMLElement>(null);
  function scroll(direction: number) {
    const element = track.current;
    if (!element) return;
    // Cuộn theo bề rộng đang hiển thị, nên vẫn dùng được khi đổi kích thước màn hình.
    element.scrollBy({
      left: element.clientWidth * direction,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <div className="event-carousel">
      <section
        className="event-carousel-track"
        ref={track}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Vùng cuộn cần nhận phím mũi tên khi dùng bàn phím.
        tabIndex={0}
        aria-label="Danh sách sự kiện đề xuất, cuộn để xem thêm"
      >
        {children}
      </section>
      {count > 3 &&
        ([-1, 1] as const).map((direction) => (
          <button
            className="carousel-arrow"
            data-direction={direction}
            key={direction}
            type="button"
            aria-label={direction < 0 ? "Sự kiện trước" : "Sự kiện tiếp theo"}
            onClick={() => scroll(direction)}
          >
            <svg
              aria-hidden="true"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        ))}
    </div>
  );
}
