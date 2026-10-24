# HƯỚNG DẪN DÀNH CHO THẦY CÔ THAM GIA THỬ NGHIỆM (PILOT)
*Hệ thống biên soạn đề thi và khảo thí trực tuyến ExamCraft*
*Căn cứ mã nguồn thực tế tại commit `rebuild/2026-10-local HEAD`*

Kính gửi Quý Thầy/Cô, tài liệu này hướng dẫn nhanh các thao tác cốt lõi trong đợt thử nghiệm hệ thống ExamCraft. Phần mềm được thiết kế tinh gọn theo thói quen sư phạm của giáo viên, giúp Thầy/Cô dễ dàng soạn đề chuẩn chương trình mới, in ấn đẹp mắt và tổ chức phòng thi không lo mất bài.

---

## 1. Đăng nhập và bắt đầu làm việc

1. **Truy cập hệ thống:** Mở trình duyệt web (Google Chrome, Microsoft Edge, Cốc Cốc) và truy cập vào địa chỉ nội bộ do nhà trường hoặc quản trị viên cung cấp (`/login`).
2. **Đăng nhập:** Nhập địa chỉ **Email** và **Mật khẩu khởi tạo** được cấp, sau đó bấm nút **"Đăng nhập hệ thống"** (`src/app/login/page.tsx:125`).
3. **Đổi mật khẩu riêng (bắt buộc ở lần đầu tiên):** Nhằm bảo mật kho đề và tài khoản của Thầy/Cô, hệ thống sẽ hiện hộp thoại yêu cầu đặt mật khẩu mới (tối thiểu 8 ký tự). Thầy/Cô nhập mật khẩu riêng của mình và bấm **"Lưu mật khẩu và tiếp tục"** (`src/app/login/page.tsx:173`).
4. Sau khi đổi mật khẩu, Thầy/Cô sẽ vào ngay **Kho Đề Cá Nhân** (`src/components/TeacherDashboard.tsx:321`) để quản lý các đề thi của mình.

---

## 2. Khóa trợ lý AI là tùy chọn (Không bắt buộc)

> [!NOTE]
> **Thầy/Cô hoàn toàn không cần nhập khóa AI vẫn sử dụng được toàn bộ các tính năng:**
> Soạn thảo 7 dạng câu hỏi, chèn hình ảnh, căn chỉnh đề, xem trước bản in A4, xem đề và đáp án song song, trộn mã đề, xuất tệp Word (.docx), in đề thi, chia sẻ đồng nghiệp, giao bài cho học sinh và chấm bài tự động.

- Tính năng AI chỉ đóng vai trò là một người trợ lý gợi ý câu hỏi khi Thầy/Cô có nhu cầu.
- Nếu muốn dùng trợ lý AI, Thầy/Cô bấm nút **"Thêm khóa AI"** ở góc trên để dán mã khóa cá nhân (được hệ thống mã hóa bảo vệ an toàn). Nếu không dùng, Thầy/Cô có thể bỏ qua phần này mà công việc soạn đề vẫn diễn ra bình thường.

---

## 3. Soạn đề thi chuẩn 7 dạng câu hỏi

1. **Tạo đề mới:** Tại màn hình chính, Thầy/Cô bấm nút xanh **"Soạn Đề Thi Mới"** (ở cột bên trái) hoặc chọn ô **"Soạn đề trống mới"** (`src/components/TeacherDashboard.tsx:342`).
2. **Đổi tên đề:** Nhấp chuột trực tiếp vào dòng tiêu đề đề thi ở thanh trên cùng để gõ tên đề mong muốn (`src/components/ExamWorkspace.tsx:190`).
3. **Thêm câu hỏi:** Bấm nút **"Thêm câu hỏi"** và chọn một trong 7 định dạng quen thuộc:
   - **Trắc nghiệm 4 lựa chọn (Phần I):** Nhập đề bài và 4 phương án A, B, C, D; nhấp chuột chọn phương án đúng.
   - **Đúng / Sai 4 ý (Phần II):** Nhập câu dẫn chung và 4 mệnh đề con a, b, c, d; tích chọn Đúng hoặc Sai cho từng ý.
   - **Trả lời ngắn (Phần III):** Nhập câu hỏi và điền giá trị đáp số chuẩn vào ô đáp án.
   - **Tự luận:** Nhập nội dung câu hỏi tự luận và hướng dẫn chấm (barem điểm / rubric).
   - **Điền từ khuyết:** Đặt các vị trí cần điền từ vào chỗ trống trong đoạn văn (`fill_blank`).
   - **Ghép nối hai cột:** Tạo các cặp nội dung tương ứng ở cột trái và cột phải (`matching`).
   - **Sắp xếp thứ tự:** Nhập các bước hoặc sự kiện cần sắp xếp theo trình tự đúng (`ordering`).
