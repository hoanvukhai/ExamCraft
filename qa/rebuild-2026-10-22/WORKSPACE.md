# Bàn soạn, AI và dữ liệu mang theo — 22/10/2026

## Phạm vi đã sửa

- Bàn soạn có biểu mẫu7dạng câu: lựa chọn, đúng/sai, trả lời ngắn, tự luận/thực hành, điền khuyết, ghép nối, sắp xếp. Sửa đáp án/lời giải/rubric/điểm0 và yêu cầu cần đạt. Đổi nội dung làm câu về nháp; AI không tự duyệt thay giáo viên.
- Thông tin đề cho sửa tên, trường, năm, mã đề, môn/lớp, cách đánh giá và khung nhận thức. Trường/năm/mã để trống không bị UI tự thêm trường giả. Cấu hình tiêu đề không còn âm thầm lưu vào khóa trình duyệt dùng chung giữa các tài khoản.
- Nhập từ dashboard phải chọn lớp và môn tài liệu; không gắn mặc định Toán12. Câu nhập có mã mới, nhãn chưa duyệt. Bộ phân tích text dùng AI được yêu cầu chép đáp án/lời giải có sẵn, không tự giải dưới nhãn trích nguồn.
- Sinh AI kiểm grade–subject, phạm vi, số lượng từng dạng (0hợp lệ), khung mức nhận thức và khóa đáp án theo cách đánh giá. Chưa dùng khóa AI thật để nghiệm thu chất lượng nội dung.
- Rà đáp án từ chối đối chiếu rỗng, thiếu ý, trùng ý, nhãn ngoài tập lựa chọn, tự luận cần người chấm và nhận định mơ hồ. Không dùng phần trăm tự tin làm chứng nhận chính xác.
- Sửa bằng AI qua thẻ câu và thanh trợ lý đều cần người dùng áp dụng; kiểm lại nội dung nền để không áp kết quả cũ lên câu/đề vừa được sửa. Không báo đã sửa toàn đề khi endpoint chưa tạo các thay đổi đó.
- Trộn đề giữ đủ7dạng câu; giữ thứ tự khi có ngữ liệu/phần rõ ràng; câu chưa có khóa không tự nhậnA; mã đề mới không mang định danh bản đã lưu server. Các phương án trùng nội dung được giữ nguyên để không định lại sai khóa.
- Word xuất theo thứ tự editor, giữ ngữ liệu và7dạng; ghép nối/sắp xếp ở bản đề không in thứ tự đáp án. Bỏ barem đúng/sai cố định áp mọi đề. Đáp án thiếu hiển thị rõ. XML đầu ra đã kiểm, chưa thay nghiệm thu bố cục/hình và mở bằng Word thực.
- Ghi chú riêng: bỏ dữ liệu mẫu giả khi kho trống; không tự xóa ghi chú thứ21; không gộp đè mọi mục cùng category; không tự tăng confidence vì đọc nhiều. Phân tích mới để tắt. Profile chỉ coi là sở thích tham khảo, không ghi đè quy định có nguồn.
- Ghi chú có xuất/nhập JSON theo tài khoản. Nhập xem trước, nhận lại không nhân bản cùng nội dung, không dùng ID từ tệp để ghi vào tài khoản khác; không tự bật ghi chú nhập.

## Bằng chứng và giới hạn

- `tests/answer_review_and_shuffle.test.ts`:4/4đạt, gọi helper thực về đủ khóa đối chiếu, so khớp không rỗng, bảo toàn dạng câu/ngữ liệu và xác định đúng câu AI sửa.
- `tests/generation_and_drafts.test.ts`:4/4đạt tại mốc chạy, kiểm số câu0, kế hoạch không hợp lệ, khảo sát không đáp án/điểm và nháp tách chủ sở hữu.
- `tests/portable_and_exports.test.ts`:5/5đạt, thực sự sinh DOCX và mở ZIP/XML để kiểm nội dung/thứ tự, đối chiếu nhãn thiếu đáp án, trạng thái import, ID ghi chú và validator. Đây không phải kiểm trực quan bản in.
- ESLint các helper/hook/editor mới12tệp đã đạt sau sửa; TypeScript toàn dự án đạt tại mốc trước thay đổi cộng tác. Cần chạy lại sau mỗi thay đổi model liên quan.
- Bản dựng webpack đã exit0 trước thêm API archive và các sửa tiếp theo. Turbopack trên môi trường Windows này lỗi tiến trình CSS; PostCSS chính thức và phông hệ thống đã được cấu hình. Tiếp tục kiểm bản dựng cuối, không coi mốc cũ là nghiệm thu cây mới.
- Chưa nghiệm thu toàn bộ màn hình nhỏ, trình chiếu, tệp dài, hình học/ảnh/công thức Word hoặc khôi phục nháp qua hai trình duyệt thật. Các mục này giữ ở checklist.

## Việc tiếp theo

Kiểm HTTP/DB thật, cộng tác/quyền thu hồi và lịch sử; kiểm trực quan editor–A4–Word trên mẫu ba cấp và đủ7dạng; hoàn thiện dữ liệu gói môn/lớp trong trạng thái chờ duyệt chuyên môn. Không chuyển trạng thái “có đầu mối nguồn” thành “đủ nội dung đã duyệt”.


## Bổ sung đợt bàn soạn và kiểm thử giao diện

