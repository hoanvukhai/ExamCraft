# Đánh giá sau Codex: bớt trùng lặp, bớt khái niệm (28/10/2026)

Đã đọc: hai commit của Codex (`2681af8` gộp thư mục vào Kho đề, `771e736` hồ sơ), menu, `LibraryFolders`, `TeacherDashboard`, thanh công cụ bàn soạn, danh sách tệp.

## Codex làm đúng (giữ nguyên)

- Gộp "Thư mục" vào Kho đề: một trang, thư mục ở trên, đề ở dưới. `/teacher/folders` chỉ còn chuyển hướng. Đúng hướng, bớt một khái niệm.
- Menu còn 5 đích: Kho đề, Ngân hàng câu hỏi, Lớp học, Bài đã giao, Thùng rác. Không còn nhóm gập.
- Tạo đề trong thư mục đang mở mang theo thư mục; không cần thêm cột DB.

## Còn trùng / còn rối (nên xử lý tiếp, theo thứ tự ưu tiên)

1. **Mã chết:** `ExamCopilotBar.tsx` (350 dòng) không ai import. Xóa. (Không còn tệp nào khác trong `src/components` bị bỏ không.)
2. **Bốn thứ "AI" cho giáo viên:** Trợ lý sửa đề (Copilot, bàn soạn), Thư ký AI (hỏi đáp), Bộ não AI (ghi chú), Khóa AI. Với người dùng là "AI ở đâu?". Gợi ý: một nút "Trợ lý AI" ở thanh phải, mở một ngăn có hai tab (Hỏi đáp | Sửa đề trong bàn soạn); "Ghi chú cho AI" và "Khóa AI" gom vào menu tài khoản (avatar) vì ít dùng.
3. **Hai bản hộp thoại khóa AI:** `WorkspaceContext` đã có `ApiKeyModal`, `ExamWorkspace` vẫn tự dựng thêm một cái (cho biểu ngữ "chưa có khóa"). Dùng `openKeys()` của context, bỏ bản trong ExamWorkspace.
4. **Ba cách tạo đề cùng lúc ở Kho đề:** nút "Soạn đề thi mới" ở menu, các nút Soạn trống / AI sinh / Nhập Word ở đầu trang, rồi cùng ba việc đó lặp lại trong bàn soạn (thanh công cụ). Gợi ý: menu giữ MỘT nút "Tạo đề mới" mở lựa chọn (Trống | Từ AI | Từ Word/ảnh); đầu trang Kho đề chỉ giữ đúng một nút này, không lặp.
5. **Bàn soạn có quá nhiều bảng chồng:** LocalDraftsPanel, QuestionDraftPanel, AiProposalJournalPanel, ExamReviewPanel, ExamStructureEditor, ExamTemplatePanel, KnowledgeScopeEditor, ExamPlanEditor. Gợi ý: để việc "cài đặt đề" (cấu trúc, mẫu, phạm vi kiến thức, kế hoạch) vào MỘT ngăn "Thiết lập đề" xổ ra; các bản nháp/đề xuất AI vào MỘT mục "Bản nháp & đề xuất". Đây là việc của đợt "sửa bàn soạn".
6. **Chia sẻ / Giao bài / Lớp học:** "Chia sẻ & Thi Online" (bàn soạn) rồi "Bài đã giao", "Lớp học" ở menu, cộng chia sẻ cho đồng nghiệp. Là ba khái niệm với người dùng. Gợi ý: nút trong bàn soạn đổi thành "Giao bài" (chọn lớp hoặc tạo link) và "Mời đồng nghiệp" tách riêng; menu giữ Lớp học + Bài đã giao.
7. **Tệp quá lớn:** `TeacherDashboard` 850 dòng, `ExamWorkspace` 685, `ImportModal` 684, `ShareModal` 584, `AiLearningModal` 548. Tách khi sửa từng trang, đừng tách riêng chỉ để tách.
8. **Màu viết cứng:** 3.128 chỗ, còn trong từng trang; giảm dần khi sửa từng trang (cổng kiểm `check-ui-tokens.cjs` chỉ cho giảm).

## Việc cho phiên sau (Gemini hoặc tôi)

Làm một mục một lần, kiểm trên bản dựng riêng, không đụng cổng 3117 khi khóa còn của người khác:
1) xóa `ExamCopilotBar`; 2) bỏ hộp khóa trùng; 3) gộp nút tạo đề; 4) gom AI vào một ngăn; 5) rồi mới sang bàn soạn (mục 5, 6).
Giữ: tên/tiêu đề mà test đang dùng (xem `tests_pilot`), quy tắc không đụng DB chính, không đẩy `main` khi chưa hỏi.

## Đã xử lý (28/10/2026)

- Mục 1: xóa `ExamCopilotBar.tsx`.
- Mục 3: `ExamWorkspace` dùng `hasActiveKey`/`openKeys` của khung chung; bỏ bản `ApiKeyModal` và đoạn nạp khóa trùng.
- Mục 4 (một phần): ở trang Kho đề, menu không còn nút "Soạn đề thi mới" (trùng nút "Tạo đề" đầu trang); các trang khác vẫn có. AI soạn đề / Nhập Word vẫn nằm đầu Kho đề và trong bàn soạn.
- Kiểm trên bản dựng riêng, cổng 3122, DB thử: `--library` 6/6, `--teacher` 7/7, `--admin` 11/11, F9, F19, F21 đạt; kiểm kiểu sạch, lint 0 lỗi.
- Chưa làm (để đợt sau cùng giao diện bàn soạn): mục 2 gom AI (test đang dựa vào tiêu đề các nút ở thanh phải), mục 5, 6, 7.
