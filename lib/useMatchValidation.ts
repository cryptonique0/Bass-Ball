import { useCallback } from 'react';
import { MatchRecord, GuestPlayer } from './guestMode';
import { MatchValidator, ValidationResult } from './matchValidator';

/**
 * Hook for validating matches and displaying validation results
 */
export function useMatchValidation() {
  const validateAndRecordMatch = useCallback(
    (match: MatchRecord, playerHistory: MatchRecord[]): ValidationResult => {
      return MatchValidator.validateMatch(match, undefined, playerHistory);
    },
    []
  );

  const getSuspiciousMatches = useCallback(
    (player: GuestPlayer): MatchRecord[] => {
      return player.matchHistory.filter(match => {
        const validation = MatchValidator.validateMatch(match, undefined, player.matchHistory);
        return MatchValidator.isSuspicious(validation);
      });
    },
    []
  );

  const getValidationReport = useCallback(
    (result: ValidationResult): string => {
      return MatchValidator.generateReport(result);
    },
    []
  );

  const buildPlayerProfile = useCallback(
    (matchHistory: MatchRecord[]) => {
      return MatchValidator.buildPlayerProfile(matchHistory);
    },
    []
  );

  return {
    validateAndRecordMatch,
    getSuspiciousMatches,
    getValidationReport,
    buildPlayerProfile,
  };
}
