# KỊCH BẢN DIỄN TẬP 5 TÌNH HUỐNG SỰ CỐ KHẨN CẤP ĐỢT PILOT
*Kế hoạch ứng phó sự cố kỹ thuật và quy trình tác chiến dành cho Ban điều hành ExamCraft và Ban tổ chức thi trường học*

- **Người thực hiện:** Gemini (QA & Quản trị rủi ro thử nghiệm)
- **Nhiệm vụ:** GEM-Q9 (Generation 9)
- **Mã CV đối chiếu:** CV076 (Kịch bản diễn tập sự cố pilot), CV071
- **Thời điểm lập (UTC):** 2026-10-25T08:00:00Z
- **Mục tiêu:** Thiết lập quy trình phản ứng nhanh, phân công trách nhiệm rõ ràng và chuẩn hóa các bước xử lý từng phút từ phút 0 đến phút 30 cho 5 sự cố điển hình có thể phát sinh trong quá trình triển khai thử nghiệm thực tế.

---

## MA TRẬN PHÂN CÔNG VAI TRÒ CHUNG TRONG DIỄN TẬP

| Ký hiệu vai trò | Tên vai trò | Trách nhiệm chính trong tình huống khẩn cấp |
|:---:|---|---|
| **CDA** | **Chủ dự án (Project Director)** | Tổng chỉ huy, quyết định hoãn/hủy/cấp đề dự phòng, phê duyệt thông cáo kỹ thuật. |
| **ADM** | **Quản trị viên trường / BGH (School Admin)** | Điều phối giám thị, trấn an phụ huynh và học sinh, ký biên bản sự cố trường học. |
| **TCH** | **Giáo viên coi thi / Bộ môn (Teacher)** | Trực tiếp hướng dẫn học sinh trong phòng thi, thực hiện điều chỉnh bài giao và chấm lại. |
| **ENG** | **Chuyên viên CNTT / Kỹ sư hệ thống (IT Support)** | Xử lý mạng, hạ tầng máy chủ cục bộ, sao lưu/khôi phục dữ liệu, kiểm tra nhật ký log. |

---

## KỊCH BẢN S1: MẤT ĐIỆN HOẶC MẤT MẠNG TOÀN TRƯỜNG TRONG LÚC ĐANG THI

### 1. Tình huống giả định
Vào lúc 08:20, khi 120 học sinh khối 6 đang làm bài thi kiểm tra giữa kỳ môn KHTN trực tuyến được 20 phút thì toàn bộ khu vực phòng máy và Wi-Fi của trường bị mất điện lưới đột ngột hoặc đứt đường truyền cáp quang.

### 2. Kế hoạch xử lý từng phút (Từ phút 0 đến phút 30)
- **Phút 0 – Phút 2 (Phát hiện & Giữ hiện trường):**
  + TCH lập tức yêu cầu học sinh giữ nguyên hiện trường, không chạm vào nút nguồn điện thoại/máy tính, không đóng trình duyệt web.
  + TCH thông báo rõ ràng cho học sinh: Bài làm của các em đã được lưu tự động trên bộ nhớ máy, không bị mất điểm.
- **Phút 3 – Phút 5 (Báo cáo & Đánh giá nguồn điện):**
  + TCH gọi bộ đàm/điện thoại báo cáo cho ADM và ENG.
  + ENG kiểm tra tủ điện tổng và trạm phát sóng Wi-Fi; xác định thời gian dự kiến có điện lại (nguồn máy phát dự phòng hoặc sự cố diện rộng).
- **Phút 6 – Phút 10 (Kích hoạt phương án duy trì):**
  + Nếu là thiết bị di động cá nhân (pin còn hoạt động): ENG hướng dẫn TCH cho phép học sinh phát sóng 4G cá nhân hoặc chuyển sang bộ phát Wi-Fi di động 4G dự phòng của tổ CNTT.
  + Nếu là dàn máy tính để bàn phòng lab: ENG khởi động máy phát điện trường học (nếu có) hoặc báo cáo CDA để xin ý kiến phương án bổ sung thời gian làm bài.
- **Phút 11 – Phút 20 (Khôi phục kết nối & Đồng bộ dữ liệu):**
  + Khi nguồn điện hoặc mạng được khôi phục, học sinh không cần tải lại trang (F5) nếu đang ở trang thi; hệ thống tự nhận diện mạng và đẩy dữ liệu nháp về máy chủ.
  + TCH vào trang quản lý bài giao của giáo viên, thực hiện chỉnh sửa gia hạn thêm 15 đến 20 phút cho phòng thi tương ứng với thời gian mất điện.
