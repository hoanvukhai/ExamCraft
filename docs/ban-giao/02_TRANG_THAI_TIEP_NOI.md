# Trạng thái để tiếp nối

Mốc mới nhất: **24/10/2026 — chấm tay có bản nền điểm và lịch sử; toàn bộ thay đổi đã commit local.**

- **Chấm tay CV060/061:** token nền điểm, nền cũ trả409`GRADE_CONFLICT`, lịch sử AuditLog cùng transaction. Log tạo sau lần sửa mã cuối: build46trang/TypeScript, SAFE20+211=231, HTTP17/17 (hai lần chấm cùng nền một200/một409, gửi lại không nhân đôi lịch sử, giáo viên khác404). Log lint nhóm này rỗng, chưa kết luận; **UI2tab chưa chạy**. [MANUAL_GRADE_CAS_AND_HISTORY](../../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md).
- **Trước đó cùng ngày:** giao/làm/chấm7dạng qua UI và DB thử, bảng xếp hạng mặc định tắt ([ASSIGNMENT_ACCESS_AND_STUDENT_FLOW](../../qa/rebuild-2026-10-23/ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md)); CAS nháp học sinh và chặn nộp bản cũ ([STUDENT_DRAFT_CAS](../../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md)); đọc chi tiết bài làm và chặn phản hồi muộn khi chấm ([TEACHER_DETAIL_REVIEW](../../qa/rebuild-2026-10-23/TEACHER_DETAIL_REVIEW.md)).
- **Git:** 7commit local theo nhóm trên nhánh `rebuild/2026-10-local`, HEAD `28d5d8e`; `main` vẫn `bb831f2`; chưa push. `.env`, `.env.test`, `backups/` không vào commit; `tmp/` để ngoài.
- **Phát hiện đọc tĩnh24/10, đã ghi vào CV:** sao chép từ link chia sẻ chỉ lưu trình duyệt (CV048); model AI mặc định lệch (CV032); lưu đề tạo revision cho mọi câu (CV025/074); runbook dùng `pwsh` máy không có (CV073); `/test/[id]` dẫn `/room` 404 và tài liệu cũ/liên kết tuyệt đối/báo cáo `qa/` gốc (CV077); byte migration trong Git (CV014, đã sửa bằng `.gitattributes`).
- Không gọi provider/khóa thật, không ghi DB chính. Kiểm24/10: không còn server QA nào chạy; tab, session và cookie fixture cũ không dùng lại được.

Nguồn nhập nhiều lượt/bản sao đã kiểm: [CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md). UI/chia kho/IndexedDB: [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md), [vòng ảnh](../../qa/rebuild-2026-10-23/IMPORT_UI_ROUNDTRIP.md). Bằng chứng/runbook: [app phục hồi](../../qa/rebuild-2026-10-23/restored-app-verification.json), [local](../van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md). Không cần đọc toàn bộ lịch sử báo cáo để tiếp nối.
## Đã có, chưa đồng nghĩa nghiệm thu toàn bộ

- Bảo toàn working tree/bí mật và restore DB thử. Migration đã qua bản phục hồi/cài mới rồi áp dụng DB chính; thêm3bảng cộng tác, nội dung20bảng ứng dụng cũ không đổi tại mốc kiểm. [main-migration.json](../../qa/rebuild-2026-10-22/main-migration.json).
- Lưu server/nháp theo tài khoản, phiên bản nền, giữ nháp khi xung đột; adapter7dạng câu, ngân hàng/fork, lịch sử/quyền và nhập cũ xem trước. Còn ca thực tế chưa đủ để đóng toàn bộ S1.
- Soạn thủ công câu–đáp án, phần/ngữ liệu/hình, tiêu đề; gói kiến thức riêng theo phiên bản, include/exclude/giới hạn và liên kết từng câu. Lưu/tải lại đã kiểm. Gói minh họa là fixture giả, chưa là nội dung chương trình chuẩn.
- Hợp đồng sinh AI7dạng và đề xuất duyệt trước áp dụng, giữ tiêu đề/chặn bản nền cũ; BYOK/quota ứng dụng, public allowlist/lượt làm ký, snapshot giao bài/chấm tay và archive ghi chú riêng có kiểm tra nền.
- Nhập/trộn/Word/trình chiếu đã sửa và kiểm một phần; còn tài liệu phức tạp và nhiều luồng UI cần nghiệm thu.

