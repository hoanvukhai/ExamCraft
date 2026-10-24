# Trạng thái để tiếp nối

Cập nhật: **24/10/2026**. Tệp này được **viết đè** mỗi đợt theo khuôn dưới, giữ khoảng một trang. Số test, tên log và giới hạn chi tiết chỉ nằm trong báo cáo nhóm được liên kết; không chép lại ở đây. Bản trước khi viết lại: [lịch sử 02](../lich-su/TRANG_THAI_02_2026-10-24.md).

## 1. Mốc hiện tại

- **Tiến độ:** 8/78 CV đạt theo [checklist](../ke-hoach-2026-10-21/03_CHECKLIST.md); đang làm S7 (giao/làm/chấm) xen các việc còn mở của S1/S6 (lưu, quyền, cộng tác). Chưa tổng nghiệm thu.
- **Mới nhất 24/10 — chấm tay có bản nền điểm và lịch sử (CV060/061):** bản dựng, kiểm thử nền và HTTP đạt sau lần sửa mã cuối; **UI hai tab chấm cùng câu chưa chạy**, lint nhóm này chưa kết luận. [MANUAL_GRADE_CAS_AND_HISTORY](../../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md).
- **Các đợt khác cùng ngày:** giao/làm/chấm bảy dạng qua UI ([ASSIGNMENT_ACCESS_AND_STUDENT_FLOW](../../qa/rebuild-2026-10-23/ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md)); CAS nháp học sinh và chặn nộp bản cũ ([STUDENT_DRAFT_CAS](../../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md)); đọc chi tiết bài làm, chặn phản hồi muộn ([TEACHER_DETAIL_REVIEW](../../qa/rebuild-2026-10-23/TEACHER_DETAIL_REVIEW.md)); đề xuất AI bền qua tải trang và Undo/Redo Copilot ([AI_JOURNAL_AND_HISTORY](../../qa/rebuild-2026-10-23/AI_JOURNAL_AND_HISTORY.md)); chặn sai tài khoản ở Copilot/tweak/verify ([COPILOT_GUARDS](../../qa/rebuild-2026-10-23/COPILOT_GUARDS.md)).
- **Hồ sơ:** đã gọn theo kiểu một nơi cho số liệu; nhật ký theo đợt chuyển nguyên văn vào [docs/lich-su](../lich-su/README.md).
- Không gọi provider/khóa thật, không ghi DB chính.

## 2. Đã có, chưa đồng nghĩa nghiệm thu

- Bảo toàn working tree/bí mật, restore DB thử; migration đã qua bản phục hồi và cài mới rồi áp dụng DB chính, bảng ứng dụng cũ không đổi tại mốc kiểm ([main-migration.json](../../qa/rebuild-2026-10-22/main-migration.json)). Backup/restore local đạt CV072 ([OPERATIONS_REHEARSAL](../../qa/rebuild-2026-10-23/OPERATIONS_REHEARSAL.md)); chưa cutover/chuyển máy.
- Lưu server, nháp theo tài khoản/writer, phiên bản nền, giữ nháp khi xung đột; adapter bảy dạng câu, ngân hàng/fork, lịch sử/quyền, nhập dữ liệu cũ có xem trước ([CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md), [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md)). Chưa đủ ca thực tế để đóng S1.
- Soạn thủ công câu–đáp án, phần/ngữ liệu/hình, tiêu đề, mẫu cá nhân, kế hoạch mục tiêu; gói kiến thức theo phiên bản, include/exclude và liên kết từng câu. Gói minh họa là fixture giả, chưa phải nội dung chương trình chuẩn.
- Sinh AI bảy dạng và đề xuất duyệt trước khi áp dụng; BYOK + quota ứng dụng cho mọi route AI; public allowlist, cookie lượt làm có chữ ký, snapshot bài giao, chấm tay; ghi chú AI riêng tư.
- Nhập/trộn/Word/trình chiếu đã sửa và kiểm một phần; còn tài liệu phức tạp và nhiều luồng UI.

**Chưa có bằng chứng:** chất lượng AI thật và nhận/duyệt kết quả nhà cung cấp thật qua browser; offline với hai trình duyệt độc lập; Word/PDF phức tạp; gói đủ môn–lớp đã duyệt; lint toàn repo sạch; tổng nghiệm thu. Chi tiết theo nhóm: [TESTING](../../qa/rebuild-2026-10-22/TESTING.md) và báo cáo trong `qa/rebuild-2026-10-23/` (tra qua [bản đồ01](01_BAN_DO_MA_NGUON.md)).

## 3. Việc tiếp theo khi được yêu cầu tiếp tục kỹ thuật

1. **CV060/061 — khép phần chấm tay:** dựng lại server thử từ bản build hiện tại, chạy UI hai tab cùng câu theo kịch bản trong [MANUAL_GRADE_CAS_AND_HISTORY](../../qa/rebuild-2026-10-23/MANUAL_GRADE_CAS_AND_HISTORY.md), chạy lại lint nhóm chấm tới khi có log đầy đủ. API đã qua HTTP, không cần sửa nếu UI đạt. Ngoài nhóm này còn paging/khôi phục điểm từ lịch sử, đính chính đáp án/regrade, gia hạn/mở lại.
   Sau đó **CV057:** journal nháp học sinh qua đóng tab/mất điện, nhập lại JSON đã tải, hai browser độc lập, phản hồi chậm ([STUDENT_DRAFT_CAS](../../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md)).
   Fixture `learning-fixture.json` trên DB thử: exam `ex_49510788f581bb80104a8ca126057b22861cbcd0`, assignment `cmvltft9b009btbbskwkmw4e7` / public `446b557862363956ea976cc0becca19f`, đang CLOSED; lượt 1 đủ bảy dạng đã chốt điểm, lượt 2 chỉ tự luận đang chờ chấm. Không tạo lại fixture. Test-server xoay ATTEMPT_SESSION_SECRET mỗi lần khởi động nên cookie học sinh cũ không dùng lại được; đó không phải lỗi dữ liệu, không xoay secret thật.
