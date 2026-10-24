# BÁO CÁO KẾT QUẢ SỬA LỖI & NÂNG CẤP DỰ ÁN EXAMCRAFT v3.1 (FIX SPRINT REPORT)

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

> **Dự án**: ExamCraft v3.1 — Nền tảng Trợ lý AI Soạn đề & Khảo thí Trực tuyến  
> **Giai đoạn**: Fix Sprint & Regression Gate  
> **Thời gian thực hiện**: 18/10/2026  
> **Cơ chế quản lý**: Phân vai chuyên trách theo Squads (Agile / DevSecOps)  
> **Trạng thái phê duyệt**: **CHÍNH THỨC ĐẠT CHUẨN FULL-GO (100% PRODUCTION READY)**  

---

## 1. MÔ HÌNH QUẢN LÝ DỰ ÁN & PHÂN VAI TRÁCH NHIỆM (SQUADS)

Chiến dịch khắc phục lỗi toàn diện được tổ chức theo phương pháp quản lý linh hoạt (Agile Squads), phân định rõ vai trò (RACI Matrix) nhằm đảm bảo tính cô lập, an toàn và truy vết trách nhiệm:

```
                          ┌────────────────────────┐
                          │     TEST DIRECTOR      │
                          │  (Chỉ huy & Điều phối) │
                          └───────────┬────────────┘
                                      │
         ┌──────────────┬─────────────┼──────────────┬──────────────┐
         ▼              ▼             ▼              ▼              ▼
   ┌───────────┐  ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐
   │ SQUAD SEC │  │ SQUAD AUTH│ │SQUAD CORE │  │ SQUAD FE  │  │SQUAD DEVOPS│
   │& MIGRATION│  │& IDENTITY │ │ & EXPORT  │  │& REALTIME │  │  & DOCS   │
   └───────────┘  └───────────┘ └───────────┘  └───────────┘  └───────────┘
```

### Bảng Phân Vai Nhân Sự Chuyên Trách

| Squad | Trưởng nhóm (Role Lead) | Trọng tâm phụ trách | Nhiệm vụ chính trong Sprint |
|---|---|---|---|
| **Squad SEC & MIGRATION** | Lead DevSecOps | An toàn dữ liệu, di trú & cô lập môi trường | Tiêu diệt triệt để các route `/api/cloud/*` rò rỉ đề thi qua plain JSON, dọn sạch thư mục `data/` và `cloud-storage.ts`, chuyển hướng `/test/[id]` sang `/room`, chuyển đổi `/share/[id]` sang API PostgreSQL. |
| **Squad AUTH & IDENTITY** | Backend / Security Specialist | Xác thực, phân quyền & chống tấn công dò mật khẩu | Khóa cứng `mustChangePassword` ở cấp máy chủ trong `requireAuth()`, nâng cấp cơ chế lockout chống Brute-force bền vững đa container qua bảng `AuditLog`, thiết lập Guard từ chối khởi động ở Production khi dùng Secret mặc định. |
| **Squad CORE & EXPORT** | Core Platform Lead | Soạn thảo, xử lý hình học & xuất bản Word/Snapshot | Bổ sung hiển thị Bảng biến thiên (Native Table) và Đồ thị Canvas (`ImageRun`) khi xuất Word `.docx`, nâng cấp khử lộ đáp án đệ quy cho `snapshot.sections[].questions`. |
| **Squad REALTIME & FE** | Frontend Lead | Giao diện, trải nghiệm người dùng & giám sát | Tạm dừng polling 4s khi tab bị ẩn (`document.hidden`), tối ưu hóa modal kết quả thi gắn kết với phòng thi v3.1, loại bỏ cảnh báo type-check. |
| **Squad DEVOPS & DOCS** | DevOps & Compliance Lead | CI/CD, kịch bản kiểm thử & căn cứ pháp lý | Chuẩn hóa `package.json` trỏ tới test suite v3, thiết lập pipeline `.github/workflows/ci.yml`, đính chính chuẩn mực pháp lý sang **Quyết định 764/QĐ-BGDĐT**. |
| **Squad REV (Kiểm định)** | Test Director / QA Lead | Kiểm thử độc lập & cổng xuất xưởng (QA Gate) | Chạy kiểm thử hồi quy 6 giai đoạn, chạy kiểm thử 100 học sinh tải mạng, nghiệm thu bản build `npm run build` đạt Exit Code 0. |

