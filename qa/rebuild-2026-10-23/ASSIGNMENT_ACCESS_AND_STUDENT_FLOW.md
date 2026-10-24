# Giao bài, quyền tài khoản và luồng học sinh — 24/10/2026

Nhóm CV011/054–062; tiến trình đang kiểm, chưa là nghiệm thu toàn bộ. Dữ liệu ghi chỉ `examcraft_test_20261022`, QA production3117; không gọi AI thật, không nhập các khóa đã gửi trong chat.

## Đã sửa

- ShareModal pin tài khoản cho tải lớp, lưu đề, tạo bài giao, tạo/thu hồi link. Kiểm còn mở sau khi chờ lưu; Workspace key theo account/doc. Không tự công bố sau khi modal đã đóng/đổi tài liệu.
- API assignments, share, teacher assignments/attempts/export dùng `requireRequestAuth`, trả409 khi account pin khác phiên; assignmentsPOST thêm same-origin. Giữ kiểm owner ở DB.
- Trang danh sách bài giao và bảng điểm chụp account một lần qua `usePinnedAccount`; không tự nhận account mới khi refresh. Export CSV lấy bằng request có pin trước tải.
- StudentResultsModal bỏ bảng luôn rỗng/0 giả, dẫn tới bài đã giao/bảng điểm thật và giao bài.
- UI thật phát hiện chọn không lớp nhưng payload vẫn PICK_FROM_LIST: sửa thành FREE_NAME khi groupId rỗng, kể cả tài khoản chưa có lớp; thêm nhãn truy cập cho select. Đã tạo phòng thật thành công qua UI sau sửa.
- UI thật phát hiện tổng đã nộp loại bài pending khỏi số đếm, tự luận pending ghi Sai và bảng xếp hạng có hạng trống: tách totalSubmitted/pending/graded, chỉ lấy điểm đã chốt cho phổ điểm; hiển thị Chờ chấm/Đạt một phần, tạm tính ở dòng điểm, chưa xếp hạng khi rank null. ShareModal mặc định tắt leaderboard theo hồ sơ, API trước đó đã mặc định OFF. Đang build/kiểm lại nhóm hiển thị này.

## Bằng chứng đã chạy

- `build-assignment-access.log`: build46/typecheck exit0 trước sửa FREE_NAME. `http-assignment-access.log`: HTTP17/17 exit0, stale-account trên các endpoint mới; POST tạo assignment/share valid-body bị chặn và số row không đổi; cross-origin assignmentPOST403.
- `assignment-access-lint.log`:12errors/6warnings kế thừa tại API `any` và2effect ShareModal; hook, StudentResultsModal và các trang giáo viên trong lệnh này không có lỗi. Không nhận toàn repo lint sạch.
- `build-assignment-final.log` build46/typecheck exit0, `http-assignment-final.log`17/17 exit0: gồm valid-body chấm với account pin sai, nguyên attempt/answers/comment không đổi. `safe-assignment-final.log`20+203=223đạt exit0. Sau đó thêm ca thống kê bài pending→chốt điểm vào HTTP, chờ chạy lại cùng bản build pending.
- Fixture `learning-fixture.json`: đề mới7dạng/10điểm, qa_browser_2; script `scripts/qa-learning-fixture.cjs --create-fixture` khóa đíchDB, nguồn commands hash trước/sau giữ nguyên. Không chạy tạo lần hai.
- UI tab32 tạo phòng `446b557862363956ea976cc0becca19f`, assignment `cmvltft9b009btbbskwkmw4e7`; tab33 làm đủ7dạng, autosave; tab34 trang mới nhập cùng tên → resume đúng7/7, 0/false/ghép/thứ tự/tự luận còn nguyên, deadline tiếp tục thay vì reset. Đóng tab33 trước nộp tab34. Reload tab33 trước đó bị cảnh báo rời trang, **không tính là đã reload**; bằng chứng phục hồi là trang mới34.
- Tab34 nộp → điểm tạm7/10, lời giải AFTER_CLOSE chưa hiện. Tab35 giáo viên xem bài, chấm tự luận2.5 qua blur → tổng9.5/10 và thống kê đã chốt. `student-before-reload.txt`, `student-resumed-seven-types.txt`, `student-submit-pending-seven-types.txt`, `teacher-pending-before-fix.txt`, `teacher-graded-nine-half.txt`. Tất cả fake students/TEST DB; không là bằng chứng7môn hoặc nội dung chuyên môn chuẩn.

## Cần kiểm tiếp

`build-assignment-pending.log` build46/typecheck exit0, `http-assignment-pending.log`17/17 exit0 mới gồm pending→graded stats và stale-account valid-grade không đổiDB. SAFE223 mới đạt trước sửa pending; integration7 kế thừa. `scripts/verify-learning-flow.cjs` đã PASS read-only: lượt1 bảy câu/9.5đ/chốt, lượt2 phụ chỉ tự luận/0đ/pending, stats2submitted/1pending/1graded/avg9.5, CSV chứa cả điểm chốt/chờ chấm, nguồn hash không đổi. `learning-flow-verification.json`, `learning-flow-csv.csv` là đầu ra giả an toàn.

UI cuối tab35: 2lượt đã nộp/1chờ, điểm dòng thứ2 tạm tính0 và trung bình chốt9.5; mở lượt2 tự luận ghi Chờ chấm (`teacher-pending-final.txt/png`). Tab32 modal mới mặc định Tắt bảng xếp hạng (`assignment-leaderboard-default-off.txt`), cửa sổ kết quả dẫn đúng bài đã giao (`results-modal-real-route.txt`). Đóng bài qua tab35 rồi reload tab34: lời giải AFTER_CLOSE hiện, không còn nút làm lượt tiếp, trước đóng không hiện. `student-solutions-after-close.txt` lưu cây UI. Chưa kiểm trực tiếp rank-null sau build cuối (lượt2 của cùng học sinh có hạng1 do lượt1 đã chốt); nhánh null đã sửa nhưng không suy đã nghiệm thu UI từ build.

QA test-server chủ ý tạo ATTEMPT_SESSION_SECRET mới mỗi restart nên cookie lượt1 không còn được công nhận sau đổi bản chạy; đây là giới hạn fixture, không thử xoay secret trên hệ thống thật. Resume bảy dạng đã kiểm trước restart cùng phiên máy chủ. Lượt2 hiện vẫn có cookie hợp lệ ở tab34/server50881. Không nhận reload lượt1 sau restart là pass.

Tiếp CV057: API nháp chưa có CAS/phiên bản, request muộn hoặc hai tab cùng cookie có thể đè nháp mới; UI mỗi15giây gửi cả bản. Cần chặn ghi cũ và giữ câu đang nhập khi báo xung đột trước đóng CV. Chi tiết bài làm giáo viên còn render rawJSON/null, chưa có kiểm mất mạng/chấm đồng thời; để mở CV060/061.

Không đóng toàn bộ CV từ số test. Còn nhận diện có mã/PIN, nhiều profile độc lập, tranh chấp start/deadline, dữ liệu chuyên môn thực và các chế độ đánh giá khác cần đối chiếu tiêu chí.
