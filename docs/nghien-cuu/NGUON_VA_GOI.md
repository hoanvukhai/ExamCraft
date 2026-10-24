# Sổ nguồn và gói nghiên cứu

**Cập nhật 22/10/2026:** đã hợp nhất bàn giao đợt01–03. Dùng [báo cáo hiện hành](04_TONG_HOP_VA_DINH_CHINH_2026-10-22.md), [danh mục SRC+TK](05_DANH_MUC_HOP_NHAT.md) và [việc tiếp theo](06_VIEC_TIEP_THEO.md). Nội dung bên dưới là mốc nghiên cứu trước; không dùng số52 hoặc hàng đợi cũ làm tiến độ toàn kho.


**Đính chính sau rà soát:** 52 mã là số mục quản lý; 7 mục là nhu cầu chưa có URL, 4 cặp trùng URL. Có 41 URL khác nhau, gồm cả trang đầu mối, bài tin và link chưa mở được; không phải 52 tài liệu đã thu. Xem [biên bản rà soát](03_RA_SOAT_DANH_MUC.md). Giữ mã cũ để truy vết; không cộng dòng trùng hoặc dòng nhu cầu vào số tài liệu mới.

Ngày khởi tạo: 21/10/2026. Đây là sổ nghiên cứu, không chứng nhận hiệu lực đầy đủ hay chuyên môn.

## Trạng thái nguồn

`TIM_THAY` → `DA_MO` → `DA_DOC_PHAN_LIEN_QUAN`. Kiểm nội dung, kiểm hiệu lực và duyệt chuyên môn là ba cột độc lập. Không có bước tự động từ đã đọc sang đã duyệt.

| ID | Nguồn | Trạng thái thực tế | Vị trí/bằng chứng dùng | Giới hạn |
|---|---|---|---|---|
| SRC-001 | [CV 7991, bản sao PDF](https://cdn.thuvienphapluat.vn/phap-luat/2022-2/PNHP/thang-12/19/file/cong-van-7991-huong-dan-KTDGDK.pdf) | Đã đọc phần liên quan ngày 21/10/2026 | PDF trang 1: phạm vi hướng dẫn ma trận; trang 2–3: cột mức và đặc tả | Đơn vị ban hành Bộ GDĐT, bản lưu ở bên thứ ba; chưa kết luận đầy đủ mọi văn bản sửa đổi/địa phương |
| SRC-002 | [TT 27/2020, Công báo](https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2020/9/32035/32512-1-2020883-88427-2020-tt-bgddt.pdf) | Đã đọc phần liên quan ngày 21/10/2026 | Điều 7.1.c, PDF trang 7, mô tả các mức thiết kế câu hỏi tiểu học | Chưa hợp nhất tất cả sửa đổi đến thời điểm triển khai; không tự nạp thành quy tắc máy |
| SRC-003 | [Chương trình Toán, ứng viên bản lưu tại Đại học Cần Thơ](https://se.ctu.edu.vn/images/upload/thongbao/TT32.pdf) | Tìm thấy; thử mở không thành công do công cụ giới hạn kích thước PDF | Chỉ có metadata/kết quả tìm kiếm; chưa dùng để trích yêu cầu cần đạt | CHUA_DOC; cần bản truy cập được hoặc tệp được cung cấp |

Đợt tìm nguồn tiếp theo đã bổ sung **SRC-004–SRC-052** trong [danh mục thu thập theo lớp, môn, bộ sách và thể loại](01_DANH_MUC_TAI_LIEU_TU_TIM.md). Các nguồn mới được ghi ở mức đã tìm thấy/đầu mối, không chuyển thành “đã đọc” chỉ vì công cụ tìm kiếm trích một đoạn. Mục này còn các lỗ hổng rõ ràng: chưa lập inventory từng cuốn SGK, chưa thu đủ mẫu đề theo môn/lớp và chưa bao phủ đề địa phương.

Không có bản PDF nào ở trên đã được tải vào repo trong lượt này. Link nguồn cũ khác tiếp tục nằm ở [danh mục chuẩn bị](../ke-hoach-2026-10-21/05_CHUAN_BI_VA_NGUON.md); chưa giả định mọi nguồn trong danh mục đã được kiểm lại ở lượt mới.

## Gói nghiên cứu

| Mã | Phạm vi | Trạng thái | Việc tiếp theo |
|---|---|---|---|
| NC-001-KHUNG-DANH-GIA-R01 | Nguồn về mức thiết kế câu hỏi theo cấp/phạm vi | Đã đối chiếu bước đầu SRC-001/002; chưa hoàn tất rà hiệu lực | Đánh giá sau khi hoàn tất thu thập nguồn gốc/sửa đổi liên quan |
| NC-002-TOAN-6-R01 | Chương trình/yêu cầu cần đạt Toán 6 | Tìm nguồn nền SRC-004/005; chưa trích xuất | Thu/ghi tệp phụ lục đúng rồi mới đánh giá/trích xuất |
| NC-003-TOAN-6-KNTT-T1-R01 | Mục lục một bộ sách/tập | Có đầu mối SRC-011/012; chưa lập inventory/ấn bản | Thu đúng đầu sách, ấn bản, tệp mục lục trước khi đánh giá |
| NC-004-BAO-PHU-1-12-R01 | Danh mục nguồn toàn môn/lớp/thể loại | Đang tìm; danh mục mở đầu SRC-004–052 | Hoàn thiện inventory nguồn và đánh dấu thiếu trước khi chuyển bước đánh giá |

Gói Toán là ví dụ để thử phương pháp. Danh mục toàn dự án vẫn gồm mọi môn/lớp mục tiêu; phải mở thêm gói khác biệt khi kiểm mô hình dùng chung.

## Khuôn thêm nguồn

ID; tên; đơn vị ban hành/tác giả; nơi lưu; URL/tệp; ngày ban hành; ngày hiệu lực đã xác minh hay chưa; phiên bản/ấn bản; môn/lớp/địa phương; trang/điều đã đọc; kết luận được hỗ trợ; giới hạn; quyền lưu/sử dụng; ngày kiểm; người kiểm; gói sử dụng.
