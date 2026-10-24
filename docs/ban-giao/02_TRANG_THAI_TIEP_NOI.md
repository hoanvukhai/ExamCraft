# Trạng thái để tiếp nối

Mốc mới nhất: **24/10/2026, giao/chấm7dạng đã kiểm UI/DB thử, tiếp chặn nháp học sinh ghi muộn**. [Báo cáo nhóm](../../qa/rebuild-2026-10-23/ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md): pin tài khoản giao/share/bảng điểm/API, assignmentsPOST same-origin; sửa không lớp thànhFREE_NAME. UI7dạng autosave→trang mới resume→nộp7đtạm→chấm tay2.5 thành9.5; DB/CSV giữ0/false, nguồn hash không đổi. Sửa pending/Sai/số nộp, UI2nộp/1pending/avg9.5đạt. Leaderboard mặc địnhOFF; kết quả bỏ0giả; đóng bài/reload thấy lời giải AFTER_CLOSE. Build cuối46/typecheck exit0 build-assignment-pending.log, HTTP17/17 mới http-assignment-pending.log, SAFE223 mới trước sửa pending. Integration7 kế thừa. Lint UI mới6errors/13warnings (4any/2effect và dependency account); nhóm trước12lỗi kế thừa/6warnings. Không provider/khóa thật/DB chính. CAS đã kiểm build46/HTTP17/SAFE226 và UI2tab/BtảiJSON/A nộp đúng; QA3117 session34004 và harness3123 session41093 đã dừng trước build manual-grade CAS session78269; teacher review build46/SAFE229 mới đạt; harness3122 đã dừng. Tabs32teacher/34student/35monitor handoff.

Nguồn nhập nhiều lượt/bản sao đã kiểm: [CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md). UI/chia kho/IndexedDB: [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md), [vòng ảnh](../../qa/rebuild-2026-10-23/IMPORT_UI_ROUNDTRIP.md). Bằng chứng/runbook: [app phục hồi](../../qa/rebuild-2026-10-23/restored-app-verification.json), [local](../van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md). Không cần đọc toàn bộ lịch sử báo cáo để tiếp nối.
## Đã có, chưa đồng nghĩa nghiệm thu toàn bộ

- Bảo toàn working tree/bí mật và restore DB thử. Migration đã qua bản phục hồi/cài mới rồi áp dụng DB chính; thêm3bảng cộng tác, nội dung20bảng ứng dụng cũ không đổi tại mốc kiểm. [main-migration.json](../../qa/rebuild-2026-10-22/main-migration.json).
- Lưu server/nháp theo tài khoản, phiên bản nền, giữ nháp khi xung đột; adapter7dạng câu, ngân hàng/fork, lịch sử/quyền và nhập cũ xem trước. Còn ca thực tế chưa đủ để đóng toàn bộ S1.
- Soạn thủ công câu–đáp án, phần/ngữ liệu/hình, tiêu đề; gói kiến thức riêng theo phiên bản, include/exclude/giới hạn và liên kết từng câu. Lưu/tải lại đã kiểm. Gói minh họa là fixture giả, chưa là nội dung chương trình chuẩn.
- Hợp đồng sinh AI7dạng và đề xuất duyệt trước áp dụng, giữ tiêu đề/chặn bản nền cũ; BYOK/quota ứng dụng, public allowlist/lượt làm ký, snapshot giao bài/chấm tay và archive ghi chú riêng có kiểm tra nền.
- Nhập/trộn/Word/trình chiếu đã sửa và kiểm một phần; còn tài liệu phức tạp và nhiều luồng UI cần nghiệm thu.

| Bằng chứng gần nhất | Kết quả và giới hạn |
|---|---|
| SAFE journal/history | 20+203=223đạt, safe-ai-journal-history.log |
| PostgreSQL24/10 | Integration7/7 đợt canonical kế thừa; HTTP Copilot mới có ghi/đọc/cleanup DB thử |
| HTTP Copilot | 17/17 mới đạt, gồm3API AI stale-account/anonymous/origin/pin đúng/body sai và usage không đổi; canonical/reimport hồi quy giữ |
| Build/typecheck | Build46trang/typecheck cuối exit0, build-copilot-final.log. Lint Copilot0lỗi/3warnings, AI câu0lỗi/9warnings; Workspace còn2lỗi kế thừa, không nhận lint toàn repo sạch |
| Browser gần nhất | Actual component/API giả kiểm Copilot/AI câu qua stale/parent refusal/race/ack/thêm/bỏ/Undo/verifier. Production mở rail/chọn đúng câu1 kể cả trước đó chọn B/focus đạt; readonly DB/source giữ nguyên. Chưa provider thật/CSS preview dài; nháp/mobile/mẫu/header/plan/A4 kế thừa |
| Restore23/10 mới | 24bảng/6tệp/config khớp, app production từ bản phục hồi đăng nhập/lưu/mở/asset đạt; rekey chỉ bản sao1khóa, nguồn không đổi. Chưa cutover/chuyển máy |

