# Hoàn thiện chat AI V2 — bàn giao để thử và duyệt

Ngày 03/11/2026. Mã: **`5f6bf4d`**, nhánh `codex/chat-ai-v2`, worktree `F:/Workspace/Zazz/ExamCraft/tmp/chat-ai-v2`. Trạng thái **WAITING_REVIEW**; Codex không tự đóng CV hoặc ký thay nghiệm thu chuyên môn.

## Chủ dự án đọc nhanh

Bản mới đã sẵn sàng để bạn thử tại **http://localhost:3123**. Đây là **DB thử tách riêng**, dùng tài khoản thử được gửi trong thông báo cuối. Nên mở cửa sổ riêng tư. Giữ các bản cổng 3117/3122 để so sánh; chưa đẩy `main`, chưa triển khai Vercel. Không ghi/xóa dữ liệu chính, không migration hoặc đổi bí mật mã hóa.

Đã sửa các điểm chính:

- Mở đề mới không tự điền Toán/lớp 6/45 phút và không tự sinh đề rác. Có thể bắt đầu bằng chat, tự soạn, mẫu hoặc nhập tài liệu; đủ môn/lớp mới mở bàn soạn. Thời lượng chưa đặt vẫn để trống; bài kiểm tra có giờ cần chọn rõ, bài tập về nhà có thể không giới hạn.
- Chat giữ cuộc trò chuyện, câu hỏi đang chờ, lựa chọn có định danh, câu trả lời tự nhập và chữ đang gõ. Hai tab có writer riêng. Có cất/mở lại, tải/nhập bản dự phòng đúng tài khoản và đề; dữ liệu hỏng giữ nguyên để tải. Thông tin giáo viên chọn và AI suy luận có nguồn gốc/revision riêng.
- AI đưa một đề xuất để giáo viên nhận, không tự đổi đề đã lưu. Có sửa thông tin, sửa nhiều câu cùng lần, tạo cả đề và tạo lại đề cũ; giữ tiêu đề/đơn vị/trình bày cũ khi phù hợp, vẫn cho đổi tên rõ ràng. Mục tiêu thi vào lớp 10 tách khỏi lớp kiến thức.
- Chèn câu tại phần/nhóm hoặc sau câu đang chọn; câu khác môn/lớp bị báo lệch phạm vi. Câu khóa, quyền mất hoặc bản nền đổi được chặn; proposal còn để đối chiếu. Giữ điểm 0, ảnh, ngữ liệu và những sửa mới.
- Một hệ hoàn tác/làm lại chung. Đã sửa lỗi làm lại cả đề sau hoàn tác khi editor tạo phần rỗng; không ghi đè cấu trúc mới của người khác. Đã bỏ hai tệp undo Copilot cũ không còn mount, chuyển đủ các ca hồi quy sang hệ chung.
- Dùng chung core sinh đề và validator cho các dạng câu, ý con, hình/phương án, ngữ liệu và dàn ý. Có xem trước đáp án/điểm; sai cấu trúc hoặc phản hồi bị cắt không được nhận thành đề hoàn chỉnh. Luôn ghi nhãn luyện tập chưa đối chiếu văn bản.
- Phân biệt lỗi khóa/quota/quyền/model/mạng; giữ yêu cầu và nút xử lý. Không tự thử lại quota/mạng, có dừng và chặn kết quả trễ. Ảnh lớn giữ nguyên ở đề; request AI được giới hạn và thu gọn ngữ cảnh ảnh.

## Bằng chứng trên mã chốt

| Kiểm | Kết quả | Nguồn |
|---|---|---|
| CI đầy đủ: kiểu, lint, SAFE, build, máy chủ cô lập, HTTP, pilot | PASS | `ci.log` |
| SAFE TAP trong CI | 624/624 | `ci.log` (lệnh unit riêng cũng đạt) |
| HTTP trong CI | 118/118 | `ci.log`; các JSON HTTP tại thư mục cha |
| Pilot trình duyệt F1–F7, F9–F25 | 24/24 | `ci.log`, `../pilot-results.json` |
| Integration PostgreSQL bắt buộc | 8/8 | `integration.log`, `integration_s1.json`, `question-save.json` |
| Chat xuyên suốt qua API ứng dụng + provider giả | 10/10 | `browser.log`, `browser-results.json` |
| Hồi quy Đ0/Đ1/Đ2 | 15/15 | `chatRegression.log`, các thư mục `d0-regression`–`d2-regression` |
| Hồi quy bàn soạn, đa kích thước/theme và mất quyền | 13/13 | `editor.log`, `editor-regression/` |
| Chốt logic đích/phạm vi/metadata/dự phòng | 96/96 | `guards.log` |

Không cộng các bộ kiểm thành phần trăm hoàn thành; có ca trùng và có tiêu chí cần người. `CHECK_RESULTS.json` giữ số liệu máy đọc, hai build ID và chế độ chạy. `source-snapshot.json` ghi hash tệp mã đã commit. Ảnh browser thuộc build ghi trong JSON; CI cuối dựng lại commit chốt, gồm khoảng cách/vùng chạm hai nút hội thoại. Không chạy lại toàn bộ chỉ vì đóng hồ sơ.

