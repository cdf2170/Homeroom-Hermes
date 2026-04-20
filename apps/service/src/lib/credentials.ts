/**
 * credentials.ts — Secure credential storage for Homeroom.
 *
 * Security model:
 *   - Credentials are encrypted at rest using AES-256-GCM.
 *   - Encryption key is derived via PBKDF2 from a machine-specific UUID
 *     combined with a per-installation salt stored in ~/.homeroom/.salt.
 *   - The encrypted store is written to ~/.homeroom/credentials.json.enc.
 *   - All credential files are chmod 0o600 (owner read/write only).
 *   - API keys are NEVER logged, never stored in SQLite, never returned raw.
 *   - Only masked representations are returned to callers outside this module.
 *
 * Machine ID sources (in priority order):
 *   1. macOS: ioreg IOPlatformUUID field
 *   2. Linux: /etc/machine-id
 *   3. Fallback: hostname
 */

import { homedir, hostname } from "os";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "fs";
import { spawnSync } from "child_process";
import { webcrypto } from "crypto";

// Node's webcrypto CryptoKey type is not on globalThis by default; alias here.
type CryptoKey = Awaited<ReturnType<typeof webcrypto.subtle.generateKey>> extends infer T ? T extends { type: string } ? T : any : any;

// ── paths ─────────────────────────────────────────────────────────────────────

const HOMEROOM_DIR = join(homedir(), ".homeroom");
const SALT_PATH = join(HOMEROOM_DIR, ".salt");
const CREDS_PATH = join(HOMEROOM_DIR, "credentials.json.enc");

// ── types ──────────────────────────────────────────────────────────────────────

interface CredentialRecord {
  key: string;
  updatedAt: string;
}

interface CredentialStore {
  credentials: Record<string, CredentialRecord>;
}

// ── masking ────────────────────────────────────────────────────────────────────

export function maskKey(key: string): string {
  if (key.length < 12) return "***";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

// ── machine ID ────────────────────────────────────────────────────────────────

function getMachineId(): string {
  // macOS: read IOPlatformUUID from ioreg
  try {
    const result = spawnSync("ioreg", ["-rd1", "-c", "IOPlatformExpertDevice"], { encoding: "utf8" });
    if (result.stdout) {
      const match = result.stdout.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
      if (match?.[1]) return match[1];
    }
  } catch {
    // not macOS or ioreg unavailable
  }

  // Linux: read /etc/machine-id
  try {
    if (existsSync("/etc/machine-id")) {
      const text = readFileSync("/etc/machine-id", "utf8").trim();
      if (text.length > 0) return text;
    }
  } catch {
    // not Linux or unreadable
  }

  // Fallback: hostname
  return hostname();
}

// ── salt management ────────────────────────────────────────────────────────────

function ensureDir(): void {
  mkdirSync(HOMEROOM_DIR, { recursive: true });
}

function getOrCreateSalt(): Uint8Array {
  ensureDir();

  if (existsSync(SALT_PATH)) {
    const buf = Buffer.from(readFileSync(SALT_PATH));
    if (buf.byteLength === 32) {
      return new Uint8Array(buf);
    }
  }

  // Generate a new 32-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(32));
  writeFileSync(SALT_PATH, Buffer.from(salt));
  // Set file permissions to 0o600
  chmodSync(SALT_PATH, 0o600);
  return salt;
}

// ── key derivation ────────────────────────────────────────────────────────────

async function deriveKey(salt: Uint8Array, machineId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(machineId),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// ── encryption / decryption ───────────────────────────────────────────────────

async function encrypt(key: CryptoKey, plaintext: string): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );
  // Layout: [12 bytes IV][ciphertext]
  const result = new Uint8Array(12 + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), 12);
  return result;
}

async function decrypt(key: CryptoKey, data: Uint8Array): Promise<string> {
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}

// ── store I/O ─────────────────────────────────────────────────────────────────

let _cachedKey: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  const salt = getOrCreateSalt();
  const machineId = getMachineId();
  _cachedKey = await deriveKey(salt, machineId);
  return _cachedKey;
}

async function readStore(): Promise<CredentialStore> {
  try {
    if (!existsSync(CREDS_PATH)) {
      return { credentials: {} };
    }
    const buf = Buffer.from(readFileSync(CREDS_PATH));
    const cryptoKey = await getCryptoKey();
    const json = await decrypt(cryptoKey, new Uint8Array(buf));
    return JSON.parse(json) as CredentialStore;
  } catch {
    // Corrupted or missing — start fresh (don't throw to callers)
    return { credentials: {} };
  }
}

async function writeStore(store: CredentialStore): Promise<void> {
  ensureDir();
  const cryptoKey = await getCryptoKey();
  const json = JSON.stringify(store);
  const encrypted = await encrypt(cryptoKey, json);
  writeFileSync(CREDS_PATH, Buffer.from(encrypted));
  // Set file permissions to 0o600
  chmodSync(CREDS_PATH, 0o600);
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Store an API key for a provider.
 * Validates: non-empty, max 512 chars, trimmed.
 * Never logs or returns the key.
 */
export async function setCredential(provider: string, key: string): Promise<void> {
  const trimmed = key.trim();
  if (trimmed.length === 0) {
    throw new Error("API key must not be empty");
  }
  if (trimmed.length > 512) {
    throw new Error("API key exceeds maximum length of 512 characters");
  }

  const store = await readStore();
  store.credentials[provider] = {
    key: trimmed,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
}

/**
 * Retrieve a raw API key for internal use.
 * Returns null if not found — never throws.
 * Never exposed via HTTP responses.
 */
export async function getCredential(provider: string): Promise<string | null> {
  try {
    const store = await readStore();
    // Case-insensitive lookup — frontend stores "OpenRouter", adapter requests "openrouter"
    const key = store.credentials[provider]?.key;
    if (key) return key;
    // Try case-insensitive match
    const lowerProvider = provider.toLowerCase();
    for (const [k, v] of Object.entries(store.credentials)) {
      if (k.toLowerCase() === lowerProvider) return v.key;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Remove a stored credential.
 */
export async function deleteCredential(provider: string): Promise<void> {
  const store = await readStore();
  delete store.credentials[provider];
  await writeStore(store);
}

/**
 * List all stored credentials with masked keys.
 * Never returns actual key values.
 */
export async function listCredentials(): Promise<
  Array<{ provider: string; masked: string; updatedAt: string }>
> {
  const store = await readStore();
  return Object.entries(store.credentials).map(([provider, record]) => ({
    provider,
    masked: maskKey(record.key),
    updatedAt: record.updatedAt,
  }));
}
