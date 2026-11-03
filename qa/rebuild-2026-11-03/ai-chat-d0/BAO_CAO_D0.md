# Đ0 — sửa lỗi trước khi nâng trợ lý AI

03/11/2026 · **WAITING_REVIEW** · Chỉ thực hiện Đ0, chưa bắt đầu Đ1.

Mã và test: **`555a45b`**, nhánh **`codex/chat-ai-v2`**, nền **`865bcea`**.
Worktree hiện hành: `F:/Workspace/Zazz/ExamCraft/tmp/chat-ai-v2`.
Căn cứ: mục 0 và 14 của [đặc tả 1.1](F:/Workspace/Zazz/ExamCraft/tmp/canva-a/qa/rebuild-2026-11-03/ai-chat-audit/DAC_TA_CHAT_AI_V2.md), [nghiệm thu 1.1](F:/Workspace/Zazz/ExamCraft/tmp/canva-a/qa/rebuild-2026-11-03/ai-chat-audit/NGHIEM_THU_CHAT_AI_V2.md) do Claude duyệt. Bản gốc giữ nguyên tại worktree Claude.

## Đã sửa

| Yêu cầu | Hành vi và cách sửa | Bằng chứng |
|---|---|---|
| AC-71 | Chờ tải đúng đề mới mount form. Không remount theo phiên bản lưu hay đối tượng chọn. Giữ form đã mount nếu quyền bị thu hồi, khóa sửa nhưng không xóa chữ | TC-077: đề Vật lí 9/60 phút hiện đúng; sửa tên/lớp, tải lại không xung đột giả; giữ nháp tiêu đề chưa hoàn chỉnh khi chọn câu/quay lại hoặc mất quyền |
| AC-72 | Đề mới chưa thao tác có state `pristine`, không autosave/ghi nháp giả. Hiển thị **Chưa lưu**, có nút **Lưu đề**. Nháp phục hồi vẫn `dirty` như trước | TC-078: mở hơn 5 giây không request lưu, không đổi URL/đếm DB; sửa thật tạo đúng một đề; nháp `new` cũ khôi phục được |
| AC-15, phần Đ0 | Chụp revision ô nhập, chỉ xóa đúng revision đã gửi. Khóa gọi đồng thời; gợi ý không tiêu thụ lời nhắn chưa gửi khác | TC-019: A đang chờ rồi gõ B; A→B→A; bấm gợi ý; A không sửa; lỗi và câu hỏi làm rõ. Không tự gửi B, không tự áp đề xuất |
| AC-61, phần Đ0 | Đề trống có **Sinh câu từ mô tả / Dùng mẫu / Nhập tài liệu**, mở công cụ có sẵn. Có câu mới hiện lệnh sửa; thu gọn gợi ý sau bắt đầu chat. Bỏ từ ngữ ép về Toán ở lệnh tăng độ khó/bối cảnh | TC-068: chuyển đúng bảng cả điện thoại; không gọi AI chỉ vì bấm lối vào |
| AC-80 | Nhánh đúng nền; không push/deploy/migration/AI thật; chạy integration | TC-086 và log bên dưới |

Nhãn **Sinh câu từ mô tả** có chủ ý: chưa dùng “Tạo cả đề” vì khả năng đó thuộc Đ3. Nút Dừng/lưu hội thoại/Enter cảm ứng của AC-15/50/64 thuộc đợt sau; không nhận đã hoàn tất các phần đó.

Chỉ sửa bốn tệp sản phẩm: `ExamWorkspace.tsx`, `useExamPersistence.ts`, `RightCompanionRail.tsx`, `editor/EditorSaveStatus.tsx`. Không đổi trực tiếp HeaderForm vì lỗi được chặn ở chỗ mount. Không đổi API, schema, validator, cấu trúc đề xuất, hợp đồng nháp hay undo. Giữ điểm 0, ảnh, ngữ liệu, đáp án/lời giải; bộ kiểm so sánh trước/sau. Không đụng sửa sẵn ở `tmp/canva-a`.

## Kết quả kiểm

| Kiểm | Kết quả | Log |
|---|---|---|
| TypeScript | Đạt, mã thoát 0 | [typecheck.log](typecheck.log), không có lỗi |
| Lint tệp sửa và test mới | Đạt, không lỗi/cảnh báo | [lint.log](lint.log) |
| Production build | Đạt; CPU=1, heap 1024 | [build.log](build.log); ID `C5BtkF-PhVLJug57s_6nv` |
| Guard liên quan | **53/53 đạt** | [guards.log](guards.log): header, nháp/lưu/quyền, Copilot, journal, lịch sử |
| `npm run test:integration` | **8/8 đạt** | [integration.log](integration.log), [integration_s1.json](integration_s1.json), [question-save.json](question-save.json) |
| Chrome Đ0 | **8/8 đạt** (7 nhóm và ca cha) | [browser.log](browser.log), [browser-results.json](browser-results.json), [mã kiểm](../../../tests_pilot/ai_chat_d0.test.ts) |

