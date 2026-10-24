# P0 — Chốt các thay đổi đang dở

Mốc bắt đầu:524d182; generation13. Không thêm tính năng trong P0. Các thay đổi nguồn từ đợt trước được giữ và commit cùng test liên quan.

## Bằng chứng kế thừa

- Nhóm nguồn/test: SAFE307/307 tại safe-draft-ui.log; helper26/26 tại unit-draft-ui.log, render tĩnh2/2; build cuối exit0 tại build-draft-ui-final.log (bao gồm các sửa UI cuối); HTTP28/28 tại http-draft-ui-final.log, ba JSON PASS/cleanupComplete, DB examcraft_test_20261022. Xem DRAFT_RECOVERY_INTEGRATION.md cho thời điểm/giới hạn. Không chạy lại chỉ để commit.
- Lint component cuối đạt; trang teacher còn4errors/7warnings. UI thực chưa kiểm; không gộp API/render tĩnh thành E2E.
- Nhóm hỗ trợ QA/phối hợp/hồ sơ: kiểm đọc JSON/link/diff kế thừa báo cáo đợt trước; các quyết định mới của Claude chỉ lưu nguyên trạng, không sửa.
- Scan mẫu bí mật chỉ xuất tên tệp, không giá trị: report cũ Gemini có chuỗi được mô tả rõ là fixture Fake/Test; script pack có regex PRIVATE KEY để chặn export. Không thêm .env/key/cookie/backup/runtime dump. Snapshot danh mục/hash trước commit giữ tại tmp/coordination/p0-before.json.

## Commit

Sẽ ghi mã commit trong tin bàn giao sau khi hoàn tất các nhóm. Không push/reset/clean, không DB/provider.
