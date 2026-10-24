# CV056/059/061/062 — chính sách công bố và dữ liệu bài không chấm điểm

24/10/2026, tiếp [RESTORE_NETWORK_SHARE](RESTORE_NETWORK_SHARE.md). Phạm vi Codex; Claude/Gemini nhận đợt mới độc lập. Không ghi DB chính, không gọi AI/provider, không migration hoặc tự sửa dữ liệu cũ. Còn working tree, chưa push.

## Sửa từ bằng chứng

Hồ sơ08 quy định phiếu khảo sát không sinh điểm0 để giả lập không điểm. API submit cũ gọi engine gradeSnapshot (trả tổng0 làm giá trị nội bộ cho bài không số), rồi ghi0 vào Attempt.score/maxScore. Giao diện học sinh che điểm nên ca cũ chỉ nhìn JSON chưa phát hiện. Bộ HTTP mới đã tái hiện bằng assertion DB thật: Decimal0 khác null. Survey có thể bị tính là bài điểm0 đã chấm; CSV xuất0/10 hoặc “Chờ chấm” dù không chấm điểm.

- Submit nay ghi **null** cho tổng/tối đa ở survey/comment_only/rubric; giữ numeric scored0 là0. Engine nội bộ không đổi hợp đồng. Không sửa response/đáp án/snapshot và không quét ghi lại dữ liệu cũ.
- Teacher monitor/detail/CSV căn cứ assessmentMode của snapshot để không hiển thị tổng giả trong các hàng cũ vẫn chứa0. Tách số lượt hoàn tất đánh giá khỏi tập điểm dùng tính trung bình/phổ điểm. Bài không số có avg/min/max null, không sinh phân tích đúng-sai số học; khảo sát đã nhận không tính chờ chấm.
- CSV bài không số dùng cột “Đánh giá”, nhãn đã nhận/chờ nhận xét, giữ nhận xét; không0/10/đúng-sai giả. Có no-store, giữ CSV escaping hiện có. Numeric maxScore0 dùng0, không fallback10; trạng thái EXPIRED/TERMINATED không gọi “Đang làm”. Trang học sinh dùng `??` để tổng0 không bị đổi10; kết quả không hứa sẽ công bố điểm cho survey/NEVER. Teacher UI không dựng ô thống kê điểm/nhãn0đ cho bài không số; bộ soạn dùng nhãn Lưu nhận xét khi phù hợp.
- Cookie hợp lệ chỉ chứng minh ai bắt đầu lượt. Thêm hasActiveAttemptAccess kiểm student/group còn hoạt động, chủ group đúng, membership khớp; áp dụng public draft/submit/result và nhận diện myAttempt. Student/group lưu trữ không tái dùng cookie để ghi/đọc kết quả; dữ liệu vẫn giữ và chủ bài vẫn đọc qua API teacher. Assignment CLOSED/ARCHIVED vẫn cho người đã nộp xem theo chính sách, khác với group/student bị lưu trữ. Chưa nhận đã thử race archive trong lúc transaction đang chạy.

## Kiểm mới và giới hạn

- `tests/http_public_policies.test.ts`, nối vào runner `test:http`: fixture UUID riêng, chứng minh isolatedTest trước ghi, chỉ DB `examcraft_test_20261022`, cleanup theo đúng owner. Ma trận NEVER ở OPEN/CLOSED/ARCHIVED; AFTER_CLOSE theo trạng thái hoặc closesAt đã qua; IMMEDIATE; leaderboard không lộ khi điểm bị ẩn, ẩn tên top; GET/retry submit áp dụng chính sách hiện tại và không sửa bài đã nộp. Public assignment luôn bỏ lời giải. Thiếu/sai/cookie lượt khác bị chặn.
- Start đồng thời cùng học sinh: một lượt,200/403, không chiếm lượt của trình duyệt khác; request serialization có thể phát sinh Prisma write-conflict được retry, không coi log retry đó là fail nếu assertions đạt.
- Draft sau hạn409; submit sau grace chỉ dùng nháp server đã nhận dù body gửi đáp án khác; future opens/closed từ chối start. Không sửa thời gian Windows hay ngủ chờ deadline: cập nhật thời gian trên fixture DB thử.
- Student archived chặn draft/submit/result; group archived chặn cả resultGET/retryPOST và link bài, teacher vẫn xem dữ liệu. Unit kiểm thêm membership/chủ group sai.
- Survey/comment_only/rubric: tổng DB mới null, public không điểm/ranking; survey không lời giải/chờ chấm giả; monitor/CSV không điểm giả. Fixture còn mô phỏng hàng cũ0 để kiểm read-path không viết lại; bài scored tổng/tối đa0 phải vẫn là0, CSV0/0.

