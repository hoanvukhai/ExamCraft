# BỘ DỮ LIỆU ĐỀ THI MẪU CHO KIỂM THỬ TỰ ĐỘNG (PILOT FIXTURES)
*Phục vụ bộ kiểm tự động E2E `npm run test:pilot` (Codex) và quy trình kiểm thử luồng F1–F7*

> [!CAUTION]
> **LƯU Ý QUAN TRỌNG:**
> Các tệp JSON trong thư mục này là **dữ liệu kỹ thuật giả định** được cấu trúc nghiêm ngặt theo giao diện TypeScript `Exam` (`src/types/exam.ts`) và quy chuẩn hàm `normalizeExamDocument` (`src/lib/exam-document.ts`). Dữ liệu này được tạo riêng để phục vụ kiểm thử luồng tự động (E2E / Integration), **tuyệt đối không phải là gói học liệu hay đề kiểm tra đã được hội đồng chuyên môn thẩm định**. Không dùng các tệp này để tuyên bố hoàn thành nội dung học liệu GDPT 2018.

---

## 1. Danh sách tệp dữ liệu mẫu

| Tệp dữ liệu | Môn / Lớp | Đặc điểm kỹ thuật cần kiểm thử | Mục tiêu luồng |
|---|---|---|---|
| `toan6-bay-dang.json` | Toán 6 | Đủ **7 dạng câu hỏi**: Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn, Tự luận kèm rubric, Điền khuyết, Ghép nối 2 cột, Sắp xếp thứ tự; có **câu hỏi điểm bằng 0**, có **hình ảnh minh họa (Figure) chứa `data.url` PNG hợp lệ (< 20KB)** hỗ trợ trơn tru cho `prepareExportFigures` và xuất Word, có **ngữ liệu dùng chung (Passage)** | Phục vụ kiểm thử luồng **F2** (Soạn 7 dạng câu), **F3** (Trộn đề & Xuất Word có ảnh), **F6** (Học sinh làm 7 dạng), **F7** (Chấm tự luận) |
| `mon2-ngu-lieu.json` | Ngữ văn 6 | Đề thi môn thứ hai không phải Toán; có **đoạn trích ngữ liệu đọc hiểu dài** (> 250 từ), có **5 câu hỏi cùng trỏ vào `passageId: "pas-van6-dong-song"`** để kiểm tra chế độ xem song song (Parallel View) và chùm câu hỏi đọc hiểu bám ngữ liệu, câu tự luận điểm cao (6.0 điểm) | Đảm bảo hệ thống không bị thiết kế thiên lệch chỉ cho môn Toán; kiểm tra luồng F2, F3, F6, F7 trên môn xã hội và kiểm thử chế độ Song song |

---

## 2. Cấu trúc đối chiếu kỹ thuật (`src/types/exam.ts` & `src/lib/exam-document.ts`)

Mỗi tệp fixture đại diện cho một đối tượng `Exam` hoàn chỉnh:
- `id`: Mã định danh chuỗi kiểm thử duy nhất.
- `metadata`: Chứa `subject`, `grade`, `durationMinutes`, `examCode`, `assessmentMode: 'scored'`.
- `passages`: Mảng các đối tượng `Passage` (ngữ liệu chung gồm `id`, `title`, `content`, `source`).
- `sections`: Cấu trúc phân phần của đề thi (`ExamSection[]`).
- `questions`: Mảng các câu hỏi `Question` có đầy đủ trường dữ liệu:
  * `type`: `'multiple_choice' | 'true_false_group' | 'short_answer' | 'essay' | 'fill_blank' | 'matching' | 'ordering'`.
  * `content`: Chuỗi nội dung có gắn công thức toán LaTeX `$..$` hoặc `$$..$$`.
  * `figures`: Hình ảnh hoặc sơ đồ đính kèm (`Figure`). Trong đó hình ảnh `kind: 'image'` có `data.url` là chuỗi dataURL PNG hợp lệ dạng `data:image/png;base64,...` đạt chuẩn để `src/lib/export-figures.ts` trích xuất kích thước và đưa vào file Word `.docx`.
  * `passageId`: Liên kết trực tiếp tới ID của ngữ liệu trong mảng `passages` (ví dụ `pas-van6-dong-song`).
  * `rubric`: Barem chấm điểm cho câu hỏi tự luận (`RubricItem[]`).
  * `step_by_step_solution`: Lời giải chi tiết mẫu phục vụ đối chiếu khi học sinh hoàn thành bài thi.

---

## 3. Cách nạp dữ liệu cho bộ kiểm tự động (Dành cho Codex)

1. **Đọc trực tiếp từ tệp:**
   ```typescript
   import toan6Fixture from '@/../tests/fixtures/pilot/toan6-bay-dang.json';
   import van6Fixture from '@/../tests/fixtures/pilot/mon2-ngu-lieu.json';
   ```

2. **Khởi tạo đề thi vào DB thử nghiệm:**
   - Dùng API `POST /api/exams` kèm payload từ fixture để tạo đề thi thử nghiệm trong phiên kiểm thử của tài khoản giáo viên.

3. **Giao bài thi vào phòng thi:**
   - Dùng API `POST /api/assignments` (đúng theo handler tại `src/app/api/assignments/route.ts`, không dùng route không tồn tại `/api/exams/:id/assign`):
   ```json
   {
     "examId": "id-de-thi-vua-tao",
     "title": "Bài tập kiểm tra thử nghiệm",
     "mode": "HOMEWORK",
     "identityMode": "PICK_FROM_LIST",
     "durationMinutes": 45,
     "maxAttempts": 1,
     "showResult": "IMMEDIATE",
     "showSolution": "AFTER_CLOSE"
   }
   ```
   - Nhận về `assignment.publicId` để kích hoạt kịch bản chạy trình duyệt cho học sinh làm bài tại `/a/[publicId]` (luồng F6) và giáo viên theo dõi, chấm bài tại `/teacher/assignments/[id]` (luồng F7).

---
*Tài liệu bàn giao mục `GEM-P9` (cập nhật từ `GEM-P7`) thuộc nhiệm vụ `GEMINI-PILOT-PREP` (Generation 7).*
