# GÓI CHUẨN BỊ NỘI DUNG PILOT: MÔN TOÁN 6 — PHẠM VI VÀ CĂN CỨ
*Mã gói tài liệu: `PILOT-TOAN-6`*
*Trạng thái pháp lý và học liệu: **CHỜ DUYỆT CHUYÊN MÔN (CHUA_XAC_MINH_TOAN_VAN)***

- **Người thực hiện:** Gemini (QA / Nghiên cứu tài liệu chương trình)
- **Nhiệm vụ:** `GEM-P3` thuộc `GEMINI-PILOT-PREP` (Generation 6, [ASSIGNMENTS.json](../../../qa/ai-review/coordination/ASSIGNMENTS.json))
- **Mốc kế hoạch:** [docs/phoi-hop-ai/04_MOC_PILOT.md](../../phoi-hop-ai/04_MOC_PILOT.md)
- **Thời điểm lập hồ sơ (UTC):** 2026-10-24T14:48:00Z
- **Nguyên tắc an toàn:** Dữ liệu chuẩn bị tài liệu, **tuyệt đối không nạp vào mã nguồn hoặc ghi vào cơ sở dữ liệu chính**.

---

> [!WARNING]
> **TÍNH CHẤT PHÁP LÝ VÀ CHUYÊN MÔN CỦA GÓI TÀI LIỆU:**
> 1. Tài liệu này đóng vai trò là **khung khảo sát nội dung kỹ thuật** để phục vụ đợt chạy thử nghiệm pilot phần mềm với 01 giáo viên bộ môn và 01 đồng nghiệp phản biện.
> 2. Toàn bộ nội dung mục lục và yêu cầu cần đạt (YCCĐ) được trích cứu từ các văn bản công khai của Bộ GD&ĐT và cổng tập huấn NXB Giáo dục Việt Nam.
> 3. **Chưa có biên bản nghiệm thu của Hội đồng thẩm định chuyên môn.** Không sử dụng gói này để công bố ra bên ngoài hay gắn nhãn "đạt chuẩn BGD hoàn chỉnh".

---

## 1. Phạm vi chương trình và đối tượng thử nghiệm

- **Cấp học & Khối lớp:** Trung học cơ sở (THCS) — Lớp 6.
- **Môn học:** Toán học (Mã nội bộ: `toan`).
- **Giai đoạn áp dụng:** Học kỳ I (Khoảng 18 tuần thực học, định hướng bài kiểm tra giữa kỳ 1 và cuối kỳ 1).
- **Bộ sách giáo khoa chọn làm đối chiếu:**
  * **Tên bộ sách:** *Kết nối tri thức với cuộc sống* (Nhà xuất bản Giáo dục Việt Nam).
  * **Đầu sách:** *Toán 6 — Tập một* (Tổng Chủ biên: Hà Huy Khoái; Chủ biên: Nguyễn Huy Đoan).
  * **Mã định danh sổ nguồn:** `NXB-0014` (theo [docs/nghien-cuu/goi/NC-NEN-2026-10-22/SACH_VA_HOC_LIEU.md](../NC-NEN-2026-10-22/SACH_VA_HOC_LIEU.md)).
  * **Liên kết cổng tập huấn NXB:** [Chi tiết sách Toán 6 tập 1](https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/toan-6-tap-mot-940011379.940011379) | [Đọc trực tuyến SGK](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-mot.4699854777).

---

## 2. Các văn bản pháp lý và tiêu chuẩn đối chiếu