- Giao diện đã thử tạo/lưu/mở lại một đề với tài khoản giả. Phát hiện và sửa403 do Next chuẩn hóa req.url thànhlocalhost trong khi Host/Origin thực là127.0.0.1; so vớiHost thực, không tin x-forwarded-host. Có hồi quyOrigin/Host/đường dẫn/scheme giả.
- Thêm soạn tên phần và ngữ liệu chung, gắn từng câu vào phần/ngữ liệu. Sửa ngữ liệu hạ nhãn kiểm định của các câu dùng ngữ liệu đó. Không cho bỏ phần/ngữ liệu còn được tham chiếu.
- Ngân hàng truyền cả ngữ liệu khi lưu/chèn; trường hợp mất nguồn được phép dùng phải báo thiếu. Không biến IDngữ liệu của người khác thành tham chiếu riêng.
- Soạn ảnh lưu kèm đề (PNG/JPG/GIF/WebP tối đa2MB), biểu thức và khoảng vẽ đồ thị, dữ liệu bảng biến thiên. Hình thiếu hoặc biểu thức không hợp lệ hiện chỗ cần bổ sung; bảng biến thiên không tự sinh ví dụ. Hình học có thể bổ sung ảnh; chưa có trình dựng hình học có cấu trúc.
- Xuất Word xử lý cả hình của câu và ngữ liệu, giữ tỉ lệ ảnh và phông đồ thị ở độ phân giải2x. Giữ tên phần do giáo viên đặt và nguồn trích. Bảng biến thiên trống chặn xuất thay vì tạo bảng giả.
- Chọn Giữ vị trí ở phương án sẽ giữ nguyên thứ tự phương án khi trộn. Ma trận đáp án hỗ trợ thêm điền khuyết/ghép nối/sắp xếp, kể cả mục sắp xếp trùng chữ.
- Trình chiếu tại chỗ cho giáo viên: chuyển câu, xem ngữ liệu, chủ động hiện/ẩn đáp án và lời giải. Không tạo lượt làm hoặc tự công bố. Đang kiểm trực quan chế độ sáng khi giao diện chung ở chế độ tối.
- Ba luồng nhập Word/ảnh/text dùng chung hợp đồng7dạng, không mặc định ý đúng/sai thànhĐúng, không yêu cầu AI tự giải dưới nhãn trích nguồn; giữ ngữ liệu vớiIDmới và cảnh báo đọc thiếu. Word quá45.000ký tự bị từ chối rõ, không tự cắt phần cuối. Word hiện đọc văn bản, cần đối chiếu ảnh/bảng/công thức gốc; chưa gọi AI thật để nghiệm thu OCR.

### Bằng chứng thực

- Ảnh bàn soạn: editor-saved.png (tài khoản và nội dung giả trong DB thử).
- Tải Word trực tiếp từ giao diện được browser-export.docx; browser_export.json xác nhận XMLcó tên phần/ngữ liệu/nguồn/câu hỏi và không kèm lời giải ở chế độ đề. Chưa mở trực quan trong MicrosoftWord để nghiệm thu bố cục.
- 11/11ca helper xuất/trộn bổ sung đạt, 2/2ca hợp đồng nhập đạt. Bộ mặc định tại mốc sau tích hợp đạt20ca cũ+87ca bổ sung; không cộng các lần chạy lặp thành số ca mới.
- HTTP12/12ở mốc trước thêm bank đạt; lần mở rộng sau đó bị quá thời gian khi máy phát triển biên dịch lại. Đang chạy lại trên bản dựng ổn định, chưa coi lượt quá thời gian làPASS.

### Kết quả chốt lại sau lượt chạy ổn định

- Build webpack25383: exit0,44trang sinh tĩnh, TypeScript đạt. Máy chủ thử dùng bản dựng ổn định, không trộn việc chỉnh giao diện với lúc chạyHTTP.
- npm test50480: exit0,20ca cũ+87ca bổ sung; log đầy đủ safe-tests.log.
- npm run test:integration:7/7 gồm6ca nghiệp vụ và1test cha, trênPostgreSQL thử; integration_s1.json mới ghiPASS.
- npm run test:http:13/13 gồm11ca nghiệp vụ và2test cha, khoảng2,7giây; http_workflows.json vàhttp_auth.json đềuPASS/cleanupComplete. Lượt bank đầu trong môi trường ổn định phát hiện assertion test chờ201 trong khi contractPOSThiệntrả200; chỉ sửa kỳ vọngtest sau đối chiếu route, không đổi nguồn để chiều test.
- Kiểm auth thực phát hiện truy vấn advisorylock trả kiểuPostgreSQLvoid màPrisma không đọc được. Đã sửa SELECTtrả số1 sau khi lấy khóa, rồi kiểm lại bắt buộc đổi mật khẩu/đổi mật khẩu thu hồi phiên/đăng xuất/admin reset/khóa–mở lại/rate limit đều đạt.
- Trình chiếu đã kiểm nút hiện/ẩn đáp án và lời giải, quay lại đề không làm bẩn bản đã lưu. Sửa chữ quá nhạt khi giao diện chung ở chế độ tối; ảnh presentation-verified.png xác nhận kết quả.

- Bổ sung chống đổi tài khoản ở tab khác: persist/load gửi expected user; API so với phiên thật, từ chối409ACCOUNT_CHANGED trước ghi; hook khóa chỉnh và giữ nháp. Clientunit15/15vàHTTP13/13đãkiểm.
- Thử mất kết nối máy chủ thật trên DB thử: nội dung nháp còn nguyên, chưa báoSaved; phiên trang mới đọc lại nháp và lưu thành công sau khi máy chủ trở lại. Ảnh draft-server-unavailable.png/draft-recovered.png. Lỗi mạng được đổi sang tiếng Việt trong mã, không để người dùng tự hiểuFailedtofetch.