4. **Chèn hình ảnh & Ngữ liệu:** Mỗi câu hỏi đều có nút gắn hình ảnh minh họa (`Figure`) hoặc gán đoạn trích ngữ liệu đọc hiểu dùng chung (`Passage`) cho nhiều câu hỏi.
5. **Công thức Toán học:** Gõ công thức toán học thuận tiện kẹp giữa cặp dấu `$...$` hoặc `$$...$$`; hệ thống tự động hiển thị công thức toán sắc nét, đẹp mắt bằng KaTeX.
6. **Lưu đề:** Sau khi chỉnh sửa, Thầy/Cô bấm nút **"Lưu đề"** ở góc trên danh sách câu hỏi (`src/components/ExamWorkspace.tsx:244`). Khi nút chuyển sang biểu tượng tích xanh kèm chữ "Lưu đề" là dữ liệu đã được lưu trữ an toàn trên máy chủ.

---

## 4. Xem trước bản in A4, Chế độ Song song, Trộn mã đề & Xuất tệp Word

1. **Khung xem bản in A4 (Cột bên phải):** Cho phép Thầy/Cô thấy ngay hình hài trang giấy in thực tế của đề thi (`src/components/A4Preview.tsx`). Thầy/Cô có thể chuyển đổi các chế độ xem:
   - **Đề thi (`viewMode = 'exam'`):** Trang đề sạch đẹp để in phát cho học sinh làm bài trên giấy.
   - **Song song (`src/components/A4Preview.tsx:127`):** Chế độ hiển thị đề và đáp án song song hai cột (cột trái là **"ĐỀ"**, cột phải là **"ĐÁP ÁN VÀ HƯỚNG DẪN"**).
     * *Mục đích:* Dành riêng cho giáo viên tra cứu đối chiếu nhanh trên màn hình hoặc in bản giáo viên giữ, **không phát cho học sinh**.
     * *Lưu ý khi xuất Word:* Khi tải file Word (.docx) ở chế độ này, hệ thống sẽ xuất toàn bộ đề thi trước, tiếp theo là phần đáp án và lời giải chi tiết ở cuối tài liệu (bố cục văn bản chuẩn), không xuất dạng chia 2 cột để đảm bảo tương thích hoàn hảo với Microsoft Word.
   - **Bảng đáp án (`viewMode = 'answers'`):** Bảng tổng hợp đáp án A-B-C-D và biểu điểm chi tiết.
   - **Hướng dẫn giải (`viewMode = 'solutions'`):** Lời giải chi tiết từng bước cho từng câu hỏi.
   - **Ma trận & Đặc tả (`viewMode = 'matrix'`):** Thống kê tỷ lệ các câu hỏi theo chuẩn năng lực và mức độ nhận thức (CV 7991).
2. **Trộn đề thi thành nhiều mã:**
   - Bấm nút **"Trộn 4 mã đề"** ở thanh công cụ bên trái (`src/components/ShuffleModal.tsx`).
   - Chọn số lượng mã đề muốn sinh (2, 4, 6 hoặc 8 mã đề).
   - Bấm nút **"Trộn ngẫu nhiên lại"**: Hệ thống tự động xáo trộn câu hỏi và các phương án A-B-C-D một cách khoa học, kèm theo bảng ma trận đáp án đối chiếu chéo giữa các mã đề.
   - Thầy/Cô có thể tải riêng từng mã đề ra tệp Word hoặc bấm **"Sao chép ma trận đáp án"** để dán vào sổ theo dõi.
3. **Tải tệp Word (.docx) & In đề:**
   - Bấm nút **"Tải file Word (.docx)"** (`src/components/A4Preview.tsx:66`) hoặc nút trên thanh công cụ để tải đề thi về máy tính. Tệp Word được tạo theo chuẩn công thức toán học Microsoft Office (OMML) và nhúng ảnh đầy đủ, mở ra chỉnh sửa font chữ, căn lề bình thường.
   - Bấm nút **"In A4"** nếu muốn in trực tiếp ra máy in hoặc xuất nhanh ra tệp PDF.

---

## 5. Chia sẻ đề cho đồng nghiệp & Tạo bản sao độc lập

Thầy/Cô có hai cách chia sẻ tài liệu rất rõ ràng:

