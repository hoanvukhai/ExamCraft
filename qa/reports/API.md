# BÁO CÁO KIỂM THỬ: ĐỘI API (BACKEND & API CONTRACT AUDIT)

- **Người thực hiện**: API SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Môi trường**: Next.js 16 Route Handlers, Zod Validation, DB QA.

---

## 1. TỔNG HỢP KIỂM ĐỊNH HỢP ĐỒNG API (37 ROUTES)

| Nhóm API | Số Lượng Route | Cơ Chế Xác Thực | Kiểm Thực Dữ Liệu (Validation) | Đánh Giá & Trạng Thái |
|---|---|---|---|---|
| **Admin APIs** (`/api/admin/*`) | 3 | `requireAdmin()` | Zod Schema | **PASS**: Chặn giáo viên thường, trả về 403. |
| **Auth APIs** (`/api/auth/*`) | 4 | Session Cookie / Public | Zod / Bcrypt | **PASS**: Kiểm tra rate limit, xóa session khi logout. |
| **Questions & Bank** (`/api/questions/*`) | 6 | `requireAuth()` | Zod Schema | **PASS**: Phân quyền `ownerId`, hỗ trợ revisions, diff & rollback. |
| **Exams** (`/api/exams/*`) | 2 | `requireAuth()` | Zod Schema | **PASS**: Lưu sections JSON, cô lập theo `ownerId`. |
| **Groups & Classes** (`/api/groups/*`) | 2 | `requireAuth()` | Zod Schema | **PASS**: Nhập học sinh nhiều dòng, mã lớp publicCode. |
| **Assignments** (`/api/assignments`) | 1 | `requireAuth()` | Zod Schema | **PASS**: Đóng gói `Assignment.snapshot` bất biến. |
| **Public Student APIs** (`/api/public/*`) | 5 | Public (No Auth) | Zod / Server Check | **PASS**: Sanitize loại bỏ 100% đáp án trước khi gửi học sinh. |
| **Teacher Monitor** (`/api/teacher/*`) | 3 | `requireAuth()` | Zod / Server Check | **PASS**: Giám sát realtime, xuất CSV UTF-8 BOM. |
| **AI Endpoints** (`/api/exam-copilot`, etc.) | 5 | `requireAuth()` / Quota | Zod Schema | **PASS**: Điều phối qua hàng đợi 7 Gemini keys. |
| **Legacy Cloud APIs** (`/api/cloud/*`) | 4 | Không có Auth (Public) | Đọc file JSON thô | **CRITICAL BUG (R6)**: Trả về toàn bộ đề thi kèm đáp án đúng cho bất kỳ ai có `id`. Cần gỡ bỏ hoặc bảo vệ. |

---

## 2. PHÂN TÍCH LỖI NGHIÊM TRỌNG TRÊN ROUTE LEGACY (R6)
- **Tệp tin**: `src/app/api/cloud/exams/[id]/route.ts`
- **Hành vi thực tế**:
  ```ts
  export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const exam = getCloudExamById(id); // Đọc trực tiếp từ data/cloud_exams.json
    return NextResponse.json({ success: true, exam });
  }
  ```
- **Hậu quả**: Bất kỳ học sinh nào biết ID đề thi cũ có thể gọi `GET /api/cloud/exams/[id]` và nhận về 100% nội dung câu hỏi, danh sách phương án đúng `correct` và toàn bộ lời giải `solution`.
- **Khuyến nghị**: Xóa hoàn toàn thư mục `src/app/api/cloud` và trang `src/app/test/[id]`.
