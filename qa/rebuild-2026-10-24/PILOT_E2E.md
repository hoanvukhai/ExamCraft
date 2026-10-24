# Bộ kiểm pilot F1–F7 — generation13

## Phạm vi và cách chạy

- P0 đã chốt mã+test18f8fd4 và hồ sơ/QA dad9b6d; cây sạch trước bắt đầu P1. Claude tiếp tục commit hồ sơ độc lập. Không sửa ASSIGNMENTS/BATCH_REVIEWS/02/tiến độ thuộc người chỉ đạo.
- b44c0ec của Claude đã đọc diff và tích hợp thành0f7a29f. Hai unit assignment-options/parallel-view được thêm SAFE, HTTP assignment-options được thêm test:http. Không schema/migration.
- Lệnh: npm run test:pilot. scripts/pilot-run.cjs chọn Chrome/Edge có sẵn, không tải browser; kiểm health isolatedTest=true trên3117 trước chạy. Mỗi F kiểm requireTestDatabase + current_database() đúng examcraft_test_20261022 trước tạo tài khoản giả. Không nối DB chính.
- Mỗi F độc lập: tài khoản/quota AI0/context mới; không reset DB hoặc dùng fixture bảo toàn. Khởi tạo tài khoản và đọc/dọn bằng DB; seed đề cho F3–F7 qua API thật. F2 tự tạo/soạn qua UI. Browser chặn nguồn ngoài và route AI; kiểm aiUsageLog của fixture bằng0. Không lưu storageState/key/cookie/.env.
- Bộ fixture tối thiểu tự tạo dùng đủ7dạng, điểm0, ảnh PNG nhúng và ngữ liệu. F3 chạy mã môn Ngữ văn với nội dung kỹ thuật chung, không phải bộ đánh giá chuyên môn môn Văn. GEM-P7 còn ảnh placeholder thiếu URL và README sai route đã gửi Claude; chưa dùng gói đó thay fixture và chưa tự sửa tệp Gemini.

## Kết quả kiểm mới

- SAFE321/321 đạt, fail0/skip0 tại safe-pilot-features.log sau tích hợp A/B; chạy trước build. Đợt này không gọi provider hoặc key thật.
- Typecheck typecheck-pilot.log và typecheck-pilot-final.log exit0. Build build-pilot-features.log exit0,46trang, NEXT_BUILD_CPUS=1/heap1024, QA đã dừng trước build; không SAFE/lint cùng build. Build chứa0f7a29f và sửa ảnh ShuffleModal. QA production3117 session46100, DB thử.
- HTTP33/33 đạt tại http-pilot-features.log; http_auth/http_workflows/http_public_policies/http_assignment_options JSON PASS. Các ca mới xác nhận giờ/số lượt/mã vào bài/PIN và account pin. Sau bổ sung dọn đúng LoginBucket cho fixture HTTP options: http-pilot-final.log33/33 đạt; JSON options PASS/cleanupComplete. Không chạy lại build vì chỉ đổi cleanup test.
- Lint runner/test cuối đạt tại lint-pilot-runner-final.log; lint-pilot.log trước sửa báo CJS require/unused import của runner (đã sửa) và setState-in-effect sẵn có của ShuffleModal (chưa sửa). Không nhận lint toàn repo/component sạch.
- Lượt cuối pilot-complete.log:7/7 PASS, fail0/skip0; mỗi luồng cleanupComplete=true và kiểm bucket riêng đã sạch. Chrome 155.0.8059.85, buildId 7m4Am_PToSJs-yIodzyRZ, run 38e9e5f7-4a0f-45c5-bf0f-ef49a9f9b712; sourceSHA256 68215ea415d083394e67caba0f786017e0c7fae802d05db253652a3bdb5653ad. Structured evidence [pilot-results.json](pilot-results.json) và [bản theo run](pilot-run-38e9e5f7-4a0f-45c5-bf0f-ef49a9f9b712.json). Các lượt riêng F3/F4 không đại diện toàn bộ.

## Truy vết từng luồng