- **Phút 21 – Phút 30 (Hoàn tất bài thi & Đối soát):**
  + Học sinh tiếp tục hoàn thành các câu hỏi còn lại và bấm Nộp bài.
  + TCH và ENG đối chiếu số lượng bài nộp trên màn hình quản lý với sĩ số thực tế trong phòng thi.

### 3. Tiêu chuẩn coi là đã xử lý xong
1. 100% học sinh nộp bài thành công mà không bị mất các đáp án đã chọn trước thời điểm mất mạng.
2. Thời gian làm bài thực tế của học sinh được bù trừ đầy đủ, không gây thiệt thòi quyền lợi.
3. Có biên bản ghi nhận sự cố có chữ ký xác nhận của TCH, ENG và ADM.

---

## KỊCH BẢN S2: HỌC SINH NỘP BÀI CÙNG 1 GIÂY GÂY QUÁ TẢI MÁY CHỦ (HIGH CONCURRENCY)

### 1. Tình huống giả định
Đúng 09:00:00, đồng hồ đếm ngược của phòng thi 45 phút kết thúc. Toàn bộ 250 học sinh trên các phòng thi đồng loạt gửi yêu cầu nộp bài trong cùng một tích tắc, khiến máy chủ cục bộ phản hồi chậm, một số máy học sinh xoay vòng tròn chờ đợi.

### 2. Kế hoạch xử lý từng phút (Từ phút 0 đến phút 30)
- **Phút 0 – Phút 3 (Nhận diện & Trấn an):**
  + Học sinh thấy màn hình hiện trạng thái Đang nộp bài... kèm biểu tượng vòng xoay.
  + TCH yêu cầu học sinh không bấm liên tục nhiều lần vào nút nộp bài, không đóng tab trình duyệt; thông báo hệ thống đang xếp hàng xử lý tự động.
- **Phút 4 – Phút 8 (Xử lý hàng đợi máy chủ):**
  + ENG theo dõi tải tài nguyên CPU và bộ nhớ RAM của máy chủ cục bộ.
  + Cơ chế khóa hàng (row-lock) và chống nộp lặp của ExamCraft đảm bảo mỗi lượt làm bài chỉ được ghi nhận một lần duy nhất, các yêu cầu đến sau được xếp hàng tuần tự trong tối đa 15 giây.
- **Phút 9 – Phút 15 (Xác nhận các trường hợp bị trễ):**
  + Trên máy học sinh, nếu gặp mạng chậm quá thời gian chờ, hệ thống hiển thị nút Thử nộp lại hoặc hướng dẫn học sinh bấm xác nhận lại với dữ liệu đã lưu nháp.
  + TCH kiểm tra danh sách bài nộp trên trang quản lý giáo viên; quan sát số lượng bài nộp tăng dần từ 50, 100, đến 240 bài.
- **Phút 16 – Phút 25 (Hỗ trợ cục bộ cho các máy còn tồn đọng):**
  + Với 5 đến 10 máy học sinh có đường truyền yếu nhất chưa báo thành công, TCH đến từng máy, kiểm tra bảng thông báo phục hồi dữ liệu nháp (StudentDraftRecovery) trên màn hình và bấm hỗ trợ nộp bản nháp an toàn.
- **Phút 26 – Phút 30 (Chốt danh sách phòng thi):**
  + TCH bấm làm mới bảng điểm, xác nhận danh sách bài nộp đạt 100% sĩ số tham gia.
  + ENG giải phóng bộ đệm máy chủ và xuất báo cáo tải đỉnh (peak concurrency).

### 3. Tiêu chuẩn coi là đã xử lý xong
1. Không có bài làm nào của học sinh bị mất mát dữ liệu hoặc nhận điểm 0 do lỗi máy chủ bận.
2. Toàn bộ các bài làm nộp đồng thời được phân định thời gian và tính điểm chuẩn xác.
3. Máy chủ trở lại trạng thái tải bình thường (CPU < 30%).

---

## KỊCH BẢN S3: PHÁT HIỆN LỘ ĐỀ THI TRƯỚC GIỜ LÀM BÀI

### 1. Tình huống giả định
Lúc 07:15 sáng (trước giờ thi chính thức 45 phút), quản trị viên trường phát hiện đường link phòng thi trực tuyến kèm mã đề đã bị gửi nhầm vào nhóm phụ huynh học sinh chung, một số học sinh đã vào xem trước cấu trúc đề thi.

### 2. Kế hoạch xử lý từng phút (Từ phút 0 đến phút 30)
- **Phút 0 – Phút 3 (Báo động & Kích hoạt phong tỏa):**
  + TCH phát hiện sự việc, lập tức báo động khẩn cấp cho ADM và CDA.
  + TCH vào ngay trang quản lý phòng thi, bấm nút Đóng bài thi để lập tức chặn toàn bộ lượt truy cập mới từ liên kết bị lộ.
