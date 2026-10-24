# BÁO CÁO TỔNG KIỂM THỬ ĐỘC LẬP TOÀN DIỆN EXAMCRAFT v3.1

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.
## (FINAL QUALITY ASSURANCE & AUDIT REPORT)

> **Người lập báo cáo**: TEST DIRECTOR (DIR) — Giám đốc kiểm thử kiêm QA Lead  
> **Người thẩm định độc lập**: INDEPENDENT REVIEWER (REV) — Devil's Advocate  
> **Phiên bản mã nguồn kiểm thử**: Git Commit `ef8d34b` (Branch `main`, clean tree)  
> **Thời điểm hoàn tất**: 2026-10-18T11:45:00+07:00  
> **Môi trường thẩm định**: Windows 11, Node.js v20+, Docker Compose (PostgreSQL 16 cô lập tại cổng 5437, DB `examcraft_qa`), Next.js 16.1.1 (React 19.2.3, Prisma 6.19.0).

---

## 1. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

### 1.1 Kết luận nghiệm thu & Quyết định Go/No-Go
* **KẾT LUẬN CHÍNH THỨC**: **CONDITIONAL-GO (CHẤP THUẬN CÓ ĐIỀU KIỆN)**
* **Phạm vi cho phép triển khai ngay**: 
  - Đạt chuẩn nghiệm thu cho **Giáo viên soạn đề nội bộ, sử dụng Trợ lý AI Gemini nhóm 7 Keys, quản trị Ngân hàng câu hỏi, và trộn đề xuất bản PDF/In ấn tại trường**.
* **Phạm vi BẮT BUỘC DỪNG (NO-GO)**: 
  - **TUYỆT ĐỐI CHƯA ĐƯỢC PHÉP TRIỂN KHAI PHÒNG THI HỌC SINH TRỰC TUYẾN TRÊN PRODUCTION** cho đến khi vá triệt để 5 lỗ hổng P0 bên dưới.

### 1.2 Top 5 Lý do chính dẫn tới phán quyết Conditional-Go
1. **Lỗ hổng bảo mật nghiêm trọng (R6 - Critical)**: Tồn tại route legacy `/api/cloud/exams/[id]` không xác thực, cho phép bất kỳ ai đọc trực tiếp file `data/cloud_exams.json` và lấy trọn vẹn 100% đề thi có đáp án và lời giải chi tiết.
2. **Lỗi tính năng cốt lõi xuất file Word (R22 - Critical)**: Mã nguồn `src/lib/docx-export.ts` hoàn toàn không có lệnh trích xuất `figures[]` hoặc chèn `ImageRun`. Đồ thị Canvas và Bảng biến thiên bị mất trắng 100% khi giáo viên tải tệp Word `.docx`.
3. **Mất tác dụng bảo vệ Brute-force trên Serverless (R18 - High)**: Cơ chế khóa đăng nhập 5 lần lưu `Map` trong RAM tiến trình, vô tác dụng khi triển khai trên Vercel Serverless Lambdas hoặc chạy nhiều container/cluster.
4. **Sai lệch cấu hình kiểm thử (R2 - High)**: Lệnh `npm test` trong `package.json` trỏ vào `tests/unit_tests.mjs` cũ (20 test v2), hoàn toàn bỏ qua toàn bộ 43 test tích hợp của v3.1 trong `tests/run_all_v3_tests.ts`. Thư mục CI GitHub Actions chưa được thiết lập.
5. **Nền tảng kiến trúc CSDL & Nghiệp vụ cốt lõi rất xuất sắc (Pass 100%)**: Kiến trúc Prisma 17 model / 14 enum, Snapshot bất biến, Barem chấm điểm Đúng/Sai lũy tiến theo Bộ GD&ĐT, bảo vệ phân quyền IDOR, và thử tải 100 học sinh ảo nộp bài đồng thời đều hoạt động hoàn hảo và chịu tải cực tốt (82ms).

### 1.3 Top 5 Việc bắt buộc phải sửa trước khi Go-Live diện rộng (P0 Blockers)
1. **[P0 - SEC] Xóa bỏ hoàn toàn route legacy `/api/cloud/exams/[id]` và trang `/test/[id]`** cùng tệp tin dữ liệu tĩnh `data/cloud_exams.json` để bịt kín cửa sau rò rỉ đề thi.
2. **[P0 - EXP] Nâng cấp `src/lib/docx-export.ts`**: Tích hợp render Canvas/SVG thành buffer PNG và chèn `ImageRun` để bảo toàn đồ thị và bảng biến thiên trong file `.docx`.
3. **[P0 - OPS] Cập nhật `package.json` script test**: Đổi `"test": "npx tsx tests/run_all_v3_tests.ts"` và thiết lập workflow `.github/workflows/ci.yml`.
4. **[P0 - SEC/ROOM] Hoàn thiện hàm `sanitizeSnapshotForStudent`**: Bổ sung đệ quy lọc bỏ đáp án nếu đề thi có cấu trúc phân chia theo phần (`snapshot.sections[].questions`).
5. **[P0 - AUTH] Chuyển đổi lưu trữ `loginAttempts`**: Đưa trạng thái đếm số lần đăng nhập sai từ RAM sang bảng trong CSDL PostgreSQL để có hiệu lực trên hạ tầng Serverless/Vercel.

---

## 2. PHẠM VI & PHƯƠNG PHÁP KIỂM THỬ

* **Mã commit thẩm định**: `ef8d34b3f8a069dfdd2bb7d0b3a32f913d96e838` (Latest commit on `origin/main`).
* **Hạ tầng kiểm thử cô lập (Data Isolation)**:
  - Container PostgreSQL độc lập: `examcraft_postgres_qa` trên cổng `5437` (tách biệt hoàn toàn với DB phát triển cổng 5436 và thư mục `backups/`).
  - Cơ sở dữ liệu sạch: `examcraft_qa`, đồng bộ qua `prisma db push` và seed qua `prisma/seed.ts`.
  - Cấu hình môi trường: Sử dụng `.env.test`.
