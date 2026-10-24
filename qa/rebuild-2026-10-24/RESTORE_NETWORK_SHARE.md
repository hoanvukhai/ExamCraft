# CV048/057/060/061 — khôi phục điểm, nộp lại khi mất mạng và link chia sẻ

24/10/2026. Tiếp [đợt writer/import/paging](STUDENT_WRITERS_IMPORT_AND_HISTORY.md). Không migration/dependency mới; không ghi DB chính hoặc gọi provider/AI thật. Chưa push, chưa tổng nghiệm thu.

## Đã tích hợp và sửa

Claude generation2 bàn giao3commit, Codex rà rồi cherry-pick vào nhánh local:

| Claude | Commit tích hợp | Nội dung |
|---|---|---|
| 4473f17 | c02f43e | Quy tắc restore lịch sử, dựng bản gửi điểm/nhận xét và unit |
| 1a1bdad | 25dddce | Restore server có CAS/audit/row-lock, owner trước cursor |
| f3dca22 | 7b5e0e6 | Bộ soạn điểm/nhận xét lưu tường minh và xem trước/xác nhận restore |

Hash các tệp Codex trước/sau tích hợp giữ nguyên; bản sao sửa owner-before-cursor đã giữ trong tmp và cùng sửa đó có trong commit Claude. Worktree Claude còn nguyên; không reset/clean hoặc gom thay đổi người khác.

**Khôi phục/chấm:** chỉ chủ bài đã nộp, cùng same-origin/account pin. Client gửi ID sự kiện/phía before hoặc after/token nền, không gửi điểm lịch sử tự chọn. Server đọc lại đúng AuditLog của lượt/câu, kiểm đủ trạng thái và giới hạn bản đề, chỉ đổi điểm/nhận xét, tính lại tổng/chờ chấm và thêm audit mới tham chiếu nguồn. Nền cũ không ghi đè; retry đã đúng trạng thái không thêm audit. `manualScore:null` khác0, `comment:null` khác rỗng, false khác null. Không sửa response/snapshot/audit gốc.

**Bộ soạn:** ô điểm/nhận xét có nút Lưu/Bỏ thay đổi; không gửi khi blur. Nháp giữ trong state của trang khi lỗi và tải thêm lịch sử/refresh detail, chưa bền qua reload trình duyệt. Câu đang chờ chấm không tự nhận0 chỉ vì nhập nhận xét. Bài khảo sát/nhận xét ẩn điểm; bản đang sửa chặn restore cùng câu; đóng khi còn nháp có chọn rõ. Không regrade/đổi đáp án ở đợt này.

**Sửa sau review của Codex (working tree):** lịch sử có meta thiếu/hỏng không crash trang hoặc tự đoán, hiển thị không đọc đủ và chặn restore; GET trả manualScore để câu đã chấm0 ở thang0 không bị nhận nhầm là chờ chấm. ACK/error lưu/restore kiểm cả ngữ cảnh mở chi tiết, nên đóng/mở lại cùng lượt không nhận kết quả UI cũ. Guard restore kiểm lại nháp đang sửa/token trước gửi.

**CV057:** start/draft/submit có timeout bao cả gửi và đọc body. Request treo được abort/reject, không giữ khóa lưu/nộp mãi; receipt muộn không biến timeout thành lưu thành công. Nộp thất bại hiện banner, nút thử nộp lại và tải bản câu đang nhập nằm ngoài vùng đáp án bị khóa khi hết giờ. Không cho sửa thêm sau giờ; server vẫn quyết định phần câu được nhận theo hạn, không âm thầm nộp toàn bộ nháp trễ. Tự nộp thành công dùng thông báo trong trang. Mobile có trạng thái lần lưu máy chủ gần nhất/đang gửi/chưa nhận, không chỉ desktop. Callback nhập tệp/chọn nháp kiểm attempt còn hoạt động, không áp dụng bản của lượt cũ nếu đổi lượt trong lúc đọc tệp.

**CV048:** nút Word ở trang share giờ await blob, xử lý hình bằng prepareExportFigures rồi tạo download, có trạng thái/lỗi và thu hồi URL sau dùng. Dùng đúng dữ liệu public đã cho phép; không tải lại đề gốc riêng. Bỏ liên kết `/test` cũ, giải thích đây là link xem/in; học sinh nhận link giao bài riêng từ giáo viên. Không tự biến share thành bài giao. Chưa thử tải xuống thật do CUA lỗi.

## Kiểm mới

