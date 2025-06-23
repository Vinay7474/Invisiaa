import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';

export function computeSharedSecret(theirPublicKeyBase64, mySecretKeyBase64) {
  const theirPublicKey = decodeBase64(theirPublicKeyBase64);
  const mySecretKey = decodeBase64(mySecretKeyBase64);
  const sharedKey = nacl.box.before(theirPublicKey, mySecretKey);
  return encodeBase64(sharedKey);  // Uint8Array(32)
}
