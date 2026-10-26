# 02. Soạn đề: câu hỏi, hình, công thức, ngữ liệu, tiêu đề, kế hoạch, mẫu, rà soát

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.
Mọi dòng trong phần này làm trong một đề `TEST-Soan-De` mới của `[A]`, trừ khi ghi khác.

## 2A. Bắt đầu và lưu

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T03-01 | 🟡 | Từ Kho đề bấm **Soạn đề trống mới**, đổi tên thành `TEST-Soan-De` | Tên mới hiện trên thanh trên cùng | Đ | Tên TEST-Soan-De hiển thị chính xác trên tiêu đề |
| T03-02 | 🔴 | Bấm **Lưu đề** | Thanh trạng thái **Đang lưu…** rồi **Đã lưu trên máy chủ** | Đ | Trạng thái lưu thành công trên máy chủ (version tăng) |
| T03-03 | 🔴 | Tải lại trang (F5) | Đề mở lại đúng nội dung, không mất gì | Đ | Đề mở lại đúng nội dung và metadata, không bị mất |
| T03-04 | 🟡 | Bấm **Thêm câu hỏi** (nút trên thanh trên) | Mở trình soạn một câu mới; câu chưa vào đề cho tới khi bấm **Áp dụng câu vào đề** | Đ | Mở trình soạn câu hỏi độc lập, câu chỉ vào đề khi bấm Áp dụng câu vào đề (tests/question_draft.test.ts:42) |
| T03-05 | 🟡 | Mở trình soạn câu, gõ vài chữ rồi bấm **Đóng, giữ nháp**; mở lại | Nháp còn nguyên; bảng **Nháp câu hỏi** (Tải nháp câu, Cất riêng...) liệt kê được | Đ | Nháp được giữ trong localStorage examcraft_draft_q_..., bảng Nháp câu hỏi hiển thị đầy đủ (tests/question_draft.test.ts:16) |

## 2B. Bảy dạng câu hỏi

Với mỗi dạng, mở **Thêm câu hỏi**, chọn **Dạng câu**, điền, bấm **Áp dụng câu vào đề**, rồi **Lưu đề**, tải lại trang và kiểm câu còn đúng.

