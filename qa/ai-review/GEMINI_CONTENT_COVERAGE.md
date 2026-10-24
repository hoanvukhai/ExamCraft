# BÁO CÁO KIỂM KÊ VÀ ĐỐI CHIẾU ĐỘ PHỦ KHO HỌC LIỆU MÔN / LỚP (CONTENT COVERAGE AUDIT)
*Phiên bản Generation 5 (Mục G06 trong GEMINI-CONTINUOUS-BATCH) — Căn cứ mã nguồn thực tế tại commit bb14bee và working tree*

- **Người thực hiện:** Gemini (QA Tài liệu / Phối hợp đa AI)
- **Nhiệm vụ:** `G06` thuộc `GEMINI-CONTINUOUS-BATCH` (Generation 5, `ASSIGNMENTS.json`)
- **Thời điểm rà soát (UTC):** 2026-10-24T13:48:00Z
- **Baseline đối chiếu:** `bb14bee` kèm working tree hiện tại (`rebuild/2026-10-local`)
- **Tài liệu căn cứ:** `docs/nghien-cuu/05_DANH_MUC_HOP_NHAT.md`, `docs/nghien-cuu/06_VIEC_TIEP_THEO.md`, `src/config/education/coverage.json`, `src/lib/education-catalog.ts`.
- **Ranh giới pháp lý & chuyên môn:** Báo cáo này thuần túy là bảng kiểm kê dữ liệu kỹ thuật phục vụ điều phối AI và phân tích của Codex; **tuyệt đối không xác nhận tính pháp lý, quyền tác giả, chuẩn kiến thức hay nghiệm thu chất lượng giáo dục**. Các môn/chương trình chưa xác định được ghi rõ `UNKNOWN`.

---

## I. TỔNG QUAN TÌNH TRẠNG KHO HỌC LIỆU TRONG HỆ THỐNG

1. **Quy mô danh mục nghiên cứu kế thừa:**
   - 119 bản ghi nghiên cứu (`SRC-001` đến `SRC-052`, `TK-0001` đến `TK-0067`) và 302 trang sách NXB (`NXB-0001` đến `NXB-0302`).
   - Trong đó nhiều mã là nhu cầu khảo sát (`SRC-031` đến `SRC-037`), trang tin tức cổng thông tin, hoặc URL trùng lặp; **chưa phải là 119 bộ học liệu độc lập**.
2. **Hiện trạng trong mã nguồn hệ thống (`src/config/education/coverage.json`):**
   - Đã ánh xạ 161 ô phân loại theo cặp [Môn học - Khối lớp] từ Lớp 1 đến Lớp 12.
   - **Tất cả 161 ô đều mang trạng thái `needs_review`**. Không có bất kỳ ô môn/lớp nào được đóng dấu `approved` (Đã duyệt chính thức).
   - Toàn bộ các bộ đề và câu hỏi mẫu hiện có trong mã nguồn (`tests/fixtures/`) chỉ đóng vai trò **gói dữ liệu kiểm thử kỹ thuật (test fixtures)**, chưa có gói học liệu chuyên môn hoàn chỉnh được hội đồng giáo viên thẩm định.

---

## II. BẢNG ĐỐI CHIẾU CHI TIẾT THEO CẤP HỌC VÀ PHÂN MÔN