Chưa có bằng chứng chất lượng AI thật, nhận/duyệt/hủy kết quả nhà cung cấp thật qua browser, offline hai trình duyệt độc lập, Word/PDF phức tạp, gói đủ môn–lớp đã duyệt hoặc tổng nghiệm thu. Mở [TESTING](../../qa/rebuild-2026-10-22/TESTING.md) và báo cáo nhóm khi cần chi tiết, không đọc lại nhật ký từng lượt mặc định.

## Việc tiếp theo khi được yêu cầu tiếp tục kỹ thuật

1. Tiếp **CV057**, chặn nháp học sinh ghi muộn: API draft chỉ updateMany trạng thái/deadline, chưa CAS; UI15giây có thể chồng request hoặc2tab ghi đè. Hướng không migration: token hash canonical draft, transaction row-lock rồi so token, trả409 giữ bản đang nhập; client tuần tự lưu, không tự nhận nền server sau conflict. Cần test concurrent/response muộn/no-side-effects và UI giữ/tải nháp lỗi. CAS đã sửa: hash draft, row-lock draft+submit, start trả revision, client tuần tự/chặn conflict/tảiJSON. Unit3/build46/HTTP17/SAFE226/lint helper+API mới exit0, UI2tab/DBverify trước-sau/tảiJSON B thật đạt. Nối CV060/061 hiển thị rawJSON/null và lỗi/chấm đồng thời; CV057 còn journal đóng tab/offline, không đóng CV. Xem qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md để nối kiểm, không suy đã nghiệm thu toàn bộ. Đang sửa CV060/061: formatter response dễ đọc/giữ0,false, detail requestseq chặn phản hồiA muộn vàoB, lỗi grade giữ ô nhập, account dependencies ổn định. Unit3/build46/SAFE229 mới đạt; harness38 A muộn/B giữ đúng,503giữô2.5/retry/đóng trước phản hồi đạt; production35 đọc0,false/ghép/thứtự đúng. Lint4errors/11warnings kế thừa, dependency account đã sửa. Tiếp server CAS/hist điểm: AuditLog sẵn có, không migration; cần token nền cho từng question/attempt, transaction rowlock đang có, audit cùngtransaction và HTTP race/retry/no-side-effects, UI giữ điểm khi409. Xem TEACHER_DETAIL_REVIEW.md. CAS/hist chấm đã sửa đang kiểm: GETgradeRevision+POSTbaseGradeRevision/rowlock409/nhật ký AuditLog cùngtransaction/GETowner50event/UIhistory. Unit2đạt, build-manual-grade-cas.log session78269 đang chạy, HTTP mới và UI2tab chưa chạy. Đọc MANUAL_GRADE_CAS_AND_HISTORY.md trước nối việc; chưa nhận pass.
   Fixture learning-fixture.json: exam ex_49510788f581bb80104a8ca126057b22861cbcd0, assignment cmvltft9b009btbbskwkmw4e7/public446b557862363956ea976cc0becca19f hiện CLOSED; lượt1 đủ7dạng9.5chốt, lượt2 chỉtựluận0pending. Student34 cookie hợp lệ cùng server50881. Script verify DB thử/CSV/hash nguồn đã PASS, không tạo lại fixture. Test-server xoay ATTEMPT_SESSION_SECRET mỗi restart nên cookie cũ không qua bản chạy mới; không coi đó là lỗi dữ liệu hoặc xoay secret thật. Commandsdoc3câu/hash nguồn không đổi; không chạy phase cũ. Không có agent đang chạy cần chờ.
2. Tiếp **CV010,011**, kết hợp **005,049,050**: offline/reload/reconnect trên React, nhiều tab đề mới→server ack, hai browser độc lập (hiện chỉ IAB), phản hồi muộn; folder/question/group đã bổ sung pin nhưng template/toàn bộ caller còn rà. Ô writer và retire đã có, không coi localStorage là giao dịch nguyên tử.
3. Đi hết soạn→lưu→mở→xuất, rồi mẫu có nguồn/UX. Chat cấu trúc đã có, còn ngữ nghĩa AI thật/chuyên môn; không tự tiêu phí. CV014/015 còn kho hợp nhất UI, câu rời ngữ liệu, kho lớn/bộ nhớ. CV072local đã kiểm; gói mới `backups/package-20261023093421079`, DBrestore `examcraft_restore_package_20261023`; appcopy `examcraft_restore_app_20261023` có runtime config DPAPI riêng, không trỏ DB chính. Runbook local là nguồn thao tác.
4. Tiếp nội dung theo sổ nguồn; tìm giáo viên/mẫu thực tế. Chưa có reviewer/ngân sách/nơi triển khai; chưa tuyên bố đủ nội dung/phát hành.

