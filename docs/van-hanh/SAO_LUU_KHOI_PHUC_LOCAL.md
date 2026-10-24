# Sao lưu và thử khôi phục local

Áp dụng môi trường hiện tại: Windows/PowerShell7, Docker `examcraft_postgres`, DB nguồn `examcraft`, cổng5436. Không có tự xóa bản cũ. Đây là bản dữ liệu và cấu hình, không thay bản bảo toàn code/Git.

## Tạo gói

Từ thư mục dự án, xem trước rồi chạy:

```powershell
pwsh -NoProfile -File scripts/backup.ps1
pwsh -NoProfile -File scripts/backup.ps1 -Execute
```

Kết quả phải là `BACKUP_PACKAGE_CREATED`, kèm đường dẫn `backups/package-...`. Gói gồm custom dump DB, toàn bộ public, cấu hình mã hóa DPAPI và manifest/hash. Đừng lấy thư mục thiếu manifest hoặc lần chạy lỗi làm bản tốt. `restoreVerified: false` là đúng cho gói vừa tạo; chỉ đổi nhận định khi đã thử phục hồi thành công.

Nên tạo bản trước nhập/chuyển dữ liệu lớn hoặc sửa cấu hình. Lịch sao lưu thường xuyên, nơi giữ bản thứ hai và mục tiêu mất dữ liệu tối đa/thời gian phục hồi còn cần chủ dự án chốt; chưa tự tạo lịch hay mua dịch vụ.

## Thử phục hồi gói đã chọn

Thay hai giá trị mẫu bằng gói cần kiểm và **tên DB mới chưa tồn tại**, bắt đầu `examcraft_restore_`:

```powershell
pwsh -NoProfile -File scripts/restore.ps1 -Package backups/package-THOI_GIAN -TargetDatabase examcraft_restore_thu_01
pwsh -NoProfile -File scripts/restore.ps1 -Package backups/package-THOI_GIAN -TargetDatabase examcraft_restore_thu_01 -Execute
```

Không tự lấy gói mới nhất, không hỗ trợ restore đè hay drop DB. Gói sai hash, đường tệp thoát thư mục/junction/symlink, đích sai hoặc đã có đều dừng. Thành công phải có `RESTORED_VERIFIED`; kết quả và tệp được giữ dưới `backups/restore-run-...`. Native command lỗi trả exit khác0, không in thành công giả.

Giữ nguyên lần phục hồi thất bại để chẩn đoán; lần thử sau chọn tên đích mới. Không dùng SQL `--clean` từ script cũ vào DB chính. Các wrapper cũ đã được thay để tuân theo đường mới này; tham số cũ `DbName`, `KeepDays`, tự chọn file SQL không còn được dùng.

## Chạy ứng dụng từ bản phục hồi để kiểm

Đã có công cụ diễn tập:

```powershell
node scripts/rehearse-restored-app.cjs --run backups/restore-run-TEN_DICH-THOI_GIAN
```

Chỉ nhận một restore-run đã đối chiếu, chưa diễn tập. Công cụ tạo cấu hình runtime bảo vệ riêng với DATABASE_URL trỏ bản sao, đổi khóa mã hóa **chỉ trong bản sao**, giữ nội dung giải mã; sao chép build/public vào thư mục app riêng rồi chạy cổng3118. Tài khoản giả không có quota AI được dùng để kiểm đăng nhập, tạo/mở đề và tải đủ tệp; sau đó tự dừng server. Ghi kiểm nguồn DB chính không đổi. Không dùng công cụ này để chuyển production; các fixture và cấu hình bản sao được giữ.

**Không boot trực tiếp bằng config.dpapi gốc đã giải mã**: nó vẫn chứa URL nguồn. `runtime-config.dpapi` là cấu hình đã tách sang DB diễn tập. Không in nội dung hai tệp này hoặc gửi cho AI khác.

DPAPI cần cùng danh tính Windows/máy để mở lại; chưa là giải pháp mất máy/chuyển máy. Muốn di chuyển cần phương thức giữ bí mật khác được chủ dự án chọn, không chép `.env` rõ vào báo cáo.

## Giữ bản cũ

```powershell
node scripts/backup-retention.cjs --days 30 --keep 2
```

Lệnh chỉ lập danh sách để xem xét, không xóa hoặc di chuyển. Bảo vệ ít nhất hai gói mới nhất; chỉ đề nghị gói đủ tuổi khi có ít nhất hai điểm phục hồi mới hơn đã kiểm. Gói lạ/không đầy đủ luôn giữ lại. `--execute` bị từ chối. Chưa bật xóa định kỳ; không tự dọn các DB bản sao.

Gói dữ liệu không tải ảnh từ dịch vụ bên ngoài. Ảnh dataURL nằm trong DB; URL local phải có tệp trong public. Bước inventory ở kiểm phục hồi đầy đủ báo nguồn thiếu/ngoài kho; không tự coi URL remote là đã sao lưu.