---

## 2. CHECKLIST THEO DÕI TIẾN ĐỘ SỬA LỖI (SPRINT BURNDOWN CHECKLIST)

| Mã Lỗi | Phân Loại | Mức Độ | Squad Phụ Trách | File Tác Động Chính | Trạng Thái |
|---|---|---|---|---|:---:|
| `SEC-BUG-001` | Security / Leak | **P0 (Critical)** | SEC & MIGRATION | `src/app/page.tsx`<br>`src/components/StudentResultsModal.tsx`<br>`src/app/share/[id]/page.tsx`<br>`src/app/test/[id]/page.tsx`<br>`src/app/api/public/share/[id]/route.ts`<br>*(Đã xóa: `src/app/api/cloud/`, `src/lib/cloud-storage.ts`, `data/`)* | **ĐÃ XONG (100%)** |
| `EXP-BUG-001` | Core / Export | **P0 (Critical)** | CORE & EXPORT | `src/lib/docx-export.ts` | **ĐÃ XONG (100%)** |
| `SEC-BUG-002` | Security / Guard | **P1 (High)** | AUTH & IDENTITY | `src/lib/auth.ts` | **ĐÃ XONG (100%)** |
| `AUTH-BUG-002` | Security / RBAC | **P1 (High)** | AUTH & IDENTITY | `src/lib/auth.ts`<br>`src/app/api/questions/route.ts` | **ĐÃ XONG (100%)** |
| `AUTH-BUG-001` | Security / Lockout | **P1 (High)** | AUTH & IDENTITY | `src/lib/auth.ts`<br>`src/app/api/auth/login/route.ts` | **ĐÃ XONG (100%)** |
| `ROOM-BUG-001` | Room / Sanitizer | **P1 (High)** | CORE & EXPORT | `src/app/api/public/assignments/[publicId]/route.ts` | **ĐÃ XONG (100%)** |
| `OPS-BUG-001` | DevOps / Test | **P1 (High)** | DEVOPS & DOCS | `package.json` | **ĐÃ XONG (100%)** |
| `OPS-BUG-002` | DevOps / CI | **P1 (High)** | DEVOPS & DOCS | `.github/workflows/ci.yml` | **ĐÃ XONG (100%)** |
| `MON-BUG-001` | Performance / FE | **P2 (Medium)** | REALTIME & FE | `src/app/teacher/assignments/[id]/page.tsx` | **ĐÃ XONG (100%)** |
| `REC-BUG-001` | Legal / Compliance | **P2 (Medium)** | DEVOPS & DOCS | `README.md`<br>`docs/BAO_CAO_TOAN_DIEN_V3.md`<br>`prisma/seed.ts`<br>`src/lib/auto-grader.ts`<br>`src/components/GenerateModal.tsx` | **ĐÃ XONG (100%)** |
| `FE-BUG-001` | Frontend / Types | **P3 (Low)** | REALTIME & FE | `src/components/StudentResultsModal.tsx`<br>`src/lib/docx-export.ts` | **ĐÃ XONG (100%)** |

---

## 3. CHI TIẾT KỸ THUẬT CÁC BẢN VÁ (TECHNICAL PATCH DETAILS)

### 3.1. Squad SEC & MIGRATION: Loại bỏ hoàn toàn lộ lọt dữ liệu qua Route Legacy (`SEC-BUG-001`)

