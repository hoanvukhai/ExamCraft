# BÁO CÁO TOÀN DIỆN DỰ ÁN EXAMCRAFT (PHIÊN BẢN v3.1)

> **Tài liệu lịch sử/đầu vào phân tích:** từ 21/10/2026, dùng [bộ tổng kết và kế hoạch hiện hành](ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md). Nội dung và dấu hoàn thành dưới đây không tự đại diện cho yêu cầu hoặc tiến độ mới; giữ để đối chiếu nguồn gốc.
**Nền Tảng Trợ Lý Soạn Đề AI & Tổ Chức Thi Trực Tuyến Chuẩn GDPT 2018 — 2025**

---

## 📑 MỤC LỤC
1. [Giới Thiệu Tổng Quan & Mục Tiêu Dự Án](#1-giới-thiệu-tổng-quan--mục-tiêu-dự-án)
2. [Cơ Sở Pháp Lý & Tiêu Chuẩn Sư Phạm (GDPT 2018 / Quyết Định 764/QĐ-BGDĐT)](#2-cơ-sở-pháp-lý--tiêu-chuẩn-sư-phạm)
3. [Ngăn Xếp Công Nghệ (Technology Stack)](#3-ngăn-xếp-công-nghệ-technology-stack)
4. [Kiến Trúc Hệ Thống & Cấu Trúc Thư Mục](#4-kiến-trúc-hệ-thống--cấu-trúc-thư-mục)
5. [Cơ Sở Dữ Liệu Quan Hệ & Prisma Schema (14 Enums, 17 Models)](#5-cơ-sở-dữ-liệu-quan-hệ--prisma-schema)
6. [Chi Tiết Toàn Bộ Tính Năng Của Hệ Thống](#6-chi-tiết-toàn-bộ-tính-năng-của-hệ-thống)
   - 6.1. Trợ Lý Soạn Đề AI Copilot & Điều Phối 7 Gemini API Keys
   - 6.2. Đồ Thị Hàm Số Động HTML5 Canvas & Bảng Biến Thiên 3 Dòng
   - 6.3. Quản Lý Ngân Hàng Câu Hỏi, Lịch Sử Sửa Đổi (Revisions) & Fork Dùng Chung
   - 6.4. Trộn Đề & Hoán Vị Mã Đề Khoa Học
   - 6.5. Quản Lý Lớp Học & Học Sinh (Zero-Account Student Model)
   - 6.6. Giao Bài & Bản Chụp Bất Biến (Assignment Snapshot)
   - 6.7. Phòng Thi Trực Tuyến Học Sinh (`/a/[publicId]` & `/c/[groupCode]`)
   - 6.8. Hệ Thống Chấm Điểm Server-Authoritative & Barem Điểm Lũy Tiến
   - 6.9. Màn Hình Giám Sát Thời Gian Thực & Thống Kê Sư Phạm (Item Analysis)
   - 6.10. Xuất Bảng Điểm CSV An Toàn Chống Formula Injection
   - 6.11. Xuất Bản Đề Thi Ra File Word (.docx) & Tối Ưu In Ấn A4
   - 6.12. An Ninh Bảo Mật, Kiểm Soát Quyền & Chống Gian Lận
   - 6.13. Hệ Thống Sao Lưu (Backup) & Khôi Phục (Restore) Tự Động
7. [Kết Quả Kiểm Thử Toàn Diện (6/6 Test Suites Passing 100%)](#7-kết-quả-kiểm-thử-toàn-diện)
8. [Hướng Dẫn Cài Đặt & Triển Khai (Local Docker vs Cloud Vercel/Neon)](#8-hướng-dẫn-cài-đặt--triển-khai)
9. [Đánh Giá & Hướng Phát Triển Tiếp Theo](#9-đánh-giá--hướng-phát-triển-tiếp-theo)

---

## 1. GIỚI THIỆU TỔNG QUAN & MỤC TIÊU DỰ ÁN

**ExamCraft** là một giải pháp EdTech toàn diện, mã nguồn mở, được xây dựng chuyên sâu nhằm số hóa quy trình khảo thí và kiểm tra đánh giá của giáo viên Việt Nam. Hệ thống bao quát toàn bộ vòng đời của một kỳ thi:
- **Trước kỳ thi**: Soạn thảo câu hỏi, xây dựng cấu trúc đề thi, nhờ AI hỗ trợ tinh chỉnh câu hỏi, vẽ đồ thị/bảng biến thiên, trộn đề hoán vị thành nhiều mã đề, xuất bản ra file Word in ấn đạt chuẩn Bộ GD&ĐT.
- **Trong kỳ thi**: Tổ chức phòng thi trực tuyến cho học sinh làm bài trên điện thoại hoặc máy tính mà **không bắt buộc học sinh phải tạo tài khoản rườm rà** (Zero-account model). Đồng hồ đếm ngược server-authoritative, tự động lưu nháp định kỳ.
- **Sau kỳ thi**: Server tự động chấm điểm chính xác theo barem chuẩn GDPT, bảng xếp hạng an toàn bảo mật, giáo viên giám sát tiến độ theo thời gian thực, chấm bù tự luận và xuất bảng điểm Excel chuẩn tiếng Việt.

---

## 2. CƠ SỞ PHÁP LÝ & TIÊU CHUẨN SƯ PHẠM

ExamCraft được thiết kế bám sát các văn bản quy phạm pháp luật và khảo thí mới nhất của Bộ Giáo dục và Đào tạo:
1. **Quyết định số 764/QĐ-BGDĐT** (ngày 08/03/2024 quy định cấu trúc định dạng đề thi Kỳ thi tốt nghiệp THPT từ năm 2025):
   - **Phần I — Trắc nghiệm nhiều lựa chọn**: Mỗi câu gồm 4 phương án $A, B, C, D$, chỉ có 1 phương án đúng duy nhất. Điểm mặc định 0,25 điểm/câu.
   - **Phần II — Trắc nghiệm Đúng/Sai**: Mỗi câu gồm 4 lệnh hỏi độc lập $a), b), c), d)$. Thí sinh chọn Đúng hoặc Sai cho từng ý. **Barem chấm điểm lũy tiến bắt buộc theo Quyết định 764**:
     - Đúng 1 ý: đạt **0,10 điểm**
     - Đúng 2 ý: đạt **0,25 điểm**
     - Đúng 3 ý: đạt **0,50 điểm**
     - Đúng cả 4 ý: đạt **1,00 điểm**
   - **Phần III — Trắc nghiệm trả lời ngắn**: Thí sinh tự tính toán và điền đáp số vào ô trống (số nguyên, số thập phân hoặc phân số tối giản). Điểm mặc định 0,50 điểm/câu.
   - **Phần IV — Tự luận / Ngoại ngữ / Mở rộng (Phân hệ mở rộng của ExamCraft)**: Phục vụ kiểm tra định kỳ (giữa kỳ, cuối kỳ) theo chương trình GDPT 2018 và Thông tư 22/2021/TT-BGDĐT, hỗ trợ giáo viên chấm tay và ghi nhận xét.
2. **Nghị định 13/2023/NĐ-CP** về bảo vệ dữ liệu cá nhân:
   - Hệ thống **tuyệt đối không thu thập dữ liệu nhạy cảm** của học sinh (không lưu số điện thoại, CMND/CCCD, email, địa chỉ nhà).
   - Chỉ lưu tên hiển thị và kết quả làm bài của học sinh trong phạm vi lớp học.
   - Dữ liệu học sinh không bao giờ bị gửi tới các dịch vụ AI bên ngoài.

---

## 3. NGĂN XẾP CÔNG NGHỆ (TECHNOLOGY STACK)

| Tầng Hệ Thống | Công Nghệ Lựa Chọn | Phiên Bản | Vai Trò & Lý Do Kỹ Thuật |
|---|---|---|---|
| **Core Framework** | **Next.js (App Router)** | `16.4.2` | Tối ưu hóa SEO, SSR, Dynamic Routing, Partial Prerender, Server Actions & Route Handlers. |
| **Giao Diện** | **React** | `19.3.0` | Kiến trúc Component phân tán, `use(params)` an toàn qua Suspense boundaries. |
| **Ngôn Ngữ** | **TypeScript** | `^5.0` | Đảm bảo tính nhất quán kiểu dữ liệu 100%, ngăn ngừa lỗi runtime ở cả client và server. |
| **Định Kiểu & CSS** | **Tailwind CSS** | `^4.0` | Tiện ích CSS hiện đại, thiết kế Responsive thích ứng mọi kích cỡ màn hình (Mobile first). |
| **Biểu Tượng** | **Lucide React** | `^1.58.0` | Bộ icon SVG nhẹ, sắc nét, đồng bộ phong cách thiết kế hiện đại. |
| **Hệ Quản Trị CSDL** | **PostgreSQL** | `16-alpine` | CSDL quan hệ chuẩn ACID, lưu trữ JSONB linh hoạt, toàn vẹn dữ liệu khảo thí. |
| **ORM & Migration** | **Prisma** | `6.19.3` | Quản lý schema, sinh migration tự động, truy vấn Type-safe tuyệt đối với DB. |
| **Container Hóa** | **Docker & Docker Compose** | Latest | Đóng gói môi trường PostgreSQL độc lập cổng `5436`, sẵn sàng triển khai VPS hoặc Local. |
| **Công Thức Toán** | **KaTeX** | `^0.19.0` | Render biểu thức toán học LaTeX siêu tốc, kích hoạt `trust: false` chống XSS. |
| **Trí Tuệ Nhân Tạo** | **Google Gemini AI** | `@google/genai` | Gọi mô hình Gemini Flash/Pro với cơ chế xoay tua 7 API Keys không gián đoạn. |
| **Sinh File Văn Bản** | **docx** | `^9.11.0` | Xuất file Microsoft Word `.docx` tương thích Office Math OMML và ngắt trang A4 chống vỡ dòng. |
| **Kiểm Thực Dữ Liệu** | **Zod** | `^4.6.7` | Validate dữ liệu đầu vào cho 100% API endpoints và sanitize JSON payloads. |
| **Bảo Mật Mật Khẩu** | **bcryptjs** | `^3.0.3` | Băm mật khẩu quản trị và giáo viên với salt rounds an toàn. |

---

## 4. KIẾN TRÚC HỆ THỐNG & CẤU TRÚC THƯ MỤC

Hệ thống được tổ chức theo kiến trúc phân lớp chuẩn mực của Next.js App Router:

```
f:\Workspace\Zazz\ExamCraft\
├── .github/                      # Cấu hình GitHub Actions (CI/CD)
├── backups/                      # Thư mục chứa các bản sao lưu cơ sở dữ liệu (.sql)
├── data/                         # Dữ liệu hạt giống và cấu hình mẫu
├── docs/                         # Tài liệu kiến trúc và hướng dẫn
│   ├── archive/                  # Lưu trữ các bản kế hoạch cũ
│   ├── BAO_CAO_TOAN_DIEN_V3.md   # BẢN BÁO CÁO TOÀN DIỆN HIỆN TẠI
│   ├── CHECKLIST_TIEN_DO.md      # Bảng tiến độ theo dõi 6 giai đoạn
│   └── EXAMCRAFT_THIET_KE_V3.md  # Bản đặc tả kỹ thuật kiến trúc v3.1
├── prisma/                       # Cấu hình ORM Prisma
│   ├── migrations/               # Lịch sử các bước di chuyển CSDL
│   ├── schema.prisma             # Định nghĩa 14 Enums và 17 Models quan hệ
│   └── seed.ts                   # Kịch bản khởi tạo Admin, 7 Keys & Mẫu GDPT
├── public/                       # Tài nguyên tĩnh (ảnh, favicon, logo)
├── scripts/                      # Kịch bản tự động hóa vận hành
│   ├── backup.ps1                # Sao lưu DB PostgreSQL tự động trên Windows
│   ├── backup.sh                 # Sao lưu DB PostgreSQL tự động trên Linux/Docker
│   └── restore.ps1               # Khôi phục CSDL từ bản sao lưu an toàn
├── src/                          # Mã nguồn chính của ứng dụng
│   ├── app/                      # Next.js App Router (Giao diện & API Routes)
│   │   ├── a/[publicId]/         # Phòng thi trực tuyến học sinh (Dynamic Public Route)
│   │   ├── admin/                # Phân hệ quản trị (Users, AI Dashboard)
│   │   ├── api/                  # 34 API Endpoints (Auth, AI, Exam, Question, Monitor)
│   │   ├── c/[groupCode]/        # Cổng thông tin lớp học dành cho học sinh
│   │   ├── login/                # Trang đăng nhập dành cho Giáo viên & Admin
│   │   ├── share/[id]/           # Trang xem và tải đề thi công khai (Read-only)
│   │   ├── teacher/              # Phân hệ giáo viên (Quản lý lớp, Giám sát bài thi)
│   │   ├── test/[id]/            # Phòng làm bài kiểm tra nhanh
│   │   ├── globals.css           # Cấu hình giao diện Tailwind CSS v4 & theme
│   │   ├── layout.tsx            # Root Layout bao bọc toàn ứng dụng
│   │   └── page.tsx              # Trang chủ ứng dụng biên tập đề thi chính
│   ├── components/               # Các khối giao diện tái sử dụng
│   │   ├── AdminModal.tsx        # Cửa sổ quản trị hệ thống
│   │   ├── ExamEditor.tsx        # Khối biên tập câu hỏi, thẻ bài thi
│   │   ├── FunctionPlotter.tsx   # Khối vẽ đồ thị hàm số Canvas động
│   │   ├── MathRenderer.tsx      # Bộ hiển thị công thức LaTeX an toàn với KaTeX
│   │   ├── QuestionBankModal.tsx # Ngân hàng câu hỏi cá nhân và dùng chung
│   │   ├── ShareModal.tsx        # Hộp thoại tạo bài giao và sinh link phòng thi
│   │   ├── StudentExamRoom.tsx   # Giao diện làm bài thi trực tuyến cho học sinh
│   │   └── VariationTable.tsx    # Khối vẽ bảng biến thiên 3 dòng chuẩn Bộ GD&ĐT
│   ├── lib/                      # Các thư viện & dịch vụ lõi (Services)
│   │   ├── auth.ts               # Xử lý xác thực session, cookies & bcryptjs
│   │   ├── docx-export.ts        # Bộ chuyển đổi đề thi sang Microsoft Word chuẩn A4
│   │   ├── gemini-keys.ts        # Bộ điều phối 7 Google Gemini API Keys thông minh
│   │   └── prisma.ts             # Prisma Client Singleton an toàn kết nối
│   └── types/                    # Các khai báo kiểu TypeScript chuẩn
│       └── exam.ts               # Kiểu dữ liệu Question, Exam, Attempt, Snapshot
├── tests/                        # Toàn bộ test suites kiểm thử tự động
│   ├── run_all_v3_tests.ts       # Master Runner chạy toàn bộ 6 giai đoạn
│   ├── test_phase1_auth.ts       # Test Suite Giai đoạn 1: Auth & Docker DB
│   ├── test_phase2_db_ai.ts      # Test Suite Giai đoạn 2: CSDL & 7 AI Keys
│   ├── test_phase3_student_flow.ts # Test Suite Giai đoạn 3: Học sinh làm bài
│   ├── test_phase4_monitoring.ts # Test Suite Giai đoạn 4: Giám sát & Bảng điểm
│   ├── test_phase5_word_quality.ts # Test Suite Giai đoạn 5: Xuất file Word A4
│   └── test_phase6_security_audit.ts # Test Suite Giai đoạn 6: Bảo mật & Sao lưu
├── docker-compose.yml            # Khởi tạo dịch vụ PostgreSQL 16
├── package.json                  # Cấu hình dependencies, build & postinstall
└── tsconfig.json                 # Cấu hình biên dịch TypeScript
```

---

## 5. CƠ SỞ DỮ LIỆU QUAN HỆ & PRISMA SCHEMA

Cơ sở dữ liệu được thiết kế theo chuẩn quan hệ nghiêm ngặt với **14 Enums** và **17 Models** đáp ứng đầy đủ yêu cầu nghiệp vụ giáo dục:

```mermaid
erDiagram
    User ||--o{ Question : "sở hữu"
    User ||--o{ Exam : "tạo đề"
    User ||--o{ Group : "quản lý lớp"
    User ||--o{ Assignment : "giao bài"
    User ||--o{ AiUsageLog : "nhật ký AI"
    User ||--o{ AuditLog : "thao tác quản trị"
    Question ||--o{ QuestionRevision : "lịch sử sửa"
    Question ||--o{ ExamQuestion : "thuộc về"
    Exam ||--o{ ExamQuestion : "chứa"
    Exam ||--o{ ShareLink : "chia sẻ"
    Group ||--o{ Student : "chứa học sinh"
    Group ||--o{ Assignment : "nhận bài tập"
    Assignment ||--o{ Attempt : "các lượt nộp"
    Student ||--o{ Attempt : "thực hiện"
    Attempt ||--o{ AttemptAnswer : "chi tiết câu trả lời"
```

### Danh Sách 17 Thực Thể Chính (Models):
1. **`User`**: Lưu tài khoản Giáo viên và Quản trị viên (`SUPER_ADMIN`, `TEACHER`), mật khẩu băm, cờ bắt buộc đổi mật khẩu (`mustChangePassword`), hạn mức AI mỗi ngày (`aiDailyLimit`).
2. **`Session`**: Phiên làm việc xác thực lưu server-side, thời hạn hết hạn, liên kết với cookie an toàn.
3. **`Passage`**: Đoạn văn bản ngữ liệu đọc hiểu dùng chung cho nhóm câu hỏi (áp dụng cho môn Văn, Tiếng Anh, Sử, Địa).
4. **`Question`**: Kho lưu trữ câu hỏi trắc nghiệm/tự luận, nội dung LaTeX, cấu trúc JSON `payload`, phân loại môn học, khối lớp, nguồn gốc (`sourceKind`), trạng thái kiểm duyệt (`status`) và phạm vi (`visibility`).
5. **`QuestionRevision`**: Lịch sử chi tiết từng lần chỉnh sửa của câu hỏi, hỗ trợ so sánh khác biệt (diff) và khôi phục về phiên bản bất kỳ.
6. **`ExamTemplate`**: Mẫu cấu trúc đề thi chuẩn (ví dụ Đề 50 phút GDPT 2025, Đề trắc nghiệm 12, Đề kiểm tra định kỳ).
7. **`Exam`**: Đề thi của giáo viên, lưu tiêu đề, thời lượng, các phần thi (`sections`), ma trận đặc tả và danh sách câu hỏi.
8. **`ExamQuestion`**: Bảng trung gian liên kết câu hỏi vào đề thi kèm số thứ tự hiển thị và điểm số riêng cho từng câu.
9. **`ShareLink`**: Link chia sẻ đề thi công khai với chế độ chỉ đọc hoặc cho phép tải file Word `.docx`.
10. **`Group`**: Lớp học hoặc nhóm học thêm của giáo viên, sinh mã `groupCode` để học sinh truy cập vào danh sách bài tập.
11. **`Student`**: Danh sách học sinh trong lớp (chỉ lưu tên hiển thị `name`, không lưu thông tin cá nhân nhạy cảm).
12. **`Assignment`**: Phiên giao bài của giáo viên tới lớp học. **Đặc biệt sở hữu `snapshot` (Bản chụp bất biến lưu trọn vẹn toàn bộ đề thi và đáp án tại thời điểm giao)**.
13. **`Attempt`**: Mỗi lượt làm bài của học sinh, ghi nhận thời gian bắt đầu (`startedAt`), thời hạn chót trên server (`deadlineAt`), thời gian nộp bài (`submittedAt`), tổng điểm (`score`), trạng thái (`IN_PROGRESS`, `SUBMITTED`, `EXPIRED`, `GRADED`).
14. **`AttemptAnswer`**: Chi tiết câu trả lời của từng học sinh đối với từng câu hỏi trong đề, điểm số tự động tính toán (`earned`), điểm chấm tay tự luận của giáo viên (`manualScore`), và lời nhận xét (`comment`).
15. **`AiKeyState`**: Trạng thái của 7 Google Gemini API Keys (`ACTIVE`, `COOLDOWN`, `DEAD`), số lượt gọi trong ngày, thời điểm lỗi gần nhất.
16. **`AiUsageLog`**: Nhật ký chi tiết mỗi lượt gọi AI: đo độ trễ (latency ms), HTTP status, endpoint, model sử dụng, token tiêu thụ.
17. **`AuditLog`**: Nhật ký kiểm toán toàn bộ hoạt động quan trọng của hệ thống (tạo/khóa giáo viên, xóa lượt làm, can thiệp kết quả).

---

## 6. CHI TIẾT TOÀN BỘ TÍNH NĂNG CỦA HỆ THỐNG

### 6.1. Trợ Lý Soạn Đề AI Copilot & Điều Phối 7 Gemini API Keys
- **Hội thoại thông minh (AI Copilot 2.0)**: Giáo viên ra lệnh bằng tiếng Việt tự nhiên (*"Đổi số liệu câu này nhưng giữ nguyên nghiệm nguyên"*, *"Tăng độ khó sang mức vận dụng cao"*, *"Tạo 1 câu tương tự về ứng dụng thực tế"*).
- **Hộp thoại tương tác hai chiều**: Nếu yêu cầu chưa rõ, AI sẽ chủ động hỏi lại giáo viên kèm các gợi ý chọn nhanh hoặc cho phép giáo viên tự gõ phương án riêng.
- **Bảo toàn hình vẽ & đồ thị**: Khi AI sửa nội dung toán học, cấu trúc đồ thị hàm số và bảng biến thiên đi kèm luôn được bảo toàn tuyệt đối, không bao giờ bị mất dữ liệu.
- **Bộ điều phối 7 Google Gemini API Keys (`src/lib/gemini-keys.ts`)**:
  - Không lưu key thô vào CSDL; chỉ lưu alias (`key1`..`key7`) và trạng thái vào bảng `AiKeyState`.
  - Cơ chế chọn key **"Least Used & Healthy"**: Tự động ưu tiên key ít sử dụng nhất trong ngày và không bị cooldown.
  - Khi gặp mã lỗi `429` (Rate limit) hoặc `503` (Server busy): Tự động đưa key vào trạng thái `COOLDOWN` tạm thời và chuyển sang key kế tiếp ngay lập tức mà không làm gián đoạn giáo viên.
  - Hạn mức sử dụng theo giáo viên (`aiDailyLimit`): Bảo vệ hệ thống khỏi việc một giáo viên dùng cạn kiệt tài nguyên của cả trường.
  - Trang quản trị `/admin/ai`: Hiển thị dashboard trạng thái trực quan của 7 keys, xem 30 log gọi gần nhất và có nút mở khóa lại key khi cần.

### 6.2. Đồ Thị Hàm Số Động HTML5 Canvas & Bảng Biến Thiên 3 Dòng
- **Bộ vẽ đồ thị toán học 2D Engine (`FunctionPlotter.tsx`)**:
  - Vẽ trực tiếp trên Canvas với tỷ lệ sắc nét cao, hỗ trợ hàm bậc nhất ($y = ax+b$), hàm bậc hai ($y = ax^2+bx+c$), hàm bậc ba, hàm phân thức hữu tỉ bậc nhất trên bậc nhất ($y = \frac{ax+b}{cx+d}$).
  - **Tự động tính toán tiệm cận**: Tự động vẽ tiệm cận đứng ($x = x_0$) và tiệm cận ngang ($y = y_0$) nét đứt màu đỏ đúng quy chuẩn sách giáo khoa.
  - **Hệ trục tọa độ $Oxy$ chuyên nghiệp**: Đánh dấu đầy đủ các vạch chia số nguyên, mũi tên hướng trục và gốc tọa độ $O$.
- **Bảng biến thiên 3 dòng (`VariationTable.tsx`)**:
  - Thể hiện chuẩn mực 3 hàng: hàng giá trị của $x$, hàng dấu của đạo hàm $y'$, và hàng chiều biến thiên của hàm số $y$ với các mũi tên đi lên/đi xuống rõ ràng.

### 6.3. Quản Lý Ngân Hàng Câu Hỏi, Lịch Sử Sửa Đổi & Fork Dùng Chung
- **Lịch sử sửa đổi (`QuestionRevision`)**: Mỗi lần giáo viên lưu thay đổi câu hỏi, hệ thống tự động ghi lại một phiên bản cũ. Giao diện hỗ trợ so sánh khác biệt (Visual Diff) giữa bản cũ và bản mới, cho phép hoàn tác (Rollback) chỉ bằng 1 cú nhấp chuột.
- **Ngân hàng câu hỏi dùng chung nội bộ (`/api/questions/shared`)**:
  - Giáo viên có thể chia sẻ câu hỏi hay vào ngân hàng chung (`visibility = SHARED`).
  - Giáo viên khác có thể duyệt, xem trước và bấm **"Nhân bản vào đề của tôi" (Fork)**. Khi fork, hệ thống tạo một bản sao độc lập (`sourceKind = FORKED`), bảo toàn thông tin tác giả gốc (`authorId`), giúp giáo viên tùy ý chỉnh sửa mà không ảnh hưởng tới câu hỏi gốc.
  - **Cơ chế chặn chia sẻ câu hỏi nhạy cảm**: Những câu hỏi được cào từ web ngoài (`sourceKind = IMPORTED_WEB`) bị khóa cứng `shareable = false`, ngăn chặn việc chia sẻ ra ngoài nhằm đảm bảo an toàn bản quyền.

### 6.4. Trộn Đề & Hoán Vị Mã Đề Khoa Học
- Hỗ trợ trộn một đề gốc thành **4 mã đề khác nhau** (ví dụ 101, 102, 103, 104).
- Áp dụng thuật toán xáo trộn Fisher–Yates với seed ngẫu nhiên nhằm đảm bảo tính công bằng và có thể tái lập.
- Tự động hoán vị thứ tự các phương án $A, B, C, D$ và tự động cập nhật lại chữ cái đáp án trong phần Lời giải chi tiết tương ứng.
- Xuất kèm bảng **Ma trận đáp án đối soát** dạng bảng lưới, giúp giáo viên chấm bài thi trên giấy thủ công nhanh chóng.

### 6.5. Quản Lý Lớp Học & Học Sinh (Zero-Account Student Model)
- **Quản lý nhóm/lớp tại `/teacher/groups`**: Giáo viên tạo danh sách lớp (ví dụ *12A1*, *Luyện thi Toán Thầy Nam*).
- **Nhập danh sách học sinh siêu tốc**: Hỗ trợ dán trực tiếp nhiều dòng từ danh sách Excel hoặc Word. Hệ thống tự động phân tách và làm sạch tên học sinh.
- **Mô hình không cần tạo tài khoản (Zero-Account Model)**: Học sinh không cần đăng ký tài khoản hay nhớ mật khẩu. Học sinh chỉ cần mở link lớp `/c/[groupCode]` hoặc link bài thi `/a/[publicId]`, chọn đúng tên mình trong danh sách lớp hoặc tự gõ tên để vào làm bài.

### 6.6. Giao Bài & Bản Chụp Bất Biến (Assignment Snapshot)
- Giáo viên cấu hình bài giao với 3 bộ thiết lập mặc định (Presets):
  1. **Bài tập về nhà**: Cho phép làm nhiều lần, không giới hạn thời gian chặt, hiển thị điểm và lời giải ngay sau khi nộp.
  2. **Kiểm tra trên lớp**: Giới hạn thời gian (ví dụ 45 phút), làm 1 lần, mở bảng xếp hạng Top & Me.
  3. **Phòng thi chính thức**: Giới hạn thời gian gắt gao, chỉ nộp 1 lần, ẩn điểm và ẩn đáp án cho đến khi đóng kỳ thi.
- **Bản chụp bất biến (`Assignment.snapshot`)**: Tại thời điểm bấm "Giao bài", hệ thống đóng gói toàn bộ nội dung đề thi, các phần thi và đáp án chuẩn vào một trường JSON bất biến. Mọi hoạt động làm bài và chấm điểm sau này của học sinh chỉ đối chiếu với `snapshot` này. Nếu giáo viên có vô tình sửa đổi hoặc xóa câu hỏi trong ngân hàng thì bài thi đã giao **hoàn toàn không bị ảnh hưởng hay sai lệch điểm số**.

### 6.7. Phòng Thi Trực Tuyến Học Sinh (`/a/[publicId]` & `/c/[groupCode]`)
- **Giao diện hiện đại, tối ưu cho điện thoại**: Giao diện học sinh được thiết kế theo tiêu chí Mobile-first, font chữ to rõ, công thức toán hiển thị sắc nét bằng KaTeX.
- **Server Timer tuyệt đối**: Bộ đếm thời gian được tính toán dựa trên `deadlineAt = startedAt + duration` lưu trên máy chủ. Học sinh cố tình chỉnh giờ máy tính hay tải lại trang đều không thể kéo dài thời gian làm bài.
- **Tự động lưu nháp (Auto-save draft)**: Định kỳ mỗi 15 giây hoặc khi học sinh chọn câu trả lời, câu trả lời được âm thầm gửi lên server (`/api/public/attempts/[id]/draft`). Nếu mất mạng hoặc hết pin điện thoại, học sinh mở lại link vẫn giữ nguyên bài đang làm.
- **Nộp bài Idempotent**: Cơ chế chống bấm đúp và chống nộp trùng lặp hai lần.
- **Bảo mật đề thi tuyệt đối (`sanitizeSnapshotForStudent`)**: Khi học sinh tải đề thi, API bắt buộc bóc tách và loại bỏ 100% đáp án đúng và lời giải chi tiết. Học sinh dù có mở DevTools mạng cũng không thể xem trước đáp án.

### 6.8. Hệ Thống Chấm Điểm Server-Authoritative & Barem Lũy Tiến
Khi học sinh bấm nộp bài, máy chủ tự động thực hiện chấm điểm:
- **Phần I (Trắc nghiệm đơn)**: So khớp phương án học sinh chọn với đáp án chuẩn. Đúng được trọn điểm câu đó.
- **Phần II (Đúng/Sai theo nhóm 4 ý)**: Đếm số ý trả lời đúng trên tổng số 4 ý $a, b, c, d$ và tính điểm theo barem lũy tiến của Bộ GD&ĐT:
  $$\text{Đúng 1 ý} \rightarrow 0,1\text{đ} \quad|\quad \text{Đúng 2 ý} \rightarrow 0,25\text{đ} \quad|\quad \text{Đúng 3 ý} \rightarrow 0,5\text{đ} \quad|\quad \text{Đúng 4 ý} \rightarrow 1,0\text{đ}$$
- **Phần III (Trả lời ngắn)**: Hệ thống áp dụng thuật toán chuẩn hóa chuỗi ký tự toán học (loại bỏ khoảng trắng, chuyển dấu phẩy `,` sang dấu chấm `.`, chuẩn hóa phân số tối giản ví dụ `3/4` tương đương `0.75`).
- **Phần IV (Tự luận)**: Ghi nhận bài nộp và chuyển sang trạng thái chờ giáo viên chấm bù tại màn hình quản trị.

### 6.9. Màn Hình Giám Sát Thời Gian Thực & Thống Kê Sư Phạm
- **Giám sát trực tiếp `/teacher/assignments/[id]`**: Tự động cập nhật mỗi 4 giây (Realtime Polling), giáo viên thấy rõ bao nhiêu học sinh đang làm bài, bao nhiêu em đã nộp bài.
- **Biểu đồ phổ điểm trực quan**: Phân loại theo 4 mức điểm: Dưới 5, Từ 5 đến dưới 6.5, Từ 6.5 đến dưới 8, và Từ 8 đến 10 điểm.
- **Thống kê chuyên sâu từng câu hỏi (Item Analysis)**: Hệ thống tính toán tỷ lệ làm đúng của từng câu hỏi trong đề. **Cảnh báo sư phạm màu vàng/đỏ đối với các câu có tỷ lệ làm đúng dưới 50%**, giúp giáo viên biết chính xác học sinh đang hổng kiến thức ở đâu để tập trung chữa bài.
- **Chấm điểm tự luận & Nhận xét**: Giáo viên bấm vào từng học sinh để xem chi tiết bài làm, chấm điểm các câu tự luận và ghi lời nhận xét cá nhân. Điểm tổng của học sinh sẽ tự động được cập nhật lại ngay tức thì.
- **Can thiệp quản trị**: Giáo viên có thể bấm khóa bài thi sớm, gia hạn thêm thời gian làm bài, hoặc xóa lượt làm bị lỗi mạng để học sinh làm lại.

### 6.10. Xuất Bảng Điểm CSV An Toàn Chống Formula Injection
- Cho phép xuất toàn bộ kết quả thi của lớp ra file `.csv` chỉ với 1 cú nhấp chuột (`/api/teacher/assignments/[id]/export-csv`).
- **Chèn UTF-8 BOM (`\uFEFF`)**: Đảm bảo mở file trên mọi phiên bản Microsoft Excel trên Windows đều hiển thị chuẩn tiếng Việt 100%, không bao giờ bị lỗi font chữ.
- **Bảo mật chống CSV Formula Injection**: Tự động kiểm tra và chèn tiền tố dấu nháy đơn `'` cho bất kỳ ô dữ liệu nào bắt đầu bằng các ký tự nguy hiểm (`=`, `+`, `-`, `@`, `\t`, `\r`) để ngăn chặn việc hacker chèn mã độc thực thi trong Excel của giáo viên.

### 6.11. Xuất Bản Đề Thi Ra File Word (.docx) & Tối Ưu In Ấn A4
- **Thư viện chuyển đổi chuyên sâu (`src/lib/docx-export.ts`)**:
  - Hỗ trợ đầy đủ tiêu đề Sở GD&ĐT / Trường học, khung thông tin thí sinh, phân chia các phần thi rõ ràng.
  - Tích hợp công thức toán học OpenXML native (`MathRun`, `MathFraction`, `MathRadical`) giúp các công thức toán học hiển thị đẹp mắt và **có thể bấm vào chỉnh sửa trực tiếp trong Microsoft Word**.
  - Xử lý mượt mà hơn 50 cấu trúc công thức phức tạp: Ma trận ($pmatrix, bmatrix$), Tích phân có cận ($\int_a^b$), Giới hạn ($\lim$), Hệ phương trình ($cases$), Cân bằng hóa học ($\ce{...}$), Ký hiệu hạt nhân phóng xạ ($_{Z}^{A}\text{X}$).
- **Quy chuẩn chống vỡ trang in A4**:
  - Thiết lập các thuộc tính ngắt trang chuẩn của Word (`keepNext: true`, `keepLines: true`) cho toàn bộ tiêu đề câu hỏi, các phương án lựa chọn và các ý con.
  - Tuyệt đối ngăn chặn hiện tượng một câu hỏi bị ngắt đôi giữa 2 trang giấy gây khó khăn cho học sinh khi làm bài trên giấy.

### 6.12. An Ninh Bảo Mật, Kiểm Soát Quyền & Chống Gian Lận
- **Xác thực phiên bảo mật (Session Auth)**:
  - Cookie mang đầy đủ cờ an toàn: `HttpOnly` (chống lộ cookie qua mã độc JavaScript), `SameSite: Lax` (chống tấn công CSRF), và `Secure` trên môi trường Production.
  - Phân quyền chặt chẽ ở tầng Server-side: Giáo viên chỉ có quyền truy cập dữ liệu của chính mình, chặn hoàn toàn truy vấn chéo (`ownerId`). Chỉ `SUPER_ADMIN` mới có quyền vào các route quản trị hệ thống.
- **Chống dò quét mật khẩu (Brute-force lockout)**: Tự động ghi nhận số lần đăng nhập thất bại theo email và IP; khóa tạm thời 15 phút nếu thử sai quá 5 lần liên tiếp.
- **Bắt buộc đổi mật khẩu lần đầu**: Khi admin cấp tài khoản giáo viên mới, giáo viên bắt buộc phải đổi mật khẩu ở lần đăng nhập đầu tiên trước khi được phép sử dụng hệ thống.
- **Bảng xếp hạng an toàn (Top & Me)**: Học sinh chỉ xem được Top 3–5 bạn điểm cao nhất lớp và dòng vị trí riêng của chính mình; hệ thống không trả về toàn bộ điểm của lớp nhằm bảo vệ sự riêng tư của học sinh.

### 6.13. Hệ Thống Sao Lưu (Backup) & Khôi Phục (Restore) Tự Động
- Cung cấp sẵn các kịch bản sao lưu và khôi phục tự động trong thư mục `scripts/`:
  - `backup.ps1` (Dành cho môi trường Windows PowerShell).
  - `backup.sh` (Dành cho môi trường Linux / Docker Container).
  - `restore.ps1` (Dành cho việc thử nghiệm khôi phục dữ liệu nhanh chóng).
- Sử dụng công cụ chuẩn `pg_dump --clean --if-exists`, nén dữ liệu và tự động dọn dẹp các bản sao lưu cũ quá 30 ngày. Đã được kiểm thử khôi phục thành công 100% trong môi trường thực tế.

---

## 7. KẾT QUẢ KIỂM THỬ TOÀN DIỆN

Hệ thống được kiểm thử tự động nghiêm ngặt bằng TypeScript thông qua Master Test Runner `tests/run_all_v3_tests.ts`. Toàn bộ 6 giai đoạn phát triển đều đạt tỷ lệ vượt qua **100%**:

```
===============================================================
       EXAMCRAFT v3.1 — KIỂM THỬ TỰ ĐỘNG TOÀN BỘ CÁC GIAI ĐOẠN
===============================================================

⏳ Đang chạy: Giai đoạn 1: Auth & Docker PostgreSQL...          ✅ ĐẠT (6/6 bài test - 100%)
⏳ Đang chạy: Giai đoạn 2: CSDL Câu hỏi, Đề thi & 7 AI Keys...   ✅ ĐẠT (7/7 bài test - 100%)
⏳ Đang chạy: Giai đoạn 3: Giao bài & Phòng thi học sinh...     ✅ ĐẠT (10/10 bài test - 100%)
⏳ Đang chạy: Giai đoạn 4: Giám sát bài thi & Bảng điểm...      ✅ ĐẠT (9/9 bài test - 100%)
⏳ Đang chạy: Giai đoạn 5: Xuất file Word .docx & Định dạng A4...✅ ĐẠT (6/6 bài test - 100%)
⏳ Đang chạy: Giai đoạn 6: Bảo mật, Sao lưu & Kiểm chứng...     ✅ ĐẠT (5/5 bài test - 100%)

===============================================================
🎉 TẤT CẢ 6/6 GIAI ĐOẠN ĐÃ VƯỢT QUA KIỂM THỬ XUẤT SẮC!
===============================================================
```

### Kiểm Tra Biên Dịch & Đóng Gói Sản Phẩm (Build Production):
- Lệnh chạy: `npm run build`
- Trình biên dịch: **Next.js 16.4.2 Turbopack**
- Kết quả: **34/34 Routes** biên dịch thành công 100% không có bất kỳ lỗi TypeScript hay Prerender nào.

---

## 8. HƯỚNG DẪN CÀI ĐẶT & TRIỂN KHAI

### Phương Án A: Chạy Trên Máy Cá Nhân (Local Development với Docker)
1. **Khởi động CSDL PostgreSQL qua Docker Compose**:
   ```bash
   docker compose up -d db
   ```
   *(PostgreSQL 16 sẽ chạy tại cổng `localhost:5436`)*
2. **Cài đặt thư viện**:
   ```bash
   npm install
   ```
3. **Cấu hình môi trường**:
   Sao chép `.env.example` thành `.env.local` và điền key Google Gemini:
   ```env
   DATABASE_URL="postgresql://examcraft:examcraft_secret_2026@localhost:5436/examcraft?schema=public"
   SESSION_SECRET="examcraft_session_super_secret_key_2026"
   ADMIN_EMAIL="admin@examcraft.local"
   ADMIN_INITIAL_PASSWORD="AdminPassword2026@"
   GEMINI_API_KEY_1="AIzaSy..."
   ```
4. **Khởi tạo dữ liệu & Seed mẫu**:
   ```bash
   npx prisma migrate dev
   npx tsx prisma/seed.ts
   ```
5. **Chạy ứng dụng**:
   ```bash
   npm run dev
   ```
   Truy cập trình duyệt tại: `http://localhost:3000`

---

### Phương Án B: Triển Khai Trực Tuyến Lên Vercel & Cloud Database (Neon.tech)
1. **Tạo CSDL PostgreSQL miễn phí trên [Neon.tech](https://neon.tech)**:
   - Đăng ký bằng GitHub, tạo project `examcraft` với vùng **Singapore (`ap-southeast-1`)**.
   - Copy chuỗi kết nối dạng `postgresql://neondb_owner:xxx@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.
2. **Đẩy cấu trúc bảng lên Neon**:
   ```powershell
   $env:DATABASE_URL="<chuỗi_kết_nối_neon>"
   npx prisma db push
   npx tsx prisma/seed.ts
   ```
3. **Deploy lên Vercel ([vercel.com](https://vercel.com))**:
   - Import repository `ExamCraft` từ GitHub.
   - Thêm các biến môi trường: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `GEMINI_API_KEY_1`.
   - Bấm **Deploy**. Sau 1 phút hệ thống sẽ hoạt động tại tên miền `https://exam-craft.vercel.app`.

---

## 9. ĐÁNH GIÁ & HƯỚNG PHÁT TRIỂN TIẾP THEO

### Đánh Giá Thành Tựu
- Đã giải quyết triệt để bài toán khảo thí trực tuyến cho giáo viên: từ việc chuẩn bị đề thi, trộn đề, in ấn đến việc tổ chức thi trực tuyến không cần học sinh tạo tài khoản.
- Kiến trúc Server-authoritative đảm bảo tính công bằng, bảo mật dữ liệu và chống gian lận hiệu quả.
- Tận dụng sức mạnh của 7 Google Gemini API Keys theo cơ chế xoay tua thông minh, tiết kiệm tối đa chi phí vận hành cho giáo viên.

### Các Hướng Mở Rộng Tiềm Năng Trong Tương Lai
1. **Mã PIN bảo mật phòng thi**: Bổ sung mã PIN 4–6 số cho mỗi bài giao, học sinh cần nhập đúng PIN mới được mở đề thi.
2. **Hỗ trợ hình học không gian phức tạp & Mạch điện**: Tích hợp công cụ vẽ hình học GeoGebra hoặc Canvas chuyên sâu cho môn Vật lý.
3. **Ứng dụng PWA Offline**: Cho phép học sinh tiếp tục làm bài nháp ngay cả khi kết nối mạng chập chờn hoặc mất sóng tạm thời.

---
*Báo cáo được biên soạn và kiểm chứng tự động vào tháng 10/2026.*  
*Tác giả phát triển: Đội ngũ ExamCraft — Giấy phép phần mềm: MIT License.*
