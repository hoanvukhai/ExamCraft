# Hoàn thiện thanh công cụ bàn soạn — 30/10/2026

Trạng thái: bản triển khai đã dựng và kiểm, chờ chủ dự án thử sản phẩm. Nguồn hiện hành: `F:/Workspace/Zazz/ExamCraft`. Đọc báo cáo này thay cho giới hạn của TRIEN_KHAI_DOT_1.md; tài liệu thiết kế vẫn là định hướng, không phải chứng nhận mọi chức năng tương lai đã có.

## Đã thay đổi

1. **Công cụ theo vùng chọn:** câu, phương án, phần, nhóm ngữ liệu và hình có nhãn/đường thao tác riêng. Công cụ đọc handler mới nhất, cập nhật theo trạng thái sửa/nhãn câu và quyền; gỡ mục đang chọn bỏ vùng chọn, gỡ mục khác giữ vùng chọn. Hai lệnh chính và menu Khác giúp vùng hẹp dùng được.
2. **Giữ thao tác ổn định:** dành sẵn chiều cao cho vùng công cụ, tránh câu bị đẩy xuống giữa mousedown/click. Menu Khác dùng menu nổi chung, có giới hạn chiều cao trực tiếp để CSS toàn trang không ghi đè; kiểm cả cạnh ngang và cạnh dưới màn hình.
3. **Một đường sửa văn bản có nháp:** thẻ câu hiển thị nội dung/công thức dễ đọc; bấm nội dung mở bộ soạn đang có nhật ký nháp. Bỏ các state văn bản sửa nhanh và sáu effect thay chữ theo props. Đóng bảng giữ nháp; khi có bản mới từ ngoài, bộ soạn giữ chữ và chặn áp dụng bản cũ.
4. **Công thức theo vùng chữ:** trong bộ soạn, chọn chữ ở nội dung/phương án/mệnh đề/lời giải rồi dùng Chèn công thức, Chỉ số trên hoặc Chỉ số dưới. Công cụ giữ trường, vùng chọn và kiểm giá trị hiện tại; ghi qua cùng nháp, không qua một cơ chế lưu khác.
5. **Ảnh/hình theo phương án:** thêm `ChoiceItem.figures` tùy chọn trong JSON hiện có, không migration/bảng DB mới. Chọn B → Hình trong B mở đúng nhóm hình. Dùng bộ chèn/thay ảnh, chú thích, đồ thị và bảng biến thiên đã có. Chuẩn hóa, payload lưu, bản xem trước, ngân hàng, trình chiếu, bản công khai học sinh và Word được nối cho hình của phương án.
6. **Trộn vẫn giữ hình:** shuffler mang cả đối tượng phương án theo chữ, không dựng lại chỉ key/text rồi bỏ hình. Khóa đáp án tiếp tục trỏ đúng nội dung; bản gốc không bị đổi. Phương án trùng chữ vẫn giữ thứ tự theo bảo vệ cũ.
7. **AI sửa vùng cụ thể:** có biểu mẫu ghi phạm vi và yêu cầu cho nội dung câu, phương án, mệnh đề hoặc lời giải. Gửi kèm ngữ cảnh câu nhưng chiếu kết quả về đúng trường văn bản cho phép; giữ điểm, khóa đáp án, hình và các trường ngoài phạm vi. Kết quả tiếp tục qua đề xuất/nhật ký và kiểm phiên bản hiện có, không tự áp dụng. Nhắc giáo viên kiểm lại đáp án sau khi sửa nội dung.
8. **Thêm đúng chỗ:** menu phần/nhóm có đủ nguồn Tự soạn, Ngân hàng, Word/Ảnh, AI; thao tác của câu có các lệnh thêm ngay sau câu đó. Các lệnh dùng điểm chèn đã có, không dựng đường ghi mới.
9. **Đáp số:** bỏ ô sửa nhanh tách đáp án theo dấu phẩy. Trong bộ soạn, các biến thể vẫn mỗi dòng một cách; khi đổi đáp án chính, bỏ giá trị chính cũ khỏi danh sách tự chấm và luôn đưa đáp án chính mới vào danh sách khi áp dụng. Xóa biến thể không làm mất khả năng chấm đáp án chính. Đã kiểm `1,5`.

## Bằng chứng đã chạy

