# Chạy lại toàn bộ kiểm trên mã mới — 25/10/2026 (Claude làm thay Codex)

Mã: `6a501da` (HEAD) cộng sửa ba lỗi test dưới đây. Chỉ DB thử và server thử cô lập; không AI/provider thật; DB chính không đụng.

## Kết quả
| Kiểm | Kết quả | Log |
|---|---|---|
| Build 1 CPU, heap 1024 | đạt | [build](build-claude-run.log) |
| SAFE | 338/338, fail 0, skip 0 | [safe](safe-claude-run.log) |
| HTTP | 33/33 | [http](http-claude-run.log) |
| Bộ kiểm trình duyệt | **8/8** (F1–F7, F9), gồm F3 mở rộng: rà soát đề, trình chiếu, lưu ngân hàng, Word Song song hai cột | [pilot](pilot-claude-run5.log) |
| typecheck, lint tệp test sửa | đạt | — |

## Bốn lỗi được sửa — đều là lỗi của bộ kiểm, không phải lỗi sản phẩm
1. `POST /api/questions` trả 200 với `{ success, question }`, bộ kiểm chờ 201. Sửa kỳ vọng theo hợp đồng hiện có.
2. Trình chiếu: `selectOption('1')` của Playwright khớp **nhãn** "1" (câu 1) trước giá trị `1` (câu 2), nên không đổi câu. Dùng `{ label: '2' }`.
3. Bộ kiểm lấy nút Word ở tiêu đề trang (xuất cả đề) thay vì nút Word của khung xem A4 (xuất đúng chế độ đang xem). Dùng đúng nút. Hai khối `<details>` mở bằng thao tác bật/tắt đã chuyển sang mở một chiều.
4. HTTP: `hours(2)` gọi hai lần cho giờ mở và giờ đóng lệch vài mili giây nên ca "giờ đóng bằng giờ mở" đôi khi qua; dùng một giá trị (lỗi của test tôi viết).

## Cần biết
- Trước khi chạy có một server cũ trên cổng 3117 (bản dựng cũ) khiến lượt đầu kiểm nhầm mã; đã dừng, dựng lại từ đúng mã và chạy lại. Log các lượt lỗi giữ ở `claude-first-run/`.
- Kiểm từng phần phải chạy khi máy rảnh RAM.
- Chưa mở Word thật, in nhiều trang, hai engine sửa đồng thời, AI thật.
