# Việc tiếp theo sau hợp nhất 22/10/2026

**Phạm vi trang này là nghiên cứu nguồn.** Code đã được duyệt và triển khai sau mốc chuẩn bị; trạng thái kỹ thuật ở [hồ sơ tiếp nối](../ban-giao/00_DOC_TRUOC.md). Các mãNC/ND và việc duyệt nguồn vẫn giữ; không lấy câu chờ code tại mốc cũ làm yêu cầu xin duyệt lại.

## Cập nhật sau lượt chốt nguồn nền —22/10/2026

Đầu ra mới ở [báo cáo07](07_CHOT_NGUON_NEN_VA_DANH_GIA.md) và [hồ sơ trước code08](../ke-hoach-2026-10-21/08_HO_SO_TRUOC_KHI_CODE.md). Đã hoàn thành phân tích/kế hoạch cho mốc xác nhận kỹ thuật; chưa hoàn tất kho nội dung toàn môn. Các dòng “chưa xong” ở bảng cũ vẫn đúng với điều kiện kết thúc toàn bộ công việc, nhưng phần đã làm được ghi dưới đây.

| Mã | Đã có | Còn phải làm |
|---|---|---|
| NC05 | Kiểm TT20, đọc phần TT13; xác định nhóm sửa TT17; cách xử lý dự thảo2026 | Đối chiếu từng phụ lục và kiểm văn bản ký mới trước đóng gói |
| NC06 | Đọc phần liên quan TT22/CV7991; đọc QĐ2904 và10trangTT89; xác định01/12/2026 | Kiểm hướng dẫn áp dụng từng gói và người duyệt; không mặc định đang hiệu lực |
| NC07 | Lưu QĐ3588/QĐ185; xem đủQĐ185; chốt29/01; thông báo11sách sửa | Mapping từng cuốn/ấn bản với quyết định; chưa nhập nội dung sách |
| NC08 | Bổ sung Raglai; QĐ185 có tên sách và NN2theoquyển | Đối chiếu trình độ/NN1/NN2/thí điểm và người duyệt ngôn ngữ |
| NC09 | Chốt mô hình địa bàn/năm và đánh giá nguồn hiện có | Thiếu bộ tài liệu đúng địa phương/ba cấp; không báo phủ toàn quốc |
| NC10 | Mở302trang sách; ghi1876URL học liệu khác nhau; bảng161ô | Đọc từng đích, ấn bản/mục lục/quyền; Cánh Diều/CTST và nhánh phụ còn thiếu |
| NC11 | Có5đầu mối đề cụ thể mới, ghi đúng lỗi truy cập và thành phần thiếu | Chưa có bộ đề/chấm/rubric đã duyệt cho mọi ô |
| NC12 | Đánh giá từng nhóm, nêu dùng vào đâu và giới hạn | Duyệt chuyên môn/pháp lý/quyền dùng theo từng gói còn mở |
| NC13 | Hoàn tất thử mô hình trên giấy với10ca đối trọng | Chưa tạo/chạy fixture phần mềm |
| NC14 | Hồ sơ08 có kiến trúc, UX, lộ trình, checklist; chủ dự án đã duyệt bắt đầu code | Các cổng runtime và nghiệm thu còn lại theo checklistS0–S9; không cần xin lại quyết định bắt đầu |

Mã mới tiếp theo **TK-0068**. Bộ106mã ban đầu được giữ;13mã mới không đồng nghĩa13tài liệu đã duyệt. NXB0001–0302 là mã con của danh mục sách, không đếm lại thành mãTK. Hàng đợi này chuyển thành ND01–07 trong hồ sơ08 để tiếp tục xuyên lộ trình, không bị bỏ khi bắt đầu kỹ thuật.

---

Phần dưới lưu hàng đợi ban đầu và các điều kiện kết thúc còn áp dụng. Câu cấp mãTK0055 là mốc lịch sử, không dùng để cấp mã mới.

Đây là hàng đợi nghiên cứu hiện hành. Bộ bàn giao cũ giữ để truy vết. Không cần người dùng dán lại prompt hoặc thuê AI khác; tiếp tục trong chat dự án với danh mục 05. Chưa triển khai ứng dụng.

