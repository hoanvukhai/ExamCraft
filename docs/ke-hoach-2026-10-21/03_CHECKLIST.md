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
- [ ] **CV-004 — Dựng mẫu luồng dễ hiểu và danh mục môn.**
  - Phạm vi: YC-04, YC-06, YC-07, YC-26, YC-27. Nghiệm thu: NT-11, NT-28.
  - Đạt khi: Có mẫu màn hình tạo bài/đáp án/key/chia sẻ, danh mục môn-lớp cần xác minh và ca đại diện ba cấp; Toán không là giới hạn.
- [ ] **CV-005 — Thử nhỏ cộng tác trước thiết kế lưu chính thức.**
  - Truy vết24/10: quyết định đã ghi ở [COLLABORATION](../../qa/rebuild-2026-10-22/COLLABORATION.md) — nội dung đầy đủ + version CAS, kiểm thay đổi theo chu kỳ/focus; người lưu sau nhận409 và giữ nháp, chưa ghép từng ký tự. Ca hai phiên HTTP/hai tab nằm ở CV049/050. Chưa có thử offline/undo của từng người và hai browser độc lập nên giữ mở.
  - Phạm vi: YC-13, YC-19. Nghiệm thu: NT-20.
  - Đạt khi: Ghi kết quả hai người sửa, offline/reconnect, undo và đổi cấu trúc; quyết định cơ chế đồng bộ có lý do, không chỉ chọn tên thư viện.
- [ ] **CV-006 — Thu thập fixture và tái lập các lỗi báo cáo.**
  - Phạm vi: YC-11, YC-18, YC-30. Nghiệm thu: NT-03, NT-16, NT-18.
  - Đạt khi: Mẫu local phẳng/DB payload, figures object/mảng, 7 loại câu, ngữ liệu và file dài; từng lỗi đánh dấu hiện còn/đã sửa/chưa tái lập.
