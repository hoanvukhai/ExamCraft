# PHIẾU CÂU HỎI THAM VẤN CHỦ DỰ ÁN VỀ CÁC HẠNG MỤC CÔNG VIỆC CHƯA TÍCH
*Tài liệu tổng hợp câu hỏi quyết định thiết kế và lộ trình triển khai — Dự án ExamCraft*
*Căn cứ danh mục 58 mục chưa tích trong: docs/ke-hoach-2026-10-21/03_CHECKLIST.md*

- **Người thực hiện:** Gemini (QA & Phân tích chiến lược)
- **Nhiệm vụ:** GEM-R8 (P2, Generation 10)
- **Thời điểm lập (UTC):** 2026-10-25T11:00:00Z
- **Hướng dẫn dành cho Chủ dự án:** Mỗi câu hỏi đã được cô đọng đúng 1 dòng với hai phương án [A] và [B] cùng đề xuất mặc định của đội ngũ kỹ thuật. Chủ dự án có thể trả lời nhanh toàn bộ trong vòng 10 phút bằng cách xác nhận đồng ý với đề xuất hoặc điều chỉnh chữ cái lựa chọn.

---

## PHẦN I. CÁC HẠNG MỤC NGHIỆP VỤ VÀ NỀN TẢNG (50 CÔNG VIỆC)

### Nhóm 1. Kiến trúc cơ sở và Dữ liệu (CV-004 đến CV-015)
1. **CV-004 (Mẫu luồng & danh mục môn):** [A] Khóa cố định 6 môn thí điểm GDPT 2018 (Toán, Văn, Anh, KHTN, Sử-Địa, Tin) cho đợt Pilot; hay [B] Mở rộng danh mục toàn bộ môn học cấp THCS/THPT ngay? *(Khuyến nghị: [A] để tối ưu hóa phạm vi kiểm thử).*
2. **CV-005 (Thử nghiệm cộng tác đồng thời):** [A] Sử dụng cơ chế khóa phiên bản CAS (người lưu sau nhận cảnh báo 409 và giữ nháp riêng); hay [B] Đầu tư tích hợp thuật toán ghép từng ký tự thời gian thực (OT/CRDT)? *(Khuyến nghị: [A] an toàn và đủ dùng cho trường học).*
3. **CV-006 (Bộ đề mẫu tái lập lỗi):** [A] Sử dụng bộ 6 đề mẫu đa môn trong qa/ai-review/fixtures/da-mon/ làm chuẩn nghiệm thu; hay [B] Chờ thu thập thêm đề thi thực tế từ trường học? *(Khuyến nghị: [A] để tự động hóa test ngay).*
4. **CV-007 (Chốt hợp đồng mô hình dữ liệu):** [A] Chốt cấu trúc dữ liệu JSON hiện tại (hỗ trợ 7 dạng câu và ngữ liệu chung); hay [B] Mở rộng thêm trường cho đề thi chuyên biệt? *(Khuyến nghị: [A]).*
5. **CV-014 (Thử nghiệm chuyển đổi dữ liệu an toàn):** [A] Chỉ hỗ trợ nhập tệp JSON ExamCraft và gói ZIP chuẩn trong Pilot; hay [B] Phát triển bộ chuyển đổi cho toàn bộ các định dạng phần mềm cũ trên thị trường? *(Khuyến nghị: [A]).*
6. **CV-015 (Hợp nhất kho đề cá nhân và máy chủ):** [A] Đồng bộ tự động danh sách đề của chính giáo viên khi có mạng và giữ bản sao cục bộ; hay [B] Bắt buộc giáo viên phải bấm nút đồng bộ thủ công từng đề? *(Khuyến nghị: [A]).*

---

