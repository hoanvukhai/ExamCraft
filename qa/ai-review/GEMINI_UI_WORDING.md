# RÀ SOÁT CÂU CHỮ GIAO DIỆN GÂY NGỢP VÀ HỨA QUÁ MỨC (UI WORDING AUDIT)
*Phiên bản Generation 5 (Mục G05 trong GEMINI-CONTINUOUS-BATCH) — Căn cứ mã nguồn thực tế tại commit bb14bee và working tree*

- **Người thực hiện:** Gemini (QA Tài liệu / Phối hợp đa AI)
- **Nhiệm vụ:** `G05` thuộc `GEMINI-CONTINUOUS-BATCH` (Generation 5, `ASSIGNMENTS.json`)
- **Thời điểm rà soát (UTC):** 2026-10-24T13:42:00Z
- **Baseline đối chiếu:** `bb14bee` kèm working tree hiện tại (`rebuild/2026-10-local`)
- **Đối tượng người dùng mục tiêu:** Giáo viên phổ thông (nhiều người ít rành kỹ thuật CNTT) và học sinh phổ thông làm bài thi trực tuyến.
- **Mục tiêu:** Phát hiện các chuỗi giao diện gây hoang mang, hứa hẹn quá mức về năng lực của AI, dễ gây nhầm lẫn giữa liên kết xem đề và phòng thi học sinh, hoặc để lộ chi tiết lỗi kỹ thuật backend. Đề xuất câu chữ thay thế ngắn gọn, thân thiện và chính xác.

---

## BẢNG TỔNG HỢP CÂU CHỮ VÀ ĐỀ XUẤT ĐIỀU CHỈNH

