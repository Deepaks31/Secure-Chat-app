// End-to-end encryption utilities using Web Crypto API
// RSA-OAEP for asymmetric encryption

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

// Generate RSA key pair for user
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
  };
}

// Encrypt message using recipient's public key
export async function encryptMessage(message: string, publicKeyBase64: string): Promise<string> {
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
  
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );

  const encodedMessage = new TextEncoder().encode(message);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    encodedMessage
  );

  return arrayBufferToBase64(encryptedBuffer);
}

// Decrypt message using own private key
export async function decryptMessage(
  encryptedMessage: string,
  privateKeyBase64: string
): Promise<string> {
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
  
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );

  const encryptedBuffer = base64ToArrayBuffer(encryptedMessage);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// Helper functions for base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Store private key in localStorage (client-side only)
export function storePrivateKey(privateKey: string): void {
  localStorage.setItem('private_key', privateKey);
}

// Retrieve private key from localStorage
export function getPrivateKey(): string | null {
  return localStorage.getItem('private_key');
}

// Clear private key on logout
export function clearPrivateKey(): void {
  localStorage.removeItem('private_key');
}