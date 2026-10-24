# BÁO CÁO KIỂM THỬ: ĐỘI MON (TEACHER MONITORING & GRADEBOOK)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: MON SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Mã nguồn thẩm định**: `src/app/teacher/assignments/[id]/page.tsx`, `src/app/api/teacher/*`

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-MON-001` | Giám sát phòng thi thời gian thực (Polling 4s) | **PASS** | Màn hình tự động cập nhật danh sách bài nộp và học sinh đang làm bài mỗi 4 giây. |
| `TC-MON-002` | Rủi ro tải kết nối DB khi Polling liên tục (R18) | **WARNING (MEDIUM)** | Cần bổ sung kiểm tra `document.visibilityState` để tạm dừng polling khi giáo viên chuyển sang tab khác, giảm tải kết nối CSDL. |
| `TC-MON-003` | Thống kê phân tích sư phạm từng câu (Item Analysis) | **PASS** | Tính toán chính xác tỷ lệ đúng của từng câu. Đã xác minh: câu hỏi có tỷ lệ làm đúng dưới 50% hiển thị cảnh báo để giáo viên chữa bài. |
| `TC-MON-004` | Chấm điểm tự luận thủ công | **PASS** | Endpoint `/api/teacher/attempts/[id]` cho phép giáo viên nhập điểm và lời nhận xét, tự động tính lại tổng điểm `Attempt.score` tức thì. |
| `TC-MON-005` | Xuất bảng điểm CSV có UTF-8 BOM | **PASS** | Đã xác minh chèn ký tự `\uFEFF` ở đầu file, mở trực tiếp trên Excel hiển thị chuẩn tiếng Việt 100% không bị vỡ font. |
| `TC-MON-006` | Vô hiệu hóa CSV Formula Injection (R26) | **PASS** | Đã xác minh tự động chèn dấu nháy đơn `'` cho bất kỳ ô nào bắt đầu bằng `=, +, -, @, \t, \r` trước khi bọc ngoặc kép. |

---

## 2. BẰNG CHỨNG THỰC NGHIỆM
Trích xuất từ kết quả chạy `tests_e2e/test_sprint2.ts`:
```text
✅ PASS: Tỷ lệ làm đúng câu 1 là 100%
✅ PASS: Đã vô hiệu hóa CSV Formula Injection bằng dấu nháy đơn ' (kể cả khi bọc trong ngoặc kép)
```
