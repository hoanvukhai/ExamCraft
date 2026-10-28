# Phân tích trang soạn đề (28/10/2026) — giao Codex

Nguồn: `ExamWorkspace.tsx` (652 dòng), `EditorToolbar.tsx`, `RightCompanionRail.tsx`. Chỉ phân tích, chưa sửa.

## Hiện trạng: từ trên xuống dưới một đề mở ra có
1. Header (tên đề, trạng thái lưu, Chia sẻ).
2. Toolbar: Sửa đề bằng AI, Ngân hàng, Nhập đề, Sinh đề AI, menu Đề thi, menu Xuất, Bảng điểm, Cùng soạn, nhãn quyền.
3. ExamReviewPanel (nếu ready) + thanh trạng thái lưu (hiện khi chưa "saved").
4. Trong cột cuộn: LocalDraftsPanel, QuestionDraftPanel, AiProposalJournalPanel, banner thiếu khóa AI, tab điện thoại.
5. Cột trái: thẻ tiêu đề danh sách (Chọn tất cả / Lưu đề / Thêm câu) rồi ExamStructureEditor, ExamTemplatePanel, KnowledgeScopeEditor, ExamPlanEditor, rồi mới tới các câu hỏi. Cột phải: A4Preview.

## Vấn đề
1. **Câu hỏi bị đẩy xuống dưới 4 khối thiết lập.** Cột trái mở ra thấy cấu trúc/mẫu/phạm vi/kế hoạch trước câu hỏi — việc chính (soạn câu) nằm sau việc phụ. Đề xuất: gom 4 khối vào một mục "Thiết lập đề" thu gọn mặc định (nhớ trạng thái), câu hỏi lên đầu.
2. **Ba tầng thông báo xếp chồng trước nội dung** (ReviewPanel, thanh lưu, LocalDrafts/QuestionDraft/AiProposalJournal). Khi có cả ba, vùng soạn bị đẩy xuống. Đề xuất: một dải "Cần chú ý" gom lại, mỗi mục thu gọn được; chỉ trạng thái lỗi/xung đột mới nổi.
3. **Hai nơi lưu trùng nhau:** nút "Lưu đề" ở thẻ danh sách và trạng thái lưu ở Header. Giữ một nút lưu (Header), bỏ nút trong thẻ; "Thêm câu" đưa xuống cuối danh sách và/hoặc dính cạnh danh sách.
4. **Toolbar nhiều nút ngang bằng nhau.** Sửa đề bằng AI, Sinh đề AI Mới, Nhập đề đều là "tạo/sửa bằng AI/tài liệu" nhưng tách rời; "Sinh đề AI Mới" trên đề đã có câu dễ bấm nhầm. Đề xuất: nhóm "Thêm câu" (Ngân hàng, Nhập, Sinh AI) thành một menu; Sinh AI hỏi xác nhận khi đề đã có câu.
5. **Mã phình và lệch kiểu.** ExamWorkspace còn trộn màu cứng (`#dadce0`, `#202124`, ~25 `dark:`) với biến `--ui-*` ở các tệp mới; không đổi theme đồng bộ. Hợp nhất sang biến `--ui-*` ở các khối đang sửa; tách thẻ tiêu đề và danh sách câu ra component riêng cho ExamWorkspace nhỏ lại.
6. **Quyền xem/chỉ góp ý:** `fieldset disabled` chặn mọi ô; cần kiểm người chỉ góp ý vẫn bình luận được và đọc được toàn bộ (kiểm bằng tay).
7. **Còn nợ từ đợt trước:** chạy trình duyệt thật 1024–1440px với menu + chat mở; nút Danh sách/A4 theo bề rộng vùng giữa; bàn phím/Tab trong bảng sửa đề.

## Thứ tự giao Codex (mỗi bước một commit nhỏ, test:frame + F19 + F21 đạt)
A. Gom thiết lập đề thu gọn (mục 1). B. Dải "Cần chú ý" (mục 2). C. Bỏ trùng nút lưu, di chuyển "Thêm câu" (mục 3). D. Menu "Thêm câu" + xác nhận Sinh AI (mục 4). E. Dọn màu/tách component (mục 5), không đổi hành vi.

## Giữ nguyên
Không đổi schema/API/logic lưu/AI. Không đụng DB chính. Mỗi thay đổi bố cục phải có ảnh 1024/1440 và 375, sáng/tối. Chạy pilot phải ghi ra thư mục `qa/rebuild-<ngày>/` riêng, không ghi đè `qa/rebuild-2026-10-25/`.
