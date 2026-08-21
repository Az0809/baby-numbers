export type NumberItem = {
  emoji: string;
  name: string;
  pluralName: string;
};

export const NUMBER_ITEMS: readonly NumberItem[] = [
  { emoji: "🍎", name: "苹果", pluralName: "个苹果" },
  { emoji: "🐱", name: "小猫", pluralName: "只小猫" },
  { emoji: "🐶", name: "小狗", pluralName: "只小狗" },
  { emoji: "🚗", name: "汽车", pluralName: "辆汽车" },
  { emoji: "⭐", name: "星星", pluralName: "颗星星" },
  { emoji: "🐟", name: "小鱼", pluralName: "条小鱼" }
] as const;

const CHINESE_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;

export function clampNumber(value: number, min = 1, max = 100): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function toChineseNumber(value: number): string {
  const number = Math.trunc(value);

  if (number < 0 || number > 100) {
    throw new RangeError("数字必须在 0～100 之间");
  }

  if (number < 10) {
    return CHINESE_DIGITS[number];
  }

  if (number === 100) {
    return "一百";
  }

  const tens = Math.floor(number / 10);
  const units = number % 10;
  const tensText = tens === 1 ? "十" : `${CHINESE_DIGITS[tens]}十`;

  return units === 0 ? tensText : `${tensText}${CHINESE_DIGITS[units]}`;
}

export function getNumberItem(value: number): NumberItem {
  const number = clampNumber(value);
  const index = Math.floor((number - 1) / 10) % NUMBER_ITEMS.length;
  return NUMBER_ITEMS[index];
}

export function createQuantityGroups(value: number): number[] {
  const number = clampNumber(value);
  const groups: number[] = [];
  let remaining = number;

  while (remaining > 0) {
    const groupSize = Math.min(10, remaining);
    groups.push(groupSize);
    remaining -= groupSize;
  }

  return groups;
}

export type NumberRange = {
  start: number;
  end: number;
  label: string;
  key: string;
};

export const NUMBER_RANGES: readonly NumberRange[] = Array.from({ length: 10 }, (_, index) => {
  const start = index * 10 + 1;
  const end = start + 9;
  return {
    start,
    end,
    label: `${start}～${end}`,
    key: `${start}-${end}`
  };
});

export function getRangeForNumber(value: number): NumberRange {
  const number = clampNumber(value);
  return NUMBER_RANGES[Math.floor((number - 1) / 10)];
}

export function createAnswerOptions(target: number, random: () => number = Math.random): number[] {
  const safeTarget = clampNumber(target, 1, 10);
  const alternatives = Array.from({ length: 10 }, (_, index) => index + 1)
    .filter((value) => value !== safeTarget);

  for (let index = alternatives.length - 1; index > 0; index -= 1) {
    const sample = random();
    const normalized = Number.isFinite(sample) ? Math.min(0.999999, Math.max(0, sample)) : 0;
    const nextIndex = Math.floor(normalized * (index + 1));
    [alternatives[index], alternatives[nextIndex]] = [alternatives[nextIndex], alternatives[index]];
  }

  const values = [safeTarget, alternatives[0], alternatives[1]];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const sample = random();
    const normalized = Number.isFinite(sample) ? Math.min(0.999999, Math.max(0, sample)) : 0;
    const nextIndex = Math.floor(normalized * (index + 1));
    [values[index], values[nextIndex]] = [values[nextIndex], values[index]];
  }

  return values;
}
