# Claude — đợt dài, generation10

Task CLAUDE-CONTINUOUS-BATCH, source of assignment ASSIGNMENTS.json. Dùng worktree F:/Workspace/Zazz/ExamCraft/tmp/ai-claude-grade-history, nhánh ai/claude-grade-history. Base của đợt bắt đầu d75bbea; nếu đã có WIP nhiệm vụ8 thì giữ và hoàn thành trong C01, không reset hay làm lại. Template4/memory6 đã tích hợp; không sửa lại. Đọc docs/phoi-hop-ai/03_HANG_DOI_LIEN_MACH.md. Tất cả tệp code dưới đây thuộc worktree; đường dẫn báo cáo dưới qa/ là checkout chính.

Đây là hàng đợi đã được phép làm, không phải lời mời tự mở rộng sản phẩm. Chỉ Codex mount component/API và kiểm runtime. Đọc guide Next cục bộ liên quan trước code. Không đọc toàn bộ lịch sử. Trước mỗi mục tra CV và đúng báo cáo đang có để tránh làm lại.

## C01 — hoàn thiện quản lý khóa AI (CV011/031/032)

Kế thừa CLAUDE_TASK_08.md, giữ nguyên phạm vi: src/components/ApiKeyModal.tsx; src/lib/key-modal-request-context.ts; tests/key_modal_request_context.test.ts. Đầu ra qa/ai-review/CLAUDE_KEY_MODAL_ASYNC.md.

- Pin account cho list/add/delete/toggle/test; gate theo lần mở/account/row ID; 401/ACCOUNT_CHANGED khóa và giữ form, không dùng owner mới để retry. Mọi receipt/finally/auth-error theo token cũ, StrictMode không lock/unbusy gate mới.
- Form lỗi/biên nhận muộn không mất key/tên mới. Không log/xuất/lưu localStorage key. Chỉ request test khi bấm; không chạy test/provider thật. Không suy quota/free/paid từ key. Không hứa idempotency nếu backend chưa có.
- Unit thuần các quyết định context/draft; lint phạm vi/tsc. Báo ca Codex cần kiểm HTTP/UI. Bàn giao scoped SHA mới sau d75bbea, không amend commit đã nộp.

## C02 — nháp chấm điểm/nhận xét có đường khôi phục (CV010/060/061)

Độc lập C01; được bắt đầu sau khi đóng băng bàn giao C01, không cần chờ tích hợp C01. Chỉ tạo: src/lib/teacher-grade-draft.ts; src/components/TeacherGradeDraftRecovery.tsx; tests/teacher_grade_draft.test.ts. Báo cáo qa/ai-review/CLAUDE_TEACHER_GRADE_DRAFT.md.

- Đọc TeacherGradeEditor, manual-grade-revision, grade-history-restore và journal học sinh/câu hỏi để khớp hợp đồng, không copy nguyên module hoặc đụng tệp đó. Đề xuất API helper + props component trong báo cáo trước/đồng thời code; parent do Codex nối sau.
- Journal riêng theo teacher/attempt/question/base manual-grade revision và writer. Giữ raw điểm như người dùng nhập (rỗng/0/invalid khác nhau), nhận xét và rubric state cần thiết; không tự đổi pending thành0, không tự gửi điểm server. Không đổi đề/snapshot/responses/audit.
- Có đọc/xem bản dự phòng/chọn áp dụng rõ ràng/tải raw nếu storage lỗi hoặc bản hỏng. Tài khoản/lượt/câu khác không lẫn, bản nền cũ chỉ đối chiếu không rebase ngầm. Nhiều tab không xóa bản của nhau; chỉ retire đúng writer/raw đã ACK, không thu gom dữ liệu cũ tự động. localStorage không giao dịch nguyên tử.
- Browser storage có thể bị chặn/full/JSON hỏng/legacy: giữ dữ liệu và cho parent tiếp server flow. Component phải nhỏ, nhãn dễ hiểu, không auto-save server/auto-restore điểm; props rõ owner/context, callback không áp dụng sang đích mới. Không lưu key/cookie.
- Unit hợp đồng thực: owner/attempt/question/base khác, writer khác, late receipt sau gõ thêm, 0/rỗng/false, storage denied/quota/malformed, export giữ nguyên raw. Không viết test chỉ lặp implementation. Báo rõ chưa UI/HTTP và hướng mount/CAS vào parent.

## C03 — nháp ghi chú AI riêng có khôi phục (CV010/064/069)

Độc lập C01/C02; chỉ tạo src/lib/memory-note-draft.ts; src/components/MemoryNoteDraftRecovery.tsx; tests/memory_note_draft.test.ts. Báo cáo qa/ai-review/CLAUDE_MEMORY_NOTE_DRAFT.md.

