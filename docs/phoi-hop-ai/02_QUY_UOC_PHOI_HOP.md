# Quy ước phối hợp — đọc trước khi sửa

> **Hiện hành 25/10/2026 — chủ dự án chuyển về làm một mình:** Codex thực hiện và tổng hợp toàn bộ nhóm việc, giữ mã, kiểm thử và hồ sơ chung; không giao thêm hoặc chờ Claude/Gemini. Phân công và quyết định ngày 24/10 bên dưới được giữ để truy vết lịch sử, không còn là hàng đợi đang chờ duyệt. Giữ các thay đổi đã có, quy tắc bảo toàn dữ liệu và kiểm thử cô lập. Gom việc theo nhóm lớn, ghi bằng chứng vào báo cáo nhóm rồi tổng kết.

> **Thay đổi vai trò 24/10/2026 (chủ dự án giao):** **Claude là người chỉ đạo.** Claude giữ `ASSIGNMENTS.json`, `BATCH_REVIEWS.json`, quyết định duyệt, checklist 03, hồ sơ 02 và báo cáo tiến độ. **Codex là người thực thi chính**: giữ mã, build/DB/server/provider, tích hợp theo việc được giao, ghi `CODEX_STATUS.md`. **Gemini** chỉ đọc mã và ghi các báo cáo được giao. Mọi câu dưới đây ghi "chỉ Codex sửa ASSIGNMENTS/BATCH_REVIEWS/checklist/hồ sơ/review decisions" nay đọc là "chỉ người chỉ đạo (Claude) sửa". Kế hoạch hiện hành: [04_MOC_PILOT](04_MOC_PILOT.md); việc mới nằm ở generation 13 (Codex) và 6 (Gemini). Claude worker batch 10 đã đóng.
> Codex vẫn được cập nhật dòng "Hiện trạng" của CV và báo cáo nhóm `qa/rebuild-<ngày>/` cho phần mình làm; không đóng CV và không sửa ASSIGNMENTS/BATCH_REVIEWS. Khi cần đổi phạm vi, gửi tin vào `messages/`, người chỉ đạo quyết.

Gốc chung: `F:/Workspace/Zazz/ExamCraft`. Nhánh gốc `rebuild/2026-10-local`; mốc giao việc ban đầu `83d4a95fedd632b69d8d1eedd135dabc10e369ad`. Không coi mốc này là HEAD mới nhất mãi mãi.

## Quyền ghi và liên lạc

- `qa/ai-review/coordination/ASSIGNMENTS.json`: chỉ Codex sửa; quyết định người giữ từng việc/thế hệ giao việc.
- `CODEX_STATUS.md`, `CLAUDE_STATUS.md`, `GEMINI_STATUS.md`: mỗi AI chỉ sửa tệp của mình trong checkout chính.
- `messages/<người-gửi>-<người-nhận>-<UTC-UUID>.md`: tin nhắn mới, không ghi đè. Chỉ gửi phát hiện, câu hỏi chặn việc, commit sẵn sàng hoặc bàn giao; không gửi xã giao.
- Gemini chỉ sửa báo cáo của mình được giao trong ASSIGNMENTS hiện tại, status/tin và đính chính báo cáo cũ của mình; không sửa mã nguồn.
- Claude chỉ sửa báo cáo bàn giao được ghi trong ASSIGNMENTS tại gốc chung; mã/test chỉ sửa trong worktree riêng, theo allowed_code của thế hệ hiện tại.
- Codex tích hợp, sửa checklist/hồ sơ chung và giữ quyền chạy build/DB/server/provider. Không ghi key/cookie/.env/backup/dữ liệu thật vào kênh.

Không cùng nối dòng một tệp chat. Worktree chỉ cách ly mã nguồn, không cách ly DB/cổng/cookie/node_modules/dịch vụ ngoài.

## Checkpoint và hết token

Mỗi status ghi: task_id, assignment_generation, state, updated_at_utc dạng ISO UTC, nhánh/worktree, commit gần nhất, đang làm, đã xong, bước tiếp theo cụ thể, test đã chạy/chưa chạy, tệp chưa commit và câu hỏi chặn việc.

