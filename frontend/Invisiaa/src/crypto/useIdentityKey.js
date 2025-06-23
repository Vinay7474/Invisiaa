// useIdentityKey.js (or inside your ChatPage)
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export function generateIdentityKeyPair(secretCode) {
  // Step 1: Generate key pair
  const keyPair = nacl.box.keyPair(); // X25519 key pair
  const publicKey = keyPair.publicKey; // Uint8Array(32)
  const privateKey = keyPair.secretKey; // Uint8Array(32)

  // Step 2: Derive key from secret code (pad/truncate to 32 bytes)
  const keyBytes = naclUtil.decodeUTF8(secretCode.padEnd(32).slice(0, 32));

  // Step 3: Encrypt the private key using secretbox
  const nonce = nacl.randomBytes(24); // 192-bit nonce
  const encryptedPrivateKey = nacl.secretbox(privateKey, nonce, keyBytes);

  // Step 4: Return base64 encoded values
  return {
    publicKey: naclUtil.encodeBase64(publicKey),
    encryptedPrivateKey: naclUtil.encodeBase64(encryptedPrivateKey),
    nonce: naclUtil.encodeBase64(nonce),
  };
}

