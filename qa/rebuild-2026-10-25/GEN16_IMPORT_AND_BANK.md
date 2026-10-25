# CDX-S1/S2/S5 — Nhập đề và ngân hàng

S1: thẻ preview có nút Sửa, nội dung/phương án/đáp án MC, đáp án chữ ngắn và Đ/S từng ý. Chỉnh sửa tại preview, chưa ghi DB trước khi thêm vào đề và lưu. Câu thiếu đáp án có nhãn riêng; không tự giải hay gắn verified. Các dạng khác giữ dữ liệu cấu trúc cũ, đây không là editor đầy đủ.

S2: source từng câu giữ giá trị đã có; nếu thiếu thêm loại nguồn, tên tệp khi có, thứ tự trong tài liệu. Không suy trang. Áp dụng cho adapter AI Word/text/ảnh và fallback text/EX_Test tại ImportModal. Marker importedFromFile đi trong tài liệu/editor payload, mapper chọn IMPORTED_FILE và mặc định shareable false; API tạo câu nhập buộc PRIVATE/false. Giáo viên có nút cho/ngừng nhân bản trong kho riêng, PATCH có kiểm owner/CAS; bật nhân bản không tự công bố câu. Không thêm dedup hoặc migration.

S5: remount trạng thái kho theo owner/isOpen, loading khởi tạo true; đổi tab đặt loading tại handler. Kết quả tải cũ bị bỏ khi effect hết hiệu lực. Không setState đồng bộ trong effect. F19 đã kiểm lại đạt.

Bằng chứng: s2-unit.log, s2-s4-http-debug.log (kiểm server dev cô lập), ci-full-run2.log và các lượt F20/F19 sẽ được chốt trong CODEX_GEN16_HANDOFF.md. Lượt F20 trên dev dừng ở chờ load điều hướng sau login, chưa tới bước nhập; không tính là nghiệm thu. Chỉ runtime production cuối được dùng nghiệm thu.

## Kiểm thực tế trước CI cuối
F20 ba lượt liên tiếp, F19, F21, F22 và F23 đã đạt trên server production cô lập (gen16-browser-evidence.json). HTTP sau đổi cách ghi báo cáo đạt 101/101 (gen16-http-atomic.log). CI cuối đã đạt TypeScript/lint/SAFE/build/HTTP/browser; SAFE 441/441, HTTP 101/101, browser 22/22. Server3117 và mock3118 đã dừng; xem ci-full-run2.log.