Đây là thứ tự đề nghị để tiếp nối, không thay lộ trình/tiêu chí. Lỗi mất dữ liệu hoặc vượt quyền mới phát hiện được ưu tiên trước tính năng. Người dùng đã cho tiếp tục code23/10 và mở Docker; không còn chờ Engine. Không tự reset engine hoặc dữ liệu dự án khác.

## Giữ đủ phạm vi, không tạo checklist thứ hai

Tất cả trạng thái và tiêu chí nằm trong [03_CHECKLIST](../ke-hoach-2026-10-21/03_CHECKLIST.md). Bảng dưới bao phủ đủ78mã để tra; không đổi dấu hoàn thành hay tính phần trăm từ số file/test:

| Đợt | Mã CV | Nhóm việc phải giữ |
|---|---|---|
| S0 | 001–007 | Baseline/fixture/hợp đồng/UX/thử cộng tác |
| S1 | 008–015 | Lưu/nháp/quyền/chuyển dữ liệu/kho |
| S2 | 016–022 | Registry/cây/scope/nhận thức/ma trận/mẫu/nguồn |
| S3 | 023–030 | Bàn soạn/đáp án/lịch sử/hình/mẫu/UX/chốt bản |
| S4 | 031–038 | BYOK/usage/hạn mức/sinh–sửa/validator/kiểm nội dung/lưu vết |
| S5 | 039–046 | Nhập/quyền nguồn/trộn/Word/PDF/trình chiếu/fixture đa môn |
| S6 | 047–053 | Quyền/link/cùng sửa/offline/góp ý/ngân hàng/AI cộng tác |
| S7 | 054–062 | Snapshot/nhận diện/lượt–hạn/nháp/làm/chấm/bảng điểm/hồi quy |
| S8 | 063–069 | Phân tích/memory/góp chung/vòng đời/truy xuất/đánh giá/xuất dữ liệu |
| S9 | 070–078 | Độ phủ/reviewer/restore/local/CI/Drive tùy chọn/hướng dẫn/dọn cũ/nghiệm thu |

Các bổ sung ND01–07, nhánh ngôn ngữ/địa phương, hiệu lực nguồn/quyền tài liệu và truy vết YC–CV–NT vẫn thuộc checklist/hồ sơ08; không mất vì bảng này gộp nhóm. Hàng đợi nghiên cứu có mốc lịch sử, đọc cập nhật đầu file trước; nguồn/hiệu lực phải kiểm lại khi dùng.

## Môi trường và điểm dễ làm sai

- Workspace nhiều thay đổi có sẵn/chưa commit; không reset, dọn hoặc commit hàng loạt. Baseline `bb831f240772f27ee57e4abcb83442ab0361e483` không phải toàn bộ trạng thái code đã sửa.
- Main: container `examcraft_postgres`, cổng5436, DB `examcraft`. Test: `examcraft_test_20261022`. Restore: `examcraft_restore_20261022`; cài mới kiểm migration: `examcraft_migrate_fresh_20261022`. Không nhầm bốn DB; không đụng container dự án khác `study_work_postgres`/5435.
- QA3117 đang chạy ở mốc trên; luôn kiểm trạng thái, không tin session ID/tool handle cũ còn dùng được. Kiểm trạng thái trước chạy. Dừng máy chủ dùng `.next` trước build.
- Bản sao nằm trong `backups/` (không Git); bí mật DPAPI phụ thuộc hồ sơ Windows. Bí mật mã hóa key cũ chưa phù hợp production: **không xoay tùy tiện vì có thể mất khả năng giải mã key cũ**. Kế hoạch rekey/asset restore còn mở; chưa phát hành production.
- Không chép `.env`, key, cookie, mật khẩu hoặc dữ liệu thật vào hồ sơ. Ghi đường dẫn bằng chứng thay log dài. Đọc guide Next cục bộ liên quan trước sửa code.

## Cập nhật cuối lượt sau

Thay mốc/trạng thái ở file này bằng thực tế mới, giữ các việc mở hoặc chuyển chúng tới đúng CV trước khi bỏ dòng. Ghi rõ test nào mới chạy, test nào kế thừa và giới hạn. Nếu chưa chạy thì viết chưa chạy; không lấy số PASS cũ làm kết quả mới. Hồ sơ ngắn đủ nối việc; lịch sử chi tiết vẫn ở báo cáo nhóm.

Mốc chuẩn hóa hồ sơ22/10:40liên kết tương đối trong bộ mới tồn tại; bảng nhóm phủ đủ78mã không trùng/thiếu so với checklist. Dấu kiểm nội dung230tệp mã/script/test/schema/cấu hình trước–sau giống nhau. Không chạy lại test ứng dụng; các số PASS ở trên kế thừa mốc code đã dẫn.