### Nhóm 2. Khung chương trình giáo dục và Ma trận đề (CV-016 đến CV-022)
7. **CV-016 (Định danh môn học và gói chuẩn):** [A] Cố định mã môn học theo quy chuẩn Bộ Giáo dục (TOAN, NGU_VAN, TIENG_ANH...); hay [B] Cho phép giáo viên tự đặt tên môn tùy ý? *(Khuyến nghị: [A] để đảm bảo chuẩn hóa).*
8. **CV-017 (Cây kiến thức và chuẩn đầu ra):** [A] Cung cấp khung mục lục chuẩn lớp 6 và lớp 7 theo 3 bộ sách lớn; hay [B] Để giáo viên tự gõ tự do tên bài học khi tạo ma trận? *(Khuyến nghị: [A]).*
9. **CV-018 (Phạm vi kiến thức giới hạn):** [A] Giáo viên tự tích chọn các bài cần kiểm tra trên cây mục lục; hay [B] Bắt buộc phải qua trợ lý đối thoại gợi ý? *(Khuyến nghị: [A] trực quan và chủ động).*
10. **CV-019 (Khung nhận thức 4 mức độ):** [A] Giữ cố định 4 mức độ (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) theo Thông tư 22; hay [B] Cho phép trường tự định nghĩa thang mức độ riêng? *(Khuyến nghị: [A]).*
11. **CV-020 (Bản đặc tả và phân bổ điểm số):** [A] Hệ thống tự động làm tròn điểm đến 0.25 hoặc 0.1 và cảnh báo khi tổng điểm lệch 10.0; hay [B] Cho phép tổng điểm bất kỳ không bắt buộc 10.0? *(Khuyến nghị: [A]).*
12. **CV-021 (Mẫu đề chuẩn và bản sao cá nhân):** [A] Đề mẫu hệ thống khi giáo viên mở ra sẽ tự động nhân bản thành đề cá nhân riêng biệt; hay [B] Cho phép sửa trực tiếp đề mẫu chung? *(Khuyến nghị: [A] để bảo toàn mẫu gốc).*
13. **CV-022 (Chuẩn bị dữ liệu đa môn ngoài môn Toán):** [A] Sử dụng bộ dữ liệu 6 môn đã chuẩn bị sẵn để giáo viên kiểm thử ngay; hay [B] Chờ từng tổ chuyên môn nộp dữ liệu thực tế? *(Khuyến nghị: [A]).*

---

### Nhóm 3. Trải nghiệm soạn thảo và Trình bày đề thi (CV-023 đến CV-030)
14. **CV-023 (Soạn thảo đủ 7 dạng câu hỏi):** [A] Tích hợp đầy đủ thanh công cụ cho 7 dạng câu hỏi trên giao diện web; hay [B] Chỉ cho soạn trắc nghiệm đơn và tự luận trước? *(Khuyến nghị: [A] vì mã nguồn đã hỗ trợ).*
15. **CV-024 (Quản lý đáp án và lời giải chi tiết):** [A] Bắt buộc nhập lời giải chi tiết cho mọi câu hỏi; hay [B] Cho phép để trống phần lời giải khi giáo viên cần tạo đề gấp? *(Khuyến nghị: [B] để giảm tải cho giáo viên).*
16. **CV-025 (Lịch sử chỉnh sửa câu hỏi):** [A] Lưu vết lịch sử 5 phiên bản gần nhất của câu hỏi để hoàn tác khi cần; hay [B] Tạm thời chỉ lưu phiên bản hiện tại để tiết kiệm dung lượng cơ sở dữ liệu? *(Khuyến nghị: [A]).*
17. **CV-026 (Hình ảnh, công thức toán và bảng biểu):** [A] Hỗ trợ dán ảnh trực tiếp từ bộ nhớ tạm và gõ LaTeX toán học; hay [B] Chỉ hỗ trợ tải ảnh tệp tin rời? *(Khuyến nghị: [A] thuận tiện tối đa).*
18. **CV-027 (Tùy biến tiêu đề và khung đề thi):** [A] Cung cấp 3 mẫu khung tiêu đề chuẩn trường học Việt Nam (UBND Quận/Huyện, Tên trường, Tên bài thi); hay [B] Để khung văn bản tự do hoàn toàn? *(Khuyến nghị: [A]).*
19. **CV-028 (Điều hướng danh sách câu hỏi nhanh):** [A] Cung cấp bản đồ câu hỏi bên cạnh để bấm nhảy nhanh đến câu cần sửa; hay [B] Chỉ cuộn chuột dọc theo trang? *(Khuyến nghị: [A] rất cần cho đề dài).*
20. **CV-029 (Soạn đề không phụ thuộc AI và tương thích di động):** [A] Đảm bảo 100% chức năng soạn thảo hoạt động hoàn hảo khi tắt hoàn toàn tính năng AI; hay [B] Bắt buộc phải có cấu hình AI mới kích hoạt biên soạn? *(Khuyến nghị: [A] bắt buộc cho bảo mật).*
21. **CV-030 (Khóa đề thi khi đã công bố giao bài):** [A] Tự động đóng băng đề thi gốc khi đã tạo bài giao (muốn sửa phải tạo bản sao mới); hay [B] Cho phép sửa thoải mái đề gốc khi học sinh đang làm? *(Khuyến nghị: [A] để chống gian lận và sai lệch điểm).*

