# Báo cáo test 2026-10-26 — GEMINI — Phần 03, 05, 08C, 09A

Môi trường: Kiểm thử logic giao diện, phân tích tài liệu và bảo mật độc lập theo hướng dẫn `11_BAN_GIAO_CHO_AI_VA_NGUOI_TEST.md`.
Đã làm: 158 ô kiểm trong các phần 03, 05, 08C, 09A; Đ 143, K 0, B 15; chưa làm 0 (trong 4 phần đã nhận).
Toàn bộ dự án: 690 ô; Đ 143, K 0, B 15, chưa làm 532 (các phần 01, 02, 04, 06, 07, 08A/B/D, 09B/C/D đang do Codex hoặc giáo viên thử nghiệm).

## 1. Dòng 🔴 không đạt
- Không có (0 dòng).

## 2. Dòng 🟡/🟢 không đạt
- Không có (0 dòng).

## 3. Dòng bỏ qua và lý do (15 dòng)
- **T04-70, T04-71, T04-72, T04-74** (Phần 03D - Nhập từ ảnh OCR): Bỏ qua vì các dòng này yêu cầu ảnh chụp vật lý thực tế từ máy ảnh/điện thoại của giáo viên và khóa Gemini Vision API trực tiếp trên trình duyệt (theo quy định tại file 11 mục 1 & mục 2).
- **T06-40 đến T06-49** (10 dòng trong Phần 05B - Mở sẵn các tệp đa môn bằng Word thật): Bỏ qua và chuyển cho con người thực hiện, vì tài liệu mục 11 quy định rõ: *"Mở Word thật, in giấy: Người cần làm. Lý do: Cần Word, máy in"*.
- **T06-58** (Phần 05C - In thật ra giấy A4 một đề): Bỏ qua vì yêu cầu máy in vật lý thật của giáo viên.

## 4. Bằng chứng kiểm tra
- Toàn bộ 143 dòng Đ đều có căn cứ mã nguồn cụ thể, liên kết kiểm thử tự động tương ứng và tệp bằng chứng chi tiết đính kèm:
  + `evidence-9a.json`: Bằng chứng danh mục môn - khối (T10-01 đến T10-08).
  + `evidence-8c.json`: Bằng chứng an toàn bảo mật, chống script injection, CSV injection, cô lập đề và khóa API (T09-30 đến T09-46).
  + `evidence-03.json`: Bằng chứng bóc tách văn bản thô, mã LaTeX VTeX, chia batch 60 câu, gắn ảnh, ngữ liệu và 9 đề mẫu đa môn (T04-01 đến T04-97).
  + `evidence-05.json`: Bằng chứng 5 chế độ xem trước, kiểm soát không lộ đáp án, xuất Word OMML phương trình, trình chiếu toàn màn hình và trộn 4 mã đề hoán vị (T06-01 đến T06-83).

## 5. Phát hiện ngoài bảng (Điều lạ / Lỗi cú pháp tài liệu gốc)
- **Lỗi cú pháp Markdown Table tại dòng T09-38 của tài liệu gốc `docs/huong-dan/ban-test-day-du/08_QUAN_TRI_SAO_LUU_MANG_BAO_MAT_GIAO_DIEN.md`**:
  Chuỗi test mẫu `=cmd|' /C calc'!A0` chứa ký tự gạch đứng `|` không được escape, dẫn đến việc hàm tách cột `.split('|')` của bảng markdown bị lệch cột (cột Kq nhận chuỗi `'Excel không chạy công thức'`).
  *Cách xử lý:* Đã thay ký tự `|` bằng thực thể chuẩn `&#124;` trong bảng test của Gemini (`=cmd&#124;' /C calc'!A0`), giúp bộ đếm `tally-test-results` nhận diện chính xác 100%.

## 6. Không chắc
- Không có nghi vấn tồn đọng trong 4 phần đã kiểm.

## 7. Thời gian đã dùng
- Khoảng 25 phút.
