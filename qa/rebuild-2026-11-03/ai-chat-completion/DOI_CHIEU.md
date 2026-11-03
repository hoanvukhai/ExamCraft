# Đối chiếu phạm vi chat AI V2

> Cập nhật lưu trữ QA: ảnh/log/JSON sinh tự động đã cất ở local, không còn theo dõi trong Git. Xem [quy tắc lưu kết quả](../../KET_QUA_SINH_TU_DONG.md) và đợt rà `qa/rebuild-2026-11-03/chat-review/BAO_CAO.md`. Mốc raw cũ vẫn truy được tại Git `85ac659`; bản đang đổi khi dọn có manifest trong `tmp/qa-before-review-20261103T152251Z-0cfe6971`.

Bản chốt: [đặc tả 1.1](spec-v1.1/DAC_TA_CHAT_AI_V2.md), [nghiệm thu](spec-v1.1/NGHIEM_THU_CHAT_AI_V2.md). Hai tệp là bản chụp tham chiếu nguyên trạng; hash và nơi gốc ở [README tham chiếu](spec-v1.1/README.md). Không phải checklist mới. Phạm vi gốc mục 0 và yêu cầu chủ dự án làm liền mạch quyết định phạm vi. Claude vẫn quyết định duyệt checklist chính.

| Nhóm yêu cầu | Thực hiện và nơi đối chiếu | Bằng chứng phải đọc |
|---|---|---|
| AC-07–11, 71–72, 79: đề trống thật, không giá trị giả | `ExamBootstrap`, `useExamPersistence`; giữ đường đọc nháp cũ. Môn/lớp cần xác định trước mở bàn soạn, thời lượng có thể chưa đặt. Chỉ nhận hoặc xác nhận thủ công mới lưu đề. Giao bài hỏi thời lượng nếu thiếu | `ai_chat_completion`, hồi quy Đ0, HTTP/integration |
| AC-12–20, 51–54; TC-085: phiên riêng, chữ đang gõ, lựa chọn và khôi phục | `chat-session`, `useChatSession`, `copilot-clarification`. Nguồn gốc thủ công/AI đề xuất và revision giữ riêng khỏi Exam; không xác nhận lời AI là nguồn chuyên môn. Thẻ/lựa chọn có định danh, có câu trả lời tự nhập. RAM, archive trước thay thế, tải nguyên bytes hỏng, nhập bundle đúng chủ/đề; hội thoại theo ID sau ACK | `chat_session`, `bootstrap_generation`; completion clone/reload/archive/import và hồi quy Đ1 |
| AC-21–25, 29–31, 55–59: phạm vi, quyền và bản mới | `copilot-target`, `copilot-result`, `copilot-submission`, proposal journal. Chụp đúng IDs; chiếu field; chặn câu khóa/ngoài đích; kiểm quyền lúc nhận và lúc lưu; giữ proposal khi stale. Mở rộng tương thích API hiện tại, không dựng server job/receipt mới | `copilot_target`, `copilot_submission`, `copilot_metadata`, journal; F4/F10/F14/F21; HTTP quyền/CAS |
| AC-26–32, 73; TC-083–084: thông tin + nhiều câu nguyên tử và undo chung | Allowlist metadata; đề có câu không chỉ thay nhãn môn/lớp. Tạo lại cả đề dùng plan đúng môn/lớp; giữ thông tin và trình bày cũ, cho đổi tên rõ ràng. Candidate hoàn chỉnh trước nhận; một lịch sử undo/redo chung, giữ cấu trúc người khác đã sửa | completion nhận/undo/redo, bulk+metadata, replace-existing; hồi quy Đ2 và `undo_history` |
| AC-33–38, 75–77: sinh cả đề và đầu ra giàu nội dung | Planner bootstrap và route Copilot gọi chung `exam-generation`; tái sử dụng plan/prompt/validator. Bảy dạng câu, parts, passages và outline remap; không ép tổng về 10; khảo sát bỏ đáp án/điểm; phản hồi bị cắt/sai không thành proposal hoàn chỉnh; không tải URL ảnh do AI bịa | `bootstrap_generation`, `generation_and_drafts`, HTTP AI giả, completion |
| AC-37, 54, 74; TC-080: ảnh và giới hạn payload | Đích toàn đề gửi ngữ cảnh ảnh nhẹ; ảnh gốc giữ ở bản nền, không chép vào metadata proposal. Câu cần ảnh phải chọn rõ; vùng chọn vượt 4 MiB bị chặn trước provider. Không cắt âm thầm câu hay hội thoại | unit transport, completion đề ảnh 5 MiB; F21 chọn câu có ảnh |
| AC-43–50, 76–78: khóa và chi phí | Bốn trạng thái key. Thông báo lỗi có nguyên nhân, giữ yêu cầu và CTA. Không tự retry quota/mạng/dịch vụ; SDK một attempt và budget chung. Lượt khỏe: sửa/hỏi một, tạo cả đề hai; hướng dẫn cục bộ không gọi AI. Abort/deadline không cho áp kết quả trễ | `ai_policy`, `chat_session`, HTTP AI/key mock, hồi quy Đ1 và completion |
| AC-61–65, 68–70, 80: giao diện và bàn giao | Light/dark, Enter máy tính/IME/cảm ứng, không focus trap lồng, avatar qua portal, xem hình/phương án/ý con trong proposal. Cổng và worktree được ghi riêng; không đụng bản web | Chrome viewport và hồi quy editor; xem ảnh trong nhóm này |