---

### Nhóm 4. Quản trị khóa AI tự túc - BYOK (CV-031 đến CV-033)
22. **CV-031 (Thống nhất khóa BYOK mọi điểm cuối):** [A] Áp dụng chính sách mã hóa khóa AI bằng khóa máy chủ và lưu riêng cho từng tài khoản; hay [B] Yêu cầu giáo viên nhập lại khóa mỗi lần mở trình duyệt? *(Khuyến nghị: [A]).*
23. **CV-032 (Minh bạch chi phí và hạn mức sử dụng khóa):** [A] Hiển thị ước tính số token và số tiền tiêu tốn sau mỗi yêu cầu sinh câu hỏi; hay [B] Ẩn thông số token để giao diện đỡ rối? *(Khuyến nghị: [A] giúp giáo viên kiểm soát ngân sách).*
24. **CV-033 (Hạn mức tần suất và xử lý tác vụ nền):** [A] Giới hạn tối đa 5 yêu cầu gọi AI mỗi phút trên một tài khoản để tránh tràn quota; hay [B] Không đặt giới hạn tần suất? *(Khuyến nghị: [A] phòng tránh treo máy).*

---

### Nhóm 5. Xuất bản, Định dạng in ấn và Xuất tệp (CV-039 đến CV-046)
25. **CV-039 (Nhập văn bản thô / LaTeX tự động nhận diện):** [A] Tự động phân tích đoạn văn bản dán vào thành các câu hỏi; hay [B] Bắt buộc giáo viên nhập từng trường câu hỏi qua form? *(Khuyến nghị: [A] tiện dụng, có kiểm duyệt).*
26. **CV-040 (Nhập đề từ tệp Word có sẵn):** [A] Hỗ trợ nhập tệp docx theo mẫu cấu trúc định sẵn chuẩn hóa; hay [B] Tạm hoãn tính năng đọc Word phức tạp sang phiên bản 2? *(Khuyến nghị: [A] với phạm vi mẫu chuẩn).*
27. **CV-041 (Quản lý nguồn gốc câu hỏi trích dẫn):** [A] Lưu vết nguồn câu hỏi (Trích đề thi học kỳ trường nào, năm nào); hay [B] Không cần lưu thông tin nguồn? *(Khuyến nghị: [A] phục vụ lưu trữ sư phạm).*
28. **CV-042 (Thuật toán trộn câu hỏi và đảo phương án):** [A] Hỗ trợ tạo 4 mã đề hoán vị phương án nhưng giữ nguyên nhóm câu hỏi đọc hiểu đi kèm ngữ liệu; hay [B] Đảo ngẫu nhiên toàn bộ bất kể ngữ liệu? *(Khuyến nghị: [A] bắt buộc đúng nghiệp vụ).*
29. **CV-043 (Xuất tệp Word chuẩn phông và công thức):** [A] Xuất tệp docx chuẩn Office Math hiển thị đẹp trên mọi bản Microsoft Word; hay [B] Chỉ xuất bản HTML/PDF? *(Khuyến nghị: [A] giáo viên Việt Nam luôn cần file Word).*
30. **CV-044 (Xuất bản in khổ giấy A4 và tệp PDF):** [A] Cung cấp bản xem trước A4 trực tiếp trên trình duyệt căn lề chuẩn 2cm để bấm in ngay; hay [B] Yêu cầu xuất sang Word rồi mới in? *(Khuyến nghị: [A]).*
31. **CV-045 (Chế độ trình chiếu chữa bài trên lớp):** [A] Tích hợp chế độ phóng to từng câu hỏi toàn màn hình kèm đáp án để giáo viên giảng bài trên máy chiếu; hay [B] Để phiên bản sau? *(Khuyến nghị: [A] tăng sức hút thực tế).*
32. **CV-046 (Bộ fixture kiểm tra nhập xuất đa môn):** [A] Khóa bộ kiểm tra tự động nhập xuất với 6 đề thi chuẩn trong tests/fixture_da_mon.test.ts; hay [B] Bổ sung thêm đề tiếng nước ngoài? *(Khuyến nghị: [A]).*

