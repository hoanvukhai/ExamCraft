# V2-1 — Chọn và sửa ngay trên tờ đề

Nhánh `claude/editor-v2` (tách từ `claude/editor-canva-a`). Làm theo `qa/rebuild-2026-10-31/editor-v2/DAC_TA_TRANG_SOAN_V2.md`. DB thử `examcraft_test_20261022`, không gọi AI thật, không đổi Prisma. Máy thử: http://127.0.0.1:3130.

## Đã làm (mã `TS2-x` của đặc tả)

| Mã | Việc | Kết quả |
|---|---|---|
| TS2-1 | Gộp chỗ trùng | Bảng bên trái không còn cây thẻ câu, nên nội dung đề chỉ hiện một lần (trên tờ đề). Bỏ ô Chế độ, nút Soạn/Xem trên điện thoại, nút ⋯ trên máy tính, ngăn kéo Hỏi AI trong trang soạn, thẻ "AI tạo câu" ở thanh trái, nút Trình chiếu ở thanh dưới, nút Hoàn tác/Làm lại riêng từng câu, nút "Áp dụng câu vào đề". Đã xóa `QuestionCard`, `OutlineEditor`, `EditorDetailSlot`, `QuestionAiReview`, `PhonePreview`, `EditorQuestionHeading` |
| TS2-6 | Mô hình chọn | Mọi thứ trên tờ đề có mã chọn (`src/lib/canvas-objects.ts`): toàn đề, khối in (đầu trang, dòng thí sinh, lời dặn, cuối đề, chân trang), phần, ngữ liệu, câu, phương án, mệnh đề Đúng/Sai, ý, hình, dấu ＋. Một lần bấm chọn thứ sâu nhất dưới chuột, không còn bấm đúp. Rê chuột có khung nét đứt, đang chọn có khung màu hệ thống. Ctrl+bấm thêm/bớt câu, Shift+bấm chọn dải câu. Bàn phím: ↑↓ cùng cấp, → vào con, ← và Esc lên cha, Enter vào ô chi tiết, Delete xóa, Ctrl+D nhân bản, Alt+↑↓ đổi chỗ, Ctrl+Z / Ctrl+Shift+Z hoàn tác / làm lại |
| TS2-5 | Hàng công cụ | Một hàng: `Thêm ▾`, `AI`, đường dẫn bấm được (Toàn đề › Phần I › Ngữ liệu › Câu 3 › Phương án B), lệnh của thứ đang chọn (Lên, Xuống, Nhân bản, Khóa, Góp ý, Khác ▾…), và khi con trỏ ở trong ô chữ thì có nhóm định dạng (Chèn công thức, In đậm, In nghiêng, Chữ ▾) |
| TS2-7 | Thêm theo vùng chọn | Một menu Thêm dùng cho hàng công cụ, dấu ＋ trên tờ đề và form "Điểm chèn". Chèn đúng chỗ đang chọn: 7 dạng câu, Phương án / Mệnh đề / Ý / Cặp / Mục mới (theo dạng câu), Ngữ liệu, Dùng lại ngữ liệu, Phần mới, Ngắt trang, Từ ngân hàng, Nhập Word/Ảnh, Sinh bằng AI. Câu mới được chèn ngay vào đề; để trống rồi chọn chỗ khác thì tự bỏ ("Đã bỏ câu trống") |
| TS2-8 | Bảng trái | 5 mục: Chi tiết, Mẫu, Ngân hàng, Nhập đề, Dàn ý. Chi tiết hiện form của thứ đang chọn: Toàn đề (Thông tin đề, Trang và in), khối in (chỉ các dòng của khối đó), Phần, Ngữ liệu, Câu và các ô con (con trỏ nhảy vào đúng ô khi bấm chữ trên tờ đề), Điểm chèn. Dàn ý: mỗi mục một dòng, kéo thả đổi chỗ, ô chọn nhiều câu, lọc Cần rà soát / Có góp ý |
| TS2-9 | Tự áp dụng, hoàn tác | Form câu bỏ nút Áp dụng: sửa đến đâu tờ đề đổi đến đó và lưu sau 600ms khi hợp lệ; chưa hợp lệ thì giữ nháp và hiện lý do. Hoàn tác / Làm lại chung ở thanh trên (`src/lib/undo-history.ts`): mỗi bước chỉ trả lại đúng những đối tượng còn như lúc vừa sửa, đối tượng bị sửa tiếp thì bỏ qua và báo |
| TS2-12 | Bảng phải | 3 thẻ: AI, Góp ý và cộng tác, Rà soát. Bảng AI là một chỗ: Trò chuyện (trợ lý sửa đề, hỏi đáp), Sinh câu, Thẩm định đáp án (cho một câu); luôn ghi "Đang nói về: Câu 3"; thiếu khóa AI thì bảng tự hướng dẫn, không còn hộp thoại. Rà soát là thẻ; chỉ chặn trước Giao bài, Xuất / In / Trình chiếu không bị chặn |
| TS2-4 | Thanh trên | ☰, ↶ ↷, tên đề, trạng thái lưu, `Rà soát · n` (khi có), Mời, Xuất ▾ (đầu menu ghi "Đề còn n mục cần xem"), Giao bài, ảnh đại diện. Trên điện thoại ⋯ giữ Xuất, Rà soát, Hoàn tác, Làm lại, Cùng soạn, Kết quả |
| Lỗi cũ | Dấu `!` rà soát ở lề | Biểu thức tách số câu bị mất `\d` nên dấu `!` chưa từng hiện; nay hiện đúng |
| Lỗi cũ | Màu khung chọn | Biến `--ui-primary` chưa từng được định nghĩa; khung chọn dùng màu hệ thống |

