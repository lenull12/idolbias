import type { CardGrade } from "@/db/schema";

export const GRADE_WEIGHTS: Record<CardGrade, number> = {
  standard: 60,
  fine: 25,
  mint: 10,
  pristine: 4,
  gem: 1,
};

export const GRADE_VALUE_MULTIPLIER: Record<CardGrade, number> = {
  standard: 1,
  fine: 1.5,
  mint: 2.5,
  pristine: 4,
  gem: 8,
};

export const GRADE_ORDER: CardGrade[] = ["standard", "fine", "mint", "pristine", "gem"];

export function rollGrade(): CardGrade {
  const total = GRADE_ORDER.reduce((s, g) => s + GRADE_WEIGHTS[g], 0);
  let roll = Math.random() * total;
  for (const g of GRADE_ORDER) {
    roll -= GRADE_WEIGHTS[g];
    if (roll <= 0) return g;
  }
  return "standard";
}
