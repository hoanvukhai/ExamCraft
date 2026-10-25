# CDX-R4 — migration từ checkout sạch

Kết quả PASS. Script: node scripts/rehearse-clean-migrations.cjs. Bằng chứng r4-clean-migration.json và r4-clean-migration.log (đã che thông tin kết nối).

## Đích đã kiểm
- Commit clone: 33b4b1dc2a771acbb10cd9f637e990a691d16f86.
- Scratch ngoài repo: C:\Users\ACER\AppData\Local\Temp\examcraft-clean-migration-ae82c2d3c8.
- DB mới: examcraft_migrate_clean_20261025_ae82c2d3c8; xác minh không trùng DBcấu hình và không tồn tại trước khi tạo.
- Không copy.env; chỉ truyềnURLcủaDBmới qua môi trường tiếntrình con. Không ghi DBexamcraft hoặc DBtest. Checkout/DBmới giữ lại để duyệt.

## Lệnh thực thi theo thứ tự
1. git rev-parse HEAD; git clone --no-hardlinks repo scratch.
2. npm ci --no-audit --no-fund trong scratch, chạy postinstall Prisma generate từ lockfile.
3. Kiểm Docker/port; CREATE DATABASE trên catalogpostgres với tênmớiđãkiểm.
4. CLI Prisma cục bộ trong scratch: migrate deploy → migrate status, hai lượt liên tiếp (tương đương npx prisma migrate deploy/status, không tải CLI khác).
5. git status --porcelain trong clone rỗng; _prisma_migrations có4bản/4finished/0rollback. Lượt deploythứhai báo No pending migrations to apply; status báo Database schema is up to date.

## Giới hạn
Checkout mới trên cùng máyWindows, dùng Node/npm/Docker và cache hiện có; không tuyên bố một máy vật lý chưa cài gì. Không chạy app hoặc restore dữ liệu trongR4 vì nhiệm vụ này kiểm migration. Cảnh báo Prisma về package.json#prisma deprecated vẫn còn, không tự nâng majorversion. Lầnpreflightđầu chưa chạygì vì guardngoàirepo chưa nhận diện đườngdẫn khác ổC/F, đã sửa guardvàlưutrướctrong r4-preflight-failure.json; không phải lỗi migration. Mọi bướcchạy lại đều dùng tênDBmới, không đổi cấu hình dự án khi thiếu quyền.
