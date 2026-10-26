# GEMINI status
task_id: GEMINI-PROMPT-CHECK
assignment_generation: 16
state: WAITING_REVIEW
updated_at_utc: 2026-10-26T09:50:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-X1: COMPLETED
  GEM-X2: COMPLETED
  GEM-X3: COMPLETED
  GEM-X4: COMPLETED
  GEM-X5: COMPLETED
  GEM-TEST-UAT: COMPLETED
  GEM-PROMPT-CHECK: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ kiểm tra lời nhắc sinh đề tại `qa/prompt-check-2026-10-26/HUONG_DAN_GEMINI.md`.
  - Sinh độc lập và chính xác 25 bộ đề thi theo lời nhắc hệ thống (systemInstruction) và cấu trúc kế hoạch (plan) trong 25 tệp `<mã>.prompt.json`:
    + Đầy đủ môn và khối lớp từ lớp 1 đến lớp 12, cùng các kỳ thi chuyên biệt: Chuyển cấp vào lớp 6 (Toán, Tiếng Việt), Tuyển sinh vào lớp 10 (Toán, Ngữ văn, Tiếng Anh), Thi thử tốt nghiệp THPT 2025 (Toán, Vật lý, Tiếng Anh), Đánh giá năng lực đại học (Toán), Học sinh giỏi cấp huyện/tỉnh (Toán 9, Hóa học 12), Kiểm tra định kỳ (Giữa kì I KHTN 6, Cuối kì II Tiếng Việt 4).
    + Đáp ứng 100% cấu trúc Zod schema (`validateGeneratedExam`), tuân thủ số lượng câu hỏi từng dạng (`numMultipleChoice`, `numTrueFalse`, `numShortAnswer`, `numEssay`), điểm số, đáp án đúng và lời giải chi tiết.
    + Xuất 25 tệp `<mã>.output.json` tại `qa/prompt-check-2026-10-26/`.
  - Chạy lệnh kiểm tra độc lập của hệ thống:
    `node --import tsx scripts/prompt-check.ts check qa/prompt-check-2026-10-26`
    $\rightarrow$ Kết quả: **Đạt 25/25; chưa có 0; 0 câu thiếu lời giải**. Báo cáo tự động lưu tại `qa/prompt-check-2026-10-26/KET_QUA.md`.
  - Lập báo cáo nhận xét chi tiết sư phạm tại `qa/prompt-check-2026-10-26/NHAN_XET.md` theo từng đề về loại kỳ thi, độ phù hợp cấp lớp, độ khó và tính chuẩn xác nội dung (đã kiểm tra qua `check-test-citations.cjs` đạt 0 missing).
  - Trước đó: Đã hoàn tất 100% đợt kiểm thử giao diện UAT 690 ô (Đ 425, B 94, K 0, chưa làm 171) tại `qa/test-run-2026-10-26-gemini/`.
Đang làm:
  - Hoàn tất nhiệm vụ GEM-PROMPT-CHECK.
Tiếp theo:
  - Sẵn sàng nhận nhiệm vụ tiếp theo từ Claude và chủ dự án.
Kiểm:
  - Tuân thủ nghiêm ngặt quy tắc an toàn: Không dùng/tìm khóa API, không gọi dịch vụ ngoài, không can thiệp cổng 3117/database, không sửa mã nguồn trong `scripts/`, `src/`, `tests/`.
Tệp giao trong batch:
  - qa/prompt-check-2026-10-26/*.output.json (25 tệp)
  - qa/prompt-check-2026-10-26/KET_QUA.md
  - qa/prompt-check-2026-10-26/NHAN_XET.md
  - qa/test-run-2026-10-26-gemini/ (toàn bộ suite)
  - qa/ai-review/coordination/messages/gemini-claude-20261026T094000Z-a3f8c12b-7e4d-49a6-8b2c-5e1d9a0f4c82.md
Chặn việc: Không. Sẵn sàng cho Claude nghiệm thu.
