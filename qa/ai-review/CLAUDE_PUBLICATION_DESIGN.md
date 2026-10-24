# Thiết kế bản công bố tách khỏi nháp — Claude, C04 (CV030/048)

Chỉ đọc và thiết kế; không code, không schema thật, không migration, không chạy gì. Đã đọc: `ShareLink`/`Exam`/`ExamRevision`/`Assignment` trong `prisma/schema.prisma`; `api/exams/[id]/share`, `api/public/share/[id]` và `/copy`; `lib/share-copy.ts`, `lib/exam-persistence.ts`, `lib/exam-collaboration.ts`; `assignments/route.ts` (đoạn dựng snapshot); [SHARE_COPY](../rebuild-2026-10-23/SHARE_COPY.md); [SHARE_TRANSACTION_REVALIDATION](../rebuild-2026-10-24/SHARE_TRANSACTION_REVALIDATION.md); tiêu chí CV030/CV048 trong checklist. Không đổi chính sách đáp án đã chốt (xem ở dưới).

## 1. Bốn thứ khác nhau (hiện tại → đề xuất)

| Đối tượng | Hiện có | Nguồn nội dung | Đổi theo nháp? |
|---|---|---|---|
| **Link xem đề** (`ShareLink`) | token, `showAnswers`, `allowCopy`, `expiresAt`, `revokedAt` | **Đề đang sửa** (`public/share/[id]` đọc `Exam`+`Question` mỗi lần) | **Có, ngầm** — đây là lỗ CV048/CV030 |
| **Bản công bố** (đề xuất) | chưa có | Một `ExamRevision` đã chốt (`examId`+`version`) | Không |
| **Bài giao** (`Assignment.snapshot`) | có, bất biến, đóng băng điểm bằng `freezeExamScoring` | Đề tại lúc giao | Không (giữ nguyên) |
| **Bản sao riêng** (`/copy`) | có, idempotent theo link (+ `sourceVersion`), `409 ALREADY_COPIED` | Đề tại lúc sao | Không sau khi tạo; **nhưng đọc từ đề đang sửa** |

Chính sách đáp án đã chốt giữ nguyên: đáp án/lời giải chỉ có trong trang công khai và trong bản sao khi **link** bật `showAnswers`; ẩn thì bản sao bị bỏ các phần đó.

## 2. Luồng đề xuất

1. **Chốt phiên bản.** Mỗi lần lưu đề đã ghi một `ExamRevision(examId, version, snapshot=fromDatabaseExam(exam))` (`exam-persistence.ts:68`); công bố chỉ cần *chọn* một phiên bản đã có, không sinh dữ liệu mới. Mặc định là phiên bản hiện tại của đề lúc bấm.
2. **Xem trước đúng như người nhận.** Dựng trang công khai từ chính revision đó với chính sách của link sắp tạo (`showAnswers`, có/không sao chép), kèm "Phiên bản N, chốt lúc …". Chưa tạo link cho đến khi xác nhận.
3. **Tạo link** gắn `pinnedVersion = N`. Người nhận thấy nhãn "Phiên bản N · chốt ngày …".
4. **Sửa nháp** (kể cả bản sau khi chốt): link vẫn trả phiên bản N. Giao diện giáo viên báo "Đề đã sửa sau bản chốt (hiện v M)".
5. **Công bố bản mới** = hành động riêng, có xác nhận, hiển thị "link này đang ở v N → chuyển sang v M" rồi **đổi con trỏ của cùng link** (giữ đường dẫn đã gửi cho lớp), ghi `AuditLog`. Nếu muốn giữ cả hai bản thì tạo link mới (đã có). *Mặc định đề xuất: chuyển cùng link; chủ dự án có thể chọn "luôn tạo link mới" (xem mục 7).*
6. **Thu hồi / hết hạn**: dùng `revokedAt`/`expiresAt` sẵn có, không đổi. Bản sao đã tạo trước đó giữ nguyên (đã chứng minh ở đợt giao dịch).
7. **Bản sao**: sao từ revision đã chốt, không từ đề đang sửa; mã sao `share-copy:<link>:v<pinned>` (đã có dạng này) nên sau khi chuyển sang bản mới, "sao chép lại bản mới" tự nhiên là bản thứ hai thay vì `409 ALREADY_COPIED`. Đây chỉ giải quyết nhu cầu "sao chép lại" **nếu** được cài đặt; CV048 vẫn mở cho đến khi có mã, migration, giao diện, chính sách, xử lý ảnh và kiểm hai browser đủ bằng chứng.