| Bằng chứng gần nhất | Kết quả và giới hạn |
|---|---|
| SAFE24/10 | 20+211=231đạt, safe-manual-grade-cas.log (sau sửa mã cuối) |
| PostgreSQL24/10 | Integration7/7 đợt canonical kế thừa; HTTP mới có ghi/đọc/cleanup DB thử |
| HTTP24/10 | 17/17 mới, http-manual-grade-cas.log: chấm tay CAS/lịch sử cùng các ca đã có (Copilot/tweak/verify pin tài khoản, CAS nháp học sinh, giao bài, canonical/reimport). Log không ghi server dựng từ build nào; chạy sau build theo thời gian |
| Build/typecheck | Build46trang/TypeScript, build-manual-grade-cas.log (log không ghi exit code, không có error/warn). Lint: nhóm chấm log rỗng chưa kết luận; trang giáo viên4errors/11warnings kế thừa (teacher-detail-review-lint.log); Workspace còn2lỗi kế thừa. Không nhận lint toàn repo sạch |
| Browser gần nhất | Giao/làm/chấm7dạng, CAS nháp hai tab và đọc chi tiết bài làm trên DB thử đạt; UI chấm tay2tab chưa chạy. Copilot/AI câu qua API giả (stale/parent refusal/race/Undo/verifier) kế thừa. Chưa provider thật/CSS preview dài |
| Restore23/10 mới | 24bảng/6tệp/config khớp, app production từ bản phục hồi đăng nhập/lưu/mở/asset đạt; rekey chỉ bản sao1khóa, nguồn không đổi. Chưa cutover/chuyển máy |

Chưa có bằng chứng chất lượng AI thật, nhận/duyệt/hủy kết quả nhà cung cấp thật qua browser, offline hai trình duyệt độc lập, Word/PDF phức tạp, gói đủ môn–lớp đã duyệt hoặc tổng nghiệm thu. Mở [TESTING](../../qa/rebuild-2026-10-22/TESTING.md) và báo cáo nhóm khi cần chi tiết, không đọc lại nhật ký từng lượt mặc định.

## Việc tiếp theo khi được yêu cầu tiếp tục kỹ thuật

1. Khép phần còn lại của **CV060/061** (chấm tay): dựng lại server thử từ bản build hiện tại, chạy UI2tab cùng câu theo [MANUAL_GRADE_CAS_AND_HISTORY](../../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md) (A2.5→2.25, B từ nền cũ phải409 và giữ ô; A2.25→2.5; lịch sử2bản), rồi chạy lại lint nhóm chấm tới khi có log đầy đủ. API CAS/lịch sử đã qua HTTP; không cần sửa API nếu UI đạt. Còn ngoài nhóm này: paging/khôi phục điểm từ lịch sử, đính chính đáp án/regrade, gia hạn/mở lại.
   Sau đó **CV057**: CAS nháp và chặn nộp bản cũ đã xong ([STUDENT_DRAFT_CAS](../../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md)); còn journal nháp học sinh qua đóng tab/mất điện, nhập lại bản JSON đã tải, hai browser độc lập và phản hồi API chậm. Không đóng CV từ số test.
   Fixture learning-fixture.json trên DB thử: exam ex_49510788f581bb80104a8ca126057b22861cbcd0, assignment cmvltft9b009btbbskwkmw4e7/public446b557862363956ea976cc0becca19f hiện CLOSED; lượt1 đủ7dạng9.5 đã chốt, lượt2 chỉ tự luận0 đang chờ chấm. Script verify DB thử/CSV/hash nguồn đã PASS, không tạo lại fixture. Test-server xoay ATTEMPT_SESSION_SECRET mỗi lần khởi động nên cookie học sinh cũ không dùng lại được; không coi đó là lỗi dữ liệu và không xoay secret thật. Không có agent đang chạy cần chờ.