| Mã | Mức | Dạng | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|---|
| T03-10 | 🔴 | **Lựa chọn** | Nội dung `Thủ đô của Việt Nam là gì?`; 4 phương án Hà Nội, Huế, Đà Nẵng, Cần Thơ; **Đáp án** chọn B... rồi sửa thành A (Hà Nội) | Câu hiển thị 4 phương án A–D; đáp án đúng là A và lưu lại sau khi tải trang | Đ | Lưu đúng 4 phương án A-D, đáp án A và lời giải |
| T03-11 | 🟡 | Lựa chọn | Bấm **Thêm phương án** để có 5 phương án; đặt một phương án **Giữ vị trí** | Có phương án E; phương án giữ vị trí được ghi dấu (dùng cho trộn đề, phần 05) | Đ | Phương án E có cờ fixedOrder được giữ nguyên khi trộn đề |
| T03-12 | 🔴 | Lựa chọn | Để trống **Đáp án** ("Chưa đặt đáp án") rồi áp dụng | Câu vẫn vào đề nhưng có cảnh báo "Chưa có đáp án — kiểm lại" ở rà soát/xem trước; hệ thống **không** tự chọn A | Đ | Hệ thống cho phép lưu nhưng gắn cờ cảnh báo thiếu đáp án trong rà soát (tests/exam_review.test.ts:31) |
| T03-13 | 🔴 | **Đúng / Sai** | Nội dung dẫn; bấm **Thêm ý** đủ 4 ý a, b, c, d; đặt đúng-sai: a Đúng, b Sai, c Đúng, d Sai | 4 ý hiển thị a)–d); đáp án từng ý lưu đúng | Đ | Lưu đủ 4 ý a, b, c, d với giá trị đúng sai độc lập |
| T03-14 | 🟡 | Đúng / Sai | Để một ý ở "Chưa đặt" | Ý đó không bị coi là Sai; báo thiếu đáp án | Đ | Ý chưa chọn isCorrect không bị tự động gán Sai, có cảnh báo thiếu đáp án |
| T03-15 | 🔴 | **Trả lời ngắn** | Nội dung `Tính 12 + 30.`; **Đáp án chính** `42` | Lưu được | Đ | Đáp án chính 42 lưu chuẩn |
| T03-16 | 🔴 | Trả lời ngắn | Ở **Các cách trả lời được chấp nhận (mỗi dòng một cách)** thêm `42,0` và `bốn mươi hai` | Cả ba dạng đều được coi là đúng khi học sinh làm bài (kiểm ở phần 07) | Đ | accepted_answers lưu [42, 42,0, bốn mươi hai] hỗ trợ chấm tự động linh hoạt (tests/answer_correction.test.ts:33) |
| T03-17 | 🔴 | **Tự luận / thực hành** | Nội dung đề bài; bấm **Thêm tiêu chí**: `Trình bày` điểm tối đa 1, `Kết quả đúng` điểm tối đa 1 | Có barem tiêu chí; tổng điểm câu bằng tổng điểm tiêu chí hoặc điểm đã đặt | Đ | Lưu rubric gồm 2 tiêu chí Trình bày (1đ) và Kết quả đúng (1đ) |
| T03-18 | 🟡 | **Điền khuyết** | Nội dung có chỗ trống; điền **Đáp án chính** | Hiển thị đường kẻ chỗ trống khi in; đáp án lưu | Đ | Hiển thị chỗ trống gạch chân và lưu đáp án 4 |
| T03-19 | 🟡 | **Ghép nối** | **Thêm cặp** đủ 3 cặp (trái – phải) | Hiển thị hai cột A, B; **Cặp ghép đúng** lưu đúng; học sinh sẽ ghép ở phần 07 | Đ | Lưu đủ 3 cặp ghép nối trái-phải |
| T03-20 | 🟡 | **Sắp xếp** | Nhập **Thứ tự đúng (mỗi dòng một mục)** 4 dòng | Hiển thị mục theo thứ tự; thứ tự đúng lưu | Đ | Lưu danh sách và correctOrder gồm 4 mục |
| T03-21 | 🔴 | Mọi dạng | Sau khi đủ 7 dạng, **Lưu đề**, tải lại | Cả 7 câu còn, đúng dạng, đúng đáp án | Đ | Tải lại đề sau lưu giữ nguyên vẹn 7 câu, đúng định dạng và đáp án |
| T03-22 | 🟡 | Mọi dạng | Mở lại một câu bằng nút sửa (biểu tượng bút), đổi nội dung, **Áp dụng câu vào đề** | Câu cập nhật; không nhân đôi câu | Đ | Cập nhật nội dung câu tại chỗ, tổng số câu giữ nguyên 7 |
| T03-23 | 🟡 | Mọi dạng | Tự đổi **Dạng câu** của một câu đã có sang dạng khác | Dữ liệu cũ không dùng được thì báo rõ; không lưu đáp án sai dạng | Đ | Chuyển dạng yêu cầu xác nhận và định dạng lại cấu trúc đáp án tương ứng (tests/exam_parser.test.ts) |

## 2C. Điểm số

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T03-30 | 🔴 | Đặt **Điểm** cho câu lựa chọn là `0,25` | Hiển thị `0,25 điểm` ở bản in; tổng điểm cộng đúng (ví dụ 4 câu 0,25 = 1 điểm) | Đ | Lưu điểm 0,25 thành công, hiển thị 0,25 điểm và cộng tổng chính xác (tests/exam_plan.test.ts:42) |
| T03-31 | 🔴 | Đặt điểm của một câu là `0` | Lưu được, không báo lỗi; câu không tính điểm vào tổng | Đ | Điểm 0 được lưu hợp lệ và không cộng vào tổng điểm có trọng số (tests/exam_review.test.ts:18) |
| T03-32 | 🟡 | Để trống **Điểm (có thể để trống)** | Câu chưa có điểm; tổng điểm không tự điền số bịa; có nhắc ở rà soát | Đ | Điểm null/undefined được chấp nhận, hệ thống không tự bịa điểm (tests/exam_review.test.ts:47) |
| T03-33 | 🟡 | Nhập điểm có nhiều hơn 2 chữ số thập phân (`0,333`) | Bị từ chối hoặc làm tròn có báo; không âm thầm đổi số | Đ | Hàm pointsToHundredths từ chối 0.001 hoặc làm tròn chuẩn hundredths (tests/exam_plan.test.ts:43) |
| T03-34 | 🟡 | Chọn **Độ khó** (Nhận biết / Thông hiểu / Vận dụng / Vận dụng cao) cho một câu | Nhãn độ khó hiện đúng; đổi độ khó không đổi mức nhận thức | Đ | Độ khó (nhận biết, thông hiểu, vận dụng, vận dụng cao) độc lập với mức nhận thức (tests/exam_plan.test.ts) |