2. **CV048:** nút lưu bản sao ở `/share/[id]` chỉ ghi vào kho cũ trên trình duyệt, không lên server. Ưu tiên trước tính năng mới vì giáo viên có thể tưởng bản sao đã nằm trong kho.
3. **CV010/011**, kết hợp **005/049/050:** offline/reload/reconnect trên React, nhiều tab đề mới → server ack, hai browser độc lập, phản hồi muộn; rà pin tài khoản cho template và toàn bộ caller. Không coi localStorage là giao dịch nguyên tử.
4. Đi hết soạn → lưu → mở → xuất, rồi mẫu có nguồn/UX. CV014/015 còn kho hợp nhất UI, câu rời có ngữ liệu, kho lớn/bộ nhớ. Gói backup mới nhất `backups/package-20261023093421079`; DB restore `examcraft_restore_package_20261023`; app phục hồi `examcraft_restore_app_20261023` có runtime config DPAPI riêng, không trỏ DB chính. Thao tác theo [runbook local](../van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md).
5. Nội dung theo sổ nguồn; tìm giáo viên/mẫu thực tế. Chưa có reviewer/ngân sách/nơi triển khai.
6. Khi được yêu cầu sửa tài liệu/vận hành: phần còn mở của CV077 (liên kết tuyệt đối `F:/…`, banner lịch sử cho báo cáo `qa/` gốc, nút `/room` 404). CV032 (model AI mặc định lệch) cần chủ dự án quyết và kiểm với provider trước khi đổi.

Thứ tự trên là đề nghị, không thay lộ trình/tiêu chí. Lỗi mất dữ liệu hoặc vượt quyền mới phát hiện được ưu tiên trước tính năng. Không tự reset engine hoặc dữ liệu dự án khác.

## 4. Bản đồ 78 CV

Trạng thái và tiêu chí nằm trong [03_CHECKLIST](../ke-hoach-2026-10-21/03_CHECKLIST.md); không đổi dấu hoàn thành hay tính phần trăm từ số file/test.

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

Các bổ sung ND01–07, nhánh ngôn ngữ/địa phương, hiệu lực nguồn/quyền tài liệu và truy vết YC–CV–NT vẫn thuộc checklist/hồ sơ08. Hàng đợi nghiên cứu có mốc lịch sử; nguồn/hiệu lực phải kiểm lại khi dùng.

## 5. Môi trường và điểm dễ làm sai

- **Git:** thay đổi từ 22/10 nằm trên nhánh local `rebuild/2026-10-local`; `main` và baseline cũ vẫn là `bb831f240772f27ee57e4abcb83442ab0361e483`. Chưa push/merge; chỉ làm khi chủ dự án cho. Commit nhỏ theo nhóm cuối mỗi đợt khi được yêu cầu; không reset/dọn. `.gitattributes` giữ đúng byte `migration.sql` đã áp dụng. `tmp/` bị ignore, giữ nguyên trên máy.
- **DB:** main là container `examcraft_postgres`, cổng 5436, DB `examcraft`. Test `examcraft_test_20261022`; restore `examcraft_restore_20261022`; cài mới kiểm migration `examcraft_migrate_fresh_20261022`. Không nhầm bốn DB; không đụng container dự án khác `study_work_postgres`/5435.
- **Server QA:** kiểm 24/10 không còn tiến trình nào nghe 3117/3118/3122/3123. Luôn kiểm trạng thái trước khi chạy, không tin session ID/tool handle cũ. Dừng máy chủ dùng `.next` trước build.
- **PowerShell:** máy chưa có `pwsh`; runbook dùng `powershell` 5.1 (CV073).
- **Tìm kiếm:** `.rgignore` loại báo cáo lịch sử, `docs/lich-su/`, `qa/` gốc, log/DOM dump `qa/rebuild-*/*.log|*.txt` và danh mục nghiên cứu lớn khỏi tìm kiếm mặc định. Cần thì chỉ rõ tệp hoặc dùng `rg --no-ignore`.
- **Bí mật:** bản sao trong `backups/` (không Git); bí mật DPAPI phụ thuộc hồ sơ Windows. Bí mật mã hóa key cũ chưa phù hợp production: **không xoay tùy tiện vì có thể mất khả năng giải mã key cũ**. Kế hoạch rekey/asset restore còn mở. Không chép `.env`, key, cookie, mật khẩu hoặc dữ liệu thật vào hồ sơ.
- Đọc guide Next cục bộ liên quan trước khi sửa code.

## 6. Cách cập nhật cuối mỗi đợt

Viết đè mục 1 và 3; các mục khác chỉ sửa khi thực tế đổi. Ghi theo mẫu: **đã sửa — đã kiểm (loại kiểm/đích/kết quả, liên kết báo cáo nhóm) — chưa kiểm/lỗi — CV còn mở — bước tiếp theo**. Số liệu và log chỉ ghi trong báo cáo nhóm; checklist ghi một dòng "Hiện trạng" cho CV liên quan; báo cáo tiến độ chỉ thêm thông báo khi có thay đổi đáng báo. Ghi rõ kiểm mới hay kế thừa; chưa chạy thì viết chưa chạy. Nội dung cũ không còn là hiện trạng chuyển sang `docs/lich-su/` hoặc để lịch sử Git, không xóa mất.
