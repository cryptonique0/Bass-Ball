// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateWalletAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const validateRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

export const validatePlayerStats = (stats: any): boolean => {
  const validStats = ['pace', 'shooting', 'passing', 'dribbling', 'defense', 'physical'];
  return validStats.every(stat => 
    stat in stats && typeof stats[stat] === 'number' && stats[stat] >= 1 && stats[stat] <= 99
  );
};

export const validateTeamSize = (players: any[]): boolean => {
  return players.length === 11;
};

export const validateFormation = (formation: string): boolean => {
  const validFormations = ['4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-4-2', '3-4-3'];
  return validFormations.includes(formation);
};
