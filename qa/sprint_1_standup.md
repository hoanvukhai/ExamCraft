# BIÊN BẢN HỌP STANDUP & SƠ KẾT SPRINT 1

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Thời điểm**: 2026-10-18 11:27 UTC+7
- **Chủ trì**: TEST DIRECTOR (DIR)
- **Thành phần**: OPS, DB, AUTH, API, AIP, BANK, LOG squads.

---

## 1. TIẾN ĐỘ HOÀN THÀNH (ĐÃ XONG)
- **Hạ tầng & CSDL QA**: Thiết lập và khởi động thành công database `examcraft_qa` hoàn toàn cô lập trên cổng 5437. Chạy thành công backup và restore chu trình khép kín.
- **Xác thực & Phân quyền**: Đã kiểm chứng cơ chế băm mật khẩu, session cookies HttpOnly/SameSite, cơ chế khóa tạm thời sau 5 lần thử sai.
- **Bảo vệ IDOR**: Xác minh 100% Teacher B không thể xem, sửa hoặc xóa câu hỏi, đề thi và lớp học của Teacher A.
- **Bản chụp bất biến (Snapshot)**: Xác minh việc sửa/xóa câu hỏi gốc không làm thay đổi đề thi và đáp án trong `Assignment.snapshot`.
- **Logic Nghiệp vụ**: Đạt chuẩn 100% barem lũy tiến Bộ GD&ĐT (0.1, 0.25, 0.5, 1.0) và chuẩn hóa trả lời ngắn.

---

## 2. CÁC ĐIỂM NGHẼN & PHÁT HIỆN RỦI RO (TRIAGE)
1. **[CRITICAL] R6 - Route cũ `/api/cloud/exams/[id]` làm lộ đáp án**: Đọc trực tiếp từ `data/cloud_exams.json` không qua xác thực, trả về 100% đề thi kèm đáp án.
2. **[HIGH] R2 - `npm test` chưa được cập nhật**: Lệnh `npm test` trong `package.json` trỏ vào file v2 cũ, không chạy 6 bộ test v3.1.
3. **[HIGH] R18 - In-memory Map cho Lockout**: Cơ chế chống brute force lưu trong RAM, sẽ mất tác dụng trên Serverless (Vercel).
4. **[HIGH] 16.3 - Thiếu CI GitHub Actions**: Thư mục `.github/workflows` chưa được tạo.
5. **[MEDIUM] R15 - Trích dẫn pháp lý**: TT 17/2025 là sửa đổi chương trình GDPT, không quy định cấu trúc đề thi 4 phần.

---

## 3. KẾ HOẠCH BƯỚC VÀO SPRINT 2
- Triển khai kiểm thử sâu các luồng người dùng:
  - **ROOM**: Phòng thi học sinh `/a/[publicId]`, server timer, auto-save draft, nộp bài idempotent, kiểm tra rò rỉ đáp án qua client bundle.
  - **MON**: Màn hình giám sát realtime giáo viên (polling 4s), Item Analysis (<50%), chấm tay tự luận, xuất CSV an toàn.
  - **EXP**: Xuất bản Word `.docx`, 50+ công thức OMML, phân trang in A4.
  - **ING**: Trình nhập đề Word, ảnh OCR, text/LaTeX.
  - **FE / UX**: Trải nghiệm giao diện giáo viên & học sinh trên mobile.