- **Phút 4 – Phút 8 (Thu hồi liên kết & Kiểm tra truy vết):**
  + Nếu có liên kết xem đề bị gửi ra ngoài, TCH mở hộp thoại chia sẻ đề và bấm Thu hồi link này để vô hiệu hóa hoàn toàn mã truy cập cũ.
  + ENG kiểm tra nhật ký máy chủ, xác định chính xác danh sách các địa chỉ IP và tài khoản đã truy cập trái phép vào đề thi trước giờ.
- **Phút 9 – Phút 18 (Kích hoạt đề thi dự phòng):**
  + CDA chỉ đạo sử dụng Bộ đề thi dự phòng (Mã đề Variant B đã được tổ chuyên môn biên soạn sẵn và niêm phong trong kho đề).
  + TCH mở đề dự phòng B trong ExamCraft, vào hộp thoại chia sẻ -> Giao Bài Thi Online (Chấm Tự Động).
  + TCH thiết lập Tùy chọn nâng cao: Đặt Mã vào bài mới (ví dụ: THI2026B), tích chọn Trộn thứ tự câu hỏi và Trộn thứ tự đáp án.
  + Bấm nút Giao Bài & Tạo Phòng Thi Ngay để lấy đường dẫn phòng thi mới 100%.
- **Phút 19 – Phút 25 (Phát hành liên kết mới có kiểm soát):**
  + ADM và TCH chỉ gửi liên kết phòng thi mới trực tiếp lên màn hình máy chiếu của từng phòng thi hoặc gửi riêng cho giám thị tại phòng thi, không gửi vào nhóm chat chung.
- **Phút 26 – Phút 30 (Ổn định phòng thi và bắt đầu):**
  + Giám thị hướng dẫn học sinh nhập liên kết mới và mã vào bài mới.
  + Buổi kiểm tra bắt đầu đúng quy chế với đề thi dự phòng an toàn tuyệt đối.

### 3. Tiêu chuẩn coi là đã xử lý xong
1. Liên kết và mã đề cũ bị đóng và thu hồi triệt để, không ai có thể truy cập được nữa.
2. Đề thi dự phòng mới được kích hoạt thành công, đảm bảo tính công bằng và bảo mật tuyệt đối cho kỳ thi.
3. Lập biên bản niêm phong sự cố rò rỉ đề nộp Ban Giám hiệu.

---

## KỊCH BẢN S4: GIÁO VIÊN NHẬP NHẦM ĐÁP ÁN CHO CÂU HỎI ĐIỂM CAO

### 1. Tình huống giả định
Sau khi 80 học sinh nộp bài và xem điểm số, giáo viên bộ môn phát hiện Câu 15 (câu trắc nghiệm phần II chiếm tới 2.5 điểm) bị cài đặt nhầm đáp án gốc trong hệ thống: Đáp án đúng thực tế là C nhưng hệ thống lại lưu là A, dẫn tới nhiều học sinh giỏi bị trừ điểm oan.

### 2. Kế hoạch xử lý từng phút (Từ phút 0 đến phút 30)
- **Phút 0 – Phút 4 (Tiếp nhận phản ánh & Xác minh chuyên môn):**
  + Học sinh thắc mắc với TCH về kết quả câu hỏi.
  + TCH cùng Tổ trưởng chuyên môn mở bản đặc tả ma trận và hướng dẫn giải, đối chiếu trực tiếp và xác nhận chính thức: Đáp án đúng chuẩn xác là C.
- **Phút 5 – Phút 10 (Trấn an học sinh & Mở bảng điều khiển đính chính):**
  + TCH thông báo với cả lớp: Tổ bộ môn đã ghi nhận phản ánh và hệ thống đang tiến hành hiệu chỉnh chấm lại tự động, bảo đảm quyền lợi tối đa cho các em.
  + TCH mở trang quản trị bài đã giao tại đường dẫn /teacher/assignments/[id].
- **Phút 11 – Phút 16 (Thực hiện quy trình Sửa đáp án và Chấm lại):**
  + TCH nhấp chọn thẻ Phân tích câu hỏi.
  + Nhấp mở rộng khối Sửa đáp án và chấm lại.
  + Tại ô Câu cần sửa, chọn đúng Câu 15.
  + Tại ô Đáp án đúng mới, chọn lại phương án C.
  + Tại ô Lý do (bắt buộc, lưu vào lịch sử), TCH nhập: Đính chính đáp án Câu 15 từ A sang C theo kết luận của Tổ chuyên môn.
