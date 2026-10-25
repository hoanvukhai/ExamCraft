# Danh mục môn–lớp và gói nội dung

Bảng **sinh tự động** bằng `node scripts/catalog-table.cjs` từ `src/config/education/coverage.json` (danh mục ứng dụng dùng, ngày dữ liệu 2026-10-22), gói kiến thức và đề mẫu trong repo. Không sửa tay; sửa nguồn rồi chạy lại. Phục vụ CV004, CV016, CV022, CV070.

**Người duyệt: chưa có** cho mọi ô (chủ dự án tự duyệt khi dùng). Không ô nào "đã duyệt".

Ký hiệu trong ô:
- `chờ duyệt` — có đầu mối tài liệu chương trình/sách trong danh mục nguồn (`readiness: needs_review`), chưa có gói nội dung.
- `gói: <mã>` — có gói kiến thức nạp được (chỉ là gói kỹ thuật, trạng thái ghi kèm).
- `đề mẫu` — có đề mẫu nạp được trong `qa/ai-review/fixtures/da-mon/` (dùng để kiểm nhập/xuất, **không** phải gói nội dung).
- `—` — môn không có ở lớp này theo danh mục.
- Môn nhận xét (`nx`) là môn đánh giá bằng nhận xét, không ép điểm số.

## Tiểu học

| Môn | Loại | Lớp 1 | Lớp 2 | Lớp 3 | Lớp 4 | Lớp 5 | Nguồn trong danh mục |
|---|---|---|---|---|---|---|---|
| Tiếng Việt | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0003 |
| Toán | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0004 |
| Đạo đức (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0005 |
| Âm nhạc (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0010 |
| Mĩ thuật (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0011 |
| Giáo dục thể chất (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0012 |
| Hoạt động trải nghiệm (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0013 |
| Tự nhiên và Xã hội (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | — | — | TK-0021 |
| Tiếng Anh | Tự chọn/Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0028, TK-0014 |
| Giáo dục địa phương (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0049, TK-0050, TK-0051, TK-0052, TK-0053, TK-0054 |
| Công nghệ | Bắt buộc | — | — | chờ duyệt | chờ duyệt | chờ duyệt | TK-0008 |
| Tin học | Bắt buộc | — | — | chờ duyệt | chờ duyệt | chờ duyệt | TK-0009 |
| Khoa học | Bắt buộc | — | — | — | chờ duyệt | chờ duyệt | TK-0022 |
| Lịch sử và Địa lí | Bắt buộc | — | — | — | chờ duyệt | chờ duyệt | TK-0023, TK-0020 |

## THCS

| Môn | Loại | Lớp 6 | Lớp 7 | Lớp 8 | Lớp 9 | Nguồn trong danh mục |
|---|---|---|---|---|---|---|
| Ngữ văn | Bắt buộc | chờ duyệt | chờ duyệt; đề mẫu: ngu-van-7.json | chờ duyệt | chờ duyệt | TK-0003 |
| Toán | Bắt buộc | chờ duyệt; gói: personal-fixture-math6 (needs_review) | chờ duyệt | chờ duyệt | chờ duyệt; đề mẫu: toan-9.json | TK-0004 |
| Giáo dục công dân | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0005 |
| Khoa học tự nhiên | Bắt buộc | chờ duyệt; đề mẫu: khtn-6.json | chờ duyệt | chờ duyệt | chờ duyệt | TK-0007 |
| Lịch sử và Địa lí | Bắt buộc | chờ duyệt | chờ duyệt; đề mẫu: lich-su-dia-ly-7.json | chờ duyệt | chờ duyệt | TK-0006, TK-0020 |
| Công nghệ | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0008 |
| Tin học | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt; đề mẫu: tin-hoc-8.json | chờ duyệt | TK-0009 |
| Âm nhạc (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0010 |
| Mĩ thuật (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0011 |
| Giáo dục thể chất (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0012 |
| Hoạt động trải nghiệm, hướng nghiệp (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0013 |
| Tiếng Anh | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt; đề mẫu: tieng-anh-8.json | chờ duyệt | TK-0014 |
| Giáo dục địa phương (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | chờ duyệt | TK-0049, TK-0050, TK-0051, TK-0052, TK-0053, TK-0054 |

## THPT

| Môn | Loại | Lớp 10 | Lớp 11 | Lớp 12 | Nguồn trong danh mục |
|---|---|---|---|---|---|
| Ngữ văn | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | TK-0003 |
| Toán | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | TK-0004 |
| Lịch sử | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | TK-0024, TK-0019, TK-0020 |
| Địa lí | Lựa chọn | chờ duyệt | chờ duyệt | chờ duyệt | TK-0025, TK-0020 |
| Giáo dục kinh tế và pháp luật | Lựa chọn | chờ duyệt | chờ duyệt | chờ duyệt | TK-0005, TK-0020 |
| Vật lí | Lựa chọn | chờ duyệt | chờ duyệt | chờ duyệt | TK-0015 |
| Hóa học | Lựa chọn | chờ duyệt | chờ duyệt | chờ duyệt | TK-0026 |
| Sinh học | Lựa chọn | chờ duyệt | chờ duyệt | chờ duyệt | TK-0027 |
| Công nghệ | Lựa chọn | chờ duyệt | chờ duyệt | chờ duyệt | TK-0008 |
| Tin học | Lựa chọn | chờ duyệt | chờ duyệt | chờ duyệt | TK-0009 |
| Âm nhạc (nx) | Lựa chọn | chờ duyệt | chờ duyệt | chờ duyệt | TK-0010 |
| Mĩ thuật (nx) | Lựa chọn | chờ duyệt | chờ duyệt | chờ duyệt | TK-0011 |
| Giáo dục thể chất (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | TK-0012 |
| Giáo dục quốc phòng và an ninh | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | TK-0035 |
| Hoạt động trải nghiệm, hướng nghiệp (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | TK-0013 |
| Tiếng Anh | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | TK-0014 |
| Giáo dục địa phương (nx) | Bắt buộc | chờ duyệt | chờ duyệt | chờ duyệt | TK-0049, TK-0050, TK-0051, TK-0052, TK-0053, TK-0054 |

## Nhánh ngoài bảng lớp

- **Ngoại ngữ khác** (NN1/NN2: Anh, Nga, Nhật, Pháp, Trung Quốc, Hàn Quốc, Đức) và **Tiếng dân tộc** (Bahnar, Chăm, Êđê, Jrai, Khmer, Mông, Mnông, Thái, Raglai): chọn ngôn ngữ và chương trình/trình độ, không gán cứng theo lớp (`src/lib/education-catalog.ts`, `LANGUAGE_PACKAGES`). Trạng thái: chờ duyệt; người duyệt: chưa có.

## Tổng hợp

- Ô môn–lớp: 161; gói kiến thức: 1 (personal-fixture-math6, needs_review); đề mẫu: 7.
- Đề mẫu theo cấp: Tiểu học 1, THCS 6, THPT 0.
- Đề mẫu có môn/lớp không khớp danh mục: tieu-hoc-3.json (tieu_hoc, lớp 3).
- Việc còn thiếu ở mọi ô: yêu cầu cần đạt đã đối chiếu, mục lục đúng ấn bản, bộ đề–đáp án–rubric được giáo viên duyệt (đúng như `getEducationReadiness`).
