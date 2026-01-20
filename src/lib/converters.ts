// Conversion utilities
export const converters = {
  ethToWei: (eth: number): bigint =>
    BigInt(Math.floor(eth * 1e18)),
  
  weiToEth: (wei: bigint): number =>
    Number(wei) / 1e18,
  
  minutesToSeconds: (minutes: number): number =>
    minutes * 60,
  
  secondsToMinutes: (seconds: number): number =>
    seconds / 60,
  
  percentToDecimal: (percent: number): number =>
    percent / 100,
  
  decimalToPercent: (decimal: number): number =>
    decimal * 100,
} as const;