- **Phút 17 – Phút 22 (Xem trước ảnh hưởng & Áp dụng chính thức):**
  + TCH bấm nút Xem trước ảnh hưởng.
  + Hệ thống hiển thị rõ ràng: 52 học sinh được tăng điểm, 18 học sinh giữ nguyên, các bài đã chấm tay tự luận được giữ nguyên điểm số.
  + TCH đối chiếu danh sách thấy hoàn toàn hợp lý, bấm nút Sửa đáp án và chấm lại.
- **Phút 23 – Phút 30 (Kiểm tra bảng điểm cập nhật & Công bố):**
  + Hệ thống hoàn tất cập nhật lại điểm toàn bộ 80 học sinh trong vài giây.
  + TCH quay lại thẻ Bảng điểm & Bài nộp, xác nhận điểm số mới đã nhảy đúng.
  + Học sinh tải lại trang kết quả trên thiết bị của mình và nhìn thấy điểm số chuẩn xác vừa được điều chỉnh.

### 3. Tiêu chuẩn coi là đã xử lý xong
1. Toàn bộ học sinh chọn đúng phương án C được cộng điểm công bằng 100%.
2. Các bài tự luận đã được giáo viên chấm trước đó không bị ảnh hưởng hay ghi đè sai lệch.
3. Lịch sử đính chính lưu lại đầy đủ thời gian và lý do trong nhật ký kiểm toán của bài thi.

---

## KỊCH BẢN S5: MÁY IN TRƯỜNG HỌC BỊ HỎNG TRƯỚC GIỜ THI IN GIẤY 15 PHÚT

### 1. Tình huống giả định
Lúc 07:15, chỉ còn đúng 15 phút là đến giờ phát đề thi in giấy cho 4 phòng thi (120 học sinh). Máy in siêu tốc của văn phòng trường đột ngột bị kẹt giấy nặng, hỏng trục sấy và không thể in tiếp các mã đề còn lại.

### 2. Kế hoạch xử lý từng phút (Từ phút 0 đến phút 30)
- **Phút 0 – Phút 3 (Đánh giá mức độ hư hại & Báo cáo):**
  + Cán bộ văn phòng phụ trách in ấn kiểm tra máy in, xác định không thể khắc phục tại chỗ trong 15 phút.
  + Lập tức báo cáo ADM và CDA để kích hoạt phương án phân luồng in ấn dự phòng.
- **Phút 4 – Phút 8 (Kích hoạt phương án xuất PDF & Chia tải máy in văn phòng):**
  + ENG và TCH mở ngay ExamCraft, truy cập đề thi chính thức.
  + Thay vì chờ đợi xuất tệp Word có thể mất thời gian căn chỉnh, TCH bấm ngay nút In A4 trên thanh công cụ.
  + Tại hộp thoại in của trình duyệt, chọn máy in là Lưu dưới dạng PDF (Save as PDF).
  + Tải về tệp PDF đề thi in ấn chuẩn A4 đã được dàn trang liền khối hoàn hảo chỉ trong 5 giây.
- **Phút 9 – Phút 18 (Phân tải in ấn đa điểm):**
  + ENG gửi tệp PDF qua mạng nội bộ đến 3 máy in văn phòng nhỏ tại Phòng Hiệu phó, Phòng Đoàn Đội và Phòng Y tế.
  + Chia định mức in: Mỗi máy in văn phòng đảm nhận 40 bản in (khoảng 80 trang giấy A4).
  + Với tốc độ 20 trang/phút, 3 máy in hoàn thành toàn bộ 120 bản đề thi trong vòng 4 đến 5 phút.
- **Phút 19 – Phút 24 (Đóng gói & Bàn giao đề thi cho giám thị):**
  + Ban in sao đề thi kiểm đếm số lượng, niêm phong theo từng túi phòng thi (Phòng 1 đến Phòng 4) và bàn giao cho giám thị.
- **Phút 25 – Phút 30 (Phát đề và ổn định kỳ thi):**
  + Giám thị mang đề vào phòng thi lúc 07:42 (chỉ chậm hơn kế hoạch ban đầu 7 phút).
  + ADM cho phép điều chỉnh lùi giờ tính giờ làm bài của học sinh thêm 10 phút để đảm bảo đủ 45 phút làm bài trọn vẹn theo quy định.

### 3. Tiêu chuẩn coi là đã xử lý xong
1. 100% học sinh nhận đủ đề thi in ấn sắc nét, đúng quy cách A4, không thiếu trang/mất chữ.
2. Giờ làm bài của học sinh được điều chỉnh tương ứng, không gây hoang mang tâm lý cho thí sinh.
3. Đề thi in từ bản PDF trực tiếp khớp hoàn toàn 100% nội dung với bản lưu trữ trên hệ thống ExamCraft.

---
*Tài liệu nội bộ phục vụ công tác diễn tập sự cố trước ngày khởi động Pilot chính thức.*