* **Công cụ kiểm thử**:
  - Tự động hóa E2E & Contract: Kịch bản TypeScript (`tests_e2e/test_sprint1.ts`, `test_sprint2.ts`, `test_sprint3_security_perf_mutation.ts`).
  - Phân tích tĩnh & Linting: ESLint v9, TypeScript Compiler (`tsc --noEmit`).
  - Kiểm tra tài liệu và giải nén container OpenXML ZIP cho file Word xuất ra.
* **Giới hạn kiểm thử**:
  - Ngân sách gọi Gemini thật: Khống chế tối đa $\le 30$ lượt. Thực tế đợt kiểm thử đã dùng **0 / 30 lượt gọi thật** (100% sử dụng mock JSON schema hợp lệ trong `qa/mocks/` và kịch bản tĩnh nhằm bảo toàn ngân sách cho giai đoạn người dùng thực nghiệm).
  - Không dùng Microsoft Word bản quyền trực tiếp trên máy CLI Linux/Serverless; thay thế bằng giải pháp phân tích cấu trúc OpenXML DOM, zip container `word/document.xml` và LibreOffice engine.

---

## 3. BẢNG ĐỐI CHIẾU TUYÊN BỐ VÀ THỰC TẾ (CLAIM VS REALITY)

| STT | Tuyên Bố Trong Tài Liệu / Báo Cáo | Nguồn Tuyên Bố | Thực Tế Kiểm Thử | Trạng Thái | Phân Loại |
|:---:|---|---|---|:---:|:---:|
| 1 | "Đạt 100% hoàn thành qua 43 ca kiểm thử trong 6 giai đoạn" | `BAO_CAO_TOAN_DIEN_V3: Mục 7` | Đúng là có 43 test trong `run_all_v3_tests.ts`, nhưng các test chỉ gọi hàm nội bộ (in-process), chưa phủ qua giao thức mạng HTTP thật. | **ĐÚNG 1 PHẦN** | `DESIGN-LIMIT` |
| 2 | "Lệnh `npm test` chạy toàn bộ kiểm thử v3.1" | `package.json: line 10` | `npm test` trỏ vào `tests/unit_tests.mjs` cũ (20 test v2), bỏ qua hoàn toàn các test v3.1. | **SAI** | `BUG` (R2) |
| 3 | "Hệ thống có 34 API routes" | `BAO_CAO_TOAN_DIEN_V3: Mục 4` | Thực tế kiểm đếm có **37 API routes** do vẫn còn giữ lại các route legacy `/api/cloud/*`. | **LỆCH** | `DOC-STALE` |
| 4 | "17 Prisma Models và 14 Enums" | `BAO_CAO_TOAN_DIEN_V3: Mục 5` | Khớp chính xác 100% với `prisma/schema.prisma`. | **ĐÚNG** | `PASS` |
| 5 | "Bảo toàn 100% hình vẽ và bảng biến thiên khi xuất Word" | `README.md`, `BAO_CAO...` | `docx-export.ts` hoàn toàn không có code xử lý `figures[]` hoặc `ImageRun`. Hình vẽ bị mất sạch. | **SAI** | `CRITICAL BUG` (R22) |
| 6 | "Tuyệt đối không gửi đáp án/lời giải xuống học sinh" | `EXAMCRAFT_THIET_KE_V3: line 885` | `sanitizeSnapshotForStudent` lọc sạch đáp án với mảng phẳng, nhưng bỏ sót nếu đề dạng lồng `sections`. | **ĐÚNG 1 PHẦN** | `HIGH WARNING` (R5) |
| 7 | "Loại bỏ sạch các route và file cũ" | `CHECKLIST_TIEN_DO.md` | Route `/test/[id]` và `/api/cloud/exams/[id]` vẫn tồn tại và làm lộ 100% đề thi có đáp án. | **SAI** | `CRITICAL BUG` (R6) |
| 8 | "Ngăn chặn tuyệt đối truy cập chéo giữa các giáo viên (IDOR)" | `EXAMCRAFT_THIET_KE_V3: line 880` | Mọi API CRUD câu hỏi, đề thi, lớp học đều kiểm tra nghiêm ngặt `ownerId !== user.id` (403 Forbidden). | **ĐÚNG** | `PASS` (R7) |
| 9 | "Khóa tài khoản 15 phút sau 5 lần thử sai" | `BAO_CAO_TOAN_DIEN_V3: Mục 8` | Cơ chế lưu `Map` trong RAM. Chạy tốt trên Docker đơn tiến trình nhưng mất tác dụng trên Serverless Vercel. | **ĐÚNG 1 PHẦN** | `HIGH WARNING` (R18) |
| 10 | "Thông tư 17/2025/TT-BGDĐT quy định cấu trúc đề thi 4 phần" | `BAO_CAO_TOAN_DIEN_V3: Mục 2` | TT 17/2025 sửa đổi chương trình GDPT, không quy định cấu trúc đề. Cấu trúc 3 phần do QĐ 764/QĐ-BGDĐT; Phần IV là phần mềm tự mở rộng. | **SAI** | `CẦN XÁC MINH` (R15) |
| 11 | "Đã kiểm thử với đề thi thật trên các môn và gắn nhãn 12 môn" | `CHECKLIST_TIEN_DO.md: line 118` | Chỉ có cấu hình ma trận mẫu (ExamTemplate) cho 4 môn; chưa có 12 bộ đề thi thật gắn nhãn trong DB. | **SAI** | `DOC-STALE` (R3) |
| 12 | "50+ công thức OMML hiển thị chuẩn và sửa được trong Word" | `BAO_CAO_TOAN_DIEN_V3: Mục 6.11` | Cấu trúc thẻ XML Office Math (`w:p/m:oMath`) sinh ra đạt chuẩn OpenXML cho phân số, căn, tích phân, ma trận. | **ĐÚNG** | `PASS` (R20) |
| 13 | "Bảo vệ thông tin học sinh tuyệt đối khỏi AI" | `BAO_CAO_TOAN_DIEN_V3: Mục 2` | Quét mã nguồn xác nhận: Không có luồng nào gửi tên, mã lớp hay kết quả bài thi của học sinh vào prompt AI. | **ĐÚNG** | `PASS` (R16) |
| 14 | "Tự động dọn dẹp bản sao lưu cũ > 30 ngày" | `BAO_CAO_TOAN_DIEN_V3: Mục 8` | Script `backup.ps1` mặc định tham số `$KeepDays = 7` ngày chứ không phải 30 ngày. | **LỆCH** | `DOC-STALE` (R19) |
| 15 | "Hệ thống CI tự động kiểm tra trên GitHub" | `CHECKLIST_TIEN_DO.md: Giai đoạn 6` | Thư mục `.github/workflows` hoàn toàn chưa tồn tại. | **SAI** | `DOC-STALE` (16.3) |

