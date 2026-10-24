# Kiểm thử cải tiến ExamCraft — 22/10/2026

## Trạng thái hiện tại — thay cho các mốc chờ ở nhật ký bên dưới

Đã sao lưu và khôi phục thực, tạo DB thử riêng, chạy kiểm transaction PostgreSQL và HTTP cô lập. Đã áp dụng migration vào DB chính sau kiểm bản phục hồi và cài mới; xem main-migration.json. Các đợt nhật ký cũ giữ trạng thái lúc thực hiện; ưu tiên bảng hiện tại và mục cập nhật cuối. Các giới hạn chuyên môn/AI thật vẫn còn hiệu lực.

| Hạng mục | Bằng chứng hiện có | Phạm vi kết luận |
|---|---|---|
| DB nguồn local | `127.0.0.1:5436/examcraft`, container `examcraft_postgres` | Đã thêm3bảng cộng tác;20bảng cũ giữ nguyên số dòng/hash |
| Backup | `backups/database/examcraft-2026-10-22T02-53-43-430Z.dump`, 62.017 byte, SHA256 `fe6a36ebc9f148f4d377acd2e7b5704568014c54f4e17093acc508ca416782fb` | Archive custom đọc được, manifest không chứa mật khẩu |
| Restore thực | `backups/database/provision-2026-10-22T03-28-44-994Z.json` | Đã phục hồi vào `examcraft_restore_20261022`, 21 bảng; có số dòng từng bảng |
| DB thử | `examcraft_test_20261022`, schema đồng bộ riêng bằng guard + Prisma db push | Tách nguồn và bản phục hồi; chỉ dùng fixture giả |
| Real DB S1 | [integration_s1.json](integration_s1.json), mốc13:58:20 UTC | 6 ca nghiệp vụ + cha = 7/7; có thêm roundtrip gói/phạm vi, chặn sửa cùng revision. DB thử riêng, cleanup hoàn tất |
| HTTP thực | [http_workflows.json](http_workflows.json), [http_auth.json](http_auth.json), [generation-verification.json](generation-verification.json) | 12 ca nghiệp vụ + 2 test cha = 14/14; gồm scope/provenance/private source, chặn tab đổi tài khoản gửi tác vụ AI và tổng7dạng vượt100 trước dùng key. Cleanup hoàn tất; không AI thật |
| Client/adapter | Ba lỗi Decimal, nháp local có version và workspace cache đã sửa; suite persistence ban đầu chạy lại 10/10 đạt, sau đó mở rộng ca cộng tác | Không coi test fake là bằng chứng PostgreSQL; tách bằng chứng DB ở dòng trên |
| Build/runtime | Node22.21, Next16.4.2, Prisma6.19.3; build94176 exit0, 44trang, typecheck đạt | Bản dựng cuối đợt gồm gói/phạm vi, liên kết từng câu,7dạng AI và bước duyệt kết quả. Không chạy build khi máy chủ thử đang hoạt động |
| SAFE | [safe-tests.log](safe-tests.log), lần cuối exit0:20ca cũ +101ca bổ sung | Không DB/AI; gồm helper bảy dạng, provenance và giữ tiêu đề/chặn bản nền cũ. Không cộng các lần chạy lại thành ca mới |
| UI / Word | [editor-saved.png](editor-saved.png), [presentation-verified.png](presentation-verified.png), [browser_export.json](browser_export.json), [browser-export.docx](browser-export.docx) | Đã tạo/lưu/reload, chủ động hiện/ẩn đáp án, tải Word và kiểm XML nội dung/phần/ngữ liệu. Chưa nghiệm thu trực quan Microsoft Word hoặc offline hai trình duyệt |

Lệnh mặc định `npm test` chạy các suite không DB/AI. `npm run test:integration` và `npm run test:http` đi qua guard và DB thử; HTTP chỉ chấp nhận server thử có xác nhận `isolatedTest`. Kiểm UI trình duyệt và rà soát chuyên môn tiếp tục là các bước riêng. Không tuyên bố toàn repository sạch lint: mới có lint định hướng trên các file thay đổi và đánh giá giới hạn lint cũ.

