# Giữ đề xuất qua tải lại và Undo/Redo Copilot — 24/10/2026

## Đã làm

- `ai-proposal-journal.ts` giữ immutable base + candidate/result theo tài khoản/đề/UUID writer. Không lưu request options hoặc khóa AI. Đề xuất câu lọc thêm ID câu; sai danh tính/khóa ô, JSON hỏng hoặc format chưa biết giữ raw để tải, không tự áp dụng.
- `useAiProposal` dùng external store và server snapshot0 để không đọc localStorage khi SSR/hydration ban đầu. Pending phục hồi ở trang mới; bản đã cất chỉ mở lại theo lựa chọn rõ ràng. Mọi lần áp dụng vẫn kiểm nền/quyền như trước.
- Áp dụng/bỏ đề xuất chuyển sang kho đối chiếu bằng copy→đọc xác nhận→retire đúng raw revision. Bản cất còn xem/tải; không phải xóa sau parent ack hoặc khẳng định đã lưu server. Quota/RAM lỗi thì giữ nguồn và cảnh báo tải dự phòng. Bản >4MB giữ RAM, không giả đã bảo vệ qua reload.
- Panel phục hồi theo tài khoản có pending/archive, tải JSON và xem lại; đề/câu không còn ở trang hiện tại không được tự chèn vào. Cache theo revision giúp các Card dùng chung kết quả đọc; chỉ một storage listener mỗi trang, kho archive phân tích khi cần xem.
- Copilot có Undo/Redo cho sửa/thêm/bỏ trong phiên soạn, chỉ chuyển mốc sau props ack đúng. So lại owner/doc/source/toàn danh sách trong handler và updater; mới sửa hoặc mất quyền thì giữ nguyên. Câu thay đổi/phục hồi tăng version/reset verified; câu không liên quan giữ nguyên. Chuỗi travel cập nhật stamp để nhiều Undo/Redo không sinh ghost history hoặc trùng ID.

## Bằng chứng

- [Focused](ai-journal-history-focused.log):14/14, gồm5journal +4history +5submission; kiểm quota/source/malformed/account/doc/writer/archive/explicit restore, version/ID/0/ảnh/chain/race/quyền/duplicate ack.
- [SAFE cuối](safe-ai-journal-history.log):20+203=223đạt. [Build cuối](build-ai-journal-history.log):46trang/typecheck exit0. [Lint các tệp mới](ai-journal-history-new-lint.log):exit0; [lint tích hợp](ai-journal-history-lint.log):0lỗi/10warnings cũ. Không nhận lint toàn repo sạch.
- HTTP17/integration7 kế thừa nhóm trước: không sửa API/service/schema trong nhóm này, không chạy lại DB chỉ để cập nhật tài liệu. Không dùng khóa/provider thật.

| Browser actual components, fake API/CSP không mạng | Bằng chứng |
|---|---|
| Copilot pending hiện ở trang mới, calls[] không yêu cầu AI lại | [fresh page](ai-journal-fresh-page.txt) |
| Sửa→thêm→Undo2→Redo2: giữ B/0/hình, A version6 và câu thêm cùng ID/version2 | [chain](copilot-undo-redo-chain.txt) |
| Parent từ chối Undo giữ2mốc/3câu; retry sau đó nhận đúng mới chuyển mốc | [refused](copilot-history-parent-refused.txt) |
| Đổi source thì Undo bị chặn, submissions/nội dung/version không tăng | [stale](copilot-history-stale-context.txt) |
| Archive vẫn xem được, mở bản cũ chỉ preview và Apply bị khóa | [DOM](ai-journal-archived-open-stale.txt), [ảnh](ai-journal-archived-open-stale.png) |
| Tải JSON thật từ archive, kiểm owner/kind/action đúng, giữ bản QA trong repo | [download](ai-journal-downloaded.json) |
| Account QA câu khác không thấy kho Copilot trên cùng origin | [isolation](ai-journal-other-account-hidden.txt) |
| Đề xuất câu phục hồi ở trang mới/calls[]; Apply→Undo vẫn giữ0/hình/context, version6 | [fresh](ai-journal-question-fresh-page.txt), [apply/undo](ai-journal-question-apply-undo.txt) |
| Sau cache/lazy-read cuối, archive2 còn, không auto-preview; mở rõ ràng vẫn guard stale | [final](ai-journal-final-lazy-archive.txt) |

Fixture reset chỉ cất các proposal QA đúng account, không xóa nguồn hoặc DB. Download browser mất thời gian bất thường nhưng đã trả tệp; không suy tốc độ này thành hiệu năng sản phẩm. Harness không CSS production/không DB/provider.

## Giới hạn và tiếp nối

- Undo/Redo hiện là RAM của phiên soạn, không giữ stack khi reload. Archive là bản đối chiếu, không tự khôi phục nội dung hoặc bỏ kiểm version. Các mốc server có sau khi lưu đề.
- Chưa nhập lại JSON proposal từ máy khác; tải dự phòng đã có nhưng không nhận là complete restore workflow. Chưa kiểm hai browser profile độc lập, airplane hoặc kho hàng nghìn proposal; không đặt retention tự xóa.
- Cache chỉ invalidated bởi module hoặc storage event; không coi localStorage là giao dịch CAS nguyên tử. Payload immutable/per-writer + archive exact raw bảo toàn bản đối chiếu; server CAS/updater mới quyết định có ghi bản soạn hay không.
- Provider/chất lượng chuyên môn và các caller AI ngoài luồng đang dùng vẫn mở. Không đóng toàn bộ CV025/035/050/053 vì số test.
- QA3117 production và harness3122 đang chạy để tiếp tục nhóm giao/chấm bài, không build khi QA3117 dùng `.next`. Trạng thái server cuối lượt xem02.