1. **Gửi liên kết xem hoặc tải file Word:**
   - Bấm nút **"Chia sẻ & Thi Online"** -> Chọn tab **"Link Xem / Tải Word (.docx)"** (`src/components/ShareModal.tsx`).
   - Tích chọn có kèm đáp án hay không, có cho phép đồng nghiệp sao chép đề hay không, rồi bấm **"Tạo link chia sẻ"**.
   - Bấm **"Sao chép"** gửi link cho đồng nghiệp (dạng `/share/[id]`).
   - **Nút "Tạo bản sao để sửa" (`src/app/share/[id]/page.tsx:190`):**
     * Khi đồng nghiệp mở liên kết, nếu Thầy/Cô bật quyền cho phép sao chép (`allowCopy`), trên đầu trang sẽ xuất hiện nút **"Tạo bản sao để sửa"**.
     * Đồng nghiệp cần đăng nhập tài khoản giáo viên để bấm nút này. Khi bấm, hệ thống sẽ nhân bản đề thi vào kho đề riêng của đồng nghiệp và tự động mở trang biên tập.
     * **Bảo mật đáp án:** Bản sao chép chỉ mang theo đáp án nếu liên kết chia sẻ được bật quyền hiện đáp án (`showAnswers = true`). Nếu liên kết chỉ chia sẻ đề bài, bản sao được tạo cũng sẽ không có đáp án, giúp bảo vệ tính bí mật của đề thi. **Đề gốc của Thầy/Cô hoàn toàn không bị ảnh hưởng.**
   - Thầy/Cô có thể bấm **"Thu hồi link này"** bất kỳ lúc nào để vô hiệu hóa liên kết xem.
2. **Mời đồng nghiệp cùng biên tập (Đồng tác giả):**
   - Bấm nút **"Cùng soạn · Góp ý · Lịch sử"** ở thanh điều hướng phụ.
   - Nhập email của giáo viên đồng nghiệp, chọn quyền mong muốn (*Người xem*, *Người góp ý*, hoặc *Người cùng sửa*) rồi bấm **"Cấp quyền"**.
   - Đồng nghiệp đăng nhập tài khoản của họ sẽ nhìn thấy đề trong kho và cùng Thầy/Cô hoàn thiện nội dung. Thầy/Cô có thể bấm **"Thu hồi quyền"** bất cứ lúc nào khi kỳ thi kết thúc.

---

## 6. Giao bài thi trực tuyến cho học sinh & Tùy chọn nâng cao

1. Bấm nút **"Chia sẻ & Thi Online"** -> Chọn tab **"Giao Bài Thi Online (Chấm Tự Động)"** (`src/components/ShareModal.tsx:430`).
2. **Thiết lập đợt thi cơ bản:**
   - **Tiêu đề bài giao:** Ví dụ `Kiểm tra giữa kỳ 1 môn Toán`.
   - **Chọn lớp học:** Chọn lớp học có sẵn, hoặc để chế độ tự do để học sinh tự gõ họ tên khi vào làm.
   - **Hình thức làm bài:**
     * *Ôn tập:* Học sinh được làm nhiều lần, không ép thời gian.
     * *Về nhà:* Có giới hạn thời gian làm và cho xem lời giải sau khi nộp.
     * *Phòng thi:* Giới hạn thời gian (ví dụ 45 phút), làm 1 lượt duy nhất, bảo mật cao.
   - **Bảng xếp hạng:** Bật hoặc tắt bảng xếp hạng *Top & Me* (hiển thị nhóm đầu lớp và vị trí của riêng học sinh).
   - **Chính sách xem kết quả:** Chọn xem điểm ngay sau khi nộp, hoặc chỉ xem sau khi giáo viên đóng đợt thi.
3. **Tùy chọn nâng cao (`src/components/ShareModal.tsx:479-499`):**
   Thầy/Cô bấm vào mục **"Tùy chọn nâng cao: giờ mở/đóng, số lượt, mã vào bài"** để cấu hình chi tiết:
   - **Giờ mở (để trống: mở ngay):** Đặt thời điểm chính xác cho phép học sinh bắt đầu vào làm bài.
   - **Giờ đóng (để trống: không hạn):** Đặt hạn chót khóa đợt thi. Học sinh vào sau giờ đóng sẽ bị từ chối; học sinh đang làm dở vẫn được nộp bài theo thời gian quy định của lượt. Giờ tính theo múi giờ trên máy tính của Thầy/Cô.
   - **Số lượt làm (1-10):** Đặt số lần tối đa mỗi học sinh được phép làm lại (mặc định phòng thi là 1, bài tập về nhà là 3).
   - **Mã vào bài (4-12 chữ/số, tùy chọn):** Đặt mật mã bảo vệ phòng thi (hệ thống tự động chuyển chữ hoa). Học sinh phải nhập đúng mã này mới được làm bài.
   - **Trộn thứ tự câu hỏi cho mỗi học sinh:** Tích chọn để mỗi học sinh nhận một thứ tự câu hỏi xáo trộn ngẫu nhiên.
   - **Trộn thứ tự đáp án A/B/C/D:** Tích chọn để đảo vị trí các phương án trắc nghiệm cho từng em.
   - **Yêu cầu PIN của học sinh (chỉ khi giao cho một lớp):** Bắt buộc học sinh nhập mã PIN cá nhân do giáo viên cấp (chỉ áp dụng khi giao cho một lớp cụ thể).
