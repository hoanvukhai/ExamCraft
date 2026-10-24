# KIẾN TRÚC TỔNG THỂ TÁI CẤU TRÚC: HỆ THỐNG QUẢN LÝ & BIÊN SOẠN ĐỀ THI EXAMCRAFT

> **Báo cáo lịch sử trước đợt rebuild 22/10/2026, không phải trạng thái hiện tại.** Số liệu, "100%" và kết luận ở đây mô tả cây mã commit `ef8d34b`/phiên QA cũ, không dùng làm tiến độ. Trạng thái hiện tại: [hồ sơ 02](../docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md); bằng chứng hiện hành: `qa/rebuild-2026-10-22/`, `qa/rebuild-2026-10-23/`.

> **Tài liệu lịch sử/đầu vào phân tích:** từ 21/10/2026, dùng [bộ tổng kết và kế hoạch hiện hành](../docs/ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md). Nội dung và dấu hoàn thành dưới đây không tự đại diện cho yêu cầu hoặc tiến độ mới; giữ để đối chiếu nguồn gốc.
> **Mục tiêu**: Nâng cấp ExamCraft từ một công cụ soạn đề đơn lẻ thành **Nền tảng Quản lý & Biên soạn Đề thi Toàn diện (Personal Exam Management & Authoring Platform)** dành cho giáo viên Việt Nam.

---

## I. TỔNG QUAN VẤN ĐỀ & ĐỊNH HƯỚNG MỚI

### 1. Bất cập của mô hình cũ (Monolithic Editor)
- **Thiếu trang bắt đầu**: Giáo viên đăng nhập lập tức rơi vào "bàn mổ" (trình soạn thảo) của một đề kiểm tra trắng. Không có không gian tổng quan để quản lý các đề đã tạo, tìm lại đề cũ theo năm học, khối lớp.
- **Menu bị quá tải & chồng chéo**: Thanh công cụ bên trái (Left Navigation Rail) nhồi nhét tất cả tính năng vào một chỗ (vừa soạn đề, vừa quản lý lớp học, vừa mở kho đề đã lưu dạng popup modal).
- **Ranh giới không rõ ràng**: Các tác vụ **Quản lý cấp tài khoản** (Lớp học, Kho đề, Thư mục, Ngân hàng câu hỏi) bị trộn lẫn với các tác vụ **Biên soạn một đề cụ thể** (Trộn đề, Đổi số liệu, Tiêu đề trường thi, Xuất Word).

### 2. Định hướng tái cấu trúc: Phân tách 2 Không gian Độc lập
1. **Không gian 1: TRANG QUẢN LÝ CÁ NHÂN (Teacher Management Dashboard - `/`)**
   - Đóng vai trò là Trang chủ (Home) sau khi đăng nhập.
   - Quản lý cây Thư mục (tối đa 2 cấp), Thư viện đề thi, Bộ lọc thông minh (Môn, Khối, Gần đây, Gắn sao), Lớp học, Ngân hàng câu hỏi.
   - Có điểm truy cập cho **Trợ lý Thư ký AI (AI Secretary)** (hiển thị trạng thái đang phát triển / beta).
2. **Không gian 2: BÀN SOẠN ĐỀ CHUYÊN SÂU (Exam Authoring Workspace - `/editor/[id]` hoặc `/workspace?id=...`)**
   - Chỉ tập trung vào việc tạo/sửa một đề thi cụ thể.
   - Có nút `[← Kho đề của tôi]` ở góc trên bên trái để quay lại Dashboard và tự động lưu.
   - Thanh công cụ chỉ giữ lại những chức năng trực tiếp của đề thi đó (AI Copilot, Trộn mã đề, Ma trận CV 7991, Tiêu đề trường thi, In/Xuất Word).

---

## II. THIẾT KẾ CẤU TRÚC THƯ MỤC & PHÂN LOẠI ĐỀ THI

### 1. Quy tắc độ sâu thư mục: Tối đa 2 cấp (Max Depth = 2)
- **Thư mục Cấp 1 (Folder cha)**: Khối lớp, Năm học hoặc Mục tiêu lớn.  
  *Ví dụ: `Khối 12`, `Năm học 2025-2026`, `Bồi dưỡng HSG`.*
