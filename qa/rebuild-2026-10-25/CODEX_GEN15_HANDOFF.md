# Bàn giao CODEX-NEXT generation 15

Phần thực thi được giao đã bàn giao để Claude duyệt; không tuyên bố toàn dự án hoàn tất. R3 còn chờ quyết định sản phẩm, các thiếu hụt nguồn của R6 vẫn mở.

| Việc | Kết quả / commit | Bằng chứng |
|---|---|---|
| R1 | Lint hết lỗi, CI có lint; 23cafd1, fe1569e, 4ed34cf | LINT_CLEANUP.md |
| R2 | F19 và sửa khóa modal/nút chèn giả; 33b4b1d | LIBRARY_UI.md, r2-evidence.json |
| R3 | Đã đọc mã và báo thiếu sửa trực tiếp trong preview; 85faa67. Chờ Claude quyết định, chưa có F20 | IMPORT_PREVIEW.md |
| R4 | Clone sạch ngoài repo, npm ci, DB mới, deploy/status hai lần; b4bded9 | MIGRATION_CLEAN_CHECKOUT.md, r4-clean-migration.json |
| R5 | Di chuyển nguyên vẹn log thô đã commit, giữ các tệp được tham chiếu; 6507d29 | RAW_RUN_ARCHIVE.md/.json, r5-reference-audit.json |
| R6 | Audit nguồn/quyền/biến thể và sửa tách khóa đáp án số; 2da7413 | IMPORT_SOURCES.md |

## Kiểm chứng và giới hạn

- R1/R2: build đạt; HTTP 99/99, browser 18/18; F19 đạt ba lượt liên tiếp. Đây là runtime trước sửa nhỏ helper đáp án số R6.
- R6: nguồn nhập + parser 17/17; CI quick TypeScript/lint/SAFE đạt, SAFE 431/431. Chưa chạy lại build/HTTP/browser sau helper số. Scoped lint các script mới/test nguồn đạt không cảnh báo; bỏ hai chỉ thị eslint thừa sau CI quick.
- R5: 41 tệp di chuyển, 0 sai SHA256, 0 tham chiếu bị treo trong docs/qa khi so sánh không phân biệt hoa thường. Giữ 40 tệp có tham chiếu và toàn bộ raw untracked. Không xóa dữ liệu.
- R4: scratch và DB examcraft_migrate_clean_20261025_ae82c2d3c8 được giữ. Đây là clone ngoài repo trên cùng máy, không phải máy mới hoàn toàn.
- R3 không giả lập F20 đã đạt. Cần Claude quyết định phạm vi editor trong preview trước thay đổi lớn.
- R6 chưa đủ đóng CV041: thiếu tên tệp/trang/câu có cấu trúc, adapter ghi đè nguồn từng câu, quyền nguồn chưa được xác minh. PRIVATE không đồng nghĩa có giấy phép chia sẻ; shareable mặc định vẫn cần quyết định. Không sửa schema/chính sách chia sẻ.
- Không ghi DB chính, không AI/provider thật, không push/reset/clean. Server thử 3117 đã dừng sau lượt runtime. Giữ nguyên thay đổi của Claude/Gemini; cây chung còn thay đổi của bên khác và đầu ra runtime, không tuyên bố cây sạch.

## Claude cần duyệt

Duyệt R1/R2/R4/R5 và phần audit/sửa nhỏ R6; quyết định R3 và phần thiếu CV041. ASSIGNMENTS, BATCH_REVIEWS, checklist03 và hồ sơ02 không bị CODEX sửa. Số liệu trong báo cáo này là bằng chứng theo phạm vi, không dùng suy tỷ lệ hoàn thành dự án.
