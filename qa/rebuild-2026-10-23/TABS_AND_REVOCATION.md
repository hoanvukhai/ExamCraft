# Nháp nhiều tab và thu hồi quyền — đợt tiếp nối23/10

Phạm vi CV010/011/049/050; tiếp nối [RECOVERY](RECOVERY.md). Không thay checklist chính hoặc tuyên bố hoàn thành toàn bộ cộng tác/offline.

## Đã sửa

- Mỗi lần mở bàn soạn có định danh writer riêng. Khi ghi ô nháp dùng chung, nếu ô đang giữ nội dung chưa lưu khác của writer khác, hệ thống lưu nguyên bản vào mục phục hồi trước khi thay ô. Áp dụng cả khi ghi cache bản đã lưu server; tránh một tab vô tình xóa nháp của tab khác. Writer cũ chưa có định danh cũng được bảo vệ; dữ liệu không đọc được giữ nguyên byte ở mục phục hồi. Cùng writer sửa tiếp không tạo archive mỗi thay đổi. ID archive dùng UUID, không phụ thuộc mili giây.
- Archive không ghi được thì dừng thay ô dùng chung và báo lỗi bộ nhớ. Không tự dọn/xóa nháp để lấy chỗ. Đây là bảo vệ khi gặp nội dung khác đã có trong ô, **chưa là giao dịch nguyên tử giữa nhiều tab**; vẫn cần kiểm trường hợp đọc–ghi thực sự chồng nhau và phương án ô riêng từng tab nếu cần.
- Lưu trả401/403/404 hoặc ACCOUNT_CHANGED sẽ khóa sửa ngay, không chờ poll tiếp theo. Trước khi khóa, thử ghi nháp mới nhất theo đúng tài khoản/writer; nếu bộ nhớ lỗi thì nhắc tải bản nháp trước rời trang. Poll và mở bản máy chủ dùng cùng quy tắc giữ nháp/khóa. Lỗi mạng, validation và xung đột phiên bản thông thường không bị phân loại thành mất quyền.

## Đã kiểm mới

- SAFE:20ca cũ +108ca bổ sung đạt, [safe-tabs-tests.log](safe-tabs-tests.log). Thêm2ca bảo vệ writer/nháp cũ/byte lỗi/bộ nhớ đầy,1ca phân biệt lỗi quyền với lỗi có thể thử lại. Suite nháp12/12 chạy lại sau sửa thiếu trường lời giải trong fixture. Hai suite liên quan28/28 đạt trước sửa trường fixture; không suy đây là kiểm toàn bộ hook React.
- Build44trang và TypeScript đạt, buildId `sp9aSsUUrJN0DQ5YXIbrI`; [build-tabs.log](build-tabs.log). Lint định hướng5file thay đổi đạt; không phải lint sạch toàn repo.
- HTTP15/15 gồm13ca nghiệp vụ +2cha trên bản dựng này: [http-tabs-tests.log](http-tabs-tests.log). Ca mới dùng hai cookie đăng nhập độc lập, cùng bản nền: một người đảo thứ tự, người khác xóa/sửa câu–lời giải. Một lần lưu200, lần kia409; bản mở lại khớp toàn bộ người thắng. Sau thu hồi, PATCH/GET của người đó404; nội dung/phiên bản và số revision không đổi. Đây là hai phiên HTTP, chưa phải hai trình duyệt UI.
- Browser thật trên fixture giả: tài khoản2 mở đề được mời sửa; tạm dừng riêng server QA, sửa nội dung và lời giải; hạ quyền xuống VIEWER rồi nối lại. Poll khóa sửa, giữ nội dung riêng và báo quyền thay đổi. Thu hồi toàn bộ: giao diện khóa tiếp, nháp vẫn hiện trong danh sách riêng và có nút tải. [Ảnh](revoked-draft-kept.png), [đối chiếu DB](revocation-fixture.json). DB giữ nguyên version1, nội dung và lời giải gốc. Không suy ảnh chứng minh đã tải/đọc JSON hoặc phục hồi sau reload.
- Ca browser này đi qua poll trước lần lưu lại, **chưa chứng minh riêng nhánh PATCH403 khóa ngay bằng UI**; phân loại lỗi đã kiểm hàm và server từ chối ghi được kiểm HTTP. Bảo vệ writer đã kiểm bằng storage fixture, chưa chạy đủ ma trận browser nhiều tab cho thay đổi mới.

## Môi trường và dữ liệu

Chỉ dùng `examcraft_test_20261022`, server cô lập3117 và hai giáo viên giả đã có. Script [qa-browser-revocation.cjs](../../scripts/qa-browser-revocation.cjs) kiểm tên DB, đúng email giả/chủ đề trước thao tác; không đổi mật khẩu hoặc tài khoản thật. Fixture và grant đã thu hồi được giữ để kiểm tiếp, không tự xóa dữ liệu. Các fixture HTTP riêng được runner dọn sau test. Server QA đã dừng cuối đợt; không restart/reset Docker, không ghi DB chính, không gọi AI thật.

Integration7/7 ở đợt trước cùng ngày là bằng chứng kế thừa; đợt này không chạy lại suite đó vì không sửa dịch vụ DB. HTTP mới vẫn kiểm ghi/đọc thực trên PostgreSQL. Các JSON HTTP trong thư mục22/10 do runner ghi kết quả mới nhất; muốn đối chiếu đúng đợt dùng log có tên riêng ở trên.

## Tiếp theo

Giữ mở CV010/011/049/050: kiểm hai trình duyệt độc lập khi có bề mặt hỗ trợ (hiện chỉ IAB, MCP Apps không phải browser đăng nhập độc lập); reload/offline thật, writer đồng thời, bộ nhớ đầy trên UI, save403 và kết quả đến muộn sau đổi quyền. Tiếp CV014/015 về nhập lặp, khôi phục dữ liệu cũ và asset. Gói chương trình, AI thật và tổng nghiệm thu vẫn theo các CV còn mở.