---

### Nhóm 6. Đồng nghiệp cộng tác và Chia sẻ kho đề (CV-051 và CV-052)
33. **CV-051 (Góp ý nhận xét và lịch sử biên tập của đồng nghiệp):** [A] Cho phép đồng nghiệp để lại bình luận nhận xét trên từng câu hỏi mà không làm đổi đề; hay [B] Chỉ phân quyền sửa trực tiếp hoặc chỉ xem? *(Khuyến nghị: [A]).*
34. **CV-052 (Chia sẻ đề lên Thư viện trường và nhân bản):** [A] Giáo viên chỉ được xem và bấm tạo bản sao vào kho riêng, không được sửa đè đề của đồng nghiệp; hay [B] Cho phép sửa chung? *(Khuyến nghị: [A] bảo vệ dữ liệu).*

---

### Nhóm 7. Quản lý phòng thi và Chấm điểm trực tuyến (CV-054 đến CV-061)
35. **CV-054 (Cấu hình bài giao và bản sao bất biến):** [A] Khi bấm giao bài, tạo ngay bản chụp bất biến không chịu ảnh hưởng bởi các chỉnh sửa đề sau đó; hay [B] Bài thi học sinh liên kết động với đề gốc? *(Khuyến nghị: [A] bắt buộc để công bằng).*
36. **CV-056 (Cạnh tranh thời gian và giới hạn lượt làm bài):** [A] Khóa chặt bài thi ngay khi hết giờ làm bài bất kể học sinh đã bấm nộp hay chưa; hay [B] Cho phép nộp trễ và ghi nhận số phút nộp muộn? *(Khuyến nghị: [A]).*
37. **CV-058 (Giao diện làm bài thi trên di động tối ưu cho học sinh):** [A] Bố trí thanh chọn nhanh câu hỏi cố định phía dưới màn hình và cảnh báo câu chưa làm; hay [B] Dạng danh sách cuộn tự do không có thanh điều hướng? *(Khuyến nghị: [A]).*
38. **CV-061 (Bảng điểm tự động và xuất tệp bảng tính Excel):** [A] Tự động tính điểm ngay khi nộp bài và hỗ trợ xuất bảng điểm lớp kèm câu đúng/sai ra định dạng CSV/Excel; hay [B] Chỉ hiện điểm số không xuất bảng? *(Khuyến nghị: [A]).*

---

