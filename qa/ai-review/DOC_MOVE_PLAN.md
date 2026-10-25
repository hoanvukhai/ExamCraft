# Kế hoạch di chuyển tài liệu cũ sang docs/lich-su/ (CV077)

Tài liệu này hoàn thành tiêu chí nghiệm thu cho nhiệm vụ CV077 (GEM-W4, Generation 15) theo kế hoạch kiểm thử và bàn giao của dự án ExamCraft.

---

## 1. Mục tiêu và nguyên tắc thực hiện

1. Mục tiêu:
   - Dọn dẹp thư mục gốc docs/ và docs/huong-dan/, đưa các báo cáo phân tích ban đầu, thiết kế cũ và tài liệu hướng dẫn đã lỗi thời vào thư mục docs/lich-su/.
   - Giữ cây tài liệu gọn gàng, tránh gây nhầm lẫn cho giáo viên hoặc người kế thừa dự án giữa tài liệu hiện hành và tài liệu nghiên cứu lịch sử.
2. Nguyên tắc an toàn:
   - Tài liệu này chỉ đóng vai trò là KẾ HOẠCH HÀNH ĐỘNG CHI TIẾT (Execution Plan) trình lên người chỉ đạo (Claude) phê duyệt và thực hiện một lượt.
   - Trợ lý AI (Gemini) tuyệt đối không tự ý chạy lệnh di chuyển (mv/git mv) hoặc sửa hàng loạt liên kết khi chưa có sự chấp thuận.

---

## 2. Danh sách chính xác 8 tệp cần chuyển sang docs/lich-su/

| STT | Đường dẫn tệp hiện tại | Đường dẫn đích đề xuất | Lý do di chuyển |
|---|---|---|---|
| 1 | `docs/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md` | `docs/lich-su/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md` | Báo cáo phân tích sơ khởi ngày 21/10; các nội dung kỹ thuật đã được tích hợp vào `docs/ke-hoach-2026-10-21/`. |
| 2 | `docs/BAO_CAO_TOAN_DIEN_V3.md` | `docs/lich-su/BAO_CAO_TOAN_DIEN_V3.md` | Báo cáo toàn diện cũ; đã được thay thế bởi hồ sơ bàn giao hiện hành `docs/ban-giao/00_DOC_TRUOC.md` và `02_TRANG_THAI_TIEP_NOI.md`. |
| 3 | `docs/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md` | `docs/lich-su/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md` | Báo cáo chuẩn bị V2 ngày 21/10; các yêu cầu đã chuyển thành checklist kỹ thuật. |
| 4 | `docs/BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md` | `docs/lich-su/BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md` | Văn bản bổ sung chốt hướng ngày 21/10; đã hoàn thành vai trò lịch sử. |
| 5 | `docs/CHECKLIST_TIEN_DO.md` | `docs/lich-su/CHECKLIST_TIEN_DO.md` | Checklist tiến độ cũ. Dự án quy định chỉ dùng duy nhất `docs/ke-hoach-2026-10-21/03_CHECKLIST.md` làm thước đo tiến độ. |
| 6 | `docs/EXAMCRAFT_THIET_KE_V3.md` | `docs/lich-su/EXAMCRAFT_THIET_KE_V3.md` | Bản thiết kế kiến trúc cũ trước khi chốt nền tảng Next.js 15 và PostgreSQL Prisma. |
| 7 | `docs/TIEN_DO_CAI_TIEN_EXAMCRAFT.md` | `docs/lich-su/TIEN_DO_CAI_TIEN_EXAMCRAFT.md` | Báo cáo tiến độ cải tiến sơ khai; không còn giá trị điều phối hiện hành. |
| 8 | `docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md` | `docs/lich-su/HUONG_DAN_GIAO_VIEN_PILOT.md` | Bản hướng dẫn pilot ngắn cũ; đã được thay thế trọn vẹn bởi `docs/huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md` (chuẩn hóa 63/63 nhãn giao diện). |

---

## 3. Danh mục các liên kết cần cập nhật sau khi di chuyển

Kết quả quét chuỗi tự động trên toàn bộ kho mã nguồn cho thấy các tài liệu sau có chứa đường dẫn tham chiếu đến 8 tệp trên, cần được cập nhật đường dẫn tương ứng:

### 3.1. Các liên kết đến BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md
- Tệp `docs/ke-hoach-2026-10-21/05_CHUAN_BI_VA_NGUON.md` (dòng 82):
  - Chuỗi cũ: `| [V1](../BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md) |`
  - Chuỗi mới: `| [V1](../lich-su/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md) |`
- Tệp `docs/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md` (dòng 37, 403):
  - Tệp này cùng được chuyển vào docs/lich-su/, nên nếu ở cùng thư mục đích thì liên kết tương đối vẫn giữ nguyên.

### 3.2. Các liên kết đến BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md
- Tệp `docs/ke-hoach-2026-10-21/05_CHUAN_BI_VA_NGUON.md` (dòng 83):
  - Chuỗi cũ: `| [V2](../BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md) |`
  - Chuỗi mới: `| [V2](../lich-su/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md) |`
- Tệp `docs/ke-hoach-2026-10-21/08_HO_SO_TRUOC_KHI_CODE.md` (dòng 10):
  - Chuỗi cũ: `[báo cáo chuẩn bị](../BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md)`
  - Chuỗi mới: `[báo cáo chuẩn bị](../lich-su/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md)`

