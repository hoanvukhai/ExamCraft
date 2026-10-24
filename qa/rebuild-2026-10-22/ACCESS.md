# S1 — Quyền truy cập, bài giao và lượt làm

Cập nhật: 22/10/2026. Phạm vi cá nhân/nhóm nhỏ, không thay schema; chưa chạy DB thật/seed/AI.

## Đã triển khai

- Public exam dùng DTO allowlist cho metadata, phần, câu hỏi, ngữ liệu và hình. Đáp án, rubric, lời giải và trường lạ không đi qua route bài làm. Câu hỏi trong sections cũng được xử lý. Hình giữ dữ liệu hiển thị đã cho phép; đồ thị chỉ nhận biểu thức toán, range giới hạn.
- Start kiểm cửa sổ mở/đóng, trạng thái, lớp lưu trữ, lớp thuộc giáo viên, student thuộc lớp, identityMode, link cá nhân và PIN khi cấu hình. FREE_NAME là tự khai tên, không xác thực danh tính thật.
- Cookie riêng từng lượt: exam_attempt_<id>; HttpOnly, SameSite Strict, Secure ở production, path /api/public, tối đa 30 ngày từ lúc bắt đầu. HMAC ràng buộc version, attemptId, studentId, assignmentId và startedAt. Secret ATTEMPT_SESSION_SECRET hoặc SESSION_SECRET dài ít nhất 32 ký tự, không nhận giá trị mặc định dễ đoán. Đổi secret sẽ hết quyền các cookie cũ.
- Biết ID/tên học sinh không đủ tiếp tục lượt cũ: resume yêu cầu cookie lượt đó. Trình duyệt khác cần giáo viên hỗ trợ; không tự cấp lại quyền dựa vào tên.
- Start chạy transaction Serializable, retry xung đột tối đa 3 lần; số lượt tính tất cả lượt, gồm quá hạn; không cấp lại vô hạn bằng cách bỏ dở. Deadline là min(thời lượng, closesAt), kể cả khi không đặt thời lượng.
- Layout trộn được lưu theo seed; tiếp tục dùng cùng layout, key câu/đáp án giữ ổn định để chấm không lệch khi đổi thứ tự hiển thị.
- Draft dùng PATCH đúng với UI, kiểm cookie, giới hạn đáp án theo câu trong snapshot và kích thước; chỉ báo đã lưu sau response thành công. Không nhận draft sau deadline. Cập nhật có điều kiện trạng thái để không ghi đè bài đã nộp.
- Submit kiểm cookie, CSRF origin, snapshot bất biến; transaction Serializable + conditional update để chỉ nộp/chấm một lần. Sau deadline có đúng 15 giây dung sai gửi bài theo quyết định của điều phối; sau đó chỉ chốt bản nháp được nhận trước giờ. Đóng thủ công chặn đáp án mới ngay. UI dừng sửa khi hết giờ, tự gửi và có thể gửi lại an toàn khi lỗi mạng.
- Mọi lần trả kết quả, kể cả lặp/idempotent, đều áp IMMEDIATE/AFTER_CLOSE/NEVER; leaderboard áp thêm leaderboardReveal, không đưa bài chờ chấm vào xếp hạng. GET /api/public/attempts/:id/submit cho xem lại, vẫn yêu cầu cookie.
- Chấm MC/short/fill từ key có thật; không coi key thiếu và câu trống là đúng. Đúng/sai chỉ dùng thang lũy tiến nếu snapshot cấu hình; nếu không chia đều số điểm của câu. ESSAY/MATCHING/ORDERING và câu thiếu key để chờ giáo viên chấm, không giả vờ là đã chấm xong. Giữ đáp án false/0 đúng kiểu.
- UI thêm ô tự luận, điền khuyết và trả lời văn bản cho matching/ordering; phần kết quả nêu điểm tạm tính khi cần chấm tay; xem lại dùng đúng câu trả lời máy chủ đã nhận. Dữ liệu câu trả lời chỉ trả lại cho cookie sở hữu lượt.
- Public group không trả lịch sử/điểm theo studentId đơn thuần; chỉ những lượt có cookie HMAC hợp lệ, và áp reveal cho cả score/maxScore.
- Giao bài chỉ lấy exam/câu hỏi thuộc giáo viên, kiểm group owner, lịch mở/đóng và identity. Teacher PATCH cấu hình validate enum/date/duration/maxAttempts; CSV phân biệt chờ chấm với sai.
- Share cũ bằng examId bị khóa. Giáo viên tạo ShareLink token ngẫu nhiên 32 byte, mặc định không đáp án/không copy; có hết hạn và thu hồi. ShareModal dùng persistExam trước khi giao/chia sẻ, có chọn đáp án/copy, link 7 ngày và thu hồi. Chỉ giáo viên đã đăng nhập và được chủ link cho phép mới có nút tạo bản sao. Bản sao xóa version của bản nguồn.