### Nhóm 8. Bộ nhớ sư phạm và Dữ liệu cá nhân (CV-063 đến CV-069)
39. **CV-063 (Phân tích ma trận độ khó thực tế của đề):** [A] Thống kê tỷ lệ phần trăm số học sinh làm sai theo từng câu hỏi để chỉ ra câu bẫy; hay [B] Chỉ hiển thị điểm trung bình của cả lớp? *(Khuyến nghị: [A] rất giá trị cho giáo viên).*
40. **CV-064 (Bộ nhớ phong cách biên soạn riêng của giáo viên):** [A] Lưu thói quen phân bổ điểm số và các từ khóa hay dùng của giáo viên vào hồ sơ máy cục bộ; hay [B] Không lưu vết thói quen? *(Khuyến nghị: [A]).*
41. **CV-065 (Đóng góp câu hỏi hay vào ngân hàng trường):** [A] Giáo viên chủ động bấm nút gửi câu hỏi vào kho trường và cần tổ trưởng phê duyệt; hay [B] Tự động chia sẻ toàn bộ câu hỏi khi tạo? *(Khuyến nghị: [A] bảo đảm chất lượng).*
42. **CV-066 (Vòng đời và cập nhật đề thi theo năm học):** [A] Cho phép lưu trữ và gắn nhãn đề thi theo năm học (ví dụ: 2025-2026) để dễ tra cứu; hay [B] Để chung một danh sách phẳng? *(Khuyến nghị: [A]).*
43. **CV-069 (Xuất toàn bộ dữ liệu cá nhân khi chuyển công tác):** [A] Cung cấp nút bấm đóng gói toàn bộ kho đề của giáo viên thành 1 tệp tin duy nhất tải về máy tính; hay [B] Bắt buộc xuất từng đề lẻ tẻ? *(Khuyến nghị: [A]).*

---

### Nhóm 9. Vận hành, Hướng dẫn và Nghiệm thu phát hành (CV-070 đến CV-078)
44. **CV-070 (Hoàn thiện bộ học liệu nguồn cho 6 môn):** [A] Khóa phạm vi học liệu thí điểm theo đúng tài liệu nghiên cứu đã duyệt; hay [B] Tiếp tục bổ sung thêm sách giáo khoa mới? *(Khuyến nghị: [A] để ổn định dữ liệu).*
45. **CV-071 (Quy trình thử nghiệm có phê duyệt chuyên môn):** [A] Thực hiện thẩm định nội dung với 6 giáo viên thật theo kế hoạch tài liệu 05; hay [B] Bỏ qua bước thẩm định bên ngoài để đẩy nhanh tiến độ? *(Khuyến nghị: [A] bắt buộc cho tính pháp lý).*
46. **CV-074 (Giám sát tải và tự động hóa kiểm thử):** [A] Thiết lập bộ kiểm thử tự động chạy trước mỗi đợt phát hành; hay [B] Kiểm thử thủ công từng màn hình? *(Khuyến nghị: [A]).*
47. **CV-075 (Tùy chọn sao lưu Google Drive):** [A] Giữ ở mức tài liệu thiết kế sơ bộ (chưa lập trình mã nguồn trong đợt Pilot); hay [B] Yêu cầu lập trình hoàn thiện ngay? *(Khuyến nghị: [A] như chỉ đạo của Claude).*
48. **CV-076 (Bộ tài liệu hướng dẫn giáo viên và kịch bản sự cố):** [A] Đưa vào sử dụng ngay bộ tài liệu hướng dẫn đầy đủ và kịch bản diễn tập sự cố; hay [B] Chờ giáo viên phản ánh rồi mới viết bổ sung? *(Khuyến nghị: [A]).*
49. **CV-077 (Dọn dẹp mã nguồn cũ và chuẩn hóa tài liệu):** [A] Áp dụng phương án dọn dẹp cây tài liệu docs và qa theo đề xuất tài liệu GEM-R6; hay [B] Giữ nguyên hiện trạng các thư mục phân mảnh? *(Khuyến nghị: [A]).*
50. **CV-078 (Tổng nghiệm thu dự án và quyết định phát hành):** [A] Tổ chức nghiệm thu tổng thể dựa trên 8 tiêu chí cốt lõi của đợt Pilot trước khi triển khai diện rộng; hay [B] Phát hành từng phần nhỏ lẻ? *(Khuyến nghị: [A]).*