Khó khăn vận hành đã ghi nhận: sandbox chặn Docker/PostgreSQL; một số lần xin quyền tool đã chờ lâu rồi bị ngắt. Các lệnh được chạy lại có kiểm đích trước; không biến lỗi hạ tầng thành PASS hoặc số mutation bị bắt.

## Điều đã phát hiện nhờ kiểm thử thực

- DB thật phát hiện so sánh JSONB bằng thứ tự khóa làm tạo lặp báo xung đột; đã dùng canonical JSON và DB7/7 chạy lại đạt.
- Trình duyệt phát hiện Origin/Host bị Next chuẩn hóa khác nhau dẫn tới 403 dù cùng máy; đã sửa đối chiếu host thực và có hồi quy chống host/origin giả. Không sửa test để bỏ kiểm quyền.
- HTTP auth phát hiện PostgreSQL advisory lock trả `void` mà Prisma không đọc được; đã đổi truy vấn lấy khóa rồi trả giá trị số và chạy lại các ca auth đạt.
- Lượt HTTP trên máy chủ phát triển bị timeout khi máy biên dịch lại; ghi nhận là lần chạy không đạt/không kết luận. Lượt 13/13 ở trên chạy lại với máy chủ bản dựng ổn định. Một assertion bank chờ201 được sửa thành200 sau khi đối chiếu hợp đồng route đang trả200.

## Migration DB chính — nhật ký trước khi thực hiện

Read-only Docker đã xác nhận DB chính có21bảng kể cả `_prisma_migrations`; lịch sử chỉ có `20261017173205_init_v3_schema`, đã hoàn thành và không rollback. Có sẵn `Folder`, `UserApiKey`, `TeacherAiMemory`, chưa có ba bảng cộng tác mới.

Đối chiếu file init bằng đọc tệp: init chỉ tạo17bảng; schema hiện tại23model. Sáu model không nằm trong init là `Folder`, `UserApiKey`, `TeacherAiMemory`, `ExamCollaborator`, `ExamRevision`, `ExamComment`. Vì vậy, quy trình cài mới cần bổ sung baseline cho ba model đã có ngoài lịch sử; DB chính hiện hữu cần SQL chênh lệch đúng cấu trúc thực tế. Không chạy toàn bộ SQL cài mới lên DB đang có bảng.

Lệnh Prisma diff chỉ đọc đã bị ngắt ở bước tool xin quyền sau thời gian chờ; chưa sinh SQL, chưa áp dụng lên DB nào. Điều phối viên đã nhận phần soạn SQL additive và thử trên `examcraft_restore_20261022`. Người kiểm thử dừng Docker/Prisma/DB theo phân công mới; không có main migration do người kiểm thử thực hiện. Chưa đánh dấu CV014 hoặc CV072 hoàn tất chỉ từ việc có dump/restore.

## Các việc vẫn mở

- QA offline/reconnect/hai trình duyệt, nháp muộn và đổi tài khoản đầy đủ: CV010 tiếp tục mở; helper hoặc kiểm server không thay thế kiểm trải nghiệm này.
- Migration SQL đã qua bản phục hồi/cài mới và áp dụng DB chính; phần nghiệm thu đầy đủ tệp/asset, dữ liệu trình duyệt và chuyển dữ liệu người dùng vẫn mở.
- Xoay bí mật production phải có kế hoạch giải mã–mã hóa lại các khóa cá nhân; cấu hình local hiện được DPAPI bảo toàn. Chưa phát hành production.
- Rà chuyên môn từng môn/lớp, độ phủ nguồn và quyền sử dụng; chưa coi số test kỹ thuật là nghiệm thu nội dung.
- Mở Word trực quan và kiểm nhiều dạng bố cục/âm thanh/thực hành; kết quả XML không thay phần này.

## Phạm vi và bảo toàn dữ liệu

