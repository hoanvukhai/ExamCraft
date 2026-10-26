# 10. Bảng tổng hợp kết quả và mẫu báo lỗi

## 10A. Bảng tổng hợp (điền sau khi xong từng phần)

Đếm số dòng **Đ**, **K**, **B** trong mỗi phần rồi điền. Một phần "xong" khi không còn dòng 🔴 nào chưa làm.

| Phần | Nội dung | Số dòng | Đ | K | B | 🔴 trượt | Người test | Ngày |
|---|---|---|---|---|---|---|---|---|
| 01 | Tài khoản và Kho đề | | | | | | | |
| 02 | Soạn đề | | | | | | | |
| 03 | Nhập đề | | | | | | | |
| 04 | AI | | | | | | | |
| 05 | Xuất, in, trình chiếu, trộn đề | | | | | | | |
| 06 | Chia sẻ, cộng tác, ngân hàng | | | | | | | |
| 07 | Lớp, giao bài, học sinh, chấm | | | | | | | |
| 08 | Mất mạng, sao lưu, bảo mật, giao diện | | | | | | | |
| 09 | Từng môn | | | | | | | |
| | **Cộng** | | | | | | | |

Có thể để máy đếm thay: `node scripts/tally-test-results.cjs <thư mục đã điền>` in số Đ, K, B và liệt kê các dòng không đạt (🔴 trước).

## 10B. Cách đọc kết quả

- **Có bất kỳ dòng 🔴 K** → có lỗi chặn (quyền, mất dữ liệu, đáp án, điểm): sửa xong mới dùng cho lớp thật.
- **K ở 🟡** → ghi lại, xếp việc sửa; có thể dùng tạm nếu có cách làm khác.
- **K ở 🟢** → hình thức, sửa khi thuận tiện.
- **Nhiều B** → thường là chưa có khóa AI hoặc chưa có máy/phần mềm; ghi lý do và làm bù lần sau.

## 10C. Mẫu báo lỗi (sao chép cho mỗi lỗi)

Gửi cho người sửa (hoặc cho Claude) qua cuộc trò chuyện, kèm ảnh chụp màn hình. Xem thêm [PHIEU_GHI_LOI.md](../PHIEU_GHI_LOI.md).

```
Mã dòng test:        (ví dụ T07-26)
Mức:                 🔴 / 🟡 / 🟢
Người test, vai:     (A / B / HS), trình duyệt, máy tính hay điện thoại
Đề / lớp / bài giao: (tên có tiền tố TEST-)
Đã làm:              1) ... 2) ... 3) ...
Thấy gì:             ...
Mong đợi:            ...
Lặp lại được không:  luôn luôn / thỉnh thoảng / một lần
Ảnh chụp, tệp:       (đính kèm)
Có mất dữ liệu / lộ đáp án / sai điểm không:  có / không
```

## 10D. Khi phát hiện lỗi nặng giữa chừng

1. Dừng thao tác trên đề, lớp, bài giao đó.
2. Chụp màn hình toàn bộ (thấy cả thanh địa chỉ).
3. Ghi lại giờ chính xác và việc vừa làm.
4. **Không** xóa hoặc sửa gì để "cho sạch": giữ nguyên hiện trường.
5. Nếu nghi mất dữ liệu: dùng gói sao lưu ở T09-20 để so sánh.

## 10E. Dọn dẹp sau khi test

1. Lọc đề theo `TEST-` và chuyển hết vào **Thùng rác**; vào thùng rác xóa vĩnh viễn nếu cần.
2. Xóa các lớp `TEST-Lop-*` (và học sinh thử).
3. Xóa hai tài khoản thử `gv1`, `gv2` bằng cách khóa trong `/admin/users` (hoặc giữ nếu còn dùng).
4. Xóa các khóa AI thử trong **Khóa AI của bạn** nếu không dùng nữa.
5. Chạy lại sao lưu (T09-20) để có bản sạch sau khi test.
