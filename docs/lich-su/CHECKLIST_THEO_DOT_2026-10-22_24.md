# Nhật ký theo đợt chuyển ra từ checklist — 22–24/10/2026

> **Lịch sử, không phải trạng thái.** Ngày 24/10/2026 các dòng ghi theo từng đợt của những CV dưới đây được chuyển nguyên văn khỏi [checklist](../ke-hoach-2026-10-21/03_CHECKLIST.md) (chỉ bỏ hai dấu cách thụt đầu dòng). Trạng thái hiện tại là dòng "Hiện trạng" của từng CV trong checklist; số liệu kiểm thử ở báo cáo nhóm `qa/rebuild-*`. Liên kết tương đối giữ nguyên vì cùng độ sâu thư mục. Bản đầy đủ trước khi chuyển nằm trong lịch sử Git (commit `ef625f5`).

## CV-001 — Ghi baseline và bảo toàn working tree.

- Bổ sung24/10: theo yêu cầu chủ dự án, toàn bộ thay đổi22–24/10 đã commit local theo nhóm trên nhánh `rebuild/2026-10-local` (7commit `86968fc`…`28d5d8e`: migration, sửa byte migration, code, tests, scripts, docs, bằng chứng QA). `main` giữ `bb831f2`; chưa push. Đã kiểm `.env`, `.env.test`, `backups/` bị ignore và không có trong commit; quét tệp đưa vào chỉ thấy giá trị mẫu/email giả lập. `tmp/` (codemod một lần + ảnh scan nghiên cứu) để ngoài commit, không xóa.

## CV-010 — Nháp offline, version và chống ghi đè.

- Đợt phản hồi23/10: hook React production/storage thật với API hàng đợi giả; sửa B trong khi A đang lưu→ack A không đè B→B lưu tiếp baseVersion2đạt. Chuyển tài khoản trước ack giữ UI/cache B và nháp A riêng. Không mạng thật/hai browser độc lập, giữ mở. [DELAYED_SAVE](../../qa/rebuild-2026-10-23/DELAYED_SAVE.md).
- Đợt mất kết nối23/10: tắt đúng server QA, sửa/lưu báo lỗi và giữ nháp; bật lại/mount tab mới phục hồi count2và lưu thật vào DB thử, giữ câu/ảnh/lời giải/điểm0. Tab cũ báo xung đột thay ghi đè. Không là airplane mode/tải app khi server tắt/hai browser độc lập, giữ mở. [NETWORK_OUTAGE](../../qa/rebuild-2026-10-23/NETWORK_OUTAGE.md).
- Đợt ô writer23/10: ghi ô riêng từng writer trước con trỏ chung, retire riêng thay removeItem new dùng chung. Unit đọc ô chung stale/quota/retire đạt; hai tab localStorage thật giữ A/B sau reload và ack B còn A. Build/SAFE143đạt; còn UI React/offline/hai browser độc lập/phản hồi muộn. [WRITER_SLOTS](../../qa/rebuild-2026-10-23/WRITER_SLOTS.md), giữ mở.
- Đợt tiếp nối23/10: writer riêng mỗi lần mở bàn soạn, archive nháp khác trước thay ô/cache; lỗi archive dừng ghi. SAFE20+108 và build đạt. Chưa có giao dịch storage nguyên tử giữa nhiều tab; [TABS_AND_REVOCATION](../../qa/rebuild-2026-10-23/TABS_AND_REVOCATION.md), giữ mở.
- Cập nhật23/10: Docker đã hoạt động; DB7/7 và browser hai tab đã kiểm giữ nháp khi xung đột → mở server → phục hồi nháp thành đề mới, giữ cả lời giải, đề gốc không đổi. Poll bắt buộc tài khoản kỳ vọng. SAFE20+105 đạt; kết quả bản dựng/API cuối và giới hạn tại [RECOVERY23/10](../../qa/rebuild-2026-10-23/RECOVERY.md), [verification.json](../../qa/rebuild-2026-10-23/verification.json). Chưa đủ offline/hai trình duyệt độc lập, giữ mở.
- Đã có helper nháp tách tài khoản, CAS hai transaction và guard dự kiến người dùng; giữ mở vì chưa đủ QA offline/reconnect/hai trình duyệt và tab cũ theo mọi kịch bản.

## CV-011 — Quyền đối tượng và liên kết.

