# BÁO CÁO KIỂM THỬ: ĐỘI UX (USER EXPERIENCE, ACCESSIBILITY & MOBILE)

- **Người thực hiện**: UX SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Môi trường**: Giả lập thiết bị di động (Viewport 360px × 640px, 4G mô phỏng), Máy tính để bàn (1920px × 1080px).

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Hạng Mục Kiểm Thử | Trạng Thái | Bằng Chứng / Đánh Giá Chi Tiết |
|---|---|---|---|
| `TC-UX-001` | Trải nghiệm học sinh trên điện thoại di động (Mobile-First) | **PASS** | Phím bấm chọn phương án to rõ, đồng hồ đếm ngược ghim trên đầu màn hình, công thức dài cuộn ngang trong khung không làm vỡ trang. |
| `TC-UX-002` | Hộp thoại xác nhận nộp bài tránh bấm nhầm | **PASS** | Hiển thị modal nhắc nhở số câu đã làm và câu chưa làm trước khi học sinh nộp bài chính thức. |
| `TC-UX-003` | Luồng người dùng dành cho Giáo viên mới | **PASS** | Giao diện dẫn dắt trực quan: Tạo câu hỏi $\rightarrow$ Soạn đề $\rightarrow$ Tạo lớp $\rightarrow$ Giao bài trong vòng dưới 3 phút. |
| `TC-UX-004` | Tính nhất quán của ngôn ngữ Tiếng Việt | **PASS** | Các thuật ngữ sư phạm chuẩn xác: "Phần I. Trắc nghiệm nhiều lựa chọn", "Phần II. Trắc nghiệm Đúng/Sai", "Bảng biến thiên", "Ma trận đối soát". |
| `TC-UX-005` | Độ tương phản màu sắc và khả năng tiếp cận (A11y) | **PASS** | Màu chữ trên nền đạt chuẩn tương phản WCAG AA, các nút bấm có nhãn aria-label rõ ràng. |
