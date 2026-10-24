# Nháp từng writer và ô mở lại chung —23/10/2026

Sau nhóm vận hành, tiếp tục CV010/050 trong cùng lượt làm.

## Sửa

Mỗi writer ghi vào khóa localStorage riêng theo tài khoản/đề/writer **trước** cập nhật ô mở lại dùng chung. Hai tab đọc cùng giá trị ô chung cũ rồi ghi chồng không làm mất hai bản riêng. Không tuyên bố localStorage là giao dịch nguyên tử: tính bảo toàn đến từ hai khóa không bị writer khác ghi vào, khi setItem từng khóa thành công.

Giữ archive cũ/byte chưa đọc được; không xóa dữ liệu lịch sử. Khi một writer đổi sang tài liệu mới trong cùng ô, giữ bản cũ trước thay ô riêng. Danh sách phục hồi gộp các bản nội dung giống hệt để không hiện cả ô writer và ô chung trùng nhau; bản khác nội dung vẫn hiện riêng. Khôi phục từ ô writer được mở thành bản mới như các recovery khác, không ghi đè server.

Lưu thành công đề mới không còn removeItem ô `new` dùng chung. Ghi xác nhận kết thúc riêng writer đã được server ack; read/list bỏ qua con trỏ cũ của writer đó, nháp tab khác giữ nguyên. Quota/lỗi ô riêng xảy ra trước khi cập nhật con trỏ chung và được đẩy ra cho giao diện; khi server đã ack thì lỗi ghi cache không phủ nhận kết quả server.

## Kiểm

- Hai ca unit mới mô phỏng mọi lượt đọc ô chung thấy cùng giá trị cũ, nhưng khóa writer đọc/ghi thật trong store mô phỏng: giữ đủ A/B, đúng tài khoản; ack B không mất A. Kiểm retire A không đổi ô new của B, quota ô riêng không tiến con trỏ và retire B làm con trỏ cũ không mở lại nháp đã lưu.
- SAFE20+123=143đạt; build/typecheck44trang đạt. [SAFE](safe-writer-slots.log), [build](build-writer-slots.log). ESLint helper draft và test sửa đạt. HTTP16kế thừa vì không đổi API; không suy các test helper thành UI React đầy đủ.
- Harness gọi trực tiếp helper production trong **hai tab IAB thật**, origin riêng3121/owner QA ngẫu nhiên: ghi A, ghi B, reload A, đọc được cả A/B với điểm0/lời giải. [DOM](writer-both-after-reload.json), [ảnh](writer-both-after-reload.png).
- Tab B xác nhận lưu, tab A đọc lại vẫn còn nháp A,0nháp tài khoản khác/0bản không đọc được. [DOM](writer-a-survives-b-save.json), [ảnh](writer-a-survives-b-save.png). Không DB/AI hoặc xóa localStorage. Server harness đã dừng, hai tab QA đã đóng; dữ liệu giả được giữ.

## Giới hạn

Hai tab không phải hai trình duyệt độc lập. Còn UI React đề mới→server ack nhiều tab, offline/reload/reconnect đầy đủ, phản hồi đến muộn và thu hồi quyền theo toàn tiêu chí CV010/050. Bản cũ không có writer chỉ được archive khi đọc thấy nó; không thể bảo đảm writer cũ đang chạy bundle trước bản sửa cũng tuân theo khóa riêng. LocalStorage bị chặn/hết dung lượng vẫn cần tải nháp đang mở, không có lời hứa lưu thành công nếu trình duyệt từ chối ghi.

Mỗi lần mở bàn soạn có writer mới; các ô đã lưu và archive được giữ, chưa tự dọn. CV010/050 tiếp tục mở, không đóng từ số test hay ca harness.
