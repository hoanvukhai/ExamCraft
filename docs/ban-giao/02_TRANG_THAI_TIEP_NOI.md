# Trạng thái để tiếp nối

Cập nhật **25/10/2026**. Viết đè mỗi đợt; bản cũ giữ trong Git. Số test/log chỉ ở báo cáo nhóm được liên kết. Đọc yêu cầu hiện tại trước khi chọn việc; tệp này không tự cho phép việc ngoài phạm vi.

## 1. Mốc hiện tại

- **Codex làm một mình** theo yêu cầu mới của chủ dự án: thực hiện mã, kiểm thử, tổng hợp và giữ hồ sơ chung; không giao thêm/chờ Claude hoặc Gemini. Phân công cũ giữ để truy vết.
- Đã hoàn thiện đợt lưu dữ liệu, kiểm giao diện/offline, CSV nhận xét và cấu hình CI. Mã local: `789d1aa`, `5a5408b` trên `rebuild/2026-10-local`. [Báo cáo đợt25/10](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md) là nơi chính cho kết quả mới, build ID và giới hạn.
- Lưu đề chỉ ghi lịch sử câu đổi, giữ bản chụp đề và mọi lịch sử cũ; CAS từng câu chặn ghi đè bản mới. Đã kiểm PostgreSQL thử, quyền, rollback, điểm0/xóa trường/điểm lẻ và ghi đồng thời.
- Browser kiểm luồng pilot, ngữ liệu chung ở Song song, giờ/mã giao bài; Chrome và Edge kiểm offline/reconnect/xung đột theo lượt. Nháp xung đột lưu được thành đề riêng; chưa hỗ trợ mở ứng dụng từ đầu khi hoàn toàn offline.
- CSV bài có điểm nay giữ nhận xét từng câu; unit/HTTP và browser chấm→tải kiểm đạt. Bản dựng cuối đạt; server QA được dừng sau kiểm để giảm RAM.
- Không ghi DB chính, không gọi provider/khóa thật, không migration mới, không push/reset/clean. Chưa tổng nghiệm thu; dấu hoàn thành theo [checklist chính](../ke-hoach-2026-10-21/03_CHECKLIST.md), không suy từ số test.

## 2. Đã có và các giới hạn cần giữ

- Nền lưu server/nháp theo tài khoản và writer, version CAS, lịch sử, quyền, nhập kho cũ, bảy dạng câu, ngữ liệu/hình và đáp án; giữ các bằng chứng trước trong [bản đồ01](01_BAN_DO_MA_NGUON.md).
- Giao bài snapshot, tùy chọn giờ/lượt/mã, học sinh vào bằng link, nháp/nộp/chấm/CSV đã có kiểm. Chưa đủ mọi tổ hợp chính sách, rubric/chấm lại nâng cao hoặc cộng tác nhiều engine đồng thời.
- Backup/restore đầy đủ đã kiểm local và PowerShell5.1, gồm bản phục hồi riêng; kế thừa [PILOT_CLAUDE_INTEGRATION](../../qa/rebuild-2026-10-24/PILOT_CLAUDE_INTEGRATION.md), không chạy lại chỉ để sửa hồ sơ. Còn chuyển máy/mất DPAPI, nơi giữ bản thứ hai và mục tiêu vận hành.
- AI có BYOK/quota/đề xuất duyệt trước và ghi chú riêng; chưa kiểm chất lượng provider thật. Khóa mã hóa cũ không được tự xoay vì có thể mất khả năng giải mã dữ liệu cũ.
- Gói Toán6/môn2 và fixtures là chuẩn bị kỹ thuật/nội dung chờ duyệt. Chưa có giáo viên/reviewer, chưa đủ nội dung đã duyệt cho mọi môn/lớp; không tự ký thay chuyên môn.
- Word/PDF dài cần kiểm trực quan; Word Song song hiện xuất đề rồi đáp án, chưa hai cột. Cấu hình CI có integration/HTTP nhưng chưa chạy remote vì chưa push. Lint phần mã đổi đạt, chưa chứng minh lint toàn repo sạch.

## 3. Hàng đợi tiếp nối

1. **Dùng thử luồng lõi:** chủ dự án thử theo [hướng dẫn ngắn](../huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md); ưu tiên dễ hiểu, Word/in trang dài và thao tác thật. Ghi lỗi và kết quả mong muốn; không cần đọc toàn bộ QA.
2. **Kỹ thuật tiếp theo khi tiếp tục:** hoàn thiện parent journal/storage lỗi, hai engine cộng tác, các chính sách giao/chấm còn lại; publication snapshot/regrade theo thiết kế đã duyệt có giới hạn. Không tự mở schema nếu chưa làm rõ bảo toàn/rollback; không thêm journal mới trái mốc đóng băng.
3. **CV025/074:** phần chỉ lưu câu đổi đã làm, không làm lại. Còn Undo bền qua reload/tách lưu ngân hàng và dung lượng ExamRevision chứa ảnh; đo tải theo kịch bản trước khi thay cách chụp phiên bản.
4. **CV048:** copy theo phiên bản nguồn cũng đã có và HTTP kiểm lại đạt; không giao lại như tính năng còn thiếu. Publication snapshot riêng vẫn chưa triển khai.
5. **Nội dung/AI:** bám sổ nguồn và checklist môn/lớp; cần giáo viên/mẫu thực tế và một đợt kiểm provider thật có phạm vi/ngân sách rõ trước nghiệm thu. Không đồng nhất bộ kiểm kỹ thuật với chất lượng đề.
6. Các nhóm sau pilot, Drive tùy chọn và tổng nghiệm thu vẫn trong checklist; không bị bỏ khỏi phạm vi vì đợt này xong.

## 4. Môi trường

- Repo `F:/Workspace/Zazz/ExamCraft`; nhánh `rebuild/2026-10-local`. `b44c0ec` đã tích hợp trước đợt này; gói Gemini đã commit `d1d2f62`. Giữ worktree/tmp/backups cũ, không xóa tự động. `main` vẫn mốc cũ, chưa push/merge.
- Main: `examcraft_postgres`/5436/`examcraft`; test chính xác `examcraft_test_20261022`. Restore: `examcraft_restore_20261022`, `examcraft_restore_ps51_20261024`; cài mới: `examcraft_migrate_fresh_20261022`. Không đụng `study_work_postgres`/5435.
- Chỉ test ghi sau khi guard kiểm DB thử; HTTP/browser cần health `isolatedTest=true`. QA3117 đã dừng; kiểm cổng/trạng thái mới, không tin session ID cũ. Chrome/Edge cài sẵn, không tải browser.
- Máy ít RAM: một build một lúc, `NEXT_BUILD_CPUS=1`, heap1024; build/lint/SAFE/browser chạy tuần tự. PowerShell5.1 có sẵn; không mặc định có pwsh.
- `.env`, key/cookie/backup không đưa vào Git/báo cáo. Test dùng dữ liệu giả theo ID và dọn riêng. Không ghi DB chính để làm test pass.
- Đọc guide Next cục bộ liên quan trước sửa mã; tra đúng mục của bản đồ01 và checklist, không đọc lại toàn bộ chat/log.

## 5. Cách cập nhật

Bằng chứng/số liệu → báo cáo nhóm `qa/rebuild-<ngày>/`; viết đè dòng hiện trạng CV liên quan và các mục hiện hành ở đây. Tiến độ chung chỉ giữ ba thông báo mới, thông báo cũ đưa lịch sử với liên kết đúng. Không tạo master/checklist khác; không đánh dấu hoàn tất chỉ vì có mã hoặc test giả đạt.