- Baseline do điều phối viên lưu trước sửa: `backups/before-rebuild-2026-10-21T22-08-28-289Z`, 257 tệp đã đối chiếu.
- Chưa chạy test ghi DB, seed, migration hoặc gọi AI thật trong đợt thiết lập runner.
- `npm test`, `npm run test:all`, `npm run test:safe`: chạy kiểm thử đơn vị và guard không kết nối DB.
- `npm run test:integration`: từ chối nếu thiếu `TEST_DATABASE_URL` và `EXAMCRAFT_ALLOW_TEST_DB=1`; chỉ chấp nhận PostgreSQL loopback, tên `examcraft_test`/`examcraft_qa` hoặc hậu tố. Không dùng DB ứng dụng làm phương án dự phòng. URL được truyền trước khi import singleton Prisma.
- Không đưa bí mật vào log. Khi cấu hình `DATABASE_URL` có mặt, từ chối cùng host/cổng/tên DB dù khác thông tin đăng nhập, schema hoặc bí danh localhost.
- Chưa tạo hay chứng nhận DB thử riêng. Guard không thay thế việc đối chiếu đích DB trước chạy.

## Các kết quả cũ không được dùng làm bằng chứng mới

- `tests/unit_tests.mjs` từng bắt lỗi rồi kết thúc exit 0 và in 100% PASS: đã sửa số liệu và exit code.
- Test Tracks trong file này chỉ so sánh trường của đối tượng tự tạo; không chứng minh hỗ trợ học liệu/phân môn. Một số tên test dùng chữ “chuẩn” là tên lịch sử, không phải nghiệm thu chuyên môn.
- Phase 6 cũ chỉ log cho cookie/XSS/readiness; CSV và chuẩn hóa toán sao chép logic vào test. Đã loại khỏi runner tích hợp; chưa công nhận kiểm bảo mật/sao lưu.
- `tests_e2e/test_sprint1.ts` có Prisma QA riêng nhưng import auth dùng singleton khác: có thể chạm hai DB. Không chạy trực tiếp.
- HTTP audit cũ tạo dữ liệu và có gọi Gemini thật. Script `test:audit` hiện từ chối rõ ràng, đợi thay bằng quy trình server/DB cô lập. Không ghi SKIP thành PASS.
- Mutation cũ chỉnh trực tiếp nguồn; lỗi khởi động/DB có thể bị tính là đã bắt mutation. Không chạy và không dùng tỷ lệ cũ.

## Bằng chứng đợt 1

`npm run test:safe` hoàn tất exit 0: 20 bài trong bộ unit cũ và 3 bài guard mới đạt. Guard kiểm thiếu cấu hình, loại DB/host không hợp lệ, trùng DB ứng dụng, không lộ secret. Đây là kết quả ở mức hàm, chưa phải HTTP/E2E hoặc phục hồi DB.

`node --import tsx --test tests/public_access.test.ts` hoàn tất exit 0: 8 ca kiểm trực tiếp module mới về token gắn đúng lượt/người/bài/thời điểm, hạn và lưu trữ lớp, quy tắc hiện đáp án, từ chối khác origin, loại trường đáp án ở cả câu lồng và câu trực tiếp, định dạng câu trả lời, điểm và trạng thái chờ chấm, đúng/sai không áp barem ngầm, thiếu khóa đáp án không tự đúng. Đã đưa suite này vào `test:safe`. Chưa thay thế kiểm HTTP/transaction cạnh tranh.

`node --import tsx tests/run_all_v3_tests.ts` với cấu hình mặc định đã từ chối trước khi tải Prisma hoặc chạy suite, thông báo thiếu opt-in; đây là kết quả chặn an toàn mong đợi.

ESLint chạy riêng `tests/helpers/test-database.ts`, `tests/safety_guard.test.ts`, `tests/public_access.test.ts`, `tests/run_all_v3_tests.ts`, `tests/run_guarded_http_audit.ts`: exit 0, không lỗi. Không suy ra toàn repository đã sạch lint.

## Ca bắt buộc cho lưu và quyền

