// LEGAL: The vault in Arjun's flat above the garage. Cash in the vault isn't in your pocket, so
// LEGAL: anything that takes a share of the cash you carry (a pay-off, a shakedown) can't reach it.
export interface Holdings { cash: number; vault: number }

export function depositToVault(holdings: Holdings, amount: number): Holdings {
  const moved = Math.max(0, Math.min(amount, holdings.cash));
  return { cash: holdings.cash - moved, vault: holdings.vault + moved };
}

export function withdrawFromVault(holdings: Holdings, amount: number): Holdings {
  const moved = Math.max(0, Math.min(amount, holdings.vault));
  return { cash: holdings.cash + moved, vault: holdings.vault - moved };
}
