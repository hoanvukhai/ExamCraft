# DANH SÁCH CÁC CA KIỂM THỬ TẬP TRUNG (GEMINI TEST CASES)

- **Người lập:** Gemini (QA Tài liệu / UX)
- **Tập trung kiểm thử:** Các trường hợp biên (0/false/rỗng), đổi tài khoản, lỗi mạng, đồng thời hai tab, chặn ghi đè và tính toàn vẹn dữ liệu.
- **Phạm vi mã CV:** CV048, CV057, CV058, CV060, CV061, CV077.
- **Lưu ý:** Chỉ định nghĩa ca kiểm thử phục vụ nghiệm thu; không tự động chạy các ca có ghi dữ liệu vào cơ sở dữ liệu chính.

---

### TC-01: Tải tệp Word từ trang chia sẻ đề thi công khai
- **Mã CV:** CV057 (Luồng chia sẻ đề thi)
- **Mức độ:** **Critical** (Chặn tính năng chính)
- **Điều kiện tiền đề:**
  1. Giáo viên đã xuất bản một đề thi và lấy liên kết chia sẻ công khai dạng `/share/[id]`.
  2. Người dùng mở liên kết trên trình duyệt không đăng nhập tài khoản.
- **Các bước thực hiện:**
  1. Truy cập đường dẫn `/share/[id]`.
  2. Chờ trang tải hoàn tất bản xem trước A4 của đề thi.
  3. Bấm vào nút `"Tải file Word (.docx)"` trên thanh công cụ phía trên.
- **Kết quả mong đợi:**
  - Trình duyệt tải ngay về tệp tin có đuôi `.docx` chứa tiêu đề đề thi. Tệp Word mở được bình thường trên Microsoft Word hoặc LibreOffice.
- **Dấu hiệu lỗi:**
  - Bấm nút nhưng hoàn toàn không có file tải về, không có thông báo lỗi, không có phản ứng trên giao diện (lỗi `Promise<Blob>` bị bỏ quên tại `src/app/share/[id]/page.tsx:155`).

---

### TC-02: Thao tác nút "Làm bài Online" từ trang xem đề chia sẻ
- **Mã CV:** CV057 / CV058 (Chia sẻ đề & Vào thi)
- **Mức độ:** **Major** (Cụt luồng người dùng)
- **Điều kiện tiền đề:**
  1. Có một đề thi được chia sẻ công khai tại `/share/[id]`.
- **Các bước thực hiện:**
  1. Mở trang `/share/[id]`.
  2. Bấm vào nút màu xanh `"Làm bài Online"`.
- **Kết quả mong đợi:**
  - Nếu đề chưa được giao thành bài tập có mã `/a/[publicId]`, hệ thống cần hiển thị thông báo hướng dẫn rõ ràng: *"Đề này đang ở chế độ xem mẫu. Vui lòng liên hệ giáo viên để nhận liên kết làm bài thi chính thức dạng /a/..."*. Không dẫn người dùng vào ngõ cụt.
- **Dấu hiệu lỗi:**
  - Trình duyệt mở ra trang `/test/[id]` với thông báo cảnh báo "Đường dẫn thi cũ không còn được hỗ trợ" và chỉ có nút "Về Trang Chủ".

---

### TC-03: Nhập điểm 0 và điểm số lẻ thập phân khi chấm thi
- **Mã CV:** CV060 (Chấm bài & điều chỉnh điểm)
- **Mức độ:** **Major** (Rủi ro tính sai điểm)
- **Điều kiện tiền đề:**
  1. Giáo viên mở màn hình quản lý đợt giao đề `/teacher/assignments/[id]`.
  2. Mở chi tiết một bài làm học sinh đã nộp. Câu hỏi đang có điểm hiện tại là `1.0`.
- **Các bước thực hiện:**
  1. Nhấp chuột vào ô nhập điểm của Câu 1, xóa giá trị `1.0` và gõ số `0` (hoặc `0.0`).
  2. Click chuột ra ngoài (blur).
  3. Mở tiếp Câu 2, nhập điểm lẻ `0.25` hoặc `0.75` rồi blur.
  4. Đóng modal xem bài, sau đó mở lại bài của học sinh đó.
- **Kết quả mong đợi:**
  - Điểm `0` và `0.25` được hệ thống lưu thành công vào cơ sở dữ liệu.
  - Tổng điểm bài thi được tính lại chính xác theo điểm mới.
  - Lịch sử chấm ghi nhận biến động điểm: `1.0 → 0 điểm` và `0 → 0.25 điểm`.