## 3. Hai phương án dữ liệu (chỉ cộng thêm)

**A — gắn con trỏ vào `ShareLink` (đề xuất).** Thêm cột nullable: `pinnedVersion Int?`, `pinnedAt DateTime?`, `pinnedById String?`, `pinnedRefs Json?` (danh sách mã câu/ngữ liệu mà bản chốt tham chiếu, ghi **lúc chốt**, dùng để kiểm quyền nguồn, xem I2). Nội dung đọc công khai và sao chép lấy từ `ExamRevision(examId, pinnedVersion).snapshot`. Link cũ (`pinnedVersion IS NULL`) giữ hành vi hiện tại (đọc đề đang sửa) nên không mất link nào.
- Ưu: 1 migration nhỏ, không nhân đôi dữ liệu, dùng lịch sử có sẵn (CV010/lịch sử), đường lui **không** phải là "bỏ dùng cột" (sẽ phát hành nháp); xem mục 8.
- Nhược: bản công bố phụ thuộc `ExamRevision` — cần quy ước **bản đã chốt bất biến và không bị xóa/dọn**. Hiện không có đoạn nào dọn revision, nhưng `legacy-import.ts:104` còn *cập nhật* snapshot của revision 1 (thêm `_legacyImport`) → phải ghi rõ: chỉ xảy ra khi nhập, trước mọi link; thêm test/guard rằng mã công bố không pin revision đang bị nhập.

**B — bảng mới `ExamPublication`** (`id, examId, version, snapshot Json, createdById, createdAt, supersededAt`), `ShareLink.publicationId`. Tách hẳn khỏi lịch sử, có thể có metadata công bố (ghi chú, người chốt) và dọn lịch sử độc lập.
- Ưu: bất biến thật, không phụ thuộc retention của lịch sử.
- Nhược: sao chép dữ liệu đề (kích thước), thêm bảng + FK + quy tắc đồng bộ, nhiều thay đổi hơn cho nhóm nội bộ nhỏ.

**Chọn A**, vì nhóm nhỏ, không có dọn lịch sử, và mọi thứ cần (snapshot, phiên bản, người lưu, ghi chú) đã có trong `ExamRevision`. Nếu sau này cần dọn lịch sử, nâng lên B bằng migration cộng thêm sao chép từ `pinnedVersion`.

## 4. Quy tắc bất biến (invariant)

