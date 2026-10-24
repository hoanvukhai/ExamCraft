# Thử lưu khóa AI không tạo trùng — 24/10/2026

## Phạm vi Codex / CV011, CV031, CV032

Claude10 đang làm C01 modal key; Codex giữ API user/keys và HTTP trong checkout chính, đã gửi hợp đồng qua tin riêng để không chồng tệp. Gemini5 đã xác nhận G01 đang làm; chưa có bàn giao mới tại mốc đầu đợt, không tự duyệt từ status WORKING.

POST user/keys thêm optional clientRequestId UUID. ID lưu ổn định theo owner+request ID (không chứa/hashing raw key); request trùng trả cùng masked key và replayed:true, không ghi đè hoặc bật lại khóa đã tắt. Đổi raw key/label cùng mã trả409 KEY_REQUEST_CONFLICT. Trước đó mỗi lần POST đều tạo mới nên mất phản hồi rồi thử lại có thể sinh trùng. Caller không gửi ID vẫn tạo như cũ.

So khớp plaintext chỉ trong RAM server bằng timingSafeEqual sau giải mã bản của chính chủ, không đưa raw/ciphertext/IV/tag vào response. Response lấy allowlist selection giống create; danh sách cũng chỉ masked. Account/origin guard trước body, không thay encryption secret/schema/cấu hình người dùng. Không gọi nhà cung cấp để lưu key.

## Kiểm mới

Typecheck-key-retry.log và lint-key-retry.log exit0. Build-key-retry.log exit0,46trang/TypeScript đạt (2CPU, QA đã dừng trước build). HTTP-key-retry.log28/28 đạt, fail0/skip0, ba JSON HTTP đều PASS/cleanupComplete; đích examcraft_test_20261022, server cô lập3117. Lần gọi build đầu tool báo host closed stdout và không tạo log; lần sau thực sự chạy/đạt, không coi lỗi công cụ là kết quả build. Bộ HTTP mới dùng chuỗi khóa giả synthetic-not-a-provider-key với UUID fixture, không dùng khóa người dùng cung cấp.

Các ca: stale pin+JSON hỏng/anonymous/origin/UUID invalid không ghi; concurrent POST và retry trimmed trả cùng ID; tắt rồi retry không bật lại; đổi label/raw cùng ID409 giữ nguyên hàng mã hóa; owner khác cùng requestID có ID riêng và không sửa khóa của người khác; legacy không ID vẫn tạo mới; GET/create/replay không trả raw/encryption fields; AI usage không tăng; xóa fixture riêng sau kiểm.

## Giới hạn

Chưa có bằng chứng UI C01 hoặc provider thật; chưa tích hợp Claude C01 tại mốc viết. ID retry chỉ ổn định nếu client giữ mã request, không phải dedup mọi key giống nhau; legacy/different-ID vẫn tạo nhiều mục. Không có receipt tombstone sau xóa key: xóa rồi gửi lại POST cùng mã có thể tạo lại, không hứa chống tái tạo sau xóa. Client phải giữ form đúng context và yêu cầu mới có chủ đích; không lưu raw key xuống localStorage.

Không chạy SAFE mới chỉ vì thêm route, kế thừa kết quả đợt trước; HTTP/build là kiểm chính cho thay đổi. Chưa tổng nghiệm thu/CV vẫn mở. Không DB chính/provider thật, không reset/push/xóa WIP. Duyệt từng báo cáo worker bằng BATCH_REVIEWS khi thực sự nhận được.

## Review bàn giao trong đợt