DB thật dùng để test: **examcraft_test_20261022 / 5436**, đã kiểm guard URL và SQL `current_database()` trước ghi. Máy chủ local **3123**, health `isolatedTest=true`. Chrome cài sẵn; provider được giả lập tại request trình duyệt, server chỉ trỏ provider về local. Không Vercel Preview, không DB chính, không provider thật.

Fixture tài khoản/câu/đề có ID riêng, đã dọn và xác nhận không còn tài khoản/đề thử. Không lưu cookie/key/.env vào báo cáo. Máy chủ 3123 đã dừng sau kiểm; không thay bản đang xem ở 3117/3122, không deploy.

Ảnh đã xem: [thông tin desktop](metadata-desktop.png), [375px](metadata-375.png), [B còn sau kết quả A](composer-keeps-B-375.png), gợi ý trống [320px](empty-starters-320.png), [375px](empty-starters-375.png), [390px](empty-starters-390.png), [desktop](empty-starters-1440.png), [dark 375px](empty-starters-375-dark.png). Chuyển theme bằng nút thật và chờ hiệu ứng màu xong trước chụp.

## Giới hạn và lỗi ngoài đợt

- **Menu tài khoản bị bảng AI che trên điện thoại:** mở AI → mở avatar → đổi giao diện bị chặn bởi lớp AI. [Bằng chứng](browser-existing-menu-overlay.log). Đóng AI trước thì dùng được; bộ kiểm cuối làm đúng lối này, không click cưỡng bức. Lỗi chưa sửa, chuyển Claude duyệt tiếp. Ảnh dark cũng còn tên đề trên thanh đầu khó đọc; không tuyên bố mọi chi tiết giao diện dark đều đã đạt.
- Chưa làm Đ1: hội thoại bền, nút Dừng, lỗi/key, Enter cảm ứng/IME và target nhiều câu. Chỉ kiểm giữ composer trong phiên đang mở, chưa hứa giữ qua reload/đổi tài khoản/đổi ID đề.
- Chưa làm Đ2–Đ3: AI đổi metadata/tạo cả đề và bootstrap trống. Đề mới vẫn có mặc định kỹ thuật Toán 6/45 phút; Đ0 ngăn lưu rác, không đổi dữ liệu cũ sang rỗng.
- Chưa chạy full CI/SAFE/mọi trang; lượt đầy đủ thuộc Đ4. Viewport Chrome chưa thay kiểm điện thoại vật lý/bàn phím thật. Mock không xác nhận chất lượng model hay key thật.

## Lịch sử kiểm và chạy lại

- Dựng lần đầu ở C với thư viện F lỗi đường dẫn chéo ổ: [log](build-cross-drive-failed.log). Worktree hiện hành đã chuyển sang F, không sửa config sản phẩm để lách lỗi. Bản C ở `tmp/chat-ai-v2` chỉ là bản sao trung gian.
- Lượt đầu cần sửa thao tác test đóng bảng điện thoại và selector nút Đóng: [điều hướng](browser-initial-navigation-failed.log), [selector](browser-selector-failed.log). Các lượt đó không tính đạt. Lần thử theme phát hiện lỗi menu thật ghi ở trên. Mã sản phẩm không đổi trong các lần chỉnh bộ kiểm này.
- [run-check.cjs](run-check.cjs) nhận `typecheck`, `lint`, `guards`, `integration`, `build`, `server`, `browser`, rồi đường dẫn tệp môi trường local hiện có. Chỉ đọc cấu hình vào bộ nhớ; kiểm đích DB thử, không copy .env. Integration gom bằng chứng mới về đây và phục hồi báo cáo lịch sử do script cũ ghi.

Từ worktree F hiện hành, ví dụ:

```powershell
node --import tsx qa/rebuild-2026-11-03/ai-chat-d0/run-check.cjs integration F:/Workspace/Zazz/ExamCraft/tmp/canva-a/.env
node --import tsx qa/rebuild-2026-11-03/ai-chat-d0/run-check.cjs server F:/Workspace/Zazz/ExamCraft/tmp/canva-a/.env
# Cửa sổ khác sau khi server sẵn sàng:
node --import tsx qa/rebuild-2026-11-03/ai-chat-d0/run-check.cjs browser F:/Workspace/Zazz/ExamCraft/tmp/canva-a/.env
```

Không chạy build cùng lint/SAFE/build khác. Không dùng cấu hình Preview/DB remote.

**Đề nghị Claude duyệt `555a45b`. Codex dừng ở Đ0, WAITING_REVIEW; không tự đóng CV, không sửa checklist03/hồ sơ02, không tự sang Đ1.**