- Bổ sung24/10: Copilot/tweak/verify pin tài khoản ở client và chặn sai tài khoản tại server trước body/khóa/provider; HTTP17/17mới kiểm cả anonymous/cross-origin/pin đúng với body sai, không tăng usage. Chỉ DB thử; chưa đóng toàn bộ CV. [COPILOT_GUARDS](../../qa/rebuild-2026-10-23/COPILOT_GUARDS.md).
- Đợt đối tượng23/10: pin tài khoản folder/group/ngân hàng/key/usage; same-origin khi ghi, lọc liên kết/số lượng theo chủ, chặn xóa folder có dữ liệu cũ khác chủ. HTTP16/16mới và SAFE151/build45trang đạt; UI thêm học sinh→reload giữ danh sách. Còn template/quyền toàn diện và phản hồi UI chậm, giữ mở. [OBJECT_ACCESS](../../qa/rebuild-2026-10-23/OBJECT_ACCESS.md).
- Bổ sung23/10: kiểm tài khoản kỳ vọng ở GET đề, cộng tác/góp ý/lịch sử và các thao tác tương ứng; test sai tài khoản không tạo góp ý/đổi quyền. Quyền đối tượng vẫn kiểm ở server; chưa đóng toàn bộ CV từ một nhóm endpoint. Bằng chứng đợt tại RECOVERY23/10.

## CV-013 — Củng cố tài khoản và bảo vệ key.

- Bổ sung23/10: quản lý/test key và nhật ký usage dùng tài khoản UI đã chụp; server trả409 khi tab cũ có phiên tài khoản mới trước khi đọc/ghi/gọi provider. HTTP đạt, không gọi AI thật; xem OBJECT_ACCESS. Không xoay bí mật DB chính.
- Bổ sung23/10: giao diện chỉ chuyển sau khi server xác nhận logout; lỗi mạng/HTTP/ack giữ giao diện và báo lỗi. Tab cũ không được logout phiên của tài khoản mới; helper có2ca bổ sung và assertion HTTP. Xem RECOVERY23/10; production/rekey vẫn chưa nghiệm thu.

## CV-014 — Thử migration có mapping và chạy lặp an toàn.

- Bổ sung24/10: khi commit, `core.autocrlf=input` đổi xuống dòng của migration `exam_collaboration` (bản trên đĩa có xuống dòng lẫn lộn) nên blob Git khác byte bản đã áp dụng. Thêm `.gitattributes` `prisma/migrations/**/migration.sql -text` và commit `22af32b`; hash3migration mới trong Git khớp tệp trên đĩa. Chưa thử checkout sạch rồi `prisma migrate status` với DB chính; không chạy migration.
- Đợt nhiều lượt23/10: dấu SHA256 nguồn trong snapshot đầu, không dựa bản server đã sửa để coi trùng; nguồn khác/thiếu dấu có xem trước và xác nhận bản sao riêng, retry không nhân đôi. Advisory lock kiểm hai request khác nguồn; UI nhập1bản sao/giữ1lỗi. SAFE138/build/HTTP16đạt. Không tự đoán/bổ sung dấu cho bản cũ; [CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md), giữ mở cho toàn tiêu chí.
- Đợt browser/IDB23/10: JSON hỏng sau preview đã xác nhận gỡ nút/checkbox; tải/chọn lại phần2của kho101đề. IndexedDB thật giữ bản cũ/retry/rollback hai store đạt. API chặn mọi biến thể cùng ID khác nội dung trong một request; SAFE137/build/HTTP16đạt,4lỗi/0ghi ở preview và import. Còn khác lượt/tệp, UI tách biến thể và toàn luồng local→server; [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md), giữ mở.
- Đợt giới hạn23/10: parser JSON/BOM/cấu trúc/phiên bản/số mục và reset preview khi chọn tệp mới; xuất chia100đề/30MB. SAFE136/build/HTTP16đạt; preview101đề chia100+1 không ghi DB. Chưa kiểm UI nhiều phần/tệp hỏng và IndexedDB thật; [BACKUP_LIMITS](../../qa/rebuild-2026-10-23/BACKUP_LIMITS.md), giữ mở.
- Tiếp nối UI23/10: checkbox→nhập→mở đạt; archive thực4đề/3ảnh tải từ liên kết UI, chọn lại đúng file→3mục nhập/1đã chuyển/0lỗi; ảnh hiển thị hashkhớp/điểm0/lời giải. Chặn confirm cũ đã qua. [IMPORT_UI_ROUNDTRIP](../../qa/rebuild-2026-10-23/IMPORT_UI_ROUNDTRIP.md); giữ mở cho các tiêu chí còn lại.
- Đợt UI/ảnh23/10: file chooser/preview thật1mục sẵn sàng1mục lỗi; thêm lối mở modal và thay confirm bằng checkbox. UI nhập/download cuối chưa xong do hộp native cũ chặn công cụ; không suy API thành UI. [IMPORT_UI_AND_IMAGES](../../qa/rebuild-2026-10-23/IMPORT_UI_AND_IMAGES.md), giữ mở.
- Đợt nhập23/10: giữ mapping items/thứ tự/điểm0/ngữ liệu/hình/lời giải; HTTP xem trước không ghi, lỗi từng mục, nhập lặp không đè sửa máy chủ, sửa lỗi rồi resume, tách tài khoản. SAFE20+110/build và API16/16 đạt. Câu rời có ngữ liệu báo lỗi thay vì nhập thiếu; còn UI/IndexedDB/asset và đủ tiêu chí. [LEGACY_IMPORT](../../qa/rebuild-2026-10-23/LEGACY_IMPORT.md); giữ mở.