- **Dấu hiệu lỗi:**
  - Giá trị `0` bị coi là rỗng (falsy) dẫn đến việc hệ thống không gửi request lưu điểm, hoặc khi mở lại bài điểm bị nhảy về điểm cũ trước khi chấm.

---

### TC-04: Xóa rỗng ô điểm hoặc nhập ký tự phi số
- **Mã CV:** CV060 (Chấm bài & kiểm soát dữ liệu đầu vào)
- **Mức độ:** **Minor** (Trải nghiệm người dùng)
- **Điều kiện tiền đề:**
  1. Giáo viên đang mở modal chi tiết bài làm học sinh với câu hỏi có điểm `0.5`.
- **Các bước thực hiện:**
  1. Xóa toàn bộ ký tự trong ô điểm, để ô trống hoàn toàn (`""`).
  2. Click chuột ra ngoài để kích hoạt sự kiện `onBlur`.
  3. Thử gõ ký tự chữ hoặc dấu đặc biệt (ví dụ: `abc`, `NaN`, `---`).
- **Kết quả mong đợi:**
  - Ô điểm tự động khôi phục về điểm hợp lệ trước đó (`0.5`), không gửi request lưu điểm rác lên máy chủ.
- **Dấu hiệu lỗi:**
  - Giao diện gửi request với giá trị `NaN` hoặc `null` lên server; server trả lỗi 400 làm xuất hiện dải banner đỏ báo lỗi nhưng ô điểm vẫn bị trống, gây bối rối cho giáo viên.

---

### TC-05: Nhập điểm âm hoặc điểm vượt quá thang điểm câu hỏi
- **Mã CV:** CV060 (Kiểm soát giới hạn điểm)
- **Mức độ:** **Major** (Dữ liệu không toàn vẹn)
- **Điều kiện tiền đề:**
  1. Câu hỏi số 1 có thang điểm tối đa là `1.0` điểm.
- **Các bước thực hiện:**
  1. Giáo viên nhập điểm âm: `-0.5` rồi blur.
  2. Giáo viên nhập điểm vượt trần: `1.5` hoặc `10` rồi blur.
- **Kết quả mong đợi:**
  - Giao diện có thuộc tính `min="0"` và `max="1.0"`, ngăn không cho nhập hoặc khi blur lập tức thông báo lỗi nội bộ tại ô nhập và khôi phục giá trị cũ.
- **Dấu hiệu lỗi:**
  - Ô input cho phép nhập tự do. Khi blur, server trả về `400 Điểm không hợp lệ: phải từ 0 đến 1`, nhưng ô input vẫn lưu giữ số `-0.5` hoặc `10` trên màn hình, khiến giáo viên tưởng điểm đã được ghi nhận.

---

### TC-06: Chấm điểm bài làm kèm lời phê / nhận xét của giáo viên
- **Mã CV:** CV060 (Nhận xét bài làm)
- **Mức độ:** **Major** (Thiếu tính năng sư phạm)
- **Điều kiện tiền đề:**
  1. Giáo viên chấm bài tự luận hoặc câu trả lời ngắn cho học sinh.
- **Các bước thực hiện:**
  1. Mở modal chi tiết bài làm của học sinh.
  2. Tìm khu vực nhập nhận xét hoặc lời phê cho từng câu hỏi.
  3. Nhập lời phê: *"Em cần trình bày rõ các bước biến đổi trung gian."*
  4. Lưu điểm.
- **Kết quả mong đợi:**
  - Có ô nhập nhận xét bên cạnh hoặc dưới ô điểm. Nhận xét được lưu vào cơ sở dữ liệu và hiển thị trong lịch sử chấm: `Nhận xét mới: Em cần trình bày rõ các bước biến đổi trung gian.`
- **Dấu hiệu lỗi:**
  - Hoàn toàn không tìm thấy ô nhập nhận xét nào trên giao diện modal chấm bài (lỗi thiếu component tại `src/app/teacher/assignments/[id]/page.tsx`).

---

### TC-07: Thao tác tải trang lịch sử chấm cũ hơn (Phân trang Cursor)
- **Mã CV:** CV061 (Phân trang lịch sử chấm)
- **Mức độ:** **Minor** (Kiểm tra độ trễ & ổn định UI)
- **Điều kiện tiền đề:**
  1. Bài làm có trên 60 lần điều chỉnh điểm (được tạo qua audit log).
  2. Giáo viên mở chi tiết bài làm. Danh sách ban đầu hiển thị 50 mục kèm nút `"Xem lịch sử cũ hơn"`.
