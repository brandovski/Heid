export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Dado a data de uma transação, o closing_day e o due_day do cartão,
 * retorna o mês de vencimento da fatura (YYYY-MM) ao qual ela pertence.
 * Se due_day < closing_day → vencimento é no mês seguinte ao fechamento.
 * Se due_day >= closing_day → vencimento é no mesmo mês do fechamento.
 */
export function getInvoiceMonth(transactionDate: string, closingDay: number, dueDay: number): string {
  const [year, month, day] = transactionDate.split("-").map(Number);
  let closingMonth: string;
  if (day > closingDay) {
    const d = new Date(year, month, 1); // month já é 1-indexed, então month = next month index
    closingMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  } else {
    closingMonth = `${year}-${String(month).padStart(2, "0")}`;
  }
  // Converte mês de fechamento → mês de vencimento
  return dueDay < closingDay ? shiftMonth(closingMonth, 1) : closingMonth;
}

/**
 * Retorna o range de datas [start, end] que cobre todas as transações
 * pertencentes ao ciclo de faturamento do mês de vencimento `dueMonth`
 * com `closingDay` e `dueDay`.
 * Ciclo: dia (closingDay+1) de 2 meses antes até dia closingDay do mês anterior ao vencimento.
 */
export function getFatureDateRange(dueMonth: string, closingDay: number, dueDay: number): { start: string; end: string } {
  // Converte mês de vencimento → mês de fechamento
  const closingMonth = dueDay < closingDay ? shiftMonth(dueMonth, -1) : dueMonth;
  const [year, month] = closingMonth.split("-").map(Number);
  // Mês anterior ao fechamento
  const prevDate = new Date(year, month - 2, 1); // month-2 porque month é 1-indexed
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  // Dia de início: closing_day + 1 do mês anterior (clamped ao último dia do mês anterior)
  const prevLastDay = new Date(year, month - 1, 0).getDate();
  const startDay = Math.min(closingDay + 1, prevLastDay);
  // Dia de fim: closing_day do mês de fechamento (clamped ao último dia do mês)
  const currLastDay = new Date(year, month, 0).getDate();
  const endDay = Math.min(closingDay, currLastDay);

  return {
    start: `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`,
    end: `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`,
  };
}
