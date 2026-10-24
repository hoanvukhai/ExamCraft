# S6 — Cộng tác nhóm nhỏ và lịch sử đề

Cập nhật: 22/10/2026. Phạm vi: phần backend, quyền, lưu phiên bản và panel cộng tác. Không áp dụng migration lên DB chính, không gọi AI thật.

## Quyết định triển khai

Dùng bản nội dung đầy đủ + version CAS và kiểm tra thay đổi theo chu kỳ/focus ở client. Khi hai người cùng lưu từ phiên bản N, chỉ một bản được chấp nhận; người còn lại nhận 409 và giữ bản nháp để đối chiếu. Đây là cộng tác có kiểm soát cho nhóm nhỏ; chưa phải hai người gõ cùng một đoạn văn theo từng ký tự. Không thêm CRDT, WebSocket hay dịch vụ phụ trong đợt này. Root phụ trách polling và bảo toàn bản nháp client.

Đề riêng tư mặc định. Chia sẻ link xem công khai và mời tài khoản cộng tác là hai quyền riêng. Mời theo email tài khoản đã có, không tự gửi email ra ngoài. Người được mời thấy đề trong kho chung của tài khoản; bộ lọc thư mục/thùng rác/đánh dấu chỉ áp dụng đề do chính mình sở hữu.

## Quyền

| Vai trò | Xem nội dung và đáp án | Góp ý | Sửa nội dung | Mời/thu hồi, giao bài, phát hành, thùng rác, khôi phục lịch sử |
|---|---|---|---|---|
| Chủ đề | Có | Có | Có | Có |
| Chỉ xem | Có | Không | Không | Không |
| Xem và góp ý | Có | Có | Không | Không |
| Cùng sửa nội dung | Có | Có | Có | Không |

Quyền được đọc lại trên máy chủ mỗi yêu cầu. Editor chỉ được lưu document đầy đủ cùng baseVersion; không được thay folder/template/star/restore/variantCount hoặc các tham chiếu kho câu hỏi. Nội dung luôn thuộc chủ đề gốc; người lưu thực tế được ghi vào lịch sử. Thu hồi và các thao tác ghi khóa cùng một hàng Exam trong transaction để không có khoảng hở kiểm quyền rồi lưu sau một lần thu hồi đã hoàn tất. Nội dung đã tải về trước khi thu hồi không thể bị thu lại khỏi máy người dùng.

## Dữ liệu và lịch sử

- Model thêm: ExamCollaborator (vai trò và revokedAt), ExamRevision (snapshot toàn đề, actor, version, ghi chú), ExamComment (tác giả, nội dung, câu được góp ý nếu có).
- Migration cộng thêm: `prisma/migrations/20261022000100_exam_collaboration/migration.sql`. Không sửa/xóa dữ liệu cũ.
- Tạo đề ghi revision 1. Đề có sẵn chưa có lịch sử sẽ được ghi bản nền của phiên bản hiện tại trước lần cập nhật đầu tiên, không đoán tác giả cũ.
- Lưu nội dung, thay cấu hình quản lý, chuyển thùng rác và khôi phục tạo revision mới trong cùng transaction với CAS. Snapshot cũ không bị cập nhật; khôi phục sao chép nội dung cũ thành một phiên bản mới.
- API chỉ có đọc/tạo revision, không có sửa/xóa từng revision. Tính bất biến được thực thi tại lớp ứng dụng và unique(examId,version), chưa có trigger DB chặn quản trị viên trực tiếp sửa DB.
- Trường runtime `access`/`permissions` bị bỏ trước khi lưu document; không dùng quyền gửi từ client để cấp quyền.
- Danh sách hiển thị tối đa 100 revision/góp ý gần nhất để giao diện nhẹ; bản lịch sử cụ thể vẫn đọc theo số phiên bản, dữ liệu cũ không bị xóa. Chưa có phân trang danh sách UI.

## Hợp đồng API

GET `/api/exams` và GET/PATCH `/api/exams/:id` trả permissions gồm role, canRead/canEdit/canComment/canManage/canPublish. Raw record exam chỉ trả owner tại API chi tiết; người được mời nhận document hợp lệ và permissions. Không tiết lộ thư mục riêng/chỉ số bài giao của chủ đề qua danh sách cho cộng tác viên.

- `/collaborators`: GET quyền bản thân (owner thấy danh sách người được mời); POST `{email,role}` cấp/đổi quyền; DELETE `{userId}` thu hồi.
- `/history`: GET danh sách; GET `?version=N` snapshot; POST `{version,baseVersion}` owner khôi phục.
- `/comments`: GET góp ý; POST `{body,questionId?}`. Góp ý tối đa 5.000 ký tự, hiển thị dạng text có escape; questionId phải thực sự thuộc đề.
- Mọi thao tác thay đổi mới kiểm tra cùng nguồn; mọi đọc nội dung riêng dùng no-store. Xem lịch sử/góp ý cũng cần quyền đang còn hiệu lực.

Panel `ExamCollaboratorsPanel.tsx` có mời/đổi quyền, thu hồi, lịch sử và xem snapshot, xác nhận khôi phục, góp ý. Props: `examId`, `beforeRestore?:()=>boolean|Promise<boolean>` chặn khi đang có bản nháp chưa lưu/lưu đang chạy, `onRestored?:(document)=>void` nhận bản mới để controller tiếp nhận. Root nối panel độc lập cho cả người chỉ xem/góp ý, vì họ không có quyền phát hành.

## Kiểm chứng đợt backend

- `prisma validate`: đạt; `prisma generate`: đạt. Không thay DB.
- `tsc --noEmit`: đạt.
- `tests/persistence_permissions.test.ts`: 14/14 đạt với fake thực thi service thật, không import DB singleton.
- Các ca mới: phân biệt 4 vai trò; chủ đề mới được mời; email không tồn tại/tự mời bị từ chối; editor không đổi quyền; thu hồi chặn cả đọc và lưu; hạ quyền editor→viewer; hai editor cạnh tranh CAS một người thắng; snapshot gốc không đổi và actor đúng; khôi phục tạo bản thứ ba; tạo bản nền đề cũ; thùng rác ẩn khỏi cộng tác viên.
- Đã bàn giao tester kiểm chứng bằng DB test/HTTP. Fake không thay thế được chứng minh row-lock bằng PostgreSQL hoặc thao tác trình duyệt hai tài khoản. Kết quả tích hợp thực tế cập nhật trong báo cáo QA chung sau khi tester hoàn thành.

## Cần hoàn tất trong đợt tích hợp

- [x] Schema cộng thêm, backend quyền, CAS, lịch sử toàn đề.
- [x] Panel quản lý cộng tác, góp ý và khôi phục có hook bảo vệ bản nháp.
- [x] Typecheck và service/fake tests.
- [ ] Root nối panel, quyền UI, polling và bản nháp khi có thay đổi từ người khác.
- [ ] Tester áp dụng schema trên DB test, chạy hai tài khoản/HTTP và kiểm quyền thu hồi.
- [ ] Áp dụng migration lên DB thực tế chỉ sau sao lưu, kiểm phục hồi và quyết định triển khai của chủ dự án; chưa làm ở đây.
