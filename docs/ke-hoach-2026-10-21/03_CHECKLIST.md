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

Ngày: 21/10/2026. [Mục lục](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md).

**Đã bắt đầu triển khai22/10/2026; trạng thái theo từng mục và [báo cáo tiến độ](../TIEN_DO_CAI_TIEN_EXAMCRAFT.md).** Có sẵn code không đủ đánh dấu xong. Chủ trì kỹ thuật là người/AI thực hiện; chủ dự án chốt sản phẩm/chi phí, người duyệt chuyên môn ký phần nội dung.

Mã YC tra ở 01, NT tra ở 04. Mỗi CV ghi bằng chứng theo mẫu cuối file. CV có thể chia nhỏ khi làm nhưng phải giữ mã cha và không bỏ tiêu chí. Tùy chọn Drive có thể hoàn thành bước thiết kế/backlog, không được báo đã tích hợp.

## S0 — Chuẩn bị và baseline

- [x] **CV-001 — Ghi baseline và bảo toàn working tree.**
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
  - Đợt phản hồi23/10: hook React production/storage thật với API hàng đợi giả; sửa B trong khi A đang lưu→ack A không đè B→B lưu tiếp baseVersion2đạt. Chuyển tài khoản trước ack giữ UI/cache B và nháp A riêng. Không mạng thật/hai browser độc lập, giữ mở. [DELAYED_SAVE](../../qa/rebuild-2026-10-23/DELAYED_SAVE.md).
  - Đợt mất kết nối23/10: tắt đúng server QA, sửa/lưu báo lỗi và giữ nháp; bật lại/mount tab mới phục hồi count2và lưu thật vào DB thử, giữ câu/ảnh/lời giải/điểm0. Tab cũ báo xung đột thay ghi đè. Không là airplane mode/tải app khi server tắt/hai browser độc lập, giữ mở. [NETWORK_OUTAGE](../../qa/rebuild-2026-10-23/NETWORK_OUTAGE.md).
  - Đợt ô writer23/10: ghi ô riêng từng writer trước con trỏ chung, retire riêng thay removeItem new dùng chung. Unit đọc ô chung stale/quota/retire đạt; hai tab localStorage thật giữ A/B sau reload và ack B còn A. Build/SAFE143đạt; còn UI React/offline/hai browser độc lập/phản hồi muộn. [WRITER_SLOTS](../../qa/rebuild-2026-10-23/WRITER_SLOTS.md), giữ mở.
  - Đợt tiếp nối23/10: writer riêng mỗi lần mở bàn soạn, archive nháp khác trước thay ô/cache; lỗi archive dừng ghi. SAFE20+108 và build đạt. Chưa có giao dịch storage nguyên tử giữa nhiều tab; [TABS_AND_REVOCATION](../../qa/rebuild-2026-10-23/TABS_AND_REVOCATION.md), giữ mở.
  - Cập nhật23/10: Docker đã hoạt động; DB7/7 và browser hai tab đã kiểm giữ nháp khi xung đột → mở server → phục hồi nháp thành đề mới, giữ cả lời giải, đề gốc không đổi. Poll bắt buộc tài khoản kỳ vọng. SAFE20+105 đạt; kết quả bản dựng/API cuối và giới hạn tại [RECOVERY23/10](../../qa/rebuild-2026-10-23/RECOVERY.md), [verification.json](../../qa/rebuild-2026-10-23/verification.json). Chưa đủ offline/hai trình duyệt độc lập, giữ mở.
  - Đã có helper nháp tách tài khoản, CAS hai transaction và guard dự kiến người dùng; giữ mở vì chưa đủ QA offline/reconnect/hai trình duyệt và tab cũ theo mọi kịch bản.
  - Phạm vi: YC-13. Nghiệm thu: NT-04, NT-20.
  - Đạt khi: Nháp phục hồi sau reload, tách tài khoản, có version conflict; bản đến muộn không ghi đè bản mới, không đồng bộ sang sai tài khoản.
- [ ] **CV-011 — Quyền đối tượng và liên kết.**
  - Bổ sung24/10: Copilot/tweak/verify pin tài khoản ở client và chặn sai tài khoản tại server trước body/khóa/provider; HTTP17/17mới kiểm cả anonymous/cross-origin/pin đúng với body sai, không tăng usage. Chỉ DB thử; chưa đóng toàn bộ CV. [COPILOT_GUARDS](../../qa/rebuild-2026-10-23/COPILOT_GUARDS.md).
  - Đợt đối tượng23/10: pin tài khoản folder/group/ngân hàng/key/usage; same-origin khi ghi, lọc liên kết/số lượng theo chủ, chặn xóa folder có dữ liệu cũ khác chủ. HTTP16/16mới và SAFE151/build45trang đạt; UI thêm học sinh→reload giữ danh sách. Còn template/quyền toàn diện và phản hồi UI chậm, giữ mở. [OBJECT_ACCESS](../../qa/rebuild-2026-10-23/OBJECT_ACCESS.md).
  - Bổ sung23/10: kiểm tài khoản kỳ vọng ở GET đề, cộng tác/góp ý/lịch sử và các thao tác tương ứng; test sai tài khoản không tạo góp ý/đổi quyền. Quyền đối tượng vẫn kiểm ở server; chưa đóng toàn bộ CV từ một nhóm endpoint. Bằng chứng đợt tại RECOVERY23/10.
  - Phạm vi: YC-01, YC-19, YC-24. Nghiệm thu: NT-05, NT-06.
  - Đạt khi: Kiểm quyền folder/question/template/exam/group ở server, xét quyền cộng tác thay vì chỉ owner; thử hai giáo viên và dữ liệu riêng.
