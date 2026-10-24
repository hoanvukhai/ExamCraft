# Nháp học sinh và nộp bản cũ — 24/10/2026

CV057/059/062, đang triển khai/kiểm; chưa đóng CV. Tiếp sau [giao/chấm bảy dạng](ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md). Không migration, không ghi DB chính, không gọi provider.

## Thay đổi đang kiểm

- `attempt-draft-revision.ts`: SHA256 của nội dung JSON chuẩn theo tên thuộc tính, phân biệt0/false/rỗng/bỏ trường/thứ tự mảng; null cũ tương đương draft{}. Là CAS theo nội dung, không phải số phiên bản tăng dần hay cơ chế gộp bài.
- Start/resume trả draftRevision. PATCHdraft bắt buộc baseDraftRevision; khóa row trong transaction rồi kiểm lại capability/trạng thái/deadline, so bản nền trước update. Retry mất receipt chỉ nhận khi nội dung thực đã trùng; không phát nội dung server trong lỗi409.
- Submit khóa cùng row; nếu còn nhận câu trả lời mới thì bắt buộc bản nền khớp, chặn stale trước tạo AttemptAnswer/chấm. Submit lặp sau đã nộp vẫn idempotent; sau deadline/grace giữ chính sách chỉ chốt draft đã lưu đúng giờ.
- Trang học sinh tuần tự autosave trong một tab, chờ request đang lưu trước submit; không nhận receipt cũ vào lượt khác. Khi conflict dừng autosave, giữ câu đang nhập, chặn submit thủ công và có banner/tảiJSON trên cả mobile. Tệp chỉ câu trả lời của lượt hiện tại, chưa có import lại; không tuyên bố bản chưa gửi là đã lưu. Mất điện/đóng trang trước tải bản sao vẫn chưa có journal bền cho học sinh.

## Bằng chứng tại mốc ghi

- `tests/attempt_draft_revision.test.ts`:3/3đạt mới; thêm vào SAFE nhưng chưa chạy toàn SAFE sau thay đổi này.
- `build-student-draft-cas.log`:46trang/typecheck exit0. `http-student-draft-cas.log`:17/17 mới exit0, gồm race2draft cùngbase chỉ1thắng, stale409/giữDB, resume đúngwinner, retry sau mấtreceipt, stale submit không tạo answer/đổi status. `safe-student-draft-cas.log`:20+206=226đạt exit0; `student-draft-new-lint.log` helper/test/draft/submit0lỗi exit0. Không nhận cả trang học sinh lint sạch.
- UI thật: tab36A/37B cùng assignment `cmvlubngc009dtb68261aetbb`, public `6a42d7ac936460660c5be82512e3e3d5`. A lưu nền, B resume cùng nền, A lưu `QA bản mới đã lưu từ trang A`; B bị conflict và giữ `QA B cần giữ để đối chiếu, không đè bản A` +short0. B confirm nộp bị chặn, modal đóng nhưng dữ liệu riêng còn. DBread-only `scripts/verify-student-draft-cas.cjs before-submit` PASS: serverdraftA/short0,0answerrows/IN_PROGRESS, sourcehash giữ nguyên.
- Tải JSON thật từ B: sự kiện download đã nhận; công cụ UI chờ643giây dù timeout5s. Sau đó tệp F:/Downloads xuất hiện và đã đọc/copy `student-cas-b-downloaded.json`: đúngformat/short0/essayB. Tránh gọi lại waitForEvent(download)/path nếu không cần vì backend rất chậm, không phải bằng chứng code mất bản sao. A nộp thành1/10pending, không có leaderboard (mặc địnhOFF); verify after-submit PASS responseA/score1/pending/sourcehashkhôngđổi.
- Bằng chứng `student-cas-b-retained.txt`, `student-cas-b-submit-blocked.txt/png`, `student-cas-before-submit.json`, `student-cas-after-submit.json`, `student-cas-a-submitted.txt`. Hai tab cùng IAB/cookie, chưa là hai browser độc lập, chưa trực tiếp giả lập response API chậm/offline/mobile trong nhóm mới.

Đợt trước `assignment-new-ui-lint.log` kết thúc6errors/13warnings (4any/2effect ở trang giáo viên, warnings dependency account); log không rỗng như lúc quá trình còn chạy. Hook/StudentResults không có lỗi trong log, không nhận các trang giáo viên sạch. Cần ghi đúng hồ sơ và xử lý dependency trong lần sửa nhóm liên quan, không suy sạch từ output chưa xong.

Giới hạn còn mở: CAS theo nội dung chấp nhận nền có cùng nội dung trở lại (không phải counter đơn điệu); không merge hai trang, không tự đổi baseline khi conflict. Câu trả lời chưa gửi chỉ giữ RAM và bản tải chủ động, chưa phục hồi sau đóng tab/mất điện. Trang cũ thiếu revision bị400 và phải giữ bản trước mở lại; chưa có import JSON bản học sinh. Tạm giữ CV057/059/062 mở.
