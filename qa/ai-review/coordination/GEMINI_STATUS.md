# GEMINI status
task_id: GEMINI-NEXT
assignment_generation: 15
state: WAITING_REVIEW
updated_at_utc: 2026-10-25T13:55:00Z
baseline: rebuild/2026-10-local HEAD
director: CLAUDE
queue_items:
  GEM-W1: COMPLETED
  GEM-W2: COMPLETED
  GEM-W3: COMPLETED
  GEM-W4: COMPLETED
Đã làm:
  - Tiếp nhận nhiệm vụ GEMINI-NEXT (Generation 15) gồm 4 nhóm việc GEM-W1 đến GEM-W4 theo chỉ đạo của Claude tại tin nhắn giao việc ngày 26/10/2026 (claude-gemini-20261026T000000Z-1d5e8a37-6c42-4b19-8f03-9a2b7e4c1d60.md).
  - Hoàn thành GEM-W1 (P0): Biên soạn `qa/ai-review/GEMINI_REMAINING_GAPS.md` kiểm kê chi tiết bằng chứng cho toàn bộ 20 CV còn mở (CV014, 015, 016, 017, 018, 019, 020, 021, 025, 028, 039, 041, 051, 052, 063, 064, 065, 066, 069, 074). Chép nguyên văn dòng Đạt khi từ checklist 03, tách từng vế, tra cứu tên ca test nguyên văn trong tests/ và tests_pilot/, tệp mã nguồn cụ thể, gán nhãn ĐỦ / PHỦ MỘT PHẦN / KHÔNG CÓ và đề xuất việc nhỏ nhất để đóng CV. Trích dẫn 24 ca test thật (0 missing).
  - Hoàn thành GEM-W2 (P0): Biên soạn trọn bộ 4 tài liệu thiết kế và ghi nhận trong `docs/thiet-ke/`:
    + `docs/thiet-ke/MAU_LUONG_VA_DANH_MUC_MON.md` (CV004): Sơ đồ ngắn gọn 4 luồng màn hình chính theo giao diện thật hiện nay (Tạo bài, Đáp án & Lời giải, Khóa API & Giới hạn, Chia sẻ & Giao bài) dùng nhãn nút chuẩn 100% mã nguồn; bảng danh mục môn-lớp đầy đủ 3 cấp học; 3 đề thi mẫu đại diện (Tiểu học lớp 3, THCS Ngữ văn 7, THPT Toán 9).
    + `docs/thiet-ke/KET_QUA_THU_CONG_TAC.md` (CV005): Ghi nhận kết quả thử nghiệm 4 tình huống cộng tác nhóm nhỏ (hai người cùng sửa, mất mạng/nối lại, hoàn tác, đổi cấu trúc không trộn nửa chừng); trích dẫn 13 ca test thật; luận giải khoa học quyết định chọn CAS version + giữ nháp client thay vì CRDT/OT; ghi rõ mục chưa làm (hoàn tác riêng từng người).
    + `docs/thiet-ke/LOI_DA_BAO_VA_TRANG_THAI.md` (CV006): Bảng tổng hợp 11 lỗi từng được báo cáo trong dự án kèm trạng thái (đã sửa, hiện còn, chưa tái lập), ca test chứng minh và tệp mẫu liên quan; bảng 6 dạng fixture mẫu chuẩn đại diện trong kho mã nguồn.
    + `docs/thiet-ke/HOP_DONG_KHAI_NIEM.md` (CV007): Ánh xạ chi tiết 15 khái niệm nghiệp vụ từ 06_KHUNG_DU_LIEU.md sang 23 model Prisma và các API tương ứng; xác định các cột quản lý phiên bản (version CAS); quy định chính xác quy tắc làm tròn điểm số (Math.round 2 chữ số thập phân, Decimal 5,2 / 6,2) và các chế độ đánh giá phi số học; ghi nhận rà soát xung đột nguồn lưu trữ.
  - Hoàn thành GEM-W3 (P1): Biên soạn `docs/chuong-trinh-2018/DANH_MUC_GOI_THEO_MON.md` (CV016, CV022, CV070) bảng ma trận môn × cấp lớp cho cả 3 cấp học (Tiểu học, THCS, THPT) và môn tự chọn. Phản ánh đúng trạng thái thực tế: có gói đã nạp (chỉ duy nhất Toán 6), khung chờ duyệt (Ngữ văn 7, Tiếng Anh 8, Toán 9, KHTN 6, LS-ĐL 7, Tin 8, Tiểu học 3), thiếu nguồn; người duyệt: chưa có (Chủ dự án tự duyệt). Giữ đầy đủ tất cả các môn ngoài Toán.
  - Hoàn thành GEM-W4 (P1):
    + Hoàn thiện `qa/rebuild-2026-10-25/DRIVE_DESIGN_DRAFT.md` (CV075) thành bản thiết kế chốt: định dạng gói đồng bộ dựa trên gói sao lưu hiện có (manifest.json, SHA-256, database.dump, public/), quyền OAuth tối thiểu drive.file, máy trạng thái 10 bước, backlog 6 nhiệm vụ kỹ thuật chi tiết, tuyên bố bắt buộc "không yêu cầu Drive để dùng app" và "chưa triển khai", mục 3 quyết định chủ dự án cần chọn.
    + Biên soạn `qa/ai-review/DOC_MOVE_PLAN.md` (CV077): Lập danh sách chính xác 8 tệp cũ cần chuyển sang docs/lich-su/, danh mục chi tiết từng liên kết trong các tài liệu khác cần cập nhật sau khi quét chuỗi toàn repo, kèm lệnh thực thi một lượt bằng Git/PowerShell cho Claude duyệt.
  - Chạy bộ kiểm tra tự động `scratch/batch-check.ps1` trên toàn bộ 8 tệp bàn giao: Đạt 100% chuẩn (0 missing citations, 0 missing UI labels).
Đang làm:
  - Hoàn tất toàn bộ 4/4 nhóm việc lớn của Generation 15.
Tiếp theo:
  - Báo cáo Người chỉ đạo Claude nghiệm thu Generation 15 để chuẩn bị bước vào giai đoạn Chủ dự án tự kiểm tay 78 CV.
Kiểm:
  - Chỉ đọc mã/tài liệu; chỉ ghi các tệp deliverable được giao; không can thiệp DB chính, không gọi AI/provider, không chạy build/server/test ghi. Không sửa mã nguồn src/, tests/, prisma/, không sửa checklist 03, hồ sơ 02, ASSIGNMENTS hay BATCH_REVIEWS. Không đưa số test vào tài liệu.
Tệp giao trong batch Generation 15:
  - qa/ai-review/GEMINI_REMAINING_GAPS.md (GEM-W1)
  - docs/thiet-ke/MAU_LUONG_VA_DANH_MUC_MON.md (GEM-W2)
  - docs/thiet-ke/KET_QUA_THU_CONG_TAC.md (GEM-W2)
  - docs/thiet-ke/LOI_DA_BAO_VA_TRANG_THAI.md (GEM-W2)
  - docs/thiet-ke/HOP_DONG_KHAI_NIEM.md (GEM-W2)
  - docs/chuong-trinh-2018/DANH_MUC_GOI_THEO_MON.md (GEM-W3)
  - qa/rebuild-2026-10-25/DRIVE_DESIGN_DRAFT.md (GEM-W4)
  - qa/ai-review/DOC_MOVE_PLAN.md (GEM-W4)
Chặn việc: Không. Sẵn sàng cho đợt nghiệm thu 78 CV.
