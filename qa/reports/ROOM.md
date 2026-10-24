# BÁO CÁO KIỂM THỬ: ĐỘI ROOM (STUDENT ROOM & ASSIGNMENT EXECUTION)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: ROOM SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Mã nguồn thẩm định**: `src/app/a/[publicId]/page.tsx`, `src/app/api/public/*`, `src/app/c/[groupCode]/page.tsx`

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-ROM-001` | Lọc sạch đáp án và lời giải (`sanitizeSnapshotForStudent`) (R5) | **PASS** | Loại bỏ 100% `correct`, `isCorrect` và `solution` trước khi gửi xuống client học sinh. |
| `TC-ROM-002` | Rủi ro lọt đáp án nếu snapshot dạng lồng (R5) | **WARNING (HIGH)** | `sanitizeSnapshotForStudent` chỉ lọc nếu `Array.isArray(snapshot.questions)`. Nếu snapshot có cấu trúc `snapshot.sections[].questions`, hàm trả về raw snapshot chưa làm sạch! |
| `TC-ROM-003` | Đồng hồ máy chủ Server-Authoritative (`deadlineAt`) | **PASS** | `deadlineAt` tính toán tại máy chủ bằng `startedAt + durationMinutes`. Học sinh đổi giờ máy tính không làm tăng thời gian thi. |
| `TC-ROM-004` | Tự động lưu nháp (Auto-save draft 15s) | **PASS** | Cập nhật trường `Attempt.draft` qua API `/draft`. Học sinh F5 hoặc mất điện thoại mở lại vẫn giữ nguyên bài. |
| `TC-ROM-005` | Nộp bài và chấm điểm tự động | **PASS** | Chuyển trạng thái sang `SUBMITTED`, lưu `submittedAt`, tự động chấm điểm chính xác và ghi nhận điểm số. |
| `TC-ROM-006` | Cổng thông tin lớp học sinh `/c/[groupCode]` | **PASS** | Cho phép học sinh chọn tên mình, xem danh sách bài thi đang mở và lịch sử bài đã làm. |

---

## 2. BẰNG CHỨNG THỰC NGHIỆM
Trích xuất từ kết quả chạy `tests_e2e/test_sprint2.ts`:
```text
✅ PASS: Giữ nguyên 2 phương án A, B
✅ PASS: Đã loại bỏ trường payload.correct khỏi câu hỏi trắc nghiệm
✅ PASS: Đã loại bỏ trường solution khỏi câu hỏi trắc nghiệm
✅ PASS: Giữ nguyên 4 ý a, b, c, d
✅ PASS: Đã loại bỏ isCorrect khỏi ý sub_question
✅ PASS: Đã loại bỏ solution khỏi câu hỏi Đúng/Sai
✅ PASS: deadlineAt được tính toán tại Server
✅ PASS: Server timer khớp 45 phút
✅ PASS: Tự động lưu nháp thành công vào CSDL
✅ PASS: Nộp bài chuyển trạng thái SUBMITTED
✅ PASS: Chấm điểm tự động chính xác: 1.25 điểm
```
