export interface InvestmentContributionRow {
  id: string;
  name: string;
  type: string;
  user_id: string;
  scope: string;
  monthly_contribution_amount: number | null;
  monthly_contribution_day: number | null;
  partner_contribution_amount: number | null;
  partner_contribution_day: number | null;
}

export interface InvTransactionRow {
  id: string;
  investment_id: string;
  type: string;
  amount: number;
  date: string;
  contributor_user_id: string | null;
  auto_generated: boolean;
}

export interface AporteCardData {
  investment: InvestmentContributionRow;
  expectedAmount: number;
  scheduledDay: number;
  confirmed: boolean;
  confirmedAmount?: number;
  confirmedDate?: string;
}

/**
 * Computes the list of AporteCardData for the current user in a given month.
 *
 * For each investment:
 * - If the user is the owner (user_id === currentUserId): use monthly_contribution_amount/day
 * - If the investment is family-scoped and has partner fields, and the user is NOT the owner:
 *   use partner_contribution_amount/day
 *
 * Confirmation is checked via investment_transactions with:
 *   type === "deposit", auto_generated === false, contributor_user_id === currentUserId,
 *   date starts with currentMonth.
 */
export function computeAporteCards(
  investments: InvestmentContributionRow[],
  invTransactions: InvTransactionRow[],
  currentMonth: string,
  currentUserId: string
): AporteCardData[] {
  const cards: AporteCardData[] = [];

  for (const inv of investments) {
    const isOwner = inv.user_id === currentUserId;
    const isFamily = inv.scope === "family";

    let expectedAmount: number | null = null;
    let scheduledDay: number | null = null;

    if (isOwner) {
      expectedAmount = inv.monthly_contribution_amount;
      scheduledDay = inv.monthly_contribution_day;
    } else if (isFamily) {
      expectedAmount = inv.partner_contribution_amount;
      scheduledDay = inv.partner_contribution_day;
    }

    if (expectedAmount == null || scheduledDay == null) continue;

    // Find confirmation: manual deposit in this month by this user
    const confirmation = invTransactions.find(
      (tx) =>
        tx.investment_id === inv.id &&
        tx.type === "deposit" &&
        tx.auto_generated === false &&
        tx.contributor_user_id === currentUserId &&
        tx.date.startsWith(currentMonth)
    );

    cards.push({
      investment: inv,
      expectedAmount,
      scheduledDay,
      confirmed: !!confirmation,
      confirmedAmount: confirmation?.amount,
      confirmedDate: confirmation?.date,
    });
  }

  return cards;
}
