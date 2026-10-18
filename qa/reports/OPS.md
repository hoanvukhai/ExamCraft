# BÁO CÁO KIỂM THỬ: ĐỘI OPS (DEVOPS, INFRASTRUCTURE & DEPLOYMENT)

- **Người thực hiện**: OPS SQUAD
- **Người ký duyệt**: TEST DIRECTOR
- **Môi trường**: Windows 11, Node.js 20+, Docker Compose (PostgreSQL 16), QA Container `examcraft_postgres_qa` cổng 5437.

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ

| Mã Test Case | Nội Dung Kiểm Thử | Trạng Thái | Bằng Chứng / Ghi Chú Thực Tế |
|---|---|---|---|
| `TC-OPS-001` | Khởi động Docker PostgreSQL độc lập và migrate schema | **PASS** | Container `examcraft_postgres_qa` cổng 5437 khởi động thành công, `prisma db push` đồng bộ trong 527ms. |
| `TC-OPS-002` | Kịch bản Seeding dữ liệu khởi tạo ban đầu | **PASS** | `prisma/seed.ts` khởi tạo thành công 1 Super Admin, 7 AiKeyState, 4 ExamTemplate chuẩn GDPT. |
| `TC-OPS-003` | Kiểm tra lệnh `npm test` trong `package.json` (R2) | **FAIL (BUG/DOC-STALE)** | `npm test` trỏ vào `tests/unit_tests.mjs` (bộ test v2 gồm 20 ca), **hoàn toàn không chạy 6 bộ test v3.1** (`tests/run_all_v3_tests.ts`). |
| `TC-OPS-004` | Kịch bản sao lưu CSDL `scripts/backup.ps1` (R19) | **PASS** | Xuất thành công file `qa/evidence/examcraft_backup_20261018_112007.sql` (44.02 KB) với cờ `--clean --if-exists`. |
| `TC-OPS-005` | Kịch bản khôi phục CSDL `scripts/restore.ps1` (R19) | **PASS** | Khôi phục thành công 100% vào database `examcraft_qa`. Kiểm tra `AiKeyState` (7 rows), `ExamTemplate` (4 rows) nguyên vẹn. |
| `TC-OPS-006` | Kiểm tra hệ thống CI tự động GitHub Actions (16.3) | **FAIL (MISSING)** | Thư mục `.github/workflows` **hoàn toàn chưa tồn tại** trong repo. Chưa có file workflow CI (lint, test, build). |
| `TC-OPS-007` | Đánh giá tính khả thi trên Serverless Vercel (R18) | **WARNING / HIGH RISK** | 1. Cơ chế Brute-force lockout dùng in-memory `Map` trong `src/lib/auth.ts`, sẽ bị mất trạng thái hoàn toàn trên Serverless Lambdas.<br>2. Chưa có PG connection pooling tích hợp nếu không dùng dịch vụ ngoài như Neon pooler. |

---

## 2. BẰNG CHỨNG LỆNH VÀ LOGS

### 2.1 Lỗi `npm test` trỏ vào bộ test cũ (R2)
```text
> exam-craft@0.1.0 test
> npx tsx tests/unit_tests.mjs
(Chỉ chạy 20 unit tests legacy, bỏ qua toàn bộ 43 tests tích hợp v3.1 trong tests/run_all_v3_tests.ts)
```

### 2.2 Sao lưu và khôi phục thành công trên DB QA
```powershell
powershell -File scripts/backup.ps1 -BackupDir qa/evidence -ContainerName examcraft_postgres_qa -DbName examcraft_qa -DbUser examcraft
# Kết quả: [OK] Backup completed: qa\evidence\examcraft_backup_20261018_112007.sql (44.02 KB)

powershell -File scripts/restore.ps1 -BackupFile qa/evidence/examcraft_backup_20261018_112007.sql -ContainerName examcraft_postgres_qa -DbName examcraft_qa -DbUser examcraft
# Kết quả: [OK] Database restore completed successfully!
```

---

## 3. ĐỀ XUẤT SỬA LỖI (PATCH GỢI Ý CHO OPS)

1. Cập nhật `package.json`:
   ```json
   "test": "npx tsx tests/run_all_v3_tests.ts",
   "test:unit": "npx tsx tests/unit_tests.mjs"
   ```
2. Thêm file `.github/workflows/ci.yml` để chạy kiểm tra build và test tự động trên GitHub Actions.
3. Chuyển `loginAttempts` từ in-memory `Map` sang lưu trữ bảng trong CSDL hoặc Redis nếu triển khai trên môi trường Serverless (Vercel).
