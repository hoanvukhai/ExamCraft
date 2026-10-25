# Đo sao lưu và khôi phục thật — 25/10/2026

Mục đích: có số đo thật để chủ dự án duyệt RPO/RTO cho pilot (CV073). Máy hiện tại, Windows PowerShell 5.1, Docker `examcraft_postgres`, DB nguồn `examcraft` (chỉ đọc), không gọi AI.

## Đã chạy
| Bước | Lệnh | Kết quả | Thời gian |
|---|---|---|---|
| Sao lưu | `powershell -NoProfile -File scripts/backup.ps1 -Execute` | `BACKUP_PACKAGE_CREATED`, gói `backups/package-20261025095936964`, `restoreVerified: false` ở bước tạo | 17 giây |
| Khôi phục | `powershell -NoProfile -File scripts/restore.ps1 -Package <gói> -TargetDatabase examcraft_restore_rto_10251659 -Execute` | `RESTORED_VERIFIED`, `tablesMatch: true`, `publicFilesMatch: true`, `sourceUnchanged: true`, không drop/ghi đè | 20 giây |

Nhật ký: [ops-backup-run.log](ops-backup-run.log), [ops-restore-run.log](ops-restore-run.log). Dung lượng gói: khoảng 92 KB (DB hiện nhỏ, dữ liệu pilot sẽ lớn dần, chủ yếu do ảnh dạng dataURL trong DB).

## Điều số đo này nói và không nói
- Nói: với dữ liệu hiện tại, tạo gói và dựng lại một DB đối chiếu đúng mất dưới một phút; công cụ không ghi đè DB nguồn.
- Không nói: thời gian khi dữ liệu lớn hơn hàng trăm lần; thời gian đưa ứng dụng chạy lại trên DB phục hồi (bước đó cần diễn tập `rehearse-restored-app.cjs`, chưa chạy lần này, `appStarted: false`); khôi phục trên máy khác (DPAPI gắn với danh tính Windows, xem runbook).
- DB `examcraft_restore_rto_10251659` được giữ lại theo quy tắc không tự xóa; bỏ khi chủ dự án muốn, không ảnh hưởng ứng dụng.