- [ ] **CV-007 — Chốt hợp đồng khái niệm bằng ví dụ.**
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
- [ ] **CV-010 — Nháp offline, version và chống ghi đè.**
  - **Hiện trạng25/10:** Đã kiểm trình duyệt mất mạng khi đang mở đề, giữ nháp trên máy, nối lại lưu đúng; nếu phiên khác sửa thì không ghi đè và lưu nháp thành đề riêng. Chrome và Edge chạy độc lập theo lượt. Giữ các kiểm nháp owner/writer/ACK trước; chưa mở ứng dụng từ đầu khi hoàn toàn offline, chưa đủ parent journal/storage lỗi/hai engine sửa đồng thời. Giữ mở. [Báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-13. Nghiệm thu: NT-04, NT-20.
  - Đạt khi: Nháp phục hồi sau reload, tách tài khoản, có version conflict; bản đến muộn không ghi đè bản mới, không đồng bộ sang sai tài khoản.
- [ ] **CV-011 — Quyền đối tượng và liên kết.**
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
- [ ] **CV-014 — Thử migration có mapping và chạy lặp an toàn.**
  - **Hiện trạng24/10:** nhập dữ liệu cũ có xem trước không ghi, transaction từng tài liệu, lỗi từng mục và resume, nhập lặp không đè bản giáo viên đã sửa, tách tài khoản; giữ thứ tự/điểm0/ngữ liệu/hình/lời giải. Nguồn khác hoặc thiếu dấu SHA256 được xem trước và xác nhận thành bản sao riêng, retry không nhân đôi; API chặn cùng ID khác nội dung trong một request; advisory lock cho request đồng thời. Parser JSON/BOM/phiên bản và chia archive100đề/30MB; UI checkbox→nhập→mở, vòng tải/nhập lại ảnh khớp hash; IndexedDB thật giữ bản cũ/retry/rollback. Migration SQL lưu đúng byte trong Git (`.gitattributes`, commit `22af32b`); chưa thử checkout sạch rồi `prisma migrate status`. Còn so khác lượt/tệp, UI tách biến thể, câu rời có ngữ liệu và toàn luồng local→server. Giữ mở. Bằng chứng: [CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md), [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md), [BACKUP_LIMITS](../../qa/rebuild-2026-10-23/BACKUP_LIMITS.md), [IMPORT_UI_ROUNDTRIP](../../qa/rebuild-2026-10-23/IMPORT_UI_ROUNDTRIP.md), [IMPORT_UI_AND_IMAGES](../../qa/rebuild-2026-10-23/IMPORT_UI_AND_IMAGES.md), [LEGACY_IMPORT](../../qa/rebuild-2026-10-23/LEGACY_IMPORT.md).
  - Phạm vi: YC-24, YC-30. Nghiệm thu: NT-03, NT-27.
  - Đạt khi: Đối chiếu số lượng/nội dung/quyền, import không nhân đôi, có báo mục lỗi và resume; restore thử trước chuyển thật.
- [ ] **CV-015 — Hợp nhất kho đề/ngân hàng với nguồn server.**
  - **Hiện trạng24/10:** đề và câu ngân hàng đối chiếu nguồn qua request sau; bản sao riêng có mã ổn định theo tài khoản/loại/nguồn/nội dung, bản giáo viên đã sửa và revision giữ nguyên. Export/xem trước đọc cả IndexedDB và3nguồn localStorage; sao chép local chỉ thêm ID thiếu, không ghi đè/xóa nguồn; ghi câu lỗi thì rollback cả đề mới. Còn UI hợp nhất đầy đủ kho/lọc/thùng rác/ngữ liệu; liên quan CV048 (bản sao từ link chia sẻ đã lưu kho server; theo bản nguồn, giữ bản sửa riêng). Giữ mở. Bằng chứng: [CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md), [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md), [LEGACY_IMPORT](../../qa/rebuild-2026-10-23/LEGACY_IMPORT.md).
  - Phạm vi: YC-02, YC-14, YC-30. Nghiệm thu: NT-02, NT-03.
  - Đạt khi: Fork hiện trong kho cá nhân, recent/filter/star/trash/restore đúng; không xóa dữ liệu local trước kiểm tra chuyển thành công.

## S2 — Giáo dục, scope và mẫu

- [ ] **CV-016 — Danh mục môn/lớp và registry gói.**
  - Phạm vi: YC-04, YC-25, YC-27. Nghiệm thu: NT-11, NT-28.
  - Đạt khi: Tên/mã chuẩn và cấp áp dụng, không alias môn sai; thiếu gói báo rõ; theo dõi các thao tác theo từng gói.
- [ ] **CV-017 — Cây kiến thức, yêu cầu cần đạt và mục lục sách.**
  - Nền kỹ thuật22/10: gói JSON có ID/phiên bản, cây + tiên quyết, mapping nhiều–nhiều theo ấn bản; chặn vòng lặp/mã thiếu và thay nội dung cùng revision. Lưu/mở bằng DB/HTTP đã kiểm; dữ liệu môn–lớp và ba bộ sách chưa biên tập/duyệt đủ nên giữ mở.
  - Phạm vi: YC-04, YC-25. Nghiệm thu: NT-11.
  - Đạt khi: ID ổn định, liên kết nhiều-nhiều có nguồn/phiên bản; Toán ba bộ sách theo gói, không dùng thứ tự bài làm ID kiến thức.
- [ ] **CV-018 — Chọn phạm vi trực tiếp hoặc chat.**
  - **Hiện trạng24/10:** chọn include/exclude/giới hạn phương pháp trực tiếp, xem trước/áp dụng/lưu/tải lại (loại trừ ưu tiên, không tự mở rộng tiên quyết). Chat phạm vi có API BYOK/quota, kiểm mã/revision/sách/mapping, bảng diff nhận/hủy, khóa đề nghị cũ khi đổi ngữ cảnh và hỏi làm rõ; mới kiểm bằng kết quả AI giả. Còn AI thật→lưu/mở đầy đủ và đánh giá hiểu yêu cầu/chuyên môn. Giữ mở. Bằng chứng: [SCOPE_CHAT](../../qa/rebuild-2026-10-23/SCOPE_CHAT.md), [KNOWLEDGE_SCOPE](../../qa/rebuild-2026-10-22/KNOWLEDGE_SCOPE.md).
  - Phạm vi: YC-05. Nghiệm thu: NT-12.
  - Đạt khi: Include/exclude/giới hạn phương pháp cập nhật cùng bảng scope; chat đề nghị diff, thiếu bộ sách/bài không tự đoán.
- [ ] **CV-019 — Khung mức nhận thức và loại bài độc lập.**
  - Phạm vi: YC-06, YC-07. Nghiệm thu: NT-11, NT-13.
  - Đạt khi: Biết–Hiểu–Vận dụng theo mẫu, khung bốn mức không tự quy đổi; tách độ khó; khảo sát ý kiến không bị ép điểm/đáp án.
- [ ] **CV-020 — Kế hoạch đề, phân bổ và điểm chính xác.**
  - Đợt kế hoạch23/10: ô cá nhân7dạng/count0/điểm đơn vị0,01/outcome có phiên bản; so từng ô+tổng, báo chồng/thiếu, giữ plan lịch sử và nháp khi nền mới. Build45trang/SAFE160/HTTP16đạt; browser app nhập1ô tự luận0điểm→Apply→lưu→reload giữ đúng. Đã nối bảng mục tiêu A4/Word và kiểm XML DOCX thật5ca; SAFE165đạt, build tích hợp xuất còn đang kiểm. Giữ mở cho bố cục/xuất đầy đủ và chuyên môn. [EXAM_PLAN](../../qa/rebuild-2026-10-23/EXAM_PLAN.md).
  - Phạm vi: YC-07, YC-09. Nghiệm thu: NT-13.
  - Đạt khi: Ma trận mục tiêu và thực tế so khớp, đặc tả lấy từ outcome; số câu 0 hợp lệ; xác định tổng điểm và quy tắc làm tròn.
- [ ] **CV-021 — Mẫu có nguồn và bản sao cá nhân.**
  - **Hiện trạng24/10:** mẫu có envelope nguồn/phiên bản, save-as-new/replay, private source và cảnh báo nguồn như đợt trước. Claude4 đã bổ sung request context/abort, lock tài khoản đổi, validate list/open/save, retryID theo body và chặn bấm đúp Apply; Codex sửa receipt/finally cũ không lock/unbusy gate mới. Unit/build/HTTP thật khớp parser và lưu/mở mẫu. UI mới còn thiếu do CUA lỗi; chưa thư viện nguồn được duyệt. Giữ mở. [TEMPLATE_IMPORT_ACCOUNT](../../qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md).
  - Phạm vi: YC-06, YC-07, YC-12, YC-25. Nghiệm thu: NT-11, NT-14.
  - Đạt khi: Mẫu hệ thống/trường/tham khảo/cá nhân rõ, ngày áp dụng/version; sửa tạo bản riêng và ghi lệch ràng buộc, không giữ nhãn phù hợp sai.
- [ ] **CV-022 — Chuẩn bị dữ liệu tất cả nhóm môn.**
  - Phạm vi: YC-04, YC-25, YC-27. Nghiệm thu: NT-28.
  - Đạt khi: Có danh mục gói/nguồn/trạng thái thiếu theo cấp; tiến hành ngoài Toán, không đánh dấu duyệt nếu chưa có reviewer.

## S3 — Bàn soạn và trải nghiệm

- [ ] **CV-023 — Soạn đủ loại câu và thành phần.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F2 soạn bảy dạng, lưu, đóng, mở lại đúng nội dung; integration_s1/persistence/HTTP lưu-đọc bảy dạng. Giới hạn: AI sinh/sửa chưa kiểm chuyên môn; bàn phím/màn hình nhỏ; chưa mọi ca môn khác Toán. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - Đợt24/10: journal từng câu/writer, guard baseline khi Apply, giữ form/nháp và chặn Lưu đề còn câu chưa áp dụng; bảng tải/cất giữ nguồn. Build46trang/SAFE192đạt; browser đóng/mở/fresh-tab/reload/archive/hai tab đạt, DB giữ version/hash khi A stale và giữ B/ảnh/điểm0/plan. Còn toàn tiêu chí7dạng và ca khác; [QUESTION_DRAFTS_AND_MOBILE](../../qa/rebuild-2026-10-23/QUESTION_DRAFTS_AND_MOBILE.md).
  - Phạm vi: YC-08, YC-09. Nghiệm thu: NT-07, NT-08.
  - Đạt khi: Sửa lựa chọn/ý đúng-sai, thêm kiểu câu phù hợp, thứ tự/ghim; matching/ordering/fill_blank có cấu trúc đủ hoặc báo chưa hỗ trợ rõ.
- [ ] **CV-024 — Đề, đáp án và song song.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F3 chuyển Đề/Đáp án/Hướng dẫn/Song song, hai cột đủ 7 câu, ngữ liệu một lần, Word Song song hai cột; unit parallel_view và portable_and_exports; mở lại đề qua API ở F2. Giới hạn: Word dài chưa mở bằng Word thật; in nhiều trang chưa kiểm. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - **Hiện trạng25/10:** Song song trên màn hình giữ ngữ liệu chung; Word nay có hai cột theo từng câu, ngữ liệu xuất một lần, ảnh thu theo cột. Đã kiểm nội dung/cấu trúc DOCX tự động; chưa mở Word kiểm phân trang trực quan. Giữ mở. [Báo cáo nhóm](../../qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md).
  - Phạm vi: YC-09. Nghiệm thu: NT-07, NT-08.
  - Đạt khi: Ba chế độ cùng dữ liệu; đáp án/lời giải/rubric riêng nhưng gắn version, thiếu đáp án không tự điền đúng.
- [ ] **CV-025 — Lịch sử câu và kiểm định theo phiên bản.**
  - **Hiện trạng25/10:** Đã sửa chỉ cập nhật/lập lịch sử câu khi dữ liệu câu đổi; đọc theo lô, ghi liên kết và lịch sử theo lô, giữ toàn bộ lịch sử cũ và ExamRevision. Kiểm DB thử: lưu lặp/reorder không thêm lịch sử câu, sửa một câu, xóa trường, điểm thập phân, xóa/ghép lại, rollback, quyền và CAS từng câu đạt. Giữ Undo/Copilot guard đã có; Undo còn RAM. Lưu ngân hàng có bản sao riêng; nút nay khóa khi đang gửi hoặc câu chưa áp dụng, thông báo rõ bản sao. Chưa có idempotency khi mất biên nhận, giữ mở. [Nhóm bổ sung](../../qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md). [Báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-09, YC-13, YC-16. Nghiệm thu: NT-08, NT-15.
  - Đạt khi: Sửa dữ kiện đánh dấu cần kiểm lại, undo/redo và lưu mốc giữ liên kết; chọn lưu ngân hàng khác với lưu nháp.
- [ ] **CV-026 — Hình, công thức, bảng và ngữ liệu.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F2 ảnh và ngữ liệu có mã, F3 Word có ảnh/media, mã đề; unit/DB round-trip hình. Giới hạn: công thức/hình học phức tạp, Word thật, tệp mất liên kết. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - Phạm vi: YC-10. Nghiệm thu: NT-16.
  - Đạt khi: Thành phần hiển thị/biên tập có ID, mất tệp báo chỗ thiếu, ngữ liệu dùng chung không nhân bản sai; giữ mô hình hình học/môn khác.
- [ ] **CV-027 — Mẫu trực quan và tùy chỉnh tiêu đề.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F2 tên đề, đặt/ lưu mẫu riêng; header_layout, exam_template và HTTP templates. Giới hạn: mẫu hệ thống/nguồn chưa duyệt, Word dài. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - Đợt tiêu đề23/10: patch trường đã sửa/guard nền giữ scope/plan; dòng in ID/vị trí/căn/ẩn/ghi đè/rỗng dùng chung A4/Word. Build45trang/SAFE173/HTTP16đạt; UI hai tab giữ plan/tên mới khi Apply header, cùng trường đổi thì giữ nháp/chặn ghi, DBversion/hash không đổi. Reload giữ layout/ảnh/điểm0, ca A4ngắn không thấy tràn. Còn Word dài/mẫu cá nhân và nghiệm thu toàn tiêu chí; [HEADER_LAYOUT](../../qa/rebuild-2026-10-23/HEADER_LAYOUT.md).
  - Phạm vi: YC-12. Nghiệm thu: NT-14, NT-18.
  - Đạt khi: Sửa trường/năm/tên đề/phần, thêm/ẩn dòng, căn chỉnh và lưu mẫu; để trống không sinh trường giả; dữ liệu thời gian/điểm thống nhất.
- [ ] **CV-028 — Làm gọn quản lý và điều hướng.**
  - Đợt quản lý23/10: sửa nút thêm học sinh khớp API PATCH/newStudentNames; browser tạo lớp→thêm→reload/mở danh sách đạt, chỉ DB thử. Ngân hàng/key/folder gắn đúng tài khoản; toàn tiêu chí kho/filter/trash/điều hướng vẫn mở, xem OBJECT_ACCESS.
  - Phạm vi: YC-02, YC-26. Nghiệm thu: NT-02, NT-30.
  - Đạt khi: Tách dashboard/editor, tránh modal trùng, nút không hoạt động không giả hoàn thành; recent/filter/trash/restore và quay lại không mất đề.
- [ ] **CV-029 — Dùng được khi chưa có AI và trên màn hình nhỏ.**
  - Đợt24/10: khôngkey vẫn sửa/Apply/lưu thật; rail mobile thành drawer/ẩn khi thu gọn. Browser360px main30,4→322,4px,390px main352,8px; document không tràn ngang, form0điểm/nút Apply hiển thị đủ. Drawer mở/đóng đạt; chưa nghiệm thu mobile keyboard/zoom/screen reader/toàn luồng xuất. Build/SAFE192đạt, xem QUESTION_DRAFTS_AND_MOBILE.
  - Phạm vi: YC-26. Nghiệm thu: NT-30.
  - Đạt khi: Tạo/sửa/lưu/xuất thủ công không bị chặn key; thông báo dễ hiểu, tab order/focus/label, cuộn trang và layout nhỏ được thử.
- [ ] **CV-030 — Quyền chốt và phiên bản công bố.**
  - Phạm vi: YC-12, YC-13, YC-19. Nghiệm thu: NT-14, NT-20.
  - Đạt khi: Chốt bản cụ thể, quyền phát hành tách sửa; mẫu cập nhật không đổi bản đã chốt; chuẩn bị snapshot cho giao bài.

## S4 — Kết nối AI và sinh/kiểm định

- [ ] **CV-031 — Thống nhất BYOK mọi endpoint.**
  - Đọc tĩnh24/10: cả10route có gọi Gemini (generate-exam, exam-copilot, tweak/verify-question, parse-docx, parse-exam-text, ocr-exam-image, knowledge-scope/propose, teacher/assistant, teacher/ai-memory/analyze) đều đi qua `executeWithKeyRotation` trong `gemini-keys.ts`: chỉ key tạm của người gọi hoặc key đã lưu của chính họ, giữ quota ứng dụng trước gọi. Đây là đọc mã, chưa phải HTTP/AI thật cho từng route; HTTP17 mới phủ một phần (Copilot/tweak/verify). Giữ mở.
  - Phạm vi: YC-03. Nghiệm thu: NT-09.
  - Đạt khi: Generate/tweak/OCR/Word/verify/memory đều lấy key theo người gọi và quyền dữ liệu; không fallback mock dưới nhãn kết quả AI thật.
- [ ] **CV-032 — Quản lý key và sử dụng minh bạch.**
  - **Hiện trạng24/10:** model mặc định theo báo cáo MODEL_DEFAULT_AND_BUILD_CPUS trước vẫn giữ. API lưu key có optional clientRequestId, concurrent/retry cùng nội dung trả cùng masked row, khác nội dung409, không bật lại key đã tắt; caller cũ giữ tương thích. C01 đã tích hợp sau sửa review, không xóa form từ receipt hỏng/lateACK. Build/SAFE/HTTP thử bằng khóa giả đạt, không Google/provider. Chưa UI/key thật/đầy đủ usage; giữ mở. [KEY_CREATE_RETRY_AND_BATCH_REVIEW](../../qa/rebuild-2026-10-24/KEY_CREATE_RETRY_AND_BATCH_REVIEW.md).
  - Phạm vi: YC-03. Nghiệm thu: NT-09, NT-10.
  - Đạt khi: Thêm/chọn/test/thay/xóa; usage theo ID không theo label; bỏ 1500*key, gói chưa xác minh ghi chưa biết; không hứa số dư thật.
- [ ] **CV-033 — Hạn mức, chi phí và tác vụ nền.**
  - Phạm vi: YC-03, YC-15. Nghiệm thu: NT-10.
  - Đạt khi: Retry/backoff giới hạn, hủy, không tự dùng paid fallback; giới hạn ứng dụng không giả là trần nhà cung cấp; tác vụ nền có quyền và ngân sách.
- [ ] **CV-034 — Sinh theo scope và kế hoạch.**
  - Đã nối gói/phạm vi vào kế hoạch, kiểm mã AI trong tập cho phép và phiên bản; từng câu lưu provenance/cảnh báo khi gói đổi. Đã mở hợp đồng7dạng và bước duyệt trước áp dụng, giữ tiêu đề riêng/chặn bản nền cũ. Chưa gọi AI thật, chưa đánh giá chuyên môn hay phân bổ đầy đủ theo slot nên giữ mở.
  - Phạm vi: YC-05, YC-07, YC-15. Nghiệm thu: NT-12, NT-13, NT-15.
  - Đạt khi: Sinh từng slot hoặc nhóm có kiểm số lượng/điểm/kiến thức; 0 không thành mặc định, thiếu slot báo và sửa có giới hạn.
- [ ] **CV-035 — AI sửa vùng được chọn và diff.**
  - **Hiện trạng24/10:** đề xuất sửa câu và Copilot giữ preview khi bản nền đổi hoặc parent từ chối, chỉ đóng khi có xác nhận; updater so toàn nền/ngữ cảnh/quyền để giữ sửa mới; sửa giữ điểm0/hình/liên kết, thêm có ID riêng chưa điểm, bỏ đúng ID; đề xuất bền qua tải trang theo tài khoản/đề/writer, áp dụng hoặc bỏ thì cất bản đối chiếu xem/tải được. Kiểm bằng component thật và API giả, không gọi AI thật. Còn provider thật/chuyên môn và nhập đề xuất qua máy khác. Giữ mở. Bằng chứng: [COPILOT_GUARDS](../../qa/rebuild-2026-10-23/COPILOT_GUARDS.md), [QUESTION_AI_REVIEW](../../qa/rebuild-2026-10-23/QUESTION_AI_REVIEW.md), [AI_JOURNAL_AND_HISTORY](../../qa/rebuild-2026-10-23/AI_JOURNAL_AND_HISTORY.md).
  - Phạm vi: YC-08, YC-09, YC-15. Nghiệm thu: NT-08, NT-15.
  - Đạt khi: Đổi dữ kiện/câu/lời giải đúng vùng, giữ tiêu đề giáo viên đã sửa và hình liên quan; accept/reject/undo có lịch sử người yêu cầu.
- [ ] **CV-036 — Validator cấu trúc và toàn đề.**
  - **Hiện trạng25/10:** Đã có bảng Rà soát đề thu gọn ở bàn soạn và hộp giao bài: bảy dạng, nhãn trùng, liên kết, điểm/đáp án thiếu, đối chiếu kế hoạch. Không sửa tài liệu hoặc chứng nhận chuyên môn; bài không chấm điểm không bị ép đáp án. Unit/render đạt; kiểm giao diện mới đang vướng DB thử chưa chạy. Giữ mở. [Báo cáo nhóm](../../qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md).
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

- [ ] **CV-039 — Nhập text/LaTeX và xem trước hai phía.**
  - **Hiện trạng24/10:** giữ nguồn và preview theo loại đầu vào; Word/ảnh/text AI nay gửi pin chủ tài khoản, server chặn sai tài khoản trước body/provider. Modal guard phản hồi/tệp cũ theo đích; lỗi cùng nguồn giữ preview, xác nhận nhập kiểm lại user và callback editor chỉ append đúng đề có quyền. Build/HTTP/kiểm thuần đạt; chưa UI mới/AI thật/chất lượng đa môn và import form bền qua reload. Giữ mở. [TEMPLATE_IMPORT_ACCOUNT](../../qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md).
  - Phạm vi: YC-11. Nghiệm thu: NT-16.
  - Đạt khi: Nguồn giữ được, câu tách rõ, phần không hiểu có nhãn; sửa trước lưu, không tự giải giả thành đáp án trích nguồn.
- [ ] **CV-040 — Nhập Word/ảnh và xử lý tài liệu dài.**
  - **Hiện trạng24/10:** bổ sung pin/abort/context guard cho nhập Word và ảnh, dùng cùng quy tắc xác nhận riêng với text; request stale-account/body hỏng chặn trước đọc tệp/khóa/provider. Không gọi AI thật trong kiểm đợt này. Chưa xác nhận UI mới, Word/ảnh dài/phức tạp, kết quả OCR chuyên môn, mọi loại tài liệu. Giữ mở. [TEMPLATE_IMPORT_ACCOUNT](../../qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md).
  - Phạm vi: YC-10, YC-11. Nghiệm thu: NT-16.
  - Đạt khi: Giữ hình/công thức/đoạn liên quan, thông báo cắt/thiếu, chia lô có thứ tự và chống trùng; OCR không đặt true mặc định.
- [ ] **CV-041 — Quyền và nguồn nhập.**
  - Phạm vi: YC-11, YC-25. Nghiệm thu: NT-16, NT-26.
  - Đạt khi: Ghi nguồn/trang/câu, dedup không xóa nhầm biến thể; tài liệu không rõ quyền ở kho riêng, không tự đưa vào kho chung.
- [ ] **CV-042 — Trộn câu, lựa chọn và nhóm ngữ liệu.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F3 trộn 4 mã, tải 4 tệp Word đủ 7 câu/ảnh; unit answer_review_and_shuffle. Giới hạn: tái lập theo seed và nhóm ngữ liệu nhiều mã chưa kiểm trên giao diện. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - **Hiện trạng24/10:** Browser trộn và tải đủ các mã, đối chiếu Word có đủ câu/ảnh; giữ helper ghim/seed và dữ liệu gốc đã kiểm trước. Chưa đầy đủ nhóm ngữ liệu/seed qua UI và mọi tổ hợp; giữ mở. [PILOT_E2E](../../qa/rebuild-2026-10-24/PILOT_E2E.md).
  - Phạm vi: YC-17. Nghiệm thu: NT-17.
  - Đạt khi: Seed tái lập, ghim và mọi loại câu giữ đủ; ID đáp án đúng sau đảo; không thay chữ cái bằng regex làm hỏng lời giải.
- [ ] **CV-043 — Xuất Word và công thức/hình.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F3 Word bàn soạn, 4 mã và Song song (ZIP/XML/media); unit portable_and_exports. Giới hạn: chưa mở trực quan bằng Microsoft Word, công thức/tài liệu dài. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - **Hiện trạng25/10:** Word Song song đã xuất hai cột, giữ thứ tự câu/đáp án và ngữ liệu chung một lần; thu ảnh đúng tỷ lệ, ngữ liệu toán dùng công thức Word. Kiểm ZIP/XML đạt; chưa kiểm trực quan Word dài, phân trang hoặc bản in. Giữ các bằng chứng xuất/trộn trước; CV mở. [Báo cáo nhóm](../../qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md).
  - Phạm vi: YC-12, YC-18. Nghiệm thu: NT-18.
  - Đạt khi: Tài liệu mở sửa được, đủ câu/hình/điểm/nguồn hiển thị, fallback có nhãn; kiểm công thức và ngắt trang trực quan.
- [ ] **CV-044 — In/PDF và các biến thể xuất.**
  - Phạm vi: YC-12, YC-18. Nghiệm thu: NT-18.
  - Đạt khi: Đề/đáp án/lời giải/ma trận riêng hoặc chung, 1–2 cột khi phù hợp, tiêu đề mẫu đồng nhất; câu dài được ngắt có kiểm soát, không tràn/mất.
- [ ] **CV-045 — Trình chiếu để chữa bài.**
  - **Hiện trạng25/10:** Bổ sung chọn nhanh câu, cỡ chữ và tránh chiếm phím mũi tên trong select/ô nhập; chuyển câu ẩn lại đáp án. Render kiểm mặc định ẩn đạt; browser mới chưa chạy vì Docker/DB thử chưa sẵn sàng. Chưa nghiệm thu zoom/bàn phím hoặc hiện từng bước lời giải; giữ mở. [Báo cáo nhóm](../../qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md).
  - Truy vết24/10: bằng chứng một phần ở [WORKSPACE](../../qa/rebuild-2026-10-22/WORKSPACE.md) và `presentation-verified.png` — chuyển câu, xem ngữ liệu, chủ động hiện/ẩn đáp án/lời giải, quay lại không làm bẩn bản đã lưu. Chưa kiểm phóng to/bàn phím đầy đủ; giữ mở.
  - Phạm vi: YC-18. Nghiệm thu: NT-19.
  - Đạt khi: Phóng to câu, hiện dần lời giải, ẩn đáp án ban đầu, điều khiển bàn phím; không làm đổi nội dung đề.
- [ ] **CV-046 — Bộ fixture đa môn cho nhập/xuất.**
  - Phạm vi: YC-10, YC-18, YC-27. Nghiệm thu: NT-16, NT-18, NT-28.
  - Đạt khi: Công thức Toán/Lý/Hóa, ngữ liệu dài, bảng số liệu/bản đồ, hình, câu tiểu học; tất cả kết quả gắn file xuất và ảnh kiểm.

## S6 — Chia sẻ và cộng tác

- [ ] **CV-047 — Ma trận quyền chia sẻ.**
  - Phạm vi: YC-14, YC-19. Nghiệm thu: NT-06, NT-20.
  - Đạt khi: View/comment/edit/download/fork/publish phân biệt, mặc định private; public view không cấp edit/key; server kiểm từng thao tác.
- [ ] **CV-048 — Link xem, thu hồi và phiên bản chia sẻ.**
  - **Hiện trạng25/10:** Copy theo phiên bản nguồn đã có trong mã và kiểm HTTP: nguồn đổi thì yêu cầu xem lại, sao chép phiên bản mới thành bản riêng, retry không nhân bản; không phải tính năng chưa làm. Giữ khóa Exam/ShareLink/Question và kiểm quyền lại. Publication snapshot riêng vẫn mới là thiết kế C04, chưa triển khai schema; ảnh ngoài kho và toàn UI còn mở. [Báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-19. Nghiệm thu: NT-06, NT-20.
  - Đạt khi: Link dùng ID/quyền riêng, chính sách đáp án, hết hạn/thu hồi; bản công bố không vô tình trỏ nháp.
- [ ] **CV-049 — Cùng sửa đồng thời.**
  - Bổ sung23/10: HTTP hai phiên cùng nền, reorder đối đầu xóa/sửa câu–lời giải: một200/một409, mở lại khớp nguyên người thắng. Không partial merge; còn undo/UI/nhiều browser và toàn tiêu chí.
  - Phạm vi: YC-19. Nghiệm thu: NT-20.
  - Đạt khi: Sửa khác/cùng khối, thay cấu trúc câu, reorder, undo từng người; không last-write-wins mất dữ liệu.
- [x] **CV-050 — Mất mạng, reconnect và thu hồi quyền đang mở.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Đồng bộ không nhân đôi/mất: F9 (Chrome và Edge) và http_workflows "structural edits conflict without partial merges and revoked writers cannot retry". Quyền kiểm lại khi gửi, editor bị thu hồi không ghi: "collaboration honors view, edit, CAS, history and revocation" và F4. Giới hạn: hai engine sửa đồng thời, mở ứng dụng từ đầu khi hoàn toàn offline. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng25/10:** Giữ các kiểm hồi đáp trễ, owner/writer/ACK và thu hồi quyền trước. Browser thêm mất mạng, reconnect khi có phiên khác sửa, giữ bản máy chủ và cất nháp thành bản phục hồi; Chrome/Edge kiểm độc lập theo lượt. F4 còn kiểm thu hồi editor đang mở. Chưa hai engine sửa đồng thời hoặc mọi race quyền/ghi; giữ mở. [Báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-13, YC-19. Nghiệm thu: NT-20.
  - Đạt khi: Đồng bộ không nhân đôi/mất, quyền kiểm lại khi gửi thay đổi; editor bị thu hồi không tiếp tục ghi.
- [ ] **CV-051 — Góp ý và lịch sử tác giả.**
  - Phạm vi: YC-19. Nghiệm thu: NT-20.
  - Đạt khi: Bình luận theo câu/phiên bản, giải quyết góp ý, xem ai đổi gì, phục hồi không xóa lịch sử; AI action gắn người yêu cầu.
- [ ] **CV-052 — Ngân hàng chung và nhân bản.**
  - Phạm vi: YC-14. Nghiệm thu: NT-06, NT-07.
  - Đạt khi: Tác giả/origin/version giữ đúng, sửa bản sao không đổi gốc, gỡ chia sẻ không phá bản sao hợp lệ; quyền dùng lại được kiểm.
- [ ] **CV-053 — AI trong phiên cộng tác.**
  - Phạm vi: YC-03, YC-19. Nghiệm thu: NT-09, NT-20.
  - Đạt khi: Người bấm dùng key của mình; không lộ key chủ đề; kết quả AI so version hiện tại trước apply, không ghi đè sửa mới của đồng nghiệp.

## S7 — Giao bài, làm và chấm

- [ ] **CV-054 — Cấu hình bài giao và snapshot.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F5 giao có/không lớp, đặt giờ/lượt/mã/trộn rồi đối chiếu DB; HTTP assignment options; snapshot bất biến. Giới hạn: chưa giao diện sửa sau khi giao; PIN thực của học sinh mới ở HTTP. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - **Hiện trạng24/10:** Đã tích hợp tùy chọn giao bài nâng cao của Claude; browser giao có/không lớp, đặt thời gian/lượt/mã/trộn, đối chiếu bản lưu; API kiểm giá trị sai và account pin. Giữ snapshot và kiểm quyền trước. Chưa mọi enum/chính sách/tệp, UI xem lại giờ đã giao; giữ mở. [PILOT_E2E](../../qa/rebuild-2026-10-24/PILOT_E2E.md).
  - Phạm vi: YC-20. Nghiệm thu: NT-21.
  - Đạt khi: Enum/API/import thống nhất, nhóm tùy chọn đúng nhận diện; snapshot đủ câu/đáp án/tệp/điểm/mẫu và bất biến.
- [x] **CV-055 — Nhận diện và phiên lượt làm.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** FREE_NAME, danh sách, mã vào bài, PIN và link cá nhân kiểm ở máy chủ: http_assignment_options (mã) và http_student_identity (PIN thiếu/sai/chưa đặt, học sinh lớp khác, token sai/của lớp khác, ID không thay token; refusal không tạo lượt). Người biết ID không đọc/sửa/nộp bài khác: public_access "attempt token binds attempt, student, assignment and creation time", http_public_policies "capabilities cannot cross attempts". Giới hạn: PIN do giáo viên đặt ở quản lý lớp. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - Phạm vi: YC-20, YC-21. Nghiệm thu: NT-21, NT-22.
  - Đạt khi: FREE_NAME/danh sách/mã có kiểm server, membership và PIN nếu bật; người biết ID không được đọc/sửa/nộp bài khác.
- [ ] **CV-056 — Thời gian, số lượt và cạnh tranh start.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F5 chờ qua giờ đóng thật rồi học sinh bị từ chối, không tạo lượt; HTTP times/attempts. Giới hạn: chưa kiểm start đồng thời nhiều máy, dung sai nộp bài ở giao diện. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - **Hiện trạng24/10:** Giữ HTTP/PG start đồng thời/cookie khác/grace đã kiểm. Bổ sung UI đặt giờ đóng và chờ đồng hồ thật: vào sau hạn bị từ chối, không tạo lượt. API kiểm thời gian/số lượt/mã/PIN đạt; tương thích mã legacy đã gửi Claude, gia hạn/mở lại/hai browser vẫn mở. [PILOT_E2E](../../qa/rebuild-2026-10-24/PILOT_E2E.md).
  - Phạm vi: YC-20, YC-21. Nghiệm thu: NT-22.
  - Đạt khi: Kiểm opensAt/closesAt/deadline/status, lượt hết hạn xử lý rõ; start đồng thời không tạo trùng hoặc lỗi unique vô nghĩa.
- [x] **CV-057 — Lưu nháp và resume thật.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Kiểm res.ok và trạng thái mạng: student_network (4 ca). Reload lấy đúng nháp và bản chậm không ghi đè: http_workflows (hai nháp tranh nhau, bản cũ 409), attempt_draft_revision, student_draft_journal, F6. Giới hạn: đổi sang thiết bị khác, hai trình duyệt độc lập. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng24/10:** journal riêng từng trang, giữ nhiều bản/raw hỏng/nhập JSON chỉ xem-chọn và không rebase; tự nộp khi conflict chỉ dùng draft máy chủ. Thêm timeout bao gửi/đọc body, lỗi nộp có retry và tải bản dự phòng ngoài vùng khóa khi hết giờ; mobile thấy trạng thái lưu. Build/SAFE/HTTP thử đạt. UI mới, offline thật/hai browser/đổi máy/late ACK chưa kiểm do CUA lỗi. Không đóng CV. [RESTORE_NETWORK_SHARE](../../qa/rebuild-2026-10-24/RESTORE_NETWORK_SHARE.md).
  - Phạm vi: YC-21. Nghiệm thu: NT-04, NT-23.
  - Đạt khi: Method/body chuẩn, kiểm res.ok, trạng thái mạng; reload lấy đúng nháp, không ghi đè câu mới bởi request chậm.
- [ ] **CV-058 — Giao diện làm bài đủ dạng.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F6 làm đủ bảy dạng, tải lại làm tiếp, nộp, không thấy đáp án trước chính sách; public_access/structured_grading. Giới hạn: bàn phím/màn hình nhỏ, âm thanh, hình nâng cao. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - Phạm vi: YC-10, YC-21. Nghiệm thu: NT-16, NT-23.
  - Đạt khi: Tự luận có ô trả lời, đúng-sai/điền/ghép/sắp xếp dùng được, tệp/hình/âm thanh theo đề; cuộn/keyboard/mobile đúng.
- [x] **CV-059 — Chấm server và nộp lặp an toàn.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Zero/false/blank phân biệt và đáp án thiếu không nhận blank đúng: public_access, structured_grading, manual_grading (accepted_answers theo câu). Nộp đồng thời một kết quả: http_student_identity (đã tìm và sửa lỗi 503 do P2010/40001). Điểm đúng chính sách ở mọi nhánh: http_public_policies. Giới hạn: biểu thức tương đương chỉ qua danh sách đáp án chấp nhận của từng câu. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng24/10:** giữ CAS/row-lock/retry nộp an toàn và response/snapshot. Đã sửa submit lưu tổng null cho survey/comment_only/rubric thay vì0 giả; bài scored tổng/tối đa0 vẫn giữ0. HTTP kiểm GET và submit lặp theo chính sách hiện tại, không sửa bài đã nộp. Nhánh student/group lưu trữ chặn cả nộp lặp. Chưa tổng nghiệm thu mọi dạng/UI, giữ mở. [PUBLIC_POLICIES_AND_NONNUMERIC](../../qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md).
  - Phạm vi: YC-09, YC-21, YC-22. Nghiệm thu: NT-24.
  - Đạt khi: Zero/false/blank phân biệt, số/biểu thức theo câu, đáp án thiếu không nhận blank đúng; submit đồng thời một kết quả, trả điểm đúng chính sách ở mọi nhánh.
- [ ] **CV-060 — Chấm tay, đính chính và điểm chốt.**
  - **Hiện trạng24/10:** Giữ CAS/row-lock/audit/restore và nháp chấm đã kiểm trước. Browser mới xem bài, chấm tự luận và nhận xét, receipt giữ đúng bản gửi, tổng đúng; API hồi quy đạt trên DB thử. Chưa rubric phức tạp/chấm đồng thời/regrade/đính chính, không đóng CV. [PILOT_E2E](../../qa/rebuild-2026-10-24/PILOT_E2E.md).
  - Phạm vi: YC-22. Nghiệm thu: NT-24, NT-25.
  - Đạt khi: Tự luận pending, chỉnh rubric/điểm có lịch sử, regrade có phạm vi/phiên bản; bài cũ không đổi ngầm khi sửa ngân hàng.
- [ ] **CV-061 — Theo dõi, phản hồi và bảng điểm.**
  - **Mức pilot25/10: đạt trong phạm vi pilot** (theo quy tắc chủ dự án duyệt 24/10; không đổi dấu hoàn thành, không thay "Đạt khi"). Kiểm tự động: F7 xem bài, chấm tự luận, CSV có tổng và nhận xét; HTTP workflows CSV. Giới hạn: gia hạn/mở lại bài, nhiều chính sách nhận xét. [Chạy 25/10](../../qa/rebuild-2026-10-25/PILOT_CLAUDE_RUN.md).
  - **Hiện trạng25/10:** Bổ sung nhận xét từng câu vào CSV bài có điểm, giữ cột điểm cũ; bài không số vẫn giữ đánh giá/nhận xét, không tạo điểm giả. Có kiểm chống công thức CSV, dấu phẩy/ngoặc kép/xuống dòng và quyền xuất. Chưa toàn UI bài không số, gia hạn/mở lại hoặc mọi chính sách; giữ mở. [Báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-20, YC-22. Nghiệm thu: NT-25.
  - Đạt khi: Danh sách bài/lượt, progress, gia hạn/mở lại có quyền, thống kê/CSV; leaderboard tùy chọn mặc định tắt và không lộ toàn lớp.
- [x] **CV-062 — Hồi quy link và toàn luồng học sinh.**
  - **Nghiệm thu25/10 (Claude): ĐẠT đủ tiêu chí "Đạt khi".** Khách (cookie bắt buộc), giáo viên khác (404), link cũ (http_student_identity: link thu hồi/hết hạn 404, thu hồi không đăng nhập bị từ chối), đã đóng và đã nộp (http_public_policies, F5), AFTER_CLOSE/NEVER (http_public_policies), không lộ lời giải trong payload/CSV (public_access, http_workflows). Giới hạn: tệp Word đã xuất ra ngoài không thuộc học sinh. [Đối chiếu](../../qa/rebuild-2026-10-25/CV_CLOSURE_REVIEW.md).
  - **Hiện trạng24/10:** HTTP/PG thử bổ sung ma trận NEVER ở OPEN/CLOSED/ARCHIVED, AFTER_CLOSE theo trạng thái/thời gian, IMMEDIATE; GET và submit idempotent áp dụng quyền hiện tại. Link đề luôn bỏ lời giải, bảng xếp hạng không hiện khi ẩn điểm và top có ẩn tên; cookie thiếu/sai/lượt khác bị chặn. Student/group lưu trữ không dùng capability cũ, teacher vẫn xem dữ liệu. Chưa UI/hai browser/race archive đang ghi/toàn bộ reveal combinations, giữ mở. [PUBLIC_POLICIES_AND_NONNUMERIC](../../qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md).
  - Phạm vi: YC-19, YC-20, YC-21, YC-22. Nghiệm thu: NT-06, NT-21, NT-22, NT-24, NT-25.
  - Đạt khi: Thử khách, giáo viên khác, link cũ, đã đóng, đã nộp, AFTER_CLOSE/NEVER; không lộ lời giải trong payload/metadata/file khi chưa được phép.

## S8 — Tri thức và trợ lý

- [ ] **CV-063 — Phân tích có cấu trúc và bản đọc được.**
  - Phạm vi: YC-23, YC-25. Nghiệm thu: NT-26.
  - Đạt khi: Lưu nguồn/version/trang/câu, nhận xét/bằng chứng/điều chưa chắc; Markdown liên kết dữ liệu gốc, không chỉ một đoạn chat.
- [ ] **CV-064 — Bộ nhớ cá nhân có quyền kiểm soát.**
  - **Hiện trạng24/10:** Đã mount journal riêng từng owner/writer trong ghi chú AI: chọn khôi phục, xác nhận thay form, ACK đúng nội dung mới dọn bản gửi, giữ chữ gõ sau gửi; có tải raw/RAM. Nhãn ghi chú riêng không hứa AI tự học hay xác nhận chuyên môn. Helper/render tĩnh/build/API DB thử đạt; UI mới, chất lượng dùng ghi chú và tiêu chí còn lại chưa nghiệm thu. [DRAFT_RECOVERY_INTEGRATION](../../qa/rebuild-2026-10-24/DRAFT_RECOVERY_INTEGRATION.md).
  - Phạm vi: YC-23. Nghiệm thu: NT-26.
  - Đạt khi: Sở thích khác kiến thức đã duyệt, xem/sửa/xóa/không dùng lại; không tự gắn QUESTION_VERIFIED từ confidence.
- [ ] **CV-065 — Đóng góp kho chung chủ động.**
  - Phạm vi: YC-23, YC-25. Nghiệm thu: NT-26.
  - Đạt khi: Preview bản chia sẻ, loại dữ liệu riêng không cần, kiểm quyền nguồn, review/thu hồi; không public toàn bộ chat/tài liệu gốc.
- [ ] **CV-066 — Cập nhật nguồn và vòng đời mẫu.**
  - Phạm vi: YC-23, YC-25. Nghiệm thu: NT-11, NT-26.
  - Đạt khi: Nguồn mới/thay thế/thu hồi đánh dấu phân tích phụ thuộc cần xem lại; công khai label đúng phạm vi/hiệu lực.
- [ ] **CV-067 — Truy xuất và trợ lý trong quyền.**
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

- [ ] **CV-070 — Hoàn thiện danh mục môn/lớp và gói nguồn.**
  - Phạm vi: YC-04, YC-07, YC-25, YC-27. Nghiệm thu: NT-11, NT-28.
  - Đạt khi: Mỗi gói có trạng thái/tài liệu/khả năng/người duyệt hoặc thiếu người; không để các môn ngoài Toán biến mất khỏi bảng.
- [ ] **CV-071 — Duyệt chuyên môn và dùng thử.**
  - Phạm vi: YC-27, YC-29. Nghiệm thu: NT-28, NT-30.
  - Đạt khi: Tuyển reviewer theo môn/cấp khi có, nhận mẫu được phép; ghi sửa đổi và vấn đề chưa đồng thuận, không tự ký thay giáo viên.
- [x] **CV-072 — Backup/restore và cảnh báo lỗi.**
  - Nghiệm thu local23/10: gói mới tạo qua backup.ps1, khôi phục qua restore.ps1 tới DB mới và từ chối ghi đè/native nonzero. App production từ bản phục hồi đăng nhập/lưu/mở đề/điểm0/lời giải và6tệp hashkhớp; rekey chỉ bản sao/nguồn24bảng không đổi. Guard gói hỏng/path/retention đạt, SAFE141/typecheck mới; retention chỉ review/không xóa theo yêu cầu giữ dữ liệu. [OPERATIONS_REHEARSAL](../../qa/rebuild-2026-10-23/OPERATIONS_REHEARSAL.md), [app](../../qa/rebuild-2026-10-23/restored-app-verification.json), [runbook](../van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md). Không gộp cutover/RPO/RTO/chuyển máy thuộc CV073 vào kết luận local này. Các đợt trước nghiệm thu đã chuyển sang [lịch sử theo đợt](../lich-su/CHECKLIST_THEO_DOT_2026-10-22_24.md).
  - Phạm vi: YC-24. Nghiệm thu: NT-27.
  - Đạt khi: DB+tệp+khả năng giải mã phục hồi vào môi trường trống; kiểm native exit code script, backup rỗng không báo tốt; retention/đường xóa an toàn.
- [ ] **CV-073 — Chốt vận hành local và phương án pilot.**
  - **Hiện trạng25/10:** sao lưu/khôi phục thật bằng PowerShell5.1 đã đạt ở đợt trước, gồm sửa fallback DPAPI khi thiếu pwsh; không còn là việc chờ chạy. Kế thừa [PILOT_CLAUDE_INTEGRATION](../../qa/rebuild-2026-10-24/PILOT_CLAUDE_INTEGRATION.md), không chạy lại chỉ vì sửa hồ sơ. Còn RPO/RTO, nơi giữ bản thứ hai, chuyển máy/mất DPAPI và đọc chéo gói PowerShell7; giữ mở.
  - Phạm vi: YC-24. Nghiệm thu: NT-27.
  - Đạt khi: Runbook secrets/config/log/restore, tài khoản chịu trách nhiệm; mục tiêu RPO/RTO, dung lượng và chi phí có chủ dự án duyệt trước triển khai thật.

- [ ] **CV-074 — CI, kiểm tải và giám sát.**
  - **Hiện trạng25/10:** Đã đo lưu đề mẫu trên DB thử; CI thêm DB thử riêng, migration, integration và HTTP sau build, giữ chạy tuần tự giới hạn RAM; không tự tải log ra ngoài. Các lệnh tương ứng kiểm local, YAML đọc được; workflow remote chưa chạy vì chưa push. Chưa đo tải nhiều người hay giám sát vận hành đầy đủ; giữ mở. [Báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-01, YC-24, YC-29. Nghiệm thu: NT-05, NT-29.
  - Đạt khi: CI dùng DB thử và fail thật, health/error/usage không lộ dữ liệu; tải đo trên kịch bản xác định, không hứa công suất chưa đo.
- [ ] **CV-075 — Thiết kế kết nối Drive tùy chọn.**
  - Phạm vi: YC-24. Nghiệm thu: NT-27.
  - Đạt khi: Chốt backlog/định dạng/quyền tối thiểu/trạng thái backup/restore; chỉ triển khai kết nối khi được chọn, không yêu cầu Drive để dùng app. Không đánh dấu tích hợp hoàn thành nếu mới thiết kế.
- [ ] **CV-076 — Hướng dẫn giáo viên và kiểm dễ dùng.**
  - **Hiện trạng25/10:** Đã rút gọn hướng dẫn giáo viên, bỏ tham chiếu mã nguồn và lời hứa tuyệt đối; làm rõ lưu form/lưu đề, quyền chia sẻ, Word Song song, nháp offline và sao lưu kho khác gói đầy đủ. Sửa nhãn xác nhận nộp bài và cách kiểm reload trong thẻ kiểm. Chưa có quan sát giáo viên thật; giữ mở. [Hướng dẫn](../huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md), [báo cáo đợt](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md).
  - Phạm vi: YC-26, YC-29. Nghiệm thu: NT-30.
  - Đạt khi: Hướng dẫn ngắn key, soạn, đáp án, cùng sửa, giao bài, khôi phục; người mới thực hiện nhiệm vụ, sửa ngôn ngữ/điểm ngợp theo quan sát.
- [ ] **CV-077 — Dọn đường cũ và cập nhật tài liệu.**
  - **Hiện trạng24/10 (dọn hồ sơ):**
    - Đã làm: ghi chú mốc chuẩn bị đã qua ở đầu 08/05/07; sửa nơi lưu bằng chứng trong checklist; `.rgignore` đưa báo cáo lịch sử, `qa/` gốc, log/DOM dump và danh mục nghiên cứu lớn ra khỏi tìm kiếm mặc định (không xóa); `tmp/` vào `.gitignore`; nhật ký theo đợt của checklist, hồ sơ 02 cũ và thông báo tiến độ cũ chuyển nguyên văn vào `docs/lich-su/`.
    - Đã làm thêm cùng ngày: `/test/[id]` bỏ nút dẫn tới `/room` không tồn tại; 103 liên kết tuyệt đối `F:/…` trong22tệp đổi thành liên kết tương đối (còn 18 tham chiếu `tệp:dòng` cũ trong báo cáo V1–V3 và7liên kết trỏ ra ngoài repo `F:/Downloads`, `.codex`, giữ nguyên vì là nguồn gốc); 38 báo cáo cũ trong `qa/` gốc và `qa/reports/` có ghi chú lịch sử đầu tệp (`FIX_REPORT.md` có nội dung gốc trùng `BAO_CAO_SUA_LOI.md`, giữ cả hai).
    - Còn mở: chưa rà caller/dữ liệu để dọn đường cũ (route `/c/[groupCode]`, `db.ts` cục bộ, hàm trùng); chưa đổi tên/tách hồ sơ V1–V3 sang thư mục lưu trữ.
  - Phạm vi: YC-29, YC-30. Nghiệm thu: NT-01, NT-03, NT-31.
  - Đạt khi: Rà caller/dữ liệu/link trước bỏ; tài liệu không còn hứa 7-key/100% sai; xóa/hạ schema chỉ sau migration/rollback đã kiểm.
- [ ] **CV-078 — Tổng nghiệm thu và quyết định phát hành.**
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
