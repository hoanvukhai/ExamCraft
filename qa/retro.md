# HỌP TỔNG KẾT & CẢI TIẾN QUY TRÌNH (RETROSPECTIVE)

- **Thời điểm**: 2026-10-18 11:34 UTC+7
- **Chủ trì**: TEST DIRECTOR (DIR)
- **Phương pháp**: Start / Stop / Continue & Root Cause Analysis.

---

## 1. NHỮNG ĐIỂM LÀM TỐT (CONTINUE)
1. **Cô lập môi trường kiểm thử tuyệt đối**: Việc thiết lập database riêng `examcraft_qa` trên cổng 5437 đã đảm bảo 100% không làm xáo trộn dữ liệu phát triển hoặc file backup hiện có.
2. **Kiểm thử tự động thực nghiệm qua TypeScript**: Viết các kịch bản chạy qua CSDL và endpoint thực tế (`test_sprint1.ts`, `test_sprint2.ts`, `test_sprint3...`) giúp phát hiện ngay các lỗi ẩn (như lệch enum, missing required fields).
3. **Phân tích rủi ro có trọng tâm (Risk-Based Testing)**: Nhanh chóng định vị và kiểm chứng được các rủi ro cốt tử như R6 (lộ đề qua route legacy) và R22 (mất hình khi xuất Word).

---

## 2. NHỮNG ĐIỂM CẦN DỪNG LẠI (STOP)
1. **Dừng việc tin vào các bản báo cáo tự đánh dấu "100% hoàn thành"**: Có code không có nghĩa là đã xong. Cần đối chiếu với luồng chạy thực tế của hệ thống.
2. **Dừng việc trích dẫn các văn bản pháp lý khi chưa kiểm tra số hiệu**: Việc nhầm lẫn giữa Thông tư 17/2025/TT-BGDĐT và quy chế thi tốt nghiệp cần được loại bỏ khỏi tài liệu chính thức.

---

## 3. NHỮNG HÀNH ĐỘNG CẦN BẮT ĐẦU (START)
1. **Bổ sung CI tự động trên GitHub**: Mỗi commit phải được chạy lint, type-check và toàn bộ test suites tự động.
2. **Làm sạch các tệp tin và route legacy**: Xóa bỏ hoàn toàn mã nguồn của phiên bản v1/v2 không còn được dùng trong v3.1 để tránh tạo ra bề mặt tấn công.
