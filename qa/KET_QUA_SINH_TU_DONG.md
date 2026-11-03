# Giữ báo cáo, để output kiểm ở local

- Git giữ báo cáo Markdown, mã kiểm/lệnh chạy và fixture có chủ đích. Ảnh, PDF, log và JSON sinh trong `qa/rebuild-*` được ignore; không dùng `git add -f` để đưa chúng trở lại. Fixture đầu vào nên ở `tests/fixtures`, không trộn với kết quả chạy.
- Báo cáo nhóm ghi commit, lệnh, kết quả, đích DB/provider, kiểm dọn fixture và giới hạn. Số test không phải phần trăm hoàn thành hay bằng chứng chuyên môn. Không chạy lại build/DB/AI chỉ để đóng hồ sơ.
- Khi cần điều tra, giữ raw ở local hoặc cất dưới `tmp/` cùng manifest/hash. Trước dọn, đối chiếu từng đường dẫn và giữ bản đang đổi. Không khôi phục cả `qa/` hoặc dùng clean/reset để xóa lẫn báo cáo, sửa mới, bản nháp hay dữ liệu manual.
- Các lệnh chuẩn `test:pilot`, `test:http` và `test:integration` mặc định ghi vào nhóm ngày UTC hiện hành; vẫn tôn trọng report directory được chỉ định rõ. Runner của đợt không chép kết quả integration cũ thành bằng chứng mới. Quy tắc ignore không tự bỏ theo dõi tệp lịch sử; script cũ chạy trực tiếp vẫn cần đối chiếu đường dẫn trước khi chạy.
- `npm run ci` đã có cả library và frame bên cạnh pilot. Chạy thêm bộ chuyên biệt khi sửa khu vực tương ứng; không suy rằng pilot thay cho mọi bộ UI.

## Định dạng mã

Prettier được pin trong devDependencies và lockfile; `.prettierrc.json` là cấu hình chung. Chỉ format tệp của thay đổi, không quét lại cả dự án cũ. Ví dụ kiểm phạm vi nhánh chat hiện tại trong PowerShell:

```powershell
$changed = git diff --name-only --diff-filter=ACMR 865bcea -- '*.ts' '*.tsx' '*.cjs' 'package.json' 'package-lock.json'
npm exec -- prettier --check $changed
```

Dùng `--write` thay `--check` khi muốn định dạng. Phiên bản formatter đã ghi trong lockfile; không cần thay cây node_modules dùng chung chỉ để format. Bộ formatter của đợt rà đã dùng đúng phiên bản có trong cache và kiểm AST/idempotence.
