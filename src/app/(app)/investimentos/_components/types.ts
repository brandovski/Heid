import type { Investment, InvestmentTransaction, InvestmentSnapshot, InvestmentType } from "@/types/database";

export type { Investment, InvestmentTransaction, InvestmentSnapshot, InvestmentType };

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  cofrinho: "Cofrinho",
  cdb: "CDB",
  lci_lca: "LCI/LCA",
  tesouro_direto: "Tesouro Direto",
  renda_variavel: "Renda Variável",
  fii: "FII",
  fundo: "Fundo",
  previdencia: "Previdência",
  cripto: "Cripto",
  outro: "Outro",
};

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function calcTotalAportado(transactions: InvestmentTransaction[]): number {
  return transactions.reduce((sum, tx) => {
    return tx.type === "deposit" ? sum + tx.amount : sum - tx.amount;
  }, 0);
}

export function calcSaldoAtual(
  snapshots: InvestmentSnapshot[],
  transactions: InvestmentTransaction[]
): number | null {
  if (snapshots.length === 0 && transactions.length === 0) return null;

  if (snapshots.length === 0) {
    return calcTotalAportado(transactions);
  }

  // snapshots sorted DESC by date — first is most recent
  const last = snapshots[0];
  const afterNet = transactions
    .filter((tx) => tx.created_at > last.created_at)
    .reduce((s, tx) => (tx.type === "deposit" ? s + tx.amount : s - tx.amount), 0);

  return last.value + afterNet;
}

export function calcRentabilidadeReais(
  snapshots: InvestmentSnapshot[],
  transactions: InvestmentTransaction[]
): number | null {
  const saldo = calcSaldoAtual(snapshots, transactions);
  if (saldo === null) return null;
  const aportado = calcTotalAportado(transactions);
  return saldo - aportado;
}

export function calcRentabilidadePct(
  snapshots: InvestmentSnapshot[],
  transactions: InvestmentTransaction[]
): number | null {
  const rentReais = calcRentabilidadeReais(snapshots, transactions);
  if (rentReais === null) return null;
  const aportado = calcTotalAportado(transactions);
  if (aportado === 0) return null;
  return (rentReais / aportado) * 100;
}