| Kiểm | Kết quả / bằng chứng |
|---|---|
| Tái hiện trước sửa | `http-public-policies-before-fix.log`: lỗi thật Decimal0 khác null; ba nhóm start/reveal/deadline qua |
| Cleanup lần tái hiện | Lần đầu teardown thiếu xóa Question nên FK giữ1user giả. Đã sửa teardown, rồi dọn đúng1fixture đã kiểm UUID/email giả/không còn exam/group/assignment, chỉ DB thử. `cleanup-public-policy-fixture.json`. Không xóa theo tiền tố ở DB thật |
| Unit access mới | Đạt, `unit-public-policies.log`; phủ token đúng nhưng student/group archive, owner/membership sai |
| SAFE sau access/null fix | 248/248, fail0/skip0; `safe-public-policies-bounded.log`. Lần chạy đồng thời build trước đó thiếu RAM/child spawn/OOM, `safe-public-policies.log` thất bại; không tính là đạt. Đã đặt test:safe `--test-concurrency=2`, chạy lại sau build đạt. Giữ nguyên số ca/hợp đồng |
| HTTP sau sửa cuối | 27/27, fail0/skip0, gồm ca legacy0/scored0 và nhãn CSV cuối; `http-public-policies.log`. `http_public_policies.json` PASS/cleanupComplete, cùng các JSON auth/workflows PASS |
| Build hai CPU/tsc | Exit0,46trang, có TypeScript trong build; `build-public-policies.log`. Kiểm tsc riêng sau access/null fix exit0 ở `typecheck-public-policies.log` |
| Focused lint public helper/routes/test | Exit0, `lint-public-policies.log`. Các route teacher/CSV/page lớn kế thừa lint, không nhận toàn repo sạch |

UI mới chưa chạy (CUA lỗi kernel assets/path từ đợt trước); không lấy HTTP/unit thay bằng chứng giao diện. Không nhận CV hoàn tất. Còn kiểm trên browser: mobile, CSV mở Excel, mẫu/đổi tài khoản, deadline/offline, hai browser, các race archive đang ghi. Số nguồn/ca đã có không thay nghiệm thu chuyên môn.

## Giao việc tiếp

- Claude generation4: template panel khi phản hồi muộn/đổi owner–exam, preview/apply phải kiểm trong updater, retry idempotency giữ bản nhập. Worktree riêng từ f3dca22, chỉ5tệp template theo ASSIGNMENTS. Báo cáo mới CLAUDE_TEMPLATE_ASYNC.md. Không chạm teacher/student của Codex, không runtime/DB/provider.
- Gemini generation2: inventory caller ghim tài khoản và ma trận public reveal/capability, đọc working tree hiện tại; chỉ báo cáo GEMINI_ACCOUNT_CALLERS.md và GEMINI_PUBLIC_POLICY_CASES.md, không code/runtime. Đã lưu nhiệm vụ chi tiết và tin gửi riêng.
- Claude đã xác nhận generation4 WORKING, đang làm trên worktree riêng; chưa có bàn giao đợt4. Gemini cũng đã xác nhận generation2 WORKING, đang rà readonly; chưa bàn giao hai báo cáo mới. Không suy hết token hoặc coi nhiệm vụ đã ghi là đang chạy. Tệp không đánh thức phiên dừng. Prompt ngắn hiện tại ở docs/phoi-hop-ai/01_DAN_CHO_GEMINI.txt và02_DAN_CHO_CLAUDE.txt, dùng chat cũ hoặc chat mới nếu hết lượt.

Codex tiếp kiểm/integrate khi có bàn giao; giữ tài nguyên runtime, báo cáo/checklist chính. Không tạo master/checklist cạnh tranh.
