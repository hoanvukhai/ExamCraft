# Chỉnh vùng thiết kế đề theo phản hồi chủ dự án — 28/10/2026

Trạng thái: **WAITING_REVIEW**. Mã + kiểm: `27af86a`.

## Phạm vi

Yêu cầu trực tiếp: bỏ bước 1–2–3; sửa thông tin trong cột trái, xem thử ngay bên phải; tách thao tác thêm câu; giữ dữ liệu và sửa mới của Claude ở `52099b3`. Đây là đợt tiếp sau P0–P8, không thay đặc tả cũ hoặc đóng CV thay Claude.

## Thay đổi

- Bỏ thẻ hướng dẫn đánh số và đường vào Mẫu/Ma trận lặp ở màn trống. Giữ các chức năng này trong Thiết lập, không xóa dữ liệu/chức năng.
- Thông tin đề có tóm tắt và nút chỉnh ở đầu cột trái, luôn còn sau khi thêm câu. Thiết lập mở tại chỗ; năm thẻ và các biểu mẫu cũ được giữ. Điện thoại dùng cùng vùng soạn, không thêm bảng phủ toàn màn.
- Tiêu đề vùng nội dung là dòng nhỏ; chỉ hiện số câu/tổng điểm khi có câu, không để một thẻ lớn “0 điểm đã gán”.
- Biểu mẫu thông tin gửi một phép chiếu chỉ phục vụ xem trước. Chưa Áp dụng thì không gọi ghi DB, không thay tài liệu xuất/in/giao bài. Có nhãn “Đang xem thử thông tin chưa áp dụng”. Hủy/thu gọn/đổi thẻ quay lại bản đã áp dụng; khi mở lại vẫn giữ nội dung biểu mẫu trong phiên.
- Giữ kiểm hợp lệ và đối chiếu từng trường trước khi áp dụng. Xem thử từ chối trường không hợp lệ, tài liệu khác, quyền xem hoặc trường đã bị sửa mới. Không ghi đè phạm vi/kế hoạch mới hơn.
- Tự soạn mở vùng “Soạn câu mới”, không chèn ngay một câu mặc định vào đề. “Thêm vào đề” xác nhận chèn; “Hủy thêm, giữ nháp” đóng và giữ nhật ký câu hiện có. Mở lại Tự soạn có thể phục hồi cả sau tải lại. Câu và tài liệu phải khớp tài khoản, nguồn, ID nền và quyền; không chèn trùng ID. Các thao tác ngân hàng/nhập/AI vẫn đi qua luồng cũ.
- Bản nháp câu đã chèn chỉ được nghỉ sau xác nhận lưu như cơ chế cũ. Chuyển phiên tài liệu/tài khoản xóa trạng thái hiển thị câu mới và bản xem thử, không xóa nháp trên máy.
- Thiết lập không còn mang lớp trang trí hộp thoại khi nhúng trong cột; điện thoại xếp ô nhập thành một cột và các thẻ thiết lập cuộn ngang.

## Bảo toàn và giới hạn

- Không migration/schema/API mới, không sửa CAS hay nhật ký khôi phục. Không ghi DB chính, không dùng provider thật, không thay key/cookie/.env/backup.
- Chỉ DB thử `examcraft_test_20261022`; bộ kiểm xác nhận `isolatedTest` và tên DB bằng SQL trước fixture, dọn riêng tài khoản/đề do lượt kiểm tạo.
- Nháp thông tin chưa Áp dụng chỉ giữ trong phiên biểu mẫu đang mở; không hứa phục hồi sau tải lại/trình duyệt đóng. Nháp câu dùng nhật ký sẵn có; không thêm bảng hay hệ thống nháp mới.
- Đổi môn/lớp/phạm vi lúc câu mới đang soạn có thể làm nguồn cũ hết hiệu lực: không tự ghép vào cấu hình mới; nháp vẫn giữ để đối chiếu/tải xuống.
- Điện thoại kiểm bằng Chrome mô phỏng, chưa thay thế kiểm cảm ứng/bàn phím ảo trên máy thật. Không chạy provider thật hoặc Word desktop/in giấy.

## Kết quả kiểm

Bản production cuối: `ucY69eYtmeyzDyE2Gi0DM`. Bằng chứng tổng hợp: [FINAL_VERIFICATION.json](FINAL_VERIFICATION.json).

| Kiểm | Kết quả / bằng chứng |
|---|---|
| Build production và TypeScript | Đạt — [build.log](build.log) |
| Lint tệp thay đổi | Không lỗi/cảnh báo — [lint.log](lint.log) |
| SAFE | 504/504 — [safe.log](safe.log); bao gồm hai kiểm mới về phép chiếu và chèn câu có guard |
| Kiểm riêng header/nháp/phép chiếu | 22/22 — [unit.log](unit.log); đã tính trong SAFE, không cộng lại |
| Trình duyệt editor | 7/7 gồm test cha — [browser.log](browser.log), [cleanup.json](cleanup.json) |
| F2 | Đạt — [F2.json](F2.json), [F2.log](F2.log): bảy dạng câu, ảnh, nguồn ngữ liệu, mẫu, dirty form qua creation ACK, ngân hàng bị khóa trong lúc sửa |
| F9 | Đạt — [F9.json](F9.json), [F9.log](F9.log): mất mạng, nối lại, giữ nháp theo tài khoản, lưu bản sao và sửa tiếp bản sao mà không đổi đề gốc |

Trình duyệt xác nhận bản đang gõ chưa ghi DB, bản xem trước cập nhật ngay; đổi thẻ/đóng mở không mất biểu mẫu. Câu mới chưa có trong DB trước xác nhận; Hủy + tải lại + Tự soạn phục hồi đúng nháp; xác nhận chỉ chèn một câu. Mất quyền vẫn giữ đường tải nháp câu và đóng menu sửa. Xuất Word đề/đáp án/lời giải/ma trận vẫn khác nội dung đúng loại.

Kiểm responsive 1440/1024/375/320px và 568px ngang, sáng/tối; bổ sung kiểm chiều rộng bên trong vùng thêm câu ở 320/375px. Ảnh: [thông tin 375px](settings-375-light.png), [xem trực tiếp 375px](live-preview-375.png), [thêm câu 375px](new-question-375.png), cùng ảnh settings/rich/empty trong thư mục.

Lượt đầu lộ lỗi kiểu của fixture mới và một lượt build thiếu quyền ghi thư mục đầu ra; đã sửa fixture và dựng lại thành công. Sau khi xem ảnh, bổ sung sửa ô phương án và thẻ thiết lập trên điện thoại rồi kiểm lại trên đúng build cuối. `chay-tho/` là lượt trước chỉnh chiều rộng, không dùng để thay kết quả cuối. Không có kiểm bị bỏ qua trong suite editor hoặc F2/F9 đã chọn. Các luồng pilot khác không thuộc lượt chạy này.

## Truy vết mã

`ExamWorkspace`, `editor/EditorStart`, `editor/EditorQuestionList`, `editor/EditorSettings`, `HeaderSettingsModal.HeaderForm`, `QuestionEditor`, `lib/editor-draft-preview`.

Kiểm mới trong `tests/editor_draft_preview.test.ts` và mở rộng `tests_pilot/editor.test.ts`; F2 được đổi thao tác sang xác nhận thêm câu, vẫn giữ kiểm ngân hàng bị khóa trong lúc sửa, bảy dạng câu, ảnh và creation ACK.
