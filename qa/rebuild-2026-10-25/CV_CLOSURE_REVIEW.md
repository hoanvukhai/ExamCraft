# Quyết định đóng CV sau đối chiếu tiêu chí — 25/10/2026 (Claude)

Căn cứ: bảng của Gemini [GEMINI_CV_CRITERIA_AUDIT](../ai-review/GEMINI_CV_CRITERIA_AUDIT.md) cho 11 CV, **sau khi tự kiểm lại từng CV Gemini kết luận "ĐỦ" bằng tên ca test thật**. Chạy cuối: build đạt, SAFE 340/340, HTTP 38/38, trình duyệt 8/8 ([http](http-claude-run5.log), [safe](safe-claude-run2.log), [pilot](pilot-claude-run6.log)).

## Điều phải nói thẳng về bảng của Gemini
Gemini không chạy được mã. **Toàn bộ 24 tên ca test mà bảng trích cho CV050/055/057/059/062 đều không tồn tại trong thư mục tests** (kiểm bằng tìm chuỗi); đó là câu mô tả tự đặt, không phải tên ca thật. Kết luận từng CV vì thế phải tự kiểm lại, và đã làm. Bảng vẫn hữu ích để chỉ ra *các vế* của tiêu chí. Lỗi này nên ghi vào quy ước: kết luận "ĐỦ" chỉ nhận khi trích đúng tên ca và đã tìm thấy.

## Kết quả
| CV | Gemini | Sau tự kiểm | Ghi chú |
|---|---|---|---|
| 050 | ĐỦ | **ĐÓNG** | F9 (Chrome, Edge); http_workflows: "structural edits conflict without partial merges and revoked writers cannot retry", "collaboration honors view, edit, CAS, history and revocation"; F4 |
| 055 | ĐỦ | **ĐÓNG sau bổ sung** | Gemini dẫn ca PIN không tồn tại: trước đây **không có test nào kiểm PIN, link cá nhân hay học sinh lớp khác lúc bắt đầu làm bài**. Đã viết `http_student_identity` (PIN thiếu/sai/học sinh chưa có PIN/lớp khác bị từ chối, không tạo lượt; link cá nhân sai/của lớp khác/ID thay token bị từ chối) và chạy đạt |
| 057 | ĐỦ | **ĐÓNG** | student_network (4 ca), attempt_draft_revision, student_draft_journal, http_workflows (hai bản nháp tranh nhau, bản cũ bị 409), F6 tải lại làm tiếp |
| 059 | ĐỦ | **ĐÓNG sau sửa lỗi thật** | Ca "nộp đồng thời một kết quả" chưa có và **hóa ra có lỗi**: hai lần nộp cùng lúc, bên thua nhận 503 vì xung đột PostgreSQL 40001 qua truy vấn thô được báo là P2010, quy tắc thử lại chỉ biết P2034/P2002. Đã sửa (`isRetryableTransactionError`) và có test: một kết quả, không nhân đôi câu trả lời, một bên nhận phản hồi lặp. Cũng sửa cho bước bắt đầu làm bài |
| 062 | ĐỦ | **ĐÓNG sau bổ sung** | Vế "link cũ" chưa có test trực tiếp; đã thêm: link thu hồi và link hết hạn trả 404, thu hồi không đăng nhập bị từ chối và link vẫn sống, nội dung không lộ. Các vế còn lại: cookie bắt buộc, giáo viên khác 404, đã đóng/đã nộp, AFTER_CLOSE/NEVER (http_public_policies), CSV không cho học sinh |
| 010 | THIẾU | giữ mở | mở ứng dụng từ đầu khi hoàn toàn offline; hai engine sửa đồng thời |
| 011 | THIẾU | giữ mở | kiểm giao diện đổi tài khoản trên cùng tab (dọn nháp); template và mọi nơi gọi |
| 047 | THIẾU | giữ mở | quyền `comment` và `publish` riêng chưa có |
| 048 | THIẾU | giữ mở | bản công bố độc lập (publication snapshot) chưa làm; hiện bảo vệ bằng phiên bản nguồn |
| 049 | THIẾU | giữ mở | hoàn tác từng người: đề xuất tách vế này sang sau pilot, nghiệm thu phần còn lại, cần chủ dự án quyết |
| 060 | THIẾU | giữ mở | chấm lại theo phiên bản (regrade) chưa làm |

Việc nhỏ nhất để đóng thêm: CV011 (một ca trình duyệt đổi tài khoản + rà các nơi gọi), CV010 (hai ca trình duyệt), còn lại cần quyết định sản phẩm.

## Giới hạn
- Các CV đóng ở đây theo phạm vi sản phẩm đang có (local, một máy, DB thử); chưa tổng nghiệm thu. Không đóng CV về nội dung, AI thật, độ phủ môn lớp.

## Bổ sung: đóng CV011 và CV010 (cùng ngày)
- Thêm hai luồng trình duyệt: **F10** (đổi tài khoản trong cùng trình duyệt: nháp chưa lưu của A không hiện cho B, không lưu lên máy chủ khi B đăng nhập, không tạo dữ liệu dưới B; A đăng nhập lại thì nháp phục hồi) và **F11** (tải lại thất bại khi không có mạng không làm mất nháp; nối lại lưu đúng một đề). Chạy toàn bộ trình duyệt: 10/10 ([log](pilot-claude-run7.log)).
- **CV011 đóng.** **CV010 đóng** theo "Đạt khi" của checklist.
- Giới hạn nói thẳng: ứng dụng **chưa có bản mở offline** (không service worker). Mở trang mới hoàn toàn không mạng sẽ không hiển thị; nháp trên máy được giữ và lưu khi có mạng. Nếu cần "mở lại hoàn toàn offline" thì là tính năng mới (service worker), chưa làm. Hai engine sửa đồng thời cũng chưa kiểm.
