# Giai đoạn A của trang soạn kiểu công cụ thiết kế (30/10/2026)

Nhánh `claude/editor-canva-a` (worktree `tmp/canva-a`). Nền: commit đặc tả `4d62224` + commit chụp nguyên trạng các sửa dở ngày 29–30/10 của chủ dự án/Codex/Gemini (`snapshot`). Không đụng thư mục chung, không DB chính, không đổi schema. Bản thử: **http://127.0.0.1:3130** (production build, DB thử `examcraft_test_20261022`; dùng được các tài khoản thử đã có).

## Đã làm (đối chiếu đặc tả `DAC_TA_TRANG_SOAN.md`)

| Mã | Việc | Kết quả |
|---|---|---|
| TS-3.1 | Trang soạn ẩn menu trang và thanh phải của khung chung | Xong. `WorkspaceShell` không vẽ menu/rail/tab/thanh điện thoại ở trang soạn |
| TS-3.2 | Bảng trái/phải kéo đổi độ rộng, nhớ độ rộng, thu gọn | Xong (kéo vạch hoặc phím ←/→, lưu localStorage) |
| TS-4 | Thanh trên một hàng: ☰, tên đề, trạng thái lưu, Mời, Xuất, ⋯, Giao bài, ảnh đại diện | Xong. Tài khoản, ghi chú AI, khóa AI, sáng/tối nằm trong menu ảnh đại diện |
| TS-5 | Hàng công cụ một hàng, không còn khối cao 112px | Xong. Cố định: Thêm ▾, AI ▾; sau đó là đường dẫn vùng chọn và lệnh của vùng chọn, tràn vào "Khác ▾" |
| TS-9 | Bảng trái: Nội dung, Thông tin, Mẫu, Ngân hàng, Nhập đề, AI tạo câu | Xong. Ba hộp thoại nguồn (Ngân hàng/Nhập/AI) thành bảng trái, ghi "thêm vào sau Câu n / cuối Phần…" |
| TS-10 | Bảng phải: AI (Sửa đề), Hỏi AI | Dùng lại bảng cũ; mở bằng menu AI ▾ |
| TS-11 | Thanh dưới: bản đầu ra, thu phóng, Trình chiếu | Xong (bản Đề/Đáp án/Lời giải/Ma trận, Song song, thu phóng, Trình chiếu) |
| TS-16 | Điện thoại | Một thanh trên, hàng công cụ ở **đáy** màn hình, công tắc Soạn/Xem bằng hai biểu tượng, các bảng thành hàng chip + toàn chiều rộng |
| TS-18 (một phần) | Bỏ hai dòng gợi ý lặp ở mỗi câu | Xong; chuỗi cấm chưa quét toàn bộ |

Sửa lỗi gặp khi làm: khóa hạn chế sửa trước đây khóa luôn khu cứu nháp (nay nằm ngoài khóa); nút công cụ bị CSS ép xuống dòng (`!whitespace-nowrap`); menu thả mở **lên trên** khi nằm ở nửa dưới màn hình; ba mã màu cứng trong các tệp sửa dở được đổi sang biến (baseline màu 3128 → 2508).

## Làm nốt giai đoạn A (đợt 2)

| Mã | Việc | Kết quả |
|---|---|---|
| TS-10 | Bảng phải có thẻ: Chi tiết câu, AI, Rà soát, Góp ý | Xong. Bấm "Chỉnh nội dung" của câu thì bộ soạn chi tiết hiện ở thẻ Chi tiết câu bên phải (cây bên trái chỉ ghi "Đang sửa chi tiết ở bảng bên phải"). Rà soát đề và Góp ý/lịch sử không còn là hộp thoại mà là thẻ ở bảng phải |
| TS-4 | Chọn chế độ Sửa / Góp ý / Xem ở thanh trên | Xong (từ cỡ md). Góp ý và Xem khóa tờ đề; Góp ý mở thẻ Góp ý (chỉ có khi đề đã lưu trên máy chủ) |

## Lệch/chưa làm so với đặc tả (ghi rõ)

- **Dàn ý** không tách tab riêng: cây Phần/Nhóm/Câu ở tab "Nội dung" chính là dàn ý, tách ra sẽ trùng lặp.
- **Thêm ▾ và AI ▾ là hai nút cố định** của hàng công cụ (đặc tả để Thêm ở bảng trái); chọn vậy để nút không biến mất khi chọn câu.
- **Chưa làm:** hoàn tác/làm lại cấu trúc ở thanh trên (cần chụp trạng thái so với CAS và bản máy chủ, nguy cơ mất dữ liệu nên để giai đoạn sau); dải trang và lưới (giai đoạn D); ngăn kéo từ đáy trên điện thoại (hiện bảng phải phủ toàn màn hình).
- Giai đoạn B–F chưa bắt đầu.

## Kiểm (bản dựng riêng, cổng 3130, DB thử)

- Kiểu và lint: sạch (0 lỗi). SAFE 547/547.
- Trình duyệt: editor 10/10, frame 4/4, library 6/6, teacher 7/7, admin 11/11, typography 4/4.
- Luồng F1–F25 (trừ F8): đạt cả 24 (F2, F4, F19, F24 sau khi sửa bộ kiểm theo giao diện mới; đợt 2 sửa lại F3/F4/F24 vì rà soát và góp ý thành thẻ). Kiểm đợt 2: editor 10/10, frame 4/4, teacher 7/7, library 6/6, admin 11/11, typography 4/4, pilot 24/24; ratchet màu 2508 giữ nguyên.
- Bộ kiểm đã sửa theo giao diện mới: `editor`, `frame` (viết lại cho trang soạn không có menu trang), `teacher` (bảng Ngân hàng), `pilot` (lệnh câu trong hàng công cụ, Mời cùng soạn, menu ảnh đại diện), thêm trợ giúp `editor-ui.ts`.
- Ảnh 1440/1024/375: thư mục này.
- Chưa: thử bằng điện thoại thật; so Word/in; không chạy lại AI thật.
