/**
 * Quản lý kho API Key xoay tua (Multi-Key Rotation Pool)
 * Tự động đọc tất cả các key: GEMINI_API_KEY_1, GEMINI_API_KEY_2,... hoặc GEMINI_API_KEYS
 * Hỗ trợ tự động fallback sang key kế tiếp khi gặp lỗi rate limit (429) hoặc quota.
 */

let currentKeyIndex = 0;

export function getAllGeminiKeys(): string[] {
  const keys: string[] = [];

  // 1. Đọc từ biến đơn lẻ GEMINI_API_KEY nếu có
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }

  // 2. Đọc từ danh sách cách nhau bằng dấu phẩy GEMINI_API_KEYS
  if (process.env.GEMINI_API_KEYS) {
    const splitKeys = process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean);
    keys.push(...splitKeys);
  }

  // 3. Đọc từ các biến đánh số GEMINI_API_KEY_1, GEMINI_API_KEY_2,... đến 50
  for (let i = 1; i <= 50; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      keys.push(key.trim());
    }
  }

  // Loại bỏ các key trùng lặp
  return Array.from(new Set(keys));
}

/**
 * Lấy model Gemini được chỉ định qua biến môi trường (mặc định gemini-3.8-flash)
 */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.8-flash';
}

/**
 * Lấy key tiếp theo theo thuật toán Round-Robin (Xoay vòng tròn)
 */
export function getNextGeminiKey(customKey?: string): string | null {
  if (customKey && customKey.trim()) {
    return customKey.trim();
  }

  const keys = getAllGeminiKeys();
  if (keys.length === 0) return null;

  const selectedKey = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;

  return selectedKey;
}

/**
 * Thực thi một tác vụ gọi Gemini với cơ chế tự động thử lại trên Key tiếp theo nếu gặp lỗi Rate Limit (429)
 */
export async function executeWithKeyRotation<T>(
  customKey: string | undefined,
  operation: (apiKey: string) => Promise<T>
): Promise<T> {
  // Nếu người dùng cung cấp key tùy biến (BYOK), dùng trực tiếp key đó
  if (customKey && customKey.trim()) {
    return await operation(customKey.trim());
  }

  const keys = getAllGeminiKeys();
  if (keys.length === 0) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong hệ thống.');
  }

  const maxAttempts = Math.min(keys.length, 7);
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const apiKey = getNextGeminiKey();
    if (!apiKey) break;

    try {
      return await operation(apiKey);
    } catch (err: unknown) {
      lastError = err;
      const errorMsg = String(err);
      console.warn(`[GeminiKeyPool] Lỗi khi gọi với key (lần thử ${attempt + 1}/${maxAttempts}):`, errorMsg);

      // Nhận diện các lỗi có thể thử lại: 429 (Rate Limit), 503 (Server High Demand), 500 (Internal), RESOURCE_EXHAUSTED
      const isRetryable = 
        errorMsg.includes('429') || 
        errorMsg.includes('503') || 
        errorMsg.includes('500') ||
        errorMsg.includes('quota') || 
        errorMsg.includes('RESOURCE_EXHAUSTED') ||
        errorMsg.includes('UNAVAILABLE') ||
        errorMsg.includes('high demand');

      if (isRetryable && attempt < maxAttempts - 1) {
        // Đợi một khoảng ngắn (jitter backoff) trước khi thử key tiếp theo
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        continue;
      }

      if (!isRetryable) {
        throw err;
      }
    }
  }

  // Format thông báo lỗi tiếng Việt thân thiện thay vì ném JSON thô
  const finalErrorMsg = String(lastError);
  if (finalErrorMsg.includes('503') || finalErrorMsg.includes('UNAVAILABLE') || finalErrorMsg.includes('high demand')) {
    throw new Error('Máy chủ Google AI hiện đang quá tải tạm thời (Spikes in demand 503). Hệ thống đã tự động thử xoay tua qua các API Key. Thầy/Cô vui lòng thử lại sau vài giây.');
  }
  if (finalErrorMsg.includes('429') || finalErrorMsg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('Các API Key hiện đã chạm hạn mức số lượt gọi (Rate Limit 429). Thầy/Cô vui lòng đợi khoảng 15-30 giây để hệ thống phục hồi.');
  }

  throw lastError || new Error('Tất cả API Key trong Rotation Pool đều thất bại.');
}
