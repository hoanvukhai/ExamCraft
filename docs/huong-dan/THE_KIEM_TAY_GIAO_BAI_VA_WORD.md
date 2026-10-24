# BỘ THẺ KIỂM THỬ THỦ CÔNG CHUYÊN BIỆT: TỆP WORD, IN ẤN & OFFLINE / ĐA TRÌNH DUYỆT
*Dành cho Chủ dự án và Giáo viên Thử nghiệm — Hệ thống ExamCraft*
*Giải quyết các khoảng cách trực quan chưa tự động hóa được (Khoảng cách C và K trong [PILOT_GAP_ANALYSIS.md](../../qa/rebuild-2026-10-24/PILOT_GAP_ANALYSIS.md))*

- **Người thực hiện:** Gemini (QA / Tài liệu kiểm thử)
- **Nhiệm vụ:** `GEM-P8` thuộc `GEMINI-PILOT-PREP` (Generation 6, [ASSIGNMENTS.json](../../qa/ai-review/coordination/ASSIGNMENTS.json))
- **Mục tiêu:** Cung cấp quy trình chi tiết từng bước cho người thật thực hiện kiểm chứng hai nhóm tính năng nhạy cảm không thể thay thế bằng script tự động:
  1. **Khoảng cách C:** Trực quan tệp Word (.docx) mở trong Microsoft Office thật và bố cục ngắt trang bản in A4 nhiều trang.
  2. **Khoảng cách K:** Hành vi ứng phó sự cố rớt mạng thật (Offline) của học sinh và kiểm thử tương tranh giữa 2 trình duyệt độc lập.

---

## MỤC LỤC CÁC THẺ KIỂM THỬ CHUYÊN BIỆT

