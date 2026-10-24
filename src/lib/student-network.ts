/** Bound both sending a student request and reading its body; keep callers free to retry. */
export async function withStudentRequestTimeout<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs = 20_000): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('Máy chủ chưa phản hồi kịp. Câu trả lời vẫn giữ trên trang này; hãy kiểm tra mạng rồi thử lại.'));
          controller.abort();
        }, timeoutMs);
      }),
    ]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}