## Hợp đồng API

- POST /api/public/assignments/:publicId/start: studentId hoặc freeName hoặc personalToken đúng identityMode; pin/joinCode khi yêu cầu. Trả attempt, exam đã lọc/trộn, serverNow; quyền nằm trong cookie, không trả token cho JavaScript.
- PATCH /api/public/attempts/:id/draft: {draft:{questionId:response}}.
- POST /api/public/attempts/:id/submit: {answers:{questionId:response}}. GET cùng đường dẫn xem lại kết quả đã nộp. Trả responses của chính lượt đã xác minh, score/maxScore theo reveal, needsGrading, solutions theo reveal.
- POST /api/exams/:id/share: {showAnswers?:boolean,allowCopy?:boolean,expiresAt?:ISO}; trả publicLink và link.id.
- GET /api/exams/:id/share liệt kê link của chủ đề. DELETE cùng URL: {linkId}, thu hồi.
- GET /api/public/share/:token chỉ đọc ShareLink còn hiệu lực, không nhận examId.

## Kiểm chứng và giới hạn còn lại

- Đã đọc AGENTS.md và guide route/use-server của Next16 trước sửa.
- 8 test helper độc lập DB đã chạy đạt tại thời điểm viết; agent kiểm thử đang bổ sung cases grace/figure/layout và route integration.
- Tsc phần thay đổi quyền đã qua; lần kiểm chung gần nhất còn chờ helper exam-client của điều phối và lỗi type/import của test cũ (đã chuyển cho người kiểm thử). Chưa được coi là build toàn dự án đã đạt.
- Chưa kiểm HTTP/transaction với PostgreSQL thật. Chỉ được làm trên DB test tách biệt có guard theo điều phối; tuyệt đối không dùng DB dữ liệu người dùng.
- PIN bị thiếu cấu hình thì từ chối, không bỏ qua. UI quản lý PIN cho giáo viên chưa nằm trong phần đã giao này.
- Matching/ordering hiện nhận trả lời văn bản và chờ chấm; chưa có giao diện kéo thả/chấm tự động. Chấm tay và cộng tác thời gian thực thuộc đợt sau.
- Cookie chứng minh quyền giữ lượt ở trình duyệt; FREE_NAME/PICK_FROM_LIST không thể bảo đảm danh tính người thật. Muốn chắc hơn dùng link cá nhân/PIN.
- Chia sẻ công khai đồng nghĩa người có link có thể đọc/tải nội dung đã cho phép; allowCopy điều khiển luồng tạo bản sao trong ứng dụng, không phải biện pháp chống sao chép nội dung đã công khai.


## Cập nhật sau kiểm định cấu trúc và điểm

- Đã bỏ luôn suy mẫu điểm chỉ từ tên môn/lớp, kể cả Toán10–12. freezeExamScoring và scoring chỉ dùng điểm của câu hoặc sections giáo viên đã chọn/lưu. Thao tác dùng mẫu trong GenerateModal mới materialize sections; đề tự do không tự nhận mẫu tốt nghiệp.
- Giao bài có điểm nhưng còn câu chưa được cấu hình điểm trả400 với hướng dẫn đặt điểm hoặc chọn nhận xét/khảo sát. Điểm0 hợp lệ được giữ.
- Matching có hai cột độc lập, sắp xếp cột phải trước khi cấp key để không lộ chỉ số cặp gốc. Ordering có các mục trình bày độc lập, nhập thứ tự bằng thêm/lên/xuống/bỏ; API nhận mảngkey, từ chối key lạ/trùng.
- Chấm ghép/sắp xếp theo cặp/thứ tự riêng trong snapshot và số điểm đã cấu hình: đúng toàn bộ mới nhận điểm câu; chưa có chính sách điểm thành phần tùy biến. Dữ liệu cấu trúc thiếu để chờ giáo viên; không đoán từ văn bản tự do.
- Cả hai dạng được hiển thị trên A4 và trong link xem không lộ đáp án. Khi chủ link bật đáp án hoặc showSolution cho phép, mới trả cặp ghép/thứ tự đúng.
- auto-grader.ts cũ trở thành adapter gọi cùng gradeSnapshot; không còn thang0.25/1/0.5 tự áp, đáp ánA mặc định, hoặc coi cờ đúng/sai còn thiếu là sai. False/0 được giữ.
- Thang lũy tiến được scale theo điểm câu ghi đè: điểm câu4 và bảngmax1 thì0.1tương ứng0.4; điểm câu0 luôn0. Bảng lỗi để chờ giáo viên.
- tests/structured_grading.test.ts:6/6đạt. tests/unit_tests.mjs:20/20đạt với fixture có sections được chọn rõ. tsc --noEmit đã đạt ở mốc bổ sung này.
