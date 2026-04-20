import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY ?? "", "hex");

export function encrypt(plaintext: string): string {
  if (KEY.length !== 32) throw new Error("ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format: iv(24) + tag(32) + ciphertext
  return iv.toString("hex") + tag.toString("hex") + encrypted.toString("hex");
}

export function decrypt(ciphertext: string): string {
  if (KEY.length !== 32) throw new Error("ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  const iv = Buffer.from(ciphertext.slice(0, 24), "hex");
  const tag = Buffer.from(ciphertext.slice(24, 56), "hex");
  const encrypted = Buffer.from(ciphertext.slice(56), "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
