# UI Google — sửa cuộn, theme và nút dùng chung

Bắt đầu 26/10, hoàn tất kiểm 27/10/2026 (Asia/Bangkok). Yêu cầu trực tiếp của chủ dự án: phong cách Google/Firebase, nút thống nhất, sửa admin không cuộn và thanh/viền sáng bất thường, rà các trang tương tự. Không phải đợt tổng nghiệm thu bản test 11.

## Đã sửa
- Bỏ khóa overflow:hidden và chiều cao cố định ở body/root layout. Các trang dài (admin, lớp, bài giao, bài làm/link công khai) được cuộn theo tài liệu. Kho đề và bàn soạn vẫn giữ vùng cuộn riêng; dùng dynamic viewport và chiều rộng 100%.
- Border mặc định Tailwind 4 kế thừa currentColor, khiến các khung không khai báo màu viền có viền gần trắng khi tối. Đặt màu outline theo theme trong base layer; utility cảnh báo/lỗi vẫn được ưu tiên.
- Màu vai trò dùng chung cho nút chính: sáng #1a73e8/chữ trắng; tối #8ab4f8/chữ #062e6f. Chuyển các nút chính đang dùng màu xanh Tailwind và màu hard-code sang app-button-primary (bo tròn, hover/focus, trạng thái disabled). Phân biệt nút/nhãn trạng thái, giữ cảnh báo và hành động nguy hiểm.
- Thanh trên dùng surface theo theme, admin bỏ nền bán trong suốt. Native form/select/scrollbar dùng color-scheme phù hợp.
- Khung nháp dùng surface/outline chung, có khoảng cách trước ba thẻ tác vụ. Ba thẻ tạo/AI/nhập dùng cùng viền và biểu tượng, bỏ animation trang trí; nút Thư ký bên phải dùng nền tonal.
- Admin users/AI: thanh công cụ xuống hàng trên màn hình hẹp; hộp thoại tài khoản có chiều cao tối đa và cuộn trong hộp. Kho đề 375px: rút nhãn phụ và padding icon để avatar không bị cắt.

Tham khảo vai trò màu Google Material: https://m3.material.io/styles/color/the-color-system và https://developer.android.com/develop/ui/compose/designsystems/material3 . Dùng font hệ thống sẵn có, không tải thêm thư viện/font.

## Xác minh
- Next guide cục bộ về CSS đã đọc trước khi sửa. TypeScript exit 0; lint exit 0, 0 lỗi, 156 cảnh báo còn có sẵn. Log typecheck.log / lint.log.
- Bản build cuối exit 0; CPU1, heap1024. Log build-verified.log. Build ID alVDXNvzM6tDh61UdkHQY. Các build trước trong thư mục này là mốc giữa khi kiểm phát hiện thêm tràn ngang.
- Chrome cài sẵn, DB test chính xác examcraft_test_20261022, health isolatedTest=true; không AI thật. F15 (đề 60 câu in A4, không tràn/câu quá trang) PASS. F2 (7 dạng, hình/ngữ liệu, điểm0, lưu/mở lại) FAIL lượt đầu do thông báo xung đột và DB chưa thấy Q7; lượt chạy lại cùng mã/build PASS. Không sửa hoặc giảm assertion. Không coi lần chạy lại là xóa lỗi lần đầu: cần theo dõi race lưu riêng nếu lặp lại. Log pilot-F2.log, pilot-F2-repeat.log, pilot-F15.log; ảnh F2-first-failure.png.
- Kiểm giao diện thực qua IAB trên server thử: dashboard sáng/tối; admin users sáng/tối, admin AI/keys; lớp/bài giao; bàn soạn. browser-evidence.json ghi số đo DOM và computed style, không đọc secret hoặc state nội bộ.
- Admin users thực sự cuộn đến cuối bảng: scrollY1120.8/max1121, header sticky vẫn top0. admin-scroll-final.png.
- 375x667: admin users/AI/keys, lớp/bài giao và bàn soạn không tràn ngang tài liệu; bảng rộng admin cuộn trong khung. Header kho đề scrollWidth=clientWidth=375, không khuất nút. Hộp tạo giáo viên nằm trong viewport (top109/bottom558), overflow:auto; không tạo tài khoản từ hộp.
- Tối: header/surface rgb(30,30,30), border rgb(60,64,67); sáng: surface trắng, border rgb(218,220,224). Giấy A4 vẫn trắng. Viewport đã reset.
- git diff --check đạt (chỉ cảnh báo chuẩn hóa CRLF của lock).

## Dữ liệu, giới hạn và bàn giao
Chỉ chỉnh giao diện/CSS/className, không đổi API/schema/nghiệp vụ/quyền. Dùng tài khoản giả riêng của đợt trước trong DB thử; có tạo đề trống TEST-UI-Google-27 trong DB thử để xem editor. Không đặt lại tài khoản, không sửa đề thật, không đọc/in key/cookie/.env hoặc backup. Server dùng script sẵn có tự nạp cấu hình; không xuất giá trị cấu hình. Không provider thật, không push.
Không chạy lại toàn bộ CI/HTTP/SAFE vì đợt này chỉ đổi trình bày; các kiểm hồi quy liên quan được nêu riêng ở trên. Chưa kiểm mọi hộp thoại/mọi tổ hợp dữ liệu, thiết bị thật, Word/in giấy. Không tự đóng CV028/029/076 hoặc tổng nghiệm thu. Báo Claude kết quả giao diện và lỗi lưu F2 cần theo dõi.
Lượt kiểm theo bản bàn giao11 trước đã bị thay bằng yêu cầu sửa UI mới; không báo bộ đó đã hoàn tất. Các tệp qa25/pilot-results và ảnh lỗi là đầu ra tự sinh của runner, giữ nguyên và không lấy làm tiến độ tổng.

Đã dừng đúng server thử và trả LOCK_3117 về FREE sau khi kiểm; không để tiến trình thử chiếm cổng.