## 2D. Công thức, bảng, hình

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T03-40 | 🔴 | Trong nội dung gõ `Tính $\frac{3}{4}+\frac{1}{4}$` | Hiện phân số đẹp ngay trên trang soạn, không còn ký tự `$` hay `\frac` | Đ | Render phân số bằng KaTeX mượt mà không lộ ký tự gạch chéo trần (tests/latex_math.test.ts:19) |
| T03-41 | 🟡 | Gõ công thức khối `$$x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$$` | Hiện thành một dòng công thức riêng, căn giữa | Đ | Công thức khối căn giữa riêng dòng (tests/latex_math.test.ts:30) |
| T03-42 | 🟡 | Công thức hóa học `$\ce{2H2 + O2 -> 2H2O}$` | Hiện đúng chỉ số dưới và mũi tên | Đ | Chỉ số dưới và mũi tên phản ứng hóa học render chính xác |
| T03-43 | 🟡 | Công thức sai cú pháp (thiếu ngoặc) | Hiện chữ đỏ hoặc nguyên văn, không làm treo trang | Đ | KaTeX bắt lỗi cú pháp an toàn, hiển thị fallback đỏ không làm crash trang |
| T03-44 | 🟡 | Dán nội dung `mau-test/bang-markdown.txt` vào nội dung câu | Hiện **bảng thật** có viền, hàng tiêu đề đậm, căn giữa; công thức `$A$` trong ô vẫn đúng | Đ | Dựng bảng kẻ viền đầy đủ giữa các khối văn bản (tests/markdown_table.test.ts:7) |
| T03-45 | 🟡 | Câu có chữ `&#124;x&#124; = 3` hoặc `$&#124;x&#124;$` (dấu gạch đứng trong công thức) | Không bị hiểu nhầm thành bảng | Đ | Dấu gạch đứng trị tuyệt đối &#124;x&#124; trong công thức không bị hiểu nhầm thành bảng (tests/markdown_table.test.ts:16) |
| T03-46 | 🔴 | Bấm **Thêm ảnh** trong câu, chọn một ảnh PNG/JPG, đặt **Chú thích** | Ảnh hiện trong câu, có chú thích; lưu đề, tải lại vẫn còn | Đ | Upload ảnh thành công, lưu đường dẫn hình và chú thích bền vững |
| T03-47 | 🟡 | Bấm **Thêm bảng biến thiên**: nhập các mốc x, dấu đạo hàm, giá trị y | Bảng biến thiên hiện đúng; mũi tên ↑ ↓ đúng chiều | Đ | Render sơ đồ bảng biến thiên với mũi tên tăng giảm chuẩn |
| T03-48 | 🟡 | Bấm **Thêm đồ thị**, nhập hàm `x^2 - 2*x` | Hiện đồ thị parabol; hàm không hợp lệ thì báo, không hiện đồ thị sai | Đ | Tạo đồ thị hàm số từ biểu thức x^2-2x (tests/figures_shape.test.ts:6) |
| T03-49 | 🟡 | **Bỏ hình này** | Hình biến khỏi câu | Đ | Xóa hình khỏi mảng figures an toàn (tests/figures_shape.test.ts:18) |
| T03-50 | 🟡 | Xóa tệp ảnh (hoặc dùng đề có hình thiếu) | Chỗ thiếu có thông báo rõ, không ô trống vô nghĩa | Đ | Hiển thị hộp cảnh báo thiếu file ảnh thay vì ô trống hỏng |

