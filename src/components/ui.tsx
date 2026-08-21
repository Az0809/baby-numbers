"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, StarIcon, VolumeIcon, VolumeOffIcon } from "@/components/icons";
import { createQuantityGroups, type NumberItem } from "@/lib/numbers";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  tone?: "pink" | "blue" | "white";
};

export function IconButton({
  label,
  children,
  tone = "white",
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`icon-button icon-button-${tone} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BackButton({ onClick, label = "返回" }: { onClick: () => void; label?: string }) {
  return (
    <IconButton label={label} tone="pink" onClick={onClick} data-testid="back-button">
      <ArrowLeftIcon />
    </IconButton>
  );
}

export function SoundButton({
  enabled,
  ready,
  onToggle
}: {
  enabled: boolean;
  ready: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`sound-button ${!ready ? "is-loading" : enabled ? "is-on" : "is-off"}`}
      aria-label={!ready ? "正在读取声音设置" : enabled ? "关闭声音" : "打开声音"}
      aria-pressed={ready ? enabled : undefined}
      disabled={!ready}
      onClick={onToggle}
      data-testid="sound-toggle"
    >
      {!ready ? <span className="sound-loading-dot" aria-hidden="true">•••</span> : enabled ? <VolumeIcon /> : <VolumeOffIcon />}
      <span>{ready ? (enabled ? "声音开" : "声音关") : "声音"}</span>
    </button>
  );
}

export function StarBadge({ stars, ready }: { stars: number; ready: boolean }) {
  return (
    <div className="star-badge" aria-label={ready ? `${stars} 颗星星` : "正在读取星星"}>
      <StarIcon />
      <span>{ready ? stars : "—"}</span>
    </div>
  );
}

export function ProgressCard({
  learned,
  ready
}: {
  learned: number;
  ready: boolean;
}) {
  const safeLearned = Math.min(100, Math.max(0, learned));
  return (
    <section className="progress-card" aria-label="学习进度">
      <div className="progress-label">
        <strong>已学习</strong>
        <span data-testid="progress-text">{ready ? `${safeLearned} / 100` : "— / 100"}</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={ready ? safeLearned : 0}
      >
        <span style={{ width: ready ? `${safeLearned}%` : "0%" }} />
      </div>
    </section>
  );
}

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone: "green" | "blue" | "purple" | "orange";
  onClick: () => void;
  testId?: string;
};

export function FeatureCard({
  icon,
  title,
  subtitle,
  tone,
  onClick,
  testId
}: FeatureCardProps) {
  return (
    <button
      type="button"
      className={`feature-card feature-card-${tone}`}
      onClick={onClick}
      data-testid={testId}
    >
      <span className="feature-icon" aria-hidden="true">{icon}</span>
      <span className="feature-copy">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <span className="feature-arrow" aria-hidden="true">
        <ArrowRightIcon />
      </span>
    </button>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="page-title">{children}</h1>;
}

export function QuantityDisplay({
  count,
  item,
  compact = false
}: {
  count: number;
  item: NumberItem;
  compact?: boolean;
}) {
  const groups = createQuantityGroups(count);
  return (
    <div
      className={`quantity-display ${compact ? "is-compact" : ""}`}
      aria-label={`${count}${item.pluralName}`}
      data-testid="quantity-display"
    >
      {groups.map((groupSize, groupIndex) => (
        <div
          className="quantity-group"
          data-testid="quantity-group"
          key={`${count}-${groupIndex}`}
          aria-label={`第 ${groupIndex + 1} 组，共 ${groupSize} 个`}
        >
          {Array.from({ length: groupSize }, (_, itemIndex) => (
            <span
              className="quantity-item"
              data-testid="quantity-item"
              aria-hidden="true"
              key={`${groupIndex}-${itemIndex}`}
            >
              {item.emoji}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function NavigationButtons({
  previousDisabled,
  onPrevious,
  nextLabel = "下一个",
  onNext
}: {
  previousDisabled: boolean;
  onPrevious: () => void;
  nextLabel?: string;
  onNext: () => void;
}) {
  return (
    <nav className="number-navigation" aria-label="数字翻页">
      <button
        type="button"
        className="nav-button nav-button-previous"
        disabled={previousDisabled}
        onClick={onPrevious}
        data-testid="previous-number"
      >
        <ArrowLeftIcon />
        <span>上一个</span>
      </button>
      <button
        type="button"
        className="nav-button nav-button-next"
        onClick={onNext}
        data-testid="next-number"
      >
        <span>{nextLabel}</span>
        <ArrowRightIcon />
      </button>
    </nav>
  );
}

export function Confetti({ count = 24 }: { count?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          style={{
            "--confetti-index": index,
            "--confetti-delay": `${(index % 8) * 0.06}s`,
            "--confetti-x": `${((index * 37) % 100) - 50}vw`
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
