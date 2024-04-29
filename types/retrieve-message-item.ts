export type RetrieveMessageItem = {
  hash: string;
  expiration: number;
  data: string; // base64 encrypted content of the emssage
  timestamp: number;
};