State: NOT_STARTED, WORKING, READY_FOR_REVIEW, WAITING_REVIEW, NEEDS_RESUME, BLOCKED, DONE. Với batch dài, DONE chỉ khi mọi mục đã được Codex duyệt hoặc hoãn/hủy rõ lý do; chỉ Codex xác nhận đã tích hợp. Làm hết nhưng chờ duyệt dùng WAITING_REVIEW.

Đọc ASSIGNMENTS và tin gửi mình lúc bắt đầu/tiếp nối, trước mỗi nhóm sửa và trước commit/bàn giao. Cập nhật status sau mỗi mốc có nghĩa, tránh quá15phút không checkpoint khi đang làm. Trước bước dài ghi rõ đang chạy gì, không cần ghi từng lệnh.

Gần hết token/lượt: ghi NEEDS_RESUME; lưu mốc nhỏ ở nhánh riêng nếu hợp lý, ghi rõ WIP hay đã kiểm; không commit tệp người khác. Ghi đủ lỗi còn lại và bước đầu tiên cho người tiếp. Không đánh READY khi còn việc bắt buộc.

Quá45phút không cập nhật: AI còn lại chỉ ghi **nghi hết lượt/mất kết nối** trong status/tin của mình, tiếp việc độc lập; không chờ vô hạn, không sửa checkout của AI đó. Tệp không tự đánh thức AI đã ngừng; kênh chỉ được đọc khi AI đang hoạt động.

Nếu cần tiếp quản, Codex đổi người và tăng assignment_generation trong ASSIGNMENTS, làm trên checkout/nhánh của mình từ mốc đã xem xét, giữ nguyên worktree dở. AI cũ khi trở lại phải kiểm thế hệ/người giữ việc; nếu đổi thì dừng ghi và gửi bàn giao. Không tự giành lại việc, không cherry-pick WIP như mốc đã nghiệm thu.

## Worktree Claude và tài nguyên

Claude kiểm `git worktree list` và nhánh trước; nếu chưa có thì tạo:

```powershell
git worktree add -b ai/claude-grade-history tmp/ai-claude-grade-history 83d4a95fedd632b69d8d1eedd135dabc10e369ad
```

Nếu nhánh/đường dẫn tồn tại, chỉ dùng lại khi đúng nhiệm vụ. Không reset/clean/xóa/tạo đè. Không rõ thì ghi BLOCKED để Codex giải quyết, tiếp đọc độc lập. Mã/test chạy từ worktree riêng; status/tin nhắn ghi vào gốc chung bằng đường dẫn tuyệt đối.

Không chạy install/postinstall/prisma generate, Next build, migrate/seed/reset, server, browser ghi dữ liệu hoặc AI thật. Claude được chạy unit thuần không DB bằng Node/tsx đã có; node_modules ở thư mục cha chỉ đọc, không sửa. Codex chạy build/HTTP/DB tuần tự sau tích hợp; máy ít RAM dùng NEXT_BUILD_CPUS=2. Không dừng tiến trình/cổng AI khác.

Claude bàn giao commitSHA, tệp đổi, unit và phần cần Codex kiểm; không push/merge. Gemini đọc commit bằng git show hoặc đọc worktree, không sửa/cherry-pick. Codex reviewdiff rồi tích hợp tuần tự, giữ thay đổi có sẵn khi giải xung đột.

## Hàng đợi dài theo yêu cầu24/10

Áp dụng [03_HANG_DOI_LIEN_MACH](03_HANG_DOI_LIEN_MACH.md) cho Claude generation10 và Gemini generation5. Bàn giao rồi tiếp mục độc lập đã giao, không xin user từng mục; tệp giao đóng băng để Codex review. ASSIGNMENTS quyết định scope, BATCH_REVIEWS chỉ Codex ghi quyết định; không tự sửa decision hoặc tự coi được duyệt. Các task8/4 cũ được kế thừa trong mục đầu, không reset WIP. Khi hết lượt ghi checkpoint, không dựng tiến trình giữ phiên/chờ vô hạn.
