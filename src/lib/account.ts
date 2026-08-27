/** Code-based accounts: a 12-character code is the only credential. */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_KEY = "gym-account-code";

export function generateCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export const normalizeCode = (raw: string) =>
  raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

export const isValidCode = (code: string) =>
  code.length === 12 && [...code].every((c) => ALPHABET.includes(c));

export const formatCode = (code: string) =>
  code.replace(/(.{4})/g, "$1 ").trim();

export const codeEmail = (code: string) => `${code.toLowerCase()}@gymmemory.app`;
export const codePassword = (code: string) => `gm_${code}_v1`;

export function rememberCode(code: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(CODE_KEY, code);
}

export function storedCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CODE_KEY);
}

export function forgetCode() {
  if (typeof window !== "undefined") window.localStorage.removeItem(CODE_KEY);
}

const UNSAVED_KEY = "gym-code-unsaved";

export function markCodeUnsaved() {
  if (typeof window !== "undefined") window.localStorage.setItem(UNSAVED_KEY, "1");
}

export function isCodeUnsaved(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(UNSAVED_KEY) === "1";
}

export function markCodeSaved() {
  if (typeof window !== "undefined") window.localStorage.removeItem(UNSAVED_KEY);
}