- [x] **CV-012 — Đóng các đường lộ đáp án/ghi lượt không có quyền.**
  - Bằng chứng nền22/10: allowlist/đề chia sẻ/link thực, snapshot bất biến, attempt cookie ký gắn người–bài–lượt, từ chối thiếu cookie/cross-origin; nộp lặp và chính sách ẩn đáp án được kiểm bằng helper + [HTTP](../../qa/rebuild-2026-10-22/http_workflows.json). UX và ca mở rộng tiếp ở S7.
  - Phạm vi: YC-19, YC-20, YC-21. Nghiệm thu: NT-06, NT-21.
  - Đạt khi: Rà public share và route legacy; dùng allowlist dữ liệu người làm; không dùng attemptId công khai làm quyền ghi; hoàn thiện UX tiếp ở S7.
- [x] **CV-013 — Củng cố tài khoản và bảo vệ key.**
  - Bổ sung23/10: quản lý/test key và nhật ký usage dùng tài khoản UI đã chụp; server trả409 khi tab cũ có phiên tài khoản mới trước khi đọc/ghi/gọi provider. HTTP đạt, không gọi AI thật; xem OBJECT_ACCESS. Không xoay bí mật DB chính.
  - Bổ sung23/10: giao diện chỉ chuyển sau khi server xác nhận logout; lỗi mạng/HTTP/ack giữ giao diện và báo lỗi. Tab cũ không được logout phiên của tài khoản mới; helper có2ca bổ sung và assertion HTTP. Xem RECOVERY23/10; production/rekey vẫn chưa nghiệm thu.
  - Bằng chứng local22/10: [auth5caHTTP](../../qa/rebuild-2026-10-22/http_auth.json), helper auth và BYOK kiểm bắt đổi mật khẩu, đổi mật khẩu thu hồi phiên khác, logout, admin reset/disable/reenable không hồi sinh phiên, rate limit bền vững; secret không nằm trong JSON bằng chứng. Production/rekey vẫn là cổng riêng: không xoay khóa mã hóa cũ trước kế hoạch bảo toàn/decrypt–reencrypt và chưa triển khai production.
  - Phạm vi: YC-01, YC-03, YC-24. Nghiệm thu: NT-05, NT-09.
  - Đạt khi: Đổi mật khẩu bắt buộc ở API, đăng xuất/khóa vô hiệu phiên, rate limit phù hợp runtime; key không xuất hiện trong response/log công khai.