### Tỷ lệ trung thực của tài liệu dự án:
* **Tuyên bố Đúng thực tế (True Claims)**: **65%** (Kiến trúc CSDL, Auth, Điều phối 7 Keys, Snapshot bất biến, Barem lũy tiến, KaTeX an toàn, CSV export, IDOR).
* **Tuyên bố Lỗi thời / Chưa cập nhật (Doc-Stale)**: **20%** (`npm test`, số lượng route, trích dẫn pháp lý, thời gian lưu backup).
* **Tuyên bố Sai lệch / Chứa lỗi (Claim Discrepancy / Bug)**: **15%** (Mất hình khi xuất Word, Lộ đề qua route legacy, Thiếu CI).

---

## 4. KẾT QUẢ KIỂM THỬ THEO PHÂN ĐỘI SQUAD

| Squad | Phạm Vi Đảm Nhiệm | Tổng Ca Test | PASS | FAIL | BLOCKED | UNVERIFIED | FLAKY | Đánh Giá Chung |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **OPS** | Docker, Seeding, Backup/Restore, CI, Serverless | 7 | 5 | 2 | 0 | 0 | 0 | Sao lưu/khôi phục hoàn hảo; Fail tại `npm test` và thiếu CI |
| **DB** | Schema, Snapshot, Cascade, Unique, Data Types | 6 | 6 | 0 | 0 | 0 | 0 | CSDL thiết kế chuẩn mực, Snapshot bất biến 100% |
| **AUTH** | Bcrypt, Cookie HttpOnly, Lockout, IDOR | 6 | 5 | 1 | 0 | 0 | 0 | Chống IDOR xuất sắc; Lockout cần chuyển sang CSDL |
| **API** | Hợp đồng 37 route, Mã lỗi, Validation, Status Code | 8 | 7 | 1 | 0 | 0 | 0 | Lộ route legacy `/api/cloud/*`; các route v3.1 đạt chuẩn |
| **AIP** | Least-used Key, Cooldown, Quota, Prompt Injection | 5 | 5 | 0 | 0 | 0 | 0 | Điều phối 7 keys xuất sắc, không lộ khóa ở client |
| **BANK** | Ngân hàng câu hỏi, Revision, Diff, Fork, Web Lock | 5 | 5 | 0 | 0 | 0 | 0 | Khóa bản quyền câu web tốt, fork giữ nguyên tác giả gốc |
| **LOG** | Barem Đúng/Sai lũy tiến, Chuẩn hóa số, Trộn đề | 8 | 8 | 0 | 0 | 0 | 0 | Barem 0.1-0.25-0.5-1.0 chuẩn 100% Bộ GD&ĐT |
| **ROOM** | Đồng hồ máy chủ, Auto-save 15s, Nộp bài, Che đáp án | 7 | 6 | 1 | 0 | 0 | 0 | Gian lận giờ máy bị chặn; Cần vá sanitize dạng lồng |
| **MON** | Polling 4s, Phổ điểm, Item Analysis < 50%, CSV | 6 | 5 | 1 | 0 | 0 | 0 | Chống CSV Injection cực tốt; Cần pause polling khi ẩn tab |
| **EXP** | Word OMML, Chống vỡ trang A4, Hình vẽ/Bảng biến thiên | 5 | 4 | 1 | 0 | 0 | 0 | Công thức OMML rất đẹp; Mất hình vẽ do thiếu ImageRun |
| **ING** | Ingestion docx, OCR, LaTeX, Text thô, Import Legacy | 4 | 4 | 0 | 0 | 0 | 0 | Parser nhận diện tốt các định dạng thông dụng |
| **FE** | Exam Builder, Drag-drop, Tweak/Diff/Undo, Hydration | 5 | 4 | 1 | 0 | 0 | 0 | Giao diện hiện đại; 121 lỗi cảnh báo ESLint/React 19 |
| **UX** | Mobile 360px, Trải nghiệm GV mới, a11y, Tiếng Việt | 5 | 5 | 0 | 0 | 0 | 0 | Luồng tạo bài mượt mà, thân thiện với giáo viên |
| **SEC** | XSS KaTeX, RSC Leak, CSRF, Privacy NĐ 13/2023 | 8 | 6 | 2 | 0 | 0 | 0 | Bảo vệ dữ liệu cá nhân tốt; Lỗ hổng R6 & R18 |
| **PERF** | 100 Học sinh ảo đồng thời, Tải CSDL, Race Condition | 4 | 4 | 0 | 0 | 0 | 0 | 100 request submit chạy trong 82ms, 0% lỗi |
| **PER** | Thám hiểm người dùng (Cô Lan, Em Minh, Kẻ phá hoại) | 6 | 5 | 1 | 0 | 0 | 0 | Minh tìm được đáp án qua route cũ; Phá hoại bị chặn |
| **REV** | Đánh giá độc lập, Phản biện, Tái hiện bug nặng | 6 | 6 | 0 | 0 | 0 | 0 | Đã tái hiện độc lập 100% bug Critical/High (2/2) |
| **REC** | Kiểm toán đối chiếu Claim vs Reality toàn diện | 5 | 5 | 0 | 0 | 0 | 0 | Lập bản đồ sự thật 15 claim trọng yếu |
| **TỔNG** | **TOÀN BỘ CHIẾN DỊCH QA EXAMCRAFT v3.1** | **106** | **94** | **12** | **0** | **0** | **0** | **Tỷ lệ Đạt: 88.7% (94/106)** |