- **Các bước thực hiện:**
  1. Mở rộng phần `Lịch sử chấm`.
  2. Bấm nút `"Xem lịch sử cũ hơn"`.
  3. Bấm liên tiếp 2 lần (double-click) khi mạng đang phản hồi chậm.
- **Kết quả mong đợi:**
  - Nút chuyển sang trạng thái disabled hiển thị `"Đang tải..."`.
  - Khi hoàn tất, danh sách lịch sử nối tiếp thêm các mục cũ hơn mà không làm nhảy vị trí cuộn chuột, không làm trùng lặp các mục đã có.
  - Sau khi nạp hết, nút xem thêm biến mất.
- **Dấu hiệu lỗi:**
  - Bấm liên tiếp gửi 2 request song song làm trùng lặp danh sách mục lịch sử, hoặc làm mất đi các câu hỏi đang chấm ở phía trên.

---

### TC-08: Thăm dò lịch sử chấm với Cursor giả mạo trên bài làm không thuộc sở hữu
- **Mã CV:** CV061 (Bảo mật phân quyền API)
- **Mức độ:** **Critical** (Lỗ hổng dò đoán dữ liệu / IDOR probe)
- **Điều kiện tiền đề:**
  1. Giáo viên A sở hữu bài làm ID `attempt_A`.
  2. Giáo viên B sở hữu bài làm ID `attempt_B`.
- **Các bước thực hiện:**
  1. Đăng nhập bằng tài khoản Giáo viên A.
  2. Gửi request: `GET /api/teacher/attempts/attempt_B?historyCursor=malformed_or_fake_cursor`.
- **Kết quả mong đợi:**
  - Server phải trả về `404 Không tìm thấy bài làm` (nguyên tắc từ chối truy cập không tiết lộ sự tồn tại của tài nguyên).
- **Dấu hiệu lỗi:**
  - Server trả về `400 HISTORY_CURSOR_INVALID` (do decode cursor trước khi kiểm tra quyền sở hữu bài làm, để lộ cho Giáo viên A biết `attempt_B` là có tồn tại).

---

### TC-09: Học sinh mở cùng lúc 2 tab làm bài và xung đột phiên bản nháp
- **Mã CV:** CV077 / CV048 (Phát hiện xung đột & Chặn ghi đè)
- **Mức độ:** **Critical** (Toàn vẹn bài làm học sinh)
- **Điều kiện tiền đề:**
  1. Học sinh bắt đầu làm bài thi tại `/a/[publicId]`.
- **Các bước thực hiện:**
  1. Mở Tab 1, chọn đáp án A cho Câu 1. Chờ hệ thống tự động lưu nháp ("Đã lưu lúc...").
  2. Mở Tab 2 cùng liên kết bài thi đó, chọn đáp án B cho Câu 1. Chờ Tab 2 lưu nháp thành công.
  3. Quay lại Tab 1, chọn tiếp đáp án C cho Câu 2.
- **Kết quả mong đợi:**
  - Tab 1 gửi nháp lên server bị từ chối với mã lỗi `409 DRAFT_CONFLICT` (do phiên bản nháp tại Tab 1 đã cũ hơn máy chủ).
  - Tab 1 hiển thị cảnh báo rõ ràng cho học sinh biết nháp đã thay đổi ở trang khác, không âm thầm ghi đè làm mất đáp án ở Tab 2.
- **Dấu hiệu lỗi:**
  - Tab 1 ghi đè thành công lên Tab 2 làm mất đáp án của Tab 2 (mất tính toàn vẹn), hoặc Tab 1 bị đơ không thông báo gì cho học sinh.

---

### TC-10: Cố gắng nộp bài khi đang có cảnh báo xung đột nháp
- **Mã CV:** CV077 (Quy trình nộp bài khi có xung đột)
- **Mức độ:** **Major** (Trải nghiệm học sinh bị bế tắc)
- **Điều kiện tiền đề:**
  1. Tab của học sinh đang ở trạng thái xung đột nháp (cờ `draftConflictRef.current = true`).
- **Các bước thực hiện:**
  1. Học sinh bấm nút `"Nộp bài"`.
  2. Trong modal xác nhận nộp, bấm `"Nộp bài ngay"`.
