# Tiến độ cải tiến ExamCraft

Cập nhật: 24/10/2026. Chủ dự án đã duyệt hướng và cho triển khai liên tục. Phạm vi sử dụng: cá nhân, vài người hoặc nhóm nội bộ nhỏ. Giữ một ứng dụng và PostgreSQL; chỉ thêm thành phần khi cần cho hành vi đã chốt.

## Thông báo chung

Đợt chấm tay và lưu Git24/10: giáo viên chấm từ trang cũ hoặc hai người chấm cùng lúc không còn ghi đè nhau; người gửi sau được báo xung đột và giữ điểm đang nhập. Mỗi lần chấm được ghi lịch sử (trước/sau điểm và nhận xét), chỉ chủ bài xem được. Trang chi tiết đọc được câu ghép/sắp xếp/đúng-sai và không bị phản hồi chậm của bài khác chen vào. Log bản dựng46trang, 231kiểm thử nền và17/17API đạt sau lần sửa mã cuối; chưa kiểm giao diện hai tab chấm cùng câu và lint nhóm này chưa kết luận. Theo yêu cầu, toàn bộ thay đổi22–24/10 đã commit local theo nhóm trên nhánh `rebuild/2026-10-local`, chưa push; `.env` và `backups/` không vào Git. Rà tài liệu/mã còn phát hiện: sao chép từ link chia sẻ chỉ lưu trên trình duyệt, model AI mặc định lệch, runbook ghi `pwsh` máy chưa có; đã ghi vào checklist, chưa sửa. Chỉ DB thử, không AI thật. [Chấm tay](../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md), [đọc chi tiết](../qa/rebuild-2026-10-23/TEACHER_DETAIL_REVIEW.md).

Đợt nháp học sinh24/10: đã chặn trang cũ ghi đè nháp hoặc nộp đè bản mới; khi xung đột giữ câu đang nhập và tải bản sao được. Kiểm hai tab thật: A lưu bản mới, B bị chặn và tải được nội dung riêng, A nộp đúng; đối chiếu DB thử/nguồn giữ nguyên. Build46/17HTTP/226kiểm thử nền mới đạt. Chưa phục hồi nháp học sinh sau đóng trang/mất điện; tiếp tục phần chấm/hiển thị và xử lý lỗi, chưa tổng nghiệm thu. [Báo cáo](../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md).

Đợt giao/chấm24/10: đã kiểm giao bài không lớp, học sinh làm đủ7dạng/lưu nháp/mở trang mới làm tiếp, nộp7đtạm rồi giáo viên chấm thành9.5; CSV và nguồn dữ liệu đối chiếu đúng. Sửa quyền khi đổi tài khoản và các nhãn/số liệu chờ chấm gây hiểu nhầm; bảng xếp hạng mặc định tắt. Build46trang/HTTP17 mới đạt,223kiểm thử nền đạt trước sửa hiển thị cuối. Đang tiếp chặn nháp học sinh ghi đè bởi yêu cầu chậm/nhiều tab; chưa tổng nghiệm thu. Chỉ DB thử, không AI thật. [Báo cáo](../qa/rebuild-2026-10-23/ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md).

Đợt giữ đề xuất/hoàn tác24/10: tải lại trang vẫn có đề xuất AI theo đúng tài khoản và đề, không gọi AI lại; bản đã áp dụng/cất vẫn xem và tải đối chiếu được. Copilot đã Undo/Redo sửa/thêm/bỏ, kiểm chuỗi nhiều thao tác và chặn nền mới/parent từ chối. Build46trang,223kiểm thử nền đạt; browser kiểm localStorage thật và tệp JSON tải xuống. Chưa dùng AI thật; đang tiếp tục giao bài–làm bài–chấm và rà quyền chia sẻ. [Báo cáo](../qa/rebuild-2026-10-23/AI_JOURNAL_AND_HISTORY.md).

Đợt Copilot24/10: đã chặn sai tài khoản ở cả client/server, giữ đề xuất khi chưa áp dụng được và kiểm lại bản nền ngay lúc cập nhật để không ghi đè sửa mới. Đúng xác nhận mới đóng preview; sửa/thêm/bỏ giữ dữ liệu liên quan, nút Bảo AI nhắm đúng câu. Build46trang/typecheck,214kiểm thử nền và17API đạt; browser kiểm thêm race/retry/Undo bằng AI giả và chọn mục tiêu trên app thật. Dữ liệu chính giữ nguyên; khóa vừa gửi chưa nhập hoặc dùng, chưa đánh giá AI thật. Còn đề xuất bền qua reload, undo/redo Copilot và nghiệm thu chuyên môn. [Báo cáo và bằng chứng](../qa/rebuild-2026-10-23/COPILOT_GUARDS.md).

