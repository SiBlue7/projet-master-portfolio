"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const projectMediaAutoplayDelay = 5000;

export type ProjectMediaCarouselItem = {
  id: string;
  altText: string;
  src: string;
};

type ProjectMediaCarouselProps = {
  items: ProjectMediaCarouselItem[];
  projectTitle: string;
};

export function ProjectMediaCarousel({
  items,
  projectTitle,
}: ProjectMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleItems = items.length > 1;

  useEffect(() => {
    if (!hasMultipleItems) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) =>
        currentIndex === items.length - 1 ? 0 : currentIndex + 1,
      );
    }, projectMediaAutoplayDelay);

    return () => window.clearInterval(intervalId);
  }, [hasMultipleItems, items.length]);

  function showPreviousMedia() {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? items.length - 1 : currentIndex - 1,
    );
  }

  function showNextMedia() {
    setActiveIndex((currentIndex) =>
      currentIndex === items.length - 1 ? 0 : currentIndex + 1,
    );
  }

  return (
    <div
      className={styles.mediaCarousel}
      aria-label={`Captures du projet ${projectTitle}`}
    >
      <div className={styles.mediaCarouselViewport}>
        <div
          className={styles.mediaCarouselTrack}
          style={{
            transform: `translateX(-${activeIndex * 100}%)`,
          }}
        >
          {items.map((media, index) => (
            <figure
              className={styles.mediaSlide}
              data-active={index === activeIndex}
              key={media.id}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.mediaImage}
                src={media.src}
                alt={media.altText}
              />
            </figure>
          ))}
        </div>
      </div>

      {hasMultipleItems ? (
        <div className={styles.mediaCarouselControls}>
          <button
            className={styles.mediaCarouselButton}
            type="button"
            aria-label="Capture précédente"
            onClick={showPreviousMedia}
          >
            &lt;
          </button>

          <div
            className={styles.mediaCarouselDots}
            aria-label="Choisir une capture"
          >
            {items.map((media, index) => (
              <button
                className={styles.mediaCarouselDot}
                data-active={index === activeIndex}
                type="button"
                aria-label={`Afficher la capture ${index + 1}`}
                aria-pressed={index === activeIndex}
                key={media.id}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          <button
            className={styles.mediaCarouselButton}
            type="button"
            aria-label="Capture suivante"
            onClick={showNextMedia}
          >
            &gt;
          </button>
        </div>
      ) : null}

      <p className={styles.mediaCarouselStatus} aria-live="polite">
        Capture {activeIndex + 1} sur {items.length}
      </p>
    </div>
  );
}
