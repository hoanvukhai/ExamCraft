# BỘ THẺ KIỂM THỬ THỦ CÔNG DÀNH CHO CHỦ DỰ ÁN (MANUAL TEST CARDS)
*Phiên bản Đính chính Generation 5 (Mục G03 trong GEMINI-CONTINUOUS-BATCH) — Căn cứ mã nguồn thực tế tại commit bb14bee và working tree*

- **Người thực hiện:** Gemini (QA Tài liệu / Phối hợp đa AI)
- **Nhiệm vụ:** `G03` thuộc `GEMINI-CONTINUOUS-BATCH` (Generation 5, `ASSIGNMENTS.json`)
- **Thời điểm biên soạn (UTC):** 2026-10-24T13:58:00Z
- **Baseline đối chiếu:** `bb14bee` kèm working tree hiện tại (`rebuild/2026-10-local`)
- **Mục tiêu:** Cung cấp bộ thẻ thao tác kiểm thử thủ công trực quan, chính xác theo mã nguồn thực tế, đúng ánh xạ mã CV theo bản đồ nguồn và checklist chính, phân định rõ giới hạn kỹ thuật.

---

> [!IMPORTANT]
> **QUY TẮC AN TOÀN VÀ PHẠM VI NGHIỆM THU CHO NGƯỜI DÙNG:**
> 1. **Tuyệt đối không dùng dữ liệu thật:** Chỉ sử dụng tài khoản kiểm thử, lớp học giả lập và câu hỏi mẫu.
> 2. **Bảo mật khóa API (BYOK):** Thử nghiệm với chuỗi khóa giả chỉ chứng minh định dạng và mã hóa trong DB, **chưa thay thế cho kết nối thật với Google AI Studio (Live Provider chưa chạy)**. Tuyệt đối không dán khóa API thật có phát sinh phí vào báo cáo.
> 3. **Không ghi đè DB thật:** Chỉ kiểm thử trên môi trường staging hoặc database kiểm thử độc lập (`examcraft_test_*`). Không nộp lại các fixture tự động đã hoàn thành.
> 4. **Giữ nguyên bản nháp khi gặp lỗi:** Nếu phát sinh lỗi mạng hoặc xung đột, **dừng thao tác ngay**, không ấn F5, giữ nguyên tab để bảo vệ nội dung đang nhập, tải bản sao lưu về máy và ghi nhận mã lỗi.
> 5. **Phân định rõ hiện trạng:** Việc có unit/HTTP test pass không thay thế cho nghiệm thu UI thật. Các gói học liệu hiện tại mới chỉ là dữ liệu kỹ thuật, chưa được hội đồng giáo viên duyệt chính thức.

---

## MỤC LỤC 10 THẺ KIỂM THỬ THỦ CÔNG

