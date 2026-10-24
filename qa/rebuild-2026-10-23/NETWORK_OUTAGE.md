# Giữ nháp khi máy chủ mất kết nối —23/10/2026

Kiểm tiếp CV010/050 bằng app production thật, không chỉ harness helper. Không sửa code trong ca này.

## Kịch bản và kết quả

1. QA production3117 đã xác minh chỉ dùng `examcraft_test_20261022`. Đề giả của `qa_browser_2@example.invalid` có1câu tự luận/điểm0/ảnh/lời giải và kế hoạch1câu đã lưu. Đọc trước bằng UI; dữ liệu chính không tham gia.
2. Dừng đúng process máy chủ QA do đợt này tạo, giữ PostgreSQL. Cổng3117 không còn listener. Tab bàn soạn vẫn mở; đổi mục tiêu1→2câu, Apply rồi Lưu lại. Giao diện báo **Chưa lưu / Chưa kết nối được máy chủ**, có tải nháp và thử lại, không báo đã lưu. [DOM](network-outage-draft.txt), [ảnh](network-outage-draft.png).
3. Khởi động lại cùng QA server/DB. Mở **tab mới** cùng đề: app mount mới đọc nháp, tự lưu có kiểm phiên bản và báo Đã lưu trên máy chủ. Kế hoạch2câu/0điểm được giữ; đề thực tế1câu nên bảng báo lệch-1, không tự thêm câu. [DOM](network-reconnect-draft.txt), [ảnh](network-reconnect-draft.png).
4. Script chỉ đọc, guard đích DB và đúng chủ fixture xác nhận plan.count2/target0, câu vẫn1/điểm0/nội dung/ảnh/lời giải còn; [network-reconnect-db.json](network-reconnect-db.json). Không dựa thông báo UI để suy DB đã đúng. Script `scripts/verify-network-outage.cjs` chỉ phù hợp mốc fixture này; sau khi đưa plan về1không chạy lại để đòi count2.
5. Tab cũ phát hiện bản server mới, chuyển sang xung đột và giữ bản nháp riêng, cho tải/lưu thành đề mới/mở server giữ nháp. Đã đưa plan QA về1và mở lại bản server ở tab cũ; archive vẫn giữ, không xóa dữ liệu trình duyệt. [DOM tab cũ](network-old-tab-server-kept.txt). Đóng tab phục hồi mới, giữ tab4cho kiểm nhóm tiếp theo.

## Giới hạn

Đây là máy chủ không truy cập được khi trình duyệt vẫn báo có mạng; không phải bật airplane mode hoặc mô phỏng `navigator.onLine=false`. Tab mới chỉ được mở sau khi server trở lại; chưa chứng minh tải toàn bộ app từ đầu khi server đang tắt hoặc có service worker/PWA. Hai tab cùng IAB không phải hai trình duyệt độc lập. Không gọi AI thật, không ghi DB chính, không dừng Docker/container khác. CV010/050 vẫn mở cho mọi ca còn lại, gồm quyền và phản hồi muộn đầy đủ.
