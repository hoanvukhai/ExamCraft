# CODEX — chat AI V2

- task_id: CHAT-AI-V2-COMPLETION
- state: WAITING_REVIEW
- worktree: F:/Workspace/Zazz/ExamCraft/tmp/chat-ai-v2
- branch: codex/chat-ai-v2
- commit mã gần nhất: 5f6bf4d (mã + test cùng commit; nền đợt 909d297).
- Đã xong tuyến kỹ thuật: bootstrap thật, giữ/khôi phục chat, lựa chọn định danh, key/error/cancel, metadata+nhiều câu nguyên tử, sinh trọn đề/core chung, scoped insertion/grade checks, undo/redo chung, xem hình/đáp án và giao bài không bịa thời lượng.
- Đã kiểm: CI đầy đủ, HTTP/pilot, integration PostgreSQL, chat xuyên suốt với provider giả, hồi quy Đ0–Đ2/editor và guards. Số liệu/log/giới hạn chỉ ở qa/rebuild-2026-11-03/ai-chat-completion/BAO_CAO.md và CHECK_RESULTS.json.
- Bản cho người dùng thử: localhost:3123, DB thử tách riêng; health isolatedTest=false chặn automated tests. Codex không gọi provider thật; người dùng tự thêm key/gửi nếu muốn. Bí mật mã hóa hiện có được giữ. Tài khoản manual/local identities được giữ cho người dùng thử, không ghi mật khẩu vào hồ sơ.
- Không push/main/deploy/migration, không ghi DB chính, không sửa checklist/02/ASSIGNMENTS/BATCH_REVIEWS của Claude.
- Bước kế: người dùng thử thật; Claude duyệt DOI_CHIEU.md, các giới hạn hợp đồng/nguồn/chuyên môn và quyết định tích hợp. Không tự ghi DONE hoặc tự đóng CV.
- Tệp cần giữ: toàn bộ nhóm báo cáo hiện tại, nhánh mã, source snapshot, bản nháp/đề xuất riêng, và manual-preview-identities.json local (không Git). Không quay về worktree C/tmp/chat-ai-v2 cũ.
