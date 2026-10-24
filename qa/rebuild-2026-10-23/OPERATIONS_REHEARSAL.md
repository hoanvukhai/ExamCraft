# Công cụ vận hành và ứng dụng phục hồi —23/10/2026

Đã đi tiếp [kiểm DB+tệp+cấu hình](CROSS_IMPORT_AND_FULL_RESTORE.md), không dừng ở mốc báo cáo. [Runbook](../../docs/van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md).

## Đã sửa và kiểm

- `backup-package.cjs`: gói DB custom/public/cấu hình DPAPI có hash, mặc định dry-run, không tự xóa. Chỉ phát manifest thành công khi nguồn không đổi và native dump/list archive đạt. Chạy thật qua `backup.ps1 -Execute` tạo `backups/package-20261023093421079`; chưa tự nhận đã restore chỉ vì tạo được gói. [Log](backup-package-native.log).
- `restore-package.cjs`: chọn gói + DB mới rõ ràng; xác minh hash/kích thước/public/đường tệp trước DB, từ chối đích nguồn/đích có sẵn, không drop hay reuse. Restore bản gói mới qua wrapper thật vào `examcraft_restore_package_20261023` đạt đủ bảng và tệp; nguồn không đổi. [Log](restore-wrapper-native.log). Chạy lại cùng đích bị từ chối/native nonzero, không ghi đè. [Lỗi mong đợi](restore-existing-refused.log).
- Thay `backup.ps1`, `restore.ps1`, `backup.sh`: không còn tự chọn backup SQL rồi nạp mặc định vào nguồn hoặc xóa bản quá7ngày. PowerShell kiểm `$LASTEXITCODE`, không nhận try/catch đơn thuần là xác nhận lệnh native thành công. Bash chuyển argument sang cùng entrypoint, mặc định dry-run; chưa chạy shell Bash ở Windows này, không nhận đã nghiệm thu Linux/DPAPI khác nền tảng.
- `backup-retention.cjs` chỉ review, giữ nguyên mọi file/DB, từ chối `--execute`. Bảo vệ các gói mới nhất và yêu cầu điểm phục hồi mới hơn đã kiểm trước gợi ý gói cũ; gói thiếu/lạ luôn giữ. [Kết quả](retention-review.json).
- Ba ca guard mới: đích/path nguy hiểm, dump/ảnh/manifest bị sửa, retention không xóa và native wrapper báo thất bại. SAFE20+121=141đạt; typecheck mới đạt. [SAFE](safe-operations.log), [typecheck](typecheck-operations.log). Build app/HTTP16kế thừa đợt nguồn nhập vì không đổi ứng dụng; không chạy build chỉ để sửa tài liệu.

## Ứng dụng phục hồi chạy thật

Từ gói đã kiểm, khôi phục sang `examcraft_restore_app_20261023`/thư mục mới, trước diễn tập mọi bảng khớp manifest. [Kết quả restore](restore-package-app.log).

`rehearse-restored-app.cjs` kiểm đúng restore-run/DB đích trước ghi, lấy cấu hình DPAPI vào RAM, tạo SESSION/ATTEMPT secret mạnh riêng và re-encrypt1khóa **chỉ DB bản sao**, so sánh plaintext trong RAM. Giữ khóa runtime mới trong `runtime-config.dpapi`, không đổi `.env` nguồn và không làm bản sao mất khả năng giải mã sau dừng. Đây là cách đáp ứng production secret guard, không bypass guard hoặc xoay khóa DB chính.

Sao chép build/config/public vào app riêng dưới thư mục restore-run; Next production3118 chỉ dùng DATABASE_URL đích. Tài khoản TEACHER giả/quota0được tạo ở bản sao, login qua API thật → tạo đề → đọc lại đúng điểm0/lời giải → truy vấn trực tiếp DB đích xác nhận chủ đề. Tải cả6tệp qua chính server ứng dụng, SHA256khớp tệp phục hồi. Đối chiếu24bảng DB chính trước/sau không đổi. Không gửi request nhà cung cấp AI. [Bằng chứng](restored-app-verification.json).

Server3118đã dừng sau kiểm. Fixture/DB/thư mục app/runtime secret mã hóa được giữ. DB bản sao có thay đổi rekey và fixture là có chủ đích, khác với bản restore nguyên trạng trước diễn tập; DB `examcraft_restore_package_20261023` là bản đã khôi phục chưa chạy app. Không tuyên bố browser UI phục hồi đã kiểm từ các API này.

## Giới hạn còn giữ

Chưa cutover production, chạy máy khác, mất máy Windows/DPAPI, thống nhất RPO/RTO hoặc bật retention xóa. Theo yêu cầu bảo toàn, chính sách hiện hành là giữ mọi bản; không có đường xóa tự động để thử. Bản public hiện6tệp và không có tham chiếu ảnh local/remote trong dữ liệu chính ở mốc backup; vòng ảnh gắn đề vẫn có bằng chứng QA riêng.

CV-072 đạt tiêu chí kiểm local đã chốt: DB+tệp+giải mã trên bản rỗng, native exit code/backup hỏng không báo tốt, đường retention không xóa mặc định. Các quyết định pilot/RPO/RTO/chuyển máy thuộc CV-073 và quyền dùng nguồn/tổng nghiệm thu vẫn độc lập; không đóng các CV khác từ số test.

Tiếp tục sang CV-010/050: khắc phục ô nháp chung giữa các writer để race localStorage không phụ thuộc read-archive-write nguyên tử, rồi kiểm hồi quy. Hồ sơ được ghi theo nhóm trong cùng lượt làm.