| Mã thẻ | Tên kịch bản kiểm thử | Trọng tâm kiểm chứng | Người thực hiện |
|---|---|---|---|
| [THẺ C1](#thẻ-c1-kiểm-tra-trực-quan-tệp-word-docx-mở-trong-microsoft-word) | Kiểm tra tệp Word (.docx) trong Microsoft Word | Bảng tiêu đề, công thức toán OMML native, hình ảnh minh họa, bảng đáp án | Chủ dự án / Giáo viên |
| [THẺ C2](#thẻ-c2-kiểm-tra-trực-quan-bản-in-a4-nhiều-trang-print-preview) | Kiểm tra trực quan bản in A4 nhiều trang | Bố cục in ấn, ngắt trang tránh xé rách câu hỏi (`break-inside: avoid`), lề giấy | Chủ dự án / Giáo viên |
| [THẺ K1](#thẻ-k1-kiểm-thử-học-sinh-mất-kết-nối-mạng-offline-và-phục-hồi) | Thử nghiệm ngắt kết nối mạng thật (Offline) | Tự động lưu Local Journal, không văng app, đồng bộ lại khi có mạng, nút nộp lại | Chủ dự án / Kỹ thuật viên |
| [THẺ K2](#thẻ-k2-kiểm-thử-đối-kháng-tương-tranh-trên-hai-trình-duyệt-độc-lập) | Thử nghiệm tương tranh trên hai trình duyệt độc lập | Chống ghi đè CAS đa phiên, bảo toàn dữ liệu đồng tác giả, thông báo xung đột | Chủ dự án / Kỹ thuật viên |

---

### THẺ C1: Kiểm tra trực quan tệp Word (.docx) mở trong Microsoft Word
- **Mã kịch bản:** `TC-VISUAL-C1`
- **Mã CV đối chiếu:** `CV008` (Xuất file Word docx kèm công thức MathML/OMML), `CV043` (Xuất theo chế độ xem), `CV044` (Tiêu đề trường thi tùy biến).
- **Môi trường yêu cầu:**
  * Máy tính cá nhân chạy Windows 10/11 có cài đặt Microsoft Word (bản 2016, 2019, 2021 hoặc Microsoft 365) hoặc LibreOffice Writer (phiên bản $\ge 7.0$).
  * Đề thi mẫu đã soạn từ Thẻ F2 hoặc nạp từ fixture `tests/fixtures/pilot/toan6-bay-dang.json` (có công thức toán phân số/lũy thừa, hình vẽ, và câu tự luận).

#### Trình tự thao tác từng bước:
1. Mở đề thi trên trình duyệt, chuyển sang tab xem trước A4:
   - Thử xuất ở chế độ **"Đề thi in ấn"**: Bấm nút **"Tải Word (.docx)"** trên thanh Header.
   - Thử xuất ở chế độ **"Bảng đáp án & Barem"**: Chọn chế độ xem này rồi bấm xuất Word.
2. Tìm tệp tin `.docx` vừa tải về trong thư mục `Downloads`.
3. Nhấp đúp chuột để mở tệp tin trực tiếp bằng phần mềm Microsoft Word.
4. Nếu Microsoft Word hiển thị thanh màu vàng *"Protected View / Chế độ xem được bảo vệ"*, bấm nút **"Enable Editing / Cho phép chỉnh sửa"**.
5. **Kiểm tra trực quan 4 yếu tố cốt lõi:**
   - **Yếu tố 1 — Tiêu đề trường thi:** Bảng thông tin ở đầu trang gồm 2 cột (Cột trái: Sở GD&ĐT, Tên trường; Cột phải: Tên kỳ thi, Môn thi, Thời gian, Mã đề) có cân đối, thẳng hàng, không bị tràn dòng hay vỡ khung hay không.
   - **Yếu tố 2 — Công thức Toán học:** Nhấp chuột trực tiếp vào một công thức toán (ví dụ phân số hoặc căn bậc hai $A = 50 - [30 - (8-3)^2]$). Quan sát xem thanh ruy-băng của Word có tự động kích hoạt thẻ **"Equation / Công thức"** hay không.
     *(Đạt chuẩn: Công thức là đối tượng toán học native Office Math Markup Language (OMML), có thể gõ sửa chỉ số; không bị biến thành ảnh bitmap mờ hoặc chữ thô).*
   - **Yếu tố 3 — Hình ảnh minh họa (`figures`):** Kiểm tra hình vẽ mặt bằng khu vườn có hiển thị đúng tỷ lệ, sắc nét, có dòng chú thích (caption) nằm ngay dưới hình hay không.
   - **Yếu tố 4 — Bảng đáp án trắc nghiệm:** Bảng đáp án có viền nét đơn rõ ràng, các ô A, B, C, D được căn giữa đẹp mắt.

#### Kết quả mong đợi cần đạt:
- Tệp Word mở ra ngay lập tức, không có cảnh báo tệp bị lỗi cấu trúc (*"Word found unreadable content..."*).
- Font chữ hiển thị đồng nhất (thường là Times New Roman hoặc Arial), cỡ chữ chuẩn 12–13pt.
- In thử 01 bản ra máy in giấy hoặc máy in ảo PDF: Bố cục trên trang in sắc nét.

#### Nơi ghi kết quả và bằng chứng cần thu thập:
- Ghi kết quả vào báo cáo: `qa/rebuild-2026-10-24/PILOT_MANUAL_EVIDENCE.md`.
- **Ảnh chụp bằng chứng:** Chụp toàn màn hình Microsoft Word hiển thị rõ công thức toán đang được click chọn (thấy rõ khung Equation) và hình vẽ minh họa.

---

### THẺ C2: Kiểm tra trực quan bản in A4 nhiều trang (Print Preview)
- **Mã kịch bản:** `TC-VISUAL-C2`
- **Mã CV đối chiếu:** `CV007` (Cấu trúc đề in ấn), `CV027` (A4Preview print styles).
- **Môi trường yêu cầu:** Trình duyệt Google Chrome hoặc Microsoft Edge trên máy tính có màn hình độ phân giải chuẩn. Đề thi có độ dài từ 8 đến 12 câu hỏi (đủ dài để trải rộng trên 2 đến 3 trang giấy A4).

#### Trình tự thao tác từng bước:
1. Trong màn hình soạn thảo đề thi, bấm nút **"In / PDF"** trên thanh Header (hoặc nhấn tổ hợp phím `Ctrl + P`).
2. Hộp thoại in của trình duyệt hiện ra:
   - **Destination (Đích đến):** Chọn `Save as PDF` (Lưu dưới dạng PDF).
   - **Pages (Trang):** Chọn `All` (Tất cả).
   - **Layout (Bố cục):** Chọn `Portrait` (Khổ dọc).
   - **Paper size (Khổ giấy):** Chọn `A4`.
   - **Margins (Lề):** Chọn `Default` (Mặc định).
   - **Options:** Tích chọn `Background graphics` (Đồ họa nền) để hiển thị đầy đủ viền bảng và màu nền nhẹ.
3. Cuộn xem trước từng trang in từ Trang 1 đến Trang cuối:
   - **Kiểm tra giáp ranh ngắt trang:** Quan sát vị trí tiếp giáp giữa chân trang 1 và đầu trang 2. Kiểm tra xem có câu hỏi nào bị "cắt đôi" (nửa câu hỏi ở trang 1, 4 phương án lựa chọn bị đẩy sang trang 2) hay không.
   - Nhờ luật CSS in ấn `page-break-inside: avoid` (hoặc `break-inside: avoid`), toàn bộ một khối câu hỏi phải được giữ nguyên vẹn trên cùng một trang giấy, hoặc tự động đẩy trọn vẹn sang trang tiếp theo nếu không đủ chỗ.
   - **Kiểm tra chân trang:** Kiểm tra dòng phân cách kết thúc đề thi (*"--- HẾT ---"* và *"Cán bộ coi thi không giải thích gì thêm"*).
4. Bấm nút **"Save"** (Lưu) để xuất tệp ra máy tính dưới tên: `Ban_In_Thu_Nghiem_A4.pdf`.
5. Mở tệp PDF bằng trình đọc Adobe Acrobat Reader hoặc chính trình duyệt để kiểm tra lần cuối.

#### Kết quả mong đợi cần đạt:
- Đề thi bố trí gọn gàng, tiết kiệm giấy in nhưng không bị sít chữ.
- Không có hiện tượng chữ đè lên chữ hoặc mất nội dung ở mép trang giấy in.

#### Nơi ghi kết quả và bằng chứng cần thu thập:
- Lưu tệp `Ban_In_Thu_Nghiem_A4.pdf` vào thư mục lưu trữ bằng chứng kiểm thử.
- Ảnh chụp màn hình hộp thoại Print Preview tại vị trí ngắt trang giữa Trang 1 và Trang 2.

---

### THẺ K1: Kiểm thử học sinh mất kết nối mạng (Offline) và phục hồi
- **Mã kịch bản:** `TC-OFFLINE-K1`
- **Mã CV đối chiếu:** `CV056` (Bù trừ độ trễ mạng 15 giây), `CV057` (Local draft journal & Khôi phục), `CV058` (Trải nghiệm học sinh `/a/[publicId]`).
- **Môi trường yêu cầu:** 01 điện thoại thông minh hoặc máy tính xách tay của học sinh truy cập vào phòng thi qua Wi-Fi hoặc mạng LAN. Đợt thi đã được mở từ Thẻ F5.

#### Trình tự thao tác từng bước:
1. Học sinh truy cập vào phòng thi `/a/[publicId]`, nhập tên `Lê Thử Nghiệm Offline` và bấm **"Bắt đầu làm bài"**.
2. Trả lời Câu 1 và Câu 2. Quan sát thanh trạng thái ở trên hiện `Lưu nháp <giờ:phút:giây>`.
3. **Thao tác ngắt mạng thật:**
   - Tắt kết nối Wi-Fi trên máy học sinh (hoặc rút dây mạng LAN, hoặc trên máy tính mở DevTools F12 -> tab `Network` -> chuyển dropdown `No throttling` thành `Offline`).
4. **Tiếp tục làm bài khi không có mạng:**
   - Trả lời tiếp Câu 3 (gõ đáp số vào ô trả lời ngắn).
   - Trả lời Câu 4 (gõ nội dung câu tự luận).
   - Tích chọn Câu 5 (câu đúng/sai).
5. **Quan sát phản ứng của giao diện:**
   - Kiểm màn hình vẫn hoạt động, không trắng trang; nếu lỗi thì ghi bước gây lỗi và giữ bản nháp để đối chiếu.
   - Thanh trạng thái nháp ghi nhận lỗi kết nối nhưng cơ chế `Local Journal` vẫn âm thầm lưu toàn bộ câu trả lời vào bộ nhớ cục bộ của trình duyệt (IndexedDB / LocalStorage).
6. **Thử nghiệm tải lại trang khi đang mất mạng:**
   - Học sinh lỡ tay bấm phím `F5` hoặc đóng tab mở lại khi chưa có mạng: Màn hình hiển thị thông báo nhẹ nhàng và bản nháp từ Local Journal được nạp lại đầy đủ, không mất một chữ nào.
7. **Bật lại kết nối mạng:**
   - Bật lại Wi-Fi (hoặc bỏ chọn Offline trong F12).
   - Chờ trong vòng 3 đến 5 giây: Cơ chế nền của ExamCraft tự động gửi gói đồng bộ nháp bù trừ lên máy chủ.
   - Đèn trạng thái chuyển từ cảnh báo sang màu xanh: `Lưu nháp <giờ mới>`.
8. Bấm nút **"Nộp bài thi"** -> Xác nhận nộp bài.

#### Kết quả mong đợi cần đạt:
- Bài thi được gửi trọn vẹn lên máy chủ cơ sở dữ liệu.
- Số điểm chấm trắc nghiệm tính đúng cả những câu học sinh đã tích chọn trong thời gian rớt mạng.
- Nếu mạng chập chờn đúng thời điểm hết giờ làm bài: Khoảng thời gian bù trừ `SUBMIT_GRACE_MS` (15 giây) của máy chủ cho phép nhận bài nộp muộn do nghẽn mạng mà không đánh trượt học sinh.

#### Nơi ghi kết quả và bằng chứng cần thu thập:
- Ghi nhận vào biên bản kiểm thử sự cố mạng.
- **Ảnh chụp bằng chứng:** Ảnh chụp màn hình khi đang ở trạng thái mất kết nối mạng và ảnh chụp màn hình sau khi mạng phục hồi thành công.

---

### THẺ K2: Kiểm thử đối kháng tương tranh trên hai trình duyệt độc lập
- **Mã kịch bản:** `TC-CONCURRENCY-K2`
- **Mã CV đối chiếu:** `CV049` (Chống ghi đè phiên bản CAS đa tab), `CV050` (Kiểm soát quyền truy cập tức thì), `CV031` (Đồng tác giả cùng sửa).
- **Môi trường yêu cầu:** Mở **2 trình duyệt web độc lập hoàn toàn** (ví dụ: Google Chrome và Microsoft Edge; không dùng 2 tab của cùng một trình duyệt để tránh dùng chung bộ nhớ đệm session).
  - Trình duyệt 1 (Chrome): Đăng nhập tài khoản Giáo viên A (Chủ đề thi).
  - Trình duyệt 2 (Edge): Đăng nhập tài khoản Giáo viên B (Được cấp quyền `EDITOR` cùng sửa đề).

#### Trình tự thao tác từng bước:
1. Giáo viên A tạo đề thi: `Đề Toán 6 - Kiểm thử tương tranh hai trình duyệt`.
2. Giáo viên A mở bảng "Cùng soạn · Góp ý · Lịch sử", cấp quyền `EDITOR` cho tài khoản Giáo viên B.
3. Trên Trình duyệt 2 (Edge), Giáo viên B vào kho đề, mở đề thi này ra soạn thảo.
   - Lúc này cả hai trình duyệt đều đang mở cùng một đề thi ở trạng thái phiên bản xuất phát (ví dụ: `version = 1`).
4. **Giáo viên A lưu thay đổi trước:**
   - Trên Chrome, Giáo viên A chỉnh sửa nội dung Câu 1 thành: `[Bản sửa bởi GV A] Tìm số nguyên...`.
   - Bấm nút **"Lưu đề"**.
   - Quan sát Chrome lưu thành công và phiên bản đề trên máy chủ tăng lên `version = 2`.
5. **Giáo viên B lưu thay đổi sau (Xung đột tương tranh):**
   - Trên Edge, Giáo viên B **không tải lại trang** (vẫn đang giữ bản nạp từ `version = 1`).
   - Giáo viên B chỉnh sửa nội dung Câu 2 thành: `[Bản sửa bởi GV B] Cho tập hợp...`.
   - Giáo viên B bấm nút **"Lưu đề"**.
6. **Quan sát phản ứng của hệ thống trên Trình duyệt 2 (Edge):**
   - Hệ thống phát hiện xung đột phiên bản qua cơ chế CAS (`version` gửi lên là `1`, trong khi máy chủ đã là `2`).
   - Yêu cầu bị từ chối an toàn với mã HTTP 409 Conflict.
   - Giao diện Edge hiển thị hộp thoại / thông báo bảo vệ dữ liệu:
     * Cảnh báo rõ ràng: *"Đề thi đã được chỉnh sửa ở phiên làm việc khác. Bản nháp hiện tại của bạn đã được giữ lại; vui lòng đối chiếu trước khi lưu tiếp."*
     * Cung cấp các nút hành động cứu hộ: **"Lưu bản nháp thành đề mới"** hoặc **"Mở bản máy chủ, giữ riêng nháp"**.
   - **Tuyệt đối không:** Hệ thống không được âm thầm ghi đè làm mất đi nội dung Câu 1 mà Giáo viên A vừa lưu ở bước 4.

#### Kết quả mong đợi cần đạt:
- Đối chiếu dữ liệu Giáo viên A với bản trước thử: không bị ghi đè hoặc xóa.
- Công sức chỉnh sửa Câu 2 của Giáo viên B không bị mất; Giáo viên B bấm "Lưu bản nháp thành đề mới" để tách riêng thành một đề mới mang trọn vẹn phần chỉnh sửa của mình.

#### Nơi ghi kết quả và bằng chứng cần thu thập:
- Ghi nhận nhật ký đối kháng phiên bản vào báo cáo kiểm thử.
- **Ảnh chụp bằng chứng:** Ảnh chụp màn hình Edge hiển thị thông báo xung đột phiên bản và các nút lựa chọn cứu hộ bản nháp.

---
*Tài liệu thuộc bộ hướng dẫn kiểm thử pilot hệ thống ExamCraft, nhiệm vụ `GEM-P8` (Generation 6).*
