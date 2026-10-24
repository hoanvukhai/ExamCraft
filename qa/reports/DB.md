# BÁO CÁO KIỂM THỬ: ĐỘI DB (DATABASE & DATA INTEGRITY)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Người thực hiện**: DB SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Môi trường**: PostgreSQL 16 (QA Container cổng 5437), Prisma ORM 6.19.3

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ CSDL

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-DB-001` | Toàn vẹn 17 Models và 14 Enums | **PASS** | Khởi tạo schema trên DB QA không lỗi. Đúng 17 bảng quan hệ và 14 enums. |
| `TC-DB-002` | Ràng buộc duy nhất `@@unique` | **PASS** | Đã xác minh: `Group(ownerId, name)`, `Student(groupId, displayName)`, `Assignment.publicId`, `Group.publicCode`, `QuestionRevision(questionId, version)`. |
| `TC-DB-003` | Ràng buộc bất biến `Assignment.snapshot` (R14) | **PASS** | Sửa nội dung câu hỏi gốc và đổi đáp án trong bảng `Question`, snapshot của `Assignment` vẫn giữ nguyên nội dung và đáp án chuẩn ban đầu. |
| `TC-DB-004` | Xóa mềm `deletedAt` cho Question và Exam | **PASS** | Mọi API câu hỏi (`src/app/api/questions/route.ts`) đều lọc `deletedAt: null`. |
| `TC-DB-005` | Phân biệt Enum `AttemptStatus` thực tế (R13) | **DOC-STALE** | Báo cáo `BAO_CAO_TOAN_DIEN_V3.md` ghi `AttemptStatus.GRADED`, nhưng schema thực tế chỉ có: `IN_PROGRESS`, `SUBMITTED`, `EXPIRED`. Trạng thái chờ chấm tay được thể hiện qua cờ `needsGrading: Boolean`. |
| `TC-DB-006` | Tên thuộc tính Model `Group` và `Student` (R13) | **DOC-STALE** | Schema dùng `Group.publicCode` (không phải `groupCode`), `Group.ownerId` (không phải `teacherId`), `Student.displayName` (không phải `name`). Code API map qua lại phù hợp nhưng tài liệu mô tả chưa chuẩn xác. |

---

## 2. BẰNG CHỨNG THỰC NGHIỆM
Trích xuất từ kết quả chạy `tests_e2e/test_sprint1.ts`:
```text
✅ PASS: Nội dung đề thi trong Assignment.snapshot không hề bị thay đổi sau khi câu hỏi gốc bị sửa
✅ PASS: Đáp án đúng trong Assignment.snapshot vẫn bảo toàn nguyên vẹn sau khi câu gốc bị sửa đáp án
```
