/**
 * Safely checks if a beacon has a token cost
 * @param tokenCost The token cost value which might be null or undefined
 * @returns True if the beacon has a non-zero token cost
 */
export const hasTokenCost = (tokenCost: number | null | undefined): boolean => {
  return typeof tokenCost === 'number' && tokenCost !== 0;
};

/**
 * Safely determines if a token value represents a reward
 * @param tokenCost The token cost value which might be null or undefined
 * @returns True if the token value represents a reward (negative value)
 */
export const isTokenReward = (tokenCost: number | null | undefined): boolean => {
  return typeof tokenCost === 'number' && tokenCost < 0;
};

/**
 * Safely gets the absolute token amount
 * @param tokenCost The token cost value which might be null or undefined
 * @returns The absolute token amount or 0 if invalid
 */
export const getTokenAmount = (tokenCost: number | null | undefined): number => {
  return typeof tokenCost === 'number' ? Math.abs(tokenCost) : 0;
};

/**
 * Gets a formatted token string with $BOND suffix
 * @param tokenCost The token cost value which might be null or undefined
 * @returns A formatted string like "5 $BOND" or "0 $BOND" if invalid
 */
export const formatTokenAmount = (tokenCost: number | null | undefined): string => {
  return `${getTokenAmount(tokenCost)} $BOND`;
}; 