- Đọc AiLearningModal cùng sửa root hiện tại để thiết kế hợp đồng, không chép đè bản worktree cũ sang root. Mục tiêu title/insight/category/subject chưa lưu không mất khi reload; riêng theo owner+writer và manual-note context. Không lưu key, không gửi provider, không auto-bật/góp chung.
- Cơ chế lựa chọn/giữ raw/clear đúng ACK/storage failure như C02; phần dùng chung chỉ tạo khi chứng minh cần, không sửa helper hiện hữu thuộc Codex. Có thông tin đây là bản dự phòng trên trình duyệt dùng chung máy, không nói mã hóa nếu không có.
- Không tự khôi phục ghi chú accountA khi ownerB, không làm mất nháp mới vì ACK cũ. Khôi phục vào form là đề xuất phải xác nhận, chưa thành ghi chú server. Unit privacy/context/concurrent writer/malformed/offline storage và late ACK; báo hướng mount, UI còn chưa kiểm.

## C04 — thiết kế bản công bố tách khỏi nháp (CV030/048)

Chỉ đọc, không code/schema/migration. Đầu ra qa/ai-review/CLAUDE_PUBLICATION_DESIGN.md.

- Đọc route share/copy + SHARE_TRANSACTION_REVALIDATION hiện tại và tiêu chí CV030/048. Phân biệt link xem đề, bản công bố snapshot, bài giao snapshot, bản sao riêng; không đổi chính sách đáp án đã chốt.
- Đề xuất luồng chốt phiên bản/xem trước/tạo link/công bố bản mới/thu hồi/hết hạn. Bản nháp thay đổi không làm bản công bố đổi ngầm. Quyền riêng (sửa khác phát hành), ảnh được pin/quyền tệp, public allowlist, legacy links không mất.
- So sánh tối đa hai phương án data model và chọn phương án nhỏ phù hợp nhóm nội bộ. Nêu invariant/transaction ordering/concurrent copy-revoke/retention và rollout additive có backup/restore/rollback, không tự chạy. Ca nghiệm thu + các tệp cần thay + thứ tự tích hợp. Ghi điều chưa đủ nguồn, không mở nền tảng khác.

## C05 — thiết kế chấm lại/đính chính có xem trước (CV059/060/061)

Chỉ đọc, không code. Đầu ra qa/ai-review/CLAUDE_REGRADE_DESIGN.md. Đọc grading hiện có và báo cáo restore trước; không thiết kế lại từ đầu.

Phân biệt chỉnh điểm tay, khôi phục lịch sử, sửa đáp án snapshot và regrade có chủ đích. Giáo viên chọn phạm vi/lượt/câu + xem trước diff + xác nhận; snapshot bài cũ không đổi ngầm bởi ngân hàng. Manual override giữ hoặc đổi phải là lựa chọn tường minh, idempotency/CAS/audit, pending/0/false/blank, survey/comment_only/rubric, policy công bố độc lập. Đề xuất hợp đồng API/UI nhỏ, rollback bằng event mới chứ không xóa lịch sử; race grade/restore/submit + kiểm thử. Chỉ rõ phần cần chủ dự án quyết định, dùng mặc định đề xuất có lý do, không tự chốt thay.

## C06 — tổng hợp bàn giao kỹ thuật của đợt

Chỉ viết qa/ai-review/CLAUDE_BATCH_SUMMARY.md: bảng C01–C05, SHA/phạm vi/trạng thái review/link, giới hạn, thứ tự tích hợp và việc cần Codex. Không chép báo cáo dài hoặc số test; số liệu/log của worker đặt qa/rebuild-<ngày>/CLAUDE_BATCH_CHECKS.md (ghi tên mục/worktree/SHA, giữ lần lỗi nếu có).

## Duyệt/chờ

Đọc BATCH_REVIEWS.json và messages trước mỗi nhóm sửa/commit. Nộp xong mỗi mục thì gửi tin và làm tiếp mục độc lập; Codex sẽ review trong lúc làm việc riêng. Không sửa tệp đã đóng băng; khi CHANGES_REQUESTED mà chưa chuyển quyền thì tạo commit sửa mới. Khi RELEASED_FOR_INTEGRATION không đụng lại tệp. Làm hết C01–C06 mà review còn pending thì WAITING_REVIEW, phiên còn hoạt động đọc tin thưa; hết lượt ghi NEEDS_RESUME/WIP/bước tiếp, không tự báo DONE hay tự thức lại. Không mời user duyệt từng mục, không tự thêm C07.
