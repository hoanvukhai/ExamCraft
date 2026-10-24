# Trạng thái để tiếp nối

Cập nhật: **24/10/2026 (đêm)**. Tệp này được **viết đè** mỗi đợt theo khuôn dưới, giữ khoảng một trang. Số test, tên log và giới hạn chi tiết chỉ nằm trong báo cáo nhóm được liên kết; không chép lại ở đây. Bản trước khi viết lại: [lịch sử 02](../lich-su/TRANG_THAI_02_2026-10-24.md).

## 1. Mốc hiện tại

- **Tiến độ:** vẫn 8/78 CV đạt theo [checklist](../ke-hoach-2026-10-21/03_CHECKLIST.md); chưa tổng nghiệm thu. Từ 24/10 làm theo **mốc pilot** ([04_MOC_PILOT](../phoi-hop-ai/04_MOC_PILOT.md)): Claude chỉ đạo, Codex thực thi, Gemini chuẩn bị nội dung/thẻ kiểm. Chủ dự án đã duyệt mức "đạt trong phạm vi pilot" cho CV tiện ích (không đổi dấu `[x]`).
- **Bộ kiểm pilot F1–F7 chạy được** (`npm run test:pilot`, Chrome cài sẵn, DB thử): **7/7 luồng đạt trên mã `4941199`** (gồm mọi tính năng pilot và sửa review), build 46 trang, SAFE 324/324, HTTP 33/33. Claude chạy thay Codex (hết token). Tìm và sửa ba lỗi thật: mã đề có ảnh không tải được Word (Codex), dòng ngữ liệu ở Song song bị đếm như câu hỏi, và sao lưu cấu hình hỏng khi máy không có PowerShell 7 (nay sao lưu và khôi phục bằng PowerShell 5.1 đạt vào DB mới `examcraft_restore_ps51_20261024`). Máy ít RAM làm server thử tự tắt giữa lượt: chạy một mình, một tiến trình. Chi tiết: [PILOT_CLAUDE_INTEGRATION](../../qa/rebuild-2026-10-24/PILOT_CLAUDE_INTEGRATION.md), [PILOT_E2E](../../qa/rebuild-2026-10-24/PILOT_E2E.md), [PILOT_GAPS](../../qa/rebuild-2026-10-24/PILOT_GAPS.md).
- **Tính năng mới cho pilot:** tùy chọn nâng cao khi giao bài, chế độ xem Song song (có ngữ liệu), sao chép đề từ link chia sẻ vào kho server, nhật ký nháp học sinh, chấm tay có bản nền điểm và lịch sử, giờ/mã hiển thị cho giáo viên. Đã build và kiểm tự động như trên.
- **Phân tích:** [PILOT_GAP_ANALYSIS](../../qa/rebuild-2026-10-24/PILOT_GAP_ANALYSIS.md), [CV025_REVISION_COST](../../qa/rebuild-2026-10-24/CV025_REVISION_COST.md) (mỗi lần lưu ghi lịch sử mọi câu; đề xuất chỉ ghi câu đổi, P1 sau pilot).
- **Phối hợp AI:** Gemini đã nộp GEM-P1…P8 (duyệt có giới hạn; P7 bị yêu cầu sửa) và đang nhận GEM-P9…P12; Codex hết token lượt trước, chờ resume. Theo [BATCH_REVIEWS](../../qa/ai-review/coordination/BATCH_REVIEWS.json), [ASSIGNMENTS](../../qa/ai-review/coordination/ASSIGNMENTS.json). Các gói nội dung Toán 6/môn 2 là bản chuẩn bị chờ duyệt chuyên môn, chưa phải nội dung chuẩn.
- Không gọi provider/khóa thật, không ghi DB chính. Model mặc định: [MODEL_DEFAULT_AND_BUILD_CPUS](../../qa/rebuild-2026-10-23/MODEL_DEFAULT_AND_BUILD_CPUS.md).

## 2. Đã có, chưa đồng nghĩa nghiệm thu