- [ ] **CV-014 — Thử migration có mapping và chạy lặp an toàn.**
  - Đợt nhiều lượt23/10: dấu SHA256 nguồn trong snapshot đầu, không dựa bản server đã sửa để coi trùng; nguồn khác/thiếu dấu có xem trước và xác nhận bản sao riêng, retry không nhân đôi. Advisory lock kiểm hai request khác nguồn; UI nhập1bản sao/giữ1lỗi. SAFE138/build/HTTP16đạt. Không tự đoán/bổ sung dấu cho bản cũ; [CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md), giữ mở cho toàn tiêu chí.
  - Đợt browser/IDB23/10: JSON hỏng sau preview đã xác nhận gỡ nút/checkbox; tải/chọn lại phần2của kho101đề. IndexedDB thật giữ bản cũ/retry/rollback hai store đạt. API chặn mọi biến thể cùng ID khác nội dung trong một request; SAFE137/build/HTTP16đạt,4lỗi/0ghi ở preview và import. Còn khác lượt/tệp, UI tách biến thể và toàn luồng local→server; [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md), giữ mở.
  - Đợt giới hạn23/10: parser JSON/BOM/cấu trúc/phiên bản/số mục và reset preview khi chọn tệp mới; xuất chia100đề/30MB. SAFE136/build/HTTP16đạt; preview101đề chia100+1 không ghi DB. Chưa kiểm UI nhiều phần/tệp hỏng và IndexedDB thật; [BACKUP_LIMITS](../../qa/rebuild-2026-10-23/BACKUP_LIMITS.md), giữ mở.
  - Tiếp nối UI23/10: checkbox→nhập→mở đạt; archive thực4đề/3ảnh tải từ liên kết UI, chọn lại đúng file→3mục nhập/1đã chuyển/0lỗi; ảnh hiển thị hashkhớp/điểm0/lời giải. Chặn confirm cũ đã qua. [IMPORT_UI_ROUNDTRIP](../../qa/rebuild-2026-10-23/IMPORT_UI_ROUNDTRIP.md); giữ mở cho các tiêu chí còn lại.
  - Đợt UI/ảnh23/10: file chooser/preview thật1mục sẵn sàng1mục lỗi; thêm lối mở modal và thay confirm bằng checkbox. UI nhập/download cuối chưa xong do hộp native cũ chặn công cụ; không suy API thành UI. [IMPORT_UI_AND_IMAGES](../../qa/rebuild-2026-10-23/IMPORT_UI_AND_IMAGES.md), giữ mở.
  - Đợt nhập23/10: giữ mapping items/thứ tự/điểm0/ngữ liệu/hình/lời giải; HTTP xem trước không ghi, lỗi từng mục, nhập lặp không đè sửa máy chủ, sửa lỗi rồi resume, tách tài khoản. SAFE20+110/build và API16/16 đạt. Câu rời có ngữ liệu báo lỗi thay vì nhập thiếu; còn UI/IndexedDB/asset và đủ tiêu chí. [LEGACY_IMPORT](../../qa/rebuild-2026-10-23/LEGACY_IMPORT.md); giữ mở.
  - Phạm vi: YC-24, YC-30. Nghiệm thu: NT-03, NT-27.
  - Đạt khi: Đối chiếu số lượng/nội dung/quyền, import không nhân đôi, có báo mục lỗi và resume; restore thử trước chuyển thật.
- [ ] **CV-015 — Hợp nhất kho đề/ngân hàng với nguồn server.**
  - Đợt nhiều lượt23/10: đề và câu ngân hàng đối chiếu nguồn qua request sau; bản sao riêng có mã ổn định theo tài khoản/loại/nguồn/nội dung. Bản giáo viên đã sửa và revision giữ nguyên; còn nghiệm thu tổng thể kho/local/filter/trash/ngữ liệu. Xem CROSS_IMPORT_AND_FULL_RESTORE, giữ mở.
  - Đợt IDB thật23/10: harness origin riêng gọi thư viện production; giữ đề/câu cùng ID cũ, chỉ thêm ID thiếu, retry0; ghi câu thất bại rollback cả đề mới. Export giữ cả biến thể và đủ3nguồn lịch sử, không đổi nguồn; chưa là UI hợp nhất đầy đủ/kho/filter/trash. Xem BROWSER_AND_INDEXEDDB, giữ mở.
  - Bổ sung23/10: export/xem trước đọc cả IndexedDB và3nguồn localStorage; sao chép local chỉ thêm ID thiếu, không ghi đè/xóa nguồn. Test table/storage giả đạt; chưa kiểm transaction IndexedDB thật, xử lý cùng ID khác nội dung hoặc toàn bộ kho/filter/trash/restore. Xem LEGACY_IMPORT; giữ mở.
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
  - Đợt chat23/10: có API BYOK/quota dùng chung, mã/revision/sách/mapping được kiểm, bảng diff và nhận/hủy rõ ràng; đổi ngữ cảnh khóa đề nghị cũ. Build45trang/SAFE151/HTTP16đạt; component browser bằng kết quả giả qua preview→nhận→Apply/clarification đạt. Còn luồng AI thật→lưu/mở đầy đủ và đánh giá hiểu yêu cầu/chuyên môn, giữ mở. [SCOPE_CHAT](../../qa/rebuild-2026-10-23/SCOPE_CHAT.md).
  - Đã kiểm giao diện nhập/chọn include–exclude/giới hạn phương pháp, xem trước/áp dụng/lưu/tải lại; loại trừ ưu tiên và không tự mở rộng tiên quyết. Chưa có chat đề nghị scope. Xem qa/rebuild-2026-10-22/KNOWLEDGE_SCOPE.md.
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
  - Đợt mẫu24/10: envelope phiên bản/nguồn tự khai, save-as-new bất biến/retry và quyền nguồn; snapshot không cấp quyền đọc mẫu riêng. Build46trang/SAFE184/HTTP17đạt. UI lưu→preview→Apply→tùy chỉnh→bản mới/retry đạt; DB thử đúng2mẫu, hash mẫu gốc/câu/phần/plan không đổi, giữ ảnh/lời giải/điểm0. Nguồn tự khai/legacy chưa là thư viện đã duyệt; toàn tiêu chí vẫn mở. [PERSONAL_TEMPLATES](../../qa/rebuild-2026-10-23/PERSONAL_TEMPLATES.md).
  - Phạm vi: YC-06, YC-07, YC-12, YC-25. Nghiệm thu: NT-11, NT-14.
  - Đạt khi: Mẫu hệ thống/trường/tham khảo/cá nhân rõ, ngày áp dụng/version; sửa tạo bản riêng và ghi lệch ràng buộc, không giữ nhãn phù hợp sai.
