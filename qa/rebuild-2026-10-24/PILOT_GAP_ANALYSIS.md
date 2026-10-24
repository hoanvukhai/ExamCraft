# Phân tích khoảng cách pilot — 24/10/2026 (người chỉ đạo)

Đọc tĩnh mã và hồ sơ theo luồng F1–F8 trong [04_MOC_PILOT](../../docs/phoi-hop-ai/04_MOC_PILOT.md). **Chưa chạy gì** (chưa build, chưa test); các kết luận dưới đây là "có mã/chưa thấy mã", không phải "đạt". Bộ kiểm tự động của Codex sẽ xác nhận hoặc bác bỏ.

## 1. Khoảng cách thấy được bằng đọc mã

| # | Luồng/CV | Khoảng cách | Mức | Ai làm |
|---|---|---|---|---|
| A | F5 / CV054, 056 | Hộp thoại giao bài chỉ cho chọn lớp, kiểu nhận diện, thời lượng, hiện kết quả/lời giải, bảng xếp hạng. **Thiếu** giờ mở/đóng, số lượt (đang cứng 1 lượt nếu "kiểm tra", 3 lượt nếu khác), mã vào bài, PIN, trộn câu/đáp án của bài giao; API đã hỗ trợ các trường này | Cao: giáo viên không đặt được hạn nộp | Claude (tính năng mới, giao diện + hợp đồng) |
| B | F3 / CV024 | Có bốn chế độ xem: Đề, Đáp án và barem, Lời giải, Ma trận. **Chưa có "Song song"** (đề và đáp án cạnh nhau) như yêu cầu YC-09 | Trung bình | Claude (thiết kế + làm) |
| C | F3 / CV043, 044 | Word xuất theo chế độ xem và tiêu đề tùy biến; in dùng `window.print()`. Chưa có kiểm trực quan Word và bản in nhiều trang | Trung bình; cần mắt người hoặc ảnh chụp | Gemini viết thẻ kiểm; chủ dự án/giáo viên mở Word |
| D | F3 / CV042 | Trộn mã đề có hộp thoại riêng; chưa kiểm luồng trộn → xuất nhiều mã trên giao diện | Trung bình | Codex (bộ kiểm tự động) |
| E | F2 / CV023, 026 | Soạn bảy dạng, hình và ngữ liệu có mã; chưa có kiểm tự động trên giao diện cho cả bảy dạng | Trung bình | Codex (bộ kiểm tự động) |
| F | F6–F7 / CV057–062 | Đã kiểm tay trên giao diện (nháp, nộp, chấm, CSV). Chưa có kiểm tự động lặp lại | Thấp | Codex (bộ kiểm tự động) |
| G | F4 / CV011, 047, 048 | Mời xem/góp ý/sửa, thu hồi, sao chép từ link có kiểm API; chưa kiểm trên giao diện hai tài khoản | Trung bình | Codex (bộ kiểm tự động) |
| H | F1 / CV013 | Đăng nhập, đổi mật khẩu bắt buộc đã kiểm API; chưa có kiểm giao diện luồng đổi mật khẩu lần đầu | Thấp | Codex |
| I | F8 / CV073 | Runbook đã đổi sang `powershell`; chưa chạy backup/restore thật bằng PowerShell 5.1 sau thay đổi | Thấp | Codex (chạy một lần, DB thử) |
| J | Hiệu năng / CV025 | Mỗi lần lưu đề ghi lại phiên bản của mọi câu, kể cả câu không đổi; chưa đo | Chưa rõ | Claude (đo rồi thiết kế) sau pilot |
| K | CV010 | Offline thật (tắt mạng, mở lại), hai trình duyệt độc lập chưa kiểm | Trung bình | Chủ dự án thử tay + Gemini thẻ kiểm; không chặn pilot hai người cùng máy |
| L | Nội dung | Chỉ có gói minh họa; Toán 6 chưa có mục lục sách và yêu cầu cần đạt có nguồn | Cao với "đủ môn"; thấp với pilot kỹ thuật | Gemini (GEM-P3, P6) |

## 2. Thứ tự đề xuất
1. Codex commit cây làm việc (cổng).
2. Song song: Claude làm A rồi B (mã nằm ở `ShareModal` và `A4Preview`; chờ cây sạch); Codex dựng bộ kiểm tự động cho D–H; Gemini làm các việc nội dung, thẻ kiểm, hướng dẫn, dữ liệu mẫu.
3. Codex chạy I, rồi sửa lỗi bộ kiểm lộ ra.
4. Chủ dự án thử tay C và K bằng thẻ kiểm của Gemini.

## 3. Quyết định thiết kế cho A (để Codex/Gemini không làm trùng)
- Thêm vào hộp thoại giao bài, phần "Tùy chọn nâng cao" thu gọn mặc định: giờ mở, giờ đóng, số lượt (1–10), mã vào bài (tùy chọn), PIN (chỉ khi chọn lớp), trộn câu, trộn đáp án. Mặc định giữ hành vi hiện tại để không đổi bài giao cũ.
- Server là nơi kiểm: giờ đóng phải sau giờ mở; số lượt nguyên 1–10; PIN chỉ hợp lệ khi có lớp và học sinh có PIN. Không thêm migration (các cột đã có trong `Assignment`).
- Giờ nhập theo múi giờ của trình duyệt, lưu UTC; hiển thị lại đúng giờ địa phương.
- Kiểm: unit cho phần chuẩn hóa/kiểm tra, HTTP cho từ chối giá trị sai, bộ kiểm giao diện của Codex cho luồng đặt hạn rồi học sinh bị chặn sau giờ đóng.