## CV-015 — Hợp nhất kho đề/ngân hàng với nguồn server.

- Đợt nhiều lượt23/10: đề và câu ngân hàng đối chiếu nguồn qua request sau; bản sao riêng có mã ổn định theo tài khoản/loại/nguồn/nội dung. Bản giáo viên đã sửa và revision giữ nguyên; còn nghiệm thu tổng thể kho/local/filter/trash/ngữ liệu. Xem CROSS_IMPORT_AND_FULL_RESTORE, giữ mở.
- Đợt IDB thật23/10: harness origin riêng gọi thư viện production; giữ đề/câu cùng ID cũ, chỉ thêm ID thiếu, retry0; ghi câu thất bại rollback cả đề mới. Export giữ cả biến thể và đủ3nguồn lịch sử, không đổi nguồn; chưa là UI hợp nhất đầy đủ/kho/filter/trash. Xem BROWSER_AND_INDEXEDDB, giữ mở.
- Bổ sung23/10: export/xem trước đọc cả IndexedDB và3nguồn localStorage; sao chép local chỉ thêm ID thiếu, không ghi đè/xóa nguồn. Test table/storage giả đạt; chưa kiểm transaction IndexedDB thật, xử lý cùng ID khác nội dung hoặc toàn bộ kho/filter/trash/restore. Xem LEGACY_IMPORT; giữ mở.

## CV-018 — Chọn phạm vi trực tiếp hoặc chat.

- Đợt chat23/10: có API BYOK/quota dùng chung, mã/revision/sách/mapping được kiểm, bảng diff và nhận/hủy rõ ràng; đổi ngữ cảnh khóa đề nghị cũ. Build45trang/SAFE151/HTTP16đạt; component browser bằng kết quả giả qua preview→nhận→Apply/clarification đạt. Còn luồng AI thật→lưu/mở đầy đủ và đánh giá hiểu yêu cầu/chuyên môn, giữ mở. [SCOPE_CHAT](../../qa/rebuild-2026-10-23/SCOPE_CHAT.md).
- Đã kiểm giao diện nhập/chọn include–exclude/giới hạn phương pháp, xem trước/áp dụng/lưu/tải lại; loại trừ ưu tiên và không tự mở rộng tiên quyết. Chưa có chat đề nghị scope. Xem qa/rebuild-2026-10-22/KNOWLEDGE_SCOPE.md.

## CV-025 — Lịch sử câu và kiểm định theo phiên bản.