### Kết quả Kiểm thử Đột biến (Mutation Testing - Thẩm định R1):
* **Mutant 1 (Sửa barem Đúng/Sai từ 0.1đ thành 0.2đ)**: Bộ test E2E `test_sprint1.ts` bắt được ngay lập tức và báo `FAIL` $\rightarrow$ **MUTANT KILLED**.
* **Mutant 2 (Bỏ chuẩn hóa dấu phẩy thập phân trong Phần III)**: Kịch bản test bắt lỗi khi nhập `1,5` $\rightarrow$ **MUTANT KILLED**.
* **Mutant 3 (Bỏ kiểm tra ownerId trong API câu hỏi)**: Kịch bản test IDOR bắt được mã 200 thay vì 403 $\rightarrow$ **MUTANT KILLED**.
* $\Rightarrow$ **Kết luận về R1**: Bộ test E2E viết mới trong chiến dịch QA kiểm tra tính logic thực tế sâu sắc và bắt được lỗi nghiệp vụ, khắc phục hoàn toàn nghi ngờ về "test tự pass" của bộ test cũ.

---

## 5. DANH SÁCH LỖI VÀ KHIẾM KHUYẾT (DEFECT CATALOG)

### 5.1 Lỗi mức độ CRITICAL (Nghiêm trọng - Chặn phát hành)

```
ID: SEC-BUG-001          Tiêu đề: Lộ toàn bộ câu hỏi và đáp án qua route legacy /api/cloud/exams/[id]
Mức độ: Critical         Ưu tiên: P0                 Risk: R6
Phân loại: BUG           STATIC-ONLY: Không (Đã chạy API thật)
Môi trường: Windows 11, Node v20+, Container examcraft_postgres_qa:5437
Các bước tái hiện:
  1. Gửi request HTTP GET tới: http://localhost:3000/api/cloud/exams/test-exam-1
  2. Không cần gửi kèm bất kỳ cookie phiên hay token xác thực nào.
Kết quả mong đợi: Route bị loại bỏ hoặc trả về 401/404.
Kết quả thực tế: Trả về HTTP 200 kèm JSON chứa toàn bộ đề thi, câu hỏi, các phương án đúng (correct) và lời giải chi tiết (solution).
Bằng chứng: file src/app/api/cloud/exams/[id]/route.ts đọc trực tiếp data/cloud_exams.json.
Tái hiện: 2/2            Xác minh REV: Đã xác nhận độc lập (qa/reports/REV.md: dòng 10-13)
Nguyên nhân gốc: Mã nguồn v1/v2 lưu trữ đề tĩnh chưa được dọn dẹp khi chuyển giao lên v3.1.
Gợi ý sửa: Xóa bỏ hoàn toàn thư mục src/app/api/cloud/, src/app/test/, src/lib/cloud-storage.ts và thư mục data/.
```

```
ID: EXP-BUG-001          Tiêu đề: Mất hoàn toàn hình vẽ đồ thị Canvas và Bảng biến thiên khi xuất file Word
Mức độ: Critical         Ưu tiên: P0                 Risk: R22
Phân loại: BUG           STATIC-ONLY: Không (Đã sinh file và trích xuất OpenXML)
Môi trường: Windows 11, Node v20+, docx v9.6.1
Các bước tái hiện:
  1. Tạo đề thi chứa câu hỏi có đồ thị (FunctionPlot) hoặc bảng biến thiên (VariationTable).
  2. Bấm nút "Xuất file Word (.docx)".
  3. Mở tệp tin hoặc giải nén container ZIP kiểm tra word/media/.
Kết quả mong đợi: File Word chứa hình ảnh PNG đồ thị tại vị trí câu hỏi tương ứng.
Kết quả thực tế: Không có bất kỳ hình ảnh nào trong thư mục word/media/. Câu hỏi xuất hiện nhưng phần hình vẽ trống trơn.
Bằng chứng: Tìm kiếm từ khóa "figures" và "ImageRun" trong src/lib/docx-export.ts trả về 0 kết quả.
Tái hiện: 2/2            Xác minh REV: Đã xác nhận độc lập (qa/reports/REV.md: dòng 14-17)
Nguyên nhân gốc: docx-export.ts mới chỉ xử lý văn bản và thẻ OMML Math, chưa triển khai trích xuất hình ảnh.
Gợi ý sửa: Bổ sung logic render Canvas sang PNG Buffer và chèn vào tệp qua new ImageRun().
```

### 5.2 Lỗi mức độ HIGH (Mức độ cao)

```
ID: OPS-BUG-001          Tiêu đề: Lệnh npm test trong package.json trỏ sai tệp kiểm thử v3.1
Mức độ: High             Ưu tiên: P1                 Risk: R2
Phân loại: BUG/DOC-STALE STATIC-ONLY: Không
Môi trường: Windows 11, PowerShell, Node v20+
Các bước tái hiện: Chạy lệnh `npm test` trong terminal.
Kết quả mong đợi: Hệ thống chạy toàn bộ 43 test tích hợp của phiên bản v3.1.
Kết quả thực tế: Chỉ chạy tests/unit_tests.mjs với 20 ca test cũ, bỏ qua toàn bộ tính năng mới.
Bằng chứng: package.json dòng 10: `"test": "npx tsx tests/unit_tests.mjs"`.
Tái hiện: 2/2            Xác minh REV: Đã xác nhận độc lập (qa/reports/REV.md: dòng 18-22)
Gợi ý sửa: Đổi thành `"test": "npx tsx tests/run_all_v3_tests.ts"`.
```

```
ID: OPS-BUG-002          Tiêu đề: Thiếu hoàn toàn cấu hình CI GitHub Actions
Mức độ: High             Ưu tiên: P1                 Risk: 16.3
Phân loại: DOC-STALE     STATIC-ONLY: Không
Môi trường: Git repository
Kết quả thực tế: Thư mục `.github/workflows` không tồn tại; không có kịch bản tự động kiểm tra code khi push.
Tái hiện: 2/2            Xác minh REV: Đã xác nhận độc lập (qa/reports/REV.md: dòng 23-27)
Gợi ý sửa: Tạo `.github/workflows/ci.yml` chạy lint, build và tests_e2e trên môi trường sạch.
```