- **Thư mục Cấp 2 (Subfolder con)**: Phân loại theo kỳ kiểm tra hoặc chuyên đề.  
  *Ví dụ: `Học kỳ 1`, `Chuyên đề Hàm số`, `Đề thi thử Tốt nghiệp`.*
- **Đề thi**: Nằm trong Thư mục Cấp 1 hoặc Cấp 2.
- **Quy tắc chặn**: Không cho phép tạo Thư mục Cấp 3 để tránh cây thư mục quá sâu, vỡ giao diện trên di động và khó tìm kiếm.

### 2. Mô hình phân loại Lai Thông minh (Hybrid: Folders + Metadata Smart Filters)
Không ép giáo viên phải nhớ cây thư mục. Hệ thống cung cấp các bộ lọc tự động:
- **Tất cả đề thi (All Exams)**: Toàn bộ đề thi do giáo viên sở hữu.
- **Gần đây (Recent)**: Xếp theo thời gian sửa đổi mới nhất.
- **Quan trọng / Đã gắn sao (Starred)**: Đề thi đang dùng trong tuần.
- **Lọc theo Môn học (Subject)**: Toán, Vật lí, Hóa học, Sinh học, Ngữ văn, Lịch sử...
- **Lọc theo Khối lớp (Grade)**: Lớp 10, 11, 12, THCS.
- **Thùng rác (Trash)**: Lưu các đề đã xóa tạm thời trong 30 ngày.

---

## III. TÁI THIẾT KẾ MENU & CÁC KHU VỰC CHỨC NĂNG

### A. MENU TẠI TRANG QUẢN LÝ (Dashboard Sidebar)
Thanh bên trái của Trang Quản lý cá nhân bao gồm:

| Nhóm | Mục | Chức năng |
| :--- | :--- | :--- |
| **Tác vụ nhanh** | `[+ Soạn đề mới]` | Dropdown: Đề trống mới, Sinh đề bằng AI, Nhập Word/LaTeX |
| **Điều hướng chính** | 📂 **Kho đề thi của tôi** | Màn hình lưới/danh sách đề thi và cây thư mục |
| | ⭐ **Đề quan trọng (Gắn sao)** | Các đề đã đánh dấu sao |
| | 🕒 **Gần đây** | Đề mới chỉnh sửa gần nhất |
| **Thư mục cá nhân** | 📁 `[+ Tạo thư mục mới]` | Cây thư mục 2 cấp có gắn màu sắc (Xanh, Đỏ, Cam, Tím...) |
| **Dạy học & Khảo thí** | 👥 **Quản lý Lớp học** | Quản lý danh sách lớp và học sinh (`/teacher/groups`) |
| | 📊 **Khảo thí & Bảng điểm** | Xem kết quả học sinh làm bài thi online (`/teacher/assignments`) |
| | 🗄️ **Ngân hàng câu hỏi** | Thư viện câu hỏi phân loại theo chuẩn GDPT 2018 |
| **Hệ thống & Trợ lý**| 🤖 **Trợ lý Thư ký AI** | Nút bấm mở hộp thoại: *(Đang phát triển / Beta)* |
| | 🔑 **Kho Khóa AI (Keys)** | Quản lý Google Gemini API Key cá nhân |
| | 🗑️ **Thùng rác** | Khôi phục hoặc xóa vĩnh viễn đề thi |

---

### B. MENU TẠI BÀN SOẠN ĐỀ (Editor Left Navigation Rail)
Thanh bên trái của Trình Soạn Đề chỉ giữ lại các công cụ biên soạn:

