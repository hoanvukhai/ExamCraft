# CV057 và CV060/061 — nháp từng trang, nhập lại JSON và tích hợp lịch sử chấm

Ngày24/10/2026. Baseline `83d4a95fedd632b69d8d1eedd135dabc10e369ad`; Claude paging `ca73871` đã cherry-pick thành `2fdfa1c`. Các sửa bổ sung của Codex trong working tree; chưa push. Đây là báo cáo nhóm hiện tại cho phần journal; báo cáo v1 `qa/rebuild-2026-10-23/STUDENT_DRAFT_JOURNAL.md` là bằng chứng lịch sử, không mô tả đầy đủ mã hiện tại.

## Đã sửa

- Mỗi trang làm bài ghi ô journal v2 riêng theo attempt+writerUUID; không dùng một ô chung để các tab thay nội dung nhau. Đọc journal v1, giữ nguyên raw hỏng/khác cấu trúc; lỗi truy cập/quota storage được bắt và cảnh báo, không ngăn bắt đầu bài/lưu server.
- Nếu có nhiều bản khác nội dung, hiển thị bản máy chủ và yêu cầu chọn để đối chiếu. Bản nền cũ giữ nền cũ, không tự rebase; autosave/nộp tay bị chặn khi xung đột. Mọi chỉnh sửa vẫn giữ vào ô của trang đó. ACK của ngữ cảnh cũ không đổi nền sau khi người dùng đã chọn bản khác.
- Hết giờ khi có xung đột: API nhận `useSavedDraftOnly: true`, chỉ nộp draft đã lưu trên server. Nếu nộp tự động gặp xung đột do race, thử saved-only; giữ các câu chưa được nhận để đối chiếu. Capability/row-lock/grading/idempotence vẫn giữ. Sau nộp chỉ xóa ô writer hiện tại nếu toàn bộ câu trong ô khớp responses thực; không xóa ô khác/legacy/import/raw hỏng. Khi storage lỗi vẫn giữ bản khác trong RAM ở màn kết quả của trang đang mở, không hứa tồn tại sau đóng trang.
- UI có bảng nháp thu gọn, đọc raw/tải nguyên từng bản. Nhập lại JSON v1/v2 và tệp `examcraft-student-answers-v1`, tối đa4MB, đúng attempt. Giữ nguyên raw trong ô import mới, không ghi đè; chỉ thêm lựa chọn, không thay bài đang nhập. Sau reload, bản nhập khác server vẫn yêu cầu chọn. Tệp xuất cũ thiếu revision chỉ để xem/đối chiếu, không tự lấy revision mới. Tệp câu trả lời xuất mới mang revision gốc.
- Tích hợp Claude: GET lịch sử chấm phân trang50, cursor ràng buộc attempt và thứ tự `(createdAt,id)` giảm dần; UI tải thêm tách khỏi detail để giữ ô nhập. Codex sửa kiểm owner trước parse cursor; lượt khác chủ trả404 cả khi cursor hỏng. Không thêm schema/migration.
- Test HTTP ghi báo cáo theo ngày UTC đang chạy, không ghi đè bằng chứng22/10. Đã giữ lại byte hai JSON lịch sử ở HEAD. Hai nhóm kiểm mới có mã check riêng trong báo cáo mới.

## Kiểm mới đã chạy

Chỉ `examcraft_test_20261022`, server production cô lập `127.0.0.1:3117`. Không ghi DB chính, không gọi AI/provider, không dùng các key người dùng đã dán để kiểm đợt này.

