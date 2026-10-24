# Claude — đợt 2: khôi phục điểm từ lịch sử và soạn nhận xét an toàn

Gốc chung F:/Workspace/Zazz/ExamCraft. Đọc AGENTS.md, docs/ban-giao/00_DOC_TRUOC.md, 02_TRANG_THAI_TIEP_NOI.md, docs/phoi-hop-ai/02_QUY_UOC_PHOI_HOP.md, ASSIGNMENTS.json và tin gửi mình. Nhiệm vụ mới `CLAUDE-GRADE-RESTORE-AND-COMMENTS`, assignment_generation 2. Chủ dự án vừa yêu cầu giao thêm việc lớn cho bạn. Không đọc lại cả hồ sơ/chat.

## Đích và tệp

Tiếp chính worktree `tmp/ai-claude-grade-history`, nhánh `ai/claude-grade-history` từ commit đã giao ca738712aed01604a4d4072733cb9dea33ae8e5b. Không reset/clean. Kiểm working tree trước; giữ WIP nếu có. Codex đã tích hợp paging thành 2fdfa1c; không gửi lại commit paging. Làm tiếp trên ca73871, chỉ gửi các commit MỚI sau mốc đó.

Chỉ sửa 5 tệp trong allowed_code của ASSIGNMENTS. Được thêm component TeacherGradeEditor nếu cần để giữ state ô nhập; helper/test mới grade-history-restore. Không sửa package.json, test HTTP, schema, dữ liệu, báo cáo chung/checklist, student journal hoặc tệp Codex/Gemini. Ghi báo cáo riêng tại gốc chung `qa/ai-review/CLAUDE_GRADE_RESTORE_AND_COMMENTS.md`, status/tin của mình tại gốc chung. Codex đang giữ build/server/DB/provider; bạn chỉ chạy unit thuần, typecheck/lint tệp liên quan nếu không tranh runtime. Không install/generate hoặc build Next.

## Làm liền mạch cả ba phần, commit theo phần nếu hợp lý

1. **CV060: khôi phục một trạng thái điểm/nhận xét từ sự kiện lịch sử đã chọn.** Có xem trước trước/sau và nút xác nhận rõ, không click lịch sử là ghi ngay. Dùng ID sự kiện + phía before/after + token nền điểm hiện tại; server tự đọc AuditLog và kiểm đúng action attempt.grade, targetType Attempt, targetId của lượt, questionKey thuộc snapshot. Không tin earned/comment/history meta do client gửi để khôi phục. Cùng account pin/same-origin/owner/SUBMITTED/row-lock/transaction như chấm tay. Nền cũ trả409, không tự refresh token rồi retry đè điểm mới. Bảo toàn response học sinh, snapshot, sự kiện cũ; tạo sự kiện attempt.grade MỚI cùng transaction, có reference ID/side đã khôi phục và before/after/scoreBefore/After. Tổng điểm/needsGrading tính lại bằng helper hiện có, không ảnh hưởng bài khác. Retry sau mất receipt phải idempotent theo trạng thái thực, không tạo lịch sử trùng. Quan trọng: manualScore=null/earned=0/isCorrect=false hoặc null/comment=null hay rỗng phải phân biệt, không biến trạng thái chờ chấm thành 0 điểm đã chấm. Nếu metadata lịch sử cũ không đủ hoặc sai thì từ chối rõ và giữ nguyên, không đoán. Không làm regrade/đổi đáp án snapshot ở đợt này.

2. **CV060/061: ô nhận xét giáo viên + lưu rõ ràng cùng điểm.** UI hiện chỉ có input điểm onBlur dù API hỗ trợ teacherComment. Thay bằng bộ soạn điểm/nhận xét có nút Lưu rõ ràng, dùng state đúng attempt+question+gradeRevision. Bài comment_only/survey ẩn điểm và cho nhận xét theo hợp đồng hiện tại, không ép thành điểm số. Giữ số/nhận xét đang nhập khi mạng lỗi, 409, tải lịch sử cũ hoặc phản hồi muộn; không gửi ngầm khi blur/đóng/đổi bài. Báo có sửa chưa lưu trước khi đóng/chuyển để người dùng chọn giữ lại/hủy rõ; đừng cho kết quả của bài/tài khoản cũ đè bản mới. Khôi phục lịch sử cũng không được âm thầm vứt ô đang sửa. Không làm ô nhập bị remount chỉ vì append lịch sử. Giữ quyền đọc hiện tại và pagination.

3. **Kiểm thử thuần và bàn giao.** Viết test có giá trị cho parse/validate trạng thái lịch sử, unknown/missing/meta giả/khác câu, null/0/false/empty, phạm vi điểm, retry và đề xuất restore khi nền đã thay đổi. Không giả đã chạy HTTP/DB/UI nếu chưa chạy; ghi rõ các ca Codex cần kiểm HTTP và giao diện (lỗi/retry, late response A sau B, nhập chưa lưu khi tải trang lịch sử, đổi tài khoản, restore từ bản cũ, no-op retry). Đọc guide Next cục bộ liên quan trước viết mã.

## Sửa nhỏ Codex đã làm khi tích hợp paging — phải giữ

GET có historyCursor: kiểm owner `findFirst({id, assignment:{ownerId:user.id}})` TRƯỚC `decodeGradeHistoryCursor`. Cursor hỏng của lượt khác chủ vẫn404, không trả400 và không lộ tồn tại. Worktree ca73871 của bạn chưa có sửa nhỏ này; hãy đưa đúng thay đổi đó vào commit mới, Codex sẽ đối chiếu khi tích hợp.

## Cách kết thúc / hết token

Cập nhật CLAUDE_STATUS.md ngay khi nhận việc với task/generation mới. Cập nhật sau mốc có nghĩa, ≤15 phút khi hoạt động. Làm cả ba phần không dừng hỏi sau từng phần. Commit nhỏ trong nhánh riêng khi đạt mốc, không push/merge và không gom tệp người khác. Bàn giao danh sách SHA MỚI theo thứ tự sau ca73871, file, unit đã chạy, lỗi/giới hạn, ca Codex cần kiểm. Ghi READY_FOR_REVIEW và gửi tin mới `claude-codex-UTC-UUID.md`. Nếu hết lượt ghi NEEDS_RESUME, WIP và bước đầu tiên, không nhận hoàn tất. Nếu phạm vi đụng tệp khác thì gửi đề xuất và tiếp phần độc lập trước, không tự mở rộng.
