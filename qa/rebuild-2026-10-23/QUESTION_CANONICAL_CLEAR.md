# Xóa dữ liệu câu đã nhập legacy — 24/10/2026

## Hiện trạng

Đã sửa boundary canonical và kiểm focused, build/SAFE, HTTP lưu–đọc DB thử cùng integration. Trước sửa, giáo viên xóa đáp án nhưng alias `correctAnswer` hoặc payload/editor cũ có thể khôi phục đáp án khi chuẩn hóa lại.

- `src/lib/exam-document.ts`: trường canonical hiện diện, kể cả null/undefined, ưu tiên trước alias/payload/editor cũ. Đáp án, accepted answers, phương án, ý đúng/sai, rubric, cặp ghép và thứ tự không lấy lại fallback cũ khi giáo viên xóa. Nội dung rỗng giữ rỗng; nội dung sai kiểu bị từ chối thay vì lấy nội dung cũ. Quy tắc điểm/hình canonical null, điểm 0 và đúng/sai false được giữ.
- Alias đã tiêu (`correctAnswer`, `solution`) và các bản editable payload đã tiêu được bỏ ở boundary. Trường nguồn chưa biết ở câu/editor và payload vẫn giữ để roundtrip; payload còn lại là dữ liệu opaque, không phải bản editable dự phòng. Authority DB vẫn bị loại như trước. Không đổi schema/API, không chạy chuyển đổi hoặc reset bản ghi hiện có.
- Test mới `tests/question_canonical_clear.test.ts` nằm trong SAFE. HTTP regression được gắn vào legacy-import subtest hiện có trong `tests/http_workflows.test.ts`, dùng cùng healthguard, tài khoản fixture và cleanup; không tạo setup cạnh tranh.

## Bằng chứng

| Kiểm | Kết quả và phạm vi |
|---|---|
| Focused canonical/import/history | **17/17 PASS**, exit0: 6 ca canonical mới +11 hồi quy; normalize → clear → JSON → normalize và adapter DB bằng object fixture, MC/short answer/accepted answers, null/undefined, nội dung rỗng, điểm 0/false, giữ opaque source |
| Lint tập trung | `exam-document.ts` + `question_canonical_clear.test.ts` exit0; file `http_workflows.test.ts` exit0. Không nhận lint toàn repo sạch |
| [Build cuối](build-question-commands-canonical.log) | **46 trang, build/typecheck exit0** |
| [SAFE cuối](safe-question-commands-canonical.log) | **20+183=203 PASS** |
| [HTTP thực](http-question-commands-canonical.log) | **17/17 PASS** trên server cô lập/DB thử; regression canonical nằm trong workflow legacy hiện có |
| [Integration PostgreSQL](integration-question-canonical.log) | **7/7 PASS** mới |

HTTP regression nhập hai câu legacy MC/short answer, GET bản canonical không còn alias, xóa đáp án/accepted answers bằng undefined qua JSON thật rồi PATCH/GET. Đọc trực tiếp bảng quan hệ ExamQuestion→Question và metadata.workspaceDocument xác nhận không giữ đáp án cũ; tiếp tục clear bằng null/[] trước payload stale cũng không hồi đáp án. Unknown sourceArchive page 7/8 giữ nguyên trong opaque editor payload; điểm 0 giữ nguyên. Nhập lại cùng raw trả already_imported, không tăng version và không hồi đáp án; nguồn fixture không bị thay đổi.

Các lượt ghi chỉ trên `examcraft_test_20261022` sau guard cấu hình và health isolated-test. Agent chỉ chạy focused/lint; build, SAFE, integration và HTTP thực do root chạy sau freeze. Không gọi provider thật. Browser Undo/offline của bản build này có báo cáo riêng tại [QUESTION_COMMANDS](QUESTION_COMMANDS.md); không coi đó là kiểm UI xóa đáp án legacy.

## Giới hạn và fingerprint

- Không thể suy lại ý định clear nếu tab build cũ đã JSON-omit undefined trên raw có alias trước khi đi qua boundary mới: dữ liệu đó giống nguồn legacy chưa cung cấp canonical. Cần reload bản mới trước ca browser xóa đáp án; không tuyên bố đã cứu ý định của mọi tab cũ.
- Legacy-import tính receipt fingerprint trên raw nguồn gốc, không trên kết quả normalizer. Rà source cho thấy cùng file/cùng ID đã nhập bằng normalizer cũ không đổi hash chỉ vì fix alias. HTTP mới đã kiểm nhập–clear–nhập lại cùng raw trên bản mới; không giả nhận đã tạo lại receipt bằng một build cũ trong lượt này. Export được chuẩn hóa thành raw khác có thể bị coi là nguồn khác và cần đối chiếu/copy riêng theo hợp đồng hiện có, không tự ghi đè.
- Unknown opaque payload không được tự diễn giải thành câu/đáp án. Chưa chứng minh mọi định dạng legacy, browser xóa/refresh từng dạng, hai browser profile độc lập hoặc chất lượng/nội dung AI thật. Số test không đồng nghĩa nghiệm thu toàn bộ.
