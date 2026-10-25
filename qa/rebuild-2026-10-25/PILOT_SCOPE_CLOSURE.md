# CDX-Q3 — giới hạn pilot, generation14

Chỉ bằng chứng gửi Claude duyệt; không đổi dấu CV hoặc hồ sơ02. Không coi kiểm local là kiểm nhiều máy thật. Mỗi mục có commit riêng khi thêm kiểm/sửa.

| CV | Giới hạn đã đọc | Đã xử lý / còn lại | Tên ca và bằng chứng |
|---|---|---|---|
| 054 | Sửa sau giao; PIN mới kiểm HTTP | Đã sửa câu nguồn qua UI sau khi giao cho lớp/công khai, lưu thật và so snapshot hai bài không đổi. Cấu hình PIN trong hộp giao bài; PIN sai không tạo lượt, PIN đúng mở bài gốc. Chưa giao diện thay thời hạn sau giao | `F5 assign link with and without class and inspect frozen policies`, q3-cv054-f5.log đạt; chỉ DB thử |
| 056 | Start đồng thời nhiều máy; dung sai nộp trên UI | Đã kiểm80start tranh lần đầu cho40học sinh: mỗi cặp một200/một403 đúng quyền, đúng40lượt;80resume đồng thời cùngcookie giữ ID. Không lỗi5xx; dung sai UI và nhiều máy vật lý còn mở | `LOAD_START_RACE=1 node --import tsx scripts/load-class.cjs`; q3-cv056-start-race-full.log và load-class JSON |
| 058 | Bàn phím/màn hình nhỏ; âm thanh/hình nâng cao | Đang xử lý; phần375px sẽ dùng F13 của Q5, không tự ghi đạt | Chưa có kết quả mới |
| 061 | Gia hạn/mở lại; chính sách nhận xét | Đang xử lý; API gia hạn thay cấu hình không tự kéo dài deadline lượt đã mở | Chưa có kết quả mới |
| 023 | Toàn tiêu chí biên tập bảy dạng | Q1 đã bổ sung kiểm ACK giữa nhập và F2 lặp; cần đối chiếu phần còn lại | Q1_EDITOR_ACK.md, không suy đóng CV |
| 024 | Word/PDF trực quan | Word hai cột có mã/ZIP kiểm trước; chuyển đề dài và PDF sang Q7; Word thật vẫn cần người mở | Chưa có kết quả mới Q3 |
| 026 | Hình nâng cao/công thức/tệp thiếu | Chờ đối chiếu fixture đa môn và Q7/Q8; chưa tự chứng nhận trực quan | Chưa có kết quả mới |
| 027 | Mẫu cá nhân, Word dài | Tạo mẫu đã có trong F2; kiểm xuất dài/tiêu đề sẽ đối chiếu ở Q7 | Chưa có kết quả mới Q3 |
| 043 | Mở Word kiểm phân trang/công thức | Kiểm ZIP/XML chưa thay mở Word; Q7 bổ sung đề60câu, việc mở Word thật cần thẻ kiểm/người dùng | Chưa có kết quả mới Q3 |
| 042 | Seed/nhóm ngữ liệu qua UI/mọi tổ hợp | Chờ bổ sung; không suy từ việc tải được bốn mã là đủ tiêu chí | Chưa có kết quả mới |

Giữ các mục chờ mở. Không ghi tên ca tự đặt như bằng chứng đã chạy; tên ở bảng được chép từ mã test thật.

CV056: lượt kiểm đầy đủ360request;40phản hồi403 ở pha start là kỳ vọng do thiếu cookie của trình khách thắng, không phải lỗi5xx. Header retry không có trên phản hồi từ chối, nên pha start ghi null; các pha thành công quan sát0retry. Cleanup đạt, không test trên nhiều máy vật lý.