## Chưa làm / lệch so với đặc tả (ghi rõ)

- **Thông tin đề vẫn có nút Áp dụng** (8.1 muốn tự áp dụng từng ô). Phạm vi, ma trận cũng giữ cách áp dụng cũ. Mục "Dòng in, vị trí và căn chỉnh nâng cao" vẫn nằm trong Thông tin đề; gộp một chỗ sửa dòng in là việc của V2-4.
- **Bấm đối tượng phụ trên tờ đề:** cặp ghép và mục sắp xếp chưa có mã chọn riêng trên tờ (chọn cả câu); phần Hình trong form câu vẫn là danh sách hình có sẵn. Menu Thêm chưa có "Hình", "Công thức", "Bảng" (Công thức nằm trong nhóm định dạng khi con trỏ ở ô chữ).
- **Chọn ở bản Đáp án / Lời giải / Song song:** chỉ chọn được ở bản Đề; các bản kia chỉ để xem.
- **Chọn nhiều:** có Gộp thành 1 câu tự luận, Khóa, Chuyển sang phần, Xóa; chưa có Đặt điểm ▾, Nhân bản nhiều câu.
- **Sao chép / dán (Ctrl+C/V)** để V2-2.
- **Đổi dạng câu từ hàng công cụ (Dạng ▾):** đổi ở ô "Dạng câu" trong Chi tiết.
- **Điện thoại:** đủ dùng (tờ đề toàn bề rộng, nút `Bảng` mở Chi tiết, các bảng đè lên) nhưng chưa phải ngăn kéo từ đáy; còn ba hàng ở đáy màn hình. Làm ở V2-6.
- **Trang, dải trang, Trình chiếu, bố cục in, cùng soạn:** giai đoạn V2-2 đến V2-5.

## Kiểm

- SAFE 569/569 (thêm `canvas_objects` 5 ca, `undo_history` 6 ca; viết lại 3 ca đọc `OutlineEditor` sang `A4Preview` và `EditorOutline`).
- Kiểu, lint: 0 lỗi. Ratchet màu: 2488 (giảm 20 vì bỏ mã cũ; baseline đã hạ).
- Trình duyệt: editor 12/12 (viết lại: chọn trên tờ đề, khối in, câu mới tự lưu, câu trống tự bỏ, rà soát không chặn xuất, phần và ngữ liệu, thông tin đề giữ chữ đã gõ khi xem bảng khác, lưu lỗi vẫn giữ việc, lệnh + phím + chọn nhiều + một hàng công cụ ở mọi cỡ màn hình, hoàn tác, mất quyền sửa, thẻ định dạng + đường ngắt trang), frame 4/4, teacher 7/7, library 6/6, admin 11/11, typography 4/4, pilot F1–F25 (trừ F8) 24/24 (F2, F3, F5, F21, F23 viết lại theo giao diện mới).
- Ảnh 1440/1024/568/375/320 sáng tối: thư mục này.
- Chưa: thử bằng điện thoại thật; mở Word thật; không chạy AI thật.