- **I1** Link đã pin chỉ đổi `pinnedVersion` bằng hành động công bố tường minh (có audit); không có đường nào khác.
- **I2 (tách nội dung và quyền)** Với link đã pin, **nội dung** (chữ, đáp án, hình dữ liệu) chỉ lấy từ snapshot đã chốt, không bao giờ lấy từ `Exam.items/Question` đang sửa và không "làm tươi" snapshot. **Quyền nguồn** thì vẫn đọc hiện hành theo `pinnedRefs`: nếu bất kỳ câu/ngữ liệu được tham chiếu đã bị xóa, không còn `shareable`, hoặc đổi chủ, link **đóng (404, fail closed)** dù snapshot vẫn còn. Thu hồi quyền nguồn luôn thắng bản công bố; giáo viên được báo câu nào đang chặn link, không có cách tự mở lại bằng nội dung live.
- **I3** Hết hạn / thu hồi / đề bị xóa / quyền nguồn bị thu hồi → cùng một phản hồi 404 như hiện tại (không lộ lý do cho người nhận).
- **I4** `showAnswers`, `allowCopy`, `expiresAt` thuộc link, không đổi theo phiên bản; đổi chính sách = tạo link mới (không sửa tại chỗ), để người nhận cũ không bị lộ đáp án hồi tố.
- **I5** Public allowlist giữ nguyên: bản snapshot vẫn đi qua `sanitizeSnapshotForStudent`; đáp án chỉ thêm khi link cho phép; hình chỉ các trường trong danh sách cho phép (`id, kind, url, caption, renderedBase64, data hiển thị`).
- **I6** Link cũ (`pinnedVersion NULL`) không bị tự pin ở rollout; pin là việc giáo viên chọn ("Chốt bản hiện tại cho link này").
- **I7** Sao chép luôn tạo bản riêng của người sao, đề gốc không đổi (đã có), nay từ snapshot đã chốt (và cũng chịu I2: nguồn đã bị thu hồi quyền thì không sao chép được).
- **I8 (fail closed)** Link đã pin **không bao giờ** rơi về đọc đề đang sửa: thiếu revision, thiếu `pinnedRefs`, hoặc không đọc được bản chốt → 404, không phải nội dung nháp. Cột `pinnedVersion` khác NULL là lệnh "chỉ phục vụ bản chốt".

## 5. Thứ tự giao dịch và tranh chấp

Giữ thứ tự khóa đã chứng minh: **`Exam` trước, `ShareLink` sau** (đọc lại quyền/trạng thái *sau khi* khóa).
- *Công bố/đổi con trỏ*: khóa `Exam` → khóa `ShareLink` → kiểm quyền (`canPublish`), link chưa thu hồi/hết hạn, revision tồn tại thuộc đúng đề → cập nhật `pinned*` + `AuditLog` cùng transaction.
- *Sao chép vs đổi con trỏ*: ai giữ khóa trước thắng; sao chép bắt đầu sau thì đọc con trỏ mới (bản mới, mã `:vM`); bắt đầu trước thì xong với `:vN`. Không bao giờ ra bản lai (N và M).
- *Sao chép vs thu hồi*: như đợt trước (sao giữ khóa trước thì thu hồi chờ, bản sao hợp lệ được giữ; thu hồi trước thì sao bị từ chối).
- *Sửa nháp vs sao chép*: sửa nháp không còn ảnh hưởng link đã pin (khác hiện tại, nơi sao chép đọc lại `Exam` đã khóa).
- *Tạo link*: ghi `pinnedVersion` = phiên bản hiện tại và `pinnedRefs` (mã câu/ngữ liệu của chính bản đó) đọc **trong cùng transaction đã khóa Exam**, để không pin phiên bản chưa lưu và không lệch giữa nội dung với danh sách quyền.
- Cursor/retry: `clientRequestId` cho tạo link/công bố (cùng kiểu đã dùng ở template/khóa/ghi chú) để mất biên nhận không tạo hai link.

## 6. Quyền, ảnh, retention

- **Sửa ≠ phát hành**: `exam-collaboration.ts` đã có `canPublish`; tạo link, đổi con trỏ và thu hồi cần `canPublish` (hiện chỉ chủ). Người sửa không có quyền này thì chỉ thấy "đề đã sửa sau bản chốt".
- **Ảnh**: snapshot chỉ giữ tham chiếu/dữ liệu nhúng của hình (hình vẽ/đồ thị là dữ liệu nhúng; hình dạng `image` có `url`). Chưa thấy kho tệp riêng có phiên bản nên **chưa chứng minh được ảnh theo URL không đổi/mất quyền sau khi công bố**. Đề xuất: giữ đúng tham chiếu như hiện nay, hiển thị cảnh báo "hình ngoài kho không được ghim" ở bước xem trước; ghim byte thật cần quyết định riêng (mục 7). Không mở nền tảng tệp mới.
- **Retention**: không dọn `ExamRevision` mà `ShareLink.pinnedVersion` đang trỏ; nếu sau này có dọn lịch sử thì loại trừ các bản đã pin (hoặc chuyển sang phương án B). Xóa đề → cascade như cũ.

