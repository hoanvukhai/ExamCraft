# BÁO CÁO KIỂM THỬ: ĐỘI BANK (QUESTION BANK, REVISIONS & SHARING)

- **Người thực hiện**: BANK SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Mã nguồn thẩm định**: `src/app/api/questions/*`, `prisma/schema.prisma`

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-BNK-001` | Tạo và quản lý câu hỏi cá nhân | **PASS** | Lưu trữ đầy đủ nội dung, LaTeX, figures JSON, payload phân loại và giải thích. |
| `TC-BNK-002` | Lịch sử chỉnh sửa và hoàn tác (`QuestionRevision`) | **PASS** | Mỗi lần sửa đổi (PATCH), hệ thống tăng version và lưu bản chụp JSON vào bảng `QuestionRevision` trong transaction. |
| `TC-BNK-003` | Ngân hàng dùng chung nội bộ (`/api/questions/shared`) | **PASS** | Chỉ hiển thị các câu hỏi có `visibility = SHARED` và `deletedAt = null`. Kèm thông tin tác giả gốc. |
| `TC-BNK-004` | Nhân bản câu hỏi (Fork) bảo toàn tác giả | **PASS** | Bản sao tạo ra có `ownerId` là người fork, `authorId` giữ nguyên tác giả gốc, `sourceKind = FORKED`, `originId` trỏ về câu gốc. |
| `TC-BNK-005` | Khóa chia sẻ câu hỏi nhập từ Web (`IMPORTED_WEB`) | **PASS** | Endpoint `/api/questions/[id]/fork` kiểm tra `if (!originalQuestion.shareable) return 400`, chặn việc chia sẻ câu hỏi cào từ web ngoài. |

---

## 2. BẰNG CHỨNG THỰC NGHIỆM
Trích xuất từ kết quả chạy `tests_e2e/test_sprint1.ts`:
```text
✅ PASS: Bản sao (Fork) thuộc quyền sở hữu của Teacher B
✅ PASS: Tác giả gốc (Author) vẫn bảo toàn là Teacher A
✅ PASS: originId trỏ chính xác về câu hỏi gốc của Teacher A
✅ PASS: Câu hỏi IMPORTED_WEB bị khóa shareable = false
```
