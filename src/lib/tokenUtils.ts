// Token utility functions
export const TOKEN_CONSTANTS = {
  DECIMALS: 18,
  MAX_SUPPLY: '1000000',
} as const;

export function parseTokenAmount(amount: string | number): bigint {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.floor(num * Math.pow(10, TOKEN_CONSTANTS.DECIMALS)));
}

export function formatTokenAmount(amount: bigint): string {
  const divisor = BigInt(Math.pow(10, TOKEN_CONSTANTS.DECIMALS));
  const quotient = amount / divisor;
  const remainder = amount % divisor;
  return `${quotient}.${remainder.toString().padStart(TOKEN_CONSTANTS.DECIMALS, '0')}`;
}

export function isValidTokenAmount(amount: bigint): boolean {
  return amount > 0n && amount <= parseTokenAmount(TOKEN_CONSTANTS.MAX_SUPPLY);
}

export function tokenAmountToWei(amount: number): string {
  return (amount * Math.pow(10, TOKEN_CONSTANTS.DECIMALS)).toString();
}