| Kiểm | Kết quả / log |
|---|---|
| SAFE sau sửa nguồn cuối | 247/247, fail0/skip0; `safe-restore-network-share.log`. Có thêm4test timeout/receipt muộn,10test restore/nháp/presenter lịch sử (8Claude+2Codex) |
| HTTP bản production sau sửa API (trước guard callback UI cuối; API không đổi) | 21/21 (gồm test cha), fail0/skip0; `http-restore-network-share.log`. `http_workflows.json` ghi15nhóm check/PASS và cleanupComplete true; auth PASS/cleanupComplete true |
| Build webpack, hai CPU | Exit0,46trang; `build-restore-network-share.log`, có TypeScript trong build. Kiểm tsc riêng trước build exit0, `typecheck-restore-network-share.log` |
| ESLint helper/component/route/test mới và share | Exit0, không error,1warning location.href kế thừa ở share; `lint-restore-network-share.log` |
| ESLint hai trang lớn | Còn lỗi kế thừa; `lint-student-teacher-pages.log`. Không nhận toàn dự án lint sạch |
| Harness student | Bundle/start được sau importJSON và thêm mode offline, chỉ API giả/origin3124/CSP connect-src none. Đã dừng sau kiểm khởi động, chưa chạy tương tác |

HTTP chỉ chạy `examcraft_test_20261022`, server cô lập3117 chứng minh isolatedTest trước ghi. Các userUUID/assignment/audit giả được cleanup. Test restore kiểm trực tiếp response của học sinh, snapshot, audit gốc, tổng và pending: restore về pending, retry không nhân audit, nền cũ409 không đổi DB, extra earned trong body400, ID bậy/khác lượt404, metadata thiếu422, giáo viên khác404, origin khác403, stale account header409/ACCOUNT_CHANGED và bài chưa nộp409 không đổi DB; hai restore từ cùng nền graded0 chỉ một ghi được. Sau cùng trả bài về1.29 đã chấm, response/snapshot vẫn khớp đầu vào. Ca comment_only qua tạo đề→giao→làm→nộp→nhận xét→đổi nhận xét→restore giữ score/maxScore null, không cho điểm số, giữ response/snapshot và khôi phục đúng nhận xét. Kiểm HTTP/paging/auth/saved-only trước vẫn đi qua cùng suite.

## Nhận báo cáo Gemini

Hai báo cáo `qa/ai-review/GEMINI_UX_REVIEW.md` và `GEMINI_TEST_CASES.md` là rà tĩnh baseline83d4a95, không phải kiểm UI. Nhận các phát hiện Word no-op, `/test` cũ, mobile thiếu status, thiếu comment editor và lối thử nộp lại. Cursor ordering và importJSON đã sửa trước báo cáo.

Không nhận đề xuất force-overwrite nháp khi conflict, reset ô nhập khi lỗi hoặc tự áp dụng tệp JSON: trái quyết định CAS/giữ bản sửa/xem trước. Không coi lời mô tả “mượt/triệt để” là bằng chứng giao diện; min/max không tự cấm mọi giá trị gõ vào. Mã CV trong bảng Gemini có chỗ nhầm; dùng checklist chính (share048, journal057, làm058, chấm060, theo dõi061, dọn077). Thứ tự parse cursor trước owner tạo mã lỗi không nhất quán; chỉ riêng điều đó chưa chứng minh dò được tồn tại bài vì cursor hỏng cũng400 với ID không tồn tại. Codex đã normalize owner-first và kiểm HTTP. Đã gửi đính chính qua kênh, chưa sửa tệp thuộc Gemini.

## Giới hạn và bước tiếp

- CUA thử lại vẫn lỗi kernel assets/path, chưa vào được browser. Chưa nhận UI mới đạt cho retry offline/deadline, mobile, Word download, bộ soạn/restore, lịch sử thiếu dữ liệu, đóng/mở lại cùng lượt và account switch. Không do automatic approval review từ chối. Không thay kiểm UI bằng số unit/HTTP.
- Hai browser độc lập, mạng thật/đổi máy, Word/PDF phức tạp, nhiều chính sách chấm, regrade/đính chính/gia hạn/mở lại vẫn mở. UI nháp chấm chưa bền qua đóng tab; nhận xét riêng khi câu chưa có điểm chưa có luồng lưu độc lập. Clipboard/share copy còn warning/ca UX kế thừa.
- Các ca restore chưa nộp/stale account/comment_only đã kiểm API mới, còn UI tương ứng. Không đóng CV048/057/060/061.
- Đã chuyển assignment teacher từ Claude generation2 READY_FOR_REVIEW sang Codex generation3 để tích hợp và sửa review. Claude được nhắn dừng ghi generation2 và giữ WIP nếu có; không chờ phiên đã dừng. Chưa có commit follow-up ngoài3SHA đã nhận. Gemini READY_FOR_REVIEW, đã nhận hai báo cáo. Codex tiếp kiểm quyền caller/mẫu và các ca UI khi công cụ hoạt động; dùng hồ sơ02/checklist làm hàng đợi, không đọc lại toàn bộ chat.
