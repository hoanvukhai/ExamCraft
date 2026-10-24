# Gói bằng chứng nghiên cứu ngày 22/10/2026

- [Báo cáo kết luận](../../07_CHOT_NGUON_NEN_VA_DANH_GIA.md).
- [Danh mục từng sách/học liệu](SACH_VA_HOC_LIEU.md), bản máy đọc [JSON](sach-va-hoc-lieu.json).
- [Ma trận từng lớp/môn](MA_TRAN_LOP_MON.md), bản máy đọc [JSON](ma-tran-lop-mon.json).
- [Manifest PDF](nguon/manifest.json): 5 tệp, URL tải, ngày, dung lượng và SHA-256.
- [Kết quả kiểm hồ sơ](KIEM_TRA_HO_SO.json): mã nguồn, số lượng, hash và liên kết nội bộ; không phải kết quả kiểm thử ứng dụng.

302 trang sách riêng biệt được thu từ 26 trang danh mục của NXB. Có 1.876 URL học liệu khác nhau được trang sách dẫn tới; các đích chưa được đọc/duyệt đầy đủ. 149/161 ô cơ sở có ít nhất một trang sách tương ứng trong lần thu này; 12 ô GDĐP chưa có ở danh mục NXB này. Chưa tính nhánh ngoại ngữ/trình độ/địa phương/chuyên đề như đã hoàn tất chỉ vì có số liệu này.

`danh-muc-nxb-dom.json` giữ metadata thô của danh mục; `hoc-lieu-nxb-dom.json` giữ quan sát trang chi tiết, một số quan sát là phần thay đổi giao diện. Đã mở lại đầy đủ các trang cần xác định nhãn lớp; `sach-va-hoc-lieu.json` là bảng chuẩn hóa để tra cứu. Không lưu toàn văn SGK vào bộ dữ liệu sản phẩm.

Các tệp `.cjs` tại đây chỉ phục vụ tạo/kiểm tài liệu từ dữ liệu đã thu, không thay ứng dụng, không tự thu mạng hoặc nạp DB. Không chạy lại công cụ hợp nhất106mã trong inbox để ghi đè sổ119mã hiện tại. Giữ bản nguồn trước khi cập nhật gói.
