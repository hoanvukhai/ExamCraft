# Định hướng giao diện giáo viên sau khi đổi hướng dự án

Ngày 27/10/2026. Người viết: Claude, dựa trên việc đọc mã sau các đợt sửa của chủ dự án và Codex (`3b992de`…`44e14ed`), báo cáo của Codex ([PHAN_TICH](../teacher-ui-audit/PHAN_TICH.md), [BAO_CAO](../teacher-ui-fix/BAO_CAO.md)) và ảnh chụp chủ dự án gửi.

## 1. Chẩn đoán: vì sao sửa mãi vẫn còn nặng

Các lỗi bạn thấy không phải bốn lỗi riêng. Chúng cùng một gốc: **giao diện mới được phủ lên mã viết cho phong cách cũ, chứ chưa được dựng lại trên một khung chung.**

| Bạn thấy | Nguyên nhân trong mã | Ghi chú |
|---|---|---|
| Menu ngang trên cùng lặp với menu dọc | Ba bộ khung khác nhau: kho đề (`TeacherDashboard`) có thanh trên, thanh ngang `TeacherNavigation` **và** thanh dọc; các trang `/teacher/*` chỉ có thanh ngang (không thanh dọc); quản trị có thanh ngang riêng (`AdminShell`). Thanh ngang do Codex thêm để nối các trang, nhưng không bỏ phần cũ, nên cùng một đích hiện hai lần | Cùng bệnh ở trang soạn: nút "Kho đề" trên thanh đầu, biểu tượng logo cũng về kho đề, và thêm liên kết "Về kho đề" gạch chân (3 đường về một chỗ) |
| Phần khảo thí mất thanh dọc | `teacher/layout.tsx` chỉ dựng thanh ngang | Mất ngữ cảnh khi chuyển từ kho đề sang lớp học/bài giao |
| Thùng rác thiếu nút xóa | Cố ý chưa làm: báo cáo Codex ghi cần quy tắc cho đề đã giao. Bài giao tham chiếu đề **không có xóa theo tầng** (khóa ngoại chặn), nên xóa cứng đề đã giao sẽ lỗi | Quy tắc chốt ở mục 2 |
| Trang soạn khác phong cách | Hàng nút phụ dùng liên kết gạch chân (`class="underline"`) của kiểu cũ; thanh trạng thái lưu cũng vậy; mỗi nơi tự vẽ nút | |
| Sửa đi sửa lại vẫn lộ lỗi mới | Trong `src/**/*.tsx` có **3.754 mã màu viết cứng** (`#202124`, `dark:bg-[#292a2d]`…) so với chỉ **167** chỗ dùng biến màu chung (`var(--ui-*)`). Chủ đề đơn sắc chỉ đổi giá trị ở một số chỗ, phần lớn component vẫn tự quyết màu, cỡ chữ, bo góc | Gốc rễ của việc "mỗi lần sửa một màn lại lệch màn khác" |

Các màn có mã màu viết cứng nhiều nhất (đếm 27/10): `teacher/assignments/[id]` 379, `a/[publicId]` (học sinh) 354, `TeacherDashboard` 302, `QuestionCard` 275, `admin/users` 249, `ShareModal` 239, `teacher/groups` 234, `ImportModal` 225.

## 2. Hướng thiết kế đã chốt cho khu giáo viên

