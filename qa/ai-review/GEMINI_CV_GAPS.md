# BẢNG ĐỐI CHIẾU TIÊU CHÍ NGHIỆM THU VÀ CÁC CA KIỂM THỬ THỰC TẾ
*Rà soát khoảng trống kiểm thử cho 11 hạng mục công việc chưa đóng trong checklist 03*
*Căn cứ mã nguồn: `docs/ke-hoach-2026-10-21/03_CHECKLIST.md`, `tests/` và `tests_pilot/`*

- **Người thực hiện:** Gemini (QA & Rà soát kiểm định)
- **Nhiệm vụ:** GEM-T1 (P0, Generation 12)
- **Thời điểm lập (UTC):** 2026-10-25T11:45:00Z
- **Nguyên tắc đối chứng:** Trích dẫn nguyên văn dòng tiêu chí Đạt khi từ checklist 03; mỗi vế chỉ ghi tên ca test có thật được tìm thấy bằng chuỗi chính xác trong thư mục tests/ hoặc tests_pilot/. Nếu chưa có test tự động thì ghi rõ KHÔNG CÓ.

---

## BẢNG ĐỐI CHIẾU CHI TIẾT 11 CÔNG VIỆC (CV)

| CV | Vế tiêu chí nghiệm thu | Ca test thực tế trong tests/ hoặc tests_pilot/ | Ghi chú hiện trạng |
|---|---|---|---|
| **CV-023** | Sửa lựa chọn/ý đúng-sai | `'review refuses incomplete, duplicate or unknown true/false keys'`<br>`'every written question field is compared; answer fields inside payload cannot be skipped'` | Đã có kiểm tra unit và so sánh trường payload. |
| | Thêm kiểu câu phù hợp | `'shuffle preserves all seven types, missing answers and shared passage order'`<br>`'F2 author seven types, image, passage, zero, title and reopen'` | Đã có kiểm tra 7 dạng câu hỏi cả unit và browser pilot F2. |
| | Thứ tự/ghim | `'move and duplicate use latest question values while stale order/document/permission is rejected'`<br>`'shuffle respects pinned choices and builds keys for fill, matching and repeated ordering text'` | Đã có kiểm lệnh di chuyển, nhân bản và ghim lựa chọn. |
| | matching/ordering/fill_blank có cấu trúc dễ hoặc báo chưa hỗ trợ rõ | `'matching and ordering public prompts have independent keys without paired IDs or original answer order'`<br>`'shuffle respects pinned choices and builds keys for fill, matching and repeated ordering text'` | Đã kiểm cấu trúc prompt công khai và khóa đáp án. |
| **CV-024** | Ba chế độ cùng dữ liệu | `'F3 answer views, shuffle, Word and print'`<br>`'parallel Word pairs each question with its answer and keeps shared passage once'` | Đã kiểm chuyển đổi giữa Đề, Đáp án, Song song. |
| | Đáp án/lời giải/rubric riêng nhưng gắn version | `'essay lists rubric rows, keeps zero-point rows, and returns the trimmed solution'`<br>`'solution and parallel exports keep every answer next to its own question'` | Đã kiểm rubric tự luận và lời giải song song. |
| | Thiếu đáp án không tự điền đúng | `'Word solution export labels missing answers explicitly instead of inventing A or false'`<br>`'an unset answer is never presented as an answer'`<br>`'review does not match empty answers, essay, prose pretending to be a choice, or flagged ambiguity'` | Đã kiểm chặt chẽ việc không tự bịa đáp án A hay false khi trống. |
| **CV-026** | Thành phần hiển thị/biên tập có ID | `'a 120-question exam exports to Word in order, with passages once, images present and formulas converted'`<br>`'F2 author seven types, image, passage, zero, title and reopen'` | Đã kiểm định danh câu và thứ tự xuất. |
| | Mất tệp báo chỗ thiếu | `'portable backup refuses missing, transient, oversized and non-image assets without mutating documents'` | Đã kiểm từ chối asset thiếu/hỏng khi sao lưu. |
| | Ngữ liệu dùng chung không nhân bản sai | `'a shared passage appears once, before its first question, and no question is dropped'`<br>`'parallel Word pairs each question with its answer and keeps shared passage once'` | Đã kiểm ngữ liệu chỉ xuất 1 lần trước câu đầu tiên. |
| | Giữ mô hình hình học/môn khác | KHÔNG CÓ | Chưa có bộ kiểm tra riêng cho mô hình Geogebra hoặc hình vẽ môn khác. |
| **CV-027** | Sửa trường/năm/tên đề/phần | `'header submission only merges edited fields and preserves newer scope/plan and unedited header metadata'` | Đã kiểm hợp nhất các trường sửa đổi tiêu đề. |
| | Thêm/ẩn dòng, căn chỉnh và lưu mẫu | `'empty override remains one visible blank line, hidden drops line, undefined uses bound value and literal order remains'`<br>`'actual Word header uses ordered shared lines, blanks, alignment, footer/year/current score and hides private answers'`<br>`'save acknowledgement must name the saved template before the notice or the list changes'` | Đã kiểm ẩn dòng, căn lề và lưu mẫu header. |
| | Để trống không sinh trường giả | `'default header omits empty school/year without invented authority, explicit empty lines roundtrip and malformed layouts reject'` | Đã kiểm không tự sinh trường cơ quan giả khi để trống. |
| | Dữ liệu thời gian/điểm thống nhất | `'shared header resolves current year, notes, duration and actual score including0 instead of plan targets'` | Đã kiểm thống nhất thời lượng và điểm thật trên tiêu đề. |
| **CV-042** | Seed tái lập | KHÔNG CÓ | Chưa có ca test tự động kiểm tái lập hoán vị câu bằng seed số. |
| | Ghim và mọi loại câu giữ đủ | `'shuffle respects pinned choices and builds keys for fill, matching and repeated ordering text'`<br>`'shuffle preserves all seven types, missing answers and shared passage order'` | Đã kiểm giữ đủ 7 dạng câu và bảo toàn lựa chọn ghim. |
| | ID đáp án đúng sau đảo | `'shuffle respects pinned choices and builds keys for fill, matching and repeated ordering text'` | Đã kiểm tái tạo đúng khóa đáp án sau khi đảo thứ tự. |
| | Không thay chữ cái bằng regex làm hỏng lời giải | KHÔNG CÓ | Chưa có test kiểm soát rủi ro thay thế chữ cái A/B/C/D trong lời giải. |
| **CV-043** | Tài liệu mở sửa được, đủ câu/hình/điểm/nguồn hiển thị | `'a 120-question exam exports to Word in order, with passages once, images present and formulas converted'`<br>`'Word export preserves editor order, all seven types, shared passage and hides solutions on question-only export'` | Đã kiểm tệp Word 120 câu có hình ảnh và công thức chuyển đổi. |
| | Fallback có nhãn | `'systems, sets and text keep a readable one-line form, and unknown macros stay visible'`<br>`'malformed input never breaks the export'` | Đã kiểm macro lạ giữ nguyên dạng đọc được không làm hỏng file. |
| | Kiểm công thức | `'fractions, roots and nested fractions are real equation objects'`<br>`'powers, indices and combined scripts become superscripts and subscripts'`<br>`'sums, limits, integrals, functions and symbols leave no raw LaTeX'` | Đã kiểm tra đối tượng toán học thật (OMML) không còn LaTeX thô. |
| | Ngắt trang trực quan | KHÔNG CÓ | Chưa có kiểm tự động mở bằng Microsoft Word thật; kiểm bằng Thẻ F17. |
| **CV-044** | Đề/đáp án/lời giải/ma trận riêng hoặc chung | `'solution and parallel exports keep every answer next to its own question'`<br>`'shared print projection omits answer data, tolerates malformed historical plans, and keeps absent plans absent'`<br>`'actual Word matrix export contains all seven target types, loaded outcome, counts, points and deltas'` | Đã kiểm xuất ma trận và các chế độ đề/đáp án riêng biệt. |
| | 1–2 cột khi phù hợp | `'parallel Word pairs each question with its answer and keeps shared passage once'` | Đã kiểm xuất dạng hai cột Song song trên Word. |
| | Tiêu đề mẫu đồng nhất | `'actual Word header uses ordered shared lines, blanks, alignment, footer/year/current score and hides private answers'` | Đã kiểm đồng nhất tiêu đề khi xuất Word. |
| | Câu dài được ngắt có kiểm soát, không tràn/mất | `'F15 a 60-question exam prints on A4 pages without sideways overflow or questions taller than a page'` | Đã kiểm in đề 60 câu trên A4 không tràn lề và không câu nào bị cắt đôi. |
| **CV-054** | Enum/API/import thống nhất, nhóm tùy chọn đúng nhận diện | `'assignment options (times, attempts, entry code, PIN) are decided on the server'`<br>`'defaults keep the old behavior: nothing set means the default attempts and no times, code or PIN'`<br>`'shuffle flags pass through and never turn on by themselves'` | Đã kiểm các tùy chọn giao bài ở tầng máy chủ. |
| | Snapshot đủ câu/đáp án/tệp/điểm/mẫu và bất biến | `'public share and assignment hide keys and assignment freezes the source'`<br>`'F5 assign link with and without class and inspect frozen policies'` | Đã kiểm bản chụp snapshot đóng băng đề thi khi giao bài. |
| **CV-056** | Kiểm opensAt/closesAt/deadline/status | `'times: close must be in the future and after open, and valid times are stored as sent'`<br>`'closing early stops saving and starting; reopening restores both without touching the attempt deadline'`<br>`'a close time before the opening time is refused and invalid values change nothing'` | Đã kiểm thời gian mở/đóng và xử lý hợp lệ. |
| | Lượt hết hạn xử lý rõ | `'extending the close time changes new attempts only, and a started attempt keeps the deadline it was given'` | Đã kiểm lượt đã bắt đầu giữ nguyên thời hạn được cấp. |
| | Start đồng thời không tạo trùng hoặc lỗi unique vô nghĩa | `'concurrent starts respect maximum attempts and capabilities cannot cross attempts'`<br>`'two simultaneous submits of one attempt produce one result and no duplicate answers'` | Đã kiểm bắt đầu đồng thời và nộp đồng thời không sinh lỗi trùng. |
| **CV-058** | Tự luận có ô trả lời, đúng-sai/điền/ghép/sắp xếp dùng được | `'matching and ordering public prompts have independent keys without paired IDs or original answer order'`<br>`'structured responses use presentation keys, validate drafts and grade the private configuration exactly'`<br>`'F6 seven student answers survive reload, submit and hide solutions'` | Đã kiểm học sinh làm bài đủ 7 dạng câu hỏi trên giao diện web. |
| | Tệp/hình/âm thanh theo đề | KHÔNG CÓ | Hệ thống chưa tích hợp trình phát âm thanh (audio listening). |
| | Cuộn/keyboard/mobile đúng | `'F13 a student works and a teacher browses on a 375px phone without sideways scrolling'` | Đã kiểm hiển thị trên điện thoại 375px; bàn phím rời: KHÔNG CÓ. |
| **CV-061** | Danh sách bài/lượt, progress | `'F7 manual essay grade, total and CSV'`<br>`'history restore keeps student answers, restores pending distinctly from zero, isolates owners and serializes concurrent changes'` | Đã kiểm danh sách bài làm và chấm điểm tự luận. |
| | Gia hạn/mở lại có quyền | `'closing, reopening and extending an assignment, and teacher comments stay private'`<br>`'closing early stops saving and starting; reopening restores both without touching the attempt deadline'` | Đã kiểm quyền gia hạn và mở lại phòng thi. |
| | Thống kê/CSV | `'a teacher comment never reaches the student, and the CSV needs the teacher session'`<br>`'CSV comments and names cannot start spreadsheet formulas after whitespace'`<br>`'survey, comment-only and rubric store no artificial totals and do not enter numeric statistics or CSV'` | Đã kiểm xuất bảng điểm CSV và chống chèn công thức độc hại. |
| | Leaderboard tùy chọn mặc định tắt và không lộ toàn lớp | `'GET and idempotent submit use current reveal policies and hide rankings when scores are hidden'` | Đã kiểm ẩn bảng xếp hạng theo đúng chính sách công bố điểm. |

---

## TỔNG HỢP CÁC KHOẢNG TRỐNG KIỂM THỬ (TEST GAPS)

1. **Khoảng trống về mô hình hình học và âm thanh (CV-026, CV-058):** Chưa có bài kiểm tra cho công cụ hình học tương tác và trình phát âm thanh nghe hiểu ngoại ngữ.
2. **Khoảng trống về thuật toán trộn và thay thế (CV-042):** Chưa có ca test tự động kiểm tra việc khôi phục thứ tự xáo trộn bằng Seed số học cố định và việc bảo vệ văn bản lời giải khi dùng biểu thức chính quy.
3. **Khoảng trống về kiểm tra trực quan tệp Word (CV-043):** Bộ test tự động đã kiểm tra cấu trúc thẻ XML/OMML nhưng chưa thể kiểm tra ngắt trang trực quan trên ứng dụng Microsoft Word vật lý (đang được bao phủ bởi Thẻ kiểm tay F17).

---
*Báo cáo đối chiếu khoảng trống tiêu chí kiểm thử ExamCraft 2026.*
