# Quyền đối tượng và tài khoản của tab —23/10/2026

Tiếp CV011/013/028 trong cùng lượt sau nhóm vận hành và nháp writer.

## Đã sửa

- `accountFetch` gắn tài khoản mà giao diện đã mở; không tra tài khoản mới ngay trước khi gửi. Header này chỉ chống tab cũ nhầm tài khoản, quyền thật vẫn từ phiên server. Thiếu owner ở client bị từ chối trước fetch.
- `requireRequestAuth` dùng chung xác thực, kiểm tài khoản kỳ vọng và same-origin khi ghi. Đã nối vào folder/group/question/shared/fork/revisions và key/test/usage. Dashboard, ngân hàng, câu hỏi, quản lý lớp và modal key gửi đúng owner đã chụp; modal được remount theo owner.
- Cây thư mục và số lượng đề chỉ chứa dữ liệu cùng chủ; danh sách bài giao trong chi tiết nhóm cũng lọc chủ. Khi nguồn cũ có liên kết folder/đề khác chủ, xóa thư mục trả409 và giữ dữ liệu để đối chiếu. Luồng thường chỉ gỡ liên kết đề thuộc chủ trước xóa thư mục.
- Nút thêm học sinh gửi `PATCH {newStudentNames:[...]}` thay PUT sai hợp đồng. Các lỗi đổi tài khoản từ ngân hàng trả409 rõ ràng thay500.

## Đã kiểm

- SAFE sau sửa quyền:20+124=144đạt; sau tích hợp chat:20+131=151đạt. [SAFE cuối](safe-scope-access.log).
- Bản tích hợp build/typecheck45trang đạt, có API chat mới; [build](build-scope-access.log). Không nhận lint toàn repo sạch.
- HTTP16/16đạt mới trên `examcraft_test_20261022`, health xác nhận isolated trước ghi; [log](http-scope-access.log). Hai giáo viên, private/cross-origin, pin tài khoản cả đọc/ghi/key test/usage, tham chiếu folder ngoài quyền, liên kết cũ khác chủ bị giữ và xóa folder thường không làm mất đề. Tất cả fixture HTTP được cleanup trong DB thử. Lần kiểm trước bắt được GET ngân hàng trả sai500; đã sửa và vòng này đạt.
- Browser IAB qua app production3117: tài khoản Giáo viên thử nghiệm2 tạo lớp giả `QA nhóm kiểm thêm học sinh 23-10`, thêm `Học sinh QA thêm bằng nút`, tải lại và mở danh sách vẫn1học sinh. [DOM](group-add-after-reload.txt), [ảnh](group-add-after-reload.png). Fixture được giữ trong DB thử; không dữ liệu học sinh thật. Tab nhóm đã đóng.
- Không gọi AI/nhà cung cấp hoặc sửa DB chính. Bộ kiểm đã kiểm quyền thực tế, không suy server quyền từ header do client gửi.

## Giới hạn

Chưa nghiệm thu mọi UI đổi tài khoản trong lúc phản hồi chậm, chưa có browser độc lập thứ hai và chưa đủ quyền mẫu/template để đóng CV011. Header kỳ vọng là tùy chọn để tương thích caller cũ; các caller chưa được chuyển vẫn cần rà theo từng luồng. Giữ CV011/028 mở; CV013 là hoàn tất nền local từ trước, production/rekey vẫn là cổng riêng.