- Đọc tĩnh24/10 (chưa đo): mỗi lần lưu đề bằng document, `writeDocumentQuestions` trong `exam-persistence.ts` xóa/ghi lại liên kết và tạo một QuestionRevision cho **mọi** câu, kể cả câu không đổi; autosave sau0,9giây nên bảng revision có thể tăng nhanh với đề dài. Cần đo dung lượng/thời gian lưu (liên quan CV074) trước khi quyết định chỉ ghi câu đổi; không sửa trong đợt hồ sơ.
- Bổ sung24/10: Undo/Redo Copilot sửa/thêm/bỏ có guard toàn nền/source/owner và ack trước chuyển mốc. Browser chuỗi2Undo/2Redo, parent từ chối/retry và source mới đạt; giữ B/0/ảnh/ID, version tăng. SAFE223/build46đạt. Stack còn RAM, chưa bền sau reload; [AI_JOURNAL_AND_HISTORY](../../qa/rebuild-2026-10-23/AI_JOURNAL_AND_HISTORY.md).
- Đợt24/10: Undo so câu/ngữ cảnh và guard lại trong updater; tăng version/reset verified, sửa ghost history sau chuỗi Undo. Browser2Undo→sửa mới đúng1mốc; B sửa lời giải→Undo A bị chặn, DBversion/hash không đổi. Clone/move/lưu/reload giữ lời giải mới/ảnh/điểm0; offline sau Apply giữ journal đến serverSaved rồi mới cleanup. Build46trang/SAFE203/HTTP17/integration7đạt; lint tập trung đạt. Còn redo, lịch sử Undo bền và bảo vệ toàn luồng AI; [QUESTION_COMMANDS](../../qa/rebuild-2026-10-23/QUESTION_COMMANDS.md).

## CV-035 — AI sửa vùng được chọn và diff.

- Bổ sung24/10: pending câu/Copilot bền qua tải trang theo account/doc/writer; apply/discard cất bản đối chiếu có thể xem/tải thay vì mất nguồn. Browser fresh-page calls[], archive/stale/download JSON/account isolation đạt; quota/malformed/đúng raw có test. SAFE223/build46đạt; còn provider/chuyên môn/nhập proposal qua máy khác và toàn tiêu chí.
- Đợt24/10: đề xuất câu và Copilot giữ preview khi stale/parent từ chối; đúng props ack mới đóng. Updater so toàn nền/ngữ cảnh/quyền để giữ sửa mới; sửa giữ0/hình/liên kết, thêm ID riêng/chưa điểm, bỏ đúng ID. SAFE214/HTTP17đạt, build46/typecheck và production chọn đúng mục tiêu/focus cuối đạt; DB thử/source giữ nguyên sau UI. Browser component thật/API giả kiểm retry/accept/Undo câu/race/thêm/bỏ; không gọi AI thật. Còn lịch sử/undo Copilot bền, chuyên môn và các luồng AI khác; [COPILOT_GUARDS](../../qa/rebuild-2026-10-23/COPILOT_GUARDS.md), [QUESTION_AI_REVIEW](../../qa/rebuild-2026-10-23/QUESTION_AI_REVIEW.md).

## CV-050 — Mất mạng, reconnect và thu hồi quyền đang mở.

- Đợt phản hồi23/10: kiểm hook React bằng API có điều khiển thứ tự ack; bản mới và tài khoản mới không bị phản hồi cũ ghi đè, nháp đúng chủ được giữ. Xem DELAYED_SAVE; không thay ca thu hồi/quyền/mạng và nhiều browser đầy đủ.
- Đợt kết nối23/10: app thật giữ nháp khi server QA tắt, mount tab mới khi server trở lại phục hồi/lưu đúng vào PostgreSQL; tab cũ giữ nháp và báo xung đột. Không airplane mode/hai browser độc lập; xem NETWORK_OUTAGE, tiếp tục mở.
- Đợt ô writer23/10: con trỏ chung không còn là bản duy nhất có thể phục hồi; ghi lỗi dừng trước cập nhật shared, ack một tab không xóa nháp tab khác. Hai tab/harness và unit đạt, chưa thay offline/reconnect UI toàn luồng. Xem WRITER_SLOTS, giữ mở.
- Đợt tiếp nối23/10: browser giữ nháp khi hạ quyền rồi thu hồi toàn bộ; server gốc không đổi. Save401/403/404 khóa ngay và giữ nháp trước khóa; nhánh save403 UI chưa kiểm riêng vì poll đã chạy trước. API15/15 gồm retry sau thu hồi không đổi nội dung/revision. Bằng chứng tại TABS_AND_REVOCATION; giữ mở.
- Bổ sung23/10: browser mô phỏng server tạm dừng/nối lại, phục hồi sau xung đột, logout lỗi kết nối và chuyển tài khoản khóa sửa/giữ nội dung. Chưa thay ca offline đầy đủ/hai trình duyệt/thu hồi quyền và race; [RECOVERY23/10](../../qa/rebuild-2026-10-23/RECOVERY.md), giữ mở.