## 7. Cần chủ dự án quyết (kèm mặc định đề xuất)

1. **Công bố bản mới = chuyển cùng link hay luôn tạo link mới?** Mặc định: chuyển cùng link có xác nhận + audit (giáo viên giữ được đường dẫn đã gửi cho lớp); link cũ không bị đổi nếu họ chọn tạo mới.
2. **Link cũ chưa pin**: mặc định không tự pin; hiển thị nhãn "đang theo bản mới nhất" và một nút chốt. Có thể bật cảnh báo trước khi hết hạn.
3. **Ảnh theo URL**: mặc định chỉ cảnh báo ở bước xem trước; ghim byte chỉ làm nếu có nhu cầu thực (cần nguồn về dung lượng/quyền tệp, hiện chưa đủ).
4. **Người sửa (EDITOR) có được công bố?** Mặc định chỉ chủ (`canPublish`), mở rộng sau nếu nhóm cần.

## 8. Rollout (expand → reader tương thích → bật tính năng) và đường lui không phát hành nháp

Prisma client sinh từ schema mới sẽ SELECT cột mới; nếu mã mới chạy trước khi DB có cột thì lỗi `P2022`. Vì vậy **không** nói "mã trước hay sau migration đều an toàn". Thứ tự bắt buộc:
1. **Sao lưu** theo [runbook local](../../docs/van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md); thử toàn bộ chuỗi dưới đây trên bản restore, không đụng DB chính.
2. **Expand migration trước**: chỉ `ALTER TABLE "ShareLink" ADD COLUMN ... NULL` (4 cột), không backfill. Mã **cũ** vẫn chạy bình thường với DB đã mở rộng (Prisma cũ không chọn cột lạ). Chạy kiểm tra restore/đối chiếu số dòng trước khi đi tiếp.
3. **Phát hành reader tương thích** (chưa bật tính năng): đọc công khai/sao chép biết `pinnedVersion`; khi NULL giữ hành vi cũ; khi khác NULL thì theo I2/I8. Chưa có giao diện nào tạo pin, nên chưa link nào được pin.
4. **Bật tạo/đổi pin** (route + giao diện) bằng cờ cấu hình riêng. Từ lúc có link đã pin, **không được** chạy lại mã cũ hơn bước 3.
5. **Đường lui**: (a) lỗi ở tính năng → tắt cờ ở bước 4; reader của bước 3 vẫn phục vụ đúng bản chốt cho các link đã pin. (b) Nếu buộc phải quay về mã trước bước 3 khi đã có link pin: **trước tiên** đóng các link đó (ghi danh sách mã link và `revokedAt` cũ rồi đặt `revokedAt` — hành động có kiểm soát, có thể hoàn nguyên từ danh sách), để người nhận thấy 404 thay vì nội dung nháp; chỉ mở lại sau khi reader tương thích trở lại. Không có đường nào biến link đã pin thành đọc đề đang sửa.
6. Không tự chạy migration/seed/reset trong đợt thiết kế này.

## 9. Ca nghiệm thu đề xuất (HTTP trên DB thử + UI)

