# BÁO CÁO THĂM DÒ: PERSONA 2 ("EM MINH — HỌC SINH LỚP 12 TÌM CÁCH GIAN LẬN")

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

- **Nhân vật**: Em Minh, học sinh lớp 12, dùng điện thoại màn hình 360px mạng 4G chập chờn, rành công nghệ, cố tình tìm cách gian lận để đạt điểm cao.
- **Mục tiêu thăm dò**: Đổi giờ máy tính/điện thoại, F5 tải lại, mở DevTools tìm đáp án, chọn tên bạn khác để xem điểm.

---

## 1. CÁC HÀNH VI THỬ NGHIỆM GIAN LẬN

1. **Thử đổi giờ trên điện thoại (Tua lùi 30 phút)**:
   - Minh đổi giờ điện thoại lùi lại 30 phút để mong kéo dài thời gian làm bài.
   - *Kết quả*: **THẤT BẠI**. Bộ đếm thời gian tính theo `deadlineAt` của server. Khi hết giờ server, trang web tự động khóa và nộp bài.

2. **Soi mã nguồn mạng (DevTools Network / Elements)**:
   - Minh mở tab Network xem gói tin JSON trả về từ `/api/public/assignments/[publicId]`.
   - *Kết quả*: **THẤT BẠI**. Dữ liệu đã đi qua `sanitizeSnapshotForStudent`, hoàn toàn không có `correct`, `isCorrect` hay `solution`.

3. **Thử khai thác route cũ `/test/[id]` và `/api/cloud/exams/[id]` (R6)**:
   - Minh tìm thấy link đề thi dạng cũ trên nhóm học tập.
   - Gọi `GET /api/cloud/exams/[id]`.
   - *Kết quả*: **GIAN LẬN THÀNH CÔNG (CRITICAL BUG)**! Minh lấy được toàn bộ 100% đề thi có sẵn đáp án và lời giải chi tiết trước giờ thi!

4. **Chọn tên bạn khác (`PICK_FROM_LIST`) (R8)**:
   - Minh bấm vào link lớp `/c/[groupCode]`, chọn tên bạn "Nguyễn Văn An" để xem bạn được mấy điểm.
   - *Kết quả*: Minh thấy được điểm tổng kết của An nếu bài thi cấu hình hiển thị điểm.
   - *Nhận định*: Đây là sự đánh đổi đã được chấp nhận của mô hình không cần tài khoản (Zero-Account model). Muốn khắc phục cần bật tính năng PIN phòng thi.