1. Roundtrip đầy đủ từng kiểu câu: lựa chọn, đúng/sai, trả lời ngắn, tự luận, điền, ghép, sắp xếp; đáp án, lời giải, điểm, hình, metadata không mất.
2. Không được liên kết câu riêng, folder, template, passage của giáo viên khác. Câu chia sẻ chỉ đọc phải có cách sao chép phù hợp.
3. Cập nhật dùng phiên bản nền; hai lần ghi từ cùng phiên bản chỉ một lần thành công, lần còn lại trả xung đột và giữ nháp.
4. Lỗi giữa transaction không để đề/câu rỗng hoặc ghi một phần. Snapshot bài đã giao không đổi khi sửa nguồn.
5. Tài khoản khóa/hết phiên/bắt đổi mật khẩu bị chặn đúng mã lỗi; quản trị không tự có quyền dữ liệu cá nhân.
6. Nháp theo tài khoản và đề; đăng xuất/chuyển tài khoản không đọc nháp người khác.
7. Nhập bản cũ có kiểm định, giữ bản gốc, chạy lại không nhân bản và không tự đổi trạng thái sang đã duyệt.

Trạng thái các ca trên: đợi module triển khai để kiểm bằng hàm/route thực, chưa đánh dấu đạt.

## Đợt 2 — adapter và dịch vụ lưu

- `tests/persistence_permissions.test.ts` gọi trực tiếp adapter/dịch vụ mới bằng transaction fake cô lập, không kết nối DB. Sáu ca: roundtrip bảy dạng câu, points=0/ngữ liệu/hình/đáp án; validator; đọc Decimal cũ; quyền folder/template/question; tạo lặp không nhân bản và tách giáo viên; cạnh tranh cùng baseVersion chỉ một thành công.
- Lần chạy đầu: 5/6 đạt; 1 thất bại có ích phát hiện `Prisma.Decimal` không được adapter nhận khi đọc đề cũ. Đã báo điều phối viên để sửa nguồn. Chưa xem đây là kết quả đạt.
- Bổ sung hai ca client bằng mock fetch: lần chạy 6/8 đạt; Decimal vẫn lỗi và phát hiện nháp local có version cũ bị chọn PATCH nhầm thay vì POST. Ca nhận xung đột 409 giữ nguyên dữ liệu người gọi đạt. Mock không gửi mạng thật. Đợi sửa hai lỗi trước đưa suite vào đường test mặc định.
- Transaction fake kiểm predicate CAS và luồng service; không chứng minh rollback hay khóa đồng thời PostgreSQL. Hai việc này đợi DB riêng.
- Bổ sung public helper lên 10 ca (đồ thị chống expression thực thi/range bất thường và ranh giới grace 15 giây chỉ dành cho nộp bài). Chạy chung với 3 guard: 13/13 đạt.
- Sửa import helper của hai test cũ sang `src/lib/public-exam.ts`; route Next không được export helper tùy ý.

## Chuẩn bị sao lưu DB — chưa thực thi

Đã soạn `scripts/backup-database.cjs`, `scripts/provision-test-db.cjs` và helper `scripts/database-tools.cjs`. Cả hai mặc định dry run; chưa chạy kể cả dry run ở thời điểm ghi mục này. `node --check` cả ba tệp đạt.

- Backup đọc cấu hình local, đối chiếu container/cổng; tạo archive custom mới, kiểm archive list, SHA256 và manifest không có mật khẩu. Giữ tệp partial nếu lỗi; không ghi DB nguồn.
- Provision bắt buộc checksum/source đúng và xác nhận hai tên cố định `examcraft_test_20261022,examcraft_restore_20261022`. Từ chối nếu bất kỳ đích đã tồn tại. Không drop hoặc ghi đè. DB thử rỗng tách khỏi DB phục hồi; restore single transaction vào bản sao và ghi danh sách bảng/số dòng.
- Chưa sao lưu DB, chưa chứng minh restore. Archive chỉ gồm dữ liệu DB; tệp ứng dụng, dữ liệu trình duyệt và bí mật cần giải mã phải lưu riêng.
- `docker ps` chỉ đọc sau quyền truy cập cho thấy `examcraft_postgres` đang chạy và healthy; một container dự án khác cũng chạy, không thao tác vào nó.

## Migration đã thực hiện và kiểm scope — cập nhật tiếp

