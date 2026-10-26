# Trạng thái để tiếp nối

Cập nhật **26/10/2026**. Viết đè mỗi đợt; bản cũ giữ trong Git. Số test/log chỉ ở báo cáo nhóm được liên kết. Đọc yêu cầu hiện tại trước khi chọn việc; tệp này không tự cho phép việc ngoài phạm vi.

## 1. Mốc hiện tại

- **Tiến độ CV: 70/78 đạt đủ tiêu chí; 3 ngoại lệ chấp nhận có phạm vi (CV017, 065, 066), không tính đạt** (thêm CV014, 015, 028, 077, CV025, 033, 039, 041, 053 ngày 25-26/10). Mức "đạt trong phạm vi pilot" vẫn tính riêng, không cộng. Mỗi lần đóng có dòng "Nghiệm thu" nêu test và giới hạn; nhật ký ở [CV_CLOSURE_REVIEW](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
- **Phân công:** Claude chỉ đạo và duyệt (giữ checklist, hồ sơ 02, ASSIGNMENTS.json, BATCH_REVIEWS.json); Codex làm mã/build/DB thử/trình duyệt, không tự tick; Gemini chỉ đọc mã và viết tài liệu, **phải kiểm lại bằng cách tự mở mã** (gen 15 có 5/8 tệp bị từ chối dù công cụ kiểm đều đạt). Gemini đã nộp báo cáo test 26/10 (nghiệm thu một phần, mục 3).
- **Đợt 26/10:** Codex gen 15: lint sạch và vào CI, F19 kho đề (sửa hai lỗi thật), migration từ checkout sạch, gom log thô vào `chay-tho/`, kiểm nguồn nhập (sửa lộ khóa số). Claude chạy lại kiểm nhanh: kiểu, lint, SAFE đạt. Bảng môn–lớp nay sinh bằng máy (`scripts/catalog-table.cjs`) có test chống mất môn.
- Không ghi DB chính, không gọi AI thật, không đổi schema, không push. `main` vẫn mốc cũ.

## 2. Đã có và các giới hạn cần giữ

- Nền lưu server/nháp theo tài khoản và writer, version CAS, lịch sử, quyền, nhập kho cũ, bảy dạng câu, ngữ liệu/hình và đáp án; giữ các bằng chứng trước trong [bản đồ01](01_BAN_DO_MA_NGUON.md).
- Giao bài snapshot, tùy chọn giờ/lượt/mã, học sinh vào bằng link, nháp/nộp/chấm/CSV đã có kiểm. Chưa đủ mọi tổ hợp chính sách, rubric/chấm lại nâng cao hoặc cộng tác nhiều engine đồng thời.
- Backup/restore đầy đủ đã kiểm local và PowerShell5.1, gồm bản phục hồi riêng; kế thừa [PILOT_CLAUDE_INTEGRATION](../../qa/rebuild-2026-10-24/PILOT_CLAUDE_INTEGRATION.md), không chạy lại chỉ để sửa hồ sơ. Còn chuyển máy/mất DPAPI, nơi giữ bản thứ hai và mục tiêu vận hành.
- AI có BYOK/quota/đề xuất duyệt trước và ghi chú riêng; chưa kiểm chất lượng provider thật. Khóa mã hóa cũ không được tự xoay vì có thể mất khả năng giải mã dữ liệu cũ.
- Gói Toán6/môn2 và fixtures là chuẩn bị kỹ thuật/nội dung chờ duyệt. Chưa có giáo viên/reviewer, chưa đủ nội dung đã duyệt cho mọi môn/lớp; không tự ký thay chuyên môn.
- Word Song song đã có hai cột, ngữ liệu và ảnh được kiểm qua cấu trúc DOCX; Word/PDF dài vẫn cần kiểm trực quan. Cấu hình CI có integration/HTTP nhưng chưa chạy remote vì chưa push. Lint toàn repo sạch và nằm trong `npm run ci`.

## 3. Hàng đợi tiếp nối

1. **Chủ dự án đưa lên Vercel** theo [TRIEN_KHAI_VERCEL](../huong-dan/TRIEN_KHAI_VERCEL.md), cho giáo viên và mình test thử; lỗi ghi vào [PHIEU_GHI_LOI](../huong-dan/PHIEU_GHI_LOI.md). Bản test đầy đủ ở [ban-test-day-du](../huong-dan/ban-test-day-du/00_HUONG_DAN_DUNG_VA_CHUAN_BI.md).
2. **Claude còn nợ:** `npm run ci` đầy đủ sau các thay đổi 26/10 (xáo đáp án sinh đề, `maxDuration`, lời nhắc sinh đề tách riêng). Cần dừng máy chủ thử cũ trên cổng 3117, việc này chờ chủ dự án đồng ý. Đã đạt riêng: kiểm kiểu, lint (0 lỗi), test mới của các tệp vừa đổi.
3. **Chạy AI thật khi hạn mức hồi (khoảng 14:00 giờ VN):** 6 môn chưa chạy (Âm nhạc, Mĩ thuật, GDTC, HĐ trải nghiệm, Ngoại ngữ khác, Tiếng dân tộc) để xác nhận lỗi trường `null`; đo xu hướng đáp án A của Gemini thật; nhập Word có ảnh thật. Sau đó xóa tệp khóa ở thư mục tạm.
4. **Việc của người:** CV044, 068, 071, 076, 078; ngoại lệ chấp nhận CV017, 065, 066. Soát mắt các dòng 🔴 dạng nhìn thấy, Word thật, in giấy, 375px, ngắt mạng; thẩm định chuyên môn 9B–9P và độ khó theo kỳ thi.
5. **Kết quả Gemini 26/10:** test bản đầy đủ 425 Đ, 0 K, 94 B, 171 chưa làm (nghiệm thu một phần: nhiều dòng Đ chỉ dựa trên đọc mã, xem [BAO_CAO](../../qa/test-run-2026-10-26-gemini/BAO_CAO.md)); kiểm lời nhắc theo lớp và kỳ thi 25/25 nhận, xem [DANH_GIA_CUA_CLAUDE](../../qa/prompt-check-2026-10-26/DANH_GIA_CUA_CLAUDE.md).

## 4. Môi trường

- Repo `F:/Workspace/Zazz/ExamCraft`; nhánh `rebuild/2026-10-local`. `b44c0ec` đã tích hợp trước đợt này; gói Gemini đã commit `d1d2f62`. Giữ worktree/tmp/backups cũ, không xóa tự động. `main` vẫn mốc cũ, chưa push/merge.
- Main: `examcraft_postgres`/5436/`examcraft`; test chính xác `examcraft_test_20261022`. Restore: `examcraft_restore_20261022`, `examcraft_restore_ps51_20261024`; cài mới: `examcraft_migrate_fresh_20261022`. Không đụng `study_work_postgres`/5435.
- Chỉ test ghi sau khi guard kiểm DB thử; HTTP/browser cần health `isolatedTest=true`. QA3117 đã dừng; kiểm cổng/trạng thái mới, không tin session ID cũ. Chrome/Edge cài sẵn, không tải browser.
- Máy ít RAM: một build một lúc, `NEXT_BUILD_CPUS=1`, heap1024; build/lint/SAFE/browser chạy tuần tự. PowerShell5.1 có sẵn; không mặc định có pwsh.
- `.env`, key/cookie/backup không đưa vào Git/báo cáo. Test dùng dữ liệu giả theo ID và dọn riêng. Không ghi DB chính để làm test pass.
- Đọc guide Next cục bộ liên quan trước sửa mã; tra đúng mục của bản đồ01 và checklist, không đọc lại toàn bộ chat/log.

## 5. Cách cập nhật

Bằng chứng/số liệu → báo cáo nhóm `qa/rebuild-<ngày>/`; viết đè dòng hiện trạng CV liên quan và các mục hiện hành ở đây. Tiến độ chung chỉ giữ ba thông báo mới, thông báo cũ đưa lịch sử với liên kết đúng. Không tạo master/checklist khác; không đánh dấu hoàn tất chỉ vì có mã hoặc test giả đạt.

- Việc cần chủ dự án tự xem: [DANH_SACH_VIEC_CAN_XEM_BANG_MAT](../huong-dan/DANH_SACH_VIEC_CAN_XEM_BANG_MAT.md) (26/10). Tệp Word mẫu sinh sẵn ở `tmp/xuat-mau/` (không vào Git).

- Đối chiếu YC→CV cho CV078: [CV078_YC_COVERAGE](../../qa/rebuild-2026-10-25/CV078_YC_COVERAGE.md), sinh lại bằng `node scripts/yc-coverage.cjs <tệp>`; 14 YC còn CV mở nằm ở nhóm AI, xuất/in, nhập tài liệu, duyệt chuyên môn.
- Bản test đầy đủ cho chủ dự án và người test cùng: [ban-test-day-du](../huong-dan/ban-test-day-du/00_HUONG_DAN_DUNG_VA_CHUAN_BI.md); tệp mẫu ở `docs/huong-dan/mau-test/` (sinh lại bằng `node --import tsx scripts/make-test-samples.ts`). Có thêm chức năng cấp PIN cho học sinh ở trang lớp (trước đó tùy chọn "Yêu cầu PIN" không có cách cấp PIN).
