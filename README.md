# ExamCraft — Không gian soạn và quản lý bài của giáo viên

ExamCraft hướng tới hỗ trợ giáo viên quản lý tài liệu, chọn kiến thức, soạn câu hỏi–đáp án, cùng biên soạn, xuất tài liệu và giao bài qua liên kết. Phạm vi gồm nhiều môn, lớp 1–12; Toán là tuyến kiểm thử sớm của chủ dự án.

**Trạng thái: đang triển khai cải tiến trên local.** Đã bảo toàn working tree và phục hồi bản sao DB, sửa lưu/nháp/quyền và bổ sung kiểm thử. Tiến độ và giới hạn bằng chứng xem [báo cáo chung](docs/TIEN_DO_CAI_TIEN_EXAMCRAFT.md); chưa nghiệm thu toàn bộ S0–S9.

## Tài liệu hiện hành

Bắt đầu từ [Hồ sơ tiếp nối — đọc trước](docs/ban-giao/00_DOC_TRUOC.md). AI/người mới đọc trang này và trạng thái02, rồi chỉ mở phần liên quan. [Mục lục kế hoạch](docs/ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md) giữ định hướng và tiêu chí chi tiết.

- [Tổng kết sản phẩm và phạm vi](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/01_TONG_KET_DU_AN.md)
- [Lộ trình thực hiện](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/02_LO_TRINH.md)
- [Checklist có tiêu chí hoàn thành](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/03_CHECKLIST.md)
- [Kiểm thử và nghiệm thu](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/04_NGHIEM_THU.md)
- [Chuẩn bị, rủi ro và nguồn](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/05_CHUAN_BI_VA_NGUON.md)
- [Khung dữ liệu](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/06_KHUNG_DU_LIEU.md)
- [Nghiên cứu tài liệu và bộ prompt](F:/Workspace/Zazz/ExamCraft/docs/ke-hoach-2026-10-21/07_NGHIEN_CUU_VA_PROMPT.md)

Các báo cáo V1/V2/V3, thiết kế v3.1 và checklist cũ là lịch sử/đầu vào đối chiếu; dấu hoàn thành cũ không dùng làm tiến độ đợt mới. Báo cáo trong `qa/rebuild-2026-10-22/` là bằng chứng triển khai hiện hành, có giới hạn và mốc chạy riêng; tra qua hồ sơ tiếp nối.

## Nguyên tắc sản phẩm

Giáo viên là người dùng chính; học sinh làm bài qua link giáo viên mở. Giáo viên có key AI riêng và quyền tùy chỉnh mẫu. Một bộ kết nối phục vụ gói API miễn phí/trả phí, không hứa hạn mức cố định theo số key.

Dữ liệu server là nguồn chính; nháp cục bộ, lịch sử và backup hỗ trợ phục hồi. Chia sẻ xem tách quyền góp ý/cùng sửa. Nội dung AI và mẫu cần nguồn, phiên bản và mức kiểm chứng rõ ràng. Các mức Biết–Hiểu–Vận dụng đi theo khung áp dụng, không ép mọi bài dùng một cấu hình.

## Nền tảng hiện có

Next.js/React/TypeScript, PostgreSQL qua Prisma, Gemini qua @google/genai, Dexie cho phần local, KaTeX và thư viện docx. Phiên bản chính xác tra package.json và lockfile; không dùng mô tả công nghệ cũ làm bằng chứng tính năng.

## Chuẩn bị chạy local

Chủ dự án đã chọn local trước; baseline/DB thử và migration đã có bằng chứng trong báo cáo tiến độ. Tra [bản đồ mã và lệnh kiểm](docs/ban-giao/01_BAN_DO_MA_NGUON.md) và trạng thái02 trước chạy; không lặp lại S0 hay migration chỉ vì đọc hướng dẫn cũ. Không chạy seed hoặc thay schema trên dữ liệu thật chỉ để thử khởi động.

Các script hiện được khai báo trong package.json:
- npm run dev: khởi động môi trường phát triển.
- npm run build / npm run start: build và chạy bản build.
- npm test / npm run test:all: kiểm thử hàm cô lập, không tự ghi DB hoặc gọi AI.
- npm run test:integration: DB thử riêng, có kiểm tra đích trước khi ghi.
- npm run test:http: cần máy chủ thử trên127.0.0.1:3117, tự kiểm dấu hiệu DB thử trước khi tạo tài khoản giả.
- npm run lint: kiểm toàn repo; chưa có bằng chứng sạch toàn bộ. Lint định hướng chỉ xác nhận những tệp được kiểm.

Đọc AGENTS.md và hướng dẫn Next.js cục bộ liên quan trước viết code. Giữ bí mật ngoài Git. API key cá nhân nhập qua giao diện được bảo vệ khi tới bước thử AI, không điền vào tài liệu.

Ghi chú lịch sử: lượt lập kế hoạch21/10/2026 chỉ cập nhật tài liệu. Trạng thái triển khai sau đó xem hồ sơ tiếp nối, không dùng câu “chưa chạy” tại mốc cũ để kết luận trạng thái hiện tại.

## Giấy phép

Xem [LICENSE](F:/Workspace/Zazz/ExamCraft/LICENSE) trong repo. Quyền dùng tài liệu/đề nhập từ nguồn ngoài cần lưu riêng, không suy từ giấy phép mã nguồn.
