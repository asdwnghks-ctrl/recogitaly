import type { Expense, Member, SettlementConfirmation, SettlementRound } from "@/lib/types";

export type SettlementTransfer = {
  fromMemberId: string;
  toMemberId: string;
  amountKrw: number;
  amountEur: number;
};

export type MemberSettlement = {
  memberId: string;
  paidKrw: number;
  shareKrw: number;
  balanceKrw: number;
  paidEur: number;
  shareEur: number;
  balanceEur: number;
};

export function getExchangeRate() {
  const rawRate = Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE_EUR_KRW);
  return Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 1600;
}

export function normalizeExpenseAmount(amount: number, currency: "EUR" | "KRW", eurToKrw = getExchangeRate()) {
  if (currency === "EUR") {
    return {
      exchangeRateToKrw: eurToKrw,
      amountKrw: roundMoney(amount * eurToKrw),
      amountEur: roundMoney(amount)
    };
  }

  return {
    exchangeRateToKrw: 1,
    amountKrw: roundMoney(amount),
    amountEur: roundMoney(amount / eurToKrw)
  };
}

export function getOpenRound(rounds: SettlementRound[]) {
  return rounds.find((round) => round.status === "open") ?? null;
}

export function calculateSettlement(
  members: Member[],
  expenses: Expense[],
  openRound: SettlementRound | null,
  confirmations: SettlementConfirmation[]
) {
  const sharedExpenses = expenses.filter(
    (expense) => expense.type === "shared" && (!openRound || expense.settlementRoundId === openRound.id)
  );
  const totalKrw = roundMoney(sharedExpenses.reduce((sum, expense) => sum + expense.amountKrw, 0));
  const totalEur = roundMoney(sharedExpenses.reduce((sum, expense) => sum + expense.amountEur, 0));
  const shareKrw = members.length ? roundMoney(totalKrw / members.length) : 0;
  const shareEur = members.length ? roundMoney(totalEur / members.length) : 0;

  const memberRows: MemberSettlement[] = members.map((member) => {
    const paidKrw = roundMoney(
      sharedExpenses
        .filter((expense) => expense.paidByMemberId === member.id)
        .reduce((sum, expense) => sum + expense.amountKrw, 0)
    );
    const paidEur = roundMoney(
      sharedExpenses
        .filter((expense) => expense.paidByMemberId === member.id)
        .reduce((sum, expense) => sum + expense.amountEur, 0)
    );

    return {
      memberId: member.id,
      paidKrw,
      shareKrw,
      balanceKrw: roundMoney(paidKrw - shareKrw),
      paidEur,
      shareEur,
      balanceEur: roundMoney(paidEur - shareEur)
    };
  });

  const debtors = memberRows
    .filter((row) => row.balanceKrw < -1)
    .map((row) => ({ ...row, remaining: Math.abs(row.balanceKrw) }))
    .sort((a, b) => b.remaining - a.remaining);
  const creditors = memberRows
    .filter((row) => row.balanceKrw > 1)
    .map((row) => ({ ...row, remaining: row.balanceKrw }))
    .sort((a, b) => b.remaining - a.remaining);
  const transfers: SettlementTransfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountKrw = roundMoney(Math.min(debtor.remaining, creditor.remaining));

    if (amountKrw > 0) {
      transfers.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amountKrw,
        amountEur: roundMoney(amountKrw / getExchangeRate())
      });
    }

    debtor.remaining = roundMoney(debtor.remaining - amountKrw);
    creditor.remaining = roundMoney(creditor.remaining - amountKrw);

    if (debtor.remaining <= 1) debtorIndex += 1;
    if (creditor.remaining <= 1) creditorIndex += 1;
  }

  return {
    totalKrw,
    totalEur,
    members: memberRows,
    transfers,
    confirmations: openRound
      ? confirmations.filter((confirmation) => confirmation.settlementRoundId === openRound.id)
      : []
  };
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
