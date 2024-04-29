export type SnodeSignatureResult = {
  timestamp: number;
  // sig_timestamp: number;
  signature: string;
  pubkey_ed25519: string;
  pubkey: string; // this is the x25519 key of the pubkey we are doing the request to (ourself for our swarm usually)
};