1. **Một đích đến chỉ xuất hiện một lần trên một màn hình.** Danh sách đích đến nằm ở một chỗ duy nhất (`TeacherNavigation.tsx`): Kho đề, Ngân hàng câu hỏi, Lớp học, Bài đã giao, Thùng rác.
2. **Màn rộng (từ 1024 px): thanh dọc bên trái trên mọi trang giáo viên** (kho đề, ngân hàng, lớp học, bài đã giao). Trong kho đề, thanh dọc còn có bộ lọc (Đề quan trọng, Đã sửa gần đây) dưới mục "Kho đề" và cây thư mục. **Điện thoại: một hàng tab**, không có hai menu cùng lúc.
3. **Bàn soạn giữ bố cục riêng** (thanh công cụ trái, phải) vì là việc khác với quản lý; nhưng dùng **cùng nút, cùng màu, cùng cách đi về kho đề** như phần còn lại.
4. **Vòng đời xóa đề:** chuyển vào thùng rác (có xác nhận, khôi phục được) → **Xóa vĩnh viễn** trong thùng rác (có xác nhận riêng, không khôi phục được). Quy tắc máy chủ: chỉ chủ đề; chỉ đề đang ở thùng rác; **chặn nếu đề đã giao cho học sinh** (giữ lịch sử bài làm, hiển thị lý do); câu hỏi đã lưu trong ngân hàng **không bị xóa theo**; có ghi nhật ký `exam.purge`. Nút "Dọn thùng rác" xóa các đề đang hiển thị, bỏ qua đề đã giao.
5. **Nguyên tắc nhập thêm:** không thêm màu viết cứng mới; dùng `var(--ui-…)` và `app-button-primary / secondary / tonal`.

## 3. Đã làm trong đợt này

- Thanh dọc dùng chung cho `/` và `/teacher/*` (`TeacherSidebar`); thanh ngang chỉ còn ở điện thoại. Gỡ các đường dẫn lặp trong thân kho đề.
- Thùng rác: nút **Xóa vĩnh viễn** (thẻ và bảng) và **Dọn thùng rác**; máy chủ `DELETE /api/exams/{id}?permanent=1` với các quy tắc trên.
- Trang soạn: bỏ liên kết "Về kho đề" trùng (nút "Kho đề" ở thanh đầu giữ tên truy cập "Về kho đề"); các nút gạch chân đổi sang nút chung; bỏ chữ "như Google Docs" trong chú thích tên đề.
- Công cụ chặn lùi: `node scripts/check-ui-tokens.cjs` (mốc 3.754 mã màu, tệp nào chỉ được **giảm**, không được tăng).
- Test: `tests/http_exam_purge.test.ts` (quy tắc xóa vĩnh viễn trên máy chủ), kiểm giao diện trong `tests_pilot/teacher.test.ts`, chỉnh `pilot.test.ts` theo menu mới.

## 4. Chưa làm (nợ còn lại, theo thứ tự nên làm)

1. **Quản trị** (`AdminShell`) vẫn dùng thanh ngang riêng; nên cùng khung dọc với giáo viên (có thể cùng `TeacherSidebar` với nhóm mục khác).
2. **Chuyển mã màu viết cứng sang biến chung**, từng màn một, theo thứ tự ở mục 1. Mỗi màn xong thì chạy `check-ui-tokens.cjs --write` để khóa kết quả. Đây là việc lớn nhất, và là cách duy nhất để ngừng tình trạng lệch phong cách.
3. **Trang học sinh** (`/a/…`), trang chia sẻ (`/share/…`), đăng nhập: cũng nhiều mã màu viết cứng, nhưng khác nhiệm vụ nên làm sau.
4. **Bàn soạn:** `LeftNavigationRail`, `RightCompanionRail`, `Header` còn nhiều mã màu cũ và nhãn kiểu cũ; cần xem trên trình duyệt thật từng bảng.
5. **Phân trang "Dọn thùng rác":** chỉ xử lý các đề đang hiển thị (một trang); thùng rác nhiều đề phải bấm nhiều lần.

## 5. Cách kiểm

- Mở kho đề, lớp học, bài đã giao, ngân hàng ở màn rộng: mỗi trang có **một** menu dọc, không có hàng tab ngang; thu nhỏ dưới 1024 px: menu dọc biến mất, còn **một** hàng tab.
- Thùng rác: có **Khôi phục** và **Xóa vĩnh viễn** trên từng đề; hủy xác nhận thì đề còn; đề đã giao hiện lý do và vẫn ở thùng rác.
- Trang soạn: hàng nút dưới thanh đầu là nút, không còn chữ gạch chân; chỉ một đường về kho đề ở thanh đầu.