| Cấp học & Khối lớp | Môn học / Phân hệ | Căn cứ pháp lý & Nguồn nghiên cứu | Tình trạng dữ liệu trong hệ thống | Loại gói hiện có trong Repo | Thành phần còn thiếu & Reviewer cần thiết |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tiểu học**<br>(Lớp 1 – 5) | **Toán** | TT 32/2018 (`TK-0004`, `SRC-003/009`), TT 27/2020 (`SRC-002/020`), Đề mẫu trường Đồng Hòa (`SRC-042`), Nguyễn Văn Trỗi (`SRC-047`). Khung đánh giá 3 mức `primary_tt27_3`. | Chỉ có URL và metadata; các tệp PDF lớn chưa được bóc tách toàn văn nội dung YCCĐ vào DB. | Gói demo kiểm thử (Test fixtures) | Thiếu Yêu cầu cần đạt (YCCĐ) chi tiết theo từng bài; thiếu bộ đề định kỳ được giáo viên tiểu học thẩm định. |
| **Tiểu học**<br>(Lớp 1 – 5) | **Tiếng Việt** | TT 32/2018 (`TK-0003`), SGK NXBGDVN (`NXB-0001`, `NXB-0074`). Khung 3 mức `primary_tt27_3`. | Có URL sách điện tử; chưa số hóa ngữ liệu đọc hiểu và barem chấm viết. | Chưa có gói mẫu | Thiếu kho văn bản đọc hiểu bản quyền; thiếu rubric chấm viết đoạn/bài văn; cần chuyên gia Tiếng Việt tiểu học. |
| **Tiểu học**<br>(Lớp 1 – 5) | **Đạo đức, Tự nhiên và Xã hội (1-3), Khoa học (4-5), Lịch sử & Địa lý (4-5)** | TT 32/2018 (`TK-0005`, `TK-0007-0009`), TT 27/2020. Chế độ đánh giá định tính `comment_only` cho Đạo đức/TNXH. | Chỉ có danh mục NXB; chưa số hóa câu hỏi. | Chưa có gói mẫu | Cần mẫu nhận xét định tính theo chuẩn TT 27/2020; thiếu giáo viên thẩm định chuyên môn. |
| **Tiểu học**<br>(Lớp 1 – 5) | **Âm nhạc, Mĩ thuật, Giáo dục thể chất, HĐ trải nghiệm** | TT 32/2018, TT 27/2020. Chế độ đánh giá: `comment_only`. | Chỉ có metadata môn học trong `education-catalog.ts`. | Chưa có gói mẫu | Thiếu tiêu chí đánh giá năng khiếu/hoạt động; cần người duyệt chuyên biệt từng môn. |
| **Tiểu học**<br>(Lớp 1 – 5) | **Tiếng Anh (Ngoại ngữ 1)** | TT 32/2018, TT 27/2020, khảo sát khu vực SEA-PLM (`SRC-024`, `SRC-052`). Lớp 1-2 là Tự chọn, Lớp 3-5 là Bắt buộc. | Có tài liệu compendium quốc tế mẫu; chưa có ngân hàng câu hỏi định kỳ tiểu học. | Gói kiểm thử parser | Thiếu file âm thanh nghe (Audio listening); thiếu giáo viên tiếng Anh tiểu học duyệt. |
| **THCS**<br>(Lớp 6 – 9) | **Toán** | TT 32/2018 (`TK-0004`), TT 22/2021 (`SRC-021`), đề giữa kỳ THCS Nguyễn Gia Thiều (`SRC-041`), đề HSG lớp 9 Hà Tĩnh (`SRC-040`). | Đã kiểm thử các dạng câu trắc nghiệm 4 lựa chọn, đúng sai, trả lời ngắn. | Gói demo trắc nghiệm + tự luận | Cần ngân hàng câu hỏi ma trận đầy đủ 4 khối lớp; cần giáo viên THCS duyệt đáp án và lời giải. |
| **THCS**<br>(Lớp 6 – 9) | **Ngữ văn** | TT 32/2018 (`TK-0003`, `SRC-039`), TT 22/2021. Đánh giá tự luận và câu hỏi mở. | Có đầu mối file lưu trữ; chưa tích hợp kho ngữ liệu ngoài SGK chống học tủ. | Chưa có gói mẫu | Thiếu ngữ liệu đọc hiểu ngoài sách; thiếu bảng rubric chấm điểm chi tiết cho giáo viên. |
| **THCS**<br>(Lớp 6 – 9) | **Khoa học tự nhiên (KHTN)** | TT 32/2018, tài liệu bồi dưỡng KHTN THCS (`SRC-043` - phân môn Lý, Hóa, Sinh). | Có tệp tài liệu bồi dưỡng trên website trường; chưa bóc tách ma trận tích hợp vào máy. | Chưa có gói mẫu | Môn tích hợp đa phân môn; cần ít nhất 3 giáo viên (Vật lý, Hóa học, Sinh học) cùng duyệt ma trận. |
| **THCS**<br>(Lớp 6 – 9) | **Lịch sử & Địa lí, GDCD, Tin học, Công nghệ** | TT 32/2018, TT 22/2021. Đánh giá điểm số kết hợp nhận xét. | Chỉ có danh mục mã môn trong catalog. | Chưa có gói mẫu | Thiếu toàn bộ ngân hàng câu hỏi theo chương trình 2018; cần người duyệt chuyên môn. |
| **THPT**<br>(Lớp 10 – 12) | **Toán** | TT 32/2018 (`TK-0004`), CV 7991/BGDĐT (`SRC-001` - Khung 3 mức Biết/Hiểu/Vận dụng), cấu trúc định dạng thi tốt nghiệp từ 2025 (`SRC-029/030`). | Đã hỗ trợ đầy đủ 3 dạng câu chuẩn BGD: TN 4 lựa chọn (Phần I), Đúng/Sai 4 ý (Phần II), Trả lời ngắn (Phần III) và công thức KaTeX. | Gói demo đề thi tốt nghiệp THPT 2025 | Đã có parser và engine chấm; còn thiếu bộ câu hỏi thực tế được giáo viên cấp THPT thẩm định nội dung. |
| **THPT**<br>(Lớp 10 – 12) | **Ngữ văn** | TT 32/2018, đề và đáp án tốt nghiệp THPT (`SRC-028`), hướng dẫn chấm tự luận. | Có ví dụ đáp án tự luận; engine hỗ trợ chế độ nhận xét hoặc barem điểm rubric. | Gói kiểm thử rubric | Cần thẩm định kho ngữ liệu đọc hiểu và quy chuẩn thang điểm bài viết nghị luận xã hội / văn học. |
| **THPT**<br>(Lớp 10 – 12) | **Các môn Lựa chọn (Vật lí, Hóa học, Sinh học, Địa lí, GDKT & PL, Tin học, Công nghệ)** | TT 32/2018, CV 7991, tài liệu tập huấn GDTX GDKT&PL (`SRC-022`), tài liệu Hóa 11 (`SRC-023`). | Mới có metadata danh mục môn và cấu trúc ma trận tham khảo; chưa nhập ngân hàng câu hỏi chi tiết. | Gói kiểm thử ma trận | Cần tổ bộ môn từng môn thẩm định câu hỏi trắc nghiệm Đúng/Sai và Trả lời ngắn theo đặc thù môn. |
| **Mọi cấp**<br>(Lớp 1 – 12) | **Ngoại ngữ khác (Nga, Pháp, Trung, Nhật, Đức, Hàn)** | TT 19/2021, Thông báo Ngoại ngữ quốc gia (`SRC-008`, `SRC-044`, `TK-0017`, `TK-0045-0048`). | **UNKNOWN**: Chưa có dữ liệu chương trình chuẩn hoá nạp vào hệ thống; mới chỉ có liên kết văn bản ban hành. | Chưa có gói mẫu | Thiếu dữ liệu ngữ pháp, từ vựng theo khung năng lực 6 bậc; cần chuyên gia ngôn ngữ từng thứ tiếng. |
| **Mọi cấp**<br>(Lớp 1 – 12) | **Tiếng dân tộc thiểu số (8 thứ tiếng)** | Quyết định 185/QĐ-BGDĐT (`NC-08`), tài liệu tiếng Bahnar, Chăm, Khmer, Êđê, Jrai, Mnông, Mông, Thái. | **UNKNOWN**: Hoàn toàn chưa có dữ liệu số hóa trong hệ thống. | Chưa có gói mẫu | Thiếu font chữ, bộ gõ và chuyên gia ngôn ngữ dân tộc thẩm định. |
| **Mọi cấp**<br>(Lớp 1 – 12) | **Giáo dục địa phương (GDĐP)** | Chương trình giáo dục địa phương do UBND từng tỉnh/thành phố biên soạn và phê duyệt (`NC-09`, `SRC-019`). | **UNKNOWN**: Mang tính phân tán theo 63 tỉnh thành; không có chuẩn chung toàn quốc. | Không có gói mẫu | Phụ thuộc hoàn toàn vào tài liệu do từng giáo viên/nhà trường tự tải lên tại địa phương. |

