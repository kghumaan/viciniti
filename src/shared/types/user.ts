export type User = {
  email: string;
  name: string;
  publicAddress: string;
  privKey: string;
  avatar?: string;
  tokenBalance: number; // User's token balance
}; 