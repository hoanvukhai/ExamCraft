# Đồng bộ font tiếng Việt và kiểm đề in — 27/10/2026

Trạng thái: WAITING_REVIEW. Mã + test + font: `381a437`; nền trước sửa `4689a16`. Bản chạy thử: `AhiXeEfCmodeHTtXmhyhD`, localhost:3117, `isolatedTest=true`, AI thật tắt.

## Kết quả

- Giao diện dùng Noto Sans lưu trong dự án, đủ dấu tiếng Việt, có mặt chữ thường/nghiêng và độ đậm. Không cần gọi Google Fonts lúc mở ứng dụng.
- Nhóm chữ có chân của đề, ma trận, đặc tả, thẻ câu hỏi dùng Times New Roman trước; thiết bị không có Times dùng Noto Serif đi kèm. Word tiếp tục Times New Roman. Không ép font lên các ký hiệu/công thức KaTeX.
- Điều khiển A4 hiện cả trên điện thoại. Phần trăm là tỷ lệ thật, có nút 100% và Vừa khung riêng; phóng lớn vẫn cuộn tới cả mép trái/phải. Giữ vùng đọc đủ cao ở điện thoại nằm ngang; in luôn trở về kích thước chuẩn và đợi font sẵn sàng.
- Không sửa nội dung, khoảng trắng hoặc chuẩn hóa Unicode của tài liệu giáo viên; không migration, không ghi DB chính, không gọi provider thật.

## Nguyên nhân có bằng chứng

Token serif cũ là `ui-serif, Georgia, Cambria, Times New Roman, ...`. Chrome thực tế dùng Georgia-Bold xen Cambria-Bold ngay trong một dòng tiếng Việt. Cùng câu dạng dấu tổ hợp NFD cũng bị ghép Georgia/Cambria. Vì vậy dấu và thân chữ có hình dáng/vị trí không đồng bộ; không phải nội dung được cố tình chèn khoảng trắng.

- Trước: [before-fonts.json](before-fonts.json), [ảnh trước](before-fonts.png).
- Sau: [after-fonts-and-zoom.json](after-fonts-and-zoom.json). Từng mẫu NFC/NFD, chữ thường/đậm/nghiêng, sáng/tối chỉ có một font cho mỗi vai trò: Noto Sans, Times New Roman hoặc Noto Serif dự phòng. Không còn Georgia/Cambria trong các mẫu này.
- Zoom cũ nhân cả tỷ lệ vừa khung với tỷ lệ hiển thị, nên nhãn 100% chưa phải 100% thật. Zoom mới phân biệt hai chế độ. Khi thu cả A4 vào màn hình hẹp, chữ vẫn nhỏ theo tỷ lệ vật lý; dùng 100%/phóng to và cuộn ngang để đọc rõ.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả / bằng chứng |
|---|---|
| Production build, một worker, heap 1024 | Đạt, [build.log](build.log) |
| TypeScript và lint các tệp sửa | Đạt, [typecheck.log](typecheck.log), [lint.log](lint.log) |
| `npm run test:typography` | 4/4 đạt gồm test cha; [browser.log](browser.log) |
| Ma trận kiểm font | 36 mẫu: ba vai trò × NFC/NFD × thường/đậm/nghiêng × sáng/tối; một font/mẫu, kiểm actual platform font qua Chrome CDP |
| Thu phóng A4 | 60/100/150%; viewport 1440×1000, 375×812, 320×740, 568×320; tỷ lệ A4 đúng, mép trái/phải tới được, Vừa khung không tràn, vùng đọc không biến mất khi nằm ngang |
| Admin sau đổi font | 11/11 đạt gồm test cha; tài khoản/menu/popup, tìm/lọc/phân trang, sáng/tối, dọc/ngang; [admin.log](admin.log), thư mục [admin](admin/) |
| Luồng F3 | Đạt: đáp án/song song/Word, công thức và in; [pilot-F3.log](pilot-F3.log) |
| Luồng F15 | Đạt: đề 60 câu, không tràn lề ngang, không có khối câu cao hơn trang, số trang PDF hợp lý; [pilot-F15.log](pilot-F15.log) |
| Hồi quy header, kế hoạch xuất đề, song song, toán, DOCX dài | 27/27 đạt; [regression.log](regression.log) |
| Bảo toàn đề đang xem | Đọc DB trước/sau xem/zoom/xuất và so sánh toàn bộ bản ghi, không đổi nội dung hoặc revision; fixture riêng được dọn, [cleanup.json](cleanup.json) |

