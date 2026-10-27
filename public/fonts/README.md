# Font tiếng Việt của ExamCraft

Giao diện: Noto Sans (`ExamCraft Sans`). Đề in: Times New Roman trên máy có sẵn font, Noto Serif (`ExamCraft Serif`) dự phòng trên thiết bị khác. Công thức giữ font KaTeX riêng. Không sửa nội dung/Unicode của tài liệu giáo viên.

Nguồn chính thức Google Fonts, tải ngày 27/10/2026:

- https://github.com/google/fonts/tree/main/ofl/notosans
- https://github.com/google/fonts/tree/main/ofl/notoserif
- Tệp nguồn: `NotoSans[wdth,wght].ttf`, `NotoSans-Italic[wdth,wght].ttf`, `NotoSerif[wdth,wght].ttf`, `NotoSerif-Italic[wdth,wght].ttf` tại thư mục tương ứng, raw.githubusercontent.com/google/fonts/main/ofl/.

Giấy phép SIL Open Font License 1.1 đi kèm đầy đủ trong `NotoSans-OFL.txt`, `NotoSerif-OFL.txt`; giữ thông báo bản quyền khi phân phối. Các font được chuyển WOFF2 với fontTools 4.67.0/Brotli 1.2.1, cố định trục chiều rộng 100, giữ trục độ đậm 100–900 và toàn bộ glyph, không chia subset ngôn ngữ để tránh tách dấu tổ hợp. Không cần Google Fonts hay dịch vụ mạng lúc chạy. Tổng bốn tài nguyên khoảng 2.1 MB; trình duyệt chỉ tải mặt chữ thực sự sử dụng và lưu cache.

Hash nguồn/đầu ra và kiểm đủ codepoint tiếng Việt NFC/NFD: `qa/rebuild-2026-10-27/typography/fonts.json`. Kiểm hồi quy: `npm run test:typography` trên server/DB thử được bảo vệ.
