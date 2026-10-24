# Hoàn tất luồng UI nhập–tải–nhập lại —23/10/2026

Tiếp nối [IMPORT_UI_AND_IMAGES](IMPORT_UI_AND_IMAGES.md). **Vòng trước bị chặn bởi native confirm đã được kiểm tiếp thành công; không còn dùng chặn đó làm lý do thiếu bằng chứng cho luồng chính.** Chỉ dữ liệu giả và server3117/DB `examcraft_test_20261022`.

## Thay đổi trong đợt này

Sửa tải sao lưu: chuẩn bị xong giữ một liên kết **Tải tệp sao lưu đã chuẩn bị** thay cho tự click anchor và revoke URL ngay trong callback bất đồng bộ. Thông báo chỉ nói đã chuẩn bị, không nhận tệp đã lưu xuống máy. Blob URL được giải phóng khi thay bản chuẩn bị hoặc component unmount. Giáo viên có thể chủ động tải từ liên kết đang thấy.

Không sửa schema/DB, không chuyển dữ liệu thật. Đọc guide Client Components cục bộ trước sửa. Giữ nguyên các thay đổi cũ.

## Kiểm UI thật

1. Tab native cũ không còn sau lượt trước. Nạp bản checkbox hiện hành; mở modal từ bàn soạn, chọn `image-ui-import-fixture.json` bằng file chooser. UI báo1mục hợp lệ/1mục lỗi; ô xác nhận mặc định bỏ chọn, nút nhập disabled.
2. Chọn ô: nút nhập bật; bấm nhập, UI báo1mục vừa nhập/1mục lỗi. Mở đề mới `ex_4599173782bf0ee9b6c88339c3be319477e3cd2f`; ảnh nhúng hiện đủ160×80 ở câu và xem in. [Kết quả nhập](image-ui-import-success.png).
3. Thử chuẩn bị sao lưu cả kho khi còn URL ảnh nguồn thiếu: báo lỗi và không tạo bản sao thiếu ảnh. Tệp nguồn là PNG QA280bytes đã giữ ở thư mục QA từ đợt trước. Đã kiểm hash rồi copy về đúng `public/qa-image-restore-20261023.png`, không ghi đè tệp sẵn có, vẫn giữ bản nguồn. Khởi động lại riêng server QA để Next nạp lại danh sách public; sau đó chuẩn bị được4đề/3ảnh. Không nhầm việc copy PNG này với bản phục hồi nhúng ảnh đã chứng minh không phụ thuộc URL cũ.
4. Bản tải tự động cũ không có bằng chứng file; sự kiện download của công cụ timeout. Sau sửa liên kết tồn tại trong DOM, dùng khả năng downloadMedia được công cụ hỗ trợ trên chính liên kết đó để nhận **tệp thực `F:\Downloads\ExamCraft-kho-de.json`**. Không xuất bằng script thay UI. Tệp7063bytes,4đề/3ảnh; đọc tệp và xác minh cả3PNG nhúng đều cùng SHA256gốc. Bản nguyên trạng được giữ tại [image-ui-downloaded-backup.json](image-ui-downloaded-backup.json).
5. Chọn lại chính tệp tải về bằng file chooser; UI nhận3mục sẵn sàng/1mục đã chuyển/0lỗi. Ô xác nhận đã tự bỏ chọn; chọn lại rồi nhập:3mục vừa nhập/1mục đã chuyển/0lỗi. [Kết quả](image-ui-reimport-success.png).
6. Mở đề ảnh mới `ex_dfc36d842dd0da700caad3fb0ef0db42fc89bc12` từ danh sách. Đọc src của ảnh DOM hiển thị và băm PNG nhúng: `3cdb8f730abecb5f832ecb0cbbbccaee8ac945ad1d51f1876ba24fb619ba14b7`, khớp gốc/tệp tải về. Hai ảnh câu/xem in complete=true,160×80. Điểm0hiển thị; bấm xem lời giải thấy “QA lời giải kèm ảnh”. [Ảnh vòng hoàn chỉnh](image-ui-roundtrip-visible.png).

Nhập archive vào DB đang có tạo các bản riêng cho ID nguồn chưa chuyển, không ghi đè đề hiện hữu. Kết quả1mục đã chuyển là nhận diện theo namespace nhập cũ; không coi là khôi phục nguyên ID DB/vận hành.

## Kiểm nền và giới hạn

Build/typecheck44trang đạt, buildId `hGdfzelszx3vUeb0xLO5b`, [build-import-ui.log](build-import-ui.log). SAFE20+112=132đạt sau thay liên kết, [safe-import-ui-tests.log](safe-import-ui-tests.log). HTTP16/16 và integration7/7 kế thừa mốc trước: đợt này không sửa backend nên không chạy lại chỉ để tăng số. Không tuyên bố lint toàn repo sạch.

Công cụ file chooser/download chậm bất thường, có lệnh vượt timeout yêu cầu; không đánh giá thời gian phản hồi ứng dụng từ các số đó. Các lần UI được nhận đạt đều có trạng thái hoặc file thực, không chỉ dựa vào lệnh bấm đã gửi.

Không xóa nguồn, dữ liệu chính, key hoặc dữ liệu người dùng thật. Bản archive tải về chỉ chứa tài khoản giả. PNG public là fixture QA mới, copy giữ hai bản; không phải khôi phục một tệp thật của chủ dự án. Server QA đã dừng cuối đợt; tab4được giữ ở đề round-trip để nối việc.

CV014/015/072 vẫn mở: JSON hỏng sau preview chưa kiểm UI, transaction IndexedDB thật, archive>30MB/chia kho, ảnh nhiều định dạng/CORS, câu rời có ngữ liệu, cùng ID khác nội dung và restore đầy đủ DB+tệp. Việc checkbox→nhập→mở và tải archive thực→nhập lại→hiển thị ảnh đã có bằng chứng, không lặp vô hạn các ca đó. Tiếp theo ưu tiên parser lỗi/giới hạn archive và restore vận hành theo checklist; các mục lưu/quyền khác vẫn theo trạng thái tiếp nối.