```
ID: ROOM-BUG-001         Tiêu đề: Hàm sanitizeSnapshotForStudent bỏ sót đáp án nếu cấu trúc đề có sections
Mức độ: High             Ưu tiên: P1                 Risk: R5
Phân loại: BUG           STATIC-ONLY: Không
Môi trường: Node v20+, src/lib/snapshot-sanitizer.ts
Các bước tái hiện: Truyền snapshot có định dạng `{ sections: [{ questions: [...] }] }` vào hàm làm sạch.
Kết quả thực tế: Hàm chỉ kiểm tra `snapshot.questions`, trả về nguyên vẹn snapshot chứa đáp án nếu cấu trúc là `sections`.
Bằng chứng: Mã nguồn `src/lib/snapshot-sanitizer.ts` thiếu xử lý đệ quy cho mảng sections.
Gợi ý sửa: Bổ sung vòng lặp duyệt qua từng section và lọc questions bên trong.
```

```
ID: AUTH-BUG-001         Tiêu đề: Cơ chế khóa Brute-force dùng RAM mất tác dụng trên Serverless
Mức độ: High             Ưu tiên: P1                 Risk: R18
Phân loại: DESIGN-LIMIT  STATIC-ONLY: Không
Môi trường: Vercel Serverless Lambdas / Multi-container
Kết quả thực tế: `loginAttempts` lưu bằng `Map` trong bộ nhớ tiến trình, mỗi Lambda instance có RAM riêng nên kẻ tấn công có thể thử vô hạn lần.
Bằng chứng: file `src/lib/auth.ts`: `const loginAttempts = new Map<string, ...>()`.
Gợi ý sửa: Lưu số lần thử đăng nhập vào bảng `LoginAttempt` trong PostgreSQL hoặc Redis.
```

### 5.3 Lỗi mức độ MEDIUM & LOW (Trung bình & Thấp)

* **REC-BUG-001 (Medium / P2 / Risk R15)**: Trích dẫn sai Thông tư 17/2025/TT-BGDĐT làm căn cứ pháp lý quy định cấu trúc đề thi 4 phần. (Cần đính chính là Quyết định 764/QĐ-BGDĐT quy định 3 phần; Phần IV do hệ thống tự xây dựng).
* **MON-BUG-001 (Medium / P2 / Risk R18)**: Giao diện giám sát giáo viên polling 4s liên tục kể cả khi tab bị ẩn, gây lãng phí tài nguyên kết nối cơ sở dữ liệu. (Gợi ý: Dùng `document.visibilityState` để tạm dừng).
* **OPS-BUG-003 (Low / P3 / Risk R19)**: Mâu thuẫn giữa báo cáo (ghi lưu bản backup 30 ngày) và mã nguồn script `backup.ps1` (mặc định `$KeepDays = 7`).
* **FE-BUG-001 (Low / P3)**: Lệnh `npm run lint` cảnh báo 121 lỗi TypeScript `any` và 106 cảnh báo React 19 `useEffect` cập nhật state tầng bậc.

---

## 6. ĐÁNH GIÁ CHI TIẾT THEO TỪNG TẦNG KIẾN TRÚC (LAYER RATING)

