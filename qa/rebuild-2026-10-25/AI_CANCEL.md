# CDX-S3 — Hủy yêu cầu AI

## Thay đổi
Nút Hủy yêu cầu AI trong soạn đề và nhập đề dùng AbortController (nhập qua RequestGate.cancel). Token/generation cũ mất hiệu lực ngay, không đưa phản hồi muộn vào preview/proposal. Nguồn gõ vẫn giữ và có thể thử lại. Đóng/đổi ngữ cảnh vẫn hủy như trước.

Route generate-exam, parse-exam-text, parse-docx và ocr-exam-image truyền request.signal vào config.abortSignal của SDK và helper per-user. Helper kiểm hủy trước/sau provider, không xoay khóa hoặc tăng lỗi khóa vì hủy. Bản ghi đã giữ lượt được kết thúc httpStatus=499, không ghi thành công. Hủy trước giữ lượt không tạo log. Giới hạn ứng dụng chỉ đếm 102/200 nên lượt 499 được giải phóng; đây không là lời hứa nhà cung cấp hoàn quota/chi phí nếu đã nhận yêu cầu. Không lưu câu/đề từ route AI; chỉ giáo viên áp dụng rồi lưu.

## Rà tác vụ nền
Tìm bằng rg setInterval|queueMicrotask|cron|BullMQ|Agenda|node-cron|schedule trong src, scripts, package.json, .github; bằng chứng s3-background-scan.log. Không thấy hàng đợi/cron AI tự chạy nền. Có polling lưu/cộng tác, nháp và UI timers, không tự sinh nội dung bằng AI. Các AI route là request/response có thể lâu, không phải job bền chạy độc lập. Các AI route khác ngoài bốn route trên chưa được bổ sung nút hủy trong đợt này.

## Bằng chứng
HTTP slow provider và F22 (AI giả localhost3118) đã đạt; xem ci-full-run2.log, gen16-ci-browser.json và CODEX_GEN16_HANDOFF.md.

## Kiểm thực tế trước CI cuối
F20 ba lượt liên tiếp, F19, F21, F22 và F23 đã đạt trên server production cô lập (gen16-browser-evidence.json). HTTP sau đổi cách ghi báo cáo đạt 101/101 (gen16-http-atomic.log). CI cuối đã đạt TypeScript/lint/SAFE/build/HTTP/browser; SAFE 441/441, HTTP 101/101, browser 22/22. Server3117 và mock3118 đã dừng; xem ci-full-run2.log.
