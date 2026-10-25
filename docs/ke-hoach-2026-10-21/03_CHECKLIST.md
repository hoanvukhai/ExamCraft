# Checklist thực hiện ExamCraft

**Đầu vào mới22/10/2026:** [hồ sơ08](08_HO_SO_TRUOC_KHI_CODE.md) đã hoàn thành phần phân tích/kế hoạch trước code; không thay dấu trạng thái78CV. Thực hiện thêm các tiêu chí ràng buộc sau trong CV tương ứng:

| CV hiện có | Tiêu chí bổ sung | Ca nghiệm thu |
|---|---|---|
| CV007,016,017,021,070 | Hiệu lực tương lai TT89; source-version; draft không tự thành hiện hành | NT11,12,28; FX07 |
| CV016,017,022,070 | Raglai, NN1/NN2/trình độ, sách theo tập/nhánh; bảng161ô không bỏ các nhánh ngoài bảng | NT11,28; FX04 |
| CV021,041,065,066 | Nguồn đọc được khác quyền dùng; SBT bài mẫu khác toàn sách; không đưa sách hạn chế vào kho AI chung | NT11,28; FX10 |
| CV004,023,024,058,060 | Nhận xét/biểu diễn/thực hành, bài khảo sát không đáp án/điểm | NT theo nhiệm vụ gốc; FX05,06 |
| CV001,006,014,069,072 | Phân tích/memory và asset trong phương án xuất/backup; chạy lại migration không trùng | NT03,27; FX01,12 |

ND01–07 ở hồ sơ08 là các gói biên tập nguồn thực hiện trong CV016/017/021/022/070/071, không phải việc đã xong hoặc78CV mới. Nghiên cứu có302trang sách được mở và1876URL học liệu, chưa có nghĩa những gói nội dung này được duyệt.

Ngày: 21/10/2026. [Mục lục](00_BAT_DAU_TU_DAY.md).

**Đã bắt đầu triển khai22/10/2026; trạng thái theo từng mục và [báo cáo tiến độ](../TIEN_DO_CAI_TIEN_EXAMCRAFT.md).** Có sẵn code không đủ đánh dấu xong. Chủ trì kỹ thuật là người/AI thực hiện; chủ dự án chốt sản phẩm/chi phí, người duyệt chuyên môn ký phần nội dung.

Mã YC tra ở 01, NT tra ở 04. Mỗi CV ghi bằng chứng theo mẫu cuối file. CV có thể chia nhỏ khi làm nhưng phải giữ mã cha và không bỏ tiêu chí. Tùy chọn Drive có thể hoàn thành bước thiết kế/backlog, không được báo đã tích hợp.

## S0 — Chuẩn bị và baseline

- [x] **CV-001 — Ghi baseline và bảo toàn working tree.**
  - **Hiện trạng24/10:** thay đổi 22–24/10 đã commit local trên nhánh `rebuild/2026-10-local`; `main` giữ `bb831f2`, chưa push. `.env`, `.env.test`, `backups/` ngoài Git; `tmp/` bị ignore, giữ trên máy. Chi tiết commit/nhánh ở hồ sơ 02. Baseline21/10 dưới vẫn là bảo toàn trước rebuild, không thay nghiệm thu restore CV072.
  - Bằng chứng22/10: snapshot257tệp/hash/diff trong backups/before-rebuild-2026-10-21T22-08-28-289Z; bí mật DPAPI đã giải mã đối chiếu; inventory local/DB/tệp trong báo cáo tiến độ. Đây là bảo toàn baseline, không thay nghiệm thu restore CV072.
  - Phạm vi: YC-01, YC-24, YC-29, YC-30. Nghiệm thu: NT-01, NT-27.
  - Đạt khi: Lưu commit + diff/tệp chưa theo dõi cần thiết, danh sách dữ liệu local/DB/tệp và môi trường; không ghi bí mật vào bằng chứng, không reset thay đổi sẵn có.
- [x] **CV-002 — Chuẩn bị local và DB kiểm thử cô lập.**
  - Bằng chứng22/10: Node22.21.0/Next16.4.2/Prisma6.19.3/TypeScript5.9.3; DB `examcraft_test_20261022` tách nguồn và restorecopy; guard trước dbpush/test; fixture hai giáo viên được tạo và cleanup. [TESTING](../../qa/rebuild-2026-10-22/TESTING.md), [DB7/7](../../qa/rebuild-2026-10-22/integration_s1.json), [HTTP nghiệp vụ](../../qa/rebuild-2026-10-22/http_workflows.json) + [auth](../../qa/rebuild-2026-10-22/http_auth.json), tổng13/13. Main migration đã kiểm và áp dụng, đối chiếu số dòng/hash bảng cũ không đổi; xem main-migration.json.
  - Phạm vi: YC-24, YC-29. Nghiệm thu: NT-01, NT-27.
  - Đạt khi: Ghi phiên bản runtime/dependency và lệnh chạy đã kiểm; DB thử không trỏ DB dùng thật; có tài khoản giả và dữ liệu tái tạo được.
- [x] **CV-003 — Đánh giá lại runner, lint, build và test hiện có.**
  - Bằng chứng22/10: sửa exitcode/statistics và tách SAFE/DB/HTTP; audit AI thật và mutation cũ không dùng mặc định; fake/helper/transaction/HTTP được phân biệt trong [TESTING](../../qa/rebuild-2026-10-22/TESTING.md). Lint mới chạy theo file; chưa claim lint toàn repo. Mốc webpack25383 exit0/typecheck; SAFE20+87, realDB7/7, HTTP13/13. Build sau bổ sung đổi tài khoản được ghi riêng khi có kết quả. Đánh giá runner đã xong, không đồng nghĩa mọi CV/NT đã đạt.
  - Phạm vi: YC-29. Nghiệm thu: NT-01.
  - Đạt khi: Sửa tiêu chí báo fail/exit code khi bắt đầu code; ghi kết quả thực theo cây code, phân biệt test gọi hàm giả với code thật; không kế thừa PASS lịch sử.
- [x] **CV-004 — Dựng mẫu luồng dễ hiểu và danh mục môn.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** [MAU_LUONG_VA_DANH_MUC_MON](../thiet-ke/MAU_LUONG_VA_DANH_MUC_MON.md) mô tả theo giao diện thật các luồng tạo bài, đáp án/lời giải, khóa AI, chia sẻ và giao bài; danh mục môn–lớp sinh bằng máy từ danh mục ứng dụng dùng (xem CV022); ba cấp có ca đại diện (Tiểu học 3; THCS Toán 9, Ngữ văn 7, Tiếng Anh 8, KHTN 6; THPT Vật lí 11, Hóa học 10) và đề thử tương ứng trong `qa/ai-review/fixtures/da-mon/` (fixture_da_mon đạt). Đường dẫn tệp trong tài liệu đã kiểm tồn tại. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-04, YC-06, YC-07, YC-26, YC-27. Nghiệm thu: NT-11, NT-28.
  - Đạt khi: Có mẫu màn hình tạo bài/đáp án/key/chia sẻ, danh mục môn-lớp cần xác minh và ca đại diện ba cấp; Toán không là giới hạn.
- [x] **CV-005 — Thử nhỏ cộng tác trước thiết kế lưu chính thức.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Quyết định đồng bộ có lý do ở [COLLABORATION](../../qa/rebuild-2026-10-22/COLLABORATION.md): lưu nội dung đầy đủ kèm phiên bản (CAS), người lưu sau nhận 409 và giữ nháp, không ghép từng ký tự. Kết quả đã chạy: hai người sửa cùng lúc (`two people editing different questions never lose work, and history can restore any version`, F14), mất mạng rồi nối lại (F9, F11), hoàn tác và khôi phục (`after a restore a stale editor is refused and a refreshed editor continues; editors cannot restore`, F23), đổi cấu trúc chỉ chủ đề được làm (`share permission matrix is decided by the server for every operation`). Giới hạn: hoàn tác theo toàn đề qua lịch sử phiên bản, chưa có ngăn xếp hoàn tác riêng từng người trong phiên trực tiếp. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Truy vết24/10: quyết định đã ghi ở [COLLABORATION](../../qa/rebuild-2026-10-22/COLLABORATION.md) — nội dung đầy đủ + version CAS, kiểm thay đổi theo chu kỳ/focus; người lưu sau nhận409 và giữ nháp, chưa ghép từng ký tự. Ca hai phiên HTTP/hai tab nằm ở CV049/050. Chưa có thử offline/undo của từng người và hai browser độc lập nên giữ mở.
  - Phạm vi: YC-13, YC-19. Nghiệm thu: NT-20.
  - Đạt khi: Ghi kết quả hai người sửa, offline/reconnect, undo và đổi cấu trúc; quyết định cơ chế đồng bộ có lý do, không chỉ chọn tên thư viện.
- [x] **CV-006 — Thu thập fixture và tái lập các lỗi báo cáo.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Có mẫu phẳng/DB payload (`tests/fixtures/pilot/toan6-bay-dang.json`), đủ 7 loại câu, ngữ liệu (`mon2-ngu-lieu.json`), đề dài 120 câu (`docx_long_exam`), hình dạng mảng và dạng đối tượng (`figures stored as an array or as an object keyed by id normalize to the same list`, `an unsupported figure kind is refused instead of silently dropped`). [LOI_DA_BAO_VA_TRANG_THAI](../thiet-ke/LOI_DA_BAO_VA_TRANG_THAI.md) liệt kê 19 lỗi với trạng thái đã sửa / hiện còn / chưa tái lập và ca kiểm chứng. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-11, YC-18, YC-30. Nghiệm thu: NT-03, NT-16, NT-18.
  - Đạt khi: Mẫu local phẳng/DB payload, figures object/mảng, 7 loại câu, ngữ liệu và file dài; từng lỗi đánh dấu hiện còn/đã sửa/chưa tái lập.
- [x] **CV-007 — Chốt hợp đồng khái niệm bằng ví dụ.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** [HOP_DONG_KHAI_NIEM](../thiet-ke/HOP_DONG_KHAI_NIEM.md) ánh xạ khung dữ liệu sang model Prisma, 53 route API (máy kiểm: đủ, không thiếu), cột phiên bản (Question, Exam, bảng revision, hậu tố `.v<N>` của liên kết chia sẻ) và quy tắc điểm đến phần trăm có ví dụ điểm lẻ 0,25 (`all seven types remain independent and decimals 0.1 plus0.2 and explicit0 are exact`, `a share link stays on the version it was made from and later edits never reach it`). Không có migration chờ: DB chính và DB thử đã khớp schema. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-04, YC-07, YC-09, YC-12, YC-13, YC-25. Nghiệm thu: NT-11, NT-12.
  - Đạt khi: Khung tại 06 được ánh xạ model/API, xác định version và điểm chính xác; chưa migration khi còn xung đột nguồn lưu.

## S1 — Nền dữ liệu, quyền và chuyển đổi

- [x] **CV-008 — Chuẩn hóa hợp đồng câu/đề và adapter.**
  - Bằng chứng nền22/10: fixture đủ7dạng, points0, hình/ngữ liệu/rubric/đáp án chấp nhận/nguồn qua adapter và PostgreSQL; xử lý Decimal và metadata workspace; lỗi không hỗ trợ báo rõ. [DB7/7](../../qa/rebuild-2026-10-22/integration_s1.json), [TESTING](../../qa/rebuild-2026-10-22/TESTING.md). Không đồng nghĩa mọi nguồn cũ đều đã nhập thật.
  - Phạm vi: YC-08, YC-09, YC-10, YC-13, YC-30. Nghiệm thu: NT-02, NT-03.
  - Đạt khi: Round-trip DB/local không mất đáp án, hình, rubric, kiểu câu, nguồn; validate đầu vào và báo trường không chuyển được.
- [x] **CV-009 — Nối lưu server và trạng thái lưu thật.**
  - Bằng chứng nền22/10: browser tạo/lưu/reload và [editor-saved.png](../../qa/rebuild-2026-10-22/editor-saved.png), HTTP tạo/mở/sửa/quyền và mock lỗi409 giữ nháp; serverId tách local version. Browser phát hiện403 Origin đã được sửa và hồi quy. QA offline đầy đủ còn CV010; bổ sung chặn tab cũ đổi tài khoản đang có vòng xác minh riêng.
  - Phạm vi: YC-02, YC-13. Nghiệm thu: NT-02, NT-04.
  - Đạt khi: Tạo/sửa/mở lại trên phiên khác đúng dữ liệu; lỗi mạng/HTTP không báo đã lưu; ID server cập nhật đúng.
