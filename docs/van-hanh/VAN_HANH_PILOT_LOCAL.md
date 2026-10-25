# Vận hành pilot trên một máy (local)

Dành cho người chịu trách nhiệm vận hành. Sao lưu/khôi phục chi tiết xem [SAO_LUU_KHOI_PHUC_LOCAL.md](SAO_LUU_KHOI_PHUC_LOCAL.md). Chỉ dùng các lệnh đã được chạy thật trong dự án; phần "đề xuất" ghi rõ và chờ chủ dự án duyệt.

## 1. Ai chịu trách nhiệm
| Việc | Người | Ghi chú |
|---|---|---|
| Bật/tắt ứng dụng, kiểm DB chạy | Chủ dự án hoặc người được chỉ định bằng văn bản | **Chủ dự án điền tên** |
| Chạy sao lưu hằng ngày, kiểm kết quả | cùng người trên | **Chủ dự án điền tên** |
| Giữ bản sao lưu thứ hai, chìa khóa cấu hình | chủ dự án | nơi giữ chưa quyết (mục 5) |

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

## 5. Việc chờ chủ dự án duyệt (CV073 chưa đóng khi chưa có các quyết định này)
Số đo thật ở [OPS_RTO_MEASURE.md](../../qa/rebuild-2026-10-25/OPS_RTO_MEASURE.md).
1. **RPO (mất dữ liệu tối đa chấp nhận được).** Đề xuất: 24 giờ (sao lưu mỗi tối), cộng một lần sao lưu trước mỗi đợt thay đổi lớn. Nếu cần ngắn hơn trong giờ thi, thêm sao lưu trước và sau buổi thi.
2. **RTO (thời gian dựng lại).** Đề xuất: 30 phút cho cả quy trình (dựng DB đối chiếu + diễn tập chạy ứng dụng + kiểm tay). Bước dựng DB hiện đo được dưới một phút với dữ liệu nhỏ; bước diễn tập chạy ứng dụng chưa đo.
3. **Nơi giữ bản sao thứ hai.** Chọn: ổ ngoài rời máy / thư mục đồng bộ tự chọn / không có. Hiện chỉ có một máy: mất máy là mất cả dữ liệu lẫn chìa khóa DPAPI.
4. **Chuyển máy hoặc mất tài khoản Windows.** Cần cách giữ chìa khóa cấu hình ngoài DPAPI (ví dụ mật khẩu giữ trong trình quản lý mật khẩu) và một lần diễn tập trên máy thứ hai. Chưa làm.
5. **Dung lượng và chi phí.** Hiện không có dịch vụ trả phí bắt buộc; dung lượng DB tăng chủ yếu theo ảnh trong đề. Đề xuất đo lại sau tuần pilot đầu và đặt ngưỡng cảnh báo khi gói sao lưu vượt 500 MB.
6. **Tài khoản chịu trách nhiệm** (mục 1): ghi tên.

## 6. Khi có sự cố
Dùng [kịch bản diễn tập sự cố](../dien-tap/KICH_BAN_DIEN_TAP_SU_CO.md) và [30 lỗi xuất Word](../su-co/30_LOI_XUAT_WORD_VA_CACH_PHONG.md) do Gemini soạn (nội dung chưa kiểm thực tế từng dòng). Nguyên tắc chung: không xóa, không ghi đè DB chính; giữ lần thất bại để chẩn đoán; khôi phục sang tên DB mới rồi đối chiếu.
