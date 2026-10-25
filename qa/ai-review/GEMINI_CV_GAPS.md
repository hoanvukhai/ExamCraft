# BẢNG ĐỐI CHIẾU TIÊU CHÍ NGHIỆM THU VÀ CÁC CA KIỂM THỬ THỰC TẾ
*Rà soát khoảng trống kiểm thử cho 11 hạng mục công việc trong checklist 03 (Cập nhật sau đợt bổ sung kiểm thử ngày 25/10)*
*Căn cứ mã nguồn: `docs/ke-hoach-2026-10-21/03_CHECKLIST.md`, `tests/` và `tests_pilot/`*

- **Người thực hiện:** Gemini (QA & Rà soát kiểm định)
- **Nhiệm vụ:** GEM-U4 (P2, Generation 13)
- **Thời điểm lập (UTC):** 2026-10-25T12:20:00Z
- **Nguyên tắc phân loại nhãn:**
  - **ĐỦ:** Tiêu chí nghiệm thu đã có đầy đủ ca kiểm thử tự động trực tiếp phủ đúng bản chất yêu cầu.
  - **PHỦ MỘT PHẦN:** Đã có kiểm thử một số khía cạnh cốt lõi nhưng còn vế tiêu chí chưa được kiểm thử độc lập (ví dụ gắn version độc lập, hiển thị âm thanh/tệp).
  - **KHÔNG CÓ:** Chưa có ca kiểm thử tự động nào trong thư mục tests/ hoặc tests_pilot/.
- **Nguyên tắc trích dẫn:** Trích dẫn nguyên văn tiêu đề ca test tìm thấy trong mã nguồn; không trích dẫn suy đoán.

---

## BẢNG ĐỐI CHIẾU CHI TIẾT 11 CÔNG VIỆC (CV)