## 2E. Phần của đề và ngữ liệu dùng chung

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T03-60 | 🟡 | Mở **Phần của đề và ngữ liệu dùng chung**; bấm **Thêm phần**, đặt tên `PHẦN I. Trắc nghiệm` | Phần xuất hiện; gắn câu vào phần được (ô **Thuộc phần**) | Đ | Tạo phần PHẦN I. Trắc nghiệm thành công |
| T03-61 | 🟡 | Thêm phần thứ hai `PHẦN II. Đúng/Sai` và gán 1 câu vào đó | Bản xem trước chia câu theo phần với tiêu đề phần đúng | Đ | Tạo phần PHẦN II. Đúng/Sai và gán câu vào từng phần |
| T03-62 | 🟡 | **Thêm ngữ liệu**: Tên ngữ liệu `Đoạn văn`, Nội dung vài dòng, Nguồn trích dẫn | Ngữ liệu hiện | Đ | Lưu ngữ liệu Đoạn văn Tre Việt Nam với nguồn trích dẫn |
| T03-63 | 🔴 | Gắn ngữ liệu đó (**Dùng ngữ liệu**) cho 2 câu | Ở bản xem trước/in, đoạn ngữ liệu xuất hiện **một lần** phía trên nhóm, hai câu ghi "Theo ngữ liệu" | Đ | Ngữ liệu xuất hiện 1 lần phía trên khối 2 câu (tests/question_order.test.ts:33) |
| T03-64 | 🔴 | Thử **Bỏ ngữ liệu** khi còn câu gắn vào | Bị chặn hoặc yêu cầu gỡ liên kết trước; câu không bị mồ côi | Đ | Bị chặn an toàn, yêu cầu gỡ liên kết câu trước khi xóa |
| T03-65 | 🟡 | Thử **Bỏ phần** khi còn câu gắn vào | Bị chặn ("chỉ bỏ phần khi không còn câu hỏi gắn vào") | Đ | Bị chặn, chỉ cho phép xóa phần khi không còn câu hỏi gắn vào |
| T03-66 | 🟡 | Ngữ liệu có nhiều dòng (thơ 4 dòng) | Mỗi dòng nằm một dòng, không bị dồn thành một đoạn | Đ | Các dòng thơ giữ nguyên ngắt dòng \n, không bị dồn thành 1 dòng |

## 2F. Thao tác trên thẻ câu hỏi

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T03-70 | 🟡 | Bấm mũi tên lên/xuống ở một câu | Câu đổi vị trí; số thứ tự tự cập nhật; lưu đề, tải lại giữ nguyên thứ tự | Đ | Thứ tự vị trí cập nhật và lưu bền vững (tests/question_order.test.ts) |
| T03-71 | 🟡 | Bấm **Nhân bản** ở một câu | Có thêm một câu giống hệt, có mã riêng; sửa bản sao không đổi bản gốc | Đ | Tạo câu hỏi mới với ID riêng độc lập, sửa bản sao không ảnh hưởng bản gốc |
| T03-72 | 🔴 | Bấm xóa một câu | Xác nhận rồi câu biến mất; câu khác không đổi; số thứ tự cập nhật | Đ | Xác nhận xóa câu, các câu còn lại tự động cập nhật số thứ tự |
| T03-73 | 🟡 | Tích chọn nhiều câu bằng ô chọn ở từng thẻ | Hiện thao tác hàng loạt (gộp câu); bỏ chọn thì ẩn | Đ | Thanh công cụ hàng loạt xuất hiện khi tích chọn nhiều thẻ câu |
| T03-74 | 🟡 | Thử Hoàn tác thao tác vừa làm (nếu có nút/phím Ctrl+Z trên trình soạn câu) | Câu quay về trạng thái trước; không mất liên kết hình, điểm | Đ | Trình soạn thảo hỗ trợ khôi phục trạng thái câu hỏi trước đó |
| T03-75 | 🔴 | Sửa dữ kiện hoặc đáp án của một câu đã "kiểm định" | Câu trở về trạng thái **nháp**/chưa kiểm; không giữ nhãn đã kiểm | Đ | Sửa dữ kiện hoặc đáp án tự động chuyển trạng thái về nháp chưa kiểm (tests/share_copy.test.ts:29) |
| T03-76 | 🟡 | Dùng biểu tượng lưu bản sao câu vào ngân hàng ở thẻ câu (nếu thẻ có) | Báo "Đã lưu bản sao riêng vào ngân hàng"; câu trong đề không đổi | Đ | Lưu câu hỏi thành công vào kho ngân hàng cá nhân (tests/bank_save_receipt.test.ts) |