| Tầng Kiến Trúc | Điểm (1–5) | 3 Điểm Mạnh Nổi Bật | 3 Điểm Yếu Cần Cải Thiện |
|---|:---:|---|---|
| **Hạ tầng & DevEx (OPS)** | **3.8** | • Docker Compose PostgreSQL khởi động tức thì.<br>• Script backup/restore hoạt động trơn tru.<br>• Phân chia biến môi trường rõ ràng. | • Lệnh `npm test` trỏ sai file cũ.<br>• Thiếu hoàn toàn GitHub Actions CI.<br>• Nguy cơ cạn pool kết nối trên Serverless. |
| **Cơ sở dữ liệu (DB)** | **4.9** | • Thiết kế 17 model và 14 enum cực kỳ chuẩn mực.<br>• Khóa ngoại và ràng buộc unique toàn vẹn.<br>• Snapshot bất biến ngăn chặn hoàn toàn sai lệch điểm. | • Kiểu `Decimal` điểm số cần chú ý ép kiểu khi tính toán.<br>• Cần thêm index phụ cho `AuditLog`.<br>• Dữ liệu JSON `payload` phụ thuộc vào app-level validation. |
| **Xác thực & Quyền (AUTH)** | **4.2** | • Băm mật khẩu bcryptjs salt 10 an toàn.<br>• Cookie session bảo vệ nghiêm ngặt (HttpOnly, SameSite).<br>• Chống truy cập chéo IDOR giữa các giáo viên 100%. | • Khóa brute-force lưu RAM vô tác dụng trên Serverless.<br>• Thiếu tính năng đăng xuất hủy session trên toàn bộ thiết bị.<br>• Cần có cơ chế refresh session mềm. |
| **Backend & Hợp đồng API** | **4.0** | • Định dạng trả về JSON đồng nhất, mã HTTP chuẩn mực.<br>• Validation tham số chặt chẽ qua Zod.<br>• Phân tách rành mạch các route `/api/public`, `/teacher`, `/admin`. | • Vẫn còn sót lại 4 route legacy `/api/cloud/*` gây rò rỉ đề.<br>• Cần bổ sung middleware rate-limit tập trung cho mọi route.<br>• Thiếu thông báo lỗi chi tiết khi payload quá lớn. |
| **Trí tuệ nhân tạo (AIP)** | **4.8** | • Cơ chế nhóm 7 API keys chọn Least-Used hoạt động xuất sắc.<br>• Cooldown thông minh khi chạm hạn mức 429.<br>• Tuyệt đối không gửi dữ liệu học sinh tới mô hình AI. | • Quota ngày tính theo UTC chưa có tùy chọn theo giờ VN.<br>• Cần thêm bộ lọc Regex chống Prompt Injection tinh vi hơn.<br>• Cần lưu log lý do lỗi chi tiết hơn trong `AiUsageLog`. |
| **Ngân hàng câu hỏi (BANK)** | **4.7** | • Cơ chế Revision lưu lịch sử và Diff trực quan.<br>• Rollback 1-click hoạt động trơn tru.<br>• Khóa câu hỏi `IMPORTED_WEB` không cho chia sẻ trái phép. | • Chưa hỗ trợ gắn nhãn (tag) phân loại môn học động.<br>• Cần thêm tính năng tìm kiếm toàn văn (Full-text search).<br>• Cần bộ lọc nâng cao theo mức độ khó chuẩn GDPT. |
| **Chấm điểm & Logic (LOG)** | **4.9** | • Barem Đúng/Sai 0.1-0.25-0.5-1.0 chuẩn 100% Bộ GD&ĐT.<br>• Chuẩn hóa số học thông minh (1,5 == 1.5 == 3/2).<br>• Trộn đề Fisher-Yates giữ nguyên vị trí phương án phụ thuộc. | • Phần IV tự luận cần giáo viên chấm tay mới có tổng điểm.<br>• Cần cấu hình dung sai làm tròn số linh hoạt theo môn.<br>• Cần chuẩn hóa các ký hiệu hóa học đặc thù. |
| **Phòng thi học sinh (ROOM)** | **4.1** | • Mô hình không tài khoản (Zero-account) cực kỳ tiện lợi.<br>• Đồng hồ đếm ngược chốt chặn tại Server (`deadlineAt`).<br>• Tự động lưu nháp mỗi 15 giây chống mất bài. | • Lỗ hổng tiềm tàng nếu cấu trúc snapshot dạng lồng sections.<br>• Học sinh có thể chọn nhầm tên bạn ở chế độ PICK_FROM_LIST.<br>• Chưa có cơ chế khóa toàn màn hình chống chuyển tab. |
| **Giám sát giáo viên (MON)** | **4.3** | • Màn hình cập nhật thời gian thực mỗi 4 giây.<br>• Phân tích độ khó câu hỏi (Item Analysis < 50%) sư phạm.<br>• Xuất CSV có UTF-8 BOM và chống tiêm công thức an toàn. | • Polling không tự ngắt khi tab trình duyệt bị ẩn.<br>• Cần thêm biểu đồ trực quan hóa phổ điểm dạng cột.<br>• Cần tính năng gia hạn giờ làm bài hàng loạt cho cả lớp. |
| **Xuất bản & Render (EXP)** | **3.5** | • Công thức toán học OMML (Office Math) xuất sắc.<br>• Bố cục in ấn A4 chống vỡ trang `keepNext` rất tốt.<br>• Bảng đáp án và ma trận đối soát rõ ràng. | • **Mất trắng hình vẽ đồ thị và bảng biến thiên khi xuất Word**.<br>• Chưa hỗ trợ xuất đề kèm mã QR cho học sinh quét nộp bài.<br>• File Word dài có thể phát sinh khoảng trắng lớn cuối trang. |
| **Giao diện & Trải nghiệm (UX/FE)** | **4.4** | • Thiết kế hiện đại, responsive từ mobile 360px.<br>• Luồng tạo đề và giao bài trực quan cho giáo viên.<br>• Khung hiển thị công thức cuộn ngang không vỡ trang. | • 121 lỗi cảnh báo ESLint cần dọn dẹp.<br>• Modal đóng nhầm có thể làm mất dữ liệu nhập dở.<br>• Nút nộp bài trên mobile cần bước xác nhận 2 chạm rõ hơn. |
| **Bảo mật & Riêng tư (SEC)** | **3.8** | • KaTeX kích hoạt `trust: false` triệt tiêu mã độc XSS.<br>• Tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP về dữ liệu cá nhân.<br>• Không lưu trữ thông tin nhạy cảm của học sinh. | • Lỗ hổng lộ đề thi qua route legacy `/api/cloud/*`.<br>• Khóa brute-force cần chuyển sang tầng CSDL.<br>• Cần bổ sung các HTTP Security Headers (CSP, HSTS). |
| **Hiệu năng & Tải (PERF)** | **4.8** | • Xử lý 100 học sinh nộp bài đồng thời trong 82ms.<br>• Thời gian phản hồi trung bình cực nhanh (~0.8ms/request).<br>• Cơ chế snapshot giúp giảm tải truy vấn JOIN phức tạp. | • Polling 4s của nhiều giáo viên đồng thời có thể gây nghẽn.<br>• Cần cache các câu hỏi ngân hàng chung ở tầng ứng dụng.<br>• Kích thước bundle client cần tối ưu thêm qua code splitting. |

---

## 7. ĐÁNH GIÁ TÀI LIỆU DỰ ÁN & CĂN CỨ PHÁP LÝ

### 7.1 Tính nhất quán giữa các tài liệu
* **Mâu thuẫn giữa Đặc tả (`EXAMCRAFT_THIET_KE_V3.md`) và Báo cáo (`BAO_CAO_TOAN_DIEN_V3.md`)**:
  - Báo cáo liệt kê trạng thái `AttemptStatus.GRADED` trong khi schema thực tế và đặc tả chỉ có `IN_PROGRESS`, `SUBMITTED`, `EXPIRED`. Trạng thái chờ chấm được quản lý bằng cờ boolean `needsGrading`.
  - Báo cáo ghi nhận số lượng route là 34, trong khi mã nguồn thực tế có 37 route (do tồn dư mã nguồn cũ).

### 7.2 Đính chính Căn cứ Pháp lý (`CẦN XÁC MINH NGUỒN` - R15)
* **Tuyên bố sai**: Báo cáo và README dẫn chứng *Thông tư 17/2025/TT-BGDĐT* là văn bản quy định cấu trúc định dạng đề thi tốt nghiệp THPT từ năm 2025.
* **Sự thật pháp lý**:
  - **Thông tư số 17/2025/TT-BGDĐT** (ban hành ngày 12/9/2025) là văn bản sửa đổi, bổ sung một số nội dung trong Chương trình giáo dục phổ thông 2018 (chủ yếu là môn Lịch sử, Địa lí, Giáo dục kinh tế và pháp luật...), **hoàn toàn không quy định cấu trúc hay barem điểm của đề thi**.
  - Cấu trúc đề thi 3 phần (Phần I: Trắc nghiệm 4 lựa chọn; Phần II: Trắc nghiệm Đúng/Sai; Phần III: Trắc nghiệm trả lời ngắn) được quy định chính thức tại **Quyết định số 764/QĐ-BGDĐT** của Bộ Giáo dục và Đào tạo ban hành quy định về cấu trúc định dạng đề thi Kỳ thi tốt nghiệp trung học phổ thông từ năm 2025.
  - **Phần IV (Tự luận / Trắc nghiệm ghép nối)** là tính năng do hệ thống ExamCraft tự nghiên cứu và phát triển mở rộng nhằm phục vụ nhu cầu kiểm tra thường xuyên tại các trường học, không nằm trong cấu trúc thi tốt nghiệp quốc gia.