Đợt bảo toàn câu24/10: đã kiểm Undo liên tiếp, chặn Undo cũ sau tab khác sửa, nhân bản/đổi thứ tự rồi mở lại. Khi mất kết nối ngay sau Apply, nháp vẫn giữ tới khi máy chủ xác nhận lưu. Sửa thêm lỗi đáp án từ dữ liệu cũ xuất hiện lại sau khi xóa; kiểm API/DB và nhập lại nguồn đạt. Build46trang,203kiểm thử nền,17API và7integration đạt; chỉ DB thử, nguồn thật giữ nguyên. Đang tiếp tục bảo vệ đề xuất AI trước bản nền thay đổi; chưa tổng nghiệm thu. [Lệnh câu](../qa/rebuild-2026-10-23/QUESTION_COMMANDS.md), [đáp án cũ](../qa/rebuild-2026-10-23/QUESTION_CANONICAL_CLEAR.md).

Đợt nháp câu/màn hình nhỏ24/10: đóng/mở bảng sửa và trang mới giữ nháp; Lưu đề báo rõ phần câu chưa áp dụng. Hai tab kiểm B lưu lời giải mới, A giữ nháp cũ và bị chặn ghi đè; DBversion/hash không đổi sau A bị chặn, giữ ảnh/điểm0/plan. Cất nháp rồi reload vẫn tải lại được và bản server còn đúng. Màn hình360px đã có đủ vùng soạn thay vì bị hai rail ép hẹp; form390px/nút Apply hiển thị đủ. Build46trang/192kiểm thử nền đạt;17API nhóm mẫu kế thừa vì API không đổi. Đang tiếp tục rà thao tác câu/lịch sử; chưa nghiệm thu toàn dự án, không sửa dữ liệu thật. [Báo cáo](../qa/rebuild-2026-10-23/QUESTION_DRAFTS_AND_MOBILE.md).

Đợt mẫu cá nhân24/10: đã lưu mẫu riêng có nguồn/phiên bản, xem trước rồi áp dụng phần được chọn, tùy chỉnh và lưu thành bản mới. Bấm lưu lại không tạo bản trùng; DB thử xác nhận mẫu gốc và toàn câu/phần/kế hoạch không đổi, còn ảnh/lời giải/điểm0. Build46trang,184kiểm thử nền và17API đạt. Đang xử lý tiếp nháp trong bảng sửa từng câu để tránh mất khi đóng/reload hoặc ghi đè bản mới, cùng bố cục màn hình nhỏ đã phát hiện bị ép chiều rộng. Các sửa tiếp này chưa kiểm tích hợp xong; chưa tổng nghiệm thu hoặc sửa dữ liệu thật. [Mẫu và bằng chứng](../qa/rebuild-2026-10-23/PERSONAL_TEMPLATES.md).

Đợt tiêu đề23/10: chỉnh năm/ghi chú, thêm–ẩn dòng, căn vị trí A4/Word và bảo vệ khi cùng sửa. Hai tab thật kiểm giữ kế hoạch/tên mới; cùng trường đổi thì giữ nháp và chặn ghi, version/hash DB thử không đổi. Lưu/reload còn đúng ảnh/câu/điểm0. Build45trang,173kiểm thử nền và16API đạt. Đã kiểm thêm hook phản hồi lưu muộn/đổi tài khoản bằng API giả. Đang tích hợp mẫu cá nhân riêng tư, phiên bản và nguồn; chưa gọi AI thật hoặc sửa DB chính. [Tiêu đề](../qa/rebuild-2026-10-23/HEADER_LAYOUT.md), [phản hồi muộn](../qa/rebuild-2026-10-23/DELAYED_SAVE.md).

Đợt kế hoạch/xuất và mất kết nối23/10: giáo viên đã đặt mục tiêu theo7dạng/số câu/điểm rồi so từng ô với đề; kế hoạch lưu/mở lại qua giao diện và DB thử đúng, đã có bảng ở A4/Word. Build45trang và165kiểm thử nền đạt;16/16API tại bản kế hoạch đạt. Thử tắt máy chủ QA, sửa/lưu lỗi rồi kết nối lại: nháp được phục hồi/lưu thật, giữ câu/ảnh/lời giải/điểm0; tab cũ giữ bản riêng. Đang tiếp nhóm tiêu đề để tránh ghi đè dữ liệu mới và cho chỉnh dòng in. Không sửa dữ liệu chính hoặc gọi AI thật. [Kế hoạch](../qa/rebuild-2026-10-23/EXAM_PLAN.md), [mất kết nối](../qa/rebuild-2026-10-23/NETWORK_OUTAGE.md).