## Giới hạn, không coi mock là thẩm định

- Chưa gọi provider thật: chưa chứng minh model thật luôn hiểu đúng câu tự nhiên, không hỏi lặp hay tạo nội dung/barem đúng chuyên môn. Những quy tắc này có prompt, schema và kiểm an toàn; cần giáo viên xem đề thật và một lượt đánh giá provider có chủ đích.
- Chưa thử điện thoại vật lý, bàn phím thật, trình đọc màn hình hoặc deadline Vercel thực tế; ảnh viewport không thay thế các kiểm đó.
- Nguồn gốc lời AI được ghi là suy luận/đề xuất; không tự gắn nguồn `user/template/official` chỉ vì model nói vậy. Mẫu người dùng chọn vẫn theo metadata/cơ chế mẫu hiện có. Đây không phải kho nguồn chính thức.
- Request/response giữ adapter của API hiện hành với ngữ cảnh/định danh bổ sung, không quảng cáo là đã thay toàn bộ giao thức v2 cứng hoặc có receipt bền qua nhiều instance. Server quyền/CAS hiện có vẫn là nguồn quyết định lưu. Không có idempotency tính phí qua serverless.
- Không có khôi phục output chưa đến trình duyệt sau ngắt kết nối; không tự chạy tiếp nền. Truncated/sai schema bị bác, giữ đầu vào; không coi bản cụt là đề đầy đủ. Chưa có tải phần output thô bị bác từ provider.
- Nhập hội thoại/bundle chỉ cùng tài khoản và ID đề; không tự chuyển bản riêng sang tài khoản khác. Hội thoại không đồng bộ nhiều máy. Bản không đọc được giữ nguyên; rollback phải giữ reader mới và bytes, không ép downgrade.
- Theo mục 0 bản 1.1: chưa làm kho nguồn chính thức (AC-40–42), chia lượt sinh đề dài (phần AC-39), cache khóa, cờ rollout và nhật ký mới. Không migration/push/deploy/provider thật.

Mỗi kết quả chạy và giới hạn cụ thể tra `BAO_CAO.md` sau khi hoàn tất kiểm; không suy tất cả AC đạt chỉ từ số test. Các ca chuyên môn/vận hành cần người được giữ mở cho Claude duyệt.