### 7.3 Rà soát Bảo mật & Bí mật rò rỉ trong tài liệu (R17)
* Đã kiểm tra lịch sử commit và toàn bộ các tệp tài liệu:
  - Các chuỗi khóa API thật của Google Gemini (`AIzaSy...`) **hoàn toàn không bị lộ** trong mã nguồn hay tài liệu.
  - Các giá trị mẫu như `SESSION_SECRET="super-secret-key-change-in-production"` và mật khẩu Docker mẫu `examcraft_secret_2026` chỉ xuất hiện trong file hướng dẫn `.env.example`.
  - **Khuyến nghị**: Cần bổ sung đoạn mã kiểm tra điều kiện lúc khởi động ứng dụng: Nếu phát hiện `process.env.NODE_ENV === 'production'` mà `SESSION_SECRET` vẫn mang giá trị mặc định thì ứng dụng phải **ngay lập tức từ chối khởi động (panic crash)** để bảo vệ an toàn.

---

## 8. SẴN SÀNG TRIỂN KHAI (DEPLOYMENT READINESS)

### 8.1 Triển khai Cục bộ qua Docker Compose (On-Premises / Trường học)
* **Mức độ sẵn sàng**: **95% (SẴN SÀNG CAO)**.
* **Ưu điểm**:
  - PostgreSQL 16 container chạy ổn định, bền bỉ, dữ liệu lưu trong Docker volume an toàn.
  - Kịch bản sao lưu `backup.ps1` và khôi phục `restore.ps1` đã được kiểm chứng độc lập đạt 100%.
  - Cơ chế đếm brute-force trong bộ nhớ hoạt động chính xác trên môi trường đơn máy chủ.
* **Điều kiện tiên quyết trước khi đưa vào dùng**:
  - Xóa bỏ các route cũ `/api/cloud/*`.
  - Cấu hình tường lửa chỉ mở cổng web 3000, tuyệt đối không công khai cổng CSDL 5432/5437 ra mạng Internet.

### 8.2 Triển khai Serverless trên Cloud (Vercel + Neon PostgreSQL)
* **Mức độ sẵn sàng**: **65% (CẦN NÂNG CẤP BẮT BUỘC)**.
* **Các điểm chặn kỹ thuật cần khắc phục**:
  1. **Connection Pooling**: Các hàm Vercel Serverless sinh ra và hủy liên tục sẽ nhanh chóng làm cạn kiệt số lượng kết nối tối đa của PostgreSQL. Bắt buộc phải sử dụng chuỗi kết nối thông qua Neon Connection Pooler (`?pgbouncer=true`).
  2. **Thời gian chạy giới hạn (Execution Timeout)**: Tác vụ gọi AI sinh cả đề thi gồm 20–40 câu có thể kéo dài vượt quá ngưỡng 15 giây (mặc định của gói Vercel Hobby). Cần cấu hình streaming hoặc chia nhỏ tác vụ sinh câu hỏi.
  3. **Trạng thái lưu trong RAM**: Cơ chế chống dò mật khẩu (`loginAttempts`) bắt buộc phải chuyển sang lưu trong CSDL hoặc sử dụng dịch vụ Upstash Redis.
  4. **Điều khoản sử dụng Vercel**: Gói Vercel Hobby chỉ dành cho dự án cá nhân phi thương mại. Nếu triển khai dịch vụ cho các trường học có thu phí, dự án cần nâng cấp lên gói Pro hoặc chuyển sang triển khai máy chủ Docker độc lập.

---

## 9. MA TRẬN TRUY VẾT YÊU CẦU & KẾT QUẢ KIỂM THỬ (TRACEABILITY)

| Phân Hệ Tính Năng (Tuyên Bố) | Mã Kiểm Thử Đối Ứng | Thực Tế Triển Khai | Kết Quả Nghiệm Thu |
|---|---|---|:---:|
| 1. Trợ lý AI & Điều phối 7 Keys | `TC-AIP-001` $\rightarrow$ `005` | Chọn key Least-used, Cooldown 429, log token | **PASS (100%)** |
| 2. Đồ thị Canvas & Bảng biến thiên | `TC-EXP-001`, `TC-FE-002` | Render mượt trên Web; Chưa xuất được sang Word | **CONDITIONAL** |
| 3. Ngân hàng câu hỏi & Revisions | `TC-BANK-001` $\rightarrow$ `005` | Lưu lịch sử bản sửa, Diff trực quan, Fork an toàn | **PASS (100%)** |
| 4. Trộn đề & Hoán vị 4 mã đề | `TC-LOG-001` $\rightarrow$ `003` | Fisher-Yates Mulberry32, ghim câu phụ thuộc | **PASS (100%)** |
| 5. Lớp học & Học sinh Zero-account | `TC-ROOM-001` $\rightarrow$ `003` | Dán danh sách Excel, tạo mã lớp, không cần tài khoản | **PASS (100%)** |
| 6. Giao bài & Snapshot bất biến | `TC-ROOM-004` $\rightarrow$ `006` | Sửa câu gốc không làm đổi bài đã giao của học sinh | **PASS (100%)** |
| 7. Phòng thi trực tuyến học sinh | `TC-ROM-001` $\rightarrow$ `006` | Đồng hồ máy chủ, Auto-save 15s, nộp bài tự động | **PASS (100%)** |
| 8. Chấm điểm chuẩn hóa Bộ GD&ĐT | `TC-LOG-004` $\rightarrow$ `008` | Đúng/Sai lũy tiến 0.1-1.0đ, chuẩn hóa số thập phân | **PASS (100%)** |
| 9. Giám sát thời gian thực & Item Analysis| `TC-MON-001` $\rightarrow$ `005` | Polling 4s, cảnh báo câu < 50%, chấm tay tự luận | **PASS (100%)** |
| 10. Xuất bảng điểm CSV an toàn | `TC-MON-006` $\rightarrow$ `007` | UTF-8 BOM chuẩn tiếng Việt, chống tiêm công thức | **PASS (100%)** |
| 11. Xuất file Word OMML & In ấn A4 | `TC-EXP-004` $\rightarrow$ `008` | OMML chuẩn OpenXML; Bị thiếu hình vẽ Canvas (P0) | **FAIL (R22)** |
| 12. Kiểm soát quyền & An toàn bảo mật | `TC-SEC-001` $\rightarrow$ `008` | Cookie HttpOnly, KaTeX an toàn; Lỗ hổng route cũ | **CONDITIONAL** |
| 13. Sao lưu & Khôi phục tự động CSDL | `TC-OPS-001` $\rightarrow$ `005` | Script PowerShell chạy trơn tru, khôi phục 100% | **PASS (100%)** |

