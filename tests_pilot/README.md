# Kiểm pilot trên trình duyệt

Chỉ dùng dữ liệu giả trên `examcraft_test_20261022`. Không tải trình duyệt, gọi AI hoặc đặt cookie/key vào tệp.

1. Có bản build hiện tại và máy chủ thử: `node --import tsx scripts/test-server.cjs --production`.
2. Chạy `npm run test:pilot`. Runner dùng Chrome/Edge cài sẵn và từ chối ghi nếu health không xác nhận `isolatedTest` hoặc DB không đúng tên. Không dùng máy chủ ứng dụng thật.
3. Xem kết quả mới trong `qa/rebuild-2026-10-24/pilot-results.json` và báo cáo `PILOT_E2E.md`.

Mỗi F có hai giáo viên giả riêng, browser context mới, quota AI bằng không. Dữ liệu được tạo qua UI/API; chỉ tài khoản khởi tạo và kiểm/dọn kết quả dùng DB trực tiếp. Chỉ xóa các ID do chính luồng đó tạo. Không reset DB hoặc dùng lại fixture bảo toàn từ các đợt trước.

Để chạy riêng một luồng, đặt `PILOT_FLOW=F4` trong môi trường rồi chạy cùng lệnh; kết quả JSON khi đó chỉ đại diện cho luồng được chọn. Muốn đổi trình duyệt cài sẵn có thể đặt `PILOT_BROWSER_PATH` tới Chrome/Edge. Không chạy lệnh tải browser của Playwright.

Kiểm Word ở đây đọc cấu trúc ZIP/XML và media; chưa thay việc mở Word, xem công thức, phân trang và in nhiều trang. Kiểm in xác nhận ứng dụng gọi `window.print`, không điều khiển hộp thoại máy in. Bộ đề tối thiểu là fixture kỹ thuật, không được chứng nhận chuyên môn; bộ Gemini phải được kiểm dữ liệu trước khi thay vào.