---

## PHẦN II. CÁC HẠNG MỤC CHỜ CHO PHÉP GỌI AI THẬT (8 CÔNG VIỆC)

*Nhóm công việc này chỉ được thực hiện khi Chủ dự án cấp khóa API chính thức và cho phép kết nối máy chủ trí tuệ nhân tạo bên ngoài.*

51. **CV-034 (Sinh câu hỏi theo ma trận và phạm vi yêu cầu):** [A] Khi chưa gọi AI thật: Dùng bộ câu hỏi sinh sẵn từ ngân hàng đề mẫu; hay [B] Tạm thời ẩn nút sinh tự động bằng AI? *(Khuyến nghị: [A] để giáo viên vẫn trải nghiệm được luồng).*
52. **CV-035 (Trợ lý AI chỉnh sửa đoạn văn bản chọn lọc):** [A] Tạm hoãn tính năng AI viết lại câu văn cho đến khi có khóa chính thức; hay [B] Dùng mô hình mẫu cố định cục bộ? *(Khuyến nghị: [A]).*
53. **CV-036 (Bộ kiểm tra cấu trúc câu hỏi do AI tạo ra):** [A] Giữ bộ kiểm tra xác thực Zod nghiêm ngặt để khi bật AI thật sẽ tự động bắt lỗi cú pháp; hay [B] Giảm bớt tiêu chí xác thực? *(Khuyến nghị: [A]).*
54. **CV-037 (Kiểm định nội dung kiến thức chuyên môn theo môn học):** [A] Đặt cờ cảnh báo đối với mọi câu hỏi do AI sinh ra yêu cầu giáo viên kiểm tra trước khi dùng; hay [B] Tin tưởng hoàn toàn kết quả AI? *(Khuyến nghị: [A] nguyên tắc đạo đức nghề nghiệp).*
55. **CV-038 (Lưu vết kiểm toán các câu hỏi có sự trợ giúp của AI):** [A] Gắn nhãn hiển thị rõ ràng câu hỏi được hỗ trợ bởi AI và tên mô hình sử dụng; hay [B] Không hiển thị nguồn gốc AI? *(Khuyến nghị: [A] bảo đảm minh bạch).*
56. **CV-053 (Trợ lý AI trong phiên làm việc cộng tác giữa các giáo viên):** [A] Chỉ cho phép chủ sở hữu đề thi kích hoạt trợ lý AI; hay [B] Cho phép cả người xem đề kích hoạt gọi AI? *(Khuyến nghị: [A] để kiểm soát chi phí token).*
57. **CV-067 (Trợ lý tra cứu và gợi ý kiến thức trong phạm vi phân quyền):** [A] Trợ lý AI chỉ được tra cứu trong phạm vi ngân hàng câu hỏi mà giáo viên có quyền truy cập; hay [B] Tra cứu toàn bộ cơ sở dữ liệu hệ thống? *(Khuyến nghị: [A] bảo vệ quyền riêng tư).*
58. **CV-068 (Đánh giá và tinh chỉnh chất lượng phản hồi của AI):** [A] Bổ sung hai nút bấm Thích và Không thích bên cạnh câu hỏi do AI gợi ý để thu thập dữ liệu cải tiến; hay [B] Bỏ qua thu thập đánh giá? *(Khuyến nghị: [A]).*

---
*Bản câu hỏi tham vấn ý kiến Chủ dự án ExamCraft 2026.*