- [x] **CV-010 — Nháp offline, version và chống ghi đè.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Nháp phục hồi sau reload, tách tài khoản, version conflict, bản đến muộn không ghi đè: F9 (mất mạng, nối lại lưu đúng, phiên khác sửa trước thì giữ nháp thành đề riêng), F11 (tải lại hỏng khi không có mạng không mất nháp, nối lại lưu một đề duy nhất), F10 (nháp không sang tài khoản khác), http_workflows (409 bản cũ). Giới hạn: ứng dụng chưa có bản mở offline, nên mở trang mới hoàn toàn không mạng không hiển thị được (nháp vẫn giữ); hai engine sửa đồng thời chưa kiểm. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng25/10:** Đã kiểm trình duyệt mất mạng khi đang mở đề, giữ nháp trên máy, nối lại lưu đúng; nếu phiên khác sửa thì không ghi đè và lưu nháp thành đề riêng. Chrome và Edge chạy độc lập theo lượt. Giữ các kiểm nháp owner/writer/ACK trước; chưa mở ứng dụng từ đầu khi hoàn toàn offline, chưa đủ parent journal/storage lỗi/hai engine sửa đồng thời. Giữ mở. [Báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-13. Nghiệm thu: NT-04, NT-20.
  - Đạt khi: Nháp phục hồi sau reload, tách tài khoản, có version conflict; bản đến muộn không ghi đè bản mới, không đồng bộ sang sai tài khoản.
- [x] **CV-011 — Quyền đối tượng và liên kết.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Quyền folder/question/template/exam/group kiểm ở server và xét quyền cộng tác (http_workflows, http_public_policies, OBJECT_ACCESS 23/10); hai giáo viên có dữ liệu riêng. Nay có kiểm giao diện đổi tài khoản trong cùng trình duyệt: F10 — nháp trên máy của A không hiện cho B, không lưu lên máy chủ khi B đăng nhập, không tạo dữ liệu dưới B, A đăng nhập lại thì nháp phục hồi và lưu vào đề của A. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng24/10:** Giữ kiểm owner/link/C01/share đã có. C02/C03 đã tích hợp và mount: lọc namespace cả raw hỏng, gate tài khoản và ACK theo đúng ngữ cảnh; không dọn nháp từ receipt khác. Kiểm helper/render tĩnh/build/API DB thử đạt, không provider. UI đổi tài khoản mới chưa kiểm do CUA lỗi; giữ mở. [DRAFT_RECOVERY_INTEGRATION](../../qa/rebuild-2026-10-24/DRAFT_RECOVERY_INTEGRATION.md).
  - Phạm vi: YC-01, YC-19, YC-24. Nghiệm thu: NT-05, NT-06.
  - Đạt khi: Kiểm quyền folder/question/template/exam/group ở server, xét quyền cộng tác thay vì chỉ owner; thử hai giáo viên và dữ liệu riêng.
- [x] **CV-012 — Đóng các đường lộ đáp án/ghi lượt không có quyền.**
  - Bằng chứng nền22/10: allowlist/đề chia sẻ/link thực, snapshot bất biến, attempt cookie ký gắn người–bài–lượt, từ chối thiếu cookie/cross-origin; nộp lặp và chính sách ẩn đáp án được kiểm bằng helper + [HTTP](../../qa/rebuild-2026-10-22/http_workflows.json). UX và ca mở rộng tiếp ở S7.
  - Phạm vi: YC-19, YC-20, YC-21. Nghiệm thu: NT-06, NT-21.
  - Đạt khi: Rà public share và route legacy; dùng allowlist dữ liệu người làm; không dùng attemptId công khai làm quyền ghi; hoàn thiện UX tiếp ở S7.
- [x] **CV-013 — Củng cố tài khoản và bảo vệ key.**
  - **Hiện trạng24/10:** bổ sung23/10 — quản lý/test key và nhật ký usage dùng tài khoản UI đã chụp, tab cũ có phiên tài khoản mới nhận409 trước khi đọc/ghi/gọi provider; logout chỉ chuyển trang khi server xác nhận, tab cũ không logout phiên của tài khoản mới. Production/rekey vẫn là cổng riêng; không xoay bí mật DB chính. Bằng chứng: [OBJECT_ACCESS](../../qa/rebuild-2026-10-23/OBJECT_ACCESS.md), [RECOVERY](../../qa/rebuild-2026-10-23/RECOVERY.md).
  - Bằng chứng local22/10: [auth5caHTTP](../../qa/rebuild-2026-10-22/http_auth.json), helper auth và BYOK kiểm bắt đổi mật khẩu, đổi mật khẩu thu hồi phiên khác, logout, admin reset/disable/reenable không hồi sinh phiên, rate limit bền vững; secret không nằm trong JSON bằng chứng. Production/rekey vẫn là cổng riêng: không xoay khóa mã hóa cũ trước kế hoạch bảo toàn/decrypt–reencrypt và chưa triển khai production.
  - Phạm vi: YC-01, YC-03, YC-24. Nghiệm thu: NT-05, NT-09.
  - Đạt khi: Đổi mật khẩu bắt buộc ở API, đăng xuất/khóa vô hiệu phiên, rate limit phù hợp runtime; key không xuất hiện trong response/log công khai.
- [x] **CV-014 — Thử migration có mapping và chạy lặp an toàn.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Đối chiếu số lượng/nội dung/quyền, không nhân đôi, lỗi từng mục và resume: `legacy preview is read-only, import resumes per item and retries never overwrite teacher edits` (đếm đề/câu trước–sau, xem trước không ghi, cùng mã khác nội dung bị từ chối, sai tài khoản 409, sai nguồn 403, giữ điểm 0/lời giải/ngữ liệu, nhập lại không đè bản giáo viên đã sửa, archive lớn chia phần). Restore thử trước chuyển thật: diễn tập backup/restore sang DB mới (CV072, [OPERATIONS_REHEARSAL](../../qa/rebuild-2026-10-23/OPERATIONS_REHEARSAL.md)); migration từ checkout sạch ngoài repo, DB mới, deploy hai lượt, lượt hai không còn gì để áp ([MIGRATION_CLEAN_CHECKOUT](../../qa/rebuild-2026-10-25/MIGRATION_CLEAN_CHECKOUT.md)). Giới hạn: checkout sạch trên cùng máy; chưa so khác giữa các lượt nhập/tệp, UI tách biến thể và câu rời có ngữ liệu. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng24/10:** nhập dữ liệu cũ có xem trước không ghi, transaction từng tài liệu, lỗi từng mục và resume, nhập lặp không đè bản giáo viên đã sửa, tách tài khoản; giữ thứ tự/điểm0/ngữ liệu/hình/lời giải. Nguồn khác hoặc thiếu dấu SHA256 được xem trước và xác nhận thành bản sao riêng, retry không nhân đôi; API chặn cùng ID khác nội dung trong một request; advisory lock cho request đồng thời. Parser JSON/BOM/phiên bản và chia archive100đề/30MB; UI checkbox→nhập→mở, vòng tải/nhập lại ảnh khớp hash; IndexedDB thật giữ bản cũ/retry/rollback. Migration SQL lưu đúng byte trong Git (`.gitattributes`, commit `22af32b`); chưa thử checkout sạch rồi `prisma migrate status`. Còn so khác lượt/tệp, UI tách biến thể, câu rời có ngữ liệu và toàn luồng local→server. Giữ mở. Bằng chứng: [CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md), [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md), [BACKUP_LIMITS](../../qa/rebuild-2026-10-23/BACKUP_LIMITS.md), [IMPORT_UI_ROUNDTRIP](../../qa/rebuild-2026-10-23/IMPORT_UI_ROUNDTRIP.md), [IMPORT_UI_AND_IMAGES](../../qa/rebuild-2026-10-23/IMPORT_UI_AND_IMAGES.md), [LEGACY_IMPORT](../../qa/rebuild-2026-10-23/LEGACY_IMPORT.md).
  - Phạm vi: YC-24, YC-30. Nghiệm thu: NT-03, NT-27.
  - Đạt khi: Đối chiếu số lượng/nội dung/quyền, import không nhân đôi, có báo mục lỗi và resume; restore thử trước chuyển thật.
- [x] **CV-015 — Hợp nhất kho đề/ngân hàng với nguồn server.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Fork hiện trong kho cá nhân: `a shared copy lands in the recipient personal library, once, and the source library is unchanged`, `bank saves passages, forks privately and protects edit, history and soft delete with versions`. Recent/filter/star/trash/restore đúng ở máy chủ (`the personal library lists, filters, stars, trashes, restores and keeps copies per teacher`) và trên giao diện: F19 `F19 library search, starred, recent, trash, restore and safe controls` (tìm theo tên, "Đề quan trọng (Gắn sao)", "Đã sửa gần đây", "Thùng rác", khôi phục, đối chiếu DB, mở đề rồi "Về kho đề" vẫn đủ đề; ba lượt liên tiếp đạt). Không xóa dữ liệu local: `legacy local copy never overwrites an existing record and reads all libraries without changing source bytes`, `a blocked archive or mismatched document never replaces the original local draft`. Giới hạn: "Gần đây" là sắp theo lần sửa, không lọc theo số ngày. [LIBRARY_UI](../../qa/rebuild-2026-10-25/LIBRARY_UI.md), [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng24/10:** Từ 25/10 http_library kiểm trên server: danh sách/tìm kiếm/lọc môn–lớp chỉ thấy đề của chính mình, sao và thư mục (không xếp vào thư mục người khác), thùng rác cần phiên bản hiện tại, khôi phục nguyên vẹn, bản sao từ link vào kho người nhận đúng một lần. Chưa kiểm giao diện hợp nhất kho và nhóm Gần đây. đề và câu ngân hàng đối chiếu nguồn qua request sau; bản sao riêng có mã ổn định theo tài khoản/loại/nguồn/nội dung, bản giáo viên đã sửa và revision giữ nguyên. Export/xem trước đọc cả IndexedDB và3nguồn localStorage; sao chép local chỉ thêm ID thiếu, không ghi đè/xóa nguồn; ghi câu lỗi thì rollback cả đề mới. Còn UI hợp nhất đầy đủ kho/lọc/thùng rác/ngữ liệu; liên quan CV048 (bản sao từ link chia sẻ đã lưu kho server; theo bản nguồn, giữ bản sửa riêng). Giữ mở. Bằng chứng: [CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md), [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md), [LEGACY_IMPORT](../../qa/rebuild-2026-10-23/LEGACY_IMPORT.md).
  - Phạm vi: YC-02, YC-14, YC-30. Nghiệm thu: NT-02, NT-03.
  - Đạt khi: Fork hiện trong kho cá nhân, recent/filter/star/trash/restore đúng; không xóa dữ liệu local trước kiểm tra chuyển thành công.

## S2 — Giáo dục, scope và mẫu

- [x] **CV-016 — Danh mục môn/lớp và registry gói.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Danh mục 161 ô lớp–môn có tên/mã chuẩn và cấp áp dụng; môn/lớp ngoài danh mục không mượn Toán và báo "Chưa có gói lớp–môn đã duyệt; có thể tự soạn bản nháp"; mỗi ô ghi nguồn, trạng thái và việc còn thiếu (`all grades include arts and PE and unsupported subject/grade never borrows mathematics`, `every catalog subject of every grade is offered by the app and none is marked approved`, `the subject–grade table document is generated from the current catalog and lists every subject`). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-04, YC-25, YC-27. Nghiệm thu: NT-11, NT-28.
  - Đạt khi: Tên/mã chuẩn và cấp áp dụng, không alias môn sai; thiếu gói báo rõ; theo dõi các thao tác theo từng gói.
- [ ] **CV-017 — Cây kiến thức, yêu cầu cần đạt và mục lục sách.**
  - **Ngoại lệ chấp nhận 26/10 (chủ dự án ủy quyền Claude quyết):** không đóng, không tính là đạt. Cơ chế gói đã kiểm; dữ liệu Toán ba bộ sách thật do chủ dự án tự nhập qua giao diện khi cần dùng, không bịa mục lục sách. Phạm vi ngoại lệ: dự án cá nhân/nhóm nhỏ.
  - **Rà26/10 (Claude): giữ mở, đạt phần cơ chế.** Cơ chế gói đã kiểm (ID ổn định, nhiều–nhiều có nguồn/phiên bản, chặn vòng lặp, không đổi nội dung cùng revision: `package import preserves stable IDs and many-to-many book mapping, but never inherits approval`, `package rejects duplicate, missing references and cycles in knowledge, prerequisites or edition trees`, `a package revision cannot silently acquire different content`). Còn thiếu dữ liệu thật: trong kho chưa có gói Toán nào của ba bộ sách; chỉ có gói thử tự soạn. Cần chủ dự án đưa gói JSON thật (nhập qua giao diện), không bịa mục lục sách.
  - Nền kỹ thuật22/10: gói JSON có ID/phiên bản, cây + tiên quyết, mapping nhiều–nhiều theo ấn bản; chặn vòng lặp/mã thiếu và thay nội dung cùng revision. Lưu/mở bằng DB/HTTP đã kiểm; dữ liệu môn–lớp và ba bộ sách chưa biên tập/duyệt đủ nên giữ mở.
  - Phạm vi: YC-04, YC-25. Nghiệm thu: NT-11.
  - Đạt khi: ID ổn định, liên kết nhiều-nhiều có nguồn/phiên bản; Toán ba bộ sách theo gói, không dùng thứ tự bài làm ID kiến thức.
- [x] **CV-018 — Chọn phạm vi trực tiếp hoặc chat.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Chọn include/exclude/giới hạn phương pháp, loại trừ được ưu tiên, bản đề nghị chỉ là diff và không đổi phạm vi đang lưu cho tới khi nhận; thiếu bộ sách/bài thì chuyển thành câu hỏi làm rõ, nhà cung cấp không được bịa mã/bản/sách (`scope includes descendants, prioritizes exclusions and refuses stale package versions`, `scope proposal reports changes without mutating the currently saved selection`, `missing book/topic clarification has no applicable scope and unresolved proposals become questions`, `provider cannot invent IDs, revisions, implicit books or incomplete scope fields`, `accepting requires an unchanged account, exam, package, revision, local and saved scope, book and request`). Mới kiểm với AI giả, chưa đánh giá độ hiểu của AI thật. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Hiện trạng24/10:** chọn include/exclude/giới hạn phương pháp trực tiếp, xem trước/áp dụng/lưu/tải lại (loại trừ ưu tiên, không tự mở rộng tiên quyết). Chat phạm vi có API BYOK/quota, kiểm mã/revision/sách/mapping, bảng diff nhận/hủy, khóa đề nghị cũ khi đổi ngữ cảnh và hỏi làm rõ; mới kiểm bằng kết quả AI giả. Còn AI thật→lưu/mở đầy đủ và đánh giá hiểu yêu cầu/chuyên môn. Giữ mở. Bằng chứng: [SCOPE_CHAT](../../qa/rebuild-2026-10-23/SCOPE_CHAT.md), [KNOWLEDGE_SCOPE](../../qa/rebuild-2026-10-22/KNOWLEDGE_SCOPE.md).
  - Phạm vi: YC-05. Nghiệm thu: NT-12.
  - Đạt khi: Include/exclude/giới hạn phương pháp cập nhật cùng bảng scope; chat đề nghị diff, thiếu bộ sách/bài không tự đoán.
- [x] **CV-019 — Khung mức nhận thức và loại bài độc lập.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Mức nhận thức và độ khó là hai trục riêng (câu "vận dụng cao" vẫn có thể gắn mức "Biết"); câu chưa gắn mức được đếm là chưa gắn chứ không tự quy đổi; khung bốn mức cũ chỉ dùng khi giáo viên chọn; khung không đúng lớp bị bỏ; khảo sát ghi câu trả lời, không chấm đúng/sai hay điểm (`cognitive matrix requires explicit framework/level and counts essay rows without inventing outcomes`, `survey responses are recorded without correctness or a numeric score`, `non-scored survey/comment/rubric plans count questions without requiring points or cognitive levels`, `unknown/invalid cognitive levels and unknown outcome IDs cannot silently count as valid`). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-06, YC-07. Nghiệm thu: NT-11, NT-13.
  - Đạt khi: Biết–Hiểu–Vận dụng theo mẫu, khung bốn mức không tự quy đổi; tách độ khó; khảo sát ý kiến không bị ép điểm/đáp án.
- [x] **CV-020 — Kế hoạch đề, phân bổ và điểm chính xác.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Kế hoạch so từng ô với thực tế và tổng đúng 10 điểm, bảy dạng độc lập, số câu 0 hợp lệ, điểm lẻ 0,1+0,2 cộng chính xác, thiếu điểm giữ "chưa biết"; đặc tả lấy từ yêu cầu cần đạt đã nạp, ô chồng chéo bị báo mơ hồ chứ không tự gán; bảng mục tiêu/thực tế ra Word đủ bảy dạng, số câu, điểm và chênh lệch (`conceptual 4 choices +2 short +2 essay example compares every slot and exactly totals 10 points`, `all seven types remain independent and decimals 0.1 plus0.2 and explicit0 are exact`, `outcome specifications use loaded outcome text and versioned IDs, never free text guesses`, `overlapping generic and specific or multi-outcome slots stay ambiguous; no question is reassigned`, `actual Word matrix export contains all seven target types, loaded outcome, counts, points and deltas`). Giới hạn: bố cục in A4 của bảng ma trận để chủ dự án xem bằng mắt. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Đợt kế hoạch23/10: ô cá nhân7dạng/count0/điểm đơn vị0,01/outcome có phiên bản; so từng ô+tổng, báo chồng/thiếu, giữ plan lịch sử và nháp khi nền mới. Build45trang/SAFE160/HTTP16đạt; browser app nhập1ô tự luận0điểm→Apply→lưu→reload giữ đúng. Đã nối bảng mục tiêu A4/Word và kiểm XML DOCX thật5ca; SAFE165đạt, build tích hợp xuất còn đang kiểm. Giữ mở cho bố cục/xuất đầy đủ và chuyên môn. [EXAM_PLAN](../../qa/rebuild-2026-10-23/EXAM_PLAN.md).
  - Phạm vi: YC-07, YC-09. Nghiệm thu: NT-13.
  - Đạt khi: Ma trận mục tiêu và thực tế so khớp, đặc tả lấy từ outcome; số câu 0 hợp lệ; xác định tổng điểm và quy tắc làm tròn.
- [x] **CV-021 — Mẫu có nguồn và bản sao cá nhân.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Mẫu phân loại cá nhân / hệ thống chưa duyệt / cũ chưa duyệt, luôn ở trạng thái cần rà soát; nguồn tham khảo là nguồn tự khai kèm khoảng ngày, cảnh báo khi ngoài khoảng và không bao giờ xác nhận hiệu lực pháp lý; áp mẫu vào đề không đổi câu hỏi, liên kết hay điểm; mỗi lần lưu là bản riêng, sửa không đổi mẫu nguồn, độ lệch được báo (`two-teacher service scopes list/read/source access and forces immutable personal owner/status`, `applying into nonempty exam never changes questions, their links/points, or section fallback`, `empty exam copies sections with fresh IDs; stale plan refs remain readable, deviations report changes`, `source date preview includes declared bounds and outside-window warnings never certify legal applicability`, F5 lưu mẫu riêng qua giao diện). Giới hạn: không có loại "mẫu của trường" riêng (dùng nguồn tự khai). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Hiện trạng24/10:** mẫu có envelope nguồn/phiên bản, save-as-new/replay, private source và cảnh báo nguồn như đợt trước. Claude4 đã bổ sung request context/abort, lock tài khoản đổi, validate list/open/save, retryID theo body và chặn bấm đúp Apply; Codex sửa receipt/finally cũ không lock/unbusy gate mới. Unit/build/HTTP thật khớp parser và lưu/mở mẫu. UI mới còn thiếu do CUA lỗi; chưa thư viện nguồn được duyệt. Giữ mở. [TEMPLATE_IMPORT_ACCOUNT](../../qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md).
  - Phạm vi: YC-06, YC-07, YC-12, YC-25. Nghiệm thu: NT-11, NT-14.
  - Đạt khi: Mẫu hệ thống/trường/tham khảo/cá nhân rõ, ngày áp dụng/version; sửa tạo bản riêng và ghi lệch ràng buộc, không giữ nhãn phù hợp sai.
- [x] **CV-022 — Chuẩn bị dữ liệu tất cả nhóm môn.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Bảng môn–lớp sinh bằng máy từ danh mục ứng dụng dùng, có nguồn, trạng thái và việc còn thiếu cho mọi ô, người duyệt "chưa có" và test cấm đánh dấu đã duyệt; đã có đề mẫu ngoài Toán (Ngữ văn 7, Tiếng Anh 8, KHTN 6, LS-ĐL 7, Tin 8) và bộ đề thử đa môn; đã sửa mã môn sai `tieu_hoc` trong đề thử lớp 3 thành `toan` (`every catalog subject of every grade is offered by the app and none is marked approved`, `fixture_da_mon`). Giới hạn: chưa có đề mẫu THPT. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Hiện trạng26/10:** [Bảng môn–lớp](../chuong-trinh-2018/DANH_MUC_GOI_THEO_MON.md) nay sinh bằng máy (`scripts/catalog-table.cjs`) từ danh mục ứng dụng dùng: 161 ô, nguồn từng ô, môn nhận xét, gói/đề mẫu có thật, NN1/NN2/tiếng dân tộc (có Raglai), người duyệt "chưa có"; test `every catalog subject of every grade is offered by the app and none is marked approved` và `the subject–grade table document is generated from the current catalog and lists every subject`. Đề mẫu ngoài Toán: Ngữ văn 7, Tiếng Anh 8, KHTN 6, LS-ĐL 7, Tin 8; **chưa có đề mẫu THPT**; `tieu-hoc-3.json` dùng mã môn `tieu_hoc` không có trong danh mục. Chưa có sách theo tập/nhánh. Giữ mở.
  - Phạm vi: YC-04, YC-25, YC-27. Nghiệm thu: NT-28.
  - Đạt khi: Có danh mục gói/nguồn/trạng thái thiếu theo cấp; tiến hành ngoài Toán, không đánh dấu duyệt nếu chưa có reviewer.

## S3 — Bàn soạn và trải nghiệm

- [x] **CV-023 — Soạn đủ loại câu và thành phần.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** F2 soạn đủ bảy dạng bằng giao diện (ảnh, ngữ liệu, điểm 0), lưu, đóng, mở lại đúng nội dung; lỗi mất form khi lưu đề lần đầu đã sửa và F2 lặp 5 lần đạt. Sửa lựa chọn và ý đúng-sai có khóa chống thiếu/trùng/khóa lạ (`review refuses incomplete, duplicate or unknown true/false keys`); mọi trường đã sửa đều được so sánh, kể cả trường nằm trong payload (`every written question field is compared; answer fields inside payload cannot be skipped`); di chuyển và nhân bản dùng giá trị mới nhất và từ chối khi thứ tự/đề/quyền đã cũ; ghim phương án giữ nguyên; matching, ordering, fill_blank có cấu trúc riêng và khóa độc lập. Nháp từng câu giữ qua đóng/mở/tải lại/hai tab (đợt 23/10). Giới hạn: AI sinh/sửa câu chưa kiểm chuyên môn (ngoài tiêu chí); ca môn khác Toán mới kiểm bằng đề mẫu nạp và tự chấm, chưa kiểm soạn trên giao diện. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-08, YC-09. Nghiệm thu: NT-07, NT-08.
  - Đạt khi: Sửa lựa chọn/ý đúng-sai, thêm kiểu câu phù hợp, thứ tự/ghim; matching/ordering/fill_blank có cấu trúc đủ hoặc báo chưa hỗ trợ rõ.
- [x] **CV-024 — Đề, đáp án và song song.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Ba chế độ Đề/Đáp án/Song song cùng dữ liệu (F3, parallel_view, Word song song: mỗi câu cùng hàng với đáp án, ngữ liệu in một lần, `docx_long_exam` 120 câu); đáp án, lời giải, rubric tách riêng và chỉ hiện khi chọn; thiếu đáp án không tự điền (`Word solution export labels missing answers explicitly instead of inventing A or false`, `an unset answer is never presented as an answer`). In nhiều trang đã kiểm tự động (F15, đề 60 câu ra 8 trang sau khi sửa lỗi cắt còn một trang). Giới hạn: chưa mở bằng Microsoft Word và máy in thật; chủ dự án tự xem khi in cuối đợt. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-09. Nghiệm thu: NT-07, NT-08.
  - Đạt khi: Ba chế độ cùng dữ liệu; đáp án/lời giải/rubric riêng nhưng gắn version, thiếu đáp án không tự điền đúng.
- [x] **CV-025 — Lịch sử câu và kiểm định theo phiên bản.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Sửa dữ kiện/đáp án hạ câu về nháp, không ai được ghi "đã kiểm"; undo giữ toàn bộ bản trước (liên kết, ảnh, đáp án) và chỉ bị tiêu thụ khi nhận đúng; lịch sử câu và ExamRevision giữ nguyên. Lưu ngân hàng là bản sao riêng, thử lại sau mất phản hồi không tạo bản trùng. Test: `manual submission guards owner, document, edit permission, full question and source baseline`, `undo rejects another writer or changed context and is guarded again inside the current-exam updater`, `undo history is not consumed before acknowledgement; chained undo rebases only its expected after-stamp`, `bank receipt identity is scoped by owner and request, and rejects changed content`, `imported bank saves are private, nonshareable and idempotent after a lost receipt`, F23. Giới hạn: lịch sử undo/redo nằm trong bộ nhớ trình duyệt (tải lại thì mất, lịch sử phiên bản trên máy chủ vẫn còn). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Hiện trạng25/10:** Đã sửa chỉ cập nhật/lập lịch sử câu khi dữ liệu câu đổi; đọc theo lô, ghi liên kết và lịch sử theo lô, giữ toàn bộ lịch sử cũ và ExamRevision. Kiểm DB thử: lưu lặp/reorder không thêm lịch sử câu, sửa một câu, xóa trường, điểm thập phân, xóa/ghép lại, rollback, quyền và CAS từng câu đạt. Giữ Undo/Copilot guard đã có; Undo còn RAM. Lưu ngân hàng có bản sao riêng; nút nay khóa khi đang gửi hoặc câu chưa áp dụng, thông báo rõ bản sao. Chưa có idempotency khi mất biên nhận, giữ mở. [Nhóm bổ sung](../../qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md). [Báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-09, YC-13, YC-16. Nghiệm thu: NT-08, NT-15.
  - Đạt khi: Sửa dữ kiện đánh dấu cần kiểm lại, undo/redo và lưu mốc giữ liên kết; chọn lưu ngân hàng khác với lưu nháp.
- [x] **CV-026 — Hình, công thức, bảng và ngữ liệu.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Thành phần có mã (hình `figure-N`/mã riêng, ngữ liệu mã riêng) và giữ qua lưu/mở (F2, round-trip DB); hình mất dữ liệu thì xuất Word báo rõ tên hình, ngữ liệu mất liên kết báo "[Thiếu ngữ liệu liên kết: mã]"; ngữ liệu dùng chung xuất một lần phía trên nhóm câu, không nhân bản (kiểm trong Word thật: Tiểu học 3, Ngữ văn 7); hình dạng mảng và dạng đối tượng cho cùng kết quả (`figures stored as an array or as an object keyed by id normalize to the same list`); bảng biến thiên, hình ảnh và công thức hiển thị trong Word thật (xem CV043). Giữ mô hình hình học/môn khác: loại hình lạ bị từ chối rõ ràng (`an unsupported figure kind is refused instead of silently dropped`). Giới hạn: hình hình học/đồ thị hàm số nhúng như ảnh đã dựng sẵn từ trình duyệt, chưa xem từng loại trong Word; bảng viết dạng Markdown trong nội dung câu (xem CV046) nay được dựng thành bảng thật. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F2 ảnh và ngữ liệu có mã, F3 Word có ảnh/media, mã đề; unit/DB round-trip hình. Giới hạn: công thức/hình học phức tạp, Word thật, tệp mất liên kết. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - Phạm vi: YC-10. Nghiệm thu: NT-16.
  - Đạt khi: Thành phần hiển thị/biên tập có ID, mất tệp báo chỗ thiếu, ngữ liệu dùng chung không nhân bản sai; giữ mô hình hình học/môn khác.
- [x] **CV-027 — Mẫu trực quan và tùy chỉnh tiêu đề.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Sửa trường/năm/tên đề/phần chỉ hợp nhất trường đã sửa và giữ kế hoạch mới hơn (`header submission only merges edited fields and preserves newer scope/plan and unedited header metadata`); thêm/ẩn dòng, căn chỉnh, thứ tự dòng dùng chung A4 và Word (`empty override remains one visible blank line, hidden drops line, undefined uses bound value and literal order remains`, `actual Word header uses ordered shared lines, blanks, alignment, footer/year/current score and hides private answers`); lưu mẫu cá nhân (F2, `save acknowledgement must name the saved template before the notice or the list changes`); để trống không sinh trường giả (`default header omits empty school/year without invented authority, explicit empty lines roundtrip and malformed layouts reject`); thời lượng, năm, ghi chú, điểm thực kể cả 0 thống nhất (`shared header resolves current year, notes, duration and actual score including0 instead of plan targets`). UI hai tab giữ kế hoạch/tên mới, cùng trường đổi thì giữ nháp (đợt 23/10). Word đề dài 120 câu (`docx_long_exam`). Giới hạn: chưa mở bằng Microsoft Word thật để xem bố cục; nội dung mẫu hệ thống do chủ dự án tự duyệt. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-12. Nghiệm thu: NT-14, NT-18.
  - Đạt khi: Sửa trường/năm/tên đề/phần, thêm/ẩn dòng, căn chỉnh và lưu mẫu; để trống không sinh trường giả; dữ liệu thời gian/điểm thống nhất.
- [x] **CV-028 — Làm gọn quản lý và điều hướng.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Dashboard và editor là hai màn riêng (F19 mở đề rồi "Về kho đề"). F19 `F19 library search, starred, recent, trash, restore and safe controls`: bấm từng nút an toàn của trang kho (sao, thùng rác, khôi phục, xem thẻ/danh sách, sáng/tối, tải Word kiểm XML, đổi tên, nhân bản, tạo/chuyển thư mục, mở/đóng hộp khóa AI, ghi chú, ngân hàng, sinh/nhập); nút chưa làm hiện "Tính năng đang trong giai đoạn phát triển". Lỗi thật đã sửa: nút "Thêm vào đề" ở kho báo "Đã thêm" mà không chèn gì (nay "Mở đề để chèn", bị khóa); hai hộp dùng chung key React nên hộp ngân hàng không đóng ổn định (tránh modal chồng). Recent/filter/trash/restore và quay lại không mất đề: như CV015. Giới hạn: vài nút màu/đóng chưa có tên truy cập đầy đủ. [LIBRARY_UI](../../qa/rebuild-2026-10-25/LIBRARY_UI.md).
  - Đợt quản lý23/10: sửa nút thêm học sinh khớp API PATCH/newStudentNames; browser tạo lớp→thêm→reload/mở danh sách đạt, chỉ DB thử. Ngân hàng/key/folder gắn đúng tài khoản; toàn tiêu chí kho/filter/trash/điều hướng vẫn mở, xem OBJECT_ACCESS.
  - Phạm vi: YC-02, YC-26. Nghiệm thu: NT-02, NT-30.
  - Đạt khi: Tách dashboard/editor, tránh modal trùng, nút không hoạt động không giả hoàn thành; recent/filter/trash/restore và quay lại không mất đề.
- [x] **CV-029 — Dùng được khi chưa có AI và trên màn hình nhỏ.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Tạo/sửa/lưu/xuất thủ công không cần khóa AI: mọi luồng trình duyệt chạy với các đường AI bị chặn; thông báo thiếu khóa bằng tiếng Việt rõ ràng ở máy chủ. F16: mọi nút, liên kết, ô nhập của đăng nhập, kho đề, trình soạn, trang bài giao và trang học sinh có tên (một nút hiện/ẩn mật khẩu từng không có tên, đã sửa), không có tabindex dương, Tab đi qua đủ điều khiển của cả bảy dạng câu, học sinh trả lời và nộp chỉ bằng bàn phím. F13: màn hình 375px không cuộn ngang, nút ≥40px. Giới hạn: chưa kiểm viền focus nhìn thấy, chưa thử với trình đọc màn hình thật. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Đợt24/10: khôngkey vẫn sửa/Apply/lưu thật; rail mobile thành drawer/ẩn khi thu gọn. Browser360px main30,4→322,4px,390px main352,8px; document không tràn ngang, form0điểm/nút Apply hiển thị đủ. Drawer mở/đóng đạt; chưa nghiệm thu mobile keyboard/zoom/screen reader/toàn luồng xuất. Build/SAFE192đạt, xem QUESTION_DRAFTS_AND_MOBILE.
  - Phạm vi: YC-26. Nghiệm thu: NT-30.
  - Đạt khi: Tạo/sửa/lưu/xuất thủ công không bị chặn key; thông báo dễ hiểu, tab order/focus/label, cuộn trang và layout nhỏ được thử.
- [x] **CV-030 — Quyền chốt và phiên bản công bố.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Chốt bản cụ thể: link chia sẻ khóa vào phiên bản lúc tạo (http_share_pin), bài giao dùng snapshot bất biến (F5; sửa nguồn sau giao không đổi bài; sửa đáp án chỉ qua lối chấm lại có lịch sử), mỗi lần lưu có bản lịch sử và khôi phục tạo bản mới (http_collab_restore). Quyền phát hành tách khỏi sửa: người sửa không được chia sẻ, giao bài, khôi phục lịch sử hay xóa (http_permission_matrix). Mẫu cập nhật không đổi bản đã chốt: mẫu cá nhân bất biến, lưu lại cùng mã yêu cầu mà khác nội dung bị từ chối không ghi đè, áp mẫu vào đề không rỗng không đổi câu hỏi, liên kết hay điểm (`same request ID locks before lookup, replays same immutable row, and rejects changed content without overwrite`, `applying into nonempty exam never changes questions, their links/points, or section fallback`). Giới hạn: không có bước "công bố" riêng, việc chốt thể hiện qua link khóa phiên bản và snapshot giao bài. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-12, YC-13, YC-19. Nghiệm thu: NT-14, NT-20.
  - Đạt khi: Chốt bản cụ thể, quyền phát hành tách sửa; mẫu cập nhật không đổi bản đã chốt; chuẩn bị snapshot cho giao bài.

## S4 — Kết nối AI và sinh/kiểm định

- [x] **CV-031 — Thống nhất BYOK mọi endpoint.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Mười route gọi nhà cung cấp đều đi qua một hàm lấy khóa của chính người gọi và yêu cầu có người dùng đăng nhập (kiểm tĩnh `ai_endpoints_guard`: không đọc khóa dùng chung từ môi trường, không ghi khóa vào log, chỗ tạo client mới bị chặn cho tới khi duyệt, mọi route đọc kết quả AI bằng bộ đọc chung). Kiểm hành vi bằng máy chủ Gemini giả cục bộ (`http_ai_mock`, không gọi AI thật): không có khóa thì không có lần gọi nào; khóa tạm chỉ dùng cho một yêu cầu và không lưu/không lặp lại; khóa lưu dùng đúng khóa của người gọi, người khác không mượn được; nhà cung cấp lỗi thì trả lỗi thật, không dựng kết quả giả, câu AI sinh luôn ở trạng thái nháp và chưa kiểm. Giới hạn: hành vi chi tiết mới chạy thử qua route nhập đề văn bản; các route còn lại dùng chung hàm đã kiểm. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-03. Nghiệm thu: NT-09.
  - Đạt khi: Generate/tweak/OCR/Word/verify/memory đều lấy key theo người gọi và quyền dữ liệu; không fallback mock dưới nhãn kết quả AI thật.
- [x] **CV-032 — Quản lý key và sử dụng minh bạch.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Thêm, bật/tắt, đổi tên, kiểm tra, xóa khóa và chọn model (`http_ai_mock`): khóa tắt không được dùng, model đã chọn là model được gọi, mã model sai bị từ chối; người khác không sửa, kiểm tra hay xóa được khóa của bạn. Danh sách khóa và nhật ký dùng không bao giờ chứa nội dung khóa; số lần dùng đếm theo mã khóa (`user_key:<mã>`) chứ không theo tên; hạn mức là của ứng dụng và ghi rõ nguồn "application", không nhân theo số khóa (hai khóa vẫn một giới hạn) và không hứa số dư của nhà cung cấp (`providerQuota` rỗng). Kiểm tra khóa chỉ đọc danh mục model, không sinh nội dung. Giới hạn: chưa có thao tác "thay khóa" riêng (xóa rồi thêm). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-03. Nghiệm thu: NT-09, NT-10.
  - Đạt khi: Thêm/chọn/test/thay/xóa; usage theo ID không theo label; bỏ 1500*key, gói chưa xác minh ghi chưa biết; không hứa số dư thật.
- [x] **CV-033 — Hạn mức, chi phí và tác vụ nền.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Một lỗi nhà cung cấp là một yêu cầu, không vòng lặp; khóa bị giới hạn chuyển sang khóa khác của cùng người dùng; không tự đổi model hay dùng đường trả phí; giới hạn ngày của ứng dụng được ghi là của ứng dụng, không phải trần nhà cung cấp; hủy yêu cầu dài được ghi nhận và không áp kết quả muộn (`aborting a slow provider request records cancellation without saving or retrying keys`, `the application daily limit stops calls before the provider and is not described as the provider limit`, F22). Đã rà: ứng dụng không có tác vụ nền nào chạy sau khi đóng yêu cầu nên không có ngân sách nền cần kiểm. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Bằng chứng25/10:** `http_ai_mock`: một lỗi nhà cung cấp là một yêu cầu, không vòng lặp thử lại; khóa bị giới hạn tốc độ chuyển sang khóa khác của cùng người dùng và không bị tắt; lỗi dịch vụ không tắt khóa; không tự đổi model hay dùng đường trả phí; giới hạn ngày của ứng dụng chặn trước khi gọi nhà cung cấp và nói rõ là của ứng dụng. Còn thiếu: hủy yêu cầu đang chạy và tác vụ nền có ngân sách. Giữ mở.
  - Phạm vi: YC-03, YC-15. Nghiệm thu: NT-10.
  - Đạt khi: Retry/backoff giới hạn, hủy, không tự dùng paid fallback; giới hạn ứng dụng không giả là trần nhà cung cấp; tác vụ nền có quyền và ngân sách.
- [ ] **CV-034 — Sinh theo scope và kế hoạch.**
  - **Bằng chứng25/10:** `http_ai_mock` với nhà cung cấp giả: kết quả AI phải khớp kế hoạch đúng số câu từng dạng; số 0 là không tạo dạng đó (AI trả thừa bị từ chối), thiếu câu bị báo kèm tên dạng, thiếu đáp án hợp lệ hay trùng mã phương án bị từ chối, không áp dụng gì và không thử lại. Câu AI sinh không bao giờ ở trạng thái đã kiểm. Còn thiếu: sinh từng ô (slot) riêng và sửa có giới hạn, chất lượng nội dung do giáo viên đánh giá bằng khóa thật. Giữ mở.
  - Đã nối gói/phạm vi vào kế hoạch, kiểm mã AI trong tập cho phép và phiên bản; từng câu lưu provenance/cảnh báo khi gói đổi. Đã mở hợp đồng7dạng và bước duyệt trước áp dụng, giữ tiêu đề riêng/chặn bản nền cũ. Chưa gọi AI thật, chưa đánh giá chuyên môn hay phân bổ đầy đủ theo slot nên giữ mở.
  - Phạm vi: YC-05, YC-07, YC-15. Nghiệm thu: NT-12, NT-13, NT-15.
  - Đạt khi: Sinh từng slot hoặc nhóm có kiểm số lượng/điểm/kiến thức; 0 không thành mặc định, thiếu slot báo và sửa có giới hạn.
- [ ] **CV-035 — AI sửa vùng được chọn và diff.**
  - **Hiện trạng24/10:** đề xuất sửa câu và Copilot giữ preview khi bản nền đổi hoặc parent từ chối, chỉ đóng khi có xác nhận; updater so toàn nền/ngữ cảnh/quyền để giữ sửa mới; sửa giữ điểm0/hình/liên kết, thêm có ID riêng chưa điểm, bỏ đúng ID; đề xuất bền qua tải trang theo tài khoản/đề/writer, áp dụng hoặc bỏ thì cất bản đối chiếu xem/tải được. Kiểm bằng component thật và API giả, không gọi AI thật. Còn provider thật/chuyên môn và nhập đề xuất qua máy khác. Giữ mở. Bằng chứng: [COPILOT_GUARDS](../../qa/rebuild-2026-10-23/COPILOT_GUARDS.md), [QUESTION_AI_REVIEW](../../qa/rebuild-2026-10-23/QUESTION_AI_REVIEW.md), [AI_JOURNAL_AND_HISTORY](../../qa/rebuild-2026-10-23/AI_JOURNAL_AND_HISTORY.md).
  - Phạm vi: YC-08, YC-09, YC-15. Nghiệm thu: NT-08, NT-15.
  - Đạt khi: Đổi dữ kiện/câu/lời giải đúng vùng, giữ tiêu đề giáo viên đã sửa và hình liên quan; accept/reject/undo có lịch sử người yêu cầu.
- [x] **CV-036 — Validator cấu trúc và toàn đề.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Bảng "Rà soát đề" ở bàn soạn và hộp giao bài (F3: tổng điểm đúng, không lộ lời giải) kiểm đủ bảy dạng, nhãn trùng, liên kết, điểm/đáp án thiếu, đối chiếu kế hoạch; khóa đúng-sai thiếu/trùng/lạ bị từ chối (`review refuses incomplete, duplicate or unknown true/false keys`); đáp án trống, tự luận, văn xuôi giả làm phương án hay cờ mơ hồ không bao giờ khớp (`review does not match empty answers, essay, prose pretending to be a choice, or flagged ambiguity`); thiếu kết quả là "chưa kiểm" chứ không trả khớp rỗng; đề không chấm điểm không bị ép đáp án. Bộ kiểm kết quả AI (`http_ai_mock`) từ chối kết quả thừa/thiếu câu so với kế hoạch, thiếu đáp án hợp lệ hay trùng mã phương án. Giới hạn: không chứng nhận chuyên môn của nội dung. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-07, YC-09, YC-16. Nghiệm thu: NT-13, NT-15.
  - Đạt khi: Đủ khóa ý đúng-sai, nhãn duy nhất, tổng điểm/phân bổ, liên kết tệp; thiếu kết quả là chưa kiểm, không trả khớp rỗng.
- [ ] **CV-037 — Kiểm nội dung theo loại môn.**
  - Bổ sung24/10: kết quả verify chỉ hiện khi toàn câu và ngữ cảnh còn đúng; đổi phạm vi trong/sau phản hồi thì ẩn kết quả cũ và báo cần rà lại. Browser actual component/phản hồi giả đạt, không tự cấp verified; chưa kiểm chất lượng nhà cung cấp/chuyên môn. Xem QUESTION_AI_REVIEW.
  - Phạm vi: YC-09, YC-16, YC-27. Nghiệm thu: NT-15, NT-28.
  - Đạt khi: Công cụ toán kiểm phần được hỗ trợ, đơn vị/điều kiện, nhiều đáp án, rubric; AI đồng thuận không tương đương giáo viên duyệt.
- [ ] **CV-038 — Lưu vết AI và bộ đánh giá riêng.**
  - Phạm vi: YC-15, YC-16, YC-23. Nghiệm thu: NT-15, NT-26.
  - Đạt khi: Model/prompt/data version và kết quả, log không chứa bí mật; tập nghiệm thu tách ví dụ truy xuất; không tự fine-tune sau mỗi đề.

## S5 — Nhập, trộn, xuất và trình chiếu

- [x] **CV-039 — Nhập text/LaTeX và xem trước hai phía.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Nguồn được giữ, câu tách rõ, phần không hiểu có nhãn; xem trước sửa được từng câu trước khi nhập và sửa này còn sau lưu và mở lại (F17 nhập văn bản không cần khóa AI, F20); đáp án chỉ lấy khi văn bản ghi rõ, thiếu thì để trống có nhãn, không tự giải (`explicit numeric answer lines are kept out of student content, including zero and fractions`, `exam_parser`, `exam_parser_cases`, `ex_test_cases`). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Bằng chứng25/10:** đường nhập bằng văn bản không AI (dự phòng khi AI lỗi hoặc chưa có khóa) đã có test và sửa nhiều lỗi thật. `exam_parser` và `exam_parser_cases` (28 ca của bảng Gemini): mỗi phương án một dòng trước đây không nhận ra; "tam giác ABC." bị cắt nhầm; "câu 2" giữa câu bị tách; nay hiểu "Đáp án: B", bảng đáp án cuối đề, số trần "1)", thẻ [1,0 điểm] [TH], đúng-sai nhóm a) b) c) d), ngữ liệu đứng đầu đề (trả về và gắn vào câu, không còn bị bỏ mất). `ex_test_parser` và `ex_test_cases` (22 ca của bảng Gemini): không còn tự điền đáp án A khi thiếu `\True`, đề 2–3 phương án không mất phương án; `\immini{...}{hình}` giữ chữ và phương án, bỏ vỏ, ghi chú "cần chèn lại hình" thay vì mất hình lặng lẽ; `\shortans{3}` thành đáp án; `\heva`/`\hoac` thành `cases` để KaTeX đọc được. F17: nhập từ văn bản khi chưa có khóa AI đi trọn vòng trên giao diện. Codex R3 (26/10): xem trước hai phía có nguồn bên trái, thẻ câu bên phải và nút Xóa, nhưng **chưa sửa được nội dung/đáp án trong xem trước** ([IMPORT_PREVIEW](../../qa/rebuild-2026-10-25/IMPORT_PREVIEW.md)). Giới hạn: dạng điền khuyết, nối cột, sắp xếp từ văn bản chưa hỗ trợ (đang soạn mẫu để quyết); nhập Word/ảnh bằng AI chưa kiểm.
  - **Hiện trạng24/10:** giữ nguồn và preview theo loại đầu vào; Word/ảnh/text AI nay gửi pin chủ tài khoản, server chặn sai tài khoản trước body/provider. Modal guard phản hồi/tệp cũ theo đích; lỗi cùng nguồn giữ preview, xác nhận nhập kiểm lại user và callback editor chỉ append đúng đề có quyền. Build/HTTP/kiểm thuần đạt; chưa UI mới/AI thật/chất lượng đa môn và import form bền qua reload. Giữ mở. [TEMPLATE_IMPORT_ACCOUNT](../../qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md).
  - Phạm vi: YC-11. Nghiệm thu: NT-16.
  - Đạt khi: Nguồn giữ được, câu tách rõ, phần không hiểu có nhãn; sửa trước lưu, không tự giải giả thành đáp án trích nguồn.