- SAFE: **547/547 đạt**, gồm hai tệp mới `tests/option_media.test.ts`, `tests/scoped_question_edit.test.ts` đã đưa vào `npm run test:safe`. `safe-authorized.log`. Lần đầu chạy trong quyền hạn thường có ba lỗi ghi fixture EPERM; chạy lại với quyền ghi đúng workspace đạt, không sửa test để bỏ kiểm.
- Kiểm đích trước đó: 48/48 đạt ở nháp, quyền, đáp án, outline, Word/ảnh và trộn. Hai nhóm mới 5/5 đạt: lưu ảnh phương án/whitelist công khai, trộn, Word thường/song song và AI chỉ sửa trường cho phép. `added-tests.log`; kết quả SAFE ở trên bao gồm kiểm mới.
- TypeScript đạt; lint các tệp thay đổi đạt, gồm lần kiểm lại thành phần vùng chọn sau sửa bố cục. `types-final.log`, `lint-final.log`, `lint-layout-menu.log`, `lint-release.log`. Các lỗi effect ở QuestionCard của đợt trước đã được loại bỏ cùng đường sửa nhanh đó.
- Production build cuối đạt với `NEXT_BUILD_CPUS=1`, heap1024; không chạy lint/SAFE cùng build. `build-release.log`. Các bản dựng trung gian tìm ra vấn đề và được thay bằng bản cuối, không coi bản cũ đang chạy là bằng chứng cho mã mới.
- Chrome kiểm thành phần vùng chọn: callback mới nhất, quyền sửa, xóa đúng đối tượng và Toàn đề. `selection-results.json`.
- Chrome kiểm bộ soạn **thật** trên dữ liệu giả cục bộ: đóng/mở lại giữ nháp, chèn công thức vào chữ đã chọn, thêm ảnh chỉ vào B không đổi khóa A, đổi đáp số sang `1,5`, xóa biến thể, nhận bản mới từ nơi khác không ghi đè nháp. `real-editor-results.json`. Màn hình 375px; không provider/DB trong nhóm này.
- Chrome kiểm **bản production trên trang thật**: xác nhận health isolatedTest và SQL current_database trước tạo fixture, đăng nhập tài khoản tạm, chọn B không đổi đáp án, đặt B đúng/lưu, thêm ảnh vào B/lưu/tải lại, hình không sang A; kiểm menu và trang ở375/320px, biểu mẫu đang sửa ở375px, chụp chế độ tối, quay về công cụ toàn đề. Không lỗi JS. `context-live-results.json` và ảnh `context-*.png`.
- Tài khoản, đề và câu của từng lượt kiểm được dọn đúng owner tạm; không xóa dữ liệu khác. `context-cleanup.json` xác nhận user và đề tạm đã gỡ. Không ghi DB chính, không gọi AI/provider thật, không thay bí mật hoặc schema DB.

## Nơi chủ dự án thử

**http://127.0.0.1:3122** chạy production build cuối từ **F gốc**. Không phải tmp/verify-ui hoặc tmp/editor-intermediate của launcher so sánh cũ. Cổng3117 không được thay trong đợt này.

Khi cần chạy lại từ nguồn F gốc đã có bản build:

```powershell
cd F:\Workspace\Zazz\ExamCraft
$env:EXAMCRAFT_TEST_PORT = '3122'
node --import tsx scripts/test-server.cjs --production
```

Không chạy thêm nếu cổng đã mở. Launcher so sánh cũ trỏ worktree khác nên không tự chứa các sửa mới.

Nên thử: chọn chữ cái B, đặt đáp án trên thanh; bấm nội dung để sửa và thử công thức; Hình trong B để thêm ảnh; đóng/mở lại nháp; thử trên đề cũ, xuất Word và xem điện thoại. Nội dung đang sửa phải bấm **Áp dụng câu** để vào đề và tự lưu máy chủ; đóng bảng vẫn giữ nháp riêng.

## Giới hạn thực tế

- Đây là thanh công cụ cho bộ soạn có cấu trúc, chưa phải bộ dàn trang tự do kiểu Canva. Chưa thêm bộ font/cỡ chữ/màu tùy ý, cắt/xoay ảnh hay công cụ vẽ tự do.
- Công thức/chỉ số dùng cú pháp toán đang có và được dựng khi xem; chưa có đầy đủ trình rich text WYSIWYG. Các ý nhỏ, ghép nối, sắp xếp và tiêu chí chấm tiếp tục sửa trong cùng bộ soạn chi tiết; không bỏ chức năng để rút gọn thanh.
- Có ảnh riêng phương án; ảnh riêng lời giải/ý nhỏ chưa mở rộng. Ảnh Word nhập tự động cần kiểm tài liệu thực tế để xác định vị trí trong phương án, không coi xuất Word được là nhập ngược luôn đúng.
- AI giới hạn trường đã kiểm bằng dữ liệu giả; chưa gọi provider thật để đánh giá chất lượng chuyên môn. Nếu hết quyền hoặc đề đã đổi, đường đề xuất vẫn giữ theo bảo vệ sẵn có; không nhận kết quả AI là đã duyệt đúng chuyên môn.
- Kiểm điện thoại là Chrome mô phỏng375/320px, chưa trên điện thoại vật lý/bàn phím của thiết bị thật. Chưa nghiệm thu in giấy/Word desktop hoặc mọi trình đọc màn hình.
- Không chạy lại tất cả bộ pilot cũ vốn có nhãn/vị trí của thiết kế trước; đã có bộ kiểm chuyên biệt cho giao diện này và SAFE. Không suy hoàn thành toàn bộ dự án từ số test.
- Chưa commit/push/gộp vì còn các sửa có sẵn của chủ dự án trên checkout chung. Giữ các bản trước sửa trong nhóm báo cáo C; không chạy lại các script vá lịch sử để ghi đè nguồn hiện hành.

## Tiếp nối

Sửa cốt lõi và kiểm đợt này đã xong, trạng thái **WAITING_REVIEW** để chủ dự án thử. Không tự đóng CV. Checklist03/hồ sơ02 do Claude giữ không sửa. Báo cáo/ảnh/kết quả là bằng chứng của đợt này, không tạo một checklist tổng mới.
