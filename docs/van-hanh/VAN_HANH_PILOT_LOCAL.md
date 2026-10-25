# Vận hành pilot trên một máy (local)

Dành cho người chịu trách nhiệm vận hành. Sao lưu/khôi phục chi tiết xem [SAO_LUU_KHOI_PHUC_LOCAL.md](SAO_LUU_KHOI_PHUC_LOCAL.md). Chỉ dùng các lệnh đã được chạy thật trong dự án; phần "đề xuất" ghi rõ và chờ chủ dự án duyệt.

## 1. Ai chịu trách nhiệm
| Việc | Người | Ghi chú |
|---|---|---|
| Bật/tắt ứng dụng, kiểm DB chạy | Chủ dự án (đã duyệt 25/10/2026); người khác chỉ khi chủ dự án chỉ định bằng văn bản | ghi tên người thay vào đây nếu có |
| Chạy sao lưu hằng ngày, kiểm kết quả | cùng người trên | |
| Giữ bản sao lưu thứ hai, chìa khóa cấu hình | chủ dự án | ổ ngoài rời máy (mục 5) |

## 2. Bật và tắt
1. Kiểm Docker đang chạy container `examcraft_postgres` (cổng 5436).
2. Từ thư mục dự án: `npm run build` (lần đầu hoặc sau khi cập nhật mã), rồi `npm run start`.
3. Mở ứng dụng trong trình duyệt. Tắt: dừng tiến trình `npm run start`.
- Máy ít RAM: build bằng `NEXT_BUILD_CPUS=1 NODE_OPTIONS=--max-old-space-size=1024 npm run build` và không chạy cùng lúc bộ kiểm thử.
- Không bao giờ chạy kiểm thử ghi dữ liệu trỏ vào DB chính; bộ kiểm thử dùng DB thử riêng `examcraft_test_20261022` và từ chối nếu đích sai.

## 3. Bí mật và cấu hình
- Bí mật nằm trong `.env` (không đưa vào Git, không gửi qua tin nhắn). Mẫu: `.env.example`.
- Bản sao lưu chứa cấu hình mã hóa bằng DPAPI của Windows: chỉ mở được bằng cùng tài khoản Windows trên cùng máy. **Mất máy hoặc đổi tài khoản Windows thì không đọc được cấu hình trong gói**; cách giữ bí mật độc lập chưa được chọn (mục 5).
- Khóa AI của giáo viên được mã hóa trong DB; không xoay khóa mã hóa khi chưa có kế hoạch giải mã và mã hóa lại.

## 4. Hằng ngày và trước thay đổi lớn
- Sao lưu: `powershell -NoProfile -File scripts/backup.ps1 -Execute`; kết quả phải là `BACKUP_PACKAGE_CREATED`. Làm thêm một lần **trước** khi nhập dữ liệu lớn, cập nhật mã hoặc đổi cấu hình.
- Thử khôi phục định kỳ (mỗi tuần hoặc sau thay đổi lớn): `scripts/restore.ps1 -Package <gói> -TargetDatabase examcraft_restore_<tên mới> -Execute`. Thành công là `RESTORED_VERIFIED` với `tablesMatch` và `publicFilesMatch` đều `true`.
- Bản cũ: `node scripts/backup-retention.cjs --days 30 --keep 2` chỉ liệt kê, không xóa. Việc xóa do người vận hành quyết.
- Nhật ký lỗi: ứng dụng ghi ra cửa sổ chạy `npm run start`; **chưa có thư mục log chuẩn**. Đề xuất: chạy bằng `npm run start > logs/app.log 2>&1` và giữ 14 ngày, không ghi khóa/cookie vào log (mã hiện không in chúng).

## 5. Quyết định đã duyệt (chủ dự án, 25/10/2026) và việc còn lại
Số đo thật ở [OPS_RTO_MEASURE.md](../../qa/rebuild-2026-10-25/OPS_RTO_MEASURE.md). Chủ dự án giao cho người chỉ đạo chọn phương án hợp lý; các mục 1–3, 5, 6 dưới đây là phương án được chọn và đã duyệt.
1. **RPO: 24 giờ.** Sao lưu mỗi tối, thêm một lần trước mỗi đợt thay đổi lớn. Trong buổi thi/giao bài quan trọng: sao lưu trước và sau buổi.
2. **RTO: 30 phút** cho cả quy trình (dựng DB đối chiếu, diễn tập chạy ứng dụng, kiểm tay). Bước dựng DB đo được dưới một phút với dữ liệu nhỏ; bước diễn tập chạy ứng dụng chưa đo.
3. **Bản sao thứ hai:** ổ ngoài rời máy; sao chép gói `backups/package-...` mới nhất sau mỗi lần sao lưu. **Chưa thực hiện**: cần cắm ổ và chép thử một lần, rồi mở bản chép bằng `restore.ps1` để chắc không hỏng.
4. **Chuyển máy hoặc mất tài khoản Windows (chưa giải quyết).** Cấu hình trong gói được bảo vệ bằng DPAPI nên không mở được trên máy khác. Cần giữ chìa khóa cấu hình ngoài DPAPI (ví dụ mật khẩu trong trình quản lý mật khẩu của chủ dự án) và diễn tập một lần trên máy thứ hai trước khi giao cho người dùng thật ngoài chủ dự án. Đây là rủi ro đã biết, chấp nhận trong pilot nhỏ.
5. **Dung lượng và chi phí.** Không có dịch vụ trả phí bắt buộc. Đo lại dung lượng sau tuần pilot đầu; cảnh báo khi một gói sao lưu vượt 500 MB.
6. **Người chịu trách nhiệm:** chủ dự án (mục 1).

## 6. Khi có sự cố
Dùng [kịch bản diễn tập sự cố](../dien-tap/KICH_BAN_DIEN_TAP_SU_CO.md) và [30 lỗi xuất Word](../su-co/30_LOI_XUAT_WORD_VA_CACH_PHONG.md) do Gemini soạn (nội dung chưa kiểm thực tế từng dòng). Nguyên tắc chung: không xóa, không ghi đè DB chính; giữ lần thất bại để chẩn đoán; khôi phục sang tên DB mới rồi đối chiếu.
