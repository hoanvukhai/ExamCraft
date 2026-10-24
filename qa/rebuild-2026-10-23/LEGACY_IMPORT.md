# Bảo toàn và nhập dữ liệu cũ —23/10/2026

Phạm vi CV014/015 và kiểm tài khoản trong CV011. Không áp dụng chuyển dữ liệu thật; chỉ thay mã và kiểm trên nguồn giả/DB thử. Tiếp nối [đợt nháp và quyền](TABS_AND_REVOCATION.md).

## Đã sửa

- API nhập kiểm tài khoản kỳ vọng và same-origin trước đọc/ghi; modal gửi tài khoản cho cả xem trước và nhập thật. Thao tác thùng rác trong modal cũng gửi tài khoản kỳ vọng. Tab dùng cookie tài khoản khác không được chuyển dữ liệu riêng vào người mới.
- Đề cũ dạng danh sách liên kết `items` được chuyển qua adapter DB, sắp theo position, giữ pointsOverride0, sectionId, ngữ liệu, hình và lời giải. Vị trí thiếu/trùng hoặc danh sách sai kiểu báo lỗi thay vì nhận thành đề rỗng. Đề/câu nhập vẫn là bản nháp chưa xác minh; không kế thừa dấu đã duyệt từ nguồn cũ.
- Sao chép từ localStorage hoặc tệp sao lưu vào IndexedDB chỉ thêm ID chưa có, không dùng put ghi đè mục hiện hữu. Kiểm cấu trúc/mã trước transaction. Cờ migration không đánh dấu xong cho danh sách sai kiểu. Nguồn localStorage không bị xóa.
- Xuất/xem dữ liệu cũ gom cả IndexedDB, `examcraft_library`, `saved_exams` và `examcraft_current_exam` bằng đọc thuần; không tự chép đè giữa các kho. Bản giống hệt được gộp, bản cùng ID nhưng nội dung khác vẫn có trong dữ liệu thu thập. Server vẫn nhập lần đầu theo ID, không tự gộp các phiên bản khác nội dung; bản nguồn và báo cáo phải được giữ để xử lý trường hợp đó.
- Câu rời có tham chiếu/ngữ liệu nhúng hiện chưa có đường chuyển liên kết đầy đủ: báo lỗi mục rõ ràng và không ghi câu, tránh báo thành công với ngữ liệu thiếu. Có thể nhập đề chứa đầy đủ ngữ liệu hoặc bổ sung trong kho mới. Đây là giới hạn còn mở, chưa coi nhập ngân hàng cũ đã hoàn tất.

## Bằng chứng mới

- [safe-legacy-tests.log](safe-legacy-tests.log):20ca cũ +110ca bổ sung đạt (130tổng). Thêm2ca về local không ghi đè, đọc đủ nguồn/không đổi byte, adapter đề liên kết giữ nội dung/điểm0/hình/ngữ liệu/thứ tự và từ chối dữ liệu sai. Suite portable8/8 cũng đã chạy riêng.
- [build-legacy.log](build-legacy.log): build44trang và TypeScript đạt. Bản cuối `LeIrAuoZ_qjBJmdbAy_sm`.
- Lint định hướng5file helper/service/route/test đạt; không chạy hoặc tuyên bố lint toàn repo sạch. Thay đổi DB local được build kiểm kiểu với Dexie, nhưng test local dùng table/storage giả, chưa phải transaction IndexedDB thật trong browser.
- [http-legacy-tests.log](http-legacy-tests.log):16/16 gồm14ca nghiệp vụ +2cha, trên bản dựng cuối và DB `examcraft_test_20261022`. Ca mới: batch1đề+1câu hợp lệ và2mục lỗi; xem trước không thay số dòng; nhập thật chỉ ghi mục hợp lệ; sau khi sửa đề máy chủ, nhập lặp không ghi đè hoặc thêm revision; sửa nguồn lỗi rồi nhập tiếp không nhân đôi mục đã chuyển. Hai tài khoản nhập cùng nguồn tạo ID riêng; tài khoản khác không đọc đề riêng; pin sai409 và cross-origin403. Câu rời có ngữ liệu bị báo lỗi và không nhập. Bản input fixture không đổi sau toàn bộ thao tác.
- Các ca HTTP còn lại hồi quy lưu/quyền, cấu trúc, public/lượt làm, ngân hàng, memory và auth. JSON tại thư mục22/10 do runner ghi kết quả mới nhất; log riêng ở trên xác định đúng đợt. Test tự dọn các tài khoản/dữ liệu giả của lượt chạy.

## Bảo toàn và giới hạn

Không ghi DB chính, không chạy migration mới, không đọc/xóa/chuyển tự động kho browser thật, không gọi AI hoặc dùng key. Server QA đã dừng cuối đợt. Integration7/7 và browser các đợt trước là bằng chứng kế thừa, không phải kiểm UI nhập lần này.

CV014/015 còn mở: UI xem trước/chọn mục/nhập từ browser thật, giao dịch IndexedDB thực, giải quyết cùng ID khác nội dung, ngân hàng có ngữ liệu rời, tài liệu bất thường/asset ngoài JSON, khôi phục đầy đủ DB+tệp, recent/filter/star/trash/restore và tổng đối chiếu dữ liệu thật. Hình được giữ cấu trúc/URL trong fixture; chưa chứng minh file ảnh tồn tại hoặc đã được sao lưu/khôi phục.

Tiếp tục các ca nháp nhiều tab/offline và phản hồi quyền đến muộn theo hồ sơ ngắn; thiếu browser độc lập không được quy đổi thành đã kiểm. Chưa đóng các CV từ số PASS.
