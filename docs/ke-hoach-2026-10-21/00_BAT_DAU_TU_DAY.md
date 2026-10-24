# ExamCraft — Bộ tổng kết và kế hoạch thực hiện

**Tiếp nối công việc hiện tại:** đọc [hồ sơ bàn giao ngắn](../ban-giao/00_DOC_TRUOC.md). Trang này là mục lục kế hoạch; các mốc chuẩn bị bên dưới không phải trạng thái code hiện tại. Checklist03 vẫn là nguồn chính của78CV.

**Đã được duyệt bắt đầu code22/10/2026.** Theo dõi [báo cáo tiến độ chung](../TIEN_DO_CAI_TIEN_EXAMCRAFT.md). Các câu “chờ xác nhận/chưa bắt đầu” bên dưới là mốc chuẩn bị trước khi chủ dự án duyệt; kế hoạch và điều kiện chất lượng vẫn áp dụng. Phạm vi triển khai ưu tiên cá nhân/nhóm nội bộ nhỏ.

**Mốc chuẩn bị22/10/2026 — trước khi được duyệt code:** [08 — Hồ sơ chốt trước khi sửa code](08_HO_SO_TRUOC_KHI_CODE.md) ghi phương án, trình tự làm, UX, dữ liệu, kiểm thử và rủi ro. Nghiên cứu đã bổ sung5PDF,302trang sách và bảng161ô lớp–môn; xem [báo cáo nguồn07](../nghien-cuu/07_CHOT_NGUON_NEN_VA_DANH_GIA.md). Đây là kết quả thu/đánh giá nguồn, chưa phải kho nội dung đã duyệt toàn môn. Phần ghi mốc tiếp nhận bên dưới là lịch sử.

Ngày lập: **21/10/2026**. Trạng thái tại lúc lập: **đã tổng hợp định hướng và lập kế hoạch; chưa bắt đầu sửa ứng dụng theo kế hoạch này**.

Đây là mục lục kế hoạch; điểm vào tiếp nối hiện hành ở hồ sơ bàn giao nêu trên. Yêu cầu mới nhất của chủ dự án được ưu tiên; bộ kế hoạch này thay thế vai trò định hướng của các bản thiết kế và checklist cũ. Báo cáo cũ được giữ làm bằng chứng lịch sử, không cộng các dấu hoàn thành cũ vào tiến độ mới.

**Bổ sung22/10/2026:** đã tiếp nhận5 nội dung bàn giao và hai chat, hợp nhất52 mãSRC +54 mãTK. Đọc [báo cáo hợp nhất22/10](../nghien-cuu/04_TONG_HOP_VA_DINH_CHINH_2026-10-22.md) và [hàng đợi nghiên cứu](../nghien-cuu/06_VIEC_TIEP_THEO.md). Chưa đủ học liệu toàn môn/lớp; chưa bắt đầu sửa ứng dụng.

## Đọc theo nhu cầu

| Tài liệu | Dùng để làm gì? |
|---|---|
| [01 — Tổng kết dự án và phạm vi](01_TONG_KET_DU_AN.md) | Bản chính để chủ dự án đọc: sản phẩm, chức năng, giữ/thêm/sửa/bỏ và các quyết định |
| [02 — Lộ trình và phụ thuộc](02_LO_TRINH.md) | Thứ tự làm, đầu ra từng đợt và điều kiện chuyển bước |
| [03 — Checklist thực hiện](03_CHECKLIST.md) | Danh sách có mã, tiêu chí hoàn thành và nơi ghi bằng chứng |
| [04 — Kiểm thử và nghiệm thu](04_NGHIEM_THU.md) | Các tình huống kiểm tra thực tế, môn học, dữ liệu, quyền và file xuất |
| [05 — Chuẩn bị, rủi ro và nguồn](05_CHUAN_BI_VA_NGUON.md) | Cần chuẩn bị gì, ai làm, phần nào còn thiếu; liên kết báo cáo/nguồn gốc |
| [06 — Khung dữ liệu và ví dụ](06_KHUNG_DU_LIEU.md) | Hợp đồng khái niệm trước khi sửa schema/API, ví dụ câu–đáp án–mẫu–phiên bản |
| [07 — Nghiên cứu tài liệu và bộ prompt](07_NGHIEN_CUU_VA_PROMPT.md) | Ai tra cứu, cách tự tìm, prompt giao AI khác, nơi nhận và hợp nhất kết quả |
| [Danh mục tài liệu đã tìm thấy](../nghien-cuu/01_DANH_MUC_TAI_LIEU_TU_TIM.md) | Nguồn theo chương trình, lớp, môn, sách, kiểm tra và thể loại; trạng thái/thiếu sót được ghi rõ |

Chủ dự án có thể đọc 01 rồi 02 và phần cần cung cấp ở 05. Khi thực hiện, dùng 03 và 04; không yêu cầu giáo viên đọc tài liệu kỹ thuật này để dùng sản phẩm.

## Những nguyên tắc không được quên

- Công cụ phục vụ giáo viên; học sinh vào bài qua liên kết giáo viên mở.
- Đầy đủ các môn/lớp trong phạm vi sản phẩm. Toán là tuyến thử sớm của chủ dự án, không phải giới hạn triển khai.
- “Biết, Hiểu, Vận dụng” là ví dụ chủ dự án dùng để giải thích ý, không phải yêu cầu cố định ba mức. Khung áp dụng được đề xuất theo nguồn/phạm vi đã kiểm tra, không theo sở thích hoặc một enum cứng cho mọi cấp/môn.
- Riêng tư mặc định; xem công khai, góp ý, cùng sửa, tải/nhân bản và đóng góp kho AI có quyền riêng.
- Mẫu có nguồn nhưng giáo viên được tùy chỉnh; giao diện dễ hiểu và chỉ mở chi tiết khi cần.
- Dữ liệu lưu server, có lịch sử, backup và khôi phục. Drive là bản sao tùy chọn; chuyển DB tổng quát chưa phải điều kiện đầu tiên.
- Có code hoặc test cũ báo PASS chưa đủ để đánh dấu xong một chức năng.

## Cách duy trì bộ tài liệu

Mỗi yêu cầu có mã `YC-xx` trong 01; nhiệm vụ có mã `CV-xxx` trong 03; ca nghiệm thu có mã `NT-xx` trong 04. Khi thay đổi yêu cầu, sửa cả ba liên kết tương ứng, ghi ngày/lý do. Không tạo thêm một “master” cạnh tranh.

Chỉ đánh dấu checklist sau khi có đầu ra, bằng chứng kiểm tra và giới hạn còn lại. Việc chưa làm giữ `[ ]`. Các tùy chọn hoãn phải nêu rõ, không đánh dấu hoàn thành và không âm thầm xóa khỏi phạm vi.

Trạng thái tại lượt lập kế hoạch: hoàn thành **bộ tài liệu chuẩn bị**, chưa chứng nhận ứng dụng đã sửa hoặc sẵn sàng phát hành. Lượt đó không chạy migration, triển khai, backup/restore trên dữ liệu thật hoặc gọi AI mất phí. Trạng thái sau triển khai xem báo cáo tiến độ và hồ sơ tiếp nối.
