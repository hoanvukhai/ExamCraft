# BỘ THẺ KIỂM THỬ THỦ CÔNG PILOT (MANUAL TEST CARDS F1–F8)
*Dành cho Chủ dự án và Giáo viên Thử nghiệm — Hệ thống ExamCraft*
*Căn cứ mã nguồn thực tế tại commit `rebuild/2026-10-local HEAD`*

- **Người thực hiện:** Gemini (QA & Tài liệu thử nghiệm)
- **Nhiệm vụ:** `GEM-P10` (Cập nhật và hoàn thiện từ `GEM-P1`, Generation 7, [ASSIGNMENTS.json](../../qa/ai-review/coordination/ASSIGNMENTS.json))
- **Mốc kế hoạch đối chiếu:** [docs/phoi-hop-ai/04_MOC_PILOT.md](../phoi-hop-ai/04_MOC_PILOT.md) và [qa/rebuild-2026-10-24/PILOT_E2E.md](../../qa/rebuild-2026-10-24/PILOT_E2E.md)
- **Thời điểm cập nhật (UTC):** 2026-10-24T16:55:00Z
- **Phạm vi:** 8 luồng kiểm thử thực tế từ F1 đến F8 phục vụ giai đoạn thử nghiệm có kiểm soát (Pilot), bổ sung chi tiết các tính năng mới đã tích hợp: Chế độ Song song A4, Tạo bản sao để sửa ở trang chia sẻ, Tùy chọn nâng cao khi giao bài và Dòng theo dõi thời gian/mã vào bài.

---

> [!IMPORTANT]
> **QUY TẮC AN TOÀN KHI THỰC HIỆN KIỂM THỬ PILOT:**
> 1. **Dữ liệu thử nghiệm:** Chỉ sử dụng dữ liệu giả định, tài khoản kiểm thử hoặc câu hỏi mẫu (gói minh họa Toán 6 hoặc môn phụ). Tuyệt đối không dùng dữ liệu học sinh thật có thông tin định danh nhạy cảm.
> 2. **Khóa AI là tùy chọn (Optional BYOK):** Mọi tính năng cốt lõi (soạn đề, lưu, xuất Word, in ấn, chia sẻ, giao bài, làm bài, chấm điểm, sao lưu) đều chạy hoàn toàn độc lập, không bắt buộc nhập khóa API. Khóa AI chỉ cần khi muốn gọi trợ lý Gemini tự động sinh đề.
> 3. **An toàn dữ liệu:** Chạy hoàn toàn trên máy chủ cục bộ (Local server / Staging). Thao tác sao lưu và khôi phục chỉ được phục hồi vào cơ sở dữ liệu mới (độc lập), không ghi đè lên database chính.

---

## DANH MỤC 8 THẺ KIỂM THỬ PILOT