| STT | Tệp thành phần & Vị trí | Chuỗi nguyên văn đang hiển thị | Vì sao gây ngợp / khó hiểu / hứa quá mức | Câu ngắn đề xuất thay thế | Ngữ cảnh cần giữ |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `src/components/AiLearningModal.tsx:241` | `Bộ Não AI Sư Phạm & Tự Học` | Thổi phồng công nghệ ("Bộ Não AI ... Tự Học"). Thực chất đây là bảng lưu trữ các ghi chú phong cách sư phạm (`TeacherMemory`) do giáo viên nhập tay để bổ sung vào prompt context, AI không tự huấn luyện lại mô hình (fine-tuning). | `Ghi nhớ phong cách ra đề cho AI` hoặc `Sổ tay quy tắc sư phạm cho AI` | Tiêu đề chính của modal quản lý phong cách sư phạm giáo viên. |
| **2** | `src/components/AiLearningModal.tsx:374` | `Chỉ dẫn chi tiết cho AI (AI sẽ áp dụng chính xác chỉ dẫn này khi sinh đề):` | Cam kết tuyệt đối "AI sẽ áp dụng chính xác chỉ dẫn này". LLM là mô hình xác suất, có thể bỏ sót quy tắc phức tạp. Giáo viên sẽ chủ quan không rà soát lại câu hỏi do AI tạo ra. | `Yêu cầu cụ thể để AI tham khảo khi tạo câu hỏi (Thầy/Cô vui lòng rà soát lại kết quả):` | Nhãn hướng dẫn trường nhập nội dung phong cách mới. |
| **3** | `src/components/ApiKeyModal.tsx:220` | `<button ...>Đọc danh mục</button>` | Khó hiểu: Người dùng không biết "Đọc danh mục" là làm gì. Bản chất nút này gọi `/api/user/keys/test` để kiểm tra khóa có hợp lệ không và nạp danh sách model Gemini được cấp phép. | `<button ...>Kiểm tra khóa & đọc model</button>` | Nút kiểm tra trạng thái hoạt động của từng khóa trong danh sách. |
| **4** | `src/components/ShareModal.tsx:213` | Tiêu đề chung: `Chia Sẻ & Giao Bài Thi Trực Tuyến`<br>Tab 1: `Giao cho học sinh`<br>Tab 2: `Chia sẻ` | Dễ gây nhầm lẫn nghiêm trọng: Nhiều giáo viên nhầm lẫn giữa **link giao bài cho học sinh thi** (`/a/[publicId]`) và **link chia sẻ đề cho đồng nghiệp** (`/share/[id]`). Nếu gửi nhầm link chia sẻ, học sinh sẽ thấy trước toàn bộ lời giải và nút tải file Word. | Đổi tiêu đề rõ ràng:<br>- Tab 1: `Tạo phòng thi cho học sinh`<br>- Tab 2: `Chia sẻ đề cho đồng nghiệp xem / copy` | Hộp thoại điều phối giao bài và chia sẻ đề thi. |
| **5** | `src/components/ShareModal.tsx:527` | `Người mở link chỉ có thể xem, in ấn hoặc tải file Word .docx, hoàn toàn không sửa được bản gốc của Thầy/Cô.` | Thiếu thông tin quan trọng: Không nói rõ nếu người nhận cũng có tài khoản giáo viên, họ có nút "Sao chép đề vào kho của tôi" để nhận bản sao độc lập, tránh hiểu lầm là tính năng sao chép bị khóa hoàn toàn. | `Người nhận có thể xem, tải file Word hoặc sao chép một bản riêng vào kho của họ; bản gốc của Thầy/Cô hoàn toàn không bị ảnh hưởng.` | Dòng chú thích quyền hạn trên màn hình chia sẻ đề công khai. |
| **6** | `src/components/ExamWorkspace.tsx:332` | Trạng thái hiển thị: `Có thay đổi đang chờ lưu` | Dễ gây hiểu lầm là hệ thống "đang tự động lưu ngầm", giáo viên yên tâm tắt trình duyệt dẫn đến mất dữ liệu vừa sửa. Cần thúc đẩy hành động bấm nút Lưu rõ ràng hơn. | `Có thay đổi chưa lưu lên máy chủ — Hãy bấm nút "Lưu đề"` | Thanh chỉ báo trạng thái lưu trên thanh công cụ soạn thảo. |
| **7** | `src/app/a/[publicId]/page.tsx:447-448` | `Nháp trên máy chủ đã thay đổi ở trang khác...` kèm mã `DRAFT_CONFLICT` / `DRAFT_REVISION_REQUIRED` | Dùng thuật ngữ kỹ thuật backend ("nháp máy chủ", "revision conflict", "draft revision"). Học sinh phổ thông đang làm bài thi sẽ hoang mang, không hiểu cần phải làm gì để không bị mất bài. | `Bài làm đang mở ở cửa sổ khác hoặc đã lưu bản mới hơn. Em hãy giữ nguyên trang này và bấm "Tải bản sao lưu" trước khi mở lại.` | Thông báo lỗi khi phát hiện xung đột dữ liệu giữa hai tab làm bài. |
| **8** | `src/components/StudentDraftRecovery.tsx:31` | Hiển thị chuỗi JSON thô trong khung: `<textarea ... value={entry.raw} />` | Học sinh nhìn thấy chuỗi mã nguồn JSON thô (ví dụ: `{"q1":"A","q2":{"a":true}}`) dễ tưởng trang web bị lỗi mã nguồn hoặc bị virus tấn công, gây hoảng sợ trong lúc thi. | Thay vì hiển thị raw JSON thô, nên tóm tắt trực quan: `Bản sao lưu gồm ${Object.keys(entry.value?.answers || {}).length} câu trả lời (Lưu lúc ${entry.value?.savedAt})`, nút bấm xem chi tiết dạng bảng thân thiện. | Khung hiển thị bản nháp đối chiếu phục hồi sau sự cố mạng. |
| **9** | `src/app/teacher/assignments/[id]/page.tsx:41` | Trạng thái: `Điểm câu này: ... / pending ? "Chưa chấm" : ""` | Ở các bài tập khảo sát (`assessmentMode = 'survey'`) hoặc bài đánh giá nhận xét (`comment_only`), ô điểm số hiển thị "Chưa chấm" gây hiểu nhầm là giáo viên chưa hoàn thành nhiệm vụ, trong khi bản chất bài đó không chấm điểm số. | Với bài khảo sát/nhận xét: Hiển thị nhãn cố định `Đánh giá định tính` hoặc `Chế độ nhận xét`, ẩn ô nhập điểm số. | Trình soạn thảo chấm điểm và nhận xét của giáo viên (`TeacherGradeEditor`). |
| **10** | `src/components/ExamWorkspace.tsx:517` | `Thầy/Cô có thể bắt đầu tạo đề bằng cách nhờ AI sinh tự động theo ma trận hoặc tự thêm các câu hỏi thủ công.` | Dùng từ "sinh tự động theo ma trận" dễ khiến giáo viên kỳ vọng AI tự ráp đề hoàn chỉnh 100% không cần can thiệp. | `Thầy/Cô có thể tạo khung đề bằng cách nhờ AI gợi ý câu hỏi theo cấu trúc, hoặc tự soạn từng câu hỏi.` | Hướng dẫn màn hình trống khi mới tạo đề thi chưa có câu hỏi. |

---

## II. NGUYÊN TẮC HƯỚNG DẪN KHI CODEX TÍCH HỢP ĐIỀU CHỈNH

1. **Giữ nguyên mã logic kỹ thuật:** Báo cáo này chỉ đề xuất câu chữ hiển thị (UI labels, placeholders, warning messages); không can thiệp vào các mã định danh nội bộ (`status`, `assessmentMode`, mã lỗi HTTP, `code: DRAFT_CONFLICT`).
2. **Ưu tiên sự an tâm của người dùng:**
   - Với giáo viên: Giúp phân định rạch ròi giữa việc "lưu cục bộ" và "lưu lên máy chủ", giữa "link chia sẻ tài liệu" và "link phòng thi".
   - Với học sinh: Khi gặp sự cố mạng hoặc xung đột tab, hướng dẫn rõ ràng "giữ nguyên trang" và "tải bản sao lưu", tuyệt đối không dùng mã lỗi kỹ thuật làm học sinh bối rối.
