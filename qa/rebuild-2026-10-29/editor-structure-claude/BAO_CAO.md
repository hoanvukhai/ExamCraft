# Claude tiếp nối đợt cấu trúc đề (Codex dừng ở S7 do hết token)

Nhánh `claude/editor-structure` (nền `b7f2bc7` = bản WIP S3–S7 của Codex chưa commit, được commit nguyên trạng trước khi sửa). Không đổi schema Prisma, không ghi DB chính. Bản dựng riêng, cổng 3122, DB thử.

## Lỗi thật đã sửa
1. **Khung "Soạn câu mới" không đóng sau khi bấm Thêm vào đề** (câu đã vào đề nhưng khung mở lại từ nháp cũ, báo "đã đổi"): đóng khung ngay khi chèn thành công (`ExamWorkspace`).
2. **Trang soạn sập ("This page couldn't load") khi dàn ý lưu cục bộ lệch với câu của đề** (nháp cũ + sửa từ nơi khác): các màn hình giờ dựng lại dàn ý từ thứ tự câu (`viewSyncedOutline`) thay vì ném lỗi; đường lưu vẫn dùng `syncOutline` nghiêm ngặt.
3. **Dấu mốc nháp bị coi là "đã đổi" sau khi chèn câu** vì id nút dàn ý khác id nút dựng từ đề cũ: so hình dạng dàn ý, bỏ qua id (`structuralStampFields`).
4. Bộ kiểm cũ theo giao diện trước: cập nhật nhãn mới (Thêm, Thông tin đề, Hỏi AI, menu ☰ trên điện thoại, Rà soát đề/Cùng soạn trong "Thêm công cụ", khối soạn dở, "Giữ trong kho khôi phục"), thêm trợ giúp `toggleTheme/openAccount/railClick`, viết lại các ca dàn ý và phạm vi/ma trận cho bảng Thông tin đề.

## Kiểm
SAFE 530/530; tsc sạch; lint không lỗi. Trình duyệt: editor 9/9, frame 4/4, library 6/6, teacher 7/7, admin 11/11, typography 4/4; F4, F9, F19, F21 đạt.

## Chưa xong
- **F2 và F3** vẫn theo giao diện cũ (F2 còn thao tác "Thêm / sửa phần và nội dung dùng chung", gắn ngữ liệu bằng ô chọn ở câu); F3 phụ thuộc ngữ liệu do F2 tạo. Cần viết lại theo menu chèn "Ngữ liệu (nhóm mới)" / "Dùng nội dung chung đã có".
- Chưa chạy lại `npm run ci` đầy đủ, chưa thử trên điện thoại thật, chưa so DOCX từng loại với đề cũ ngoài các kiểm đơn vị của Codex.
- Phần S0–S7 do Codex làm chưa được Claude duyệt từng dòng; mới duyệt qua chạy kiểm và xem ảnh.
