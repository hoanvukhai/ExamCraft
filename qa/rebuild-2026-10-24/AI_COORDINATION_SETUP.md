# Chuẩn bị phối hợp Codex / Claude / Gemini

24/10/2026, theo yêu cầu phân công trên cùng máy/remote. Mốc nguồn lúc giao `83d4a95fedd632b69d8d1eedd135dabc10e369ad`; giữ các commit mới của chủ dự án. Không sửa tính năng hoặc chạy lại build/DB/provider để sửa prompt.

## Đã chuẩn bị

- Hai prompt thay thế ở `docs/phoi-hop-ai/`: Gemini làm UX/hồ sơ/ca kiểm; Claude làm tính năng phân trang lịch sử chấm nhỏ, rõ tiêu chí, worktree riêng. Codex giữ nhật ký nháp học sinh và tích hợp.
- Phạm vi tệp ghi riêng, chỉ Codex ghi checklist/hồ sơ chung; không dùng chung runtime/build/DB/node_modules ghi. Claude chỉ chạy unit thuần; build/API/DB do Codex kiểm tuần tự sau tích hợp.
- `qa/ai-review/coordination/ASSIGNMENTS.json` do Codex quản lý, status riêng cho mỗi AI, tin nhắn tệp mới có UUID. Checkpoint và NEEDS_RESUME khi sắp hết lượt; im lặng chỉ đánh dấu nghi hết lượt, không cho phép sửa đè. Tiếp quản đổi người/thế hệ và giữ worktree dở.
- Các AI phải đọc kênh khi đang chạy; tệp không thể tự đánh thức phiên đã hết token. Không tạo tự động hóa/agent, không tự gửi prompt tới dịch vụ ngoài hoặc push Git.
- Gói nguồn ngoại tuyến trước đó vẫn là49tệp thuộc allowlist từ Git, ZIP đã mở kiểm không có runtime secrets/DB/uploads/node_modules. Chỉ tham khảo, không dùng đồng bộ các AI trên cùng máy.

## Kiểm cuối

Đối chiếu phân công/prompt/quy ước/board; JSON hợp lệ, chủ tệp riêng, baseline tồn tại, thư mục worktree nằm trong tmp đã bỏ qua. Mã sản phẩm/schema/cấu hình Next không đổi trong đợt này. Không chạy build/test/DB/AI; chưa nhận Claude/Gemini đã khởi động hoặc hoàn thành.

Không tạo checklist cạnh tranh. Đợi các AI thực sự ghi status/bàn giao, rồi Codex kiểm diff/commit/test và tích hợp có chủ đích.