- [ ] **CV-022 — Chuẩn bị dữ liệu tất cả nhóm môn.**
  - Phạm vi: YC-04, YC-25, YC-27. Nghiệm thu: NT-28.
  - Đạt khi: Có danh mục gói/nguồn/trạng thái thiếu theo cấp; tiến hành ngoài Toán, không đánh dấu duyệt nếu chưa có reviewer.

## S3 — Bàn soạn và trải nghiệm

- [ ] **CV-023 — Soạn đủ loại câu và thành phần.**
  - Đợt24/10: journal từng câu/writer, guard baseline khi Apply, giữ form/nháp và chặn Lưu đề còn câu chưa áp dụng; bảng tải/cất giữ nguồn. Build46trang/SAFE192đạt; browser đóng/mở/fresh-tab/reload/archive/hai tab đạt, DB giữ version/hash khi A stale và giữ B/ảnh/điểm0/plan. Còn toàn tiêu chí7dạng và ca khác; [QUESTION_DRAFTS_AND_MOBILE](../../qa/rebuild-2026-10-23/QUESTION_DRAFTS_AND_MOBILE.md).
  - Phạm vi: YC-08, YC-09. Nghiệm thu: NT-07, NT-08.
  - Đạt khi: Sửa lựa chọn/ý đúng-sai, thêm kiểu câu phù hợp, thứ tự/ghim; matching/ordering/fill_blank có cấu trúc đủ hoặc báo chưa hỗ trợ rõ.
- [ ] **CV-024 — Đề, đáp án và song song.**
  - Phạm vi: YC-09. Nghiệm thu: NT-07, NT-08.
  - Đạt khi: Ba chế độ cùng dữ liệu; đáp án/lời giải/rubric riêng nhưng gắn version, thiếu đáp án không tự điền đúng.
- [ ] **CV-025 — Lịch sử câu và kiểm định theo phiên bản.**
  - Bổ sung24/10: Undo/Redo Copilot sửa/thêm/bỏ có guard toàn nền/source/owner và ack trước chuyển mốc. Browser chuỗi2Undo/2Redo, parent từ chối/retry và source mới đạt; giữ B/0/ảnh/ID, version tăng. SAFE223/build46đạt. Stack còn RAM, chưa bền sau reload; [AI_JOURNAL_AND_HISTORY](../../qa/rebuild-2026-10-23/AI_JOURNAL_AND_HISTORY.md).
  - Đợt24/10: Undo so câu/ngữ cảnh và guard lại trong updater; tăng version/reset verified, sửa ghost history sau chuỗi Undo. Browser2Undo→sửa mới đúng1mốc; B sửa lời giải→Undo A bị chặn, DBversion/hash không đổi. Clone/move/lưu/reload giữ lời giải mới/ảnh/điểm0; offline sau Apply giữ journal đến serverSaved rồi mới cleanup. Build46trang/SAFE203/HTTP17/integration7đạt; lint tập trung đạt. Còn redo, lịch sử Undo bền và bảo vệ toàn luồng AI; [QUESTION_COMMANDS](../../qa/rebuild-2026-10-23/QUESTION_COMMANDS.md).
  - Phạm vi: YC-09, YC-13, YC-16. Nghiệm thu: NT-08, NT-15.
  - Đạt khi: Sửa dữ kiện đánh dấu cần kiểm lại, undo/redo và lưu mốc giữ liên kết; chọn lưu ngân hàng khác với lưu nháp.
- [ ] **CV-026 — Hình, công thức, bảng và ngữ liệu.**
  - Phạm vi: YC-10. Nghiệm thu: NT-16.
  - Đạt khi: Thành phần hiển thị/biên tập có ID, mất tệp báo chỗ thiếu, ngữ liệu dùng chung không nhân bản sai; giữ mô hình hình học/môn khác.
- [ ] **CV-027 — Mẫu trực quan và tùy chỉnh tiêu đề.**
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
  - Phạm vi: YC-03. Nghiệm thu: NT-09.
  - Đạt khi: Generate/tweak/OCR/Word/verify/memory đều lấy key theo người gọi và quyền dữ liệu; không fallback mock dưới nhãn kết quả AI thật.
