# BÀN GIAO ĐÍNH CHÍNH G03 (RESUBMISSION): BỘ THẺ KIỂM THỬ THỦ CÔNG CHO CHỦ DỰ ÁN

- **Người gửi:** Gemini (QA Tài liệu / Rà soát độc lập)
- **Người nhận:** Codex (Điều phối viên / Tích hợp)
- **Thời gian (UTC):** 2026-10-24T13:36:30Z
- **Nhiệm vụ:** `G03` thuộc `GEMINI-CONTINUOUS-BATCH` (Generation 5, `ASSIGNMENTS.json`)
- **Trạng thái:** Bàn giao lại sau khi sửa trực tiếp tệp `qa/ai-review/GEMINI_MANUAL_TEST_CARDS.md` theo `BATCH_REVIEWS.json` (reviewed_at_utc 13:25:50Z).

---

## 1. Tệp bàn giao và SHA-256

- **Đường dẫn:** `qa/ai-review/GEMINI_MANUAL_TEST_CARDS.md`
- **SHA-256:** `fd5b2bf9705ae4084bfcba1ab3afe885c67b560148cfb3a421aa21b0c5b3c268`

---

## 2. Chi tiết các điểm đã sửa trực tiếp trên tệp theo review note của Codex

1. **Chuẩn hóa mã CV theo bản đồ nguồn 01 và checklist 03:**
   - Thẻ 01: Chuyển sang `CV006` (Lưu & nháp đề), `CV007` (Cấu trúc đề), `CV027` (Soạn thảo), `CV049/050` (CAS chống ghi đè phiên bản). Loại bỏ nhầm lẫn gán CV001-003 cho tạo/sửa đề (CV001-003 là Schema/bảo toàn/vận hành).
   - Thẻ 02: Chuyển sang `CV039` (Bóc tách văn bản/Word), `CV040` (Bóc tách ảnh/OCR), `CV010` (Luồng import).
   - Thẻ 03: Chuyển sang `CV007` (Cấu trúc câu hỏi Phần I/II/III theo định dạng tham khảo CV 7991), `CV023` (Công thức KaTeX).
   - Thẻ 04: Chuyển sang `CV016` (Phạm vi môn/lớp), `CV021` (Bản mẫu cấu trúc đề cá nhân), `CV066` (Gói cấu trúc đề thi).
   - Thẻ 06: Chuẩn hóa `CV056`, `CV057`, `CV058`, `CV059`.
   - Thẻ 07: Chuẩn hóa `CV060`, `CV061`.
   - Thẻ 08: Chuyển sang `CV013` (Bảo mật khóa API & Quota ứng dụng).
   - Thẻ 09: Chuyển sang `CV063` (`TeacherMemory`), `CV064` (Ngữ cảnh trợ lý).
   - Thẻ 10: Chuyển sang `CV014` (Bảo toàn dữ liệu cũ), `CV072` (Quy trình sao lưu/khôi phục).
2. **Đính chính cơ chế bản mẫu (Templates - Thẻ 04):**
   - Xác nhận theo mã nguồn `applyPersonalTemplate`: Hệ thống chỉ áp dụng metadata, tiêu đề in ấn, bối cảnh đánh giá, kế hoạch đề và cấu trúc các PHẦN (sections) của đề trống; **hoàn toàn KHÔNG tự động sinh ra các khung câu hỏi (question cards)**.
3. **Phân định rõ nguồn học liệu (Thẻ 03):**
   - Ghi rõ đây là cấu trúc định dạng tham khảo theo hướng dẫn CV 7991/BGDĐT, chưa phải gói câu hỏi được hội đồng giáo viên duyệt chuẩn (toàn bộ 161 ô môn/lớp vẫn là `needs_review`).
4. **Phân định ranh giới kiểm thử khóa BYOK (Thẻ 08):**
   - Ghi nhận rõ: Khóa giả lập chỉ kiểm tra định dạng và mã hóa AES-GCM trong DB; **hoàn toàn chưa kết nối live Google AI provider thật có trả phí**.
5. **Khớp tên nút và luồng giao diện thực tế:**
   - Dẫn chính xác các nhãn nút có trong component: "Lưu đề", "Tạo link chia sẻ", "Sao chép đề này vào kho của tôi", "Nộp bài thi", "Lưu điểm và nhận xét", "Áp dụng mẫu này", "Lưu chỉ dẫn".

---

Gemini giữ trạng thái `WORKING` và hoàn thiện mục cuối cùng: **G08** (`GEMINI_BATCH_SUMMARY.md`).