Các fixture tự động dùng Chrome cài sẵn, SQL xác nhận DB thử và health `isolatedTest=true`. Provider là mô phỏng local; không đưa khóa thật vào test. Luồng chat có kiểm: không tạo đề trước nhận, hỏi/đáp rồi tải lại, nhận/lưu/undo/redo cả đề, sửa nhiều câu + tên nguyên tử, clone tab, cất/nhập hội thoại, tạo lại đề giữ thông tin, ảnh 5 MiB không mất, MAX_TOKENS không áp dụng, giao bài thiếu thời lượng bị chặn đúng chế độ, phone 320/375/390 và dark. Fixture tự động đã dọn theo ID riêng.

## Lỗi kiểm đã xử lý trong đợt

- F5 có deadline quá sát, hết giờ trước khi mở form: fixture giữ khoảng đủ cho bước UI rồi kiểm server từ chối trên form đã mở khi thời gian thật đi qua mốc ngắn.
- F19 còn đợi giao diện tạo đề cũ: nay kiểm thẻ bootstrap và số đề không tăng khi mở.
- F21 sửa câu chứa ảnh phải chọn câu để gửi đúng hình; nội dung giải thích trùng lịch sử/thẻ được định vị đúng vùng. Giữ nguyên kiểm dùng key đúng người và không đè sửa của chủ đề.
- TC-019 phải mở yêu cầu mới để kiểm chip gợi ý, vì gợi ý được thu gọn sau chat. Thẻ làm rõ kiểm qua ô trả lời, tránh tìm dòng chữ trùng trong lịch sử.
- Ca key/reload chờ phản hồi danh sách khóa; ca dark chờ chuyển màu đạt tương phản, không chụp giữa transition. Giá trị đo ở `composer-colors.json`.
- Lệnh chuẩn bị bản local được sửa thứ tự guard và enum `SUPER_ADMIN`; tài khoản giả rỗng do bước bị ngắt đã dọn đúng ID, sau đó chuyển cấp tài khoản sang transaction. Không thay đổi schema hoặc tài khoản dữ liệu chính.

Các log CI thử trước được giữ với tên `ci-initial.log`, `ci-before-final-recovery.log`, `ci-before-scoped-add.log`; không phải kết quả cuối.

## Bản dành cho bạn thử

- Máy chủ manual ở 3123 dùng DB **examcraft_test_20261022**, giữ SESSION_SECRET ổn định từ cấu hình hiện có để không làm mất khả năng giải mã khóa. Các biến khóa môi trường dùng để test được loại khỏi quá trình; bạn tự thêm key vào tài khoản thử nếu cần.
- `isolatedTest=false` là chủ ý: chặn bộ kiểm tự động chạy nhầm vào máy chủ cho người dùng có thể gọi AI thật. Codex chỉ kiểm health, không đăng nhập hay gửi AI trên máy chủ này. Toàn bộ số liệu tự động ở trên được tạo trước đó bằng máy chủ AI giả.
- Tài khoản thử để bạn nhập dữ liệu được giữ, không dọn cùng fixture tự động. Danh tính local ở `manual-preview-identities.json` (không Git); mật khẩu không lưu trong tệp/báo cáo. Lệnh mở lại: [HUONG_DAN_TEST.md](HUONG_DAN_TEST.md). Không dùng DB thử để soạn tài liệu làm việc chính thức.

## Còn cần người và giới hạn phải giữ

Đọc [DOI_CHIEU.md](DOI_CHIEU.md) để đối chiếu nhóm AC/TC, adapter và các giới hạn cụ thể. Chưa tuyên bố mọi dòng đặc tả đạt chỉ từ mock.

- Bạn thử cách diễn đạt thực tế, khóa/provider thật và điện thoại vật lý; giáo viên kiểm môn khác, câu/đáp án/barem. Codex chưa gọi AI thật hoặc thẩm định kiến thức.
- Chưa kiểm deadline/mạng thực tế trên Vercel, chưa deploy. Không có job nền bền hoặc cam kết chỉ tính phí một lần qua ngắt kết nối.
- Kho nguồn chính thức, chia lượt đề dài, cache khóa và các phần hoãn theo mục 0 đặc tả 1.1 chưa làm. Đề AI là luyện tập, không tự chứng nhận theo Sở/Bộ.
- API hiện tại có adapter/định danh bổ sung, chưa thay toàn bộ giao thức v2 cứng. Không có tải phần output thô bị bác; giữ đầu vào và từ chối áp bản cụt. Hợp đồng fact origin giữ nhãn thủ công/AI suy luận, không tự xác nhận suy luận là nguồn user/template/official.
- Hội thoại riêng trên máy, không đồng bộ nhiều máy; nhập backup cùng chủ và ID đề. Khi storage không đọc/ghi được vẫn giữ bytes/RAM và cảnh báo; không hứa phục hồi RAM sau đóng tab.

Bước tiếp: chủ dự án thử theo hướng dẫn; Claude duyệt phạm vi và bằng chứng, quyết định cập nhật checklist/02 và tích hợp. Không tự push/deploy hoặc đóng CV trong đợt này.