- [ ] **CV-040 — Nhập Word/ảnh và xử lý tài liệu dài.**
  - **Hiện trạng24/10:** bổ sung pin/abort/context guard cho nhập Word và ảnh, dùng cùng quy tắc xác nhận riêng với text; request stale-account/body hỏng chặn trước đọc tệp/khóa/provider. Không gọi AI thật trong kiểm đợt này. Chưa xác nhận UI mới, Word/ảnh dài/phức tạp, kết quả OCR chuyên môn, mọi loại tài liệu. Giữ mở. [TEMPLATE_IMPORT_ACCOUNT](../../qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md).
  - Phạm vi: YC-10, YC-11. Nghiệm thu: NT-16.
  - Đạt khi: Giữ hình/công thức/đoạn liên quan, thông báo cắt/thiếu, chia lô có thứ tự và chống trùng; OCR không đặt true mặc định.
- [x] **CV-041 — Quyền và nguồn nhập.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Mỗi câu nhập ghi nguồn gồm loại, tên tệp và số câu; câu nhập luôn riêng tư, không chia sẻ được và không tự vào kho chung; không có bước xóa câu "gần giống" nên biến thể khác một con số không bị mất (`import source keeps per-question attribution and only adds known filename and ordinal`, `explicit provenance survives normalization and private persistence even with untrusted sharing fields`, `EX_Test near variants are not deduplicated by a changed number`). Giới hạn: không ghi số trang (Word không có trang cố định); nhập lại cùng nội dung sẽ thành câu mới, chưa cảnh báo trùng. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Hiện trạng26/10:** Codex R6 đọc mã và thêm test (`EX_Test near variants are not deduplicated by a changed number`, `Word and text import adapters label their source and retain near variants without promoting verification`): biến thể khác số được giữ, không có dedup gần giống; câu nhập luôn PRIVATE, không tự vào kho chung; đã sửa lộ "Đáp án: 13" trong nội dung câu. Còn thiếu: nguồn chỉ là nhãn chung "Văn bản nhập"/"Word (.docx)", chưa ghi tên tệp/câu, adapter ghi đè nguồn từng câu; `shareable` mặc định true với câu nhập Word/văn bản. Giữ mở. [IMPORT_SOURCES](../../qa/rebuild-2026-10-25/IMPORT_SOURCES.md).
  - Phạm vi: YC-11, YC-25. Nghiệm thu: NT-16, NT-26.
  - Đạt khi: Ghi nguồn/trang/câu, dedup không xóa nhầm biến thể; tài liệu không rõ quyền ở kho riêng, không tự đưa vào kho chung.