- [migration-verification.json](migration-verification.json): cùng bộ SQL chạy trên bản phục hồi và DB cài mới; schema khớp, chạy lại an toàn.
- [main-migration.json](main-migration.json): áp dụng sau backup mới và đối chiếu checksum SQL; 20 bảng ứng dụng cũ giữ nguyên số dòng/hash, thêm 3 bảng cộng tác. Backup trước áp dụng: `backups/database/examcraft-2026-10-22T09-41-13-218Z.dump`.
- SAFE mới: 20 ca cũ + 98 ca bổ sung đạt, xem [safe-tests.log](safe-tests.log). Bảy ca mới kiểm gói kiến thức, liên kết, vòng lặp, include/exclude, revision và sinh theo phạm vi.
- PostgreSQL S1 đã kiểm thêm roundtrip gói/phạm vi và chặn sửa nội dung cùng revision; 6 ca nghiệp vụ + cha đạt. HTTP scope và giao diện đang được kiểm tiếp, chưa kết luận từ SAFE.
- Thử mất kết nối máy chủ: nháp giữ nội dung và hiện chưa lưu; sau nối lại, mở trang mới cùng trình duyệt phục hồi và lưu nháp. Chưa thay thế ca hai trình duyệt hay mở ứng dụng lần đầu khi mất mạng.

## Liên kết kiến thức từng câu — kiểm bổ sung

- Gói/phạm vi giao diện đã lưu và tải lại thành công. Tệp minh họa riêng cho kiểm thử, không là chương trình chính thức.
- `tests/knowledge_package.test.ts` đạt10/10: thêm nguồn gốc mã từng câu, đổi gói/phiên bản không tự gắn lại mã giống nhau, giữ câu ngoài phạm vi và kiểm dữ liệu liên kết không hợp lệ.
- Typecheck độc lập đạt sau khi loại bỏ một khai báo kiểu và khối validator bị lặp; lượt build phát hiện lỗi trùng được ghi là không đạt. Đang dựng lại sau sửa; không lấy build trước thay cho kết quả mới.
- Lint định hướng các helper/UI/tests mới đạt; không tuyên bố lint toàn repository sạch.

- Rà soát bàn giao phát hiện quy tắc `*.sql` đang che ba migration mới khỏi Git. Đã thêm ngoại lệ chỉ cho `prisma/migrations/**/migration.sql`; các bản dump/backup vẫn bị bỏ qua. Không đổi nội dung SQL đã áp dụng hoặc checksum migration.

## Kết quả cuối đợt gói kiến thức và sinh đề

- Bản dựng94176 đạt; typecheck độc lập và lint định hướng các tệp mới đạt. Hai vòng build trung gian phát hiện khai báo trùng và thiếu props ở điểm gọi từ dashboard/test fixture; đã sửa và dựng lại, không gọi các vòng lỗi là PASS.
- SAFE20+101 đạt; HTTP14/14 đạt trên bản dựng cuối (12ca nghiệp vụ +2cha), gồm trường hợp AI từ tab cũ và kế hoạch vượt100. Không có lệnh gọi nhà cung cấp AI thật.
- Giao diện đã kiểm gói/phạm vi và liên kết từng câu qua lưu/tải lại. Hộp thoại sinh đề mở từ cả kho lẫn bàn soạn; ba dạng bổ sung thu gọn mặc định, chọn1mỗi dạng và0các dạng khác hiện tổng3đúng. Đóng mà không gửi yêu cầu AI.
- Chưa nghiệm thu việc nhận kết quả nhà cung cấp thật, thao tác áp dụng/đóng khi yêu cầu thật đang chạy. Helper đã kiểm giữ tiêu đề và chặn nội dung nền đã đổi; không dùng kết quả helper thay bằng chứng UI.
- Chi tiết và ảnh: [KNOWLEDGE_SCOPE](KNOWLEDGE_SCOPE.md), [GENERATION](GENERATION.md), [generation-verification.json](generation-verification.json). Máy chủ kiểm thử đã dừng sau đợt; không mở dịch vụ lên mạng ngoài.