* **Nguyên nhân gốc rễ**: Phiên bản cũ v1/v2 để lại thư mục `src/app/api/cloud/` và `src/lib/cloud-storage.ts` ghi đè trực tiếp file `data/cloud_exams.json` trên ổ đĩa máy chủ không qua kiểm tra phiên đăng nhập (RBAC), khiến đề thi và toàn bộ đáp án bị công khai.
* **Biện pháp xử lý**:
  1. Xóa vĩnh viễn toàn bộ thư mục `src/app/api/cloud/` (4 route endpoints), xóa `src/lib/cloud-storage.ts` và thư mục `data/`.
  2. Tại `src/app/page.tsx`: Sửa hàm `handleSaveCloud` chuyển sang đồng bộ trực tiếp vào cơ sở dữ liệu PostgreSQL qua API `/api/migration/import-legacy`. Cắt bỏ lệnh gọi ngầm `fetch(/api/cloud/exams/...)`.
  3. Tại `src/app/share/[id]/page.tsx`: Xây dựng API bảo mật mới `src/app/api/public/share/[id]/route.ts` đọc đề thi từ PostgreSQL kèm phân quyền rõ ràng.
  4. Tại `src/app/test/[id]/page.tsx`: Thay thế toàn bộ mã làm bài cũ bằng trang điều hướng chuẩn `LegacyTestRedirectPage`, hướng dẫn học sinh truy cập vào cổng phòng thi chính thức `/room` với mã bảo mật.
  5. Tại `src/components/StudentResultsModal.tsx`: Tách rời hoàn toàn khỏi `cloud-storage.ts`, bổ sung banner thông tin trực quan dẫn tới phân hệ Quản lý Phòng thi `/teacher/assignments`.

---

### 3.2. Squad AUTH & IDENTITY: Bảo vệ mật khẩu & Chống Brute-Force đa tầng (`SEC-BUG-002`, `AUTH-BUG-002`, `AUTH-BUG-001`)

* **Nguyên nhân gốc rễ**:
  - `mustChangePassword`: Chỉ kiểm tra ở phía giao diện (Client-side), học sinh/giáo viên đổi mật khẩu có thể dùng công cụ như Postman/curl gọi trực tiếp API `/api/questions` mà không bị chặn.
  - Rate Limiting: Lưu trữ trong bộ nhớ RAM (`Map`), dẫn tới vô hiệu hóa khi triển khai trên cụm máy chủ nhiều container hoặc môi trường Serverless (Vercel Lambda).
  - Production Secret: Chưa có chốt an toàn ngăn chặn việc khởi động web với biến môi trường mẫu.
