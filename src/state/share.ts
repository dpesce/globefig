import { normalizeConfig } from "./config";
import type { AppConfig } from "../types";

const HASH_PREFIX = "#config=";
const STORAGE_KEY = "globefig:last-project:v1";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64ToBytes(encoded: string): Uint8Array {
  const normalized = encoded.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeConfig(config: AppConfig): string {
  return bytesToBase64(new TextEncoder().encode(JSON.stringify(config)));
}

export function decodeConfig(encoded: string): AppConfig {
  const json = new TextDecoder().decode(base64ToBytes(encoded));
  return normalizeConfig(JSON.parse(json));
}

export function configFromLocation(): AppConfig | null {
  if (!window.location.hash.startsWith(HASH_PREFIX)) return null;
  try {
    return decodeConfig(window.location.hash.slice(HASH_PREFIX.length));
  } catch {
    return null;
  }
}

export function shareUrl(config: AppConfig): string {
  const url = new URL(window.location.href);
  url.hash = `${HASH_PREFIX}${encodeConfig(config)}`;
  return url.toString();
}

export function saveLocalConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Storage is an optional convenience; quota/privacy failures are non-fatal.
  }
}

export function loadLocalConfig(): AppConfig | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? normalizeConfig(JSON.parse(value)) : null;
  } catch {
    return null;
  }
}
