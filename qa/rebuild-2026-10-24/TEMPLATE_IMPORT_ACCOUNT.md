# CV011/021/039 — template async và ghim tài khoản nhập bằng AI

24/10/2026. Tiếp [PUBLIC_POLICIES_AND_NONNUMERIC](PUBLIC_POLICIES_AND_NONNUMERIC.md). Không DB chính/provider/dependency/migration, chưa push. Code đang trong working tree ngoài các commit Claude đã tích hợp.

## Bàn giao và review

Claude generation4 bàn giao b442c22/f85712e, tích hợp thành58509d0/bb14bee. Hash toàn bộ tracked files đang sửa của Codex trước/sau cherry-pick giữ nguyên (`tmp/coordination/before-template-integration.json`). Không reset/clean worktree Claude; không gom tệp Gemini.

- RequestGate riêng mỗi panel, một request đồng thời; abort/dispose khi unmount/key đổi; account401 hoặc409 ACCOUNT_CHANGED khóa thay vì tự lấy phiên mới. Retry cùng body giữ clientRequestId, body đổi thì mã mới. Lỗi giữ form, danh sách/preview cũ. Parser kiểm đúng trang/ID/cấu trúc response trước thay state; lưu từ trang sau không chèn nhầm vào trang đang xem.
- Áp dụng mẫu chặn bấm đúp, kiểm quyền/ID/document stamp trong updater thực thi muộn; không tự rebase, không báo applied trước khi parent thật sự mang application đúng. Giữ tiêu đề/câu/đáp án mới của giáo viên khi nền đã đổi. Unit bổ sung của Claude chỉ là bằng chứng thuần, chưa UI.
- Review Codex sửa thêm: `send` kiểm token còn live trước khi xử lý auth failure, để receipt401 của gate đã hủy không khóa gate mới (StrictMode cleanup/setup). `end` kiểm token live trước release và chỉ nhả UI busy của request hiện tại; account-lock chủ động nhả busy. Các sửa này còn working tree.

## Nhập tài liệu

Gemini chỉ đúng việc parse AI thiếu account pin; ba route parse-docx/parse-exam-text/ocr-exam-image nay dùng requireRequestAuth trước đọc body, file/key/AI. Giữ validation và same-origin cũ; không cần provider thật để kiểm guard.

ImportModal nhận ownerId, documentId khi ở editor; wrapper có key theo đích, cả dashboard/editor truyền owner đúng. Request gửi accountFetch với abort signal; phản hồi/lỗi/finally kiểm token/context; account đổi thì khóa, giữ nguồn/preview để đối chiếu. Đóng hủy ngay trước callback parent; đọc tệp cũ không ghi sau đổi nguồn/đóng, nhập text thủ công làm kết quả FileReader cũ mất hiệu lực. Bóc tách thất bại cùng nguồn không xóa bản preview trước; đổi nguồn vẫn vô hiệu preview cũ theo hành vi hiện có.

Xác nhận nhập kiểm lại tài khoản qua auth/me, không chỉ lúc gọi AI; chặn double-confirm bằng gate, giữ preview khi mạng lỗi; khóa thay đổi môn/lớp/xóa câu trong khi xác nhận. Callback editor kiểm đúng document và quyền sửa ngay trong setExam, chỉ append câu mới, không thay câu đang có. Key đổi đích/tài khoản tạo panel mới; chưa có kho bền lưu form import qua reload/đổi đích.

## Kiểm và giới hạn