## 1. Các việc đã hoàn thành trong lượt hợp nhất

- [x] Tiếp nhận 10 bản tệp; xác nhận 5 cặp giống nhau bằng hash, giữ 5 bản gốc và manifest.
- [x] Đọc hai chat chia sẻ; đối chiếu đợt01–03.
- [x] Giữ đủ 52 mã SRC và54 mã TK trong sổ hợp nhất; xác nhận40 hàngTK cũ không thay đổi.
- [x] Sửa điểm tiếp tục, nguồn đã được bổ sung và cách đếm; ghi các kiểm tra web mới trong báo cáo04.
- [x] Bổ sung tác động vào tổng kết, khung dữ liệu, lộ trình và tiêu chí nghiệm thu.

Những dấu hoàn thành này chỉ nói về tài liệu chuẩn bị; không làm hoàn thành CV kỹ thuật hay việc duyệt nguồn.

## 2. Hàng đợi có đầu ra cụ thể

| Mã | Công việc | Đầu ra để kết thúc | Trạng thái |
|---|---|---|---|
| NC-05 | Chương trình và sửa đổi | Bảng TT32→TT20/2021→TT13/2022→TT17/2025 và cập nhật tìm được; từng phần sửa, ngày, bản đối chiếu, nguồn còn thiếu | Chưa xong |
| NC-06 | Quy định đánh giá | Hồ sơ TT27/2020, TT22/2021, CV7991 và cập nhật/hướng dẫn phù hợp; phân biệt tiểu học/THCS/THPT, định kỳ/thường xuyên; không tự gán cùng khung mức | Chưa xong |
| NC-07 | Sách năm học và ấn bản | Đối chiếu QĐ3588, QĐ185 và bổ sung; đọc bản scan, chốt ngày đúng; danh sách từng đầu sách có lớp/môn/tập/năm/loại sách | Chưa xong |
| NC-08 | Ngoại ngữ và tiếng dân tộc | Kiểm NN1/NN2, Hàn/Đức thí điểm, tám tiếng dân tộc, trình độ và bản cập nhật; không tự gắn lớp khi chưa có căn cứ | Chưa xong |
| NC-09 | GDĐP | Kiểm hướng dẫn chung và ví dụ đủ ba cấp; địa bàn/năm/địa giới và quyết định kèm phụ lục; giữ danh sách tỉnh/lớp chưa có | Chưa xong |
| NC-10 | Sách và học liệu lớp1–12 | Mỗi lớp có danh mục môn áp dụng và trạng thái từng loại SGK/SGV/SBT/mục lục/tập huấn/chuyên đề; URL từng cuốn thay vì chỉ cổng | Chưa xong |
| NC-11 | Đề và cách chấm lớp1–12 | Bộ tài liệu gắn nhau: đề, đáp án, thang điểm/rubric, ma trận/đặc tả nếu có; ghi rõ thiếu thành phần nào, năm/trường/tỉnh | Chưa xong |
| NC-12 | Đánh giá nguồn theo nhóm đủ hồ sơ | Phiếu nêu dùng được vào việc gì, phạm vi/phiên bản, bằng chứng trang/điều, mâu thuẫn, quyền lưu/dùng, người duyệt | Chưa xong |
| NC-13 | Thử mô hình dữ liệu bằng tài liệu | Toán ở ba cấp; Văn nhiều hướng trả lời; Ngoại ngữ nghe/ngữ liệu; KHTN thực hành; nghệ thuật/GDTC nhận xét; khảo sát không đáp án đúng | Chưa xong |
| NC-14 | Chốt trước triển khai | Bảng còn thiếu, phạm vi đã duyệt/chờ duyệt, điều chỉnh CV/NT và dự kiến từng đợt local; chủ dự án chốt bắt đầu code riêng | Chưa xong |

Thứ tự đề xuất: NC05–07 trước → NC08–09 theo phạm vi hữu hạn → NC10–11 theo lớp1→12 → NC12 cho nhóm đủ hồ sơ → NC13–14. Việc tìm bù là vòng lặp; thiếu một tỉnh không chặn toàn bộ sách/đề. Trong NC10–11 phải kiểm từng lớp và môn, không chỉ chọn môn dễ tìm. Một lượt10–20 mục là giới hạn tiện quản lý, không phải chỉ tiêu phải điền đủ.