## CV-057 — Lưu nháp và resume thật.

- CAS24/10: khóa row+hash nền cho draft/submit; HTTP race/retry/resume/stale-submit không đổiDB đạt, browser2tab A thắng/B giữ và tảiJSON thật/Bbị chặn nộp/A nộp đúng. Build46/HTTP17/SAFE226 mới đạt. [Chi tiết](../../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md). Không merge, chưa journal học sinh qua đóng tab/mất điện hoặc hai browser độc lập; không đóng CV.
- Bổ sung24/10: UI7dạng autosave→trang mới→nhập cùng tên→resume7/7, giữ0/false/tự luận/ghép/thứ tự, deadline không reset; nộp7đtạm, chấm tay2.5→9.5. Chưa kiểm ghi muộn/mất mạng/nhiều profile độc lập; không đóng CV.

## CV-060 — Chấm tay, đính chính và điểm chốt.

- CAS/lịch sử chấm24/10: token nền điểm theo attempt/câu/bài làm/điểm/nhận xét; POST bắt buộc baseGradeRevision, row-lock, nền cũ→409GRADE_CONFLICT không đổi DB; AuditLog`attempt.grade` cùng transaction, GET chủ bài xem50sự kiện gần nhất. Log sau sửa mã cuối: build46trang/TypeScript, SAFE20+211=231, HTTP17/17 gồm thiếu nền/ngoài snapshot/vượt điểm400, đổi tài khoản409 không sự kiện, hai lần chấm cùng nền một200/một409, retry mất receipt không nhân đôi lịch sử, giáo viên khác404. Lint log rỗng chưa kết luận; UI2tab chưa chạy. Mã tại commit local`28d5d8e`. [MANUAL_GRADE_CAS_AND_HISTORY](../../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md). Chưa paging/khôi phục điểm từ lịch sử, chưa đính chính đáp án/regrade; không đóng CV.
- UI24/10: guard detail requestseq/attemptRef ngăn A phản hồi muộn thành bàiB; chấm chỉ đúng attempt đang mở,503giữô2.5/báolỗi/retryđúng, trảdetail sauđóng không tựmởlại. Browser actualcomponent/fakeAPI và production7dạngđạt, build46/SAFE229 mới; [báo cáo](../../qa/rebuild-2026-10-23/TEACHER_DETAIL_REVIEW.md). Chưa CAS/hist chấm giữa2tab, không đóng CV.

## CV-061 — Theo dõi, phản hồi và bảng điểm.

- Bổ sung24/10 (chấm tay): trang chi tiết đọc được câu trả lời ghép/sắp xếp/đúng-sai, giữ0/false, câu chưa làm ghi "Chưa trả lời"; production DB thử đọc đúng lượt bảy dạng. HTTP17/17 mới xác nhận thống kê đã nộp/chờ chấm/đã chấm đổi đúng sau chấm tay và lịch sử chấm chỉ chủ bài đọc được. [TEACHER_DETAIL_REVIEW](../../qa/rebuild-2026-10-23/TEACHER_DETAIL_REVIEW.md), [MANUAL_GRADE_CAS_AND_HISTORY](../../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md). Raw JSON nguồn không nhận diện vẫn hiện nguyên để không đoán; còn gia hạn/mở lại, nhiều chính sách nhận xét và UI2tab; không đóng CV.
- Bổ sung24/10: bỏ kết quả giả0, dẫn bảng điểm thật; UI bài nộp/chấm tay9.5đạt. Pending đúng nhãn/số nộp và chỉ điểm chốt tính trung bình đã kiểm UI; mặc định leaderboardOFF UI đạt. Build46/typecheck, HTTP17 mới, DBread-only/CSV/hash nguồn đạt; SAFE223 trước sửa pending. Xem báo cáo nhóm CV054. Còn rawJSON/null trong chi tiết, nhiều chính sách/nhận xét/gia hạn và xung đột chấm, không đóng CV.

## CV-072 — Backup/restore và cảnh báo lỗi.