Đã làm tiếp liền mạch23/10: nháp riêng từng tab giữ bản khi tab khác lưu; mở rộng kiểm đúng tài khoản cho thư mục/lớp/ngân hàng/khóa AI; sửa thêm học sinh và kiểm tải lại giữ danh sách. Chat phạm vi đã có bảng so sánh/nhận/hủy, khóa đề nghị cũ và hỏi làm rõ; browser kiểm bằng AI giả, không tiêu phí. Build45trang,151kiểm thử nền và16/16API đạt tại mốc này. Đang làm tiếp kế hoạch ma trận mục tiêu–thực tế; chưa tổng nghiệm thu. [Nháp](../qa/rebuild-2026-10-23/WRITER_SLOTS.md), [quyền](../qa/rebuild-2026-10-23/OBJECT_ACCESS.md), [chat](../qa/rebuild-2026-10-23/SCOPE_CHAT.md).

Nhóm vận hành23/10 đã hoàn tất kiểm local CV072: gói backup mới có DB+tệp+cấu hình bảo vệ, restore đích mới, từ chối ghi đè, app production chạy từ bản phục hồi đăng nhập/lưu/mở đúng và phục vụ6tệp khớp hash. Chỉ rekey bản sao, nguồn không đổi. Thay wrapper backup/restore cũ; retention chỉ xem xét, không xóa. SAFE141/typecheck đạt, không gọi AI. [Báo cáo](../qa/rebuild-2026-10-23/OPERATIONS_REHEARSAL.md). Đang tiếp tục nhóm nháp nhiều tab trong cùng lượt; chưa tổng nghiệm thu dự án.

Đợt nhập nhiều lượt/khôi phục23/10: đã đối chiếu nguồn cũ, báo khác nội dung và cho xem trước/xác nhận bản sao riêng; giữ bản giáo viên đã sửa, retry không nhân đôi, kiểm cả nhập đồng thời. UI tạo bản sao đạt. Build/typecheck,138kiểm thử nền và16/16API đạt. Đã phục hồi DB chính vào đích mới:24bảng,6tệp public và cấu hình khớp;1khóa mã hóa giải mã được, nguồn không đổi. Chưa chuyển app sang bản phục hồi hoặc chuẩn hóa restore/retention cũ. [Báo cáo](../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md). Không gọi AI thật; giữ toàn bộ nguồn và bản backup, server QA đã dừng.

Đợt tiếp nối browser/IndexedDB23/10: đã kiểm giao diện chia101đề thành100+1, tải/chọn lại một phần; JSON hỏng gỡ xác nhận và nút nhập cũ. IndexedDB thật qua4nhóm bảo toàn/retry/rollback/xuất đủ nguồn. Sửa API chặn nhóm cùng mã khác nội dung trong cùng lượt, tránh bỏ qua âm thầm; build/typecheck,137kiểm thử nền và16/16API đạt. Còn so sánh giữa nhiều lượt/tệp, giao diện tách bản và restore vận hành; chưa xong toàn dự án. [Báo cáo](../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md). Dữ liệu thật giữ nguyên, server QA đã dừng.

Đợt sao lưu23/10: đã sửa kho lớn tự chia tệp tối đa100đề/30MB, giữ trọn đề và ảnh; JSON hỏng/sai cấu trúc có báo lỗi rõ và bỏ preview cũ khi chọn tệp mới. Build/typecheck,136kiểm thử nền và16/16API đạt; kho101đề chia100+1xem trước đủ, không ghi DB. Chưa kiểm UI nhiều phần/IndexedDB thật hoặc restore vận hành. [Báo cáo](../qa/rebuild-2026-10-23/BACKUP_LIMITS.md). Dữ liệu thật giữ nguyên; server QA đã dừng.

