"use client";
/**
 * End-to-end encryption with libsodium. The server only ever sees ciphertext.
 * Every message gets a fresh symmetric key (secretbox); that key is sealed
 * (crypto_box_seal) to each recipient's public key, and to the sender's own.
 */
let sodiumPromise;
async function lib() {
  if (!sodiumPromise) {
    sodiumPromise = import("libsodium-wrappers").then(async (m) => {
      const s = m.default ?? m;
      await s.ready;
      return s;
    });
  }
  return sodiumPromise;
}

const storageKey = (personId) => `himsetu.key.${personId}`;

/** Load this device's keypair for a person, creating it on first use. */
export async function getOrCreateKeypair(personId) {
  const s = await lib();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(personId)) ?? "null");
    if (saved) return { publicKey: saved.pk, privateKey: saved.sk, created: false };
  } catch {}
  const kp = s.crypto_box_keypair();
  const pk = s.to_base64(kp.publicKey);
  const sk = s.to_base64(kp.privateKey);
  try {
    localStorage.setItem(storageKey(personId), JSON.stringify({ pk, sk }));
  } catch {}
  return { publicKey: pk, privateKey: sk, created: true };
}

/** Encrypt text for a list of { _id, publicKey }. Returns fields for messages.send. */
export async function encryptFor(text, recipients) {
  const s = await lib();
  const key = s.crypto_secretbox_keygen();
  const nonce = s.randombytes_buf(s.crypto_secretbox_NONCEBYTES);
  const cipher = s.crypto_secretbox_easy(s.from_string(text), nonce, key);
  const keys = recipients
    .filter((r) => r.publicKey)
    .map((r) => ({ personId: r._id, sealed: s.to_base64(s.crypto_box_seal(key, s.from_base64(r.publicKey))) }));
  return { ciphertext: s.to_base64(cipher), nonce: s.to_base64(nonce), keys, bytes: cipher.length };
}

/** Try to decrypt a message for a person using this device's private key. */
export async function decryptFor(message, personId) {
  const s = await lib();
  const entry = message.keys.find((k) => k.personId === personId);
  if (!entry) return null;
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey(personId)) ?? "null");
  } catch {}
  if (!saved) return null;
  try {
    const key = s.crypto_box_seal_open(s.from_base64(entry.sealed), s.from_base64(saved.pk), s.from_base64(saved.sk));
    const plain = s.crypto_secretbox_open_easy(s.from_base64(message.ciphertext), s.from_base64(message.nonce), key);
    return s.to_string(plain);
  } catch {
    return null;
  }
}

/** Bytes the ciphertext will take on the wire (plaintext + 16 byte MAC). */
export function wireBytes(text) {
  return new TextEncoder().encode(text).length + 16;
}
