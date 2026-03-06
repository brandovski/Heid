/**
 * Dado a data de uma transação e o closing_day do cartão,
 * retorna o mês da fatura (YYYY-MM) ao qual ela pertence.
 * day <= closingDay → mesmo mês | day > closingDay → mês seguinte
 */
export function getInvoiceMonth(transactionDate: string, closingDay: number): string {
  const [year, month, day] = transactionDate.split("-").map(Number);
  if (day > closingDay) {
    const d = new Date(year, month, 1); // month já é 1-indexed, então month = next month index
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Retorna o range de datas [start, end] que cobre todas as transações
 * pertencentes ao ciclo de faturamento do mês `invoiceMonth` com `closingDay`.
 * Ciclo: dia (closingDay+1) do mês anterior até dia closingDay do mês atual.
 */
export function getFatureDateRange(invoiceMonth: string, closingDay: number): { start: string; end: string } {
  const [year, month] = invoiceMonth.split("-").map(Number);
  // Mês anterior
  const prevDate = new Date(year, month - 2, 1); // month-2 porque month é 1-indexed
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  // Dia de início: closing_day + 1 do mês anterior (clamped ao último dia do mês anterior)
  const prevLastDay = new Date(year, month - 1, 0).getDate();
  const startDay = Math.min(closingDay + 1, prevLastDay);
  // Dia de fim: closing_day do mês atual (clamped ao último dia do mês atual)
  const currLastDay = new Date(year, month, 0).getDate();
  const endDay = Math.min(closingDay, currLastDay);

  return {
    start: `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`,
    end: `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`,
  };
}
