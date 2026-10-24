# BẢN MÔ TẢ TUYỂN GIÁO VIÊN THỬ NGHIỆM VÀ NGƯỜI DUYỆT CHUYÊN MÔN (PILOT)
*Tài liệu nội bộ điều phối dành cho Chủ dự án — Dự án ExamCraft*
*Căn cứ mốc kế hoạch điều phối 24/10/2026: [04_MOC_PILOT.md](04_MOC_PILOT.md)*

> [!IMPORTANT]
> **QUY TẮC PHỐI HỢP DÀNH CHO CÁC AI VÀ NHÓM KỸ THUẬT:**
> Tài liệu này được biên soạn độc quyền để **Chủ dự án sử dụng trực tiếp** trong công tác kết nối nhân sự thực tế. AI và nhóm kỹ thuật **tuyệt đối không tự ý gửi thư, liên hệ hay cam kết với bất kỳ cá nhân, giáo viên hay cơ sở giáo dục nào bên ngoài**.

---

## 1. Mục tiêu của đợt thử nghiệm Pilot

Sau khi hoàn tất việc ổn định kỹ thuật (chống mất nháp, bảo vệ giao dịch, mã hóa khóa AI, chống lộ đáp án), ExamCraft cần đưa vào sử dụng thực tế với người dùng thật trong môi trường kiểm soát hẹp:
- **Quy mô thử nghiệm:** 01 Giáo viên chính môn Toán 6 + 01 Giáo viên đồng nghiệp môn xã hội (Ngữ văn hoặc Tiếng Anh) + 01 Người duyệt chuyên môn (Tổ trưởng/Chuyên viên khảo thí).
- **Mục tiêu cốt lõi:** Đảm bảo toàn bộ 8 luồng thao tác (F1 đến F8) diễn ra trơn tru, không có lỗi đứng hình (crash), câu chữ dễ hiểu, và giáo viên cảm thấy an tâm khi giao bài cho học sinh mà không lo mất dữ liệu.

---

## 2. Tiêu chí lựa chọn nhân sự thử nghiệm (Profiles)

### A. Giáo viên thử nghiệm môn Toán 6 (Chính)
- **Đối tượng:** Giáo viên đang trực tiếp giảng dạy môn Toán lớp 6 tại trường THCS công lập hoặc tư thục.
- **Tiêu chuẩn chuyên môn:**
  * Đã giảng dạy chương trình GDPT 2018 ít nhất 01 năm học (ưu tiên giáo viên đang sử dụng bộ SGK *Kết nối tri thức với cuộc sống* hoặc *Cánh Diều*).
  * Nắm được cấu trúc định dạng câu hỏi theo Thông tư 22/2021 và Công văn 7991 (Trắc nghiệm nhiều lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn, Tự luận).
- **Kỹ năng công nghệ:** Có kỹ năng sử dụng máy tính cơ bản (soạn thảo Word, duyệt web Chrome/Edge). Không yêu cầu kiến thức kỹ thuật CNTT chuyên sâu.
- **Thái độ:** Nhiệt tình, sẵn sàng phản hồi thẳng thắn những điểm gây rối mắt, khó dùng trên giao diện.

### B. Giáo viên đồng nghiệp thử nghiệm môn thứ hai (Ngữ văn hoặc Tiếng Anh)
- **Đối tượng:** Giáo viên đang giảng dạy môn Ngữ văn hoặc Tiếng Anh cấp THCS (khối 6 hoặc 7).
- **Mục đích tham gia:**
  * Đóng vai trò đồng tác giả phản biện, kiểm thử tính năng nhận lời mời cộng tác sửa đề và phân quyền (`ExamCollaboratorsPanel`).
  * Kiểm thử việc tạo đề có **đoạn văn ngữ liệu dài** và câu hỏi tự luận chiếm tỷ trọng điểm cao, nhằm đảm bảo hệ thống không bị thiết kế thiên lệch chỉ phù hợp cho môn Toán.