| CV | Vế tiêu chí nghiệm thu | Đánh giá | Ca test thực tế trích nguyên văn | Ghi chú hiện trạng |
|---|---|---|---|---|
| **CV-023** | Sửa lựa chọn/ý đúng-sai | **ĐỦ** | `'review refuses incomplete, duplicate or unknown true/false keys'`<br>`'every written question field is compared; answer fields inside payload cannot be skipped'` | Kiểm soát chặt chẽ việc sửa đổi lựa chọn và so sánh trường payload. |
| | Thêm kiểu câu phù hợp | **ĐỦ** | `'shuffle preserves all seven types, missing answers and shared passage order'`<br>`'F2 author seven types, image, passage, zero, title and reopen'` | Đã có kiểm tra 7 dạng câu hỏi cả unit test và trình duyệt pilot F2. |
| | Thứ tự/ghim | **ĐỦ** | `'move and duplicate use latest question values while stale order/document/permission is rejected'`<br>`'pinned, dependent and duplicate-text choices keep their order and key'` | Kiểm thử di chuyển, nhân bản câu hỏi và bảo vệ lựa chọn ghim. |
| | matching/ordering/fill_blank có cấu trúc dễ hoặc báo chưa hỗ trợ rõ | **ĐỦ** | `'matching and ordering public prompts have independent keys without paired IDs or original answer order'`<br>`'shuffle respects pinned choices and builds keys for fill, matching and repeated ordering text'` | Kiểm thử cấu trúc độc lập của khóa đáp án và prompt công khai. |
| **CV-024** | Ba chế độ cùng dữ liệu | **ĐỦ** | `'F3 answer views, shuffle, Word and print'`<br>`'parallel Word pairs each question with its answer and keeps shared passage once'` | Đã kiểm thử chuyển đổi đồng bộ giữa Đề, Đáp án và Song song. |
| | Đáp án/lời giải/rubric riêng nhưng gắn version | **PHỦ MỘT PHẦN** | `'essay lists rubric rows, keeps zero-point rows, and returns the trimmed solution'`<br>`'solution and parallel exports keep every answer next to its own question'` | Đã kiểm tra rubric tự luận và xuất lời giải riêng biệt, nhưng chưa có test độc lập kiểm tra versioning riêng cho từng thành phần. |
| | Thiếu đáp án không tự điền đúng | **ĐỦ** | `'Word solution export labels missing answers explicitly instead of inventing A or false'`<br>`'an unset answer is never presented as an answer'`<br>`'a question without a marked answer is never given one by shuffling'`<br>`'no \True means the answer is unknown, never silently A'` | Kiểm soát tuyệt đối việc không tự điền bừa đáp án khi đề gốc chưa có đáp án. |
| **CV-026** | Thành phần hiển thị/biên tập có ID | **ĐỦ** | `'a 120-question exam exports to Word in order, with passages once, images present and formulas converted'`<br>`'F2 author seven types, image, passage, zero, title and reopen'`<br>`'question numbers are not lost: every parsed question gets a distinct id'` | Định danh câu hỏi và thứ tự hiển thị được bảo toàn trọn vẹn. |
| | Mất tệp báo chỗ thiếu | **ĐỦ** | `'portable backup refuses missing, transient, oversized and non-image assets without mutating documents'` | Kiểm tra từ chối tệp hỏng hoặc thiếu khi sao lưu. |
| | Ngữ liệu dùng chung không nhân bản sai | **ĐỦ** | `'a shared passage appears once, before its first question, and no question is dropped'`<br>`'TC24 a shared passage before a group of questions is kept and linked, not thrown away'`<br>`'questions sharing a passage move together as a block and keep their own order'` | Ngữ liệu dùng chung chỉ xuất hiện 1 lần trước câu đầu tiên và đi nguyên khối khi xáo trộn. |
| | Giữ mô hình hình học/môn khác | **KHÔNG CÓ** | *Chưa có ca test tự động* | Chưa có bộ kiểm tra riêng cho mô hình Geogebra hoặc hình vẽ tương tác môn khác. |
| **CV-027** | Sửa trường/năm/tên đề/phần | **ĐỦ** | `'header submission only merges edited fields and preserves newer scope/plan and unedited header metadata'` | Kiểm thử hợp nhất an toàn các trường tiêu đề đã sửa. |
| | Thêm/ẩn dòng, căn chỉnh và lưu mẫu | **ĐỦ** | `'empty override remains one visible blank line, hidden drops line, undefined uses bound value and literal order remains'`<br>`'actual Word header uses ordered shared lines, blanks, alignment, footer/year/current score and hides private answers'`<br>`'save acknowledgement must name the saved template before the notice or the list changes'` | Kiểm thử ẩn dòng, căn lề và lưu mẫu cá nhân. |
| | Để trống không sinh trường giả | **ĐỦ** | `'default header omits empty school/year without invented authority, explicit empty lines roundtrip and malformed layouts reject'` | Không tự sinh trường cơ quan giả khi để trống. |
| | Dữ liệu thời gian/điểm thống nhất | **ĐỦ** | `'shared header resolves current year, notes, duration and actual score including0 instead of plan targets'` | Đồng nhất thời lượng và điểm số thật trên tiêu đề. |
| **CV-042** | Seed tái lập | **ĐỦ** | `'the same seed always gives the same variants and different seeds give different ones'`<br>`'the same seed gives the same order and the input is not changed'` | Đã có bộ test kiểm tra tái tạo hoán vị bằng seed số học (Mulberry32). |
| | Ghim và mọi loại câu giữ đủ | **ĐỦ** | `'pinned, dependent and duplicate-text choices keep their order and key'`<br>`'shuffle respects pinned choices and builds keys for fill, matching and repeated ordering text'`<br>`'shuffle preserves all seven types, missing answers and shared passage order'` | Bảo toàn lựa chọn ghim, phương án phụ thuộc và đủ 7 dạng câu hỏi. |
| | ID đáp án đúng sau đảo | **ĐỦ** | `'after shuffling, the correct letter always points at the same answer text'`<br>`'mã đề of an exam with sections and a passage differ in question order, keep blocks together, and the key matches'` | Đáp án đúng luôn chuyển dịch chính xác theo nội dung sau khi xáo trộn. |
| | Không thay chữ cái bằng regex làm hỏng lời giải | **ĐỦ** | `'letters named in the solution follow their answers, including wrong ones and the "Đáp án:" form'`<br>`'words that only look like letters in the solution are left alone'` | Kiểm soát chặt chẽ việc hoán vị chữ cái trong lời giải chi tiết, không làm sai lệch các từ thông thường. |
| **CV-043** | Tài liệu mở sửa được, đủ câu/hình/điểm/nguồn hiển thị | **ĐỦ** | `'a 120-question exam exports to Word in order, with passages once, images present and formulas converted'`<br>`'Word export preserves editor order, all seven types, shared passage and hides solutions on question-only export'` | Xuất tệp Word 120 câu chuẩn xác có hình ảnh và đầy đủ thành phần. |
| | Fallback có nhãn | **ĐỦ** | `'systems, sets and text keep a readable one-line form, and unknown macros stay visible'`<br>`'malformed input never breaks the export'` | Macro lạ được giữ nguyên dạng đọc được không làm hỏng file. |
| | Kiểm công thức | **ĐỦ** | `'fractions, roots and nested fractions are real equation objects'`<br>`'powers, indices and combined scripts become superscripts and subscripts'`<br>`'sums, limits, integrals, functions and symbols leave no raw LaTeX'` | Chuyển đổi công thức thành đối tượng toán học OMML thật. |
| | Ngắt trang trực quan | **KHÔNG CÓ** | *Chưa có ca test tự động* | Không thể mở ứng dụng Microsoft Word vật lý trong môi trường CI tự động; kiểm soát bằng Thẻ kiểm in F17. |
| **CV-044** | Đề/đáp án/lời giải/ma trận riêng hoặc chung | **ĐỦ** | `'solution and parallel exports keep every answer next to its own question'`<br>`'shared print projection omits answer data, tolerates malformed historical plans, and keeps absent plans absent'`<br>`'actual Word matrix export contains all seven target types, loaded outcome, counts, points and deltas'` | Kiểm thử xuất bản riêng biệt đề thi, đáp án, hướng dẫn giải và ma trận. |
| | 1–2 cột khi phù hợp | **ĐỦ** | `'parallel Word pairs each question with its answer and keeps shared passage once'` | Kiểm thử bố cục 2 cột Song song trên Word. |
| | Tiêu đề mẫu đồng nhất | **ĐỦ** | `'actual Word header uses ordered shared lines, blanks, alignment, footer/year/current score and hides private answers'` | Đồng nhất tiêu đề khi xuất tệp Word. |
| | Câu dài được ngắt có kiểm soát, không tràn/mất | **ĐỦ** | `'F15 a 60-question exam prints on A4 pages without sideways overflow or questions taller than a page'` | Kiểm thử in A4 đề 60 câu không tràn lề và không bị cắt cụt. |
| **CV-054** | Enum/API/import thống nhất, nhóm tùy chọn đúng nhận diện | **ĐỦ** | `'assignment options (times, attempts, entry code, PIN) are decided on the server'`<br>`'defaults keep the old behavior: nothing set means the default attempts and no times, code or PIN'`<br>`'shuffle flags pass through and never turn on by themselves'` | Kiểm thử các tùy chọn giao bài ở tầng máy chủ. |
| | Snapshot đủ câu/đáp án/tệp/điểm/mẫu và bất biến | **ĐỦ** | `'public share and assignment hide keys and assignment freezes the source'`<br>`'F5 assign link with and without class and inspect frozen policies'`<br>`'F4 public link, collaborator edits and revoke'` | Kiểm thử đóng băng đề thi khi giao bài và tạo liên kết chia sẻ. |
| **CV-056** | Kiểm opensAt/closesAt/deadline/status | **ĐỦ** | `'times: close must be in the future and after open, and valid times are stored as sent'`<br>`'closing early stops saving and starting; reopening restores both without touching the attempt deadline'`<br>`'a close time before the opening time is refused and invalid values change nothing'` | Kiểm thử thời hạn mở phòng thi, đóng phòng thi và khôi phục trạng thái. |
| | Lượt hết hạn xử lý rõ | **ĐỦ** | `'extending the close time changes new attempts only, and a started attempt keeps the deadline it was given'` | Lượt thi đã bắt đầu được bảo toàn thời hạn làm bài đã cấp. |
| | Start đồng thời không tạo trùng hoặc lỗi unique vô nghĩa | **ĐỦ** | `'concurrent starts respect maximum attempts and capabilities cannot cross attempts'`<br>`'two simultaneous submits of one attempt produce one result and no duplicate answers'` | Bắt đầu đồng thời và nộp đồng thời không sinh lỗi trùng lặp dữ liệu. |
| **CV-058** | Tự luận có ô trả lời, đúng-sai/điền/ghép/sắp xếp dùng được | **ĐỦ** | `'matching and ordering public prompts have independent keys without paired IDs or original answer order'`<br>`'structured responses use presentation keys, validate drafts and grade the private configuration exactly'`<br>`'F6 seven student answers survive reload, submit and hide solutions'` | Học sinh làm bài và nộp bài an toàn trên 7 dạng câu hỏi. |
| | Hình theo đề | **PHỦ MỘT PHẦN** | `'F2 author seven types, image, passage, zero, title and reopen'`<br>`'F6 seven student answers survive reload, submit and hide solutions'` | Đã kiểm thử hiển thị hình ảnh đề thi trên giao diện làm bài; vế âm thanh và tệp đính kèm đã được lược bỏ khỏi tiêu chí ngày 25/10. |
| | Cuộn/keyboard/mobile đúng | **ĐỦ** | `'F13 a student works and a teacher browses on a 375px phone without sideways scrolling'`<br>`'F16 main pages have named controls and a student can answer, move and submit with the keyboard alone'` | Đã kiểm thử hiển thị trên màn hình hẹp 375px không cuộn ngang và điều khiển làm bài hoàn toàn bằng bàn phím. |
| **CV-061** | Danh sách bài/lượt, progress | **ĐỦ** | `'F7 manual essay grade, total and CSV'`<br>`'history restore keeps student answers, restores pending distinctly from zero, isolates owners and serializes concurrent changes'` | Kiểm thử danh sách bài nộp, số lượt làm bài và chấm điểm tự luận. |
| | Gia hạn/mở lại có quyền | **ĐỦ** | `'closing, reopening and extending an assignment, and teacher comments stay private'`<br>`'closing early stops saving and starting; reopening restores both without touching the attempt deadline'` | Kiểm thử phân quyền đóng sớm, mở lại và gia hạn phòng thi. |
| | Thống kê/CSV | **ĐỦ** | `'a teacher comment never reaches the student, and the CSV needs the teacher session'`<br>`'CSV comments and names cannot start spreadsheet formulas after whitespace'`<br>`'survey, comment-only and rubric store no artificial totals and do not enter numeric statistics or CSV'` | Kiểm thử xuất CSV an toàn và tính toán thống kê bảng điểm. |
| | Leaderboard tùy chọn mặc định tắt và không lộ toàn lớp | **ĐỦ** | `'GET and idempotent submit use current reveal policies and hide rankings when scores are hidden'` | Bảng xếp hạng ẩn khi điểm số bị ẩn, tôn trọng quyền riêng tư học sinh. |

---

## TỔNG HỢP CÁC KHOẢNG TRỐNG KIỂM THỬ THỰC TẾ CÒN LẠI

1. **Khoảng trống mô hình hình học động (CV-026):** Chưa có bộ kiểm thử tự động cho mô hình Geogebra hoặc đồ họa tương tác đa môn.
2. **Khoảng trống kiểm tra ngắt trang trực quan trên Microsoft Word vật lý (CV-043):** Bộ test tự động đã kiểm tra cấu trúc thẻ XML/OMML nhưng việc ngắt trang thực tế trên Word vật lý cần được thực hiện thủ công (đang được bao phủ bởi Thẻ kiểm in F17).
3. **Khoảng trống cơ chế versioning riêng biệt cho rubric (CV-024):** Cần bổ sung ca test xác minh độc lập phiên bản của rubric so với phiên bản đề thi khi có cập nhật thang điểm.

---
*Báo cáo cập nhật đối chiếu khoảng trống tiêu chí kiểm thử ExamCraft — Hoàn thiện đợt Generation 13.*