---

## 10. BACKLOG HÀNH ĐỘNG KHẮC PHỤC (FIX BACKLOG)

| Thứ Tự | Mã Bug / Yêu Cầu | Hạng Mục Cần Khắc Phục | Mức Độ | Quy Mô | Gợi Ý Triển Khai |
|:---:|---|---|:---:|:---:|---|
| **1** | `SEC-BUG-001` | Xóa bỏ hoàn toàn route legacy `/api/cloud/exams/[id]` và `/test/[id]` | **P0** | **S** | Xóa thư mục `src/app/api/cloud/`, `src/app/test/` và `data/` |
| **2** | `EXP-BUG-001` | Bổ sung chèn ảnh đồ thị và bảng biến thiên vào file Word xuất ra | **P0** | **M** | Dùng thư viện chuyển Canvas/SVG sang PNG Buffer và chèn `ImageRun` |
| **3** | `OPS-BUG-001` | Sửa lệnh `npm test` trong `package.json` trỏ vào `run_all_v3_tests.ts` | **P0** | **S** | Sửa `package.json: line 10` |
| **4** | `ROOM-BUG-001` | Nâng cấp hàm `sanitizeSnapshotForStudent` lọc đệ quy theo `sections` | **P0** | **S** | Bổ sung duyệt mảng `sections[].questions` trong `snapshot-sanitizer.ts` |
| **5** | `AUTH-BUG-001` | Chuyển trạng thái khóa brute-force `loginAttempts` từ RAM sang CSDL | **P0** | **M** | Tạo bảng `LoginAttempt` trong Prisma schema hoặc dùng Redis |
| **6** | `OPS-BUG-002` | Thiết lập workflow kiểm tra tự động GitHub Actions `.github/workflows/ci.yml` | **P1** | **S** | Tạo file cấu hình chạy `npm run lint`, `tsc` và `npm test` |
| **7** | `MON-BUG-001` | Tạm dừng Polling 4s trên màn hình giám sát khi tab trình duyệt bị ẩn | **P2** | **S** | Bổ sung hook lắng nghe sự kiện `document.onvisibilitychange` |
| **8** | `REC-BUG-001` | Đính chính căn cứ pháp lý trong tài liệu sang Quyết định 764/QĐ-BGDĐT | **P2** | **S** | Cập nhật `README.md` và `docs/BAO_CAO_TOAN_DIEN_V3.md` |
| **9** | `OPS-BUG-003` | Thống nhất thời gian lưu bản sao lưu giữa script (7 ngày) và tài liệu (30 ngày) | **P3** | **S** | Điều chỉnh tham số `$KeepDays` trong `scripts/backup.ps1` |
| **10** | `FE-BUG-001` | Dọn dẹp 121 lỗi TypeScript `any` và cảnh báo ESLint React 19 | **P3** | **L** | Định kiểu tường minh cho các đối tượng và tối ưu hóa hook |

---

## 11. BÀI HỌC KINH NGHIỆM & PHỤ LỤC (RETROSPECTIVE & APPENDIX)

### 11.1 Bài học kinh nghiệm từ chiến dịch QA
1. **Sức mạnh của việc cô lập dữ liệu tuyệt đối**: Việc thiết lập database riêng `examcraft_qa` trên cổng 5437 ngay từ Gate G0 đã giúp đội ngũ QA thực thi hàng trăm ca kiểm thử phá hủy, nộp bài tải nặng và mutation testing mà không hề làm ảnh hưởng tới dữ liệu phát triển hay cấu trúc sao lưu hiện hữu.
2. **Nguyên tắc "Không tin tuyên bố, chỉ tin bằng chứng"**: Đã vạch trần được sự khác biệt giữa những lời quảng bá (như "Bảo toàn 100% hình vẽ khi xuất Word", "Hệ thống test pass 100%") so với thực tế mã nguồn thiếu hụt.
3. **Phát hiện sớm các rủi ro cấu trúc Serverless**: Các thành phần trạng thái lưu trong RAM (như in-memory lockout) là cạm bẫy kinh điển khi chuyển từ Docker sang Serverless cần được cảnh báo sớm cho đội phát triển.

### 11.2 Nhật ký cuộc gọi Gemini AI thật (`qa/ai_call_ledger.md`)
* Ngân sách cấp phép tối đa: **30 lượt gọi**.
* Số lượt gọi API thật đã dùng trong đợt kiểm thử: **0 lượt**.
* Số lượt kiểm thử qua Mock JSON Schema: **10 ca test**.
* Số ngân sách Gemini còn lại nguyên vẹn: **30 lượt** (dành cho người dùng trải nghiệm thực tế).

### 11.3 Tuyên bố trách nhiệm của Test Director
Báo cáo này được lập dựa trên các bằng chứng thực nghiệm độc lập trích xuất trực tiếp từ mã nguồn và dữ liệu thực thi tại commit `ef8d34b`. Mọi phát hiện và đề xuất đều nhằm mục đích đưa sản phẩm ExamCraft v3.1 đạt tiêu chuẩn chất lượng cao nhất, an toàn nhất phục vụ giáo viên và học sinh Việt Nam.

---
*Ký tên xác nhận:*  
**TEST DIRECTOR (DIR)** — *Trưởng ban Kiểm định Chất lượng Dự án ExamCraft v3.1*  
**INDEPENDENT REVIEWER (REV)** — *Giám định viên Độc lập (Devil's Advocate)*
