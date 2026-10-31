# Trang soạn V2-2 → V2-6 (trang, trình chiếu, trang in, cùng soạn, điện thoại)

Nhánh `claude/editor-v2`. Chỉ chạy trên DB thử `examcraft_test_20261022`; DB thật chưa áp migration.

## Đã làm
- **V2-2 Trang**: tờ đề chia trang thật (khối câu không bị cắt đôi), dải trang có hình thu nhỏ, kéo đổi chỗ, "+" thêm trang, lưới trang, nhãn "Trang n" chọn được trên tờ, "Bắt đầu câu này ở trang mới", sao chép/dán câu (Ctrl+C/V) giữa các đề.
- **V2-3 Trình chiếu**: số câu theo số in trên đề, bắt đầu từ câu đang chọn, ngữ liệu mở sẵn (cạnh câu trên màn rộng), toàn màn hình, phím Space/Home/End.
- **V2-4 Trang in**: phông chữ, cỡ chữ, lề (`metadata.pageSetup`), áp cho tờ đề và file Word; Word giữ câu và các phương án cùng trang. Đề cũ không có `pageSetup` giữ nguyên.
- **V2-5 Cùng soạn (không realtime)**: bảng `ExamPresence` + `POST /api/exams/[id]/presence` (8 giây/lần và ngay khi đổi mục chọn), avatar người đang mở, viền nét đứt tại chỗ người khác đang đứng, khóa mềm ("X đang sửa mục này" + [Góp ý] [Vẫn sửa]), tự ghép khi hai người sửa chỗ khác nhau (`src/lib/exam-merge.ts`); cùng một chỗ thì hiện lựa chọn [Của tôi]/[Của người kia] trong cửa sổ trạng thái lưu (test collab có cả hai ca), thông báo "X vừa sửa Câu n" và danh sách trong cửa sổ trạng thái lưu.
- **V2-6 Điện thoại**: "‹ n/N ›" thay dải trang, bảng Chi tiết thành ngăn kéo dưới.

## Kiểm
- tsc, eslint sạch; màu cứng 2488 (bằng mức nền).
- `test:unit` 20/20; nhóm safe 586/586 (đã thêm pagination, exam_clipboard, page_setup, exam_merge).
- Trình duyệt (build production, cổng 3130): editor 11/11, frame 4/4, typography 4/4, teacher 7/7, library 6/6, admin 11/11, **collab (mới) 1/1** gồm 2 tài khoản: thấy nhau, viền, khóa mềm, ghép sửa khác chỗ và lưu cả hai.
- Pilot F1–F25 (trừ F8): 24/24 qua trong một lần chạy đầy đủ.
- Điện thoại 320/375/568: không tràn ngang; ảnh `phone-*.png`.
- Ảnh: `pages-strip-1440.png`, `pages-grid-1440.png` (đề 22 câu → 4 trang).

## Giới hạn, chưa làm
- Chưa có "từ lần trước bạn mở" (cột `seenVersion` đã có, chưa dùng).
- Thăm dò 8 giây vẫn tải cả đề mỗi lần; chưa tối ưu.
- Lưới trang hiện nằm phía trên tờ đề, chưa phủ toàn khung.
- Phông/cỡ chữ lớn làm lệch chia trang chưa đo kỹ (dùng `zoom` CSS).
- Chân trang in từng trang còn đơn giản; đầu trang 3 cột và gõ trực tiếp trên giấy chưa làm (đã hoãn theo đặc tả).
- Điện thoại: dưới tờ đề vẫn xếp 3 hàng nút (tab xem, thu phóng, thanh công cụ), chưa gọn xuống 2 hàng.
- Cần áp migration `20261031000100_exam_presence` lên DB thật (sao lưu trước) khi chủ đề đồng ý.
