"use client";

import { useRef } from "react";
import type { ProfileTimelineItemType } from "@/lib/profile-timeline";
import styles from "./page.module.css";

export type PublicTimelineCardViewModel = {
  id: string;
  title: string;
  organization: string;
  location: string | null;
  description: string | null;
  period: string;
};

type PublicTimelineGroupProps = {
  items: PublicTimelineCardViewModel[];
  label: string;
  type: ProfileTimelineItemType;
};

export function PublicTimelineGroup({
  items,
  label,
  type,
}: PublicTimelineGroupProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const hasOverflowControls = items.length > 3;

  function scrollTimeline(direction: "previous" | "next") {
    const list = listRef.current;

    if (!list) {
      return;
    }

    const firstCard = list.querySelector<HTMLElement>(
      `.${styles.timelineCard}`,
    );
    const scrollAmount = firstCard
      ? firstCard.offsetWidth + 16
      : list.clientWidth;

    list.scrollBy({
      behavior: "smooth",
      left: direction === "next" ? scrollAmount : -scrollAmount,
    });
  }

  return (
    <section
      className={styles.timelineGroup}
      data-type={type}
      aria-labelledby={`timeline-group-${type}`}
    >
      <header className={styles.timelineGroupHeader}>
        <h3 id={`timeline-group-${type}`} className={styles.timelineGroupTitle}>
          {label}
        </h3>
      </header>

      <div className={styles.timelineCarousel}>
        {hasOverflowControls ? (
          <button
            className={`${styles.timelineArrow} ${styles.timelineArrowPrevious}`}
            type="button"
            aria-label={`Voir les éléments précédents de ${label}`}
            onClick={() => scrollTimeline("previous")}
          >
            <span aria-hidden="true">&lt;</span>
          </button>
        ) : null}

        <div
          className={styles.timelineList}
          data-scrollable={hasOverflowControls}
          ref={listRef}
          tabIndex={hasOverflowControls ? 0 : undefined}
        >
          {items.map((item) => (
            <article className={styles.timelineCard} key={item.id}>
              <p className={styles.timelinePeriod}>{item.period}</p>
              <h4 className={styles.timelineTitle}>{item.title}</h4>
              <p className={styles.timelineMeta}>
                {item.organization}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              {item.description ? (
                <p className={styles.timelineDescription}>{item.description}</p>
              ) : null}
            </article>
          ))}
        </div>

        {hasOverflowControls ? (
          <button
            className={`${styles.timelineArrow} ${styles.timelineArrowNext}`}
            type="button"
            aria-label={`Voir les éléments suivants de ${label}`}
            onClick={() => scrollTimeline("next")}
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