4. Bấm **"Giao Bài & Tạo Phòng Thi Ngay"**:
   - Hệ thống tạo ra một liên kết phòng thi (dạng `.../a/[publicId]`).
   - Thầy/Cô bấm **"Sao chép"** gửi vào nhóm lớp.
   - **Học sinh không cần tài khoản**, chỉ cần bấm link, điền họ tên (và mã vào bài nếu có) là bắt đầu làm bài ngay.
   - **Bảo vệ bài làm tuyệt đối:** Trong lúc học sinh làm bài, hệ thống tự động lưu nháp từng câu trả lời. Nếu học sinh vô tình lỡ tay đóng tab, bấm F5 hoặc mất kết nối mạng, khi mở lại link bài làm vẫn còn nguyên vẹn.

---

## 7. Theo dõi bài giao, Chấm bài tự luận & Xuất bảng điểm Excel

1. **Xem trang theo dõi bài giao (`/teacher/assignments/[id]`):**
   - Tại trang chính, Thầy/Cô bấm vào mục **"Bài đã giao"**, chọn đợt thi vừa tổ chức (`src/app/teacher/assignments/[id]/page.tsx`).
   - **Dòng thông tin thời gian & quy định (`src/app/teacher/assignments/[id]/page.tsx:506-508`):**
     Ngay dưới tên bài giao, hệ thống hiển thị rõ ràng:
     `Mở: [thời gian] · Đóng: [thời gian] · Số lượt: [số lượt] · Mã vào bài: [mã] (giờ theo máy này)`
   - **Huy hiệu trạng thái & Điều khiển phòng thi (`src/app/teacher/assignments/[id]/page.tsx:497, 544-560`):**
     * Hiển thị huy hiệu **"Đang Mở"** (màu xanh lá) hoặc **"Đã Đóng"** (màu xám).
     * Thầy/Cô có thể bấm nút **"Đóng bài thi"** hoặc **"Mở lại bài thi"** bất kỳ lúc nào để chủ động khóa hoặc mở quyền làm bài cho học sinh.
2. **Chấm bài tự luận:**
   - Các câu hỏi trắc nghiệm khách quan (Phần I, Đúng/Sai, Trả lời ngắn, Điền khuyết, Ghép nối, Sắp xếp) được hệ thống tự động chấm điểm chính xác 100%.
   - Với các câu hỏi tự luận, Thầy/Cô bấm vào tên từng học sinh để mở bài làm, xem nội dung trình bày, cho điểm theo từng tiêu chí (barem) và ghi lời nhận xét, sau đó bấm nút **"Lưu điểm và nhận xét"**.
   - Điểm tổng kết của học sinh sẽ tự động cập nhật ngay lập tức.
3. **Xuất bảng điểm ra Excel (CSV):**
   - Tại đầu trang quản lý bài giao, Thầy/Cô bấm nút **"Xuất Excel (CSV)"** (`src/app/teacher/assignments/[id]/page.tsx:539`).
   - Bảng điểm lớp học sẽ được tải về máy tính với đầy đủ các cột: Họ tên, điểm trắc nghiệm, điểm tự luận, điểm tổng kết, thời gian nộp, mở xem trực tiếp trên Microsoft Excel.

---

## 8. Mẹo an toàn cho Thầy/Cô khi làm việc

- **Khi soạn thảo đề dài:** Hãy thỉnh thoảng bấm nút **"Lưu đề"** để dữ liệu được đồng bộ lên máy chủ.
- **Nếu mở cùng một đề trên hai máy tính hoặc hai tab:** Nếu một tab vừa lưu dữ liệu mới hơn, tab còn lại sẽ hiện thông báo nhắc nhở nhẹ nhàng kèm lựa chọn *"Lưu bản nháp thành đề mới"* để Thầy/Cô không bao giờ bị mất công sức đã soạn.
- **Tải bản sao lưu đề thi:** Ở thanh công cụ bên trái, mục **"Sao lưu · Nhập kho cũ"** cho phép Thầy/Cô tải tệp bản sao lưu toàn bộ đề thi về lưu trữ riêng trên máy tính bất kỳ lúc nào.

---
*Tài liệu bàn giao mục `GEM-P10` (cập nhật từ `GEM-P2`) thuộc nhiệm vụ `GEMINI-PILOT-PREP` (Generation 7).*