Ảnh đã xem trực tiếp: [mẫu sáng](font-specimen-light.png), [mẫu tối](font-specimen-dark.png), [ma trận](matrix-fit.png), [điện thoại 60%](phone-paper-60.png), [100%](phone-paper-100.png), [150%](phone-paper-150.png), [bản in](print.png). Ảnh 100%/150% trên điện thoại chỉ hiện một phần chiều ngang giấy, có thể cuộn — đây là kích thước thật, không phải mất nội dung.

Tệp để đối chiếu: [PDF tiếng Việt](vietnamese-print.pdf), [PDF đề dài](long-exam-print.pdf). Bộ kiểm đọc XML Word để xác nhận Times New Roman và giữ nguyên tiếng Việt dạng dấu tổ hợp; chưa mở Word native trên máy để đối chiếu từng trang.

## Font, dữ liệu và giới hạn

- Nguồn Google Fonts chính thức, giấy phép OFL và quy trình chuyển tại [public/fonts/README.md](../../../public/fonts/README.md). Hash TTF nguồn/WOFF2 đầu ra, kiểm codepoint tiếng Việt NFC/NFD: [fonts.json](fonts.json). Giữ đầy đủ giấy phép, không thêm dependency runtime để xử lý font.
- Tổng bốn tài nguyên font khoảng 2.1 MB; chỉ mặt chữ sử dụng mới tải, sau đó dùng cache trình duyệt. Mỗi vai trò cố ý có kiểu chữ khác: giao diện sans, tài liệu serif.
- Phone là mô phỏng viewport/DPR trong Chrome cài sẵn, chưa kiểm thiết bị Android/iPhone thật hay Safari. Thiết bị thiếu Times đã được kiểm riêng bằng cách buộc Noto Serif, nhưng độ rộng chữ/phân trang giữa Times và Noto có thể khác nhẹ.
- Kiểm zoom ở đây là zoom A4 trong ứng dụng, không tuyên bố đã kiểm mọi mức zoom trình duyệt hay mọi máy in. Khi thu rất nhỏ vẫn có sai khác raster tùy màn hình.
- Test chỉ tạo tài khoản/đề giả trong đúng `examcraft_test_20261022`, xác nhận tên DB thực và health trước ghi. Xóa theo ID/owner riêng, giữ tài khoản/đề có sẵn. Không chép key/cookie/.env vào báo cáo. Các runner F3/F15 cũ vẫn tạo artifact tại QA25/tmp; không đưa các thay đổi đó vào commit đợt này.
- Trong lúc dựng kiểm, sửa kỳ vọng API tạo đề thành HTTP200 và đổi tên biến fixture tránh che `document` trong kiểm kiểu. Lượt cuối các kiểm trên đều đạt. Lỗi quyền tạo thư mục build ban đầu được xử lý bằng chạy build được cấp quyền; không thay mã để bỏ kiểm.

## Tiếp nối

Chủ dự án tải lại trang và đối chiếu phần đã chụp lỗi. Claude duyệt commit/bằng chứng; không tự đóng CV, không sửa checklist03/hồ sơ02/ASSIGNMENTS/BATCH_REVIEWS. Giữ quyết định đã chốt: ExamCraft không đặt cap AI theo ngày, chỉ theo nhà cung cấp. Không mở thêm tính năng trong đợt sửa font.