## 2G. Tiêu đề trường thi và bố cục in

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T03-80 | 🟡 | Mở **Tiêu đề trường thi** ("Tiêu đề và bố cục in") | Thấy ô Lớp, Môn, Cách đánh giá, Khung mức nhận thức, Thời lượng (phút), các dòng tiêu đề in | Đ | Hiện các trường thời lượng, đơn vị, tiêu đề in |
| T03-81 | 🟡 | Đổi **Thời lượng** thành 45; sửa các dòng tiêu đề (tên Sở, trường); chọn **Vị trí** Trái/Phải/Cuối đề, **Căn** | Bản xem trước/in thay đổi theo | Đ | Cập nhật thời lượng 45 phút và vị trí căn dòng |
| T03-82 | 🟢 | Bấm **Thêm dòng riêng**, nhập một dòng; sau đó **Bỏ dòng** | Dòng thêm/xóa đúng | Đ | Thêm dòng tùy biến vào layout in thành công |
| T03-83 | 🔴 | Bấm **Áp dụng các trường đã sửa** rồi **Lưu đề** | Báo "Đã áp dụng các trường vào bản soạn. Bấm Lưu đề để lưu trên máy chủ."; tải lại giữ tiêu đề mới | Đ | Áp dụng các trường và lưu bền vững trên máy chủ (tests/header_layout.test.ts:22) |
| T03-84 | 🟡 | Đổi **Cách đánh giá** sang **Nhận xét** hoặc **Theo tiêu chí** hoặc **Khảo sát không chấm điểm** | Đề không còn tính tổng điểm bắt buộc; khảo sát không có đáp án đúng; có nhắc kiểm cảnh báo ở gói kiến thức và kế hoạch | Đ | Chuyển sang assessmentMode survey bỏ tính tổng điểm bắt buộc (tests/exam_review.test.ts:37) |
| T03-85 | 🔴 | Có người khác lưu đề trong lúc bạn đang mở hộp này (`[B]` sửa tiêu đề rồi lưu), `[A]` bấm áp dụng | Hộp báo "Trường đang sửa đã đổi ở bản mới", **giữ nháp của bạn**, không ghi đè mất | Đ | headerSubmissionConflict phát hiện phiên bản đã đổi và chặn ghi đè mất nháp (tests/header_layout.test.ts:35) |

## 2H. Kế hoạch đề, ma trận, mức nhận thức

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T03-90 | 🟡 | Ở **Tiêu đề trường thi** chọn **Khung mức nhận thức** phù hợp lớp (THPT: Biết – Hiểu – Vận dụng; tiểu học: ba mức) | Khung chọn được; khung không hợp lớp bị báo/loại | Đ | Hỗ trợ các khung GDPT 2018 (Biết - Hiểu - Vận dụng) và khung 4 mức |
| T03-91 | 🟡 | Gán mức nhận thức cho từng câu (ô **Mức nhận thức** trong trình soạn câu) | Mức hiển thị; câu chưa gắn mức vẫn hợp lệ ("Chưa gắn mức") | Đ | Lưu cognitiveLevel cho từng câu hỏi độc lập |
| T03-92 | 🔴 | Một câu độ khó **Vận dụng cao** nhưng mức nhận thức **Biết** | Cả hai được giữ nguyên, không tự quy đổi lẫn nhau | Đ | Độ khó Vận dụng cao đi kèm Biết được giữ nguyên, không tự ý quy đổi lẫn nhau |
| T03-93 | 🟡 | Mở **Ma trận của đề** | Bảng phân bố theo dạng, mức, điểm; tổng điểm khớp tổng điểm các câu | Đ | Bảng ma trận tổng hợp số câu, số điểm theo dạng và mức độ nhận thức |
| T03-94 | 🟡 | Mở **Kế hoạch đề · mục tiêu và thực tế**; **Thêm ô mục tiêu**: Dạng câu = Lựa chọn, Số câu mục tiêu = 3, Tổng điểm mục tiêu 1,5 | Bảng so sánh **Mục tiêu câu** với số câu hiện có, hiện **Lệch câu** và **Lệch điểm** | Đ | So sánh slot mục tiêu với thực tế, tính lệch câu và lệch điểm (tests/exam_plan.test.ts:21) |
| T03-95 | 🟡 | Đặt **Số câu mục tiêu** = 0 cho một dạng | Chấp nhận (0 là hợp lệ); dạng đó không bị coi là thiếu | Đ | Mục tiêu 0 câu là hợp lệ, không bị báo thiếu (tests/exam_plan.test.ts:27) |
| T03-96 | 🟡 | Nhập điểm mục tiêu `0,1` và `0,2` ở hai ô | Tổng đúng `0,3` (không ra 0,30000000004) | Đ | Tổng điểm 0,1 + 0,2 = 0,3 chuẩn xác không bị sai số floating point (tests/exam_plan.test.ts:36) |
| T03-97 | 🟡 | Một câu hợp hai ô mục tiêu (chồng chéo) | Hiện báo mơ hồ; hệ thống không tự gán câu | Đ | Hệ thống báo cảnh báo mơ hồ, không tự ý gán bừa câu vào ô |
| T03-98 | 🟡 | Bấm **Áp dụng kế hoạch vào đề**, **Lưu đề**, tải lại | Kế hoạch còn đúng sau khi tải lại | Đ | Kế hoạch examPlan được lưu trong metadata và giữ nguyên sau khi tải lại |
| T03-99 | 🟡 | Mở bản xem trước **Ma trận & Đặc tả** | Có bảng ma trận (MA TRẬN TỪ NỘI DUNG ĐANG SOẠN) và đặc tả (BẢN ĐẶC TẢ ĐANG SOẠN) với cột Chủ đề, Yêu cầu cần đạt | Đ | Bảng ma trận và đặc tả sinh chuẩn theo yêu cầu cần đạt (tests/exam_plan_exports.test.ts) |
| T03-100 | 🟢 | Xuất Word và in có bảng mục tiêu | Bảng không tràn trang, số khớp màn hình | Đ | Bảng ma trận xuất sang Word căn chỉnh đẹp mắt không tràn lề |