Đợt tiếp nối UI23/10: đã kiểm hoàn chỉnh nhập bằng checkbox, mở đề, tải tệp thật kèm ảnh rồi nhập lại chính tệp đó. Ảnh hiển thị sau nhập lại khớp hash gốc, giữ điểm0/lời giải. Sửa sao lưu thành bước chuẩn bị rồi bấm liên kết tải rõ ràng. Build và132test nền đạt;16API kế thừa đợt trước. Chặn native confirm cũ không còn. [Báo cáo/bằng chứng](../qa/rebuild-2026-10-23/IMPORT_UI_ROUNDTRIP.md). Còn JSON lỗi, IndexedDB thật, kho lớn và restore vận hành; chỉ dữ liệu giả, server QA đã dừng.

Đợt giao diện nhập/ảnh23/10: đã mở đường truy cập kho cũ và thêm sao lưu mang theo ảnh. Thử chuyển PNG nguồn sang thư mục QA rồi phục hồi qua API: ảnh khớp từng byte, giữ điểm0/lời giải, đề gốc không đổi; ảnh đã hiện trên browser. Build và16/16API đạt,132test nền đạt trước sửa checkbox. Preview UI đạt; hộp confirm cũ làm công cụ bấm bị kẹt, đã đổi thành checkbox nhưng còn kiểm trọn luồng nhập/download mới. [Báo cáo và giới hạn](../qa/rebuild-2026-10-23/IMPORT_UI_AND_IMAGES.md). Chỉ dữ liệu giả/DB thử, không xóa tệp gốc; server QA đã dừng.

Đợt nhập dữ liệu cũ23/10: sửa bảo toàn bản local hiện có, đọc đủ kho localStorage, giữ thứ tự/điểm0/ngữ liệu khi nhập đề liên kết và chặn nhập nhầm tài khoản. Build/typecheck,130kiểm thử nền và16/16API đạt; kiểm nhập lặp không đè bản giáo viên đã sửa, sửa mục lỗi rồi nhập tiếp. Câu rời có ngữ liệu chưa chuyển được sẽ báo lỗi rõ và giữ nguồn. Chưa nghiệm thu UI nhập/IndexedDB thật hoặc khôi phục asset. [Báo cáo](../qa/rebuild-2026-10-23/LEGACY_IMPORT.md). Chỉ DB thử; server QA đã dừng.

Đợt tiếp nối23/10: gia cố giữ nháp giữa các tab, khóa sửa ngay khi lưu bị từ chối do quyền và giữ bản mới nhất trước khi khóa. Build/typecheck,128kiểm thử nền và15/15API đạt; đã kiểm giao diện hạ/thu hồi quyền trong lúc có nháp riêng, đối chiếu DB giữ nguyên đề/lời giải gốc. Chưa đủ offline và nhiều browser độc lập. [Chi tiết và giới hạn](../qa/rebuild-2026-10-23/TABS_AND_REVOCATION.md). Chỉ DB thử, không gọi AI thật; server QA đã dừng.

Đợt23/10 sau khi mở Docker: build/typecheck,125kiểm thử mặc định, DB7/7 và API14/14 đạt. Đã kiểm giao diện giữ nháp khi xung đột, mở bản máy chủ và phục hồi nháp thành đề mới, giữ cả lời giải. Bổ sung chặn thao tác sai tài khoản ở cộng tác/góp ý/lịch sử; sửa logout chỉ chuyển trang khi server xác nhận. Đã thử lỗi mạng và tab cũ không logout nhầm phiên mới. Chỉ dùng dữ liệu giả/DB thử, không ghi DB chính hoặc gọi AI thật. Xem [báo cáo đợt này](../qa/rebuild-2026-10-23/RECOVERY.md). Còn kiểm offline/hai trình duyệt độc lập và các CV mở; chưa xong toàn bộ S0–S9. Các kết quả khác dưới đây là mốc22/10 nếu không ghi khác.

Đã bảo toàn dữ liệu và áp dụng cập nhật cấu trúc DB sau khi thử phục hồi/cài mới; 20 bảng cũ giữ nguyên số dòng và dấu kiểm nội dung. Phần gói kiến thức đã lưu/mở lại được: chọn phạm vi, loại trừ phần chưa học, giới hạn phương pháp và gắn kiến thức vào từng câu. Có cảnh báo khi câu nằm ngoài phạm vi hoặc gói đổi phiên bản.

Đường sinh bản nháp đã mở lên 7 dạng câu, có bước xem đề xuất trước khi áp dụng và giữ tiêu đề riêng. Các kiểm thử cấu trúc dùng dữ liệu giả; chưa gọi AI thật hoặc duyệt nội dung chương trình toàn môn. Tại mốc22/10, kiểm thử mặc định đạt20+101, bản dựng và14/14 kiểm thử API đạt trên DB thử; không coi đây là vòng runtime mới23/10. Chưa hoàn tất S0–S9 và chưa yêu cầu chủ dự án tổng nghiệm thu.