- Đợt đầy đủ23/10: dump DB chính chỉ đọc, restore vào DB mới `examcraft_restore_full_20261023085454302`;24bảng khớp số hàng/hash,6tệp public khớp SHA256, config DPAPI phục hồi đúng/1khóa thật giải mã trong RAM. Nguồn DB/public/env không đổi, không xóa;3lần lỗi trước bảo vệ config giữ nguyên và không nhận đạt. Còn app phục hồi/cutover, entrypoint restore cũ và retention an toàn; chưa đóng CV. Xem CROSS_IMPORT_AND_FULL_RESTORE và [bằng chứng](../../qa/rebuild-2026-10-23/full-restore-verification.json).
- Đợt browser/IDB23/10: UI kho101đề tạo2liên kết100+1/5ảnh; phần2tải thật604bytes, chọn lại preview0sẵn sàng/1đã chuyển/0lỗi. JSON lỗi gỡ preview/nút cũ. Chưa tải/khôi phục toàn bộ các phần hoặc browser>30MB/restore vận hành DB+tệp; xem BROWSER_AND_INDEXEDDB, giữ mở.
- Đợt giới hạn23/10: tự chia archive theo byte UTF-8/100đề, giữ nguyên từng đề/ảnh/thứ tự và liên kết tải từng phần. Unit sát biên đạt, API preview100+1đủ/0lỗi. Chưa browser kho>30MB/đo bộ nhớ hay restore vận hành DB+tệp; xem BACKUP_LIMITS, giữ mở.
- Tiếp nối UI23/10: ảnh thiếu dừng đúng, copy phục hồi PNG QA có hash và giữ nguồn; tạo liên kết tải tồn tại, nhận archive thực7063bytes,3ảnh khớp hash; nhập lại/mở ảnh qua UI đạt. Build/SAFE132đạt. Chưa đủ restore DB+tệp/khối lượng lớn; xem IMPORT_UI_ROUNDTRIP, giữ mở.
- Đợt ảnh23/10: backup nhúng nguyên byte ảnh; lỗi thiếu/quá lớn/định dạng dừng tạo archive. Script cô lập chuyển PNG QA (không xóa), phục hồi qua API, SHA256khớp/điểm0/lời giải/đề gốc giữ nguyên; browser hiện160×80. Build/HTTP16đạt, SAFE132trước checkbox. Còn UI xuất/nhập, archive lớn, IndexedDB và restore DB+tệp đủ; xem IMPORT_UI_AND_IMAGES, giữ mở.

## CV-073 — Chốt vận hành local và phương án pilot.

- Phát hiện24/10: runbook `docs/van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md` ghi chạy bằng `pwsh` (PowerShell7) nhưng máy hiện tại không có pwsh trên PATH; `backup.ps1`/`restore.ps1` không dùng cú pháp riêng của PowerShell7, nên cần ghi lệnh tương đương `powershell -NoProfile -File …` hoặc yêu cầu cài pwsh. Chưa chạy lại script; chưa sửa runbook.

## CV-077 — Dọn đường cũ và cập nhật tài liệu.

- Rà tài liệu24/10 (chưa sửa các tệp dưới, ghi để xử lý):
  - Mã: `/test/[id]` là trang chặn link cũ an toàn nhưng nút dẫn tới `/room` không tồn tại (404).
  - Hồ sơ cũ: 08 mục1 và mục11 còn "dừng trước code"/"[ ] chờ xác nhận bắt đầu"; quan sát mã ở mục3 đã cũ (draft đã kiểm cookie lượt làm, PATCH đã có baseVersion, scoring không còn fallback Toán12). 05 mục7 và 07 mục4/10 còn câu "chưa bắt đầu code". 00 có ghi chú chung nhưng các tệp này chưa có banner riêng.
  - Checklist ghi nơi bằng chứng `qa/evidence/rebuild-2026-10-21/<CV-id>/` nhưng thực tế ở `qa/rebuild-2026-10-22/` và `qa/rebuild-2026-10-23/`.
  - Liên kết: 120 liên kết tuyệt đối `F:/Workspace/...` trong21tệp (README, bộ kế hoạch, nghiên cứu) hỏng khi đổi máy/xem trên GitHub; 7 liên kết trỏ ra ngoài repo (`F:/Downloads`, `.codex`). Không có liên kết hỏng trên máy này (551 liên kết đã quét, trừ tham chiếu `tệp:dòng` cũ trong báo cáo V1–V3).
  - `qa/` gốc: khoảng25 báo cáo cũ (FINAL_REPORT*, qa/reports/*, standup) có chữ "100%" nhưng không có banner lịch sử như `docs/`; `qa/FIX_REPORT.md` trùng y hệt `qa/BAO_CAO_SUA_LOI.md`.
