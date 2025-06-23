import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

/**
 * Generates a one-time ephemeral key pair for secure communication.
 * This key is not stored permanently and is meant for temporary session encryption.
 */
export function generateEphemeralKeyPair() {
  const keyPair = nacl.box.keyPair(); // Generates X25519 key pair
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    privateKey: naclUtil.encodeBase64(keyPair.secretKey),
  };
}