| Kiểm | Kết quả / bằng chứng |
|---|---|
| SAFE sau tích hợp | 258/258, fail0/skip0, hai worker; `safe-template-import.log`. Gồm6test request context +15test template (4mới), giữ cả public-access guard mới |
| TypeScript | Exit0 sau nhập tài khoản/callback; `typecheck-template-import.log` |
| Focused lint | Template/helper/parser/test/parse routes không có error được in trong log; ImportModal còn3errors/4warnings kế thừa (effect setState, JSX quote, unused/img); `lint-template-import.log`. Không nhận toàn dự án sạch |
| Build cuối | Exit0,46trang với2worker, TypeScript trong build đạt; `build-template-import.log` |
| HTTP tích hợp | 27/27, fail0/skip0; `http-template-import.log`. Ba parse AI stale account với JSON hỏng vẫn409 trước body/provider, matching-account body rỗng400, anonymous401, origin khác403, usage không tăng. Parser template nhận được save/list/open thật và replay200; các JSON auth/workflows/public policies PASS/cleanupComplete |
| Focused lint bỏ file UI kế thừa | Exit0, không lỗi/warning, `lint-template-import-focused.log` |

CUA thử lại vẫn lỗi kernel assets/path; chưa xác nhận UI mới: StrictMode old response, close/reopen, preview edit trong lúc auth check, FileReader/error, thay account/document, Word/ảnh/text/LaTeX thật. Unit helper không thay test interaction. Không gọi AI thật để “test nhanh”, không coi đã có parser là chất lượng OCR đạt. CV011/021/039 giữ mở.

## Đối chiếu báo cáo Gemini generation2

Hai báo cáo account/public của Gemini là rà tĩnh, có điểm đúng và điểm sai. Codex đã đọc thân hàm thay vì chỉ tên auth helper:

| Nhận định | Kết luận đã đối chiếu |
|---|---|
| api/exams và exams/[id] bỏ qua pin/CSRF vì dùng requireAuth | **Sai:** route gọi assertRequestAccount trực tiếp; PATCH/DELETE/POST kiểm isSameOriginMutation. HTTP cũ đã phủ, không sửa auth chỉ để đổi tên helper |
| import-legacy bỏ qua pin/CSRF | **Sai:** có assertRequestAccount và same-origin trực tiếp trước body/import; đã có kiểm tài khoản trong suite cũ |
| parse AI thiếu pin | **Đúng:** chỉ requireAuth+same-origin, nay Codex sửa như trên. Không phải thiếu cả CSRF |
| AI memory dùng fetch thường/thiếu pin | **Đúng cần xử lý:** có same-origin trực tiếp; giao Claude generation6, chưa tính đã sửa |
| Public assignment cookie hết hạn/student archived luôn403 | **Không đúng toàn bộ:** khi bài OPEN, view public sanitized vẫn200 như khách, không nhận myAttempt; draft/submit/result mới403. Group archived404. Chỉ cookie không hợp lệ không tự biến view public thành route riêng |

Đã gửi yêu cầu Gemini đính chính báo cáo riêng; chưa sửa tệp thuộc Gemini hoặc tính mọi gợi ý là lỗi xác nhận. Không nhận các từ “chặn tuyệt đối/triệt để” trong rà tĩnh là chứng nhận UI hay an toàn toàn hệ thống.

## Phối hợp tiếp

Template4 đã giao; assignment5 do Codex giữ review/tích hợp. Claude được giao tiếp **CLAUDE-MEMORY-ACCOUNT-SAFETY generation6**: server/client ghim tài khoản cho đọc/ghi/analyze/archive memory, guard mọi auth-failure/finally/receipt muộn, giữ nội dung, không tự activate/góp chung. Nhiệm vụ chi tiết `qa/ai-review/coordination/CLAUDE_TASK_06.md`; chỉ code memory trên worktree riêng từf85712e, Codex giữ ImportModal/parse và runtime. Status còn generation4 READY_FOR_REVIEW khi giao, chưa nhận xác nhận generation6.

Gemini generation2 đã giao hai báo cáo; đã giao generation3 GEMINI-VERIFY-AUDIT-CORRECTIONS theo GEMINI_TASK_03.md để đính chính bảng hiện trạng và giữ phụ lục sửa sai. Chưa nhận xác nhận generation3. Khi có SHA/báo cáo mới, Codex review rồi tích hợp tuần tự và chạy kiểm cần thiết, không lặp lại build chỉ để sửa Markdown. Hàng đợi/tiêu chí vẫn ở hồ sơ02 và checklist chính.