- Bảo toàn working tree/bí mật, restore DB thử; migration đã qua bản phục hồi và cài mới rồi áp dụng DB chính, bảng ứng dụng cũ không đổi tại mốc kiểm ([main-migration.json](../../qa/rebuild-2026-10-22/main-migration.json)). Backup/restore local đạt CV072 ([OPERATIONS_REHEARSAL](../../qa/rebuild-2026-10-23/OPERATIONS_REHEARSAL.md)); chưa cutover/chuyển máy.
- Lưu server, nháp theo tài khoản/writer, phiên bản nền, giữ nháp khi xung đột; adapter bảy dạng câu, ngân hàng/fork, lịch sử/quyền, nhập dữ liệu cũ có xem trước ([CROSS_IMPORT_AND_FULL_RESTORE](../../qa/rebuild-2026-10-23/CROSS_IMPORT_AND_FULL_RESTORE.md), [BROWSER_AND_INDEXEDDB](../../qa/rebuild-2026-10-23/BROWSER_AND_INDEXEDDB.md)). Chưa đủ ca thực tế để đóng S1.
- Soạn thủ công câu–đáp án, phần/ngữ liệu/hình, tiêu đề, mẫu cá nhân, kế hoạch mục tiêu; gói kiến thức theo phiên bản, include/exclude và liên kết từng câu. Gói minh họa là fixture giả, chưa phải nội dung chương trình chuẩn.
- Sinh AI bảy dạng và đề xuất duyệt trước khi áp dụng; BYOK + quota ứng dụng cho mọi route AI; public allowlist, cookie lượt làm có chữ ký, snapshot bài giao, chấm tay; ghi chú AI riêng tư.
- Nhập/trộn/Word/trình chiếu đã sửa và kiểm một phần; còn tài liệu phức tạp và nhiều luồng UI.

**Chưa có bằng chứng:** chất lượng AI thật và nhận/duyệt kết quả nhà cung cấp thật qua browser; offline với hai trình duyệt độc lập; Word/PDF phức tạp; gói đủ môn–lớp đã duyệt; lint toàn repo sạch; tổng nghiệm thu. Chi tiết theo nhóm: [TESTING](../../qa/rebuild-2026-10-22/TESTING.md) và báo cáo trong `qa/rebuild-2026-10-23/` (tra qua [bản đồ01](01_BAN_DO_MA_NGUON.md)).

## 3. Việc tiếp theo khi được yêu cầu tiếp tục kỹ thuật

1. **Codex (khi có token):** phần build/SAFE/HTTP/test:pilot/gap I đã được Claude làm thay. Việc cho Codex: soát lại diff `4941199`, mở lại thêm ca vào bộ kiểm (Song song có ngữ liệu, giờ hiển thị) bằng fixture đã sửa của Gemini khi GEM-P9 xong, rồi CV025 chỉ ghi câu đổi ([CV025_REVISION_COST](../../qa/rebuild-2026-10-24/CV025_REVISION_COST.md)).
2. **Gemini:** GEM-P9 (sửa dữ liệu đề mẫu: ảnh dataURL, README, ngữ liệu chung), GEM-P10 (cập nhật hướng dẫn/thẻ kiểm cho tính năng mới), GEM-P11 (phiếu phản hồi), GEM-P12 (kiểm nguồn hai gói nội dung). Tin: `claude-gemini-20261024T160000Z`.
3. **Chủ dự án:** thử tay bằng [thẻ kiểm](../huong-dan/THE_KIEM_TAY_GIAO_BAI_VA_WORD.md) việc chưa tự động hóa được (mở Word, in nhiều trang, offline, hai trình duyệt); tìm giáo viên thử và người duyệt theo [05_TUYEN_GIAO_VIEN_VA_NGUOI_DUYET](../phoi-hop-ai/05_TUYEN_GIAO_VIEN_VA_NGUOI_DUYET.md).
4. **Sau pilot (P1):** CV025 chỉ ghi câu đổi; CV010/011 offline, nhiều tab, hai trình duyệt độc lập; CV057/060/061 phần còn lại; CV048 chọn sao chép lại sau khi đề gốc đổi; bản chụp `ExamRevision` mang ảnh mỗi lần lưu (đo ở CV074).
5. Nội dung theo sổ nguồn; tìm giáo viên/mẫu thực tế; chưa có reviewer/ngân sách/nơi triển khai.
6. CV077 còn: liên kết tuyệt đối `F:/…` còn ở 3 tệp (tham chiếu `tệp:dòng` trong báo cáo V1–V3, giữ vì là nguồn), kiểm lại banner lịch sử khi thêm báo cáo mới.