---

## III. ĐỐI CHIẾU NGUỒN VÀ GIỚI HẠN DỮ LIỆU ĐỌC ĐƯỢC

1. **Vấn đề đọc toàn văn tài liệu gốc (Access Barriers):**
   - Rất nhiều tệp PDF chương trình tổng thể và chương trình môn học (`SRC-003`, `SRC-009`, `SRC-021`, `SRC-038`) có dung lượng lớn (> 20MB) hoặc nằm trên các máy chủ có tốc độ kết nối hạn chế, khiến các công cụ thu thập tự động bị timeout hoặc vượt quá giới hạn bộ nhớ.
   - Các trang SGK điện tử NXB (`hanhtrangso`, `truonghocsoquocgia`, `hoc10`) chỉ cung cấp giao diện đọc trực tuyến bảo vệ bản quyền, không cho phép tải dữ liệu thô (raw data) có cấu trúc máy đọc được (JSON/XML).
2. **Quy định về năm học và áp dụng sách giáo khoa:**
   - Quyết định 3588/QĐ-BGDĐT và Quyết định 185/QĐ-BGDĐT năm 2026 điều chỉnh và đính chính 11 đầu sách giáo khoa (`SRC-048`, `SRC-049`). Hệ thống chưa tự động suy diễn việc sách cũ bị vô hiệu hóa; cần có sự rà soát của người quản trị nội dung.
3. **Kết luận phục vụ Codex:**
   - Hệ thống hiện tại có cấu trúc dữ liệu (`coverage.json`, `education-catalog.ts`, `types/exam.ts`) đủ linh hoạt để chứa tất cả các môn học và hình thức đánh giá (điểm số, đúng/sai, trả lời ngắn, nhận xét định tính, khảo sát).
   - Tuy nhiên, **kho nội dung thực tế (học liệu) hoàn toàn ở mức phôi thai (chỉ có schema và fixture kỹ thuật)**. Cần phân định rõ ràng giữa "kỹ thuật đã hỗ trợ" và "chưa có nội dung được duyệt", tránh công bố ra ngoài là hệ thống đã có đầy đủ ngân hàng đề thi các môn.