- [x] **CV-042 — Trộn câu, lựa chọn và nhóm ngữ liệu.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Seed tái lập, ghim, phương án phụ thuộc và trùng chữ giữ nguyên thứ tự, mọi loại câu giữ đủ, thiếu đáp án không tự điền: shuffle_variants (7 ca) và answer_review_and_shuffle; chữ đáp án đúng luôn trỏ đúng nội dung qua 40 seed; lời giải theo đổi chữ của cả phương án đúng lẫn sai trong một lượt, không chạm chữ hình học như "tam giác ABC" (đã sửa lỗi cũ chỉ đổi phương án đúng và không khớp cụm bắt đầu bằng "đ"); trộn mã đề qua giao diện ở F3. Theo quyết định của chủ dự án 25/10: mã đề đảo cả thứ tự câu trong từng phần, nhóm ngữ liệu đi nguyên khối (`question_order`), áp dụng cho cả mã đề in và trộn theo từng học sinh khi giao bài. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-17. Nghiệm thu: NT-17.
  - Đạt khi: Seed tái lập, ghim và mọi loại câu giữ đủ; ID đáp án đúng sau đảo; không thay chữ cái bằng regex làm hỏng lời giải.
- [x] **CV-043 — Xuất Word và công thức/hình.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Đã mở bằng Microsoft Word thật (bản cài trên máy, điều khiển bằng tự động hóa) 27 tệp xuất từ 9 đề đa môn × 3 kiểu (đề, đáp án, song song) và 2 tệp có hình/bảng biến thiên: tất cả mở được, đếm được 20–36 phương trình Word thật mỗi đề Toán/Lý/Hóa/KHTN/Tin, ảnh chèn đúng tỷ lệ kèm chú thích, bảng ghép nối và kiểu Song song hai cột đúng, ngữ liệu dùng chung hiện một lần, đủ câu và điểm. Đã xem ảnh trang do Word dựng (Toán 9, Vật lí 11, Hóa 10, Tiểu học 3, Tin 8, hình + bảng biến thiên). Phát hiện và sửa lỗi thật: xuống dòng trong ngữ liệu và nội dung câu bị gộp thành một dòng (bài thơ, mã Python); nay giữ từng dòng (`lines of a shared passage and of a question stay on separate lines in Word`; test này rớt khi bỏ bản sửa). Hình thiếu dữ liệu: xuất báo lỗi có nhãn nêu tên hình thay vì tệp hỏng; ngữ liệu thiếu hiện "[Thiếu ngữ liệu liên kết]" (`a 120-question exam exports to Word in order, with passages once, images present and formulas converted`, `portable_and_exports`, `latex_math`, `fixture_da_mon`). Giới hạn: bảng biến thiên trong Word được tóm gọn (dấu và mũi tên gộp một ô, chưa dóng cột theo từng khoảng); công thức hóa học hiện chữ nghiêng kiểu toán; một dòng tiêu đề bảng ghép nối có thể nằm cuối trang trước; công thức trong lời giải chỉ là phương trình khi nội dung viết bằng `$...$`; chưa kiểm bản in thật ra giấy. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F3 Word bàn soạn, 4 mã và Song song (ZIP/XML/media); unit portable_and_exports. Giới hạn: chưa mở trực quan bằng Microsoft Word, công thức/tài liệu dài Từ 25/10: công thức nay thành phương trình Word thật (phân số lồng, căn bậc n, chỉ số trên/dưới, tổng, giới hạn, tích phân, hàm lượng giác, ký hiệu tập hợp) thay cho chữ thô như `x^2`, `\sum`, `\sin`; kiểm bằng latex_math và docx_long_exam (đề 120 câu có ảnh, ngữ liệu dùng chung in một lần, đáp án cùng hàng) — **chưa mở bằng Microsoft Word thật** nên chưa biết hiển thị trực quan. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - **Hiện trạng25/10:** Word Song song đã xuất hai cột, giữ thứ tự câu/đáp án và ngữ liệu chung một lần; thu ảnh đúng tỷ lệ, ngữ liệu toán dùng công thức Word. Kiểm ZIP/XML đạt; chưa kiểm trực quan Word dài, phân trang hoặc bản in. Giữ các bằng chứng xuất/trộn trước; CV mở. [Báo cáo nhóm](../../qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md).
  - Phạm vi: YC-12, YC-18. Nghiệm thu: NT-18.
  - Đạt khi: Tài liệu mở sửa được, đủ câu/hình/điểm/nguồn hiển thị, fallback có nhãn; kiểm công thức và ngắt trang trực quan.