1. Tạo link → đổi tiêu đề/câu/đáp án của đề → trang công khai vẫn trả bản cũ (so từng trường, kể cả đáp án khi `showAnswers`).
2. Công bố bản mới (xác nhận) → trang công khai đổi sang bản mới; `AuditLog` ghi `from/to`; link cũ chưa pin không đổi.
3. Sao chép từ link đã pin: nội dung đúng bản chốt dù đề đã sửa; chạy lại sau khi chuyển bản → tạo bản thứ hai `:vM`, không `ALREADY_COPIED`; retry cùng bản → cùng đề.
4. Sao chép đồng thời với đổi con trỏ (giữ khóa bằng PID như đợt trước, cả hai chiều): kết quả luôn nguyên một phiên bản.
5. Thu hồi, hết hạn, xóa đề: 404 như cũ, không lộ lý do; bản sao đã tạo giữ nguyên. Với link đã pin: câu được tham chiếu bị xóa hoặc không còn `shareable` (hoặc đổi chủ) → **404 dù snapshot còn**, và nội dung không bao giờ được lấy từ câu live; giáo viên thấy câu nào chặn link.
6. Link cũ (NULL) vẫn mở được như trước; nút "Chốt bản hiện tại" pin đúng phiên bản vừa đọc trong transaction.
7. Không lộ đáp án/lời giải/rubric khi `showAnswers=false` ở trang công khai **và** bản sao (từ snapshot).
8. Quyền: người không `canPublish` không tạo/đổi/thu hồi được; chủ khác nhận 404.
9. `clientRequestId`: gửi lại tạo link/công bố cùng mã → cùng kết quả; mã khác nội dung → 409.
10. Hình dữ liệu nhúng hiển thị đúng từ snapshot; hình theo URL có cảnh báo ở xem trước.
11. Rollout trên bản restore: sau expand migration, **mã cũ** vẫn chạy (đọc/ghi link cũ đúng); mã mới chạy trước migration thì lỗi rõ ràng và được ghi nhận là thứ tự cấm; sau bước 3, link NULL hoạt động như cũ.
12. **Fail closed**: tắt cờ tính năng → link đã pin vẫn trả đúng bản chốt; xóa/làm hỏng revision hoặc `pinnedRefs` của link pin (trên bản thử) → 404, tuyệt đối không phục vụ đề đang sửa; chạy quy trình đường lui 5(b) → link pin trả 404, hoàn nguyên danh sách thì trở lại đúng bản chốt.

## 10. Tệp cần thay và thứ tự tích hợp (Codex giữ)

1. `prisma/schema.prisma` + **expand migration** (4 cột nullable) — sau sao lưu/restore thử, **trước** mọi mã mới; rồi mới phát hành reader tương thích (mục 8 bước 3), cuối cùng mới bật tạo/đổi pin.
2. Thư viện mới nhỏ (ví dụ `src/lib/share-publication.ts`): chọn nguồn đọc (pinned snapshot hay live), dựng `buildShareCopy` từ snapshot, quy tắc quyền/đổi con trỏ; unit thuần.
3. `api/exams/[id]/share/route.ts`: POST ghi `pinnedVersion` trong transaction khóa Exam; thêm hành động công bố/chốt (PATCH) có `canPublish`, `clientRequestId`, audit; GET trả `pinnedVersion` + "đề đã sửa sau bản chốt".
4. `api/public/share/[id]/route.ts` và `/copy/route.ts`: đọc theo nguồn đã chọn; `sourceVersion` của sao chép lấy từ link đã pin.
5. Giao diện chia sẻ (hộp thoại link): xem trước, nhãn phiên bản, nút công bố/chốt, cảnh báo ảnh ngoài kho; trang `/share/[id]` hiển thị nhãn phiên bản.
6. Test HTTP (mục 9) và cập nhật báo cáo nhóm; chỉ khi đó mới cân nhắc đổi hiện trạng CV030/048.

## 11. Chưa đủ nguồn / không làm ở đây
- Chưa kiểm cách lưu thật của ảnh (`image.url`) và quyền tệp; chưa có số liệu dung lượng `ExamRevision`.
- Chưa xác định phía giao diện giáo viên cho "hộp thoại link" (tệp cụ thể) vì chưa đọc UI đó; mục 10.5 chỉ là hướng.
- Không thiết kế nền tảng công bố công khai, lịch phát hành, hay xuất bản cho người ngoài nhóm.
- Bài giao đã bất biến (`Assignment.snapshot`) nên **không** thuộc phạm vi đổi; chỉ cần đảm bảo "chuẩn bị snapshot cho giao bài" dùng cùng phiên bản đã chốt khi giáo viên chọn giao từ bản công bố (tùy chọn, quyết sau).
