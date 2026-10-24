# Model AI mặc định và số CPU khi build — 24/10/2026

CV032 (một phần). Không migration, không ghi DB chính, không đổi dữ liệu người dùng.

## Lệch đã có
Schema/migration đặt `User.selectedAiModel = gemini-3.5-flash`, còn mã (`DEFAULT_GEMINI_MODEL`) là `gemini-3.8-flash` và danh sách gợi ý không có 3.5-flash.

## Đã kiểm (chỉ đọc DB chính, một lệnh gọi ngắn mỗi model, không sinh nội dung)
- DB chính: 6/6 tài khoản có `selectedAiModel = gemini-3.5-flash`; 1 khóa đang bật.
- Gọi thử bằng khóa đã lưu (`scripts/probe-gemini-models.ts`, khóa không in ra): 3.5-flash, 3.6-flash, 3.5-flash-lite, 3.1-flash-lite, 3-flash-preview trả 200 trong khoảng 0,5–3 giây; 3.7-flash 200 sau ~56 giây; **3.8-flash không trả lời sau 90 giây** (hai lần); 3.1-pro-preview, 4-argon, pro-latest báo vượt quota; dòng 2.5 và 1.5 báo không còn cho người dùng mới.
- Kết quả chỉ đúng với một project/khóa tại thời điểm kiểm; không suy sang khóa khác.

## Đã sửa
- `DEFAULT_GEMINI_MODEL` = `gemini-3.5-flash`; danh sách gợi ý có 3.5-flash đứng đầu, giữ 3.8-flash; `.env.example` ghi rõ.
- `next.config.ts`: `experimental.cpus` lấy từ biến môi trường `NEXT_BUILD_CPUS` (bỏ trống = mặc định của Next). Máy ít RAM đặt `NEXT_BUILD_CPUS=2` trước `npm run build`.

## Bằng chứng (chạy mới sau sửa)
- `npm run test:safe` 219/219 ([log](safe-model-cpus.log)).
- Build `NEXT_BUILD_CPUS=2` thoát 0 ([log](build-model-cpus.log)). Lint hai tệp đổi sạch, `tsc` chưa có kết quả riêng (lệnh sập ở môi trường, build đã kiểm kiểu).
- Chưa chạy test HTTP/DB và chưa gọi sinh nội dung AI thật qua ứng dụng.

## Giới hạn
- Chưa kiểm lại 3.8-flash khi mạng/nhà cung cấp ổn; chưa quyết định xóa khỏi danh sách.
- Phần còn lại của CV032 (thêm/thay/xóa khóa, usage theo ID) chưa thuộc đợt này.