| Ký hiệu văn bản | Tên văn bản & Cơ quan ban hành | Mốc thời gian & Hiệu lực | Nội dung đối chiếu trong gói pilot |
|---|---|---|---|
| **TT 32/2018/TT-BGDĐT** | Ban hành Chương trình Giáo dục phổ thông (Kèm Phụ lục môn Toán) | Ban hành 26/12/2018; hiệu lực áp dụng từ năm học 2021-2022 cho lớp 6 | Khung năng lực toán học, 3 mạch kiến thức (Số & Đại số, Hình học & Đo lường, Thống kê & Xác suất) và chuẩn Yêu Cầu Cần Đạt (YCCĐ) lớp 6 |
| **TT 22/2021/TT-BGDĐT** | Quy định về đánh giá học sinh trung học cơ sở và học sinh trung học phổ thông | Ban hành 20/07/2021; hiệu lực từ 05/09/2021 | Quy chế kiểm tra định kỳ (giữa kỳ / cuối kỳ), kết hợp giữa nhận xét và cho điểm số (thang điểm 10) |
| **CV 7991/BGDĐT-GDTrH** | Hướng dẫn xây dựng ma trận, bản đặc tả và đề kiểm tra định kỳ | Ban hành 10/12/2024 | Cấu trúc đề 3 phần tham khảo kỹ thuật: Phần I (Trắc nghiệm nhiều lựa chọn), Phần II (Đúng/Sai), Phần III (Trả lời ngắn / Tự luận) |
| **QĐ 3588/QĐ-BGDĐT & QĐ 185/QĐ-BGDĐT** | Phê duyệt danh mục sách giáo khoa sử dụng trong cơ sở GDPT năm học 2026-2027 | Ban hành 26/12/2025 và 29/01/2026 | Xác định tính hợp lệ của đầu sách Toán 6 KNTT sử dụng trong năm học hiện hành |
| **TT 89/2026/TT-BGDĐT** | Quy định sửa đổi về kiểm tra đánh giá học sinh phổ thông | Ban hành 16/10/2026; **hiệu lực 01/12/2026** | Chế độ kiểm tra trên máy tính, lưu trữ hồ sơ điện tử và phương án dự phòng sự cố kỹ thuật |

---

## 3. Các điểm chưa chắc chắn và giới hạn kỹ thuật (`CHUA_XAC_MINH`)

1. **Khác biệt phân phối chương trình giữa các địa phương:**
   - Một số trường dạy song song Số học và Hình học (2 tiết Số, 2 tiết Hình/tuần), một số trường dạy cuốn chiếu theo chương. Đề thi kiểm tra giữa kỳ 1 có thể bao gồm hoặc chưa bao gồm phần Hình học trực quan (Chương IV).
   - *Biện pháp trong ExamCraft:* Cung cấp cấu hình linh hoạt cho phép giáo viên tự chọn phạm vi bài học khi tạo đề (`KnowledgeScopeEditor`), không ép cứng một ma trận duy nhất.
2. **Khác biệt giữa các bộ sách giáo khoa:**
   - Địa phương sử dụng bộ sách *Cánh Diều* hoặc *Chân trời sáng tạo* có tên bài và cách tiếp cận một số thuật ngữ hơi khác (ví dụ: Hình có trục đối xứng/tâm đối xứng được bố trí ở tập một hoặc tập hai).
   - *Trạng thái:* Ghi nhận nhãn `CHUA_XAC_MINH_CANH_DIEU` đối với các trường không dùng bộ Kết nối tri thức. Đợt pilot này chỉ tập trung vào bộ sách Kết nối tri thức để đảm bảo tính nhất quán.
3. **Số trang tham chiếu trong các ấn bản tái bản:**
   - NXB Giáo dục Việt Nam có các bản đính chính, trang cập nhật cho năm học 2026-2027. Do đó số trang ghi trong [01_MUC_LUC_VA_YEU_CAU.md](01_MUC_LUC_VA_YEU_CAU.md) có thể lệch $\pm 1$ đến $2$ trang so với ấn bản giấy in các năm trước.
4. **Quyền lưu trữ dữ liệu câu hỏi:**
   - Toàn bộ câu hỏi trong fixture kiểm thử là câu hỏi do nhóm kỹ thuật tự biên soạn tương đương theo YCCĐ, tuyệt đối không sao chép nguyên văn có bản quyền từ các đề thi chưa công khai của các trường.

---
*Hồ sơ thuộc gói `PILOT-TOAN-6`, mục `GEM-P3`.*