| Mã thẻ | Luồng thử nghiệm | Mục tiêu chính |
|---|---|---|
| [THẺ F1](#thẻ-f1-đăng-nhập-đổi-mật-khẩu-khởi-tạo-và-truy-cập-kho-đề) | Đăng nhập & Đổi mật khẩu lần đầu | Xác thực tài khoản giáo viên, ép đổi mật khẩu khởi tạo, vào kho đề cá nhân |
| [THẺ F2](#thẻ-f2-tạo-đề-soạn-đủ-7-dạng-câu-hỏi-lưu-cas-và-mở-lại) | Soạn đề & Lưu trữ an toàn (CAS) | Soạn 7 dạng câu hỏi (hình/ngữ liệu/điểm 0), lưu đề, chống ghi đè đa tab, mở lại đúng nội dung |
| [THẺ F3](#thẻ-f3-chế-độ-xem-in-chế-độ-song-song-trộn-mã-đề-và-xuất-tệp-word-docx) | Xem trước in, Chế độ Song song, Trộn đề & Xuất Word | Chuyển chế độ Đề/Song song/Đáp án, trộn 2-8 mã đề, tải Word (.docx) công thức chuẩn và nhúng ảnh, in PDF |
| [THẺ F4](#thẻ-f4-chia-sẻ-liên-kết-tạo-bản-sao-để-sửa-mời-đồng-nghiệp-và-thu-hồi-quyền) | Chia sẻ, Tạo bản sao độc lập & Mời đồng nghiệp | Tạo link xem/tải Word, nút "Tạo bản sao để sửa" độc lập (bảo vệ đáp án), mời đồng nghiệp (Viewer/Commenter/Editor), thu hồi quyền tức thì |
| [THẺ F5](#thẻ-f5-giao-bài-thi-trực-tuyến-tùy-chọn-nâng-cao-và-theo-dõi-bài-giao) | Cấu hình phòng thi & Tùy chọn nâng cao | Cấu hình giờ mở/đóng, số lượt làm (1-10), mã vào bài (4-12 ký tự), trộn câu hỏi/đáp án, PIN lớp; theo dõi dòng Mở/Đóng/Mã tại trang quản lý |
| [THẺ F6](#thẻ-f6-học-sinh-làm-đủ-7-dạng-câu-tự-động-lưu-nháp-và-nộp-bài) | Học sinh làm bài & Bảo vệ nháp | Vào làm qua link (nhập mã nếu có), làm 7 dạng câu, tự động lưu nháp, F5 khôi phục, nộp bài, chống lộ đáp án trước hạn |
| [THẺ F7](#thẻ-f7-giáo-viên-chấm-bài-tự-luận-tổng-điểm-và-xuất-bảng-điểm-csv) | Chấm điểm tự luận & Xuất kết quả | Chấm tay câu tự luận kèm nhận xét, kiểm tra tổng điểm chính xác, xuất tệp CSV an toàn chống injection |
| [THẺ F8](#thẻ-f8-sao-lưu-toàn-bộ-và-khôi-phục-kiểm-thử-trên-máy-cục-bộ) | Sao lưu & Khôi phục hệ thống (CV072) | Thực hiện đóng gói sao lưu và phục hồi thử nghiệm sang database mới theo runbook chuẩn |

---

### THẺ F1: Đăng nhập, đổi mật khẩu khởi tạo và truy cập kho đề
- **Mã kịch bản:** `PILOT-F1`
- **Mã CV đối chiếu:** `CV009` (Đăng nhập giáo viên), `CV011` (Bảo vệ phiên & Cookie HttpOnly), `CV012` (Bắt buộc đổi mật khẩu lần đầu).
- **Mã nguồn giao diện đối chiếu:** [src/app/login/page.tsx](../../src/app/login/page.tsx), [src/app/page.tsx](../../src/app/page.tsx).
- **Vai trò:** Giáo viên mới nhận tài khoản từ Quản trị viên trường.
- **Dữ liệu chuẩn bị:**
  - Tài khoản thử nghiệm có cờ `mustChangePassword = true` (ví dụ: `gv_toan6@examcraft.test`, mật khẩu khởi tạo: `InitPass123!`).
  - Mật khẩu mới dự kiến đặt: `GiaoVien2026@Toan6`.

#### Trình tự thao tác từng bước:
1. Mở trình duyệt web, truy cập đường dẫn trang chủ: `http://localhost:3000/`.
   - Hệ thống tự động chuyển hướng sang: `http://localhost:3000/login?redirect=/`.
2. Tại form đăng nhập, nhập Email: `gv_toan6@examcraft.test` và Mật khẩu khởi tạo: `InitPass123!`.
3. Bấm nút **"Đăng nhập hệ thống"** (`src/app/login/page.tsx:125`).
4. Quan sát màn hình xuất hiện hộp thoại (Modal) bắt buộc: **"Đổi mật khẩu khởi tạo"** (Phụ đề: *"Bạn cần đặt mật khẩu riêng cho lần đầu đăng nhập"*).
5. Nhập vào ô "Mật khẩu mới (tối thiểu 8 ký tự)": `GiaoVien2026@Toan6`.
6. Nhập vào ô "Xác nhận lại mật khẩu mới": `GiaoVien2026@Toan6`.
7. Bấm nút **"Lưu mật khẩu và tiếp tục"** (`src/app/login/page.tsx:173`).
8. Sau khi lưu thành công, quan sát việc chuyển hướng về trang chủ kho đề cá nhân `/`.

#### Kết quả cần quan sát trên màn hình:
- Sau bước 7: Màn hình chuyển vào Bảng điều khiển giáo viên (`TeacherDashboard`).
- Tiêu đề đầu trang hiển thị: **"Kho Đề Cá Nhân"** (Phụ đề: *"Soạn đề, quản lý câu hỏi và giao bài"*).
- Góc trên cùng bên phải hiển thị tên và email của giáo viên đăng nhập.
- Thử mở tab mới và truy cập thẳng `/`: Người dùng vào thẳng kho đề mà không bị hỏi đổi mật khẩu lần nữa.

#### Xử lý khi gặp sự cố:
- Nếu mật khẩu dưới 8 ký tự hoặc hai ô không khớp: Màn hình hiển thị cảnh báo viền đỏ rõ ràng, không gửi yêu cầu lên máy chủ.
- Nếu gặp sự cố mạng: Giữ nguyên form, không tải lại trang để tránh mất thông tin đã điền.

---

### THẺ F2: Tạo đề, soạn đủ 7 dạng câu hỏi, lưu CAS và mở lại
- **Mã kịch bản:** `PILOT-F2`
- **Mã CV đối chiếu:** `CV006` (Lưu & nháp đề), `CV007` (Cấu trúc đề/câu GDPT 2018), `CV027` (Không gian soạn thảo `ExamWorkspace`), `CV049/050` (CAS chống ghi đè phiên bản đa tab).
- **Mã nguồn giao diện đối chiếu:** [src/components/TeacherDashboard.tsx](../../src/components/TeacherDashboard.tsx), [src/components/ExamWorkspace.tsx](../../src/components/ExamWorkspace.tsx), [src/components/QuestionCard.tsx](../../src/components/QuestionCard.tsx).
- **Vai trò:** Giáo viên bộ môn.
- **Dữ liệu chuẩn bị:**
  - Tiêu đề đề thi: `Đề Kiểm Tra Giữa Kỳ I - Toán 6 (Thử Nghiệm)`
  - Soạn đủ 7 dạng câu hỏi cơ bản:
    1. Trắc nghiệm 4 lựa chọn (Phần I).
    2. Đúng / Sai 4 ý a, b, c, d (Phần II).
    3. Trả lời ngắn / điền số (Phần III).
    4. Tự luận (kèm biểu điểm/barem rubric).
    5. Điền từ vào chỗ trống (`fill_blank`).
    6. Ghép nối 2 cột (`matching`).
    7. Sắp xếp thứ tự các bước (`ordering`).
  - 01 câu có gắn hình ảnh minh họa (`Figure` dạng ảnh PNG) và 01 đoạn trích ngữ liệu đọc hiểu dùng chung (`Passage`).

#### Trình tự thao tác từng bước:
1. Tại Bảng điều khiển giáo viên (`/`), bấm nút **"Soạn Đề Thi Mới"** ở thanh điều hướng bên trái (hoặc bấm thẻ **"Soạn đề trống mới"** ở đầu trang).
2. Trình duyệt mở ra không gian soạn thảo: `/editor/[id]` (`ExamWorkspace`).
3. Click vào ô tiêu đề trên thanh Header để đổi tên thành: `Đề Kiểm Tra Giữa Kỳ I - Toán 6 (Thử Nghiệm)`.
4. Bấm nút **"Thêm câu hỏi"** trên thanh công cụ danh sách câu hỏi:
   - Câu 1: Chọn dạng **"Trắc nghiệm 4 lựa chọn"**, nhập nội dung câu hỏi, điền 4 đáp án A, B, C, D, tích chọn đáp án đúng.
   - Câu 2: Bấm "Thêm câu hỏi", chọn dạng **"Đúng / Sai (4 ý)"**, nhập đề và 4 mệnh đề a, b, c, d; chọn ĐÚNG/SAI cho từng ý.
   - Câu 3: Bấm "Thêm câu hỏi", chọn dạng **"Trả lời ngắn"**, nhập câu hỏi và giá trị số/chuỗi đáp án chuẩn.
   - Câu 4: Bấm "Thêm câu hỏi", chọn dạng **"Tự luận"**, nhập đề bài và thang điểm rubric.
   - Câu 5: Bấm "Thêm câu hỏi", chọn dạng **"Điền khuyết"** (Điền từ vào chỗ trống).
   - Câu 6: Bấm "Thêm câu hỏi", chọn dạng **"Ghép nối"** (Ghép nối 2 cột A-B).
   - Câu 7: Bấm "Thêm câu hỏi", chọn dạng **"Sắp xếp"** (Sắp xếp thứ tự các bước).
5. Thử chèn 01 hình ảnh vào Câu 4 và gán ngữ liệu đọc hiểu dùng chung cho Câu 1 và Câu 2.
6. Thử đặt 01 câu hỏi khảo sát có điểm bằng `0` (để kiểm thử hệ thống tính điểm không crash khi câu có điểm 0).
7. Bấm nút **"Lưu đề"** trên thanh tiêu đề câu hỏi (`src/components/ExamWorkspace.tsx:244`). Quan sát nút đổi từ `Đang lưu…` sang `Lưu đề` kèm icon tích xanh.
8. **Thử nghiệm chống ghi đè phiên bản (CAS Multi-tab Test):**
   - Mở thêm Tab thứ hai trên cùng trình duyệt, truy cập vào chính đề thi này.
   - Tại Tab 2: Sửa tiêu đề thành `... - Bản sửa Tab 2` và bấm "Lưu đề" -> Lưu thành công.
   - Quay lại Tab 1 ban đầu (chưa cập nhật dữ liệu mới của Tab 2): Bấm lại nút "Lưu đề".
9. Đóng cả 2 tab. Quay lại trang chủ `/`, tìm đề vừa lưu và bấm mở lại.

#### Kết quả cần quan sát trên màn hình:
- Sau bước 7: Trạng thái lưu hiển thị "Đã lưu đề".
- Ở bước 8 (CAS): Tab 1 báo cảnh báo xung đột (HTTP 409): Hệ thống từ chối ghi đè âm thầm, hiển thị nút hỗ trợ: `"Lưu bản nháp thành đề mới"` hoặc `"Mở bản máy chủ, giữ riêng nháp"`.
- Ở bước 9: Đề thi mở lại nguyên vẹn đầy đủ 7 dạng câu hỏi, hình ảnh đính kèm và điểm số cấu hình.

---

### THẺ F3: Chế độ xem in, Chế độ Song song, Trộn mã đề và Xuất tệp Word (.docx)
- **Mã kịch bản:** `PILOT-F3`
- **Mã CV đối chiếu:** `CV008` (Xuất file Word docx kèm công thức MathML/OMML), `CV023` (Hiển thị KaTeX), `CV028` (Trộn đề và sinh ma trận hoán vị).
- **Mã nguồn giao diện đối chiếu:** [src/components/A4Preview.tsx](../../src/components/A4Preview.tsx), [src/components/ShuffleModal.tsx](../../src/components/ShuffleModal.tsx), [src/components/Header.tsx](../../src/components/Header.tsx).
- **Vai trò:** Giáo viên chuẩn bị đề in cho kỳ thi trên giấy.
- **Dữ liệu chuẩn bị:** Đề thi đã có ít nhất 4–6 câu hỏi từ Thẻ F2.

#### Trình tự thao tác từng bước:
1. Trong màn hình soạn thảo đề thi, quan sát khu vực xem trước bản in khổ giấy A4 (`A4Preview`) ở cột bên phải.
2. Thử bấm lần lượt các nút chuyển đổi chế độ xem trên thanh công cụ A4 (`src/components/A4Preview.tsx:105-160`):
   - Bấm **"Đề thi"** (`viewMode = 'exam'`): Xem đề thi dạng hoàn chỉnh dành cho học sinh làm bài (không có đáp án).
   - **Bấm "Song song" (`src/components/A4Preview.tsx:127`):**
     * Quan sát tiêu đề xuất hiện: **"ĐỀ VÀ ĐÁP ÁN SONG SONG"** (`line 279`).
     * Dòng chú thích: *"Bản này chứa đáp án: chỉ dùng cho giáo viên, không phát cho học sinh."* (`line 281`).
     * Bố cục hiển thị chia 2 cột đối xứng: Cột trái là **"ĐỀ"**, cột phải là **"ĐÁP ÁN VÀ HƯỚNG DẪN"** (`line 288`).
     * Các câu hỏi và đoạn trích ngữ liệu đọc hiểu được dàn hàng thẳng tắp, tiện lợi cho giáo viên đối chiếu.
   - Bấm **"Đáp án"** (`viewMode = 'answers'`): Xem bảng tổng hợp đáp án trắc nghiệm A-B-C-D và biểu điểm chi tiết.
   - Bấm **"Lời giải"** (`viewMode = 'solutions'`): Xem hướng dẫn giải chi tiết từng bước.
   - Bấm **"Ma trận"** (`viewMode = 'matrix'`): Xem bảng ma trận phân bố câu hỏi theo mức độ nhận thức (CV 7991).
3. **Thử xuất file Word (.docx) từ chế độ Song song:**
   - Tại chế độ "Song song", bấm nút **"Tải file Word (.docx)"** (`src/components/A4Preview.tsx:70`).
   - Mở tệp `.docx` vừa tải: Quan sát tệp Word được xuất theo bố cục tuần tự chuẩn (toàn bộ câu hỏi trước, tiếp theo là đáp án và lời giải chi tiết ở cuối tài liệu, ứng với mode `'all'`), không xuất dạng 2 cột để tránh lỗi vỡ bảng trong Word.
4. Bấm nút **"Trộn 4 mã đề"** trên thanh công cụ dọc bên trái để mở hộp thoại `ShuffleModal`:
   - Chọn `4 mã đề (101, 102, 103, 104)`.
   - Bấm nút **"Trộn ngẫu nhiên lại"**: Hệ thống tự động xáo trộn câu hỏi và các phương án A, B, C, D.
   - Bấm nút tải file Word cho từng mã đề (ví dụ mã 101, 102).
   - Bấm nút **"Sao chép ma trận đáp án"** để lưu ma trận đối chiếu vào bộ nhớ tạm.
5. Bấm nút **"In A4"** để mở hộp thoại in của trình duyệt (`window.print()`).

#### Kết quả cần quan sát trên màn hình:
- Chế độ "Song song" hiển thị chuẩn xác 2 cột đối xứng trên giao diện web và bản in A4 của trình duyệt.
- Tệp Word tải về có công thức toán hiển thị dưới dạng công thức toán chuẩn (OMML), hình ảnh PNG nhúng hiển thị rõ ràng, không bị lỗi thiếu ảnh (`prepareExportFigures` hoạt động trơn tru).

---

### THẺ F4: Chia sẻ liên kết, Tạo bản sao để sửa, Mời đồng nghiệp và Thu hồi quyền
- **Mã kịch bản:** `PILOT-F4`
- **Mã CV đối chiếu:** `CV048` (Chia sẻ công khai, snapshot bản sao độc lập & `allowCopy`), `CV031` (Mời đồng nghiệp cùng sửa theo vai trò), `CV050` (Kiểm soát quyền truy cập tức thì).
- **Mã nguồn giao diện đối chiếu:** [src/components/ShareModal.tsx](../../src/components/ShareModal.tsx), [src/app/share/[id]/page.tsx](../../src/app/share/[id]/page.tsx), [src/components/ExamCollaboratorsPanel.tsx](../../src/components/ExamCollaboratorsPanel.tsx).
- **Vai trò:** Giáo viên A (Chủ đề) và Giáo viên B (Đồng nghiệp).
- **Dữ liệu chuẩn bị:** Tài khoản Giáo viên B: `gv_toan_dongnghiep@examcraft.test`.

#### Trình tự thao tác từng bước:
1. **Chia sẻ link xem công khai và cho phép tạo bản sao:**
   - Giáo viên A mở đề thi, bấm nút **"Chia sẻ & Thi Online"** ở cột công cụ bên trái.
   - Chuyển sang tab **"Link Xem / Tải Word (.docx)"**.
   - Tích chọn: `Cho giáo viên đã đăng nhập tạo bản sao` (`allowCopy = true`).
   - Tùy chọn: Chọn `Kèm đáp án và lời giải` (`showAnswers = true`) hoặc bỏ chọn (chỉ chia sẻ đề).
   - Bấm nút **"Tạo link chia sẻ"** (`src/components/ShareModal.tsx:485`).
   - Bấm **"Sao chép"** để lấy liên kết chia sẻ dạng `http://localhost:3000/share/[id]`.
2. **Kiểm tra nút "Tạo bản sao để sửa" trên trang chia sẻ:**
   - Đăng nhập tài khoản Giáo viên B, truy cập đường link `/share/[id]`.
   - Quan sát trên thanh công cụ góc phải xuất hiện nút màu xanh lá: **"Tạo bản sao để sửa"** (`src/app/share/[id]/page.tsx:190`).
   - Bấm nút **"Tạo bản sao để sửa"**:
     * Nút hiển thị trạng thái `Đang sao chép...`.
     * Khi hoàn tất, nút hiển thị `Đã lưu vào kho đề! Đang mở...` và tự động điều hướng sang `/editor/[newId]`.
     * Kiểm tra nội dung: Đề thi được sao chép nguyên vẹn vào kho đề của Giáo viên B.
     * **Kiểm tra đáp án:** Nếu Giáo viên A không tích `Kèm đáp án`, đối chiếu bản sao của Giáo viên B không chứa đáp án/lời giải; kiểm cả nội dung hiển thị và dữ liệu tải về. Đối chiếu đề gốc của Giáo viên A không bị đổi.
3. **Mời đồng nghiệp cùng soạn thảo (Collaborator Invite):**
   - Quay lại màn hình soạn thảo của Giáo viên A. Bấm nút **"Cùng soạn · Góp ý · Lịch sử"** để mở `ExamCollaboratorsPanel`.
   - Nhập email Giáo viên B: `gv_toan_dongnghiep@examcraft.test`.
   - Chọn quyền: `Người cùng sửa (EDITOR)` và bấm **"Cấp quyền"**.
4. **Thu hồi quyền tức thì:**
   - Giáo viên A bấm nút **"Thu hồi quyền"** tại dòng tài khoản Giáo viên B.
   - Giáo viên B trên màn hình của mình bấm lưu đề: Hệ thống phản hồi chặn quyền truy cập (HTTP 403 Forbidden).

---

### THẺ F5: Giao bài thi trực tuyến, Tùy chọn nâng cao và Theo dõi bài giao
- **Mã kịch bản:** `PILOT-F5`
- **Mã CV đối chiếu:** `CV054` (Tạo đợt thi & Snapshot đề bất biến), `CV055` (Quản lý hạn nộp, giờ mở/đóng, số lượt, mã vào bài), `CV059` (Chính sách công bố điểm và giải).
- **Mã nguồn giao diện đối chiếu:** [src/components/ShareModal.tsx](../../src/components/ShareModal.tsx), [src/app/teacher/assignments/[id]/page.tsx](../../src/app/teacher/assignments/[id]/page.tsx).
- **Vai trò:** Giáo viên tổ chức thi trực tuyến.
- **Dữ liệu chuẩn bị:** Đề kiểm tra đã hoàn thiện nội dung.

#### Trình tự thao tác từng bước:
1. Mở đề thi cần giao, bấm nút **"Chia sẻ & Thi Online"** trên thanh công cụ bên trái.
2. Chọn tab **"Giao Bài Thi Online (Chấm Tự Động)"** (`src/components/ShareModal.tsx:430`).
3. Điền các trường cơ bản:
   - **Tiêu đề bài giao:** `Kiểm tra thử giữa kỳ 1 - Lớp 6A1`
   - **Phân loại phòng thi:** Chọn `Phòng Thi` (hoặc `Về Nhà` / `Ôn Tập`).
   - **Thời lượng (phút):** Điền `15` phút.
   - **Chính sách xem điểm & lời giải:** Chọn `Ngay khi nộp` (IMMEDIATE) hoặc `Sau khi đóng đợt thi` (AFTER_CLOSE).
4. **Cấu hình mục "Tùy chọn nâng cao: giờ mở/đóng, số lượt, mã vào bài" (`src/components/ShareModal.tsx:479-499`):**
   - Nhấp chuột mở khối chi tiết: `<summary>Tùy chọn nâng cao: giờ mở/đóng, số lượt, mã vào bài</summary>`.
   - **Giờ mở (để trống: mở ngay):** Có thể chọn thời điểm bắt đầu mở thi.
   - **Giờ đóng (để trống: không hạn):** Có thể đặt hạn chót nộp bài.
   - **Số lượt làm (1-10):** Điền `1` (cho phòng thi).
   - **Mã vào bài (4-12 chữ/số, tùy chọn):** Nhập ví dụ `TOAN6A`.
   - **Trộn thứ tự câu hỏi cho mỗi học sinh:** Tích chọn.
   - **Trộn thứ tự đáp án A/B/C/D:** Tích chọn.
   - Đọc kỹ dòng lưu ý: *"Giờ theo múi giờ của máy này. Đặt giờ đóng rồi, học sinh vào sau giờ đó sẽ bị từ chối; bài đang làm dở vẫn được nộp theo quy định thời gian của lượt."*
5. Bấm nút **"Giao Bài & Tạo Phòng Thi Ngay"** (`line 470`):
   - Xuất hiện liên kết phòng thi: `http://localhost:3000/a/[publicId]`. Bấm nút **"Sao chép"**.
6. **Kiểm tra trang theo dõi bài giao (`/teacher/assignments/[id]`):**
   - Truy cập vào trang chi tiết đợt thi vừa tạo (`src/app/teacher/assignments/[id]/page.tsx`).
   - **Dòng thông số cấu hình (`page.tsx:507`):**
     Quan sát dòng chữ ngay dưới tiêu đề:
     `Mở: [thời gian] · Đóng: [thời gian] · Số lượt: 1 · Mã vào bài: TOAN6A (giờ theo máy này)`
   - **Huy hiệu trạng thái (`page.tsx:497`):** Hiển thị huy hiệu `Đang Mở` (nền xanh lá).
   - **Nút điều khiển phòng thi (`page.tsx:544-560`):** Bấm nút **"Đóng bài thi"** -> Trạng thái chuyển thành `Đã Đóng`; bấm **"Mở lại bài thi"** -> Trạng thái chuyển lại thành `Đang Mở`.

---

### THẺ F6: Học sinh làm đủ 7 dạng câu, tự động lưu nháp và nộp bài
- **Mã kịch bản:** `PILOT-F6`
- **Mã CV đối chiếu:** `CV056` (Bù trừ độ trễ mạng 15 giây), `CV057` (Local draft journal & Khôi phục sự cố), `CV058` (Giao diện học sinh `/a/[publicId]`), `CV059` (Bảo mật đáp án & chống rò rỉ).
- **Mã nguồn giao diện đối chiếu:** [src/app/a/[publicId]/page.tsx](../../src/app/a/[publicId]/page.tsx).
- **Vai trò:** Học sinh tham gia làm bài thi.
- **Dữ liệu chuẩn bị:** Liên kết phòng thi `/a/[publicId]` tạo từ Thẻ F5 kèm Mã vào bài `TOAN6A`.

#### Trình tự thao tác từng bước:
1. Mở cửa sổ ẩn danh mới, dán liên kết `/a/[publicId]` vào thanh địa chỉ.
2. Màn hình chào đón phòng thi xuất hiện:
   - Hiển thị tiêu đề bài thi, thời lượng làm bài (`15 phút`), số lượng câu hỏi và số lượt làm tối đa.
3. Tại ô "Nhập họ và tên của em:", điền: `Trần Thử Nghiệm 6A`.
4. Nếu phòng thi có mã vào bài: Nhập mã `TOAN6A` vào ô mã vào bài.
5. Bấm nút **"Bắt đầu làm bài"** (`src/app/a/[publicId]/page.tsx:740`).
6. Màn hình làm bài thi mở ra: Đồng hồ đếm ngược chạy (`14:59...`), học sinh trả lời các câu hỏi trắc nghiệm, Đúng/Sai, trả lời ngắn, tự luận, điền khuyết, ghép nối, sắp xếp.
7. **Thử nghiệm tính năng Tự Động Lưu Nháp (Auto-save Draft):** Sau khi chọn 2 câu đầu, quan sát biểu tượng đĩa mềm hiện `Đang lưu...` rồi chuyển thành `Lưu nháp <giờ:phút:giây>`.
8. **Kiểm khôi phục sau tải lại:** Khi còn mạng, bấm **F5**, vào lại đúng lượt và đối chiếu từng câu trả lời với trước khi tải lại. Thử mất mạng là ca riêng: ghi câu nào đã được máy chủ xác nhận và câu nào còn là nháp; không suy rằng tải lại khi có mạng chứng minh mở được ứng dụng khi hoàn toàn offline.
9. Bấm **"Nộp bài thi"**, sau đó bấm **"Nộp bài ngay"** trong hộp xác nhận.

#### Kết quả cần quan sát trên màn hình:
- Màn hình kết quả xuất hiện: **"Nộp bài thành công!"**.
- Hiển thị điểm số trắc nghiệm khách quan đạt được. Các câu tự luận hiển thị trạng thái chờ giáo viên chấm điểm.

---

### THẺ F7: Giáo viên chấm bài tự luận, tổng điểm và xuất bảng điểm CSV
- **Mã kịch bản:** `PILOT-F7`
- **Mã CV đối chiếu:** `CV060` (Chấm thủ công tự luận & CAS `baseGradeRevision`), `CV061` (Lịch sử chấm & Audit trail), `CV073` (Xuất bảng điểm CSV an toàn, chống formula injection).
- **Mã nguồn giao diện đối chiếu:** [src/app/teacher/assignments/[id]/page.tsx](../../src/app/teacher/assignments/[id]/page.tsx), [src/components/TeacherGradeEditor.tsx](../../src/components/TeacherGradeEditor.tsx).
- **Vai trò:** Giáo viên chấm điểm và quản lý lớp học.
- **Dữ liệu chuẩn bị:** Đợt thi đã có ít nhất 01 bài nộp từ Thẻ F6 chứa câu hỏi tự luận cần chấm tay.

#### Trình tự thao tác từng bước:
1. Đăng nhập tài khoản Giáo viên, điều hướng vào trang quản lý bài giao: `/teacher/assignments/[id]`.
2. Quan sát danh sách bài nộp: Thấy học sinh `Trần Thử Nghiệm 6A` có trạng thái bài nộp kèm chỉ báo cần chấm tự luận.
3. Bấm vào dòng bài nộp của học sinh để mở bảng chấm điểm chi tiết (`TeacherGradeEditor`).
4. Nhập số điểm cho câu tự luận: ví dụ `1.5` điểm, nhập lời phê nhận xét: `Bài làm tốt, trình bày sạch sẽ`.
5. Bấm nút **"Lưu điểm và nhận xét"** (`src/components/TeacherGradeEditor.tsx:18`).
6. Quan sát tổng điểm của học sinh trên danh sách: Điểm tổng kết tự động cộng thêm phần điểm tự luận vừa chấm một cách chính xác.
7. **Xuất bảng điểm ra Excel:**
   - Tại thanh công cụ đầu trang chi tiết đợt thi, bấm nút: **"Xuất Excel (CSV)"** (`src/app/teacher/assignments/[id]/page.tsx:539`).
   - Tệp bảng điểm được tải về máy tính với tên: `ExamCraft-bang-diem.csv`.
8. Mở tệp CSV bằng Microsoft Excel: Kiểm tra họ tên, điểm các phần, điểm tổng kết, thời gian nộp và lời nhận xét hiển thị chuẩn UTF-8 có dấu tiếng Việt, không bị lỗi injection.

---

### THẺ F8: Sao lưu toàn bộ và khôi phục kiểm thử trên máy cục bộ
- **Mã kịch bản:** `PILOT-F8`
- **Mã CV đối chiếu:** `CV072` (Quy trình sao lưu toàn diện & khôi phục thử nghiệm độc lập).
- **Mã nguồn kịch bản đối chiếu:** [scripts/backup.ps1](../../scripts/backup.ps1), [scripts/restore.ps1](../../scripts/restore.ps1).
- **Vai trò:** Kỹ thuật viên / Chủ dự án vận hành hệ thống.
- **Dữ liệu chuẩn bị:** Cơ sở dữ liệu hiện hành đã có dữ liệu đề thi từ các thẻ F1 đến F7.

#### Trình tự thao tác từng bước:
1. Mở cửa sổ dòng lệnh PowerShell tại thư mục gốc dự án: `F:\Workspace\Zazz\ExamCraft`.
2. Chạy sao lưu thử nghiệm (Dry-Run): `.\scripts\backup.ps1` (kiểm tra tài nguyên an toàn).
3. Thực hiện đóng gói sao lưu thật: `.\scripts\backup.ps1 -Execute`.
4. Khôi phục kiểm thử sang cơ sở dữ liệu mới: `.\scripts\restore.ps1 -Package "backups/examcraft-backup-xxxx.tar.gz" -TargetDatabase "examcraft_restore_pilot" -Execute`.
5. **Quy tắc an toàn bất khả xâm phạm:** Kịch bản từ chối mọi nỗ lực phục hồi đè lên cơ sở dữ liệu chính đang chạy. Cơ sở dữ liệu cũ hoàn toàn nguyên vẹn.

---

## BẢNG ĐỐI CHIẾU NHÃN NÚT VÀ GIAO DIỆN THỰC TẾ

| Vị trí / Luồng | Tệp mã nguồn & số dòng | Nhãn hiển thị trên màn hình | Hành vi tương ứng |
|---|---|---|---|
| Đăng nhập (F1) | `src/app/login/page.tsx:125` | **"Đăng nhập hệ thống"** | Xác thực tài khoản giáo viên |
| Đổi mật khẩu (F1) | `src/app/login/page.tsx:173` | **"Lưu mật khẩu và tiếp tục"** | Lưu mật khẩu mới và chuyển vào kho đề |
| Bảng điều khiển (F1/F2) | `src/components/TeacherDashboard.tsx:321` | **"Kho Đề Cá Nhân"** | Tiêu đề trang quản lý đề |
| Bảng điều khiển (F1/F2) | `src/components/TeacherDashboard.tsx:342` | **"Soạn đề trống mới"** | Mở đề thi trắng để nhập tay |
| Soạn đề (F2) | `src/components/ExamWorkspace.tsx:244` | **"Lưu đề"** | Ghi dữ liệu đề lên máy chủ theo chuẩn CAS |
| Soạn đề (F2) | `src/components/ExamWorkspace.tsx:300` | **"Thêm câu hỏi"** | Mở thêm khối câu hỏi mới |
| Khung xem A4 (F3) | `src/components/A4Preview.tsx:127` | **"Song song"** | Chuyển chế độ xem đề và đáp án song song 2 cột |
| Header xem A4 (F3) | `src/components/A4Preview.tsx:279` | **"ĐỀ VÀ ĐÁP ÁN SONG SONG"** | Tiêu đề bản in song song |
| Header soạn đề (F3) | `src/components/Header.tsx:217` | **"Tải Word (.docx)"** | Xuất tệp Word chuẩn công thức OMML |
| Header soạn đề (F3) | `src/components/Header.tsx:227` | **"In / PDF"** | Kích hoạt lệnh in hoặc xuất PDF trình duyệt |
| Cột trái soạn đề (F3) | `src/components/ShuffleModal.tsx:61` | **"Trộn 4 mã đề"** | Mở hộp thoại `ShuffleModal` |
| Trang chia sẻ (F4) | `src/app/share/[id]/page.tsx:190` | **"Tạo bản sao để sửa"** | Nhân bản đề vào kho riêng (khi `allowCopy = true`) |
| Trang chia sẻ (F4) | `src/app/share/[id]/page.tsx:185` | **"Đã lưu vào kho đề! Đang mở..."** | Trạng thái sau khi nhân bản thành công |
| Cột trái soạn đề (F4/F5) | `src/components/ShareModal.tsx:430` | **"Chia sẻ & Thi Online"** | Mở hộp thoại `ShareModal` |
| Giao bài nâng cao (F5) | `src/components/ShareModal.tsx:479` | **"Tùy chọn nâng cao: giờ mở/đóng, số lượt, mã vào bài"** | Mở khối cấu hình chi tiết phòng thi |
| Giao bài thi (F5) | `src/components/ShareModal.tsx:470` | **"Giao Bài & Tạo Phòng Thi Ngay"** | Tạo phòng thi trực tuyến `/a/[publicId]` |
| Theo dõi bài giao (F5) | `src/app/teacher/assignments/[id]/page.tsx:497` | **"Đang Mở" / "Đã Đóng"** | Huy hiệu trạng thái phòng thi |
| Theo dõi bài giao (F5) | `src/app/teacher/assignments/[id]/page.tsx:507` | **"Mở: ... · Đóng: ... · Số lượt: ... · Mã vào bài: ..."** | Dòng thông số thời gian & quy định đợt thi |
| Theo dõi bài giao (F5) | `src/app/teacher/assignments/[id]/page.tsx:544-560` | **"Đóng bài thi" / "Mở lại bài thi"** | Bật/tắt trạng thái mở phòng thi |
| Học sinh thi (F6) | `src/app/a/[publicId]/page.tsx:740` | **"Bắt đầu làm bài"** | Khởi tạo phiên làm bài và đếm giờ |
| Học sinh thi (F6) | `src/app/a/[publicId]/page.tsx:770` | **"Nộp bài thi"** | Mở hộp thoại xác nhận nộp bài |
| Chấm bài (F7) | `src/components/TeacherGradeEditor.tsx:18` | **"Lưu điểm và nhận xét"** | Cập nhật điểm tự luận vào máy chủ |
| Xuất bảng điểm (F7) | `src/app/teacher/assignments/[id]/page.tsx:539` | **"Xuất Excel (CSV)"** | Tải bảng điểm `ExamCraft-bang-diem.csv` |
| Sao lưu hệ thống (F8) | `scripts/backup.ps1` | `.\scripts\backup.ps1 -Execute` | Đóng gói toàn bộ cơ sở dữ liệu và tệp ảnh |
| Khôi phục thử (F8) | `scripts/restore.ps1` | `.\scripts\restore.ps1 -Execute` | Phục hồi vào cơ sở dữ liệu mới độc lập |

---
*Tài liệu bàn giao mục `GEM-P10` thuộc nhiệm vụ `GEMINI-PILOT-PREP` (Generation 7).*
