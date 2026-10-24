# GÓI CHUẨN BỊ NỘI DUNG PILOT: MÔN NGỮ VĂN 11 — PHẠM VI VÀ CĂN CỨ
*Mã gói tài liệu: `PILOT-MON-2`*
*Trạng thái pháp lý và học liệu: **CHỜ DUYỆT CHUYÊN MÔN (CHUA_XAC_MINH_TOAN_VAN)***

- **Người thực hiện:** Gemini (QA / Nghiên cứu tài liệu chương trình)
- **Nhiệm vụ:** `GEM-P6` thuộc `GEMINI-PILOT-PREP` (Generation 6, [ASSIGNMENTS.json](../../../qa/ai-review/coordination/ASSIGNMENTS.json))
- **Mốc kế hoạch:** [docs/phoi-hop-ai/04_MOC_PILOT.md](../../phoi-hop-ai/04_MOC_PILOT.md)
- **Thời điểm lập hồ sơ (UTC):** 2026-10-24T14:55:00Z
- **Nguyên tắc an toàn:** Dữ liệu chuẩn bị tài liệu, **tuyệt đối không nạp vào mã nguồn hoặc ghi vào cơ sở dữ liệu chính**.

---

> [!WARNING]
> **TÍNH CHẤT PHÁP LÝ VÀ CHUYÊN MÔN CỦA GÓI TÀI LIỆU:**
> 1. Tài liệu này là **khung khảo sát môn học thứ hai (không phải Toán)** nhằm kiểm nghiệm việc thiết kế hệ thống ExamCraft không bị thiên lệch kỹ thuật, hỗ trợ tốt cho các môn khoa học xã hội có ngữ liệu đọc hiểu dài và câu hỏi tự luận mở.
> 2. Toàn bộ nội dung mục lục và yêu cầu cần đạt (YCCĐ) được trích cứu từ Chương trình GDPT 2018 môn Ngữ văn (Thông tư 32/2018/TT-BGDĐT) và cổng tập huấn NXB Giáo dục Việt Nam.
> 3. **Chưa có biên bản nghiệm thu của Hội đồng thẩm định chuyên môn.** Không sử dụng gói này để công bố thương mại hay tuyên bố hoàn tất kho dữ liệu.

---

## 1. Phạm vi chương trình và đối tượng thử nghiệm

- **Cấp học & Khối lớp:** Trung học phổ thông (THPT) — Lớp 11.
- **Môn học:** Ngữ văn (Mã nội bộ: `ngu_van`).
- **Giai đoạn áp dụng:** Học kỳ I (Bài kiểm tra định kỳ: Giữa học kỳ 1 và Cuối học kỳ 1).
- **Bộ sách giáo khoa chọn làm đối chiếu:**
  * **Tên bộ sách:** *Kết nối tri thức với cuộc sống* (Nhà xuất bản Giáo dục Việt Nam).
  * **Đầu sách:** *Ngữ văn 11 — Tập một* (Tổng Chủ biên: Bùi Mạnh Nhị; Chủ biên: Phan Huy Dũng).
  * **Mã định danh sổ nguồn:** `NXB-0028` (theo [docs/nghien-cuu/goi/NC-NEN-2026-10-22/SACH_VA_HOC_LIEU.md](../NC-NEN-2026-10-22/SACH_VA_HOC_LIEU.md)).
  * **Liên kết cổng tập huấn NXB:** [Chi tiết sách Ngữ văn 11 tập 1](https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/ngu-van-11-tap-mot-939696849.939696849) | [Đọc trực tuyến SGK](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-ngu-van-11-tap-mot.4701014733).

---

## 2. Các văn bản pháp lý và tiêu chuẩn đối chiếu

