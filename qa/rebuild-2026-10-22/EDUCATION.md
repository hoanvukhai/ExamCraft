# S2/S4 — Danh mục giáo dục, nhận thức, điểm và ma trận

Cập nhật 22/10/2026. Đợt này bổ sung nền và luồng soạn có thể kiểm thử; chưa biến các nguồn nghiên cứu thành nội dung chuyên môn được duyệt.

## Đã làm

- Danh mục nhẹ trong src/config/education/coverage.json: 161 ô lớp–môn từ nghiên cứu đã bàn giao, 119 mã nguồn với metadata/URL. Chỉ lưu đầu mối, không nạp toàn văn SGK. Nguồn ghép/range được tách thành các ID thật.
- education-catalog.ts có môn/hoạt động 1–12, nghệ thuật, GDTC, trải nghiệm/hướng nghiệp, GDĐP, GDQP; nhánh NN1/NN2 và tiếng dân tộc có Raglai. Ngoại ngữ/tiếng dân tộc yêu cầu giáo viên chọn ngôn ngữ/chương trình/trình độ; không tự lấy số quyển làm lớp.
- Mọi gói đang needs_review: có nguồn nền không đồng nghĩa đã đọc hết mục lục, yêu cầu cần đạt, đáp án hay rubric. Gói chưa có phải báo thiếu, không âm thầm đổi sang Toán12.
- subject-config chỉ dùng mẫu có sẵn khi khớp môn và lớp; bỏ các ánh xạ Đạo đức→Lịch sử, TNXH→Tiếng Việt, Khoa học→KHTN THCS. Mẫu cũ mang nhãn tham khảo, không tự nhận chuẩn mọi kỳ thi.
- Điểm 0 được giữ; không mặc định tổng 10 cho đề trống/thiếu cấu hình. Bài nhận xét/rubric/khảo sát không tự gắn điểm. Bảy dạng câu vẫn có thể lưu, nhập điểm riêng và thống kê đúng tổng.
- Khung nhận thức tách riêng difficulty cũ: tiểu học ba mức, mẫu tham khảo THPT Biết–Hiểu–Vận dụng, khung bốn mức cũ chỉ khi giáo viên chọn. Câu phải có cognitiveLevel thuộc khung đang chọn; không tự coi difficulty là mức nhận thức đã duyệt.
- Ma trận tính từ câu thật, có cột chưa gắn mức và cảnh báo phần thiếu. Tự luận/phần mở rộng được tính, không bỏ part4. Bản đặc tả dùng learningOutcome đã nhập; không tự tạo yêu cầu giải tích/hình học cho mọi môn.
- A4 và bảng ma trận Word dùng số mức linh hoạt, hiển thị cảnh báo và trạng thái không tính điểm; bỏ đáp án giả A khi chưa có key. Hiển thị môn/khung đúng dữ liệu.
- GenerateModal được rút gọn: lớp/môn, phạm vi, mục đích, chế độ đánh giá, số câu/thời lượng. Cho số 0 ở từng dạng, có tự luận; chi tiết nguồn/nhận thức nằm trong phần mở rộng. Không còn hứa tự cập nhật pháp luật/số liệu hay gắn nhãn chuẩn Bộ cho mọi đề.
- Snapshot giao bài và chia sẻ lấy từ adapter document đầy đủ để giữ ngữ liệu chung. Học sinh đọc ngữ liệu theo passageId; trộn câu không làm mất ngữ cảnh.
- FunctionPlot loại bỏ cả hai new Function. Parser nội bộ chỉ hiểu số, x, phép toán, dấu ngoặc và các hàm toán trong danh sách; không chạy JavaScript. Giới hạn độ dài/token/độ lồng và range đồ thị để tránh mã chạy hoặc vòng vẽ quá lớn.
- Khảo sát khi nộp chỉ ghi phản hồi, không đánh đúng/sai; nhận xét/rubric để chờ giáo viên. Chính sách trả điểm của lượt làm tôn trọng chế độ này.

