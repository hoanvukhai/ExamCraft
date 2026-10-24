# Kiểm tích hợp mã 1ce95b9 và sao lưu bằng PowerShell 5.1 — 25/10/2026 (Claude làm thay Codex)

Codex hết token nên người chỉ đạo chạy phần build/kiểm. Chỉ dùng DB thử `examcraft_test_20261022` và server thử cô lập (`isolatedTest=true`); không AI/provider thật; DB chính chỉ đọc (sao lưu).

## 1. Kết quả
| Kiểm | Kết quả | Log |
|---|---|---|
| Build 1 CPU, heap 1024 (`1ce95b9` + sửa dưới) | 46 trang đạt | [build](build-claude-integration.log) |
| SAFE | 324/324, fail 0, skip 0 (chạy trên `1ce95b9`, trước hai sửa giao diện nhỏ ở mục 2) | [safe](safe-claude-integration.log) |
| HTTP | 33/33 đạt (gồm giờ/lượt/mã vào bài/PIN) | [http](http-claude-integration.log) |
| Bộ kiểm trình duyệt F1–F7 | **7/7 đạt** ở lượt cuối (build có sửa mục 2) | [pilot](pilot-claude-full.log) |
| Sao lưu bằng `powershell` 5.1 (`backup.ps1 -Execute`) | `BACKUP_PACKAGE_CREATED`, `backups/package-20261024171439636` | [log](ps51-backup-execute2.log) |
| Khôi phục vào DB mới `examcraft_restore_ps51_20261024` (`restore.ps1 -Execute`) | `RESTORED_VERIFIED` | [log](ps51-restore-execute.log) |

## 2. Lỗi thật tìm thấy và đã sửa
1. **Song song: dòng ngữ liệu bị tính là một câu.** Dòng ngữ liệu mới dùng chung lớp `question-item` với câu hỏi, nên F3 đếm 8 thay vì 7 và quy tắc in "không ngắt trang trong câu" áp lên ngữ liệu một cách ngẫu nhiên. Đã đổi sang lớp riêng `parallel-passage` (`data-parallel-passage`), thêm vào quy tắc in ở `globals.css`.
2. **Sao lưu/khôi phục cấu hình hỏng trên máy không có PowerShell 7.** `scripts/backup-package-tools.cjs` (bước DPAPI) và `scripts/verify-full-restore.cjs` gọi cứng `pwsh`. Trên máy này `backup.ps1 -Execute` thất bại ("Backup package did not complete") và để lại một thư mục gói rỗng `backups/package-20261024171352028` (giữ nguyên, không xóa theo quy tắc). Đã đổi sang dùng `pwsh` nếu có, không thì `powershell`. Sau sửa: sao lưu và khôi phục đạt. Gói DPAPI do PowerShell 5.1 tạo và đọc lại khớp từng ký tự (kiểm trong chính script). Chưa kiểm đọc chéo giữa gói tạo bằng PowerShell 7 (ngày 23/10) và 5.1.
3. **Lỗi bộ kiểm, không phải lỗi ứng dụng:** (a) F5 phụ thuộc thứ tự: danh sách lớp tải bất đồng bộ rồi tự chọn lớp đầu, đè lựa chọn "làm tự do" khi máy chậm; đã chờ danh sách tải xong trước khi chọn. (b) Hạn chờ mỗi bước 12 giây quá ngắn khi máy còn ~600MB RAM; nâng lên 20 giây (`PILOT_STEP_TIMEOUT_MS` ghi đè được).

## 3. Cần biết khi chạy lại
- Lượt đầu (build trước sửa mục 2.1) F3 đạt sai lệch 8≠7, F6/F7 hỏng vì **server thử tự tắt giữa lượt** khi máy gần hết RAM (F6 chạy riêng đạt, F7 chạy riêng đạt). Hai lượt đầy đủ sau đó hỏng lần lượt ở F3 (chờ chữ 'Chấp nhận: 2' quá 12 giây) và F5 (race mục 2.3); mỗi luồng chạy riêng nhiều lần đều đạt. Các log lỗi giữ nguyên tại `first-run-failures/`; lượt cuối chạy một mình, không chạy lint/tsc/build cùng lúc, đạt 7/7.
- Mỗi build hoặc server thử cần máy gần như rảnh: đóng ứng dụng nặng; một tiến trình tại một thời điểm.

## 4. Giới hạn
- SAFE chưa chạy lại sau sửa 2.1 (chỉ đổi lớp CSS/thuộc tính, không đụng logic); HTTP không bị ảnh hưởng. Typecheck/lint chạy với tệp sửa.
- Chưa mở Word thật, in nhiều trang, offline, hai engine trình duyệt; chưa kiểm trực quan bản in Song song nhiều trang.
- Gói khôi phục `examcraft_restore_ps51_20261024` và gói sao lưu mới được giữ; không tự xóa.
- Bộ kiểm không chứng nhận chuyên môn nội dung và không đóng CV nào.
