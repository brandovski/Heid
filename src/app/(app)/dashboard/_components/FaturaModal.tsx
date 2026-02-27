"use client";

import { useRouter } from "next/navigation";
import PagarFaturaModal from "@/components/ui/PagarFaturaModal";
import type { CreditCardRow } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCardRow;
  referenceMonth: string;
  defaultAmount: number;
}

export default function FaturaModal({
  isOpen,
  onClose,
  card,
  referenceMonth,
  defaultAmount,
}: Props) {
  const router = useRouter();

  return (
    <PagarFaturaModal
      isOpen={isOpen}
      onClose={onClose}
      onSaved={() => router.refresh()}
      cartaoNome={card.name}
      totalAmount={defaultAmount}
      creditCardId={card.id}
      referenceMonth={referenceMonth}
    />
  );
}