## Trạng thái theo đợt

| Đợt | Trạng thái | Đầu ra / bằng chứng |
|---|---|---|
| S0 — Bảo toàn và kiểm nền | Đang kiểm tích hợp | Snapshot257tệp đã hash; bí mật local mã hóa DPAPI và giải mã đối chiếu; DBdump đã phục hồi21bảng; DB thử tách riêng |
| S1 — Lưu và quyền | Luồng cốt lõi và chuyển schema đã kiểm | Adapter câu–đề; ghi transaction và baseVersion; nháp theo tài khoản; kho server; nhập cũ xem trước; DTO public/token lượt/link chia sẻ |
| S2 — Giáo dục và mẫu | Đã nối luồng gói/phạm vi, còn biên tập nội dung | Gói có phiên bản/nguồn/cây kiến thức/mục lục sách; include–exclude và giới hạn phương pháp; lưu/mở lại đã kiểm. Gắn mã từng câu và kiểm phiên bản; chưa duyệt gói toàn môn, chưa chat đổi phạm vi |
| S3 — Bàn soạn | Đang làm | Sửa thủ công7dạng/đáp án/rubric/điểm0; đặt tên phần, ngữ liệu chung, ảnh/đồ thị; chỉnh tiêu đề/môn/lớp/cách đánh giá; thiếu đáp án không tự điền |
| S4 — AI | Đang kiểm | BYOK cùng chủ, giới hạn ứng dụng riêng quota nhà cung cấp; kế hoạch7dạng/số câu0; xem đề xuất trước áp dụng, giữ tiêu đề riêng/chặn bản nền cũ; rà đáp án không khớp rỗng; đề xuất sửa có bước duyệt và chặn kết quả đến muộn |
| S5 — Nhập/trộn/xuất | Một phần | Nhập7dạng/ngữ liệu có cảnh báo nguồn; trộn giữ vị trí phương án; Word giữ thứ tự, phần và nguồn ngữ liệu. Tải trực tiếp đã đối chiếuXML; trình chiếu hiện/ẩn đáp án đã kiểm; chưa nghiệm thu đầy đủ Word/PDF dài |
| S6 — Cộng tác | API và xung đột đã kiểm | Quyết định CAS + đồng bộ định kỳ cho nhóm nhỏ, lịch sử và phân quyền; chưa tuyên bố cộng tác thời gian thực từng ký tự |
| S8 — Ghi chú riêng | Một phần | Không tự xóa/ghi đè hoặc bật phân tích mới; xuất/nhập JSON theo tài khoản, nhập để tắt chờ người dùng đọc |
| S7 — Giao bài và chấm | Một phần đã kiểm | Snapshot tách nháp, cookie lượt làm, nộp lặp an toàn; giao/làm/chấm7dạng qua UI; CAS nháp học sinh và chấm tay có lịch sử (HTTP đạt, UI chấm hai tab chưa); kiểm quyền theo chủ |
| S9 và việc còn lại | Chưa hoàn tất | Theo checklist78CV; không lấy code cũ hoặc tên menu làm bằng chứng đã đạt |

## Bảo toàn dữ liệu đã thực hiện

