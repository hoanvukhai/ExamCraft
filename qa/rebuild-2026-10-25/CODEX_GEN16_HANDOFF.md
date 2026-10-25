# CODEX-NEXT generation 16 — bàn giao S1–S6

Trạng thái: WAITING_REVIEW. S1–S6 đã thực hiện và kiểm trong phạm vi mô tả; chờ Claude duyệt, không tự đóng CV.

| Việc | Thực hiện | Commit / bằng chứng |
|---|---|---|
| S1 / CV039 | Sửa nội dung/phương án/đáp án ngay trong preview, cảnh báo thiếu đáp án; F20 dán mẫu, sửa, nhập, lưu, DB, mở lại | 2ee7473, c3a3c0d; GEN16_IMPORT_AND_BANK.md; ba s1-f20-final-*.log |
| S2 / CV041 | Nguồn theo loại/tên tệp/thứ tự, giữ nguồn có sẵn; mặc định nhập PRIVATE/shareable false, giáo viên tự bật nhân bản, không tự công bố | 2ee7473, 9ee1f39; s2-unit.log, s2-s4-http-bank.json |
| S3 / CV033 | Hủy import/generate cả UI/SDK/helper, bỏ phản hồi muộn, ghi trạng thái hủy; rà tác vụ nền | fcaf785, 2ee7473; AI_CANCEL.md, F22 |
| S4 / CV025 | Rà từng tiêu chí, bổ sung redo câu và request ID chống lưu trùng khi mất ACK trong phiên | 9ee1f39; CV025_AUDIT.md, F23, HTTP bank receipt |
| S5 | Loading khi mở/đổi tab ngân hàng, bỏ kết quả tải cũ | 9ee1f39; s5-f19-final.log |
| S6 / CV053 | F21 A/B, AI dùng khóa B, A lưu trong khi AI chờ, không ghi đè A, B giữ đề xuất/nháp | c3a3c0d; gen16-F21-probe2.log |

## Kiểm và xử lý sự cố
- F20: ba lượt liên tiếp đạt; F19/F21/F22/F23 đạt, có manifest gen16-browser-evidence.json, dữ liệu giả và dọn theo ID.
- HTTP: 101/101 đạt khi dùng cách ghi báo cáo nguyên vẹn. Trước đó lặp lỗi Windows UNKNOWN khi mở một số JSON báo cáo, kể cả một worker; chưa kết luận nguyên nhân sâu của hệ điều hành. Commit a68963a thêm writer QA dùng tệp tạm/rename, retry Windows hữu hạn; lỗi ghi lâu dài vẫn làm test fail và giữ tệp tạm, không giấu lỗi nghiệp vụ. HTTP chạy một worker để giảm tải. Test guard writer đã đạt.
- Lỗi thật trong triển khai request receipt: Prisma không đọc được kiểu void của SELECT advisory lock, đã sửa SELECT 1 FROM lock; HTTP và F23 đã đạt.
- Lượt F21 đầu vướng nhập form trước hydration: login helper chờ session lookup effect trước nhập. F22 đầu bị bộ kiểm tự chặn route AI: chỉ F22 được cho qua đúng hai route trên server trỏ mock3118. F23 đầu chọn sang nút câu kế khi nút đầu đổi trạng thái; cố định thẻ câu, request retry giống hệt và chỉ có một bản sao. Không gọi các lỗi bộ kiểm này là lỗi sản phẩm.
- Ci-full-run2-attempt1.log giữ lỗi bảng sinh chưa đồng bộ hai fixture Gemini mới; chạy lại generator, không sửa tay/không commit phần Gemini. Attempt2/3 giữ các lỗi nêu trên. Lượt dev F20 chỉ dừng ở load điều hướng đăng nhập, không dùng làm nghiệm thu.

## Giới hạn giữ rõ
- Request ID ngân hàng được giữ trong RAM của phiên client, không bảo đảm chống trùng qua reload/máy khác. Không thêm dedup. Undo/redo thao tác là RAM; mốc server dựa lịch sử/lưu đề hiện có.
- Không suy trang tài liệu. importedFromFile là dấu nguồn nhập, không xác nhận giấy phép. Cho nhân bản vẫn khác công bố. Không xác minh chuyên môn/nguồn thay giáo viên.
- Hủy ghi 499 khi đang gọi provider, không retry khóa, không áp dụng kết quả. Lượt ứng dụng 499 được giải phóng, không hứa hoàn quota/phí provider đã nhận yêu cầu. Các route AI khác chưa thêm nút hủy trong đợt này; không có cron/queue AI độc lập theo rà mã.
- Không sửa schema/migration, không DB chính, không provider thật, không push/reset/clean. Không sửa checklist03/hồ sơ02/ASSIGNMENTS/BATCH_REVIEWS. Các thay đổi tài liệu/fixture của Claude/Gemini và đầu ra runtime có sẵn được giữ.

## CI cuối
npm run ci cuối đạt toàn bộ trên commit mã c3a3c0d (sau các commit a68963a, fcaf785, 2ee7473, 9ee1f39): TypeScript đạt, lint không lỗi (còn cảnh báo), SAFE 441/441, build CPU1/heap1024 đạt, HTTP 101/101, browser 22/22 (F1–F7, F9–F23). Tổng thời gian theo log 407 giây. Bằng chứng: ci-full-run2.log, gen16-ci-browser.json. F8 backup là bài kiểm riêng, không chạy lại trong đợt này; không suy CI có rehearsal backup hoặc integration DB riêng vì script CI hiện chỉ chạy HTTP/browser.

Đã kiểm sau CI tại 2026-10-25T16:12:05.692Z: health3117 không kết nối, không có listener3117/3118; server và mock đã dừng. Mã/scripts/tests/package/schema không còn diff chưa commit; cây chung còn tài liệu/fixture của Claude/Gemini và đầu ra runtime, không tuyên bố cây sạch.

Các JSON pilot-run thô theo run ID được giữ local theo .gitignore; manifest tóm tắt và bản kết quả CI đầy đủ được commit. Các commit mã chia theo nhóm để Claude xem; số test chỉ là bằng chứng của phạm vi này.
