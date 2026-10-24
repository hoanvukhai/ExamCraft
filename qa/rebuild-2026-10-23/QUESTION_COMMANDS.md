# Hoàn tác, di chuyển và nhân bản câu — 24/10/2026

## Hiện trạng

Undo, clone và đổi thứ tự đã qua build, SAFE, integration, HTTP và browser trên DB thử. Những kết quả dưới đây xác nhận các ca đã kiểm; CV025 vẫn còn redo và lịch sử undo bền qua reload.

- Undo giữ before/afterStamp/sourceStamp; kiểm lại câu, ngữ cảnh, tài khoản/tài liệu và quyền trong updater. Khi nền đã đổi, trả nguyên bản hiện tại. Undo tạo version mới, status draft/verifiedBy none; không quay ngược version hoặc phục hồi nhãn đã duyệt.
- History chỉ tiêu sau khi prop câu xác nhận kết quả dự kiến. Sau chuỗi Undo rồi sửa mới, onSave commit activeUndoHistory và reset pendingUndo trước parent setter; onApplied thêm đúng một mốc. Lỗi bộ đếm history thừa từng thấy khi kiểm UI đã được sửa và kiểm lại trên bản build cuối.
- Editor bị từ chối vẫn giữ form/nháp; parent ack chỉ đóng form. Journal chỉ được retire khi persistence xác nhận saved, đúng tài khoản/đề/câu/nội dung/ngữ cảnh và raw revision. Nháp đã vào bản soạn không chặn Lưu đề; mở lại trước server ack lấy current làm baseline nếu nội dung và source khớp, giữ journal nguồn. Nút Lưu đề/Đang lưu theo trạng thái thật, không còn timer báo Đã lưu sau một thay đổi mới.
- Move/clone kiểm document/quyền/baseOrder/ID rồi dùng câu mới nhất trong previous. Clone deep-copy với ID mới, giữ nội dung/đáp án/hình/điểm 0/liên kết; reset draft/none/version1, không thêm chữ Bản sao vào nội dung cho học sinh.

## Kiểm mã và dịch vụ

- [Focused command/draft](question-commands-focused.log): **13/13 PASS**, gồm 3 command +10 draft. Kiểm guard nền/quyền/thứ tự, dữ kiện câu mới qua move/clone, clone 0/ảnh/reset, undo chain và ack, journal chờ server và mở lại bản đã Apply. [Lint tập trung](question-commands-lint.log) exit0; không nhận lint toàn repo sạch.
- [Build tích hợp cuối](build-question-commands-canonical.log): **46 trang, build/typecheck exit0**. [SAFE](safe-question-commands-canonical.log): **20+183=203 PASS**.
- [Integration PostgreSQL](integration-question-canonical.log): **7/7 PASS** mới. [HTTP](http-question-commands-canonical.log): **17/17 PASS** mới, gồm regression xóa đáp án legacy qua API và kiểm dữ liệu quan hệ; xem [canonical clear](QUESTION_CANONICAL_CLEAR.md). Chỉ DB thử, không provider thật.

## Browser và DB đối chiếu

Fixture riêng được tạo qua tài khoản QA/API/healthguard bằng `scripts/qa-question-command-fixture.cjs --create-fixture`; [dấu fixture](question-command-fixture.json) ghi nguồn để đối chiếu. Không chạy lại tạo fixture nếu đã có.

| Ca kiểm bản cuối | Bằng chứng và kết quả |
|---|---|
| Reset bản QA sạch → sửa A1/A2 → Undo hai lần → sửa A3 | Nội dung về đúng nền sau Undo, version tiếp tục tăng; A3 có đúng **1** history. [DOM A3](question-commands-new-edit-one-history.txt), [DB sau Undo](question-commands-after-undo-db.json) PASS |
| B sửa lời giải → A Undo trên history cũ | A bị từ chối, giữ câu mới. [DOM](question-commands-stale-undo.txt), [DB sau B](question-commands-after-b-db.json), [DB sau từ chối](question-commands-after-stale-db.json): version và questions hash không đổi |
| Clone A → move down → lưu → reload | Thứ tự và nội dung đúng, giữ ảnh/điểm 0. [DOM reload](question-commands-order-reloaded.txt), [DB](question-commands-after-order-db.json) PASS |
| Dừng QA server trước Apply nháp → Apply/lưu lỗi → mở lại form → đóng giữ nháp | Có **1** journal chờ server; reopen không báo stale giả. [Journal](question-commands-offline-journal.txt), [form mở lại](question-commands-offline-reopened.txt), [ảnh](question-commands-offline.png) |
| Khởi động server lại → tab mới thấy nội dung phục hồi, Saved và journal 0 | [DOM](question-commands-offline-recovered.txt), [ảnh](question-commands-offline-recovered.png), [DB sau nối lại](question-commands-after-offline-db.json) PASS; DB đúng nội dung, source hash không đổi |

Các DB probe là đọc-only trên `examcraft_test_20261022`; bước tạo/sửa fixture chỉ trên DB thử. Bản nguồn giữ nguyên hash qua cả chuỗi, ảnh và điểm 0 được giữ. Ca nối lại xác nhận tab mới đã thấy Saved và DB đúng; **không xác định tab cũ hay tab mới gửi trước**, không suy tab mới là writer duy nhất.

## Giới hạn

- Chưa có redo hoặc lịch sử undo bền qua reload; server history vẫn là đường đối chiếu phiên bản tài liệu.
- Chưa kiểm hai browser profile độc lập; hai tab hiện tại không thay thế ca đó. Ca dừng QA server không thay toàn bộ tình huống airplane/offline hệ điều hành.
- Không gọi AI thật, không chứng minh chất lượng AI hoặc mọi đường nhận/hủy đề xuất AI đều có guard cuối cùng. Nhóm này gia cố soạn thủ công, Undo và lệnh sắp xếp.
- Clone/đổi thứ tự stale giữ đề nguyên trạng, chưa có toast riêng cho lệnh bị từ chối. Không tuyên bố đã hoàn tất toàn bộ lịch sử/cộng tác hoặc nghiệm thu chuyên môn.