### C. Người duyệt chuyên môn (Curriculum & Subject Reviewer)
- **Đối tượng:** Tổ trưởng chuyên môn, Tổ phó, hoặc Giáo viên cốt cán môn Toán/Văn có kinh nghiệm thẩm định đề thi định kỳ cấp trường/quận.
- **Nhiệm vụ trọng tâm:** Thẩm định tính chuẩn mực sư phạm của bảng ma trận đặc tả, sự phân bổ các cấp độ nhận thức (Biết - Hiểu - Vận dụng), và tính khả thi của barem chấm điểm tự luận.

---

## 3. Nhiệm vụ cụ thể trong đợt thử nghiệm

| Nhóm việc | Người thực hiện | Các bước cần làm | Tài liệu hướng dẫn đi kèm |
|---|---|---|---|
| **Luồng F1–F3:** Đăng nhập, Soạn đề & In ấn | Giáo viên chính (Toán 6) | 1. Đăng nhập và đổi mật khẩu khởi tạo.<br>2. Soạn thử 01 đề gồm đủ 7 dạng câu hỏi (có hình vẽ, công thức toán).<br>3. Xem bản in khổ giấy A4, thử trộn 4 mã đề.<br>4. Tải tệp Word (.docx) về mở trên máy tính cá nhân. | [THE_KIEM_TAY_PILOT.md](../huong-dan/THE_KIEM_TAY_PILOT.md) (Thẻ F1, F2, F3)<br>[HUONG_DAN_GIAO_VIEN_PILOT.md](../huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md) |
| **Luồng F4:** Chia sẻ & Mời đồng nghiệp | Giáo viên chính & Giáo viên đồng nghiệp | 1. Giáo viên chính gửi link xem tài liệu cho đồng nghiệp.<br>2. Mời đồng nghiệp vào cùng sửa đề qua email.<br>3. Đồng nghiệp mở đề chỉnh sửa và lưu thử.<br>4. Thử tính năng thu hồi quyền và quan sát việc chặn quyền an toàn. | [THE_KIEM_TAY_PILOT.md](../huong-dan/THE_KIEM_TAY_PILOT.md) (Thẻ F4) |
| **Luồng F5–F7:** Giao bài, Làm bài & Chấm thi | Giáo viên & Nhóm 5–10 học sinh thử nghiệm | 1. Giáo viên tạo phòng thi, đặt thời gian 15 phút, bật bảng xếp hạng Top & Me.<br>2. Gửi link cho 5–10 học sinh làm bài trên điện thoại hoặc máy tính.<br>3. Thử cho học sinh tắt mạng/F5 tải lại trang để chứng minh không mất bài làm.<br>4. Học sinh nộp bài; giáo viên vào chấm câu tự luận và xuất bảng điểm Excel CSV. | [THE_KIEM_TAY_PILOT.md](../huong-dan/THE_KIEM_TAY_PILOT.md) (Thẻ F5, F6, F7) |
| **Thẩm định chuyên môn** | Người duyệt chuyên môn | 1. Đối chiếu bảng mục lục và yêu cầu cần đạt với chương trình thật.<br>2. Đánh giá tính chính xác của thuật toán trộn phương án và ma trận đáp án.<br>3. Góp ý về cách diễn đạt barem chấm điểm tự luận. | [00_PHAM_VI.md](../nghien-cuu/goi/PILOT-TOAN-6/00_PHAM_VI.md)<br>[01_MUC_LUC_VA_YEU_CAU.md](../nghien-cuu/goi/PILOT-TOAN-6/01_MUC_LUC_VA_YEU_CAU.md) |

---

## 4. Dự kiến thời lượng và hình thức tổ chức

- **Thời gian cam kết ước tính:**
  * Giáo viên thử nghiệm: Khoảng **3 – 4 giờ** chia làm 2 buổi (Buổi 1: Soạn đề và làm quen công cụ; Buổi 2: Tổ chức bài thi thử và chấm điểm).
  * Người duyệt chuyên môn: Khoảng **1.5 – 2 giờ** rà soát hồ sơ và phản hồi sư phạm.