### 3.3. Các liên kết đến BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md
- Tệp `docs/ke-hoach-2026-10-21/05_CHUAN_BI_VA_NGUON.md` (dòng 84):
  - Chuỗi cũ: `| [V3 bổ sung](../BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md) |`
  - Chuỗi mới: `| [V3 bổ sung](../lich-su/BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md) |`

### 3.4. Các liên kết đến CHECKLIST_TIEN_DO.md
- Tệp `docs/ban-giao/00_DOC_TRUOC.md` (dòng 6):
  - Chuỗi cũ: `Checklist chính là docs/ke-hoach-2026-10-21/03_CHECKLIST.md; không dùng docs/CHECKLIST_TIEN_DO.md.`
  - Chuỗi mới: `Checklist chính là docs/ke-hoach-2026-10-21/03_CHECKLIST.md; không dùng docs/lich-su/CHECKLIST_TIEN_DO.md.`
- Tệp `docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md` (dòng 12):
  - Chuỗi cũ: `Checklist chính: docs/ke-hoach-2026-10-21/03_CHECKLIST.md; không dùng docs/CHECKLIST_TIEN_DO.md`
  - Chuỗi mới: `Checklist chính: docs/ke-hoach-2026-10-21/03_CHECKLIST.md; không dùng docs/lich-su/CHECKLIST_TIEN_DO.md`
- Tệp `qa/00_claims.md` (dòng 6):
  - Chuỗi cũ: `docs/CHECKLIST_TIEN_DO.md`
  - Chuỗi mới: `docs/lich-su/CHECKLIST_TIEN_DO.md`

### 3.5. Các liên kết đến EXAMCRAFT_THIET_KE_V3.md
- Tệp `qa/00_claims.md` (dòng 6):
  - Chuỗi cũ: `docs/EXAMCRAFT_THIET_KE_V3.md`
  - Chuỗi mới: `docs/lich-su/EXAMCRAFT_THIET_KE_V3.md`
- Tệp `qa/01_evidence_matrix.md` (dòng 10):
  - Chuỗi cũ: `docs/EXAMCRAFT_THIET_KE_V3.md`
  - Chuỗi mới: `docs/lich-su/EXAMCRAFT_THIET_KE_V3.md`

### 3.6. Các liên kết đến HUONG_DAN_GIAO_VIEN_PILOT.md
- Tệp `docs/ban-giao/02_TRANG_THAI_TIEP_NOI.md` (dòng 24, 30):
  - Chuỗi cũ: `[hướng dẫn ngắn](huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md)` và `[hướng dẫn ngắn](../huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md)`
  - Chuỗi mới: Thay thế bằng liên kết trỏ tới cẩm nang hiện hành: `[hướng dẫn giáo viên](huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md)` và `[hướng dẫn giáo viên](../huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md)`.
- Tệp `docs/ke-hoach-2026-10-21/03_CHECKLIST.md` (dòng 349):
  - Chuỗi cũ: `[Hướng dẫn](../huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md)`
  - Chuỗi mới: `[Hướng dẫn](../huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md)` (hoặc `[Hướng dẫn cũ](../lich-su/HUONG_DAN_GIAO_VIEN_PILOT.md)`).
- Tệp `qa/rebuild-2026-10-25/BATCH_SUMMARY.md` (dòng 72):
  - Chuỗi cũ: `[hướng dẫn ngắn](../../docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md)`
  - Chuỗi mới: `[hướng dẫn giáo viên](../../docs/huong-dan/HUONG_DAN_GIAO_VIEN_DAY_DU.md)`.

---

## 4. Lệnh thực hiện đề xuất cho Claude (Thực thi một lượt)

Khi Claude phê duyệt, có thể chạy các thao tác sau trong phiên điều phối:

```powershell
# 1. Tạo thư mục docs/lich-su nếu chưa có
New-Item -ItemType Directory -Force -Path docs/lich-su

# 2. Di chuyển 7 tệp từ docs/ sang docs/lich-su/
git mv docs/BAO_CAO_PHAN_TICH_DINH_HUONG_2026-10-21.md docs/lich-su/
git mv docs/BAO_CAO_TOAN_DIEN_V3.md docs/lich-su/
git mv docs/BAO_CAO_TONG_HOP_CHUAN_BI_EXAMCRAFT_V2_2026-10-21.md docs/lich-su/
git mv docs/BO_SUNG_CHOT_HUONG_EXAMCRAFT_V3_2026-10-21.md docs/lich-su/
git mv docs/CHECKLIST_TIEN_DO.md docs/lich-su/
git mv docs/EXAMCRAFT_THIET_KE_V3.md docs/lich-su/
git mv docs/TIEN_DO_CAI_TIEN_EXAMCRAFT.md docs/lich-su/

# 3. Di chuyển tài liệu pilot cũ từ docs/huong-dan/ sang docs/lich-su/
git mv docs/huong-dan/HUONG_DAN_GIAO_VIEN_PILOT.md docs/lich-su/
```

Kế hoạch này đảm bảo việc dọn dẹp diễn ra trật tự, có thể kiểm chứng được và không làm đứt gãy bất kỳ liên kết nội bộ nào trong toàn bộ dự án.