| Nhóm | Mục | Chức năng |
| :--- | :--- | :--- |
| **Điều hướng** | `[← Kho đề của tôi]` | Lưu đề và quay trở lại Dashboard |
| **Trợ lý & Biên tập** | 🤖 **Trợ lý AI Copilot** | Mở side-panel bên phải để ra lệnh đổi số liệu, sửa câu |
| | 🔀 **Trộn 4 mã đề** | Đảo câu hỏi, đảo phương án, sinh bảng đáp án 4 mã |
| | 📊 **Ma trận (CV 7991)** | Hiển thị bảng ma trận và đặc tả 4 mức độ nhận thức |
| | 🏛️ **Tiêu đề trường thi** | Cài đặt thông tin Sở, Trường, Môn, Thời gian |
| **Ngân hàng & Nhập liệu** | ➕ **Thêm câu hỏi mới** | Thêm câu hỏi thủ công vào đề |
| | 📥 **Lấy từ Ngân hàng** | Chọn câu hỏi có sẵn chèn vào đề đang soạn |
| | 📄 **Nhập đề (Word/Ảnh)** | Bóc tách tài liệu đưa thêm vào đề hiện tại |
| **Xuất bản & Chia sẻ** | 💾 **Tải file Word (.docx)** | Xuất bản Word chuẩn OMML toán học |
| | 🖨️ **In ấn / Lưu PDF** | In đề thi và đáp án chuẩn A4 |
| | 🚀 **Giao bài thi Online** | Tạo link bài thi cho học sinh làm bài trực tuyến |

---

## IV. GHI CHÚ VỀ TÍNH NĂNG TRỢ LÝ THƯ KÝ AI & AI QUẢN TRỊ (DÀNH CHO PHA SAU)

1. **Trợ lý Thư ký AI Cá nhân (Teacher AI Secretary)**:
   - **Mục tiêu**: Đóng vai trò thư ký riêng cho từng giáo viên, chỉ có quyền truy cập vào dữ liệu cá nhân của giáo viên đó (`ownerId`).
   - **Các tác vụ tương lai**:
     - Tìm kiếm thông minh bằng ngôn ngữ tự nhiên: *"Tìm các đề kiểm tra 1 tiết Toán 11 có câu hỏi về Hình không gian"*.
     - Quản lý thư mục tự động: *"Tạo thư mục Ôn thi Đại học và chuyển 5 đề thi thử vào đó"*.
     - Phân tích phổ điểm: *"Tổng hợp lớp 12A1 hay sai ở dạng bài nào trong bài kiểm tra vừa rồi"*.
   - **Giai đoạn hiện tại**: Đặt nút "Trợ lý Thư ký AI" trên Sidebar Dashboard với nhãn `Beta / Đang phát triển`. Khi người dùng click, hiển thị Modal giới thiệu lộ trình và tính năng sắp ra mắt.

2. **AI Quản trị Hệ thống (Admin AI Agent)**:
   - Dành cho tài khoản Quản trị viên (`role: SUPER_ADMIN`).
   - Giám sát toàn hệ sinh thái: lượng token AI, tình trạng API Key, tỷ lệ hoạt động của giáo viên, chất lượng ngân hàng câu hỏi toàn trường.
   - Triển khai sau khi hệ thống đã ổn định và có lượng người dùng lớn.

---

## V. LỘ TRÌNH TRIỂN KHAI KỸ THUẬT (ACTION PLAN)

1. **Bước 1: Cập nhật CSDL (Prisma Schema)**:
   - Thêm model `Folder` (id, name, color, parentId, ownerId, createdAt, updatedAt).
   - Bổ sung trường `folderId` và `isStarred` vào model `Exam`.
2. **Bước 2: Backend API**:
   - `/api/folders`: CRUD thư mục (ràng buộc tối đa 2 cấp).
   - `/api/exams`: Cập nhật hỗ trợ filter `folderId`, `isStarred`, di chuyển folder.
3. **Bước 3: Giao diện Trang Quản lý Kho đề (Dashboard Page - `/`)**:
   - Xây dựng layout Google Drive / Google Docs style: Header, Sidebar, Quick Action Cards, Folder Breadcrumbs, Exam Grid/List View.
   - Thêm nút và Modal "Trợ lý Thư ký AI (Đang phát triển)".
4. **Bước 4: Tái cấu trúc Bàn Soạn Đề (Editor - `/editor/[id]`)**:
   - Tinh gọn Left Navigation Rail: chỉ giữ các tính năng phục vụ đề hiện tại.
   - Thêm nút quay về `← Kho đề của tôi`.
5. **Bước 5: Kiểm thử Toàn diện**:
   - Unit tests cho cấu trúc Folder (ràng buộc 2 cấp).
   - E2E tests luồng: Đăng nhập -> Dashboard -> Tạo thư mục -> Tạo đề mới -> Soạn đề -> Lưu -> Quay lại Dashboard.