- **Kết quả mong đợi:**
  - Giao diện giải thích rõ: *"Bài làm của em đang có sự khác biệt giữa hai lần mở. Vui lòng kiểm tra lại đáp án hoặc bấm xác nhận để nộp bản hiện tại này."* Có lối thoát rõ ràng cho học sinh.
- **Dấu hiệu lỗi:**
  - Xuất hiện popup `alert()` ngắn ngủi, sau đó modal tự đóng lại. Học sinh tiếp tục bấm "Nộp bài" thì nút bấm hoàn toàn không phản ứng gì nữa, khiến học sinh tưởng trang web bị hỏng và không thể nộp bài.

---

### TC-11: Hiển thị trạng thái lưu nháp trên thiết bị di động khi mất mạng
- **Mã CV:** CV048 (UX di động & Ngoại tuyến)
- **Mức độ:** **Major** (Rủi ro mất dữ liệu trên di động)
- **Điều kiện tiền đề:**
  1. Sử dụng điện thoại di động (hoặc giả lập responsive chiều rộng màn hình 375px - 414px) vào phòng thi `/a/[publicId]`.
- **Các bước thực hiện:**
  1. Trả lời một câu hỏi bất kỳ. Quan sát thanh tiêu đề.
  2. Bật chế độ máy bay (ngắt toàn bộ Wi-Fi và 4G).
  3. Tiếp tục chọn câu trả lời cho các câu tiếp theo.
- **Kết quả mong đợi:**
  - Trên màn hình điện thoại phải thấy rõ trạng thái: `"Đang lưu..."` hoặc biểu tượng cảnh báo màu đỏ `"Mất kết nối mạng - Câu trả lời tạm lưu trên máy này"`.
- **Dấu hiệu lỗi:**
  - Toàn bộ dòng trạng thái lưu nháp bị biến mất do lớp CSS `hidden md:flex`. Học sinh hoàn toàn không biết mạng đã đứt và tưởng đáp án vẫn đang được gửi lên máy chủ.

---

### TC-12: Hết giờ làm bài trong khi đường truyền mạng bị gián đoạn
- **Mã CV:** CV058 / CV077 (Tự động nộp khi hết giờ)
- **Mức độ:** **Critical** (Mất bài thi học sinh)
- **Điều kiện tiền đề:**
  1. Học sinh đang làm bài thi, thời gian đếm ngược còn 10 giây.
- **Các bước thực hiện:**
  1. Ngắt kết nối mạng tại giây thứ 5.
  2. Để đồng hồ đếm ngược về `00:00`.
- **Kết quả mong đợi:**
  - Hệ thống tự kích hoạt nộp bài tự động (`handleFinalSubmit(true)`). Khi mạng lỗi, hệ thống không làm mất đáp án đang lưu trong Local Journal, hiển thị nút *"Thử nộp lại khi có mạng"* và nút *"Tải tệp bài làm khẩn cấp"* để đối chiếu với giáo viên.
- **Dấu hiệu lỗi:**
  - Xuất hiện `alert('Không thể kết nối đến máy chủ...')`, toàn bộ màn hình bị khóa bởi `inert` do hết giờ, học sinh không thể thử nộp lại cũng không thể tải bản câu trả lời về máy.

---

### TC-13: Quy trình khôi phục đáp án từ tệp nháp JSON dự phòng
- **Mã CV:** CV048 (Khôi phục dữ liệu bài làm)
- **Mức độ:** **Major** (Tính khép kín của luồng phục hồi)
- **Điều kiện tiền đề:**
  1. Học sinh gặp lỗi xung đột nháp và đã tải về tệp tin `examcraft-bai-lam-${attemptId}.json`.
  2. Trình duyệt bị tắt hoặc khởi động lại máy.
- **Các bước thực hiện:**
  1. Học sinh mở lại đường dẫn bài thi `/a/[publicId]`.
  2. Tìm kiếm tính năng khôi phục hoặc nhập lại bài làm từ tệp đã tải về.
- **Kết quả mong đợi:**
  - Giao diện có mục: *"Em có tệp nháp đã lưu trên máy? Bấm để khôi phục đáp án"*. Khi chọn tệp JSON, hệ thống nạp lại các câu đã tích vào màn hình để học sinh tiếp tục làm hoặc nộp bài.
- **Dấu hiệu lỗi:**
  - Không có bất kỳ giao diện nào để nạp tệp JSON. Tệp JSON tải về trở thành "rác", học sinh phải đánh lại đáp án từ đầu.
