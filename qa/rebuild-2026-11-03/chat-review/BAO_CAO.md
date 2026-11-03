# Rà và hoàn tất phản hồi Claude — chat AI V2

Trạng thái: **WAITING_REVIEW**. Mã/test đã kiểm và commit **`657d66e`**. Nhánh `codex/chat-ai-v2`, worktree `F:/Workspace/Zazz/ExamCraft/tmp/chat-ai-v2`; nền trước rà `5f6bf4d` (mã), `85ac659` (hồ sơ). Chưa gộp hoặc đưa lên web.

## Nhận định

Claude đúng về hai bộ kiểm chưa cập nhật, QA thừa output và mã khó đọc. Vai trò `region` trước đó vẫn có nhãn truy cập, nên không phải mất toàn bộ thông tin cho trình đọc màn hình; đợt này khôi phục vai trò cụ thể theo thiết bị. Ngân sách một lượt AI là lựa chọn hạn chế chi phí/lượt khóa, không vi phạm mức tối đa ba lượt; không tăng số lần gọi trong đợt này.

## Đã sửa

- `library`: đi qua thẻ bắt đầu, chọn lớp/môn và xác nhận mở bàn soạn; chờ POST ngay từ trước thao tác xác nhận để không bỏ lỡ autosave. Kiểm không tạo đề khi chỉ mở thẻ, tạo một lần, đúng thư mục, giữ dữ liệu khi thư mục vừa bị xóa, và chỉ chuyển ra gốc khi người dùng chọn. Mock AI dùng khóa giả của đúng tài khoản, có dọn fixture.
- `frame`: desktop là `complementary`, điện thoại là `dialog` không modal (`aria-modal=false`). Tab và Shift+Tab đều thoát được bảng AI. Thêm kiểm vai trò, tính không modal và bàn phím ở cả hai giao diện sáng/tối.
- CI bắt buộc chạy thêm library/frame sau pilot. Các driver kiểm chuẩn mặc định đặt kết quả vào ngày UTC hiện tại, tôn trọng đường dẫn được chỉ định; integration dùng writer an toàn trong nhóm QA theo ngày. Bỏ việc sao chép JSON integration cũ thành bằng chứng đợt mới.
- Pin Prettier 3.9.10, thêm cấu hình và chuẩn hóa 66 tệp trong phạm vi nhánh. Không cài lại hoặc sửa node_modules dùng chung. Lockfile chỉ bổ sung formatter, không thay phụ thuộc khác. Hai waiver lint cũ đặt lại đúng dòng sau khi format. Guard SDK/key chuyển từ regex phụ thuộc cách xuống dòng sang AST, có kiểm phủ định để tiếp tục chặn key chung, sai callback, retry lớn hơn một và sai chủ tài khoản.

## Dọn QA và bảo toàn

- Bỏ theo dõi 142 output mới của nhánh (57 ảnh, 40 log, 45 JSON), gồm ảnh chụp ca lỗi cũ. Trả riêng 9 output lịch sử bị lượt kiểm làm đổi; dọn 129 output chưa theo dõi.
- Trước dọn đã sao chép bytes hiện hành và kiểm SHA-256 từng tệp. Bản lưu có manifest: `tmp/qa-before-review-20261103T152251Z-0cfe6971`. Raw trước đó vẫn truy được ở Git `85ac659`; không viết lại lịch sử Git.
- Giữ Markdown, mã kiểm và hai bản đặc tả gốc; thêm quy tắc ignore cho output mới và [hướng dẫn lưu kết quả](../../KET_QUA_SINH_TU_DONG.md). Fixture có chủ đích đặt trong `tests/fixtures`, không ép add output QA.
- Không dùng reset/clean hay khôi phục cả qa. Không đụng dữ liệu chính, không migration/push/deploy. Trạng thái tài khoản manual, khóa đã mã hóa, bản nháp và SESSION_SECRET giữ nguyên. Đối chiếu hash trước/sau toàn bộ lượt kiểm: tài khoản, khóa đã mã hóa và dữ liệu sở hữu của hai tài khoản manual không đổi. Chỉ lưu hash/count trong tmp, không chép nội dung hay bí mật.

## Kiểm chứng

Mọi lượt ghi tự động dùng đúng `examcraft_test_20261022` cổng 5436, đối chiếu URL và `current_database()`. HTTP/trình duyệt chạy cổng 3124, xác nhận `isolatedTest=true`, provider giả cục bộ; Chrome có sẵn, không tải trình duyệt. Không tự động gọi AI thật.

- CI cuối: kiểu, lint, SAFE **624/624**, build (CPU 1, heap 1024), HTTP **118/118**, pilot **24/24**, library **6/6**, frame **4/4** đạt. Tổng 439 giây; không chạy lint/SAFE cùng build.
- Đã kiểm driver mới ghi đúng nhóm ngày chạy. Không có raw QA mới trong thay đổi nhánh so với nền `865bcea`; không ép add output được ignore.
- `test:integration` cuối: **8/8** đạt. JSON mới tại `qa/rebuild-2026-11-03/integration_s1.json` và `question-save.json` (local, ignored); hai bản gốc ngày 25/10 giữ nguyên HEAD.
- Chat completion 10/10; Đ0–Đ2 15/15 đạt sau sửa vai trò và format. Không có ca bị bỏ qua.
- Prettier **check và debug-check đủ 66 tệp đều đạt**. Đối chiếu bản trước qua formatter để tách sửa hành vi khỏi xuống dòng; kiểm AST/idempotence đạt. Vài tệp cần hai lượt để ổn định, đã kiểm lại thay vì bỏ qua. `git diff --check` đạt.
- Lint không lỗi; vẫn có cảnh báo nền của dự án. Không tự nhận đã xóa toàn bộ cảnh báo.

Raw của lượt chạy giữ local và được ignore: `ai-chat-completion/ci.log`, `integration.log`, `browser.log`, `chatRegression.log`; thư mục `chat-review/` có log formatter. Báo cáo này là bằng chứng tổng hợp để đọc trong Git; không bắt buộc mang theo ảnh/log/JSON lặp.

## Giới hạn và bước người dùng

- Chưa kiểm AI thật, chất lượng chuyên môn, thiết bị điện thoại vật lý hoặc trình đọc màn hình thật. Viewport điện thoại và thao tác bàn phím đã tự động kiểm.
- Một yêu cầu chat vẫn tối đa một lượt provider: khóa đầu hỏng thì người dùng bấm Thử lại, không tự gọi tiếp khóa khác trong cùng yêu cầu. Không tuyên bố đã bổ sung failover tự động.
- Cổng **3123 đã mở lại** từ mã đã kiểm; health xác nhận sẵn sàng, tài khoản/mật khẩu cũ giữ nguyên. Máy chủ kiểm 3124 đã dừng sau CI. Health của bản người dùng 3123 cố ý không nhận `isolatedTest` để ngăn bộ kiểm ghi vào phiên người dùng. Người dùng thử bằng cửa sổ riêng tư và khóa cá nhân; sau đó mới quyết định gộp nhánh.

## Lệnh đối chiếu

- Runner đợt: `node --import tsx qa/rebuild-2026-11-03/ai-chat-completion/run-check.cjs <ci|integration|browser|chatRegression> <đường-dẫn-env-local-hiện-có>`; không chép env vào QA.
- Trình duyệt chat dùng máy chủ cô lập từ action `server`. Kiểm DB/health là bắt buộc, không trỏ các lệnh này vào 3123.
- [Hướng dẫn người dùng và lệnh mở lại bản 3123](../ai-chat-completion/HUONG_DAN_TEST.md).
