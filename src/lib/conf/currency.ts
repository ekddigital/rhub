/** Currency utilities — single source of truth for ¥↔$ conversions */

const DEFAULT_XR_RATE = 7.2;

export function fmtRmb(n: number): string {
  return `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function toUsd(rmb: number, rate: number = DEFAULT_XR_RATE): number {
  return rmb / rate;
}

export function fmtUsd(n: number): string {
  return `~$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

export function fmtDual(rmb: number, rate: number = DEFAULT_XR_RATE): string {
  return `${fmtRmb(rmb)} (${fmtUsd(toUsd(rmb, rate))})`;
}

export function calcItemTotal(qty: number, unitPrice: number): number {
  return Math.round(qty * unitPrice * 100) / 100;
}

export function calcBudgetTotal(
  items: { qty: number; unitPrice: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + calcItemTotal(item.qty, item.unitPrice),
    0,
  );
}