## Kiểm chứng

- tsc --noEmit: đạt ở mốc hoàn tất education.
- tests/unit_tests.mjs: 20/20 đạt; sửa bốn giả định cũ về Toán12, khung nhận thức và danh mục môn.
- tests/education.test.ts: 5 ca đạt, gồm toàn lớp, môn chưa hỗ trợ, điểm0/bảy dạng/không điểm, ma trận có và chưa ánh xạ, khảo sát, parser an toàn.
- Kết hợp education + public_access: 16 ca đạt tại mốc ghi báo cáo.
- Không gọi AI thật; không seed/ghi DB chính. HTTP/DB và UI tổng thể do đợt nghiệm thu riêng xác minh.

## Hạn chế cần giữ rõ

- Đây là danh mục nguồn và nền cấu hình; cây mục lục/yêu cầu cần đạt đầy đủ từng cuốn, bộ đề–đáp án/rubric cho mọi ô, và giáo viên nghiệm thu vẫn đang thiếu.
- Chưa có bộ luật tự chứng nhận tuân thủ; mẫu tham khảo không thay hướng dẫn của đơn vị tổ chức.
- Chọn khung trong sinh đề chỉ tạo yêu cầu và lưu metadata. Nếu AI chưa trả cognitiveLevel/learningOutcome thì ma trận tiếp tục báo chưa gắn; không giả vờ tự map xong.
- Nhập matching/ordering trực tuyến hiện dùng trả lời văn bản/chấm tay, chưa có kéo thả hoặc chấm tự động.
- Nhánh ngôn ngữ và địa phương có nguồn tham chiếu, chưa có ánh xạ đầy đủ trình độ/địa giới/ấn bản. Nội dung vẫn cần kiểm chứng đúng ngữ cảnh.


## Cập nhật sau kiểm định cấu trúc và điểm

- Đã bỏ luôn suy mẫu điểm chỉ từ tên môn/lớp, kể cả Toán10–12. freezeExamScoring và scoring chỉ dùng điểm của câu hoặc sections giáo viên đã chọn/lưu. Thao tác dùng mẫu trong GenerateModal mới materialize sections; đề tự do không tự nhận mẫu tốt nghiệp.
- Giao bài có điểm nhưng còn câu chưa được cấu hình điểm trả400 với hướng dẫn đặt điểm hoặc chọn nhận xét/khảo sát. Điểm0 hợp lệ được giữ.
- Matching có hai cột độc lập, sắp xếp cột phải trước khi cấp key để không lộ chỉ số cặp gốc. Ordering có các mục trình bày độc lập, nhập thứ tự bằng thêm/lên/xuống/bỏ; API nhận mảngkey, từ chối key lạ/trùng.
- Chấm ghép/sắp xếp theo cặp/thứ tự riêng trong snapshot và số điểm đã cấu hình: đúng toàn bộ mới nhận điểm câu; chưa có chính sách điểm thành phần tùy biến. Dữ liệu cấu trúc thiếu để chờ giáo viên; không đoán từ văn bản tự do.
- Cả hai dạng được hiển thị trên A4 và trong link xem không lộ đáp án. Khi chủ link bật đáp án hoặc showSolution cho phép, mới trả cặp ghép/thứ tự đúng.
- auto-grader.ts cũ trở thành adapter gọi cùng gradeSnapshot; không còn thang0.25/1/0.5 tự áp, đáp ánA mặc định, hoặc coi cờ đúng/sai còn thiếu là sai. False/0 được giữ.
- Thang lũy tiến được scale theo điểm câu ghi đè: điểm câu4 và bảngmax1 thì0.1tương ứng0.4; điểm câu0 luôn0. Bảng lỗi để chờ giáo viên.
- tests/structured_grading.test.ts:6/6đạt. tests/unit_tests.mjs:20/20đạt với fixture có sections được chọn rõ. tsc --noEmit đã đạt ở mốc bổ sung này.