- **Hình thức triển khai:**
  * Chạy trên máy chủ thử nghiệm cục bộ của trường (hoặc máy xách tay của kỹ thuật viên dự án mang đến hỗ trợ trực tiếp).
  * Có kỹ thuật viên hỗ trợ 1:1, ghi nhận nhật ký thao tác và sẵn sàng giải đáp thắc mắc.

---

## 5. Quy định an toàn dữ liệu và quyền riêng tư (Data Privacy Boundaries)

Nhằm bảo vệ uy tín nhà trường và quyền lợi của người tham gia, dự án ExamCraft thiết lập các ranh giới bảo mật nghiêm ngặt sau:

1. **Không sử dụng dữ liệu định danh nhạy cảm:**
   - Tuyệt đối không thu thập số Căn cước công dân (CCCD), mã định danh học sinh, số điện thoại hay địa chỉ nhà riêng.
   - Khi tham gia phòng thi thử, học sinh chỉ cần điền tên gọi thông thường (Ví dụ: `An 6A1`, `Bình 6A1`).
2. **Không kết nối dịch vụ đám mây công cộng bên ngoài:**
   - Toàn bộ cơ sở dữ liệu bài thi được lưu trữ trên máy chủ cục bộ (Local Server) nội bộ.
   - Không tự động đồng bộ đề thi hay bài làm của học sinh lên bất kỳ nền tảng công cộng nào.
3. **Quyền sở hữu trí tuệ của Giáo viên:**
   - Mọi câu hỏi và đề thi do Thầy/Cô tự biên soạn thuộc quyền sở hữu riêng của Thầy/Cô.
   - Dự án không sử dụng dữ liệu đề thi này để đào tạo mô hình trí tuệ nhân tạo (AI training) nếu không có sự đồng ý bằng văn bản của tác giả.
4. **Không phát sinh chi phí:**
   - Thầy/Cô và học sinh hoàn toàn không phải trả bất kỳ khoản phí nào.
   - Thầy/Cô không cần khai báo thông tin thanh toán hay thẻ tín dụng. Việc sử dụng khóa AI trợ lý là hoàn toàn tự nguyện (Optional BYOK).

---

## 6. Mẫu thư mời tham gia thử nghiệm (Dành cho Chủ dự án gửi)

```text
Kính gửi: Thầy/Cô [Họ và tên giáo viên],

Nhóm nghiên cứu phát triển giải pháp khảo thí số ExamCraft trân trọng kính mời Thầy/Cô tham gia chương trình Trải nghiệm thử nghiệm (Pilot) hệ thống biên soạn đề thi chuẩn GDPT 2018.

Mục tiêu của đợt thử nghiệm là lắng nghe những đánh giá thực tế từ góc nhìn sư phạm của Thầy/Cô đối với quy trình: soạn thảo 7 dạng câu hỏi chuẩn chương trình mới, xem bản in A4, trộn mã đề, xuất tệp Word và tổ chức phòng thi trực tuyến an toàn không lo mất bài làm của học sinh.

Thông tin tóm tắt đợt thử nghiệm:
- Thời lượng: Khoảng 2 buổi làm việc (tổng cộng 3-4 giờ), thời gian do Thầy/Cô chủ động sắp xếp.
- Môi trường thử nghiệm: Máy chủ cục bộ độc lập, bảo mật tuyệt đối, không thu thập dữ liệu cá nhân nhạy cảm của học sinh.
- Hỗ trợ: Nhóm kỹ thuật đồng hành trực tiếp, hướng dẫn chi tiết từng thao tác.
- Quyền lợi: Thầy/Cô được trải nghiệm sớm công cụ hỗ trợ công việc giảng dạy và nhận thư cảm ơn / hỗ trợ chuyên môn từ dự án.

Chúng tôi rất mong nhận được sự đồng hành quý báu của Thầy/Cô để cùng hoàn thiện một sản phẩm thiết thực cho nền giáo dục phổ thông.

Trân trọng cảm ơn,
[Chủ dự án ExamCraft]
```

---
*Tài liệu thuộc hồ sơ điều phối dự án, nhiệm vụ `GEM-P4` (Generation 6).*
