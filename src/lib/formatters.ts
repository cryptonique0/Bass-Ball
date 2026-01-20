// Format utilities for display
export const formatters = {
  number: (n: number): string => n.toLocaleString(),
  
  currency: (n: number, currency: string = 'USD'): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(n),
  
  percent: (n: number, decimals: number = 2): string =>
    `${n.toFixed(decimals)}%`,
  
  bytes: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },
  
  duration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
} as const;