2. **CV048**: nút lưu bản sao ở `/share/[id]` hiện chỉ ghi vào kho cũ trên trình duyệt, không lên server. Ưu tiên sửa trước tính năng mới vì giáo viên có thể tưởng bản sao đã nằm trong kho; cần tạo đề server có origin/quyền và kiểm người chưa đăng nhập.
3. Tiếp **CV010,011**, kết hợp **005,049,050**: offline/reload/reconnect trên React, nhiều tab đề mới→server ack, hai browser độc lập (hiện chỉ IAB), phản hồi muộn; folder/question/group đã bổ sung pin nhưng template/toàn bộ caller còn rà. Ô writer và retire đã có, không coi localStorage là giao dịch nguyên tử.
4. Đi hết soạn→lưu→mở→xuất, rồi mẫu có nguồn/UX. Chat cấu trúc đã có, còn ngữ nghĩa AI thật/chuyên môn; không tự tiêu phí. CV014/015 còn kho hợp nhất UI, câu rời ngữ liệu, kho lớn/bộ nhớ. CV072local đã kiểm; gói mới `backups/package-20261023093421079`, DBrestore `examcraft_restore_package_20261023`; appcopy `examcraft_restore_app_20261023` có runtime config DPAPI riêng, không trỏ DB chính. Runbook local là nguồn thao tác.
5. Tiếp nội dung theo sổ nguồn; tìm giáo viên/mẫu thực tế. Chưa có reviewer/ngân sách/nơi triển khai; chưa tuyên bố đủ nội dung/phát hành.
6. Khi được yêu cầu sửa tài liệu/vận hành: CV073 (runbook ghi `pwsh`, máy chỉ có PowerShell5.1) và CV077 (hồ sơ08/05/07 còn câu trước code, nơi lưu bằng chứng trong checklist, liên kết tuyệt đối `F:/...`, banner lịch sử cho báo cáo `qa/` gốc). CV032 cần chủ dự án/kiểm provider trước khi đổi model mặc định.

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

- Git24/10: thay đổi22–24/10 đã commit local theo nhóm trên nhánh `rebuild/2026-10-local` (HEAD `28d5d8e`); `main` và baseline cũ vẫn là `bb831f240772f27ee57e4abcb83442ab0361e483`. Chưa push/merge; chỉ làm khi chủ dự án cho. Không reset/dọn; thay đổi mới commit theo nhóm khi được yêu cầu. `tmp/` (codemod một lần, ảnh scan nghiên cứu) để ngoài commit, không xóa. `.gitattributes` giữ đúng byte `migration.sql` đã áp dụng.
- Main: container `examcraft_postgres`, cổng5436, DB `examcraft`. Test: `examcraft_test_20261022`. Restore: `examcraft_restore_20261022`; cài mới kiểm migration: `examcraft_migrate_fresh_20261022`. Không nhầm bốn DB; không đụng container dự án khác `study_work_postgres`/5435.
- Kiểm24/10 sau đợt chấm tay: không có tiến trình nào nghe3117/3118/3122/3123; `examcraft_postgres` healthy. Luôn kiểm trạng thái trước chạy, không tin session ID/tool handle cũ. Dừng máy chủ dùng `.next` trước build. Máy này chưa có `pwsh`; `backup.ps1`/`restore.ps1` không dùng cú pháp riêng PowerShell7 (đọc tĩnh), chưa chạy thử bằng `powershell` 5.1 (CV073).
- Bản sao nằm trong `backups/` (không Git); bí mật DPAPI phụ thuộc hồ sơ Windows. Bí mật mã hóa key cũ chưa phù hợp production: **không xoay tùy tiện vì có thể mất khả năng giải mã key cũ**. Kế hoạch rekey/asset restore còn mở; chưa phát hành production.
- Không chép `.env`, key, cookie, mật khẩu hoặc dữ liệu thật vào hồ sơ. Ghi đường dẫn bằng chứng thay log dài. Đọc guide Next cục bộ liên quan trước sửa code.

## Cập nhật cuối lượt sau

Thay mốc/trạng thái ở file này bằng thực tế mới, giữ các việc mở hoặc chuyển chúng tới đúng CV trước khi bỏ dòng. Ghi rõ test nào mới chạy, test nào kế thừa và giới hạn. Nếu chưa chạy thì viết chưa chạy; không lấy số PASS cũ làm kết quả mới. Hồ sơ ngắn đủ nối việc; lịch sử chi tiết vẫn ở báo cáo nhóm.

Mốc cập nhật hồ sơ24/10 (sau commit local): chỉ sửa tài liệu theo log build/HTTP/SAFE đã có của đợt chấm tay và ghi phát hiện đọc tĩnh vào CV; không chạy lại build/DB/AI. Liên kết tương đối trong các tệp đã sửa được kiểm tồn tại.

Mốc chuẩn hóa hồ sơ22/10:40liên kết tương đối trong bộ mới tồn tại; bảng nhóm phủ đủ78mã không trùng/thiếu so với checklist. Dấu kiểm nội dung230tệp mã/script/test/schema/cấu hình trước–sau giống nhau. Không chạy lại test ứng dụng; các số PASS ở trên kế thừa mốc code đã dẫn.