| Kiểm | Kết quả và bằng chứng |
|---|---|
| Unit tập trung journal+cursor | 19/19: journal13 và cursor6, chạy lại sau sửa opt-in reload cuối. `unit-journal-history.log` |
| SAFE bản cuối | 233/233, không fail/skip; gồm kiểm hai writer, legacy/raw hỏng, storage denied/quota, zero/false, retire theo responses, nhập byte nguyên/đúng lượt/không overwrite/opt-in sau reload. `safe-journal-import-history.log` |
| HTTP bản build cuối | 19/19 (có test cha), không fail/skip. `http-journal-import-history.log`; `http_workflows.json`, `http_auth.json` có status PASS, cleanupComplete true |
| HTTP saved-only | NhápA đã được nhận, nộpB nền cũ409; thiếu capability403; flag sai kiểu400; saved-only kèm bodyB vẫn nộpA/essay server, kiểm trực tiếp draft và AttemptAnswer |
| HTTP paging trên PG thật | Tạo105sự kiện giả cùng timestamp ngoài2lần chấm có sẵn; đọc hết107ID đúng thứ tự không trùng/thiếu, thêm sự kiện mới giữa trang không lẫn vào các trang cũ. Owner badcursor400, foreign404, cursor khác attempt400, anonymous401; trang tiếp chỉ trả3trường lịch sử. Fixture theo userUUID được cleanup |
| Build cuối | Exit0,46trang; `NEXT_BUILD_CPUS=2`, webpack. `build-student-writers-import-history.log` |
| TypeScript | Exit0 sau sửa cuối, `typecheck-journal-history.log` |
| ESLint file mới/helper/submit/test tập trung | Exit0 sau sửa cuối; log `focused-journal-history-lint.log`. Trang học sinh còn8error/2warning kế thừa theo `student-writers-lint.log`; không nhận lint toàn dự án sạch |

Claude bàn giao unit6 và kiểm riêng ở `qa/ai-review/CLAUDE_GRADE_HISTORY.md`; không coi đó là bằng chứng UI/HTTP. Bảng trên là kiểm Codex sau tích hợp.

## Chưa kiểm và giới hạn

- CUA không khởi tạo được: `failed to write kernel assets: The system cannot find the path specified (os error 3)`; đã thử đọc lại docs, reset rồi khởi tạo mới vẫn lỗi. Không có lần UI mới nào được nhận đạt trong đợt này. Không phải API/build lỗi, cũng không phải automatic approval review từ chối.
- Có harness import component thật ở `student-journal-browser-entry.tsx`, API giả, origin3124, CSP connect-src none. Đã bundle/start được trước khi thêm importJSON; chưa chạy tương tác và chưa xác nhận bundle sau sửa import. Máy chủ harness đã dừng để tránh giữ bản cũ. Khi CUA dùng lại được, chạy `node scripts/qa-student-journal-server.cjs` rồi mở `http://127.0.0.1:3124/?mode=denied|corrupt|choice|expired|late` (chọn từng mode, không dán nguyên dấu `|`). Không coi dựng harness là ca UI đạt.
- Ca UI cần chạy: storage denied vẫn start/lưu server; raw hỏng giữ byte; chọn hai bản; late ACK sau đổi lựa chọn không rebase; hết giờ conflict nộp server và còn nháp; mở/nhập/tải tệp lại kể cả reload. Tải lịch sử lỗi/thử lại không mất điểm đang nhập, phản hồi của bàiA sau khi mởB bị bỏ.
- Hai browser độc lập/đổi máy/offline thật chưa kiểm. localStorage không có transaction giữa tab; giảm tranh bằng ô writer riêng, không hứa đồng bộ tức thời. Nhiều slot cũ/import có thể tăng dung lượng, chưa tự GC. Tệp hỏng không tự sửa/gộp. Chưa có lưu đám mây cho journal, không có tệp thì đổi máy chỉ lấy draft server.
- Khôi phục điểm từ lịch sử, UI soạn nhận xét/lưu tường minh giao Claude generation2; chưa tính hoàn thành. Regrade/đính chính đáp án/gia hạn/mở lại vẫn ngoài đợt này. CV057/060/061 đều giữ mở; chưa tổng nghiệm thu.

## Phối hợp và bước tiếp

Theo yêu cầu giao thêm việc lớn cho Claude, đã cập nhật ASSIGNMENTS generation2, ghi `qa/ai-review/coordination/CLAUDE_TASK_02.md` và tin riêng. Phạm vi: restore lịch sử có CAS và audit mới, soạn nhận xét/điểm giữ bản sửa lỗi, unit và bàn giao commit mới sau ca73871. Cùng worktree riêng; Codex không sửa hai tệp teacher trong lúc Claude làm. Lưu ý Claude phải giữ owner-before-cursor Codex đã sửa.

Claude đã xác nhận generation2 WORKING lúc08:30:23UTC, đang thiết kế helper/route/editor; chưa có commit bàn giao mới, không tính nghiệm thu. Tệp không tự đánh thức phiên đã dừng. Gemini hiện WORKING, chưa có hai báo cáo hoàn chỉnh; không coi im lặng là hết token. Khi nhận bàn giao, Codex rà diff, tích hợp tuần tự rồi kiểm runtime trên DB thử, cập nhật hồ sơ chính. Không đợi vô hạn để tiếp việc độc lập.