- [ ] **CV-032 — Quản lý key và sử dụng minh bạch.**
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
  - Bổ sung24/10: pending câu/Copilot bền qua tải trang theo account/doc/writer; apply/discard cất bản đối chiếu có thể xem/tải thay vì mất nguồn. Browser fresh-page calls[], archive/stale/download JSON/account isolation đạt; quota/malformed/đúng raw có test. SAFE223/build46đạt; còn provider/chuyên môn/nhập proposal qua máy khác và toàn tiêu chí.
  - Đợt24/10: đề xuất câu và Copilot giữ preview khi stale/parent từ chối; đúng props ack mới đóng. Updater so toàn nền/ngữ cảnh/quyền để giữ sửa mới; sửa giữ0/hình/liên kết, thêm ID riêng/chưa điểm, bỏ đúng ID. SAFE214/HTTP17đạt, build46/typecheck và production chọn đúng mục tiêu/focus cuối đạt; DB thử/source giữ nguyên sau UI. Browser component thật/API giả kiểm retry/accept/Undo câu/race/thêm/bỏ; không gọi AI thật. Còn lịch sử/undo Copilot bền, chuyên môn và các luồng AI khác; [COPILOT_GUARDS](../../qa/rebuild-2026-10-23/COPILOT_GUARDS.md), [QUESTION_AI_REVIEW](../../qa/rebuild-2026-10-23/QUESTION_AI_REVIEW.md).
  - Phạm vi: YC-08, YC-09, YC-15. Nghiệm thu: NT-08, NT-15.
  - Đạt khi: Đổi dữ kiện/câu/lời giải đúng vùng, giữ tiêu đề giáo viên đã sửa và hình liên quan; accept/reject/undo có lịch sử người yêu cầu.
- [ ] **CV-036 — Validator cấu trúc và toàn đề.**
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
  - Phạm vi: YC-11. Nghiệm thu: NT-16.
  - Đạt khi: Nguồn giữ được, câu tách rõ, phần không hiểu có nhãn; sửa trước lưu, không tự giải giả thành đáp án trích nguồn.
- [ ] **CV-040 — Nhập Word/ảnh và xử lý tài liệu dài.**
  - Phạm vi: YC-10, YC-11. Nghiệm thu: NT-16.
  - Đạt khi: Giữ hình/công thức/đoạn liên quan, thông báo cắt/thiếu, chia lô có thứ tự và chống trùng; OCR không đặt true mặc định.
- [ ] **CV-041 — Quyền và nguồn nhập.**
  - Phạm vi: YC-11, YC-25. Nghiệm thu: NT-16, NT-26.
  - Đạt khi: Ghi nguồn/trang/câu, dedup không xóa nhầm biến thể; tài liệu không rõ quyền ở kho riêng, không tự đưa vào kho chung.
- [ ] **CV-042 — Trộn câu, lựa chọn và nhóm ngữ liệu.**
  - Phạm vi: YC-17. Nghiệm thu: NT-17.
  - Đạt khi: Seed tái lập, ghim và mọi loại câu giữ đủ; ID đáp án đúng sau đảo; không thay chữ cái bằng regex làm hỏng lời giải.
- [ ] **CV-043 — Xuất Word và công thức/hình.**
  - Phạm vi: YC-12, YC-18. Nghiệm thu: NT-18.
  - Đạt khi: Tài liệu mở sửa được, đủ câu/hình/điểm/nguồn hiển thị, fallback có nhãn; kiểm công thức và ngắt trang trực quan.
- [ ] **CV-044 — In/PDF và các biến thể xuất.**
  - Phạm vi: YC-12, YC-18. Nghiệm thu: NT-18.
  - Đạt khi: Đề/đáp án/lời giải/ma trận riêng hoặc chung, 1–2 cột khi phù hợp, tiêu đề mẫu đồng nhất; câu dài được ngắt có kiểm soát, không tràn/mất.
- [ ] **CV-045 — Trình chiếu để chữa bài.**
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
  - Phạm vi: YC-19. Nghiệm thu: NT-06, NT-20.
  - Đạt khi: Link dùng ID/quyền riêng, chính sách đáp án, hết hạn/thu hồi; bản công bố không vô tình trỏ nháp.
- [ ] **CV-049 — Cùng sửa đồng thời.**
  - Bổ sung23/10: HTTP hai phiên cùng nền, reorder đối đầu xóa/sửa câu–lời giải: một200/một409, mở lại khớp nguyên người thắng. Không partial merge; còn undo/UI/nhiều browser và toàn tiêu chí.
  - Phạm vi: YC-19. Nghiệm thu: NT-20.
  - Đạt khi: Sửa khác/cùng khối, thay cấu trúc câu, reorder, undo từng người; không last-write-wins mất dữ liệu.