- Mốc Git ban đầu: `bb831f240772f27ee57e4abcb83442ab0361e483`; giữ thay đổi có sẵn.
- 24/10: commit local7nhóm trên nhánh `rebuild/2026-10-local` (`86968fc`…`28d5d8e`: migration, sửa byte migration, code, tests, scripts, docs, bằng chứng QA). `main` giữ mốc ban đầu, chưa push/merge. `.gitattributes` giữ nguyên byte các migration đã áp dụng; `tmp/` để ngoài commit.
- `backups/before-rebuild-2026-10-21T22-08-28-289Z/`:257tệp,22.083.904bytes, manifestSHA256, diff và trạng thái cây. Đã kiểm nội dung bản sao khớp.
- `.env` và `.env.test` được lưu dưới dạng mã hóa trong `protected-secrets/` của snapshot; không đưa giá trị bí mật vào báo cáo/Git. Đã thử giải mã và so sánh trong bộ nhớ. Cách bảo vệ DPAPI yêu cầu cùng hồ sơ Windows khi khôi phục.
- DBdump62017bytes trong `backups/database/`, manifestSHA256; đã phục hồi vào `examcraft_restore_20261022`,21bảng. Bằng chứng: `provision-2026-10-22T03-28-44-994Z.json`. DB thử `examcraft_test_20261022` tách khỏi bản phục hồi và DB gốc.
- Đã tạo riêng bí mật ký lượt làm trong `.env`; giữ nguyên bí mật mã hóa khóa API cũ. Bản cấu hình mới được DPAPI mã hóa và giải mã đối chiếu tại `backups/config-2026-10-22-after-attempt-secret/`. Bí mật cũ đang không phù hợp cho production; chưa triển khai production và chưa xoay bí mật mã hóa khi chưa có quy trình đổi khóa an toàn.
- Dữ liệu trình duyệt cũ giữ nguyên. Có giao diện xem trước và nhập có định danh; chưa tự gán kho cũ không rõ chủ sở hữu vào tài khoản nào.
- Đã áp dụng migration có kiểm chứng vào DB ứng dụng; thêm3bảng cộng tác, không thay nội dung20bảng cũ. main-migration.json xác nhận schema và số dòng/hash. Có backup mới ngay trước áp dụng: backups/database/examcraft-2026-10-22T09-41-13-218Z.dump. Kiểm thử ghi dữ liệu giả vẫn chỉ dùng DB thử, không seed/reset DB chính.

## Thay đổi đang kiểm

1. Lưu đủ câu, đáp án chấp nhận, rubric, ảnh, ngữ liệu, điểm0 và phiên bản; nháp local có version cũ không bị nhầm là bản đã lưu server.
2. Mỗi lần sửa cần phiên bản nền; hai người ghi cùng phiên bản chỉ một lần thành công. Xung đột giữ nháp, cho tải JSON hoặc lưu thành bản sao.
3. Kho đề/ngân hàng dùng server trong quyền; lưu vào ngân hàng khác tự lưu đề. Bản sao có ID riêng.
4. API kiểm quyền tham chiếu folder/template/question. Route public chỉ gửi các trường cho phép; lượt làm cần cookie có chữ ký, không chỉ ID.
5. Nhập dữ liệu cũ kiểm từng mục, transaction từng tài liệu, giữ mục lỗi và không ghi đè bản đã nhập khi chạy lại.
6. Kiểm thử mặc định không ghi DB/gọi AI. Runner không báo PASS khi có assertion lỗi; test cũ không còn phù hợp được sửa theo hợp đồng, không làm sai nguồn để chiều test.

## Báo cáo chi tiết

- [Đọc trước khi tiếp nối — hồ sơ ngắn cho người/AI](ban-giao/00_DOC_TRUOC.md). Đợt chuẩn hóa hồ sơ chỉ sửa tài liệu: một điểm vào, bản đồ mã nguồn và trạng thái tiếp nối; checklist78CV giữ nguyên. Không chạy lại kiểm thử ứng dụng hoặc thay đổi số PASS từ việc sửa Markdown.

- [Kiểm thử và giới hạn bằng chứng](../qa/rebuild-2026-10-22/TESTING.md).
- [Quyền, link chia sẻ và lượt làm](../qa/rebuild-2026-10-22/ACCESS.md).
- [Danh mục giáo dục, khung nhận thức và điểm](../qa/rebuild-2026-10-22/EDUCATION.md).
- [Gói kiến thức, phạm vi và liên kết từng câu](../qa/rebuild-2026-10-22/KNOWLEDGE_SCOPE.md).
- [Khóa AI và giới hạn sử dụng](../qa/rebuild-2026-10-22/BYOK.md).
- [Sinh 7 dạng câu và duyệt đề xuất, giữ tiêu đề riêng](../qa/rebuild-2026-10-22/GENERATION.md).
- [Bàn soạn, AI, trộn/xuất và ghi chú riêng](../qa/rebuild-2026-10-22/WORKSPACE.md).
- [Rà soát bảo mật và dữ liệu](../qa/rebuild-2026-10-22/SECURITY_AND_DATA_REVIEW.md).
- [Checklist hiện hành](ke-hoach-2026-10-21/03_CHECKLIST.md).
- [Phương án đã duyệt](ke-hoach-2026-10-21/08_HO_SO_TRUOC_KHI_CODE.md).

Các mục đang làm không được đánh dấu hoàn thành chỉ vì đã có file. Khi kết thúc mỗi đợt, cập nhật kết quả test thực, phạm vi đã kiểm và việc còn lại tại đây; báo cáo chuyên môn vẫn chờ người duyệt.