1. [THẺ 01: Tạo mới, chỉnh sửa nội dung, lưu CAS và mở lại đề thi](#thẻ-01-tạo-mới-chỉnh-sửa-nội-dung-lưu-cas-và-mở-lại-đề-thi)
2. [THẺ 02: Nhập đề từ tệp Word (.docx), Ảnh và Đoạn văn bản](#thẻ-02-nhập-đề-từ-tệp-word-docx-ảnh-và-đoạn-văn-bản)
3. [THẺ 03: Thiết lập định dạng câu hỏi theo cấu trúc tham khảo CV 7991](#thẻ-03-thiết-lập-định-dạng-câu-hỏi-theo-cấu-trúc-tham-khảo-cv-7991)
4. [THẺ 04: Lưu và áp dụng bản mẫu cấu trúc đề thi cá nhân (Templates)](#thẻ-04-lưu-và-áp-dụng-bản-mẫu-cấu-trúc-đề-thi-cá-nhân-templates)
5. [THẺ 05: Chia sẻ đề thi qua liên kết công khai và sao chép vào kho cá nhân](#thẻ-05-chia-sẻ-đề-thi-qua-liên-kết-công-khai-và-sao-chép-vào-kho-cá-nhân)
6. [THẺ 06: Giao bài cho lớp, học sinh vào làm, tự động lưu nháp và nộp bài](#thẻ-06-giao-bài-cho-lớp-học-sinh-vào-làm-tự-động-lưu-nháp-và-nộp-bài)
7. [THẺ 07: Giáo viên chấm điểm bài thi, ghi nhận xét và khôi phục lịch sử chấm](#thẻ-07-giáo-viên-chấm-điểm-bài-thi-ghi-nhận-xét-và-khôi-phục-lịch-sử-chấm)
8. [THẺ 08: Quản trị khóa API cá nhân (BYOK) và theo dõi số lượt dùng AI](#thẻ-08-quản-trị-khóa-api-cá-nhân-byok-và-theo-dõi-số-lượt-dùng-ai)
9. [THẺ 09: Ghi nhớ phong cách sư phạm của giáo viên (AI Teacher Memory)](#thẻ-09-ghi-nhớ-phong-cách-sư-phạm-của-giáo-viên-ai-teacher-memory)
10. [THẺ 10: Sao lưu đề thi và nhập dữ liệu chuyển đổi từ kho cũ (Legacy Migration)](#thẻ-10-sao-lưu-đề-thi-và-nhập-dữ-liệu-chuyển-đổi-từ-kho-cũ-legacy-migration)

---

### THẺ 01: Tạo mới, chỉnh sửa nội dung, lưu CAS và mở lại đề thi
- **Mã kịch bản:** `TC-MAN-01`
- **Mã CV đối chiếu:** `CV006` (Lưu & nháp đề thi), `CV007` (Cấu trúc đề/câu), `CV027` (Màn hình `ExamWorkspace`), `CV049/050` (CAS chống ghi đè phiên bản đa tab).
- **Vai trò:** Giáo viên (Teacher)
- **Dữ liệu giả lập cần chuẩn bị:**
  - Tiêu đề đề thi: `Đề kiểm tra thử Toán 12 - Kiểm thử thủ công`
  - 01 câu trắc nghiệm đơn giản: `Nghiệm của phương trình 2x - 4 = 0 là?` (A. 1, B. 2, C. 3, D. 4).
- **Trình tự thao tác từng bước:**
  1. Đăng nhập tài khoản Giáo viên A, điều hướng tới trang `/teacher` (Bảng điều khiển).
  2. Bấm nút **"Tạo đề mới"** để mở màn hình soạn thảo `/editor/[id]` (`ExamWorkspace`).
  3. Đặt tiêu đề cho đề thi. Bấm **"Thêm câu hỏi"** -> Chọn dạng Trắc nghiệm 4 lựa chọn.
  4. Nhập nội dung câu hỏi và 4 phương án, chọn đáp án đúng là `B`.
  5. Bấm nút **"Lưu đề"** trên thanh tiêu đề.
  6. Mở thêm 1 tab trình duyệt khác cùng tài khoản, vào lại đề thi này và sửa tiêu đề thành `Đề Toán 12 - Bản sửa ở Tab 2`, bấm "Lưu đề".
  7. Quay lại Tab 1 ban đầu (vẫn giữ bản cũ chưa cập nhật), bấm lại nút **"Lưu đề"**.
- **Kết quả cần quan sát trên màn hình:**
  - Ở bước 5: Thanh chỉ báo hiển thị "Đã lưu đề" kèm thời gian lưu.
  - Ở bước 7 (CAS chống ghi đè): Màn hình Tab 1 hiển thị trạng thái cảnh báo xung đột (HTTP 409): "Đề thi đã được chỉnh sửa ở phiên làm việc khác. Bản nháp hiện tại của bạn đã được giữ lại; vui lòng tải lại hoặc đối chiếu trước khi lưu tiếp". Đề thi không bị âm thầm ghi đè làm mất dữ liệu của Tab 2.
- **Xử lý khi gặp lỗi:** Dừng bấm lưu tiếp. Giữ nguyên tab để không mất nội dung vừa soạn; bấm "Lưu bản nháp thành đề mới" nếu cần tách riêng.
- **Nội dung cần báo lại:** Ảnh chụp thông báo xung đột, mã trạng thái mạng tab F12 (409 hay 500).
- **Tình trạng kiểm thử kỹ thuật:** Đã có test CAS và versioning trong `tests/http_workflows.test.ts`. **UI thực tế trên trình duyệt: Chưa kiểm.**

---

### THẺ 02: Nhập đề từ tệp Word (.docx), Ảnh và Đoạn văn bản
- **Mã kịch bản:** `TC-MAN-02`
- **Mã CV đối chiếu:** `CV039` (Bóc tách văn bản/Word), `CV040` (Bóc tách ảnh/OCR), `CV010` (Luồng import).
- **Vai trò:** Giáo viên (Teacher)
- **Dữ liệu giả lập cần chuẩn bị:**
  - 01 tệp văn bản `.txt` hoặc tệp `.docx` mẫu chứa 02 câu hỏi trắc nghiệm có định dạng chuẩn (`Câu 1: ... A. ... B. ... C. ... D. ... Lời giải: ...`). Dung lượng < 20MB.
- **Trình tự thao tác từng bước:**
  1. Trong màn hình soạn thảo đề thi, bấm nút **"Nhập đề"** trên thanh công cụ để mở `ImportModal`.
  2. Chọn tab **"Văn bản"** (hoặc tab "Word").
  3. Dán đoạn văn bản mẫu vào khung nhập liệu (hoặc kéo thả tệp `.docx`).
  4. Bấm nút **"Phân tích câu hỏi"**.
  5. Quan sát danh sách câu hỏi đã được bóc tách trong phần xem trước (Preview): kiểm tra tiêu đề câu, các phương án A-B-C-D, đáp án đúng đã được nhận diện.
  6. Bấm nút **"Thêm vào đề thi"**.
- **Kết quả cần quan sát trên màn hình:**
  - Quá trình phân tích có biểu tượng đang tải (Loading spinner).
  - Kết quả phân tích hiển thị đúng 02 câu hỏi, không bị mất phương án hoặc mất công thức.
  - Khi bấm "Thêm vào đề thi", modal đóng lại và 02 câu hỏi xuất hiện đầy đủ trên màn hình soạn thảo.
- **Xử lý khi gặp lỗi:** Nếu báo "Không thể phân tích" hoặc lỗi 403/409, copy lại đoạn văn bản ra Notepad ngoài máy tính, không đóng tab.
- **Nội dung cần báo lại:** Đoạn văn bản gốc gây lỗi, thông báo lỗi hiển thị trên modal.
- **Tình trạng kiểm thử kỹ thuật:** Đã kiểm tra ghim tài khoản và parser trong HTTP test suite (`qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md`). **UI thực tế: Chưa kiểm.**

---

### THẺ 03: Thiết lập định dạng câu hỏi theo cấu trúc tham khảo CV 7991
- **Mã kịch bản:** `TC-MAN-03`
- **Mã CV đối chiếu:** `CV007` (Cấu trúc câu hỏi Phần I/II/III theo định dạng tham khảo CV 7991), `CV023` (Hiển thị công thức Toán KaTeX).
- **Vai trò:** Giáo viên (Teacher)
- **Dữ liệu giả lập cần chuẩn bị:**
  - 01 câu Đúng/Sai gồm 4 lệnh hỏi a, b, c, d (Ví dụ: Cho hàm số y = f(x)... a) Đúng, b) Sai, c) Sai, d) Đúng).
  - 01 câu Trả lời ngắn (Ví dụ: Nghiệm nguyên dương nhỏ nhất là? Đáp án: `5`).
  - *Lưu ý: Đây là cấu trúc định dạng tham khảo kỹ thuật, chưa phải gói câu hỏi được hội đồng thẩm định chuẩn.*
- **Trình tự thao tác từng bước:**
  1. Trong màn hình soạn thảo, bấm **"Thêm câu hỏi"** -> Chọn định dạng **"Đúng / Sai 4 ý"**.
  2. Điền nội dung cho 4 mệnh đề a, b, c, d; tích chọn đúng/sai cho từng ý.
  3. Bấm **"Thêm câu hỏi"** -> Chọn định dạng **"Trả lời ngắn"**.
  4. Nhập câu hỏi và điền giá trị số vào ô đáp án chuẩn.
  5. Chuyển sang chế độ **"Xem trước đề thi"** (A4 Preview).
- **Kết quả cần quan sát trên màn hình:**
  - Câu Đúng/Sai hiển thị bảng 4 dòng có 2 cột chọn [Đúng] [Sai] rõ ràng, không bị lệch cột.
  - Câu Trả lời ngắn hiển thị ô nhập ký tự hoặc ô số, không bị ép thành 4 phương án trắc nghiệm A-B-C-D.
  - Công thức Toán (nếu có dấu `$` hoặc KaTeX) hiển thị sắc nét, không bị trơ mã nguồn thô (raw LaTeX).
- **Xử lý khi gặp lỗi:** Ghi nhận dạng câu hỏi bị vỡ khung hoặc nút chọn không nhận click.
- **Nội dung cần báo lại:** Ảnh chụp phần câu hỏi bị hiển thị sai định dạng.
- **Tình trạng kiểm thử kỹ thuật:** Đã kiểm tra parser và grading snapshot trong bộ unit test. **UI thực tế: Chưa kiểm.**

---

### THẺ 04: Lưu và áp dụng bản mẫu cấu trúc đề thi cá nhân (Templates)
- **Mã kịch bản:** `TC-MAN-04`
- **Mã CV đối chiếu:** `CV016` (Phạm vi môn/lớp), `CV021` (Bản mẫu cấu trúc đề cá nhân), `CV066` (Gói cấu trúc đề thi).
- **Vai trò:** Giáo viên (Teacher)
- **Dữ liệu giả lập cần chuẩn bị:**
  - Đề thi mẫu có sẵn cấu trúc 3 phần (Phần I: Trắc nghiệm lựa chọn, Phần II: Đúng/Sai, Phần III: Trả lời ngắn) và tiêu đề in ấn.
- **Trình tự thao tác từng bước:**
  1. Trong màn hình soạn thảo đề thi, bấm mở bảng điều khiển **"Bản mẫu đề thi"** (`ExamTemplatePanel`).
  2. Bấm nút **"Lưu cấu trúc đề hiện tại thành bản mẫu mới"**.
  3. Đặt tên mẫu: `Mẫu cấu trúc 3 phần tham khảo - Thử nghiệm`. Bấm Xác nhận lưu.
  4. Tạo một đề thi trống mới hoàn toàn (chưa có câu hỏi).
  5. Mở lại bảng **"Bản mẫu đề thi"**, tìm bản mẫu vừa lưu ở bước 3.
  6. Tích chọn các mục muốn áp dụng: `Tiêu đề in ấn`, `Ngữ cảnh đánh giá`, `Cấu trúc các phần (Sections)`.
  7. Bấm nút **"Áp dụng mẫu này"**.
- **Kết quả cần quan sát trên màn hình:**
  - Bản mẫu vừa tạo xuất hiện trong danh sách mẫu cá nhân của giáo viên.
  - Khi bấm áp dụng vào đề trống, hệ thống cập nhật metadata, tiêu đề in ấn và **cấu trúc các phần (Sections)** của đề.
  - *Lưu ý kỹ thuật mã nguồn:* Hàm `applyPersonalTemplate` chỉ sao chép metadata, header fields, assessment context, exam plan và sections; **hệ thống KHÔNG tự động sinh ra các khung câu hỏi (question cards)**. Đề vẫn giữ nguyên số lượng câu hỏi hiện tại (0 câu).
  - Đổi tài khoản khác đăng nhập không nhìn thấy bản mẫu riêng tư này.
- **Xử lý khi gặp lỗi:** Nếu bảng mẫu báo "Lỗi tải bản mẫu" hoặc nút áp dụng không phản hồi, kiểm tra xem có đang mở 2 tài khoản trên cùng trình duyệt hay không.
- **Nội dung cần báo lại:** Tên bản mẫu, thông báo lỗi hiển thị trên panel.
- **Tình trạng kiểm thử kỹ thuật:** Đã kiểm tra API ghim tài khoản và hủy request trễ trong `tests/template_request_context.test.ts`. **UI thực tế: Chưa kiểm.**

---

### THẺ 05: Chia sẻ đề thi qua liên kết công khai và sao chép vào kho cá nhân
- **Mã kịch bản:** `TC-MAN-05`
- **Mã CV đối chiếu:** `CV048` (Chia sẻ công khai & Snapshot bản sao độc lập).
- **Vai trò:** Giáo viên A (Chia sẻ) và Giáo viên B (Sao chép)
- **Dữ liệu giả lập cần chuẩn bị:**
  - 01 đề thi hoàn chỉnh của Giáo viên A có tên `Đề chia sẻ cộng đồng 2026`.
- **Trình tự thao tác từng bước:**
  1. Giáo viên A mở đề thi, bấm nút **"Chia sẻ"** trên thanh công cụ để mở `ShareModal`.
  2. Chuyển sang tab **"Chia sẻ"** (Chia sẻ cho đồng nghiệp), bật công tắc "Cho phép người khác xem và sao chép đề này", bấm "Tạo link chia sẻ".
  3. Bấm "Sao chép liên kết" (dạng `https://.../share/[id]`).
  4. Mở cửa sổ ẩn danh (Incognito) hoặc trình duyệt thứ hai, đăng nhập bằng tài khoản Giáo viên B.
  5. Dán liên kết `/share/[id]` vào thanh địa chỉ và truy cập.
  6. Quan sát trang xem đề công khai (kiểm tra nội dung câu hỏi, lời giải).
  7. Bấm nút **"Sao chép đề này vào kho của tôi"**.
  8. Sau khi có thông báo sao chép thành công, điều hướng vào Bảng điều khiển kho đề của Giáo viên B.
- **Kết quả cần quan sát trên màn hình:**
  - Trang `/share/[id]` tải nội dung đề rõ ràng, hiển thị tên tác giả gốc.
  - Khi bấm sao chép, hệ thống thực hiện sao chép snapshot đề độc lập (transaction khóa hàng và đối chiếu `sourceVersion`).
  - Trong kho đề của Giáo viên B xuất hiện đề mới. Giáo viên B có toàn quyền chỉnh sửa trên bản sao này mà không ảnh hưởng tới đề gốc của Giáo viên A.
- **Xử lý khi gặp lỗi:** Nếu báo "Đề thi đã bị thay đổi phiên bản" (409) hoặc "Không tìm thấy liên kết" (404), kiểm tra trạng thái chia sẻ phía Giáo viên A.
- **Nội dung cần báo lại:** Mã liên kết chia sẻ, lỗi trả về khi bấm nút sao chép.
- **Tình trạng kiểm thử kỹ thuật:** Đã kiểm tra transaction khóa hàng và đối chiếu `sourceVersion` trong `qa/rebuild-2026-10-24/SHARE_TRANSACTION_REVALIDATION.md`. **UI thực tế: Chưa kiểm.**

---

### THẺ 06: Giao bài cho lớp, học sinh vào làm, tự động lưu nháp và nộp bài
- **Mã kịch bản:** `TC-MAN-06`
- **Mã CV đối chiếu:** `CV056` (Thời hạn & Bù trừ mạng 15s), `CV057` (Local draft journal), `CV058` (Giao diện học sinh `/a/[publicId]`), `CV059` (Chính sách công bố).
- **Vai trò:** Giáo viên (Giao bài) và Học sinh (Làm bài)
- **Dữ liệu giả lập cần chuẩn bị:**
  - Bài giao có thời lượng `15 phút`, chính sách công bố điểm `IMMEDIATE`, chế độ `TOP_AND_ME`.
- **Trình tự thao tác từng bước:**
  1. Giáo viên mở đề thi -> Bấm "Chia sẻ" -> Chọn tab **"Giao cho học sinh"** -> Chọn lớp kiểm thử -> Đặt thời hạn -> Bấm "Giao bài ngay".
  2. Giáo viên sao chép liên kết phòng thi học sinh (dạng `/a/[publicId]`).
  3. Mở cửa sổ ẩn danh mới, truy cập đường dẫn `/a/[publicId]`.
  4. Nhập họ tên học sinh: `Nguyễn Văn Thử Nghiệm` -> Bấm **"Bắt đầu làm bài"**.
  5. Điền đáp án cho câu 1. Chờ 3-5 giây để hệ thống tự động lưu nháp lên máy chủ.
  6. Đóng tab trình duyệt hoặc ấn F5 tải lại trang.
  7. Quan sát xem đáp án câu 1 vừa chọn có được khôi phục nguyên vẹn hay không.
  8. Trả lời các câu còn lại. Bấm nút **"Nộp bài thi"** -> Bấm xác nhận trên hộp thoại nộp bài.
- **Kết quả cần quan sát trên màn hình:**
  - Ở bước 5: Có chỉ báo nháp chuyển trạng thái đã lưu.
  - Ở bước 7: F5 tải lại trang không bị mất câu trả lời đã làm (nhờ Local Journal và Server Draft).
  - Ở bước 8: Màn hình kết thúc hiển thị thông báo "Nộp bài thành công!", hiển thị số điểm đạt được (do chính sách IMMEDIATE), hiển thị vị trí xếp hạng của học sinh trên bảng tổng sắp. Không có lỗi màn hình trắng.
- **Xử lý khi gặp lỗi:** Nếu bị mất mạng, màn hình cảnh báo giữ nguyên trang. Bấm nút "Tải bản sao lưu" nếu gặp lỗi xung đột tab (`DRAFT_CONFLICT`).
- **Nội dung cần báo lại:** Mã `publicId`, ảnh chụp thanh trạng thái nháp khi có sự cố.
- **Tình trạng kiểm thử kỹ thuật:** Đã kiểm tra journal, access capability, và mạng ngắt quãng trong `tests/student_draft_journal.test.ts` và `tests/student_network.test.ts`. **UI thực tế: Chưa kiểm.**

---

### THẺ 07: Giáo viên chấm điểm bài thi, ghi nhận xét và khôi phục lịch sử chấm
- **Mã kịch bản:** `TC-MAN-07`
- **Mã CV đối chiếu:** `CV060` (Chấm thủ công & CAS `baseGradeRevision`), `CV061` (Lịch sử chấm, cursor pagination & Khôi phục).
- **Vai trò:** Giáo viên (Teacher)
- **Dữ liệu giả lập cần chuẩn bị:**
  - 01 bài nộp của học sinh có câu tự luận hoặc câu cần giáo viên chấm tay.
- **Trình tự thao tác từng bước:**
  1. Giáo viên vào trang quản lý bài giao: `/teacher/assignments/[id]`.
  2. Bấm vào tên học sinh `Nguyễn Văn Thử Nghiệm` để mở giao diện chấm bài (`TeacherGradeEditor`).
  3. Nhập điểm điều chỉnh cho câu tự luận: ví dụ `1.5` điểm; nhập lời nhận xét: `Trình bày rõ ràng`.
  4. Bấm **"Lưu điểm và nhận xét"**.
  5. Sửa lại điểm lần 2 thành `2.0` điểm; nhận xét: `Cộng thêm 0.5 điểm thưởng`. Bấm Lưu lần 2.
  6. Bấm vào nút xem lịch sử chỉnh sửa điểm.
  7. Tìm phiên bản chấm lần 1 (`1.5` điểm). Bấm nút **"Khôi phục phiên bản này"**.
- **Kết quả cần quan sát trên màn hình:**
  - Sau bước 4 & 5: Điểm tổng kết của học sinh cập nhật chính xác theo điểm vừa chấm.
  - Ở bước 6: Danh sách lịch sử liệt kê đầy đủ 2 mốc thời gian chấm, điểm số và nhận xét tương ứng.
  - Ở bước 7: Điểm số quay về mốc `1.5` điểm, nhận xét quay về nội dung lần 1, và một bản ghi lịch sử mới dạng khôi phục được tạo ra để đảm bảo tính minh bạch.
- **Xử lý khi gặp lỗi:** Nếu nút khôi phục báo lỗi hoặc báo xung đột phiên bản chấm, kiểm tra xem có giáo viên nào khác đang cùng mở bài chấm hay không.
- **Nội dung cần báo lại:** Lịch sử chấm bài hiển thị trên màn hình, thông báo lỗi nếu có.
- **Tình trạng kiểm thử kỹ thuật:** Đã kiểm tra logic restore và audit trail trong `tests/grade_history_restore.test.ts`. **UI thực tế: Chưa kiểm.**

---

### THẺ 08: Quản trị khóa API cá nhân (BYOK) và theo dõi số lượt dùng AI
- **Mã kịch bản:** `TC-MAN-08`
- **Mã CV đối chiếu:** `CV013` (Quản lý khóa API, mã hóa AES-GCM & Quota ứng dụng).
- **Vai trò:** Giáo viên (Teacher)
- **Dữ liệu giả lập cần chuẩn bị:**
  - Chuỗi định dạng khóa kiểm thử giả định: `AIzaSyMockTestKeyFormatDoNotUseReal12345`.
  - *Cảnh báo quan trọng: Tuyệt đối không dùng khóa Google Cloud thật có thẻ thanh toán; tính năng live provider thật chưa được kích hoạt trong bài test này.*
- **Trình tự thao tác từng bước:**
  1. Bấm mở hộp thoại quản lý khóa AI (`ApiKeyModal`).
  2. Dán chuỗi khóa kiểm thử vào ô "Khóa API".
  3. Bấm nút **"Lưu khóa"**.
  4. Quan sát danh sách khóa đã lưu: kiểm tra chuỗi khóa đã được che mờ (chỉ hiện 4 ký tự cuối dạng `****2345`).
  5. Bấm nút **"Đọc danh mục"** (hoặc Kiểm tra khóa).
  6. Mở rộng mục **"Nhật ký thao tác gần đây"** để xem các bản ghi gọi API.
- **Kết quả cần quan sát trên màn hình:**
  - Khóa sau khi lưu được mã hóa AES-GCM an toàn phía server, client chỉ nhìn thấy nhãn và chuỗi masked.
  - Khi bấm kiểm tra khóa giả: Hệ thống phản hồi thông báo từ API nội bộ, không làm sập ứng dụng.
  - Thao tác xóa khóa xóa sạch dữ liệu mã hóa trong cơ sở dữ liệu.
- **Xử lý khi gặp lỗi:** Bấm nút "Xóa" để dọn dẹp khóa thử nghiệm.
- **Nội dung cần báo lại:** Thông báo phản hồi từ hệ thống (che mờ ký tự bí mật nếu chụp ảnh).
- **Tình trạng kiểm thử kỹ thuật:** Đã kiểm tra route mã hóa và ghim tài khoản `api/user/keys`. **Chưa kết nối live Google AI provider thật.**

---

### THẺ 09: Ghi nhớ phong cách sư phạm của giáo viên (AI Teacher Memory)
- **Mã kịch bản:** `TC-MAN-09`
- **Mã CV đối chiếu:** `CV063` (Bộ nhớ phong cách sư phạm `TeacherMemory`), `CV064` (Ngữ cảnh trợ lý).
- **Vai trò:** Giáo viên (Teacher)
- **Dữ liệu giả lập cần chuẩn bị:**
  - Nội dung quy tắc phong cách: `Luôn thêm 01 câu hỏi thực tế địa phương vào phần trắc nghiệm cuối cùng`.
- **Trình tự thao tác từng bước:**
  1. Trong màn hình soạn thảo hoặc bảng điều khiển, bấm mở hộp thoại bộ nhớ phong cách (`AiLearningModal`).
  2. Bấm "Thêm chỉ dẫn mới". Nhập tiêu đề và nội dung quy tắc ở trên vào form.
  3. Bấm nút **"Lưu chỉ dẫn"**.
  4. Đóng modal và mở lại xem ghi chú có còn hiển thị trong danh sách hay không.
  5. Thử bấm nút xóa hoặc lưu trữ ghi chú.
- **Kết quả cần quan sát trên màn hình:**
  - Ghi chú được thêm vào danh sách, hiển thị phân loại (ví dụ: Phong cách sư phạm).
  - Thao tác lưu có gắn token CAS `clientRequestId` chống lưu trùng.
  - Đổi tài khoản khác đăng nhập không nhìn thấy ghi chú riêng tư của giáo viên này.
- **Xử lý khi gặp lỗi:** Nếu bị khóa form hoặc báo lỗi 401/409, tải lại trang và kiểm tra lại phiên đăng nhập.
- **Nội dung cần báo lại:** Thông báo trên modal, ảnh chụp danh sách ghi chú.
- **Tình trạng kiểm thử kỹ thuật:** Đã kiểm tra tích hợp `requireRequestAuth` và client gate trong `qa/rebuild-2026-10-24/MEMORY_AND_SHARE_VERSION.md`. **UI thực tế: Chưa kiểm.**

---

### THẺ 10: Sao lưu đề thi và nhập dữ liệu chuyển đổi từ kho cũ (Legacy Migration)
- **Mã kịch bản:** `TC-MAN-10`
- **Mã CV đối chiếu:** `CV014` (Bảo toàn dữ liệu kho cũ), `CV072` (Quy trình sao lưu/khôi phục).
- **Vai trò:** Giáo viên (Teacher)
- **Dữ liệu giả lập cần chuẩn bị:**
  - 01 tệp dữ liệu kiểm thử JSON nhỏ chứa cấu trúc đề thi cũ hợp lệ (dưới 10 câu hỏi, dung lượng < 500KB).
- **Trình tự thao tác từng bước:**
  1. Vào Bảng điều khiển `/teacher` -> Bấm nút **"Kho lưu trữ & Sao lưu"** (`ExamLibraryModal`).
  2. Bấm nút **"Sao lưu toàn bộ đề thi (Tải tệp JSON)"**.
  3. Kiểm tra tệp JSON được tải về máy tính (mở bằng Notepad kiểm tra có cấu trúc mảng đề thi).
  4. Chuyển sang mục **"Nhập dữ liệu cũ từ phiên bản trước"** (Import Legacy).
  5. Chọn tệp JSON thử nghiệm và tích chọn **"Kiểm tra thử nghiệm trước khi nhập (Dry Run)"**.
  6. Bấm nút **"Bắt đầu chuyển đổi"**.
  7. Quan sát báo cáo trước chuyển đổi (Số lượng đề sẽ nhập, số câu hỏi hợp lệ).
  8. Bấm **"Xác nhận nhập chính thức"**.
- **Kết quả cần quan sát trên màn hình:**
  - Tệp JSON sao lưu tải về đầy đủ thông tin, không bị rỗng dung lượng (0 bytes).
  - Bước Dry Run đưa ra cảnh báo rõ ràng nếu có câu hỏi trùng lặp hoặc cấu trúc lỗi, không tự ý ghi bừa vào cơ sở dữ liệu.
  - Khi bấm xác nhận chính thức, các đề thi mới xuất hiện trong kho đề cá nhân mà không làm mất các đề thi hiện hữu.
- **Xử lý khi gặp lỗi:** **Dừng lại ngay lập tức.** Không cố tải lại nhiều lần để tránh tạo dữ liệu rác trong cơ sở dữ liệu.
- **Nội dung cần báo lại:** Tệp JSON gây lỗi (nếu là dữ liệu giả), mã lỗi phản hồi từ API `/api/migration/import-legacy`.
- **Tình trạng kiểm thử kỹ thuật:** Đã kiểm tra ghim tài khoản và xác thực payload qua Zod schema. **UI thực tế: Chưa kiểm.**