- [ ] **CV-050 — Mất mạng, reconnect và thu hồi quyền đang mở.**
  - Đợt phản hồi23/10: kiểm hook React bằng API có điều khiển thứ tự ack; bản mới và tài khoản mới không bị phản hồi cũ ghi đè, nháp đúng chủ được giữ. Xem DELAYED_SAVE; không thay ca thu hồi/quyền/mạng và nhiều browser đầy đủ.
  - Đợt kết nối23/10: app thật giữ nháp khi server QA tắt, mount tab mới khi server trở lại phục hồi/lưu đúng vào PostgreSQL; tab cũ giữ nháp và báo xung đột. Không airplane mode/hai browser độc lập; xem NETWORK_OUTAGE, tiếp tục mở.
  - Đợt ô writer23/10: con trỏ chung không còn là bản duy nhất có thể phục hồi; ghi lỗi dừng trước cập nhật shared, ack một tab không xóa nháp tab khác. Hai tab/harness và unit đạt, chưa thay offline/reconnect UI toàn luồng. Xem WRITER_SLOTS, giữ mở.
  - Đợt tiếp nối23/10: browser giữ nháp khi hạ quyền rồi thu hồi toàn bộ; server gốc không đổi. Save401/403/404 khóa ngay và giữ nháp trước khóa; nhánh save403 UI chưa kiểm riêng vì poll đã chạy trước. API15/15 gồm retry sau thu hồi không đổi nội dung/revision. Bằng chứng tại TABS_AND_REVOCATION; giữ mở.
  - Bổ sung23/10: browser mô phỏng server tạm dừng/nối lại, phục hồi sau xung đột, logout lỗi kết nối và chuyển tài khoản khóa sửa/giữ nội dung. Chưa thay ca offline đầy đủ/hai trình duyệt/thu hồi quyền và race; [RECOVERY23/10](../../qa/rebuild-2026-10-23/RECOVERY.md), giữ mở.
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
  - Bổ sung24/10: UI thật đã tạo bài không lớp sau sửa FREE_NAME; pin account cho giao/share và API same-origin, HTTP17đạt trước sửa thống kê pending. [Bằng chứng nhóm](../../qa/rebuild-2026-10-23/ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md). Chưa đủ toàn bộ enum/chính sách/tệp.
  - Phạm vi: YC-20. Nghiệm thu: NT-21.
  - Đạt khi: Enum/API/import thống nhất, nhóm tùy chọn đúng nhận diện; snapshot đủ câu/đáp án/tệp/điểm/mẫu và bất biến.
- [ ] **CV-055 — Nhận diện và phiên lượt làm.**
  - Phạm vi: YC-20, YC-21. Nghiệm thu: NT-21, NT-22.
  - Đạt khi: FREE_NAME/danh sách/mã có kiểm server, membership và PIN nếu bật; người biết ID không được đọc/sửa/nộp bài khác.
- [ ] **CV-056 — Thời gian, số lượt và cạnh tranh start.**
  - Phạm vi: YC-20, YC-21. Nghiệm thu: NT-22.
  - Đạt khi: Kiểm opensAt/closesAt/deadline/status, lượt hết hạn xử lý rõ; start đồng thời không tạo trùng hoặc lỗi unique vô nghĩa.
- [ ] **CV-057 — Lưu nháp và resume thật.**
  - CAS24/10: khóa row+hash nền cho draft/submit; HTTP race/retry/resume/stale-submit không đổiDB đạt, browser2tab A thắng/B giữ và tảiJSON thật/Bbị chặn nộp/A nộp đúng. Build46/HTTP17/SAFE226 mới đạt. [Chi tiết](../../qa/rebuild-2026-10-23/STUDENT_DRAFT_CAS.md). Không merge, chưa journal học sinh qua đóng tab/mất điện hoặc hai browser độc lập; không đóng CV.
  - Bổ sung24/10: UI7dạng autosave→trang mới→nhập cùng tên→resume7/7, giữ0/false/tự luận/ghép/thứ tự, deadline không reset; nộp7đtạm, chấm tay2.5→9.5. Chưa kiểm ghi muộn/mất mạng/nhiều profile độc lập; không đóng CV.
  - Phạm vi: YC-21. Nghiệm thu: NT-04, NT-23.
  - Đạt khi: Method/body chuẩn, kiểm res.ok, trạng thái mạng; reload lấy đúng nháp, không ghi đè câu mới bởi request chậm.
- [ ] **CV-058 — Giao diện làm bài đủ dạng.**
  - Phạm vi: YC-10, YC-21. Nghiệm thu: NT-16, NT-23.
  - Đạt khi: Tự luận có ô trả lời, đúng-sai/điền/ghép/sắp xếp dùng được, tệp/hình/âm thanh theo đề; cuộn/keyboard/mobile đúng.
- [ ] **CV-059 — Chấm server và nộp lặp an toàn.**
  - Phạm vi: YC-09, YC-21, YC-22. Nghiệm thu: NT-24.
  - Đạt khi: Zero/false/blank phân biệt, số/biểu thức theo câu, đáp án thiếu không nhận blank đúng; submit đồng thời một kết quả, trả điểm đúng chính sách ở mọi nhánh.