Thứ tự là đề nghị, không thay lộ trình/tiêu chí. Lỗi mất dữ liệu hoặc vượt quyền mới phát hiện được ưu tiên trước tính năng. Không tự reset engine hoặc dữ liệu dự án khác.

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

- **Git:** thay đổi từ 22/10 nằm trên nhánh local `rebuild/2026-10-local` (HEAD tại thời điểm viết: `2e3e46d`); nhánh `ai/claude-pilot-features` (b44c0ec) đã được tích hợp thành `0f7a29f`; tệp của Gemini (`docs/huong-dan/`, hai gói `PILOT-*`, `tests/fixtures/pilot/`, tin trong `messages/`) còn chưa commit; `main` và baseline cũ vẫn là `bb831f240772f27ee57e4abcb83442ab0361e483`. Chưa push/merge; chỉ làm khi chủ dự án cho. Commit nhỏ theo nhóm cuối mỗi đợt khi được yêu cầu; không reset/dọn. `.gitattributes` giữ đúng byte `migration.sql` đã áp dụng. `tmp/` bị ignore, giữ nguyên trên máy.
- **DB:** main là container `examcraft_postgres`, cổng 5436, DB `examcraft`. Test `examcraft_test_20261022`; restore `examcraft_restore_20261022`; cài mới kiểm migration `examcraft_migrate_fresh_20261022`. Không nhầm bốn DB; không đụng container dự án khác `study_work_postgres`/5435.
- **Server QA:** QA production 3117 (phiên của Codex, DB thử, build trước `1ce95b9`) có thể còn chạy; kiểm cổng trước khi dùng, dừng trước build. Build/lint/SAFE tuần tự, 1 CPU, heap 1024; không chạy cùng lúc trên máy ít RAM. Luôn kiểm trạng thái, không tin session ID/tool handle cũ.
- **PowerShell:** máy chưa có `pwsh`; runbook dùng `powershell` 5.1 (CV073).
- **Tìm kiếm:** `.rgignore` loại báo cáo lịch sử, `docs/lich-su/`, `qa/` gốc, log/DOM dump `qa/rebuild-*/*.log|*.txt` và danh mục nghiên cứu lớn khỏi tìm kiếm mặc định. Cần thì chỉ rõ tệp hoặc dùng `rg --no-ignore`.
- **Bí mật:** bản sao trong `backups/` (không Git); bí mật DPAPI phụ thuộc hồ sơ Windows. Bí mật mã hóa key cũ chưa phù hợp production: **không xoay tùy tiện vì có thể mất khả năng giải mã key cũ**. Kế hoạch rekey/asset restore còn mở. Không chép `.env`, key, cookie, mật khẩu hoặc dữ liệu thật vào hồ sơ.
- Đọc guide Next cục bộ liên quan trước khi sửa code.

## 6. Cách cập nhật cuối mỗi đợt

Viết đè mục 1 và 3; các mục khác chỉ sửa khi thực tế đổi. Ghi theo mẫu: **đã sửa — đã kiểm (loại kiểm/đích/kết quả, liên kết báo cáo nhóm) — chưa kiểm/lỗi — CV còn mở — bước tiếp theo**. Số liệu và log chỉ ghi trong báo cáo nhóm; checklist ghi một dòng "Hiện trạng" cho CV liên quan; báo cáo tiến độ chỉ thêm thông báo khi có thay đổi đáng báo. Ghi rõ kiểm mới hay kế thừa; chưa chạy thì viết chưa chạy. Nội dung cũ không còn là hiện trạng chuyển sang `docs/lich-su/` hoặc để lịch sử Git, không xóa mất.