- [ ] **CV-044 — In/PDF và các biến thể xuất.**
  - **Bằng chứng25/10:** lỗi thật đã sửa: in từ trình soạn chỉ ra **một trang** (ba lớp bọc cố định chiều cao cắt nội dung); nay đề 60 câu ra nhiều trang. Luồng F15 đo bằng trình duyệt: mọi câu nằm trong tờ in, không câu nào bị chia đôi hay cao hơn một trang, không tràn lề phải, nút soạn thảo ẩn khi in, PDF A4 nhiều trang. Giới hạn: chưa xem bằng mắt; ngắt trang giữa câu và ngữ liệu dùng chung dựa vào CSS, chưa so với máy in thật.
  - Phạm vi: YC-12, YC-18. Nghiệm thu: NT-18.
  - Đạt khi: Đề/đáp án/lời giải/ma trận riêng hoặc chung, 1–2 cột khi phù hợp, tiêu đề mẫu đồng nhất; câu dài được ngắt có kiểm soát, không tràn/mất.
- [x] **CV-045 — Trình chiếu để chữa bài.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** F18 trên trình duyệt: mở trình chiếu thì đáp án ẩn; phím mũi tên chuyển câu và chọn câu bằng ô chọn; "Hiện đáp án / lời giải" hiện lời giải theo yêu cầu và chuyển câu thì ẩn lại; nút chữ lớn/nhỏ phóng thu theo từng bước; Esc đóng; sau khi trình chiếu, phiên bản, tên đề và số câu không đổi. Giới hạn: lời giải hiện một lần, chưa chia từng bước nhỏ trong một lời giải. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-18. Nghiệm thu: NT-19.
  - Đạt khi: Phóng to câu, hiện dần lời giải, ẩn đáp án ban đầu, điều khiển bàn phím; không làm đổi nội dung đề.
- [x] **CV-046 — Bộ fixture đa môn cho nhập/xuất.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Chín đề đa môn (Toán 9, Ngữ văn 7, Tiếng Anh 8, KHTN 6, LS-ĐL 7, Tin 8, Tiểu học 3, Vật lí 11, Hóa 10) nạp được, tự chấm đúng, xuất Word đủ ba kiểu (`fixture_da_mon`), và 27 tệp Word đã mở bằng Word thật. Công thức Toán/Lý/Hóa/Tin là phương trình Word; ngữ liệu dài và bài thơ giữ từng dòng; hình có chú thích; câu tiểu học đúng. Bảng số liệu: đề Tin 8 viết bảng Markdown, nay ứng dụng dựng thành bảng thật ở web, in và Word, công thức trong ô vẫn là phương trình (`a pipe table inside question text becomes a table block between two text blocks`, `a pipe table in question text is shown as a real table with formulas, and plain text is unchanged`, `a pipe table in a question, a passage or a solution becomes a real Word table with its formulas`). Ảnh kiểm trang Word: [anh-kiem-word](../../qa/rebuild-2026-10-25/anh-kiem-word/) (6 ảnh); tạo lại tệp xuất bằng `node --import tsx scripts/export-fixtures-docx.ts`. Giới hạn: không có mẫu bản đồ riêng (bản đồ dùng đường hình ảnh đã kiểm); chỉ xem trang đầu của sáu tệp, các tệp còn lại chỉ kiểm tự động và đếm phương trình/bảng trong Word. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-10, YC-18, YC-27. Nghiệm thu: NT-16, NT-18, NT-28.
  - Đạt khi: Công thức Toán/Lý/Hóa, ngữ liệu dài, bảng số liệu/bản đồ, hình, câu tiểu học; tất cả kết quả gắn file xuất và ảnh kiểm.

## S6 — Chia sẻ và cộng tác

- [x] **CV-047 — Ma trận quyền chia sẻ.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi" (theo điều chỉnh đã duyệt).** Ma trận quyền kiểm ở server cho từng thao tác bằng tài khoản thật: http_permission_matrix (mặc định riêng tư, người lạ và khách không thấy/không sửa; người xem chỉ đọc; người góp ý chỉ bình luận; người sửa đổi nội dung nhưng không đổi thư mục/mẫu/cấu hình; chỉ chủ đề quản lý thành viên, khôi phục lịch sử, chia sẻ, giao bài, xóa; link công khai không cấp quyền sửa và không lộ đáp án; sao chép cần chủ đề cho phép và giáo viên đã đăng nhập). Điều chỉnh đã duyệt 25/10: "tải" không có quyền riêng, việc xuất Word/JSON chạy ở trình duyệt từ nội dung người đó đã được phép đọc, nên quyền tải bằng quyền xem; "fork" là quyền cho sao chép của link. Giới hạn: không thể cấm người đã được xem chụp/chép nội dung. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-14, YC-19. Nghiệm thu: NT-06, NT-20.
  - Đạt khi: View/comment/edit/download/fork/publish phân biệt, mặc định private; public view không cấp edit/key; server kiểm từng thao tác.
- [x] **CV-048 — Link xem, thu hồi và phiên bản chia sẻ.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi" (theo điều chỉnh đã duyệt).** Link có token riêng, chính sách đáp án, hết hạn, thu hồi (http_workflows, http_public_policies). Từ 25/10 link khóa vào phiên bản đề lúc tạo (token mang hậu tố phiên bản, không đổi schema): http_share_pin — sửa đề sau đó không đổi gì ở link cũ, link mới thấy bản mới, đổi/bỏ hậu tố thì không mở được, phiên bản không đọc được thì đóng thay vì hiện bản nháp, sao chép đúng phiên bản của link. Giới hạn: link tạo trước 25/10 vẫn theo đề đang sửa; ảnh lưu ngoài kho chưa kiểm; giao diện chia sẻ chưa ghi chú "link giữ bản hiện tại". [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-19. Nghiệm thu: NT-06, NT-20.
  - Đạt khi: Link dùng ID/quyền riêng, chính sách đáp án, hết hạn/thu hồi; bản công bố không vô tình trỏ nháp.
- [x] **CV-049 — Cùng sửa đồng thời.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi" (theo điều chỉnh đã duyệt).** Hai người sửa các khối khác nhau từ cùng nền: một thắng, một bị từ chối nguyên vẹn, không áp dụng nửa chừng, tải lại rồi áp dụng lại thì có cả hai công việc (http_collab_restore); thay cấu trúc/reorder đối đầu: http_workflows "structural edits conflict without partial merges…"; khôi phục từ lịch sử là phiên bản mới, không mất lịch sử, bản khôi phục không bị bản cũ ghi đè, người sửa không có quyền khôi phục; F4 và F9 trên trình duyệt. Điều chỉnh đã duyệt 25/10: "undo từng người" thay bằng khôi phục từ lịch sử phiên bản. Từ 25/10 có thêm F14: hai giáo viên trên hai ngữ cảnh trình duyệt cùng sửa, người lưu trước thắng, người kia giữ nháp và lưu thành đề riêng. Giới hạn: chưa có hoàn tác riêng từng người trong thời gian thực. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-19. Nghiệm thu: NT-20.
  - Đạt khi: Sửa khác/cùng khối, thay cấu trúc câu, reorder, undo từng người; không last-write-wins mất dữ liệu.