Nếu cấp mã nguồn mới dùng TK-0055 trở đi; kiểm SRC/TK hiện có trước. K-01–07 trong báo cáo04 là sự kiện kiểm tra, không tự coi bảy tài liệu mới. Nguồn đã có thêm URL hoặc mở được lại chỉ cập nhật hồ sơ, không cấp mã mới.

## 3. Bảng kiểm độ phủ phải tạo khi thu chi tiết

Mỗi hàng: **lớp × môn/hoạt động × chương trình/vai trò ngôn ngữ × năm học/ấn bản × loại tài liệu**, thêm địa phương hoặc trình độ khi áp dụng. Không tạo giả tài liệu cho tổ hợp không tồn tại.

| Cột trạng thái | Cách dùng |
|---|---|
| Chưa tìm | Chưa thực hiện lượt tìm có phạm vi này |
| Có đầu mối | Mới có trang cổng/tin, chưa xác định tệp/cuốn |
| Có tài liệu | Định danh được tài liệu; ghi đã mở hay chưa và có lưu cục bộ hay không |
| Đã đọc phần liên quan | Ghi trang/điều cụ thể, không đánh đồng đọc bìa với đọc nội dung |
| Đủ để đánh giá | Có bản nguồn và sửa đổi cần thiết cho kết luận dự kiến; thiếu gì ghi rõ |
| Được duyệt sử dụng | Có người duyệt và phạm vi sử dụng; không tự nâng từ AI đã phân tích |
| Không áp dụng | Có lý do cụ thể cho tổ hợp môn/lớp/loại; thiếu nguồn không phải không áp dụng |
| Đã tìm chưa thấy / bị chặn | Ghi từ khóa/phạm vi đã thử, URL lỗi, ngày và việc tiếp |

Điều kiện đủ cho **một gói thử**: định danh chương trình đúng; ít nhất một mục lục có ấn bản và một bộ mẫu đánh giá đúng phạm vi; mỗi thành phần có nguồn, câu–đáp án liên kết; các điểm chưa duyệt được gắn rõ. Đây là ngưỡng thử mô hình, không phải số lượng đủ đại diện chất lượng cả môn.

Điều kiện đủ cho **tuyên bố phủ toàn dự án** cao hơn: mọi hàng áp dụng trong ma trận đã được xử lý, không còn lớp/môn bị bỏ trắng; gói phát hành đáp ứng tiêu chí riêng. Không dùng vài mẫu đại diện để báo xong cả1–12.

## 4. Nơi để tài liệu và bằng chứng

- Bản nhận từ chat/người dùng: `docs/nghien-cuu/inbox/<ngày>-<đợt>/`, giữ nguyên và lập manifest.
- Sổ đang dùng: `05_DANH_MUC_HOP_NHAT.md` và bảnJSON cùng tên. Cập nhật cả hai nếu sửa hàng; ghi nguồn gốc và trạng thái trước/sau.
- Hồ sơ phân tích: `docs/nghien-cuu/goi/<mã-gói>/`; lưu bảng kết luận, nguồn/trang chứng cứ và điểm chưa chốt.
- PDF công khai được phép lưu: thư mục `nguon` trong gói, kèm URL/ngày tải/hash; chưa tạo file rỗng giả đã tải. Sách hạn chế truy cập chỉ ghi metadata và đường truy cập hợp lệ.
- Không đưa API key, thông tin học sinh hoặc đề riêng lên kho chung. Không cần dữ liệu cá nhân để làm bộ mẫu ban đầu.

Người dùng chỉ cần gửi thêm tài liệu nếu có, không phải tự phân loại. Nếu chuyển sang chat mới, gửi báo cáo04 + danh mục05 + hàng đợi06; bản gốc trong inbox dùng khi cần so lại. Các prompt cũ vẫn hữu ích cho một nhiệm vụ chỉ thu thập, nhưng không dùng để quay về mốc40 mục.
