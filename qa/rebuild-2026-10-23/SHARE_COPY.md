# Sao chép đề từ link chia sẻ vào kho server — 24/10/2026

CV048 (liên quan CV015/052). Không migration, không AI, chỉ DB thử.

## Lỗi đã có
Nút "Tạo bản sao để sửa" ở `/share/[id]` chỉ ghi vào kho cũ của trình duyệt (IndexedDB + `examcraft_current_exam`) rồi về trang chủ. Đề không lên server, giáo viên không thấy trong kho; còn dùng bản đã lọc đáp án của trang công khai.

## Đã sửa
- `POST /api/public/share/[id]/copy` (mới): cần đăng nhập đã đổi mật khẩu, cùng nguồn gốc (same-origin), khớp tài khoản đang mở. Link phải còn hạn/chưa thu hồi, đề chưa vào thùng rác, câu còn chia sẻ được và `allowCopy` bật (không thì `403 COPY_NOT_ALLOWED`).
- `src/lib/share-copy.ts` dựng bản sao: ID cố định theo link nên bấm lại/retry không tạo bản thứ hai (trả cùng đề); tiêu đề có tiền tố "[Bản sao]"; mọi câu về `draft`/`none`/version1; bỏ gói kiến thức, phạm vi, kế hoạch đề, mẫu áp dụng và mã kiến thức vì chia sẻ công khai không mang các phần này. Giữ điểm0.
- **Chính sách đáp án (chủ dự án đã xác nhận giữ, 24/10):** chỉ khi link bật "hiện đáp án" thì bản sao mang đáp án/lời giải/rubric/vế đúng của ghép/thứ tự đúng. Link ẩn đáp án thì bản sao bị xóa các phần đó (giáo viên phải nhập lại), để không lộ đáp án ngoài chính sách chủ đề đã chọn.
- Trang chia sẻ gọi route trên bằng tài khoản đã ghim, báo lỗi tại chỗ, thành công thì mở `/editor/<id>`; không còn ghi kho cũ.

## Bằng chứng (chạy mới, sau sửa cuối)
- Unit `share_copy.test.ts` 3/3: giữ điểm0, ẩn/hiện đáp án đúng chính sách, không đổi nguồn, không nhân đôi tiền tố.
- HTTP18/18 (thêm 1 ca): link không cho sao chép→403; chưa đăng nhập→401; khác origin→403; tài khoản ghim sai→409; các yêu cầu bị từ chối không tạo bản sao; sao chép đúng→đề thuộc người sao chép, không lộ lời giải/rubric của link ẩn, giữ2câu/điểm/lựa chọn; retry trả cùng đề, vẫn1bản; đề gốc không đổi; chủ gốc không xem được bản sao (404). [log](http-share-copy.log).
- Build46trang có route mới ([log](build-share-copy.log)). **Lưu ý môi trường:** 3 lần build đầu sập worker Node (mã 3221226505) ở bước tạo trang tĩnh khi máy chỉ còn ~800MB RAM trống/7,9GB; build đạt khi tạm đặt `experimental.cpus: 2` (đã hoàn lại `next.config.ts`, không commit). Không phải lỗi mã nhưng build mặc định 11 worker có thể sập trên máy này.
- SAFE: xem báo cáo CV057 cùng đợt. Đã sửa `backup_package.test.ts` gọi `pwsh` cứng (máy không có) thành `pwsh` nếu có, không thì `powershell`.
- UI thật: link tạo allowCopy bật + ẩn đáp án → bấm nút → đề `[Bản sao] …` xuất hiện trong DB thử đúng chủ, trang chuyển `/editor/<id>` hiển thị "Đã lưu trên máy chủ"; bản sao không chứa lời giải riêng, đề gốc vẫn còn. Đã xóa riêng bản sao và link thử; còn các dòng câu hỏi mồ côi `__workspace_only` của bản sao trong DB thử (hành vi sẵn có khi xóa đề).

## Giới hạn
- Mỗi người chỉ một bản sao cho mỗi link. Nếu chủ sửa đề gốc rồi người dùng bấm lại, nhận `409 ALREADY_COPIED` (mở từ kho); chưa có "sao chép lại bản mới".
- Ảnh/hình trong đề sao theo nội dung đã lưu; chưa thử hình ngoài kho.
- Chưa kiểm hai tài khoản trên hai browser độc lập.