| Ký hiệu văn bản | Tên văn bản & Cơ quan ban hành | Mốc thời gian & Hiệu lực | Nội dung đối chiếu trong gói pilot môn Ngữ văn |
|---|---|---|---|
| **TT 32/2018/TT-BGDĐT** | Ban hành Chương trình GDPT (Phụ lục môn Ngữ văn) | Ban hành 26/12/2018; áp dụng lớp 11 từ 2023-2024 | Khung năng lực ngôn ngữ, văn học, các thể loại văn bản (truyện thơ, thơ có yếu tố tượng trưng, phóng sự, truyện ngắn hiện đại) và YCCĐ lớp 11 |
| **CV 3175/BGDĐT-GDTrH** | Hướng dẫn đổi mới phương pháp dạy học và kiểm tra, đánh giá môn Ngữ văn | Ban hành 21/07/2022 | **Quy định cốt lõi:** *"Trong đánh giá kết quả học tập cuối học kì, cuối năm học, cuối cấp học, tránh dùng lại các văn bản đã học trong sách giáo khoa làm ngữ liệu xây dựng các đề kiểm tra đọc hiểu và viết"* |
| **TT 22/2021/TT-BGDĐT** | Quy định về đánh giá học sinh THCS và học sinh THPT | Ban hành 20/07/2021 | Đánh giá định kỳ kết hợp nhận xét chi tiết và điểm số; hỗ trợ bài kiểm tra tự luận viết dài |
| **CV 7991/BGDĐT-GDTrH** | Hướng dẫn xây dựng ma trận, đặc tả và đề kiểm tra định kỳ | Ban hành 10/12/2024 | Tỷ lệ đề Ngữ văn tham khảo: Đọc hiểu (4.0 điểm - kết hợp trắc nghiệm khách quan và trả lời ngắn) + Viết (6.0 điểm - bài nghị luận xã hội / văn học) |

---

## 3. Đặc thù bộ môn và yêu cầu kiến trúc đối với ExamCraft

Khác biệt cơ bản giữa môn Ngữ văn và môn Toán đòi hỏi hệ thống ExamCraft phải đáp ứng các năng lực kỹ thuật chuyên biệt:

1. **Khung ngữ liệu đọc hiểu dài (Long Passages):**
   - Đề thi Ngữ văn thường có 1 đến 2 ngữ liệu văn bản dài (từ 300 đến 800 từ) dùng chung cho 5–8 câu hỏi đọc hiểu.
   - Giao diện làm bài của học sinh (`/a/[publicId]`) và bản in A4 (`A4Preview`) phải hiển thị ngữ liệu ở vị trí nổi bật, rõ ràng, không bị ngắt trang vô lý giữa các câu văn.
2. **Không áp đặt đáp án duy nhất (Open-ended Evaluation):**
   - Các câu hỏi tự luận hoặc câu hỏi đọc hiểu mức độ vận dụng (ví dụ: *"Thông điệp ý nghĩa nhất với em là gì? Vì sao?"*) cho phép học sinh trả lời theo nhiều hướng tiếp cận khác nhau.
   - Hệ thống không được dùng cơ chế so khớp chuỗi cứng nhắc để tự động chấm sai; bắt buộc định tuyến câu hỏi sang giao diện chấm thủ công của giáo viên (`TeacherGradeEditor`).
3. **Barem chấm điểm đa tiêu chí (Rubric):**
   - Mỗi câu viết (đoạn văn 2.0 điểm hoặc bài văn 4.0 điểm) phải có bảng rubric phân tách rõ ràng:
     * *Tiêu chí hình thức:* Đúng dung lượng đoạn/bài, bố cục 3 phần rõ ràng.
     * *Tiêu chí nội dung:* Xác định đúng vấn đề, triển khai luận điểm thuyết phục, dẫn chứng xác thực.
     * *Tiêu chí chính tả, ngữ pháp & Sáng tạo:* Diễn đạt giàu hình ảnh, có liên hệ thực tế độc đáo.
4. **Ngữ liệu ngoài sách giáo khoa:**
   - Theo Công văn 3175, câu hỏi thi định kỳ phải lấy văn bản ngoài SGK nhưng cùng thể loại và đặc trưng thẩm mỹ với bài học. Do đó, các bài tập trong SGK chỉ đóng vai trò là mẫu thể loại để xây dựng ma trận đặc tả.

---
*Hồ sơ thuộc gói `PILOT-MON-2`, nhiệm vụ `GEM-P6`.*
