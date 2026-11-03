# Đề xuất thông tin đề — nhóm nền Đ2

03/11/2026. Đang làm liên tục theo yêu cầu chủ dự án; không phải báo hoàn tất Đ1–Đ4.

Đã có: action update_metadata với allowlist tên/môn/lớp/phút/năm/học kỳ/đơn vị/mã/ghi chú; chặn owner/quyền/version, môn không thuộc catalog và dữ liệu không hợp lệ. Có đối chiếu trước/sau, nhận một gói, kiểm đúng tài khoản/quyền/bản nền và không áp hai lần. Đề có câu chưa được tự đổi môn/lớp để tránh gán nhãn mới lên câu cũ; cần gói thay nội dung ở bước sau. Đổi tên giữ ảnh/ngữ liệu/điểm 0/đáp án/lời giải. Idle HeaderForm cập nhật theo metadata mới; nháp đang sửa dở được giữ. Proposal mới về metadata dùng formatVersion 2, reader vẫn nhận v1, lỗi dữ liệu giữ bytes. Gỡ Hoàn tác riêng khỏi chat, dùng lịch sử chung của editor. Giữ thư viện lịch sử cũ để đọc/test tương thích, không còn mount UI điều khiển riêng.

Đã kiểm: guard 70/70; lint và build đạt; Chrome production 3/3 (2 nhóm và ca cha) kiểm preview không đổi đề, nhận→save→undo→reload, nháp mới hơn chặn proposal và proposal còn sau reload; integration 8/8. Log và browser-results.json cùng thư mục. Đúng DB thử examcraft_test_20261022, health/SQL đã kiểm; fixture dọn riêng. Không AI thật/migration/push/deploy.

Lần build đầu phát hiện fixture mới thiếu trường lời giải bắt buộc TypeScript; đã bổ sung rồi build đạt. Unit test phát hiện normalizer đề cho môn chuỗi tự do; đã thêm catalog guard tại metadata patch, không sửa hay từ chối dữ liệu legacy đang mở.

Chưa đủ Đ2: metadata và nhiều câu/phần/ngữ liệu trong cùng proposal; thay môn/lớp trên đề đã có câu, thông tin mục tiêu kỳ thi có schema riêng, assessment mode/scope/matrix phức tạp. Không nhận đã đáp ứng toàn bộ AC-26–32. Common undo kiểm desktop; điện thoại cần kiểm thêm khả năng tiếp cận nút.

Bước tiếp còn nhiều: hoàn thiện target nhiều câu/facts và bảo toàn phiên chat, bootstrap không mặc định môn/lớp, tạo cả đề có phần/ngữ liệu qua core chung, giới hạn media/budget, nghiệm thu đầy đủ Đ4. Giữ hướng đặc tả 1.1, không tạo migration. Máy chủ thử trong lượt này là 3123.

Bổ sung kiểm rộng: SAFE 604/604 đạt (bao gồm các test chat/metadata mới đã đưa vào script chính). Lượt đầu guard nguồn key quá chặt về cú pháp constructor; đã giữ điều kiện key callback, chỉ cho thêm cấu hình attempts=1 để SDK không tự gọi lại. Không nới sang key từ môi trường. Build ID K5yTvte0Ya6gh5nGStiyC; kiểm browser giữ đồng nhất bản production này. Máy chủ 3123 đã dừng sau kiểm.