- C01 Claude nộp621e8ff/6503df0 (helper/test/modal), đang tiếp C02. Đọc diff/helper/UI: cổng token/owner và giữ nháp đã cải thiện nhưng add200 JSONnull/thiếu key vẫn clear form, chưa dùng request ID hợp đồng mới, logGate/mainGate độc lập khiến auth failure một lane chưa vô hiệu receipt lane kia, close chưa dispose đồng bộ. Ghi CHANGES_REQUESTED trong BATCH_REVIEWS và tin chi tiết; chưa cherry-pick, Claude giữ vùng code để sửa commit mới. Worker unit/typecheck/lint là bằng chứng thuần từ worktree, chưa phải UI/root build.
- G01 Gemini gửi tin131035Z nói đã sửa nhưng hai tệp root tại mốc review vẫn header Generation3, file:/// và các câu tuyệt đối, số suite gán một tệp, bảng !mayReview gộpcookie409, AFTER_CLOSE suy ra lời giải/BXH. Ghi hash tệp đã đọc trong submission_ref, CHANGES_REQUESTED và yêu cầu sửa trực tiếp rồi đọc lại/hash. Không sửa hộ báo cáo của Gemini, không chấp nhận chỉ dựa tin bàn giao.
- Chưa có mục batch nào ACCEPTED/đóng CV ở mốc này. Tiếp đọc item đúng generation và review lại khi có SHA/báo cáo sửa mới; không chờ bằng polling dày hoặc coi im lặng là chấp nhận.

## Tích hợp C01, kiểm nguồn và review tiếp

- C01 nộp sửa5857238 sau review; root đọc diff và chạy focused unit11/11 tại unit-key-c01-reviewed.log đạt. Tích hợp621e8ff/6503df0/5857238 thànha04e0fe/0db7ef8/887ccc4, hash WIP root không đổi qua snapshot tmp/coordination/before-c01-integration.json. C01 RELEASED_FOR_INTEGRATION, Codex11 giữ3tệp; Claude không sửa lại. UI chưa kiểm, không coi runtime test API là UI.
- SAFE mới279/279 fail0/skip0 (safe-key-c01-reviewed.log,2worker, chạy sau build trước đó và trước build cuối). Build cuối build-key-c01-source-final.log exit0,46trang/TypeScript đạt2CPU. HTTP cuối http-key-c01-source-final.log28/28 fail0/skip0;3JSON đềuPASS/cleanupComplete, chỉ examcraft_test_20261022. QA production3117 session21896 đang chạy build cuối. Typecheck/lint4route đạt tại typecheck-key-source-guards.log/lint-key-source-guards.log; không tuyên bố toàn repo lint sạch.
- Đã sửa3đường share(create/publicGET/copy) chặn Question.passage.ownerId khác chủ đề. Copy thêm FOR SHARE các hàng Question theo thứ tự ID trong transaction trước đọc lại nguồn, giữ Exam→ShareLink→Question. HTTP mô phỏng FK legacy sai chủ trên DB thử rồi phục hồi: tạo link403, đọc/copy404, không lộ chuỗi riêng. Giữ lock câu hỏi, chứng minh copy đang chờ bằng pg_blocking_pids, đổi shareablefalse rồi commit: copy404/không thêm bản; sau đó phục hồi fixture. Chưa bảo đảm mọi race Passage độc lập hoặc hệ thống tệp/publication snapshot.
- C02 sửa3481b93: lọc namespace cho rawmalformed, retirement so sent.baseRevision/rawtext và ACK, serialize rubric lỗi giữ storage. C03 sửae29feeb: lọc namespace ngay trong panel. Root đọc sửa và unit trực tiếp worktree23/23 đạt tại unit-c02-c03-review.log. Hai mục ACCEPTED_WITH_LIMITS chỉ phần helper/component; chưa cherry-pick/mount vào app root, chưa browser/storage thật. Không ghi đây là chức năng nháp đã dùng trên sản phẩm.
- C04 thiết kế snapshot CHANGES_REQUESTED: rollback không được rơi từ pinned về live draft; thứ tự migration/deploy phải tương thích Prisma; tách nội dung immutable và quyền nguồn hiện tại. Không migration/schema mới trong đợt này.
- G02 ACCEPTED_WITH_LIMITS sau root đối chứng179local links trong8tệp cốt lõi, không missing; xác nhận8link lịch sử lệch cấp và sửa lại đúng đích. Không xác nhận toànkho/anchor/web. Những lần archive sau phải rebase linktươngđối, không chép URL từdocsroot sangdocs/lich-su nguyênxi.
- G03 CHANGES_REQUESTED: gán CV sai, kỳ vọng template tự sinh khung câu không có, gọi “chuẩn BộGD” khi không có nguồn/reviewer, tên nút/flow chưa chứng minh. G01 vẫn chờ đính chính các lỗi cụ thể đã gửi. Mọi quyết định có submission ref/hash/history trong BATCH_REVIEWS; không ai cần xin user duyệt từng mục.