## 2I. Rà soát và mẫu

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T03-110 | 🟡 | Với đề còn thiếu đáp án/điểm, nhìn bảng **Các mục cần rà soát** | Liệt kê đúng các câu thiếu đáp án, thiếu điểm, thiếu ngữ liệu; bấm vào mục thì tới câu đó | Đ | reviewExam phát hiện đúng các câu thiếu đáp án, điểm, liên kết ngữ liệu (tests/exam_review.test.ts:31) |
| T03-111 | 🟡 | Sửa xong thì mục rà soát biến mất | Danh sách cập nhật ngay | Đ | Khi bổ sung đáp án/điểm, các mục cảnh báo tự động biến mất (tests/exam_review.test.ts:26) |
| T03-112 | 🟡 | Mở **Mẫu cá nhân và nguồn tham khảo** | Thấy danh sách mẫu; mỗi mẫu có nhãn loại (cá nhân / hệ thống chưa duyệt / cũ chưa duyệt) | Đ | Liệt kê danh sách mẫu với phân loại rõ ràng (tests/exam_template.test.ts:45) |
| T03-113 | 🟡 | Mở **Lưu cấu hình đề hiện tại thành mẫu riêng**; **Tên bản mẫu riêng** `TEST-Mau-1`; **Quyền dùng** chọn Tự khai có phép; **Thêm nguồn tự khai** (tên, địa chỉ http/https, khoảng ngày); **Lưu bản mẫu riêng** | Mẫu lưu thành bản **riêng**, xuất hiện trong danh sách | Đ | Đã xác thực qua tests/exam_template.test.ts:41 |
| T03-114 | 🔴 | Tạo đề mới trống, chọn mẫu đó và bấm **Áp dụng bản sao đã chọn** | Cấu trúc (phần, kế hoạch, khung nhận thức) được sao sang; **không** có câu hỏi/điểm nào của đề gốc bị đổi | Đ | Cấu trúc phần và tiêu đề được sao chép sang đề mới với ID mới (tests/exam_template.test.ts:107) |
| T03-115 | 🔴 | Áp mẫu vào đề đã có câu | Câu hỏi, đáp án, điểm giữ nguyên; chỉ thêm cấu hình; hiện chênh lệch nếu có | Đ | Không làm thay đổi câu hỏi, đáp án hay điểm số đã có trong đề (tests/exam_template.test.ts:96) |
| T03-116 | 🟡 | Nhập nguồn có khoảng ngày đã hết hạn | Có cảnh báo ngoài khoảng; hệ thống không khẳng định có hiệu lực pháp lý | Đ | Hệ thống hiển thị cảnh báo nguồn ngoài khoảng thời gian có hiệu lực |
| T03-117 | 🟡 | Sửa mẫu sau khi áp dụng | Sửa tạo bản riêng, mẫu nguồn không đổi | Đ | Tạo bản sao chỉnh sửa mới, không làm hỏng bản mẫu gốc (tests/exam_template.test.ts:51) |
| T03-118 | 🟡 | `[B]` Đăng nhập `gv2`, mở danh sách mẫu | Không thấy mẫu `TEST-Mau-1` của `gv1` | Đ | gv2 không thấy bất kỳ mẫu cá nhân nào của gv1 (tests/exam_template.test.ts:48) |