- [ ] **CV-060 — Chấm tay, đính chính và điểm chốt.**
  - UI24/10: guard detail requestseq/attemptRef ngăn A phản hồi muộn thành bàiB; chấm chỉ đúng attempt đang mở,503giữô2.5/báolỗi/retryđúng, trảdetail sauđóng không tựmởlại. Browser actualcomponent/fakeAPI và production7dạngđạt, build46/SAFE229 mới; [báo cáo](../../qa/rebuild-2026-10-23/TEACHER_DETAIL_REVIEW.md). Chưa CAS/hist chấm giữa2tab, không đóng CV.
  - Phạm vi: YC-22. Nghiệm thu: NT-24, NT-25.
  - Đạt khi: Tự luận pending, chỉnh rubric/điểm có lịch sử, regrade có phạm vi/phiên bản; bài cũ không đổi ngầm khi sửa ngân hàng.
- [ ] **CV-061 — Theo dõi, phản hồi và bảng điểm.**
  - Bổ sung24/10: bỏ kết quả giả0, dẫn bảng điểm thật; UI bài nộp/chấm tay9.5đạt. Pending đúng nhãn/số nộp và chỉ điểm chốt tính trung bình đã kiểm UI; mặc định leaderboardOFF UI đạt. Build46/typecheck, HTTP17 mới, DBread-only/CSV/hash nguồn đạt; SAFE223 trước sửa pending. Xem báo cáo nhóm CV054. Còn rawJSON/null trong chi tiết, nhiều chính sách/nhận xét/gia hạn và xung đột chấm, không đóng CV.
  - Phạm vi: YC-20, YC-22. Nghiệm thu: NT-25.
  - Đạt khi: Danh sách bài/lượt, progress, gia hạn/mở lại có quyền, thống kê/CSV; leaderboard tùy chọn mặc định tắt và không lộ toàn lớp.
- [ ] **CV-062 — Hồi quy link và toàn luồng học sinh.**
  - Phạm vi: YC-19, YC-20, YC-21, YC-22. Nghiệm thu: NT-06, NT-21, NT-22, NT-24, NT-25.
  - Đạt khi: Thử khách, giáo viên khác, link cũ, đã đóng, đã nộp, AFTER_CLOSE/NEVER; không lộ lời giải trong payload/metadata/file khi chưa được phép.

## S8 — Tri thức và trợ lý

- [ ] **CV-063 — Phân tích có cấu trúc và bản đọc được.**
  - Phạm vi: YC-23, YC-25. Nghiệm thu: NT-26.
  - Đạt khi: Lưu nguồn/version/trang/câu, nhận xét/bằng chứng/điều chưa chắc; Markdown liên kết dữ liệu gốc, không chỉ một đoạn chat.
- [ ] **CV-064 — Bộ nhớ cá nhân có quyền kiểm soát.**
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
  - Nghiệm thu local23/10: gói mới tạo qua backup.ps1, khôi phục qua restore.ps1 tới DB mới và từ chối ghi đè/native nonzero. App production từ bản phục hồi đăng nhập/lưu/mở đề/điểm0/lời giải và6tệp hashkhớp; rekey chỉ bản sao/nguồn24bảng không đổi. Guard gói hỏng/path/retention đạt, SAFE141/typecheck mới; retention chỉ review/không xóa theo yêu cầu giữ dữ liệu. [OPERATIONS_REHEARSAL](../../qa/rebuild-2026-10-23/OPERATIONS_REHEARSAL.md), [app](../../qa/rebuild-2026-10-23/restored-app-verification.json), [runbook](../van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md). Không gộp cutover/RPO/RTO/chuyển máy thuộc CV073 vào kết luận local này. Các dòng giữ mở bên dưới là lịch sử trước nghiệm thu.
  - Đợt đầy đủ23/10: dump DB chính chỉ đọc, restore vào DB mới `examcraft_restore_full_20261023085454302`;24bảng khớp số hàng/hash,6tệp public khớp SHA256, config DPAPI phục hồi đúng/1khóa thật giải mã trong RAM. Nguồn DB/public/env không đổi, không xóa;3lần lỗi trước bảo vệ config giữ nguyên và không nhận đạt. Còn app phục hồi/cutover, entrypoint restore cũ và retention an toàn; chưa đóng CV. Xem CROSS_IMPORT_AND_FULL_RESTORE và [bằng chứng](../../qa/rebuild-2026-10-23/full-restore-verification.json).
  - Đợt browser/IDB23/10: UI kho101đề tạo2liên kết100+1/5ảnh; phần2tải thật604bytes, chọn lại preview0sẵn sàng/1đã chuyển/0lỗi. JSON lỗi gỡ preview/nút cũ. Chưa tải/khôi phục toàn bộ các phần hoặc browser>30MB/restore vận hành DB+tệp; xem BROWSER_AND_INDEXEDDB, giữ mở.
  - Đợt giới hạn23/10: tự chia archive theo byte UTF-8/100đề, giữ nguyên từng đề/ảnh/thứ tự và liên kết tải từng phần. Unit sát biên đạt, API preview100+1đủ/0lỗi. Chưa browser kho>30MB/đo bộ nhớ hay restore vận hành DB+tệp; xem BACKUP_LIMITS, giữ mở.
  - Tiếp nối UI23/10: ảnh thiếu dừng đúng, copy phục hồi PNG QA có hash và giữ nguồn; tạo liên kết tải tồn tại, nhận archive thực7063bytes,3ảnh khớp hash; nhập lại/mở ảnh qua UI đạt. Build/SAFE132đạt. Chưa đủ restore DB+tệp/khối lượng lớn; xem IMPORT_UI_ROUNDTRIP, giữ mở.
  - Đợt ảnh23/10: backup nhúng nguyên byte ảnh; lỗi thiếu/quá lớn/định dạng dừng tạo archive. Script cô lập chuyển PNG QA (không xóa), phục hồi qua API, SHA256khớp/điểm0/lời giải/đề gốc giữ nguyên; browser hiện160×80. Build/HTTP16đạt, SAFE132trước checkbox. Còn UI xuất/nhập, archive lớn, IndexedDB và restore DB+tệp đủ; xem IMPORT_UI_AND_IMAGES, giữ mở.
  - Phạm vi: YC-24. Nghiệm thu: NT-27.
  - Đạt khi: DB+tệp+khả năng giải mã phục hồi vào môi trường trống; kiểm native exit code script, backup rỗng không báo tốt; retention/đường xóa an toàn.