- [x] **CV-050 — Mất mạng, reconnect và thu hồi quyền đang mở.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Đồng bộ không nhân đôi/mất: F9 (Chrome và Edge) và http_workflows "structural edits conflict without partial merges and revoked writers cannot retry". Quyền kiểm lại khi gửi, editor bị thu hồi không ghi: "collaboration honors view, edit, CAS, history and revocation" và F4. Giới hạn: hai engine sửa đồng thời, mở ứng dụng từ đầu khi hoàn toàn offline. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng25/10:** Giữ các kiểm hồi đáp trễ, owner/writer/ACK và thu hồi quyền trước. Browser thêm mất mạng, reconnect khi có phiên khác sửa, giữ bản máy chủ và cất nháp thành bản phục hồi; Chrome/Edge kiểm độc lập theo lượt. F4 còn kiểm thu hồi editor đang mở. Chưa hai engine sửa đồng thời hoặc mọi race quyền/ghi; giữ mở. [Báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-13, YC-19. Nghiệm thu: NT-20.
  - Đạt khi: Đồng bộ không nhân đôi/mất, quyền kiểm lại khi gửi thay đổi; editor bị thu hồi không tiếp tục ghi.
- [x] **CV-051 — Góp ý và lịch sử tác giả.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Góp ý gắn với câu (chọn trong hộp thoại cộng tác, câu không có trong đề bị từ chối) và ghi phiên bản đề lúc viết; có trạng thái đã giải quyết/mở lại, ghi người giải quyết; chỉ người sửa đề hoặc chính người viết được đóng/mở, người xem 403, người ngoài 404. Lịch sử hiện người lưu từng phiên bản; khôi phục tạo phiên bản mới, không xóa lịch sử (`share permission matrix is decided by the server for every operation` ca mới `comments record question and version, and only editors or the writer can resolve them`; `two people editing different questions never lose work, and history can restore any version`). Thay đổi do AI đi qua lần lưu của người bấm nên được ghi tên người đó (F21 dùng khóa riêng). Đã thêm 3 cột vào `ExamComment` (migration `20261026000100`, đã áp lên DB chính sau khi sao lưu). Giới hạn: giao diện đã có luồng trình duyệt F24 (gồm quyền người xem/người góp ý và người bị hạ quyền); chủ dự án vẫn có thể xem bằng mắt; góp ý cũ không có số phiên bản. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-19. Nghiệm thu: NT-20.
  - Đạt khi: Bình luận theo câu/phiên bản, giải quyết góp ý, xem ai đổi gì, phục hồi không xóa lịch sử; AI action gắn người yêu cầu.
- [x] **CV-052 — Ngân hàng chung và nhân bản.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Bản sao nhận độ trôi phiên bản riêng, giữ nguồn gốc mà không sao chép định danh máy chủ (`versioned copies keep legacy identity and separate source revisions without copying server identity`); sửa bản sao không đổi bản gốc (`share copy does not mutate its source`, test thu hồi liên kết: bản sao đã nhận vẫn mở được và sửa nó không đổi đề gốc, trong `revoking still works for a pinned link and the copy is the pinned version`); bản sao vào thư viện người nhận đúng một lần (`a shared copy lands in the recipient personal library, once, and the source library is unchanged`); dùng lại được kiểm quyền (`fork rejects unavailable, private, unlicensed and foreign private passages`). Giới hạn: phạm vi nhóm nhỏ, chưa có kho công khai cho nhiều người. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-14. Nghiệm thu: NT-06, NT-07.
  - Đạt khi: Tác giả/origin/version giữ đúng, sửa bản sao không đổi gốc, gỡ chia sẻ không phá bản sao hợp lệ; quyền dùng lại được kiểm.
- [x] **CV-053 — AI trong phiên cộng tác.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Người cộng tác bấm AI thì dùng khóa của chính họ, khóa chủ đề không bị dùng hay lộ; kết quả AI được so phiên bản hiện tại, không ghi đè phần sửa mới của chủ đề (F21 với nhà cung cấp giả; `AI routes use only the caller key, count usage per key id, fail honestly and never leak or invent`, `two people editing different questions never lose work, and history can restore any version`). Chưa gọi AI thật. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-03, YC-19. Nghiệm thu: NT-09, NT-20.
  - Đạt khi: Người bấm dùng key của mình; không lộ key chủ đề; kết quả AI so version hiện tại trước apply, không ghi đè sửa mới của đồng nghiệp.

## S7 — Giao bài, làm và chấm

- [x] **CV-054 — Cấu hình bài giao và snapshot.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Enum/API/tùy chọn thống nhất và kiểm giá trị sai (http_assignment_options: giờ mở/đóng, số lượt, mã vào bài, PIN, trộn). Snapshot đủ câu, đáp án, điểm, mẫu và bất biến: F5 sửa câu nguồn sau khi giao rồi so snapshot hai bài không đổi; sửa đáp án sau giao chỉ qua lối chấm lại có lịch sử (`regrade`), không đổi ngầm. Giới hạn: chưa có giao diện đổi thời hạn sau khi giao (đổi qua API). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-20. Nghiệm thu: NT-21.
  - Đạt khi: Enum/API/import thống nhất, nhóm tùy chọn đúng nhận diện; snapshot đủ câu/đáp án/tệp/điểm/mẫu và bất biến.
- [x] **CV-055 — Nhận diện và phiên lượt làm.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** FREE_NAME, danh sách, mã vào bài, PIN và link cá nhân kiểm ở máy chủ: http_assignment_options (mã) và http_student_identity (PIN thiếu/sai/chưa đặt, học sinh lớp khác, token sai/của lớp khác, ID không thay token; refusal không tạo lượt). Người biết ID không đọc/sửa/nộp bài khác: public_access "attempt token binds attempt, student, assignment and creation time", http_public_policies "capabilities cannot cross attempts". Giới hạn: PIN do giáo viên đặt ở quản lý lớp. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-20, YC-21. Nghiệm thu: NT-21, NT-22.
  - Đạt khi: FREE_NAME/danh sách/mã có kiểm server, membership và PIN nếu bật; người biết ID không được đọc/sửa/nộp bài khác.
- [x] **CV-056 — Thời gian, số lượt và cạnh tranh start.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** opensAt/closesAt/deadline/status và số lượt kiểm ở máy chủ (http_assignment_options, http_public_policies, F5 chờ qua giờ đóng thật rồi học sinh bị từ chối, không tạo lượt); đóng sớm/mở lại/gia hạn giữ hạn của lượt đã bắt đầu (http_assignment_window); bắt đầu đồng thời không tạo trùng hay lỗi unique vô nghĩa: 80 lượt tranh nhau cho 40 học sinh đúng 40 lượt, một học sinh hai máy chỉ một lượt (Codex Q3) và tải 40 học sinh không lỗi 5xx; lỗi 503 khi bắt đầu/nộp đồng thời đã sửa. Giới hạn: một máy, chưa nhiều máy vật lý. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-20, YC-21. Nghiệm thu: NT-22.
  - Đạt khi: Kiểm opensAt/closesAt/deadline/status, lượt hết hạn xử lý rõ; start đồng thời không tạo trùng hoặc lỗi unique vô nghĩa.
- [x] **CV-057 — Lưu nháp và resume thật.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Kiểm res.ok và trạng thái mạng: student_network (4 ca). Reload lấy đúng nháp và bản chậm không ghi đè: http_workflows (hai nháp tranh nhau, bản cũ 409), attempt_draft_revision, student_draft_journal, F6. Giới hạn: đổi sang thiết bị khác, hai trình duyệt độc lập. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng24/10:** journal riêng từng trang, giữ nhiều bản/raw hỏng/nhập JSON chỉ xem-chọn và không rebase; tự nộp khi conflict chỉ dùng draft máy chủ. Thêm timeout bao gửi/đọc body, lỗi nộp có retry và tải bản dự phòng ngoài vùng khóa khi hết giờ; mobile thấy trạng thái lưu. Build/SAFE/HTTP thử đạt. UI mới, offline thật/hai browser/đổi máy/late ACK chưa kiểm do CUA lỗi. Không đóng CV. [RESTORE_NETWORK_SHARE](../../qa/rebuild-2026-10-24/RESTORE_NETWORK_SHARE.md).
  - Phạm vi: YC-21. Nghiệm thu: NT-04, NT-23.
  - Đạt khi: Method/body chuẩn, kiểm res.ok, trạng thái mạng; reload lấy đúng nháp, không ghi đè câu mới bởi request chậm.
- [x] **CV-058 — Giao diện làm bài đủ dạng.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi" (theo điều chỉnh đã duyệt).** Tự luận có ô trả lời, đúng-sai, điền, ghép, sắp xếp làm được và nộp được: F6 làm đủ bảy dạng, tải lại làm tiếp, nộp, không thấy đáp án trước chính sách; public_access, structured_grading. Hình của câu hiển thị thật cho học sinh (F16). Cuộn/bàn phím/điện thoại: F13 (375px không cuộn ngang, nút ≥40px, đã sửa nút ĐÚNG/SAI quá nhỏ); F16 (học sinh trả lời và nộp chỉ bằng bàn phím, Tab đi qua đủ điều khiển của bảy dạng câu). Điều chỉnh đã duyệt 25/10: bỏ "tệp" và "âm thanh theo đề" khỏi tiêu chí vì mô hình đề không có và chủ dự án không cần. Giới hạn: chưa thử với bàn phím ảo của điện thoại thật; chưa kiểm viền focus. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-10, YC-21. Nghiệm thu: NT-16, NT-23.
  - Đạt khi: Tự luận có ô trả lời, đúng-sai/điền/ghép/sắp xếp dùng được, hình theo đề; cuộn/keyboard/mobile đúng. (Đã bỏ "tệp/âm thanh" theo chủ dự án 25/10/2026.)
- [x] **CV-059 — Chấm server và nộp lặp an toàn.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Zero/false/blank phân biệt và đáp án thiếu không nhận blank đúng: public_access, structured_grading, manual_grading (accepted_answers theo câu). Nộp đồng thời một kết quả: http_student_identity (đã tìm và sửa lỗi 503 do P2010/40001). Điểm đúng chính sách ở mọi nhánh: http_public_policies. Giới hạn: biểu thức tương đương chỉ qua danh sách đáp án chấp nhận của từng câu. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng24/10:** giữ CAS/row-lock/retry nộp an toàn và response/snapshot. Đã sửa submit lưu tổng null cho survey/comment_only/rubric thay vì0 giả; bài scored tổng/tối đa0 vẫn giữ0. HTTP kiểm GET và submit lặp theo chính sách hiện tại, không sửa bài đã nộp. Nhánh student/group lưu trữ chặn cả nộp lặp. Chưa tổng nghiệm thu mọi dạng/UI, giữ mở. [PUBLIC_POLICIES_AND_NONNUMERIC](../../qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md).
  - Phạm vi: YC-09, YC-21, YC-22. Nghiệm thu: NT-24.
  - Đạt khi: Zero/false/blank phân biệt, số/biểu thức theo câu, đáp án thiếu không nhận blank đúng; submit đồng thời một kết quả, trả điểm đúng chính sách ở mọi nhánh.
- [x] **CV-060 — Chấm tay, đính chính và điểm chốt.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi" (theo điều chỉnh đã duyệt).** Tự luận chờ chấm, điểm/nhận xét có lịch sử và khôi phục (CAS, F7, http_workflows). Chấm lại có phạm vi và phiên bản: sửa đáp án đúng của một câu tự chấm (trắc nghiệm một đáp án, trả lời ngắn, điền khuyết) trong bản đề đã giao, có xem trước, lý do bắt buộc, lịch sử sửa theo câu, bài đã chấm tay giữ nguyên, mỗi bài đổi điểm có sự kiện lịch sử chấm, chặn ghi đè khi phiên bản đáp án đã cũ, bài đang làm không bị đụng, bài nộp sau đó chấm theo đáp án mới, học sinh không thấy dữ liệu sửa (http_regrade, answer_correction, F12). Bài cũ không đổi ngầm khi sửa ngân hàng vì dùng snapshot lúc giao. Giới hạn: câu ghép, sắp xếp, đúng-sai nhóm và tự luận chấm tay; chưa chấm lại hàng loạt theo rubric mới. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-22. Nghiệm thu: NT-24, NT-25.
  - Đạt khi: Tự luận pending, chỉnh rubric/điểm có lịch sử, regrade có phạm vi/phiên bản; bài cũ không đổi ngầm khi sửa ngân hàng.
- [x] **CV-061 — Theo dõi, phản hồi và bảng điểm.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Danh sách bài/lượt, tiến độ, chấm và CSV có nhận xét (F7, http_workflows); đóng sớm/mở lại/gia hạn có quyền chủ bài (http_assignment_window), người khác không đổi được; thống kê và phổ điểm ở trang bài giao; bảng xếp hạng tùy chọn, mặc định tắt, ẩn khi điểm bị ẩn và không lộ toàn lớp (http_public_policies `hide rankings when scores are hidden`). Nhận xét của giáo viên không bao giờ tới học sinh, CSV cần phiên giáo viên. Giới hạn: chưa có lựa chọn cho học sinh xem nhận xét; chưa có giao diện gia hạn cho lượt đã mở. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-20, YC-22. Nghiệm thu: NT-25.
  - Đạt khi: Danh sách bài/lượt, progress, gia hạn/mở lại có quyền, thống kê/CSV; leaderboard tùy chọn mặc định tắt và không lộ toàn lớp.
- [x] **CV-062 — Hồi quy link và toàn luồng học sinh.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Khách (cookie bắt buộc), giáo viên khác (404), link cũ (http_student_identity: link thu hồi/hết hạn 404, thu hồi không đăng nhập bị từ chối), đã đóng và đã nộp (http_public_policies, F5), AFTER_CLOSE/NEVER (http_public_policies), không lộ lời giải trong payload/CSV (public_access, http_workflows). Giới hạn: tệp Word đã xuất ra ngoài không thuộc học sinh. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng24/10:** HTTP/PG thử bổ sung ma trận NEVER ở OPEN/CLOSED/ARCHIVED, AFTER_CLOSE theo trạng thái/thời gian, IMMEDIATE; GET và submit idempotent áp dụng quyền hiện tại. Link đề luôn bỏ lời giải, bảng xếp hạng không hiện khi ẩn điểm và top có ẩn tên; cookie thiếu/sai/lượt khác bị chặn. Student/group lưu trữ không dùng capability cũ, teacher vẫn xem dữ liệu. Chưa UI/hai browser/race archive đang ghi/toàn bộ reveal combinations, giữ mở. [PUBLIC_POLICIES_AND_NONNUMERIC](../../qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md).
  - Phạm vi: YC-19, YC-20, YC-21, YC-22. Nghiệm thu: NT-06, NT-21, NT-22, NT-24, NT-25.
  - Đạt khi: Thử khách, giáo viên khác, link cũ, đã đóng, đã nộp, AFTER_CLOSE/NEVER; không lộ lời giải trong payload/metadata/file khi chưa được phép.

## S8 — Tri thức và trợ lý

- [x] **CV-063 — Phân tích có cấu trúc và bản đọc được.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Ghi chú AI đúc kết nay lưu nguồn (loại, đề, phiên bản đề, mã câu, thời điểm phân tích), đoạn trích làm bằng chứng và điều chưa chắc; máy đối chiếu đoạn trích với dữ liệu nguồn và đánh dấu "không khớp nguyên văn" nếu AI trích bịa hoặc không dẫn được căn cứ; độ tin cậy AI tự báo được ghi rõ là không phải xác nhận. Bản đọc được (Markdown, nút "Tải bản đọc được (.md)") ghi từng ghi chú kèm nguồn, bằng chứng, điều chưa chắc và trạng thái bật/tắt; bản JSON và nhập lại giữ nguyên các trường mới, tệp xuất cũ vẫn nhập được (`analysis notes keep their source, a quote that is checked against it, and the doubts; the readable copy shows them`, `the readable copy keeps source, evidence, doubts and the AI confidence label next to each note`, `an exported archive with the new fields is read back with them intact`, `a listed note carries its evidence, doubts and a plain-words source, and older rows without them still list`). Thêm 3 cột vào `TeacherAiMemory` (migration `20261026000200`, đã áp DB chính sau sao lưu `backups/examcraft-before-cv063-20261026.dump`). Giới hạn: số trang không có vì nguồn là câu/đề trong ứng dụng; chưa gọi AI thật nên chưa biết AI trích dẫn đúng tới đâu (máy sẽ đánh dấu khi sai); giao diện đã có luồng trình duyệt F24 (tải bản .md, không lộ khóa). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-23, YC-25. Nghiệm thu: NT-26.
  - Đạt khi: Lưu nguồn/version/trang/câu, nhận xét/bằng chứng/điều chưa chắc; Markdown liên kết dữ liệu gốc, không chỉ một đoạn chat.
- [x] **CV-064 — Bộ nhớ cá nhân có quyền kiểm soát.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Ghi chú riêng tách khỏi kiến thức đã duyệt: nguồn ghi chú là `MANUAL_NOTE` / `AI_ANALYSIS_PENDING`, không đường nào đặt `QUESTION_VERIFIED` từ độ tin cậy; xem, sửa, bật/tắt, xóa và tải về đều có, chỉ chủ ghi chú thấy và đổi được (`private memory import is previewed, owner-isolated and inactive by default`); ghi chú đã tắt hoặc của người khác không bao giờ vào lời nhắc gửi AI (`private notes reach only their owner and only while switched on; nothing else of theirs enters a prompt`). Giới hạn: chưa đánh giá chất lượng ghi chú AI đúc kết bằng AI thật. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Hiện trạng24/10:** Đã mount journal riêng từng owner/writer trong ghi chú AI: chọn khôi phục, xác nhận thay form, ACK đúng nội dung mới dọn bản gửi, giữ chữ gõ sau gửi; có tải raw/RAM. Nhãn ghi chú riêng không hứa AI tự học hay xác nhận chuyên môn. Helper/render tĩnh/build/API DB thử đạt; UI mới, chất lượng dùng ghi chú và tiêu chí còn lại chưa nghiệm thu. [DRAFT_RECOVERY_INTEGRATION](../../qa/rebuild-2026-10-24/DRAFT_RECOVERY_INTEGRATION.md).
  - Phạm vi: YC-23. Nghiệm thu: NT-26.
  - Đạt khi: Sở thích khác kiến thức đã duyệt, xem/sửa/xóa/không dùng lại; không tự gắn QUESTION_VERIFIED từ confidence.
- [ ] **CV-065 — Đóng góp kho chung chủ động.**
  - **Ngoại lệ chấp nhận 26/10 (chủ dự án ủy quyền Claude quyết):** không đóng, không tính là đạt. Kho chung cho nhiều người ngoài phạm vi dự án cá nhân/nhóm nhỏ; chia sẻ trong nhóm dùng liên kết và cộng tác đã đóng (CV011, CV052).
  - **Ưu tiên thấp (chủ dự án 25/10/2026):** dự án cá nhân, dùng riêng hoặc trong nhóm nhỏ nội bộ do chủ dự án kiểm soát, không phục vụ bên ngoài. Đóng góp vào kho chung cho nhiều người không phải mục tiêu hiện tại. Giữ mở, chỉ làm khi chủ dự án yêu cầu.
  - Phạm vi: YC-23, YC-25. Nghiệm thu: NT-26.
  - Đạt khi: Preview bản chia sẻ, loại dữ liệu riêng không cần, kiểm quyền nguồn, review/thu hồi; không public toàn bộ chat/tài liệu gốc.
- [ ] **CV-066 — Cập nhật nguồn và vòng đời mẫu.**
  - **Ngoại lệ chấp nhận 26/10 (chủ dự án ủy quyền Claude quyết):** không đóng, không tính là đạt. Vòng đời mẫu dùng chung ngoài phạm vi dự án cá nhân/nhóm nhỏ; mẫu riêng có nguồn tự khai và cảnh báo ngày đã đóng (CV021).
  - **Ưu tiên thấp (chủ dự án 25/10/2026):** dự án cá nhân, dùng riêng hoặc trong nhóm nhỏ nội bộ do chủ dự án kiểm soát, không phục vụ bên ngoài. Vòng đời mẫu dùng chung cho nhiều người không phải mục tiêu hiện tại. Giữ mở, chỉ làm khi chủ dự án yêu cầu.
  - Phạm vi: YC-23, YC-25. Nghiệm thu: NT-11, NT-26.
  - Đạt khi: Nguồn mới/thay thế/thu hồi đánh dấu phân tích phụ thuộc cần xem lại; công khai label đúng phạm vi/hiệu lực.
- [x] **CV-067 — Truy xuất và trợ lý trong quyền.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Chỉ ghi chú đang bật của chính người dùng được đưa vào lời nhắc, ghi chú tắt hoặc của người khác không bao giờ (`private notes reach only their owner and only while switched on; nothing else of theirs enters a prompt`). Đề nghị của trợ lý chỉ là bản xem trước/diff, phải nhận mới áp (`accepting requires an unchanged account, exam, package, revision, local and saved scope, book and request`); chat phạm vi coi dữ liệu gói là không tin cậy. Nhập tệp: lời nhắc nói rõ chữ trong tệp không phải chỉ dẫn, và dù nhà cung cấp tuyên bố "đã kiểm bởi giáo viên" thì câu nhập vẫn là nháp chưa kiểm (`instructions written inside an imported file stay data: the rule is sent, and a provider claim of verification is discarded`). Giới hạn: chưa thử với AI thật xem có làm theo lệnh cài hay không (đã nêu trong danh sách tự kiểm); chưa có truy xuất tài liệu dùng chung vì ngoài phạm vi (CV065). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - Phạm vi: YC-23, YC-28. Nghiệm thu: NT-06, NT-26.
  - Đạt khi: Lọc quyền trước tìm/đưa vào prompt, không dùng tài liệu riêng cho người khác; đề nghị quản lý có xem trước, không làm theo lệnh trong file nguồn.
- [ ] **CV-068 — Đánh giá cải thiện AI.**
  - Phạm vi: YC-15, YC-16, YC-23, YC-27. Nghiệm thu: NT-15, NT-26, NT-28.
  - Đạt khi: So sánh cùng tập đánh giá độc lập, đúng scope/đáp án/điểm và tỷ lệ giáo viên sửa; không lấy số phân tích hoặc lượt dùng làm thước đo duy nhất.
- [ ] **CV-069 — Xuất dữ liệu cá nhân và tái tạo chỉ mục.**
  - **Hiện trạng24/10:** Giữ archive nhập/xuất theo tài khoản đã kiểm API, không tự bật hoặc ghi đè. Bổ sung tải journal/raw và bản RAM để giữ/đối chiếu khi storage lỗi; chưa có nhập tệp nháp và chưa kiểm tải thực trên browser. Không thay backup DB/tệp; tái tạo chỉ mục/chuyển máy giữ mở. [DRAFT_RECOVERY_INTEGRATION](../../qa/rebuild-2026-10-24/DRAFT_RECOVERY_INTEGRATION.md).
  - Phạm vi: YC-23, YC-24. Nghiệm thu: NT-26, NT-27.
  - Đạt khi: Bản sao giữ câu/đáp án/phân tích/tệp/nguồn/quyền cần thiết, không key; dữ liệu gốc đủ để dựng lại chỉ mục tìm kiếm.

## S9 — Phủ phạm vi, vận hành và nghiệm thu

- [x] **CV-070 — Hoàn thiện danh mục môn/lớp và gói nguồn.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Mỗi ô có trạng thái, nguồn, khả năng (nhận xét hay điểm) và người duyệt "chưa có"; môn ngoài Toán không biến mất (test giữ hơn 20 môn ngoài Toán và mọi môn mọi lớp còn chọn được; `the subject–grade table document is generated from the current catalog and lists every subject`). Giới hạn: chưa ghi hiệu lực tương lai (TT89), phiên bản nguồn và sách theo tập/nhánh. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Hiện trạng26/10:** bảng trạng thái/nguồn/khả năng (nhận xét hay điểm)/người duyệt cho cả 161 ô, sinh từ danh mục thật và có test chống mất môn (xem CV022). Còn thiếu: hiệu lực tương lai TT89, source-version, sách theo tập/nhánh. Giữ mở.
  - Phạm vi: YC-04, YC-07, YC-25, YC-27. Nghiệm thu: NT-11, NT-28.
  - Đạt khi: Mỗi gói có trạng thái/tài liệu/khả năng/người duyệt hoặc thiếu người; không để các môn ngoài Toán biến mất khỏi bảng.
- [ ] **CV-071 — Duyệt chuyên môn và dùng thử.**
  - **Ưu tiên thấp (chủ dự án 25/10/2026):** dự án cá nhân, dùng riêng hoặc trong nhóm nhỏ nội bộ do chủ dự án kiểm soát, không phục vụ bên ngoài. Không tuyển giáo viên thử hay người duyệt độc lập; chủ dự án tự dùng và tự duyệt nội dung của mình. Giữ mở, chỉ làm khi chủ dự án yêu cầu.
  - Phạm vi: YC-27, YC-29. Nghiệm thu: NT-28, NT-30.
  - Đạt khi: Tuyển reviewer theo môn/cấp khi có, nhận mẫu được phép; ghi sửa đổi và vấn đề chưa đồng thuận, không tự ký thay giáo viên.
- [x] **CV-072 — Backup/restore và cảnh báo lỗi.**
  - Nghiệm thu local23/10: gói mới tạo qua backup.ps1, khôi phục qua restore.ps1 tới DB mới và từ chối ghi đè/native nonzero. App production từ bản phục hồi đăng nhập/lưu/mở đề/điểm0/lời giải và6tệp hashkhớp; rekey chỉ bản sao/nguồn24bảng không đổi. Guard gói hỏng/path/retention đạt, SAFE141/typecheck mới; retention chỉ review/không xóa theo yêu cầu giữ dữ liệu. [OPERATIONS_REHEARSAL](../../qa/rebuild-2026-10-23/OPERATIONS_REHEARSAL.md), [app](../../qa/rebuild-2026-10-23/restored-app-verification.json), [runbook](../van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md). Không gộp cutover/RPO/RTO/chuyển máy thuộc CV073 vào kết luận local này. Các đợt trước nghiệm thu đã chuyển sang [lịch sử theo đợt](../lich-su/CHECKLIST_THEO_DOT_2026-10-22_24.md).
  - Phạm vi: YC-24. Nghiệm thu: NT-27.
  - Đạt khi: DB+tệp+khả năng giải mã phục hồi vào môi trường trống; kiểm native exit code script, backup rỗng không báo tốt; retention/đường xóa an toàn.
- [x] **CV-073 — Chốt vận hành local và phương án pilot.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Runbook bí mật/cấu hình/nhật ký/khôi phục và tài khoản chịu trách nhiệm ở [VAN_HANH_PILOT_LOCAL](../van-hanh/VAN_HANH_PILOT_LOCAL.md); sao lưu và khôi phục thật bằng PowerShell 5.1, đo thật và đối chiếu đạt ([OPS_RTO_MEASURE](../../qa/rebuild-2026-10-25/OPS_RTO_MEASURE.md)). RPO 24 giờ, RTO 30 phút, bản sao thứ hai ở ổ ngoài, người vận hành là chủ dự án: đã được chủ dự án duyệt 25/10/2026. Giới hạn nói rõ: bản sao thứ hai chưa được chép thử; chưa diễn tập trên máy khác hay khi mất tài khoản Windows (DPAPI); thời gian diễn tập chạy ứng dụng trên DB phục hồi chưa đo; số đo ở dữ liệu nhỏ. Đủ cho pilot nhỏ cùng chủ dự án, cần làm trước khi giao cho người dùng thật ngoài nhóm.
  - Phạm vi: YC-24. Nghiệm thu: NT-27.
  - Đạt khi: Runbook secrets/config/log/restore, tài khoản chịu trách nhiệm; mục tiêu RPO/RTO, dung lượng và chi phí có chủ dự án duyệt trước triển khai thật.

- [x] **CV-074 — CI, kiểm tải và giám sát.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** `npm run ci` chạy lần lượt kiểm kiểu, kiểm an toàn, dựng bản, bật server thử riêng, kiểm HTTP và luồng trình duyệt; mọi bước ghi dữ liệu đi qua các script có kiểm đích là DB thử `examcraft_test_20261022` và máy chủ Gemini giả cục bộ, không đụng DB chính hay AI thật. Fail thật: dừng ở bước hỏng và thoát mã 1; từ chối chạy khi cổng 3117 đã có server cũ (đã chứng minh bằng một server giả chiếm cổng: CI dừng sau kiểm kiểu và kiểm an toàn). Bản chạy đầy đủ đạt cả 6 bước. `/api/health` chỉ trả `status` và cờ `isolatedTest`, không có đường dẫn hay cấu hình; nhật ký dùng AI cần đăng nhập và không chứa khóa; lỗi máy chủ chỉ ghi tên loại lỗi. Tải: `scripts/load-class.cjs` mô phỏng 40 học sinh cùng bắt đầu, lưu nháp, nộp (ca xác định, không lỗi 5xx), báo cáo ghi rõ đây là một máy, một bài một câu, không phải công suất cam kết. Giới hạn: lint chưa nằm trong CI (còn lỗi cũ, Codex đang dọn). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-01, YC-24, YC-29. Nghiệm thu: NT-05, NT-29.
  - Đạt khi: CI dùng DB thử và fail thật, health/error/usage không lộ dữ liệu; tải đo trên kịch bản xác định, không hứa công suất chưa đo.
- [x] **CV-075 — Thiết kế kết nối Drive tùy chọn.**
  - **Chỉ đóng phần thiết kế, chưa triển khai tích hợp.** [DRIVE_DESIGN_DRAFT](../../qa/rebuild-2026-10-25/DRIVE_DESIGN_DRAFT.md) chốt định dạng gói (dựa trên gói sao lưu cục bộ), quyền OAuth tối thiểu, máy trạng thái sao lưu/khôi phục, danh sách việc kỹ thuật và quyết định chủ dự án cần chọn; các đường `/api/drive/*` ghi rõ là tương lai. Ứng dụng không cần Drive để dùng; sao lưu cục bộ đã có (CV072). [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md)
  - **Ưu tiên thấp (chủ dự án 25/10/2026):** dự án cá nhân, dùng riêng hoặc trong nhóm nhỏ nội bộ do chủ dự án kiểm soát, không phục vụ bên ngoài. Sao lưu đã có bằng gói cục bộ; Drive là tùy chọn về sau. Giữ mở, chỉ làm khi chủ dự án yêu cầu.
  - Phạm vi: YC-24. Nghiệm thu: NT-27.
  - Đạt khi: Chốt backlog/định dạng/quyền tối thiểu/trạng thái backup/restore; chỉ triển khai kết nối khi được chọn, không yêu cầu Drive để dùng app. Không đánh dấu tích hợp hoàn thành nếu mới thiết kế.
- [ ] **CV-076 — Hướng dẫn giáo viên và kiểm dễ dùng.**
  - **Hiện trạng25/10:** Đã rút gọn hướng dẫn giáo viên, bỏ tham chiếu mã nguồn và lời hứa tuyệt đối; làm rõ lưu form/lưu đề, quyền chia sẻ, Word Song song, nháp offline và sao lưu kho khác gói đầy đủ. Sửa nhãn xác nhận nộp bài và cách kiểm reload trong thẻ kiểm. Chưa có quan sát giáo viên thật; giữ mở. [Hướng dẫn](../huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md), [báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-26, YC-29. Nghiệm thu: NT-30.
  - Đạt khi: Hướng dẫn ngắn key, soạn, đáp án, cùng sửa, giao bài, khôi phục; người mới thực hiện nhiệm vụ, sửa ngôn ngữ/điểm ngợp theo quan sát.
- [x] **CV-077 — Dọn đường cũ và cập nhật tài liệu.**
  - **Nghiệm thu26/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Rà caller/dữ liệu/link trước khi bỏ: `/c/[groupCode]` (trang lớp, giáo viên đang dẫn tới), `src/lib/db.ts` (kho trình duyệt, 3 thành phần dùng), `/test/[id]` (chỉ báo link cũ, không đọc dữ liệu) đều giữ có lý do; đường `/api/cloud` lộ đáp án đã bỏ trước đó. Sáu báo cáo V1–V3 chuyển `git mv` sang `docs/lich-su/` có ghi chú lịch sử, sửa đủ liên kết, kiểm 0 liên kết gãy. Tài liệu hiện hành không còn hứa 7 khóa/quota nhân theo khóa/"100% đúng". Không xóa hay hạ schema. Giới hạn: chưa tìm hàm trùng lặp trong mã; báo cáo cũ trong `qa/` gốc giữ nguyên có ghi chú. [CV077_DON_DUONG_CU](../../qa/rebuild-2026-10-25/CV077_DON_DUONG_CU.md).
  - **Hiện trạng24/10 (dọn hồ sơ):**
    - Đã làm: ghi chú mốc chuẩn bị đã qua ở đầu 08/05/07; sửa nơi lưu bằng chứng trong checklist; `.rgignore` đưa báo cáo lịch sử, `qa/` gốc, log/DOM dump và danh mục nghiên cứu lớn ra khỏi tìm kiếm mặc định (không xóa); `tmp/` vào `.gitignore`; nhật ký theo đợt của checklist, hồ sơ 02 cũ và thông báo tiến độ cũ chuyển nguyên văn vào `docs/lich-su/`.
    - Đã làm thêm cùng ngày: `/test/[id]` bỏ nút dẫn tới `/room` không tồn tại; 103 liên kết tuyệt đối `F:/…` trong22tệp đổi thành liên kết tương đối (còn 18 tham chiếu `tệp:dòng` cũ trong báo cáo V1–V3 và7liên kết trỏ ra ngoài repo `F:/Downloads`, `.codex`, giữ nguyên vì là nguồn gốc); 38 báo cáo cũ trong `qa/` gốc và `qa/reports/` có ghi chú lịch sử đầu tệp (`FIX_REPORT.md` có nội dung gốc trùng `BAO_CAO_SUA_LOI.md`, giữ cả hai).
    - Còn mở: chưa rà caller/dữ liệu để dọn đường cũ (route `/c/[groupCode]`, `db.ts` cục bộ, hàm trùng); chưa đổi tên/tách hồ sơ V1–V3 sang thư mục lưu trữ.
  - Phạm vi: YC-29, YC-30. Nghiệm thu: NT-01, NT-03, NT-31.
  - Đạt khi: Rà caller/dữ liệu/link trước bỏ; tài liệu không còn hứa 7-key/100% sai; xóa/hạ schema chỉ sau migration/rollback đã kiểm.
- [ ] **CV-078 — Tổng nghiệm thu và quyết định phát hành.**
  - **Ưu tiên thấp (chủ dự án 25/10/2026):** dự án cá nhân, dùng riêng hoặc trong nhóm nhỏ nội bộ do chủ dự án kiểm soát, không phục vụ bên ngoài. Không có quyết định phát hành ra ngoài; chỉ cần chủ dự án tự xác nhận dùng được. Giữ mở, chỉ làm khi chủ dự án yêu cầu.
  - Phạm vi: YC-01, YC-24, YC-27, YC-29. Nghiệm thu: NT-31.
  - Đạt khi: Tất cả YC có kết quả hoặc ngoại lệ được chấp nhận có phạm vi; không còn lỗi chặn quyền/mất dữ liệu/đáp án/điểm; phát hành và rollback có người quyết định.

## Bảng đối chiếu phát hiện cũ → việc mới

| Phát hiện | Việc xử lý |
|---|---|
| V1 R01, cấu hình bỏ lớp/sai môn | CV-016,017,019,022,070 |
| R02–R03, lưu local và báo lưu sai | CV-008,009,010,015 |
| R04–R06, số 0/phân bổ/validator | CV-020,034,036 |
| R07, verify thiếu ý vẫn khớp | CV-036,037 |
| R08, quyền tham chiếu | CV-011,047,055 |
| R09–R10, đặc tả và điểm | CV-019,020,021 |
| R11–R12, nhập Word và context key | CV-031,039,040 |
| R13, memory tự xác minh | CV-063,064,065,066 |
| R14, loại câu bị rơi | CV-008,023,042,058 |
| R15, nhiều đường chấm | CV-059,060,077 |
| R16 và test báo PASS giả | CV-003,074,078 |
| V2 mapping payload/figures | CV-006,008,026,040,043 |
| V2 ShareModal/import enum/ID | CV-014,054 |
| V2 draft POST/PATCH, báo đã lưu sai | CV-057 |
| V2 public share/attemptId/submit deadline/reveal/start unique | CV-012,048,055,056,059,062 |
| V2 UI nút chết/cuộn/đáp án không sửa | CV-023,028,029,058,076 |
| V3 quota giả/key trả phí | CV-031,032,033 |
| V3 sửa tiêu đề/mẫu và bảo vệ dữ liệu | CV-027,030,069,072 |
| QA lịch sử auth/legacy/secret/CI/export | CV-006,012,013,043,074,077; tái lập trước khẳng định còn lỗi |

## Truy vết yêu cầu → nhiệm vụ

| Yêu cầu | Nhiệm vụ bao phủ |
|---|---|
| YC-01 | CV-001, CV-011, CV-013, CV-074, CV-078 |
| YC-02 | CV-009, CV-015, CV-028 |
| YC-03 | CV-013, CV-031, CV-032, CV-033, CV-053 |
| YC-04 | CV-004, CV-007, CV-016, CV-017, CV-022, CV-070 |
| YC-05 | CV-018, CV-034 |
| YC-06 | CV-004, CV-019, CV-021 |
| YC-07 | CV-004, CV-007, CV-019, CV-020, CV-021, CV-034, CV-036, CV-070 |
| YC-08 | CV-008, CV-023, CV-035 |
| YC-09 | CV-007, CV-008, CV-020, CV-023, CV-024, CV-025, CV-035, CV-036, CV-037, CV-059 |
| YC-10 | CV-008, CV-026, CV-040, CV-046, CV-058 |
| YC-11 | CV-006, CV-039, CV-040, CV-041 |
| YC-12 | CV-007, CV-021, CV-027, CV-030, CV-043, CV-044 |
| YC-13 | CV-005, CV-007, CV-008, CV-009, CV-010, CV-025, CV-030, CV-050 |
| YC-14 | CV-015, CV-047, CV-052 |
| YC-15 | CV-033, CV-034, CV-035, CV-038, CV-068 |
| YC-16 | CV-025, CV-036, CV-037, CV-038, CV-068 |
| YC-17 | CV-042 |
| YC-18 | CV-006, CV-043, CV-044, CV-045, CV-046 |
| YC-19 | CV-005, CV-011, CV-012, CV-030, CV-047, CV-048, CV-049, CV-050, CV-051, CV-053, CV-062 |
| YC-20 | CV-012, CV-054, CV-055, CV-056, CV-061, CV-062 |
| YC-21 | CV-012, CV-055, CV-056, CV-057, CV-058, CV-059, CV-062 |
| YC-22 | CV-059, CV-060, CV-061, CV-062 |
| YC-23 | CV-038, CV-063, CV-064, CV-065, CV-066, CV-067, CV-068, CV-069 |
| YC-24 | CV-001, CV-002, CV-011, CV-013, CV-014, CV-069, CV-072, CV-073, CV-074, CV-075, CV-078 |
| YC-25 | CV-007, CV-016, CV-017, CV-021, CV-022, CV-041, CV-063, CV-065, CV-066, CV-070 |
| YC-26 | CV-004, CV-028, CV-029, CV-076 |
| YC-27 | CV-004, CV-016, CV-022, CV-037, CV-046, CV-068, CV-070, CV-071, CV-078 |
| YC-28 | CV-067 |
| YC-29 | CV-001, CV-002, CV-003, CV-071, CV-074, CV-076, CV-077, CV-078 |
| YC-30 | CV-001, CV-006, CV-008, CV-014, CV-015, CV-077 |

## Cách cập nhật trạng thái và bằng chứng

Chỉ chuyển `[ ]` sang `[x]` sau khi tiêu chí đạt. Nếu có blocker, giữ `[ ]` và ghi ngay dưới nhiệm vụ: đang làm/chặn, lý do, phần đã có, đầu vào cần. Không đánh dấu xong để biểu thị đã đọc hoặc đã lên kế hoạch.

**Cách ghi từ 24/10/2026 — một nơi cho số liệu:**

- Mỗi CV giữ đúng một dòng `**Hiện trạng<ngày>:**`, viết đè khi có đợt mới: đã có gì, còn thiếu gì, giữ mở hay đạt, và liên kết báo cáo nhóm. CV `[x]` giữ thêm dòng bằng chứng nghiệm thu. Ngày 24/10 đã gom các CV có từ hai dòng đợt trở lên; CV chỉ có một dòng đợt vẫn giữ nhãn cũ (dòng đó là hiện trạng) và đổi sang khuôn mới ở lần cập nhật kế tiếp.
- Số test, tên log, thời điểm chạy và giới hạn chi tiết chỉ ghi trong báo cáo nhóm `qa/rebuild-<ngày>/`. Checklist, hồ sơ 02 và báo cáo tiến độ không chép lại các con số này.
- Dòng cũ không còn là hiện trạng thì chuyển nguyên văn sang `docs/lich-su/` (hoặc để lịch sử Git), không xóa mất. Không xóa hoặc đổi "Phạm vi"/"Đạt khi" khi viết đè hiện trạng.
- **Mức "đạt trong phạm vi pilot" (chủ dự án duyệt 24/10/2026, kế hoạch [04_MOC_PILOT](../phoi-hop-ai/04_MOC_PILOT.md)):** CV tiện ích có thể ghi dòng "Hiện trạng … đạt trong phạm vi pilot" khi có kiểm tự động trên giao diện, kiểm API/DB và danh sách giới hạn. CV về quyền, mất dữ liệu, lộ đáp án, sai điểm giữ tiêu chí đầy đủ. Mức này không đổi dấu `[x]`, không thay "Đạt khi", không thay tổng nghiệm thu CV078.

Mẫu ghi cho mỗi CV:

| Trường | Nội dung cần ghi |
|---|---|
| Ngày/người thực hiện | Người chịu trách nhiệm kỹ thuật; reviewer nếu có |
| Phiên bản | Commit và thay đổi chưa commit, phiên bản fixture/schema/môi trường |
| Đầu ra | File/route/giao diện/dữ liệu đã đổi |
| Kiểm tra | NT nào, dữ liệu đầu vào, kết quả mong đợi/thực tế, lệnh/phiên bản khi phù hợp |
| Bằng chứng | Link log, ảnh/file xuất hoặc báo cáo HTTP đã bỏ bí mật |
| Giới hạn | Chưa thử phần nào, ngoại lệ, việc nối tiếp |
| Quyết định | Đạt/chưa đạt; chấp nhận ngoại lệ bởi ai và áp dụng trong phạm vi nào |

Nơi lưu bằng chứng: báo cáo nhóm và tệp bằng chứng trong `qa/rebuild-<ngày>/` (hiện là `qa/rebuild-2026-10-22/` và `qa/rebuild-2026-10-23/`), một báo cáo Markdown theo nhóm CV kèm log/ảnh/JSON cùng thư mục. Đường `qa/evidence/rebuild-2026-10-21/<CV-id>/` dự kiến lúc lập kế hoạch không được dùng; `qa/evidence/` hiện chỉ chứa bằng chứng cũ trước rebuild. Không lưu key/mật khẩu/tên học sinh thật vào Git.



## Tiêu chí bổ sung từ bàn giao22/10/2026

Không đổi dấu hoàn thành các CV. Việc nghiên cứu đã làm và chưa làm ghi riêng ở [06—Việc tiếp theo](../nghien-cuu/06_VIEC_TIEP_THEO.md).

- CV-004, CV-007 / YC-04,07,25,27 / NT-11,12,28: ví dụ phải có năm học/phiên bản; NN1 và NN2 cùng ngôn ngữ không trùng; chương trình theo trình độ không bị ép lớp.
- CV-007 / YC-25 / NT-11: phân biệt văn bản, phụ lục, tệp và bản lưu; minh họa bốn phụ lục trong hai PDF và nhiều bản lưu cùng văn bản.
- Các CV triển khai nguồn/mẫu và nghiệm thu độ phủ phải dùng sổ05; không chuyển106 mã thành106 tài liệu đã duyệt hoặc báo đủ1–12.
- Mặc định sách theo năm học phải có căn cứ; ba bộ vẫn có thể quản lý theo gói/ấn bản/hồ sơ tham chiếu. Không đổi dữ liệu đề cũ theo mặc định mới.
