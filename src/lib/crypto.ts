import crypto from 'crypto';

/**
 * Lấy khóa mã hóa 32-byte từ SESSION_SECRET của hệ thống
 */
function getMasterEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET || 'examcraft-secret-master-encryption-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Che một phần API key để hiển thị an toàn trên giao diện (Ví dụ: AIzaSy...4xQ1)
 */
export function maskApiKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (trimmed.length <= 10) {
    return '••••••••••';
  }
  const prefix = trimmed.slice(0, 6);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Mã hóa API Key 2 chiều bằng chuẩn quân sự AES-256-GCM
 * Trả về chuỗi ciphertext, vector khởi tạo (IV) và Auth Tag để lưu vào Database.
 */
export function encryptApiKey(plainKey: string): {
  keyEncrypted: string;
  keyIv: string;
  keyTag: string;
  keyMasked: string;
} {
  const trimmed = plainKey.trim();
  if (!trimmed) {
    throw new Error('API Key không được để trống.');
  }

  const masterKey = getMasterEncryptionKey();
  const iv = crypto.randomBytes(12); // Chuẩn 12 bytes cho GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(trimmed, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    keyEncrypted: encrypted.toString('hex'),
    keyIv: iv.toString('hex'),
    keyTag: tag.toString('hex'),
    keyMasked: maskApiKey(trimmed),
  };
}

/**
 * Giải mã API Key bằng AES-256-GCM trong bộ nhớ RAM
 * Kiểm tra tính toàn vẹn thông qua Auth Tag.
 */
export function decryptApiKey(
  keyEncrypted: string,
  keyIv: string,
  keyTag: string
): string {
  const masterKey = getMasterEncryptionKey();
  const iv = Buffer.from(keyIv, 'hex');
  const tag = Buffer.from(keyTag, 'hex');
  const encryptedText = Buffer.from(keyEncrypted, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