* **Biện pháp xử lý**:
  1. **Chặn API cấp máy chủ**: Cập nhật hàm `requireAuth()` trong [src/lib/auth.ts](file:///f:/Workspace/Zazz/ExamCraft/src/lib/auth.ts):
     ```typescript
     export async function requireAuth(options?: { allowMustChangePassword?: boolean }): Promise<UserSession> {
       const user = await getCurrentUser();
       if (!user) throw new Error('UNAUTHORIZED');
       if (user.mustChangePassword && !options?.allowMustChangePassword) {
         throw new Error('MUST_CHANGE_PASSWORD');
       }
       return user;
     }
     ```
     Tại Route Handler (ví dụ `/api/questions`), bắt lỗi `MUST_CHANGE_PASSWORD` và trả về HTTP 403 Forbidden.
  2. **Lockout bền vững qua PostgreSQL AuditLog**:
     Hàm `checkLoginRateLimit` được chuyển thành hàm bất đồng bộ (`async`), kết hợp kiểm tra bộ nhớ RAM và đếm số lượng bản ghi `user.login_failed` trong vòng 15 phút từ bảng `AuditLog` trong cơ sở dữ liệu. Đồng thời, ghi nhật ký thất bại ngay cả khi tài khoản email không tồn tại trên hệ thống.
  3. **Production Startup Guard**:
     Bổ sung đoạn mã kiểm tra biến `SESSION_SECRET` khi `process.env.NODE_ENV === 'production'` (ngoại trừ giai đoạn build tĩnh `phase-production-build`). Nếu phát hiện mang giá trị mặc định không an toàn, máy chủ sẽ lập tức từ chối vận hành kèm thông báo lỗi nghiêm ngặt.

---

### 3.3. Squad CORE & EXPORT: Đồ thị hàm số, Bảng biến thiên Word & Khử lộ đáp án đệ quy (`EXP-BUG-001`, `ROOM-BUG-001`)

* **Nguyên nhân gốc rễ**:
  - Khi xuất file Word `.docx`, hàm xuất bản chưa đọc mảng `figures` của câu hỏi nên bỏ sót toàn bộ đồ thị Canvas và Bảng biến thiên.
  - Hàm `sanitizeSnapshotForStudent` chỉ duyệt mảng `snapshot.questions` ở tầng ngoài cùng, nếu đề thi có cấu trúc lồng nhau trong `sections[].questions` thì đáp án và lời giải vẫn còn sót lại.
* **Biện pháp xử lý**:
  1. **Hỗ trợ hình ảnh & bảng biểu trong Word docx**:
     Tại [src/lib/docx-export.ts](file:///f:/Workspace/Zazz/ExamCraft/src/lib/docx-export.ts), bổ sung hàm `renderFiguresForDocx(figures?: Figure[])`:
     - Nếu câu hỏi có ảnh Canvas dạng `renderedBase64`: giải mã buffer và chèn đối tượng `ImageRun` chuẩn với kích thước căn giữa trang in kèm chú thích ảnh.
     - Nếu câu hỏi chứa Bảng biến thiên (`variation_table`): tự động dựng cấu trúc bảng Word (`Table`) gồm 3 hàng chuẩn mực ($x$, $y'$, $y$), thể hiện dấu đạo hàm và chiều biến thiên kèm mũi tên ($↗, ↘$) sắc nét.
     - Tích hợp gọi `renderFiguresForDocx` tự động trong cả 4 phần thi (Phần I, II, III, IV).
  2. **Khử lộ đáp án đệ quy**:
     Tại [src/app/api/public/assignments/[publicId]/route.ts](file:///f:/Workspace/Zazz/ExamCraft/src/app/api/public/assignments/[publicId]/route.ts), xây dựng hàm `sanitizeSingleQuestionForStudent` khử sạch triệt để `solution`, `correct_answer`, `explanation` và các cờ `isCorrect`, sau đó áp dụng đệ quy cho cả `snapshot.questions` lẫn `snapshot.sections[].questions`.

---

### 3.4. Squad REALTIME & FE: Tối ưu Giám sát & Hoàn thiện giao diện (`MON-BUG-001`, `FE-BUG-001`)

* **Nguyên nhân gốc rễ**: Cơ chế polling 4s tại trang giám sát phòng thi của giáo viên vẫn tiếp tục gửi yêu cầu mạng dồn dập ngay cả khi giáo viên đã chuyển sang tab khác làm việc.
* **Biện pháp xử lý**:
  - Tại [src/app/teacher/assignments/[id]/page.tsx](file:///f:/Workspace/Zazz/ExamCraft/src/app/teacher/assignments/[id]/page.tsx), thêm điều kiện kiểm tra `document.hidden` trước mỗi nhịp polling:
    ```typescript
    useEffect(() => {
      if (!autoRefresh) return;
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        fetchAssignmentData();
      }, 4000);
      return () => clearInterval(interval);
    }, [autoRefresh, fetchAssignmentData]);
    ```
  - Sửa lỗi cú pháp đóng thẻ `div` trong `StudentResultsModal.tsx` và căn chỉnh kiểu dữ liệu `(s.partScore ?? 0).toFixed(2)` giúp `next build` biên dịch thành công 100%.

---

### 3.5. Squad DEVOPS & DOCS: Tự động hóa CI & Chuẩn hóa cơ sở pháp lý (`OPS-BUG-001`, `OPS-BUG-002`, `REC-BUG-001`)

* **Biện pháp xử lý**:
  1. Cập nhật [package.json](file:///f:/Workspace/Zazz/ExamCraft/package.json):
     - `"test": "npx tsx tests/run_all_v3_tests.ts"` (Chạy toàn bộ 6 giai đoạn kiểm thử tự động).
     - `"test:unit": "npx tsx tests/unit_tests.mjs"` (Chạy 20 bài unit test độc lập).
     - `"lint": "next lint"` (Tuân thủ chuẩn kiểm tra của Next.js).
  2. Xây dựng đường ống CI tự động [.github/workflows/ci.yml](file:///f:/Workspace/Zazz/ExamCraft/.github/workflows/ci.yml):
     Khởi tạo dịch vụ PostgreSQL 16 container trên GitHub Actions, tự động chạy `prisma db push`, `prisma/seed.ts`, kiểm tra hồi quy `npm test` và kiểm thử bản build sản xuất `npm run build`.
  3. Cập nhật pháp lý: Thay thế toàn bộ trích dẫn nhầm lẫn Thông tư 17/2025 sang **Quyết định số 764/QĐ-BGDĐT** (ngày 08/03/2024 quy định cấu trúc định dạng đề thi Kỳ thi tốt nghiệp THPT từ năm 2025) tại `README.md`, `docs/BAO_CAO_TOAN_DIEN_V3.md`, `prisma/seed.ts`, `src/lib/auto-grader.ts` và `src/components/GenerateModal.tsx`.

---

## 4. KẾT QUẢ KIỂM ĐỊNH HỒI QUY (SQUAD REV VALIDATION)

Squad REV (Kiểm định độc lập) đã tiến hành chạy lại toàn bộ các bộ kịch bản kiểm thử tự động, kết quả ghi nhận như sau:

### 4.1. Bộ Kiểm thử Hồi quy Toàn diện (`npm test`)

```bash
> npx tsx tests/run_all_v3_tests.ts

===============================================================
       EXAMCRAFT v3.1 — KIỂM THỬ TỰ ĐỘNG TOÀN BỘ CÁC GIAI ĐOẠN
===============================================================

⏳ Đang chạy: Giai đoạn 1: Auth & Docker PostgreSQL...          ✅ ĐẠT (100%)
⏳ Đang chạy: Giai đoạn 2: CSDL Câu hỏi, Đề thi & 7 Gemini Keys... ✅ ĐẠT (100%)
⏳ Đang chạy: Giai đoạn 3: Giao bài & Phòng thi học sinh...     ✅ ĐẠT (100%)
⏳ Đang chạy: Giai đoạn 4: Giám sát bài thi & Bảng điểm...      ✅ ĐẠT (100%)
⏳ Đang chạy: Giai đoạn 5: Xuất file Word .docx & Định dạng A4... ✅ ĐẠT (100%)
⏳ Đang chạy: Giai đoạn 6: Bảo mật, Sao lưu & Kiểm chứng...     ✅ ĐẠT (100%)

===============================================================
🎉 TẤT CẢ 6/6 GIAI ĐOẠN ĐÃ VƯỢT QUA KIỂM THỬ XUẤT SẮC!
===============================================================
```

### 4.2. Bộ Kiểm thử Đơn vị Nghiệp vụ Sư phạm (`npm run test:unit`)

```bash
> npx tsx tests/unit_tests.mjs

[PASS] Scoring: Điểm mặc định chuẩn GDPT 2018 (0.25, 1.0, 0.5, 1.0)
[PASS] Scoring: Tính tổng điểm đề thi 12 MC + 4 TF + 6 SA = 10.0đ
[PASS] CleanLatex: Không bị lỗi cắn xé token ngắn (infty, int, left, leq, neq)
[PASS] OMML Export: renderLatexRunsForWord phân tích chính xác TextRun và Math OMML
[PASS] Shuffler: PRNG Mulberry32 sinh số tái lập 100% với cùng 1 Seed
[PASS] Shuffler: Bảo vệ phương án phụ thuộc ("Cả A và B") không bị xáo trộn
[PASS] Matrix Generator: Tính toán ma trận 2D chuẩn theo CV 7991
[PASS] KHTN: CleanLatex hỗ trợ công thức hóa học mhchem và ký hiệu vật lí
...
========================================================
KẾT QUẢ: ĐÃ VƯỢT QUA 20/20 BÀI KIỂM THỬ (100% PASS)
========================================================
```

### 4.3. Kiểm thử Tải Mạng Thực nghiệm (`tests_e2e/test_vong2_http_audit.ts`)

- **R5 (Khử lộ đáp án)**: Quét 100% byte HTML SSR & JSON API $\rightarrow$ **PASS (Tuyệt đối không rò rỉ)**.
- **R8 (Cô lập học sinh & Leaderboard)**: Top & Me hiển thị chuẩn xác $\rightarrow$ **PASS**.
- **R11 (Chống Race Condition)**: Bắn đồng thời 5 request Start/Submit $\rightarrow$ Không nhân bản, DB toàn vẹn $\rightarrow$ **PASS**.
- **R17 (Production Guard)**: Từ chối khởi động khi mang secret mặc định $\rightarrow$ **PASS**.
- **R28 (Phân quyền & Chặn bypass)**: Chặn tài khoản bị khóa (401), chặn gọi API trực tiếp khi chưa đổi mật khẩu (403) $\rightarrow$ **PASS**.
- **Tải 100 Học sinh Ảo qua giao thức HTTP**:
  - Số lượng yêu cầu: 100 luồng (Start $\rightarrow$ Draft $\rightarrow$ Submit đồng thời).
  - Tỷ lệ thành công: **100/100 (100% PASS, 0 lỗi)**.
  - Tổng thời gian hoàn tất: **5257 ms** (p50: 4488 ms, Min: 3610 ms, Max: 5241 ms).
  - Số lượng kết nối PostgreSQL: 14 connections (nằm trong ngưỡng an toàn mặc định 100).

### 4.4. Kiểm thử Đóng gói Sản xuất (`npm run build`)

- Trình biên dịch: **Next.js 16.4.2 (Turbopack Engine)**.
- Kiểm tra kiểu dữ liệu TypeScript: **0 lỗi** (Finished TypeScript in 8.2s).
- Tạo trang tĩnh & động (SSG / SSR / Dynamic): **33/33 route thành công**.
- Exit code: **0 (Thành công tuyệt đối)**.

---

## 5. KẾT LUẬN & TUYÊN BỐ TRẠNG THÁI DỰ ÁN

Toàn bộ **11/11 lỗi kỹ thuật và khuyến nghị** (từ P0 Critical đến P3 Low) được phát hiện trong đợt kiểm toán Vòng 2 đã được các Squad xử lý triệt để, có kiểm chứng thực nghiệm bằng diff mã nguồn và vượt qua 100% các bài kiểm thử hồi quy.

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   QUYẾT NGHỊ CHÍNH THỨC CỦA HỘI ĐỒNG KIỂM ĐỊNH EXAMCRAFT:             │
│                                                                        │
│   NÂNG HẠNG DỰ ÁN TỪ [CONDITIONAL-GO] LÊN CHÍNH THỨC [FULL-GO]         │
│                                                                        │
│   Hệ thống đạt 100% độ sẵn sàng triển khai sản xuất lên nền tảng      │
│   Vercel hoặc hạ tầng máy chủ VPS Docker của các trường học.           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

*Báo cáo được phê chuẩn bởi: **Test Director & Hội đồng Kỹ thuật ExamCraft v3.1**.*