- [ ] **CV-073 — Chốt vận hành local và phương án pilot.**
  - Phạm vi: YC-24. Nghiệm thu: NT-27.
  - Đạt khi: Runbook secrets/config/log/restore, tài khoản chịu trách nhiệm; mục tiêu RPO/RTO, dung lượng và chi phí có chủ dự án duyệt trước triển khai thật.
- [ ] **CV-074 — CI, kiểm tải và giám sát.**
  - Phạm vi: YC-01, YC-24, YC-29. Nghiệm thu: NT-05, NT-29.
  - Đạt khi: CI dùng DB thử và fail thật, health/error/usage không lộ dữ liệu; tải đo trên kịch bản xác định, không hứa công suất chưa đo.
- [ ] **CV-075 — Thiết kế kết nối Drive tùy chọn.**
  - Phạm vi: YC-24. Nghiệm thu: NT-27.
  - Đạt khi: Chốt backlog/định dạng/quyền tối thiểu/trạng thái backup/restore; chỉ triển khai kết nối khi được chọn, không yêu cầu Drive để dùng app. Không đánh dấu tích hợp hoàn thành nếu mới thiết kế.
- [ ] **CV-076 — Hướng dẫn giáo viên và kiểm dễ dùng.**
  - Phạm vi: YC-26, YC-29. Nghiệm thu: NT-30.
  - Đạt khi: Hướng dẫn ngắn key, soạn, đáp án, cùng sửa, giao bài, khôi phục; người mới thực hiện nhiệm vụ, sửa ngôn ngữ/điểm ngợp theo quan sát.
- [ ] **CV-077 — Dọn đường cũ và cập nhật tài liệu.**
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

Nơi lưu bằng chứng khi bắt đầu thực hiện: `qa/evidence/rebuild-2026-10-21/<CV-id>/` trong workspace, chưa có nghĩa các tệp đó đã được tạo hoặc kiểm tra. Không lưu key/mật khẩu/tên học sinh thật vào Git.



## Tiêu chí bổ sung từ bàn giao22/10/2026

Không đổi dấu hoàn thành các CV. Việc nghiên cứu đã làm và chưa làm ghi riêng ở [06—Việc tiếp theo](F:/Workspace/Zazz/ExamCraft/docs/nghien-cuu/06_VIEC_TIEP_THEO.md).

- CV-004, CV-007 / YC-04,07,25,27 / NT-11,12,28: ví dụ phải có năm học/phiên bản; NN1 và NN2 cùng ngôn ngữ không trùng; chương trình theo trình độ không bị ép lớp.
- CV-007 / YC-25 / NT-11: phân biệt văn bản, phụ lục, tệp và bản lưu; minh họa bốn phụ lục trong hai PDF và nhiều bản lưu cùng văn bản.
- Các CV triển khai nguồn/mẫu và nghiệm thu độ phủ phải dùng sổ05; không chuyển106 mã thành106 tài liệu đã duyệt hoặc báo đủ1–12.
- Mặc định sách theo năm học phải có căn cứ; ba bộ vẫn có thể quản lý theo gói/ấn bản/hồ sơ tham chiếu. Không đổi dữ liệu đề cũ theo mặc định mới.