| F | Thao tác browser và đối chiếu | Giới hạn |
|---|---|---|
| F1 | Login thật, đổi mật khẩu bắt buộc, vào kho; DB mustChangePassword=false | Không mở rộng thành mọi ca quản trị |
| F2 | Tạo đề trống, tên riêng, nhập7dạng, ảnh, ngữ liệu, điểm0, lưu mẫu riêng, lưu đề, đóng/mở lại và đối chiếu tài liệu API | Không chứng nhận chuyên môn/nội dung đủ môn |
| F3 | Đề/đáp án/hướng dẫn/Song song, kiểm hai cột7câu; Word bàn soạn và4mã có7câu/media, gọi in | ZIP/XML/media; chưa mở Word/in nhiều trang; Word Song song dùng bố cục all, không hai cột |
| F4 | Link xem không lời giải; viewer không sửa, đổi editor lưu thật; thu hồi API từ chối, reload nút vô hiệu và không còn nội dung nguồn | Hai context Chrome cùng máy, chưa hai engine/offline |
| F5 | Giao có/không lớp; UI đặt giờ/số lượt/mã/trộn, DB đối chiếu; chờ đồng hồ thật qua giờ đóng rồi start403 và không tạo attempt | Chưa UI xem lại giờ đã giao, PIN thực học sinh chỉ HTTP; giới hạn đã gửi Claude |
| F6 | Làm đủ7dạng, server nhận draft, reload nhập lại tên để tiếp tục, nộp7answers, pending tự luận, không thấy lời giải trước policy | Một chính sách AFTER_CLOSE; không mọi tổ hợp/offline/2browser |
| F7 | Xem bài, chấm essay1/1 và nhận xét, receipt dọn đúng bản gửi, tổng6/6, CSV có học sinh và tổng đúng | Chưa rubric phức tạp/regrade/2người chấm; CSV scored hiện không xuất nhận xét chữ |

## Lỗi tìm thấy và sửa

- Gap D thật: mã đề có ảnh không tải được vì thiếu prepareExportFigures; pageerror được giữ tại pilot-shuffle-diagnostic.log. Đã sửa chuẩn bị ảnh/khóa tải trong lúc chạy/hiện lỗi trong modal, không đổi nguồn đề. Xem PILOT_GAPS.md.
- Lỗi bộ kiểm được sửa, không báo thành bug app: nhãn login, email fixture chữ hoa, text ẩn, dùng id thay publicLink, nhầm ô mã với họ tên, yêu cầu nút biến mất thay vì disabled, kỳ vọng nhận xét chữ trong CSV scored. Log các lượt đầu giữ nguyên: pilot-first/second/third, pilot-integrated-first và pilot-final. Các lượt đầu chưa dọn LoginBucket; cờ cleanupComplete lúc đó chỉ kiểm dọn entity đã biết, không là chứng nhận toàn bộ audit đã sạch. Runner hiện hành dọn và kiểm bucket đúng email riêng từng F. Không xóa audit mơ hồ/không đủ truy vết.

## Còn cần người chỉ đạo

- Review b44c0ec đã gửi: start chuẩn hóa input nhưng so với joinCode legacy raw có thể chặn mã cũ; Song song chưa render ngữ liệu chung; chưa UI xem lại thời gian đã giao. Chưa có SHA sửa mới trong tin bàn giao ở mốc ghi báo cáo. Không tự sửa trùng A/B hoặc coi đã duyệt.
- Gap I/CV073: wrapper PS5.1 hiện khóa nguồn examcraft và restore sang đích mới examcraft_restore_*. Đã xin Claude chốt diễn tập chỉ đọc main/ghi DB phục hồi mới hoặc giao chế độ nguồn thử có guard; chưa tự nới guard, chưa chạy backup/restore thật trong đợt này.
- Chưa mở Word kiểm trực quan, in nhiều trang, Edge riêng, offline thật, gói môn đã duyệt hoặc tổng nghiệm thu. Không đóng CV từ số test.

## Bàn giao

- Mã/runner/test và sửa ảnh đã commit f451306; phần ứng dụng được build ở trên không đổi sau khi kiểm. Nguồn runner hiện hành khớp sourceSha256 trong lượt cuối.
- Dòng hiện trạng CV024/042/043/054/056/060/061 đã cập nhật, không đổi dấu hoàn thành. ASSIGNMENTS/BATCH_REVIEWS/02/tiến độ thuộc Claude, không sửa.
- CODEX_STATUS=WAITING_REVIEW; P0/P1 và sửa gap D sẵn sàng duyệt. Gap I chưa thực hiện do cần quyết định nguồn/đích; các vấn đề review A/B chưa có commit sửa, không nhận đã duyệt trọn tính năng.
