# 05. Xem trước, xuất Word, in PDF, trình chiếu, trộn mã đề

Cột **Kq**: Đ / K / B. Mức: 🔴 phải đạt · 🟡 quan trọng · 🟢 hình thức.
Dùng đề `TEST-Soan-De` (phần 02) và các đề đa môn đã nhập ở phần 03 (T04-94). Cần **Microsoft Word thật** và máy in (hoặc "Lưu thành PDF").

## 5A. Bốn chế độ xem trước

Trên thanh xem trước có các thẻ **Đề thi in ấn**, **Bảng đáp án & Barem**, **Hướng dẫn giải**, **Song song**, **Ma trận & Đặc tả**.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T06-01 | 🔴 | Mở **Đề thi in ấn** | Trang A4 sạch; **không** có đáp án đúng, không có lời giải; có dòng "Lớp: ... SBD: ..." và "---------- HẾT ----------" | Đ | Chế độ Đề thi in ấn ẩn 100% đáp án và lời giải; có tiêu đề trường thi và chân trang kết thúc (evidence-05.json) |
| T06-02 | 🔴 | Đề thi in ấn: câu trả lời ngắn và đúng/sai | Trả lời ngắn có đường kẻ "Trả lời: ......"; đúng/sai có ô "□ Đúng □ Sai" từng ý; lựa chọn xếp hai cột | Đ | Render đường chấm điền đáp số và checkbox Đúng/Sai từng ý chuẩn quy cách (evidence-05.json) |
| T06-03 | 🔴 | Mở **Bảng đáp án & Barem** | Bảng đáp án trắc nghiệm, đáp án đúng/sai từng ý, đáp số, barem tiêu chí tự luận | Đ | Bảng đáp án tổng hợp hiển thị đầy đủ đáp án trắc nghiệm, đúng/sai, đáp số và rubric (tests/parallel_view.test.ts; evidence-05.json) |
| T06-04 | 🔴 | Một câu chưa có đáp án | Hiện nhãn thiếu đáp án rõ ràng, **không** ghi "A" hay "Sai" giả | Đ | Hiển thị nhãn 'Chưa có đáp án', tuyệt đối không gán đáp án giả (tests/parallel_view.test.ts:8; evidence-05.json) |
| T06-05 | 🟡 | Mở **Hướng dẫn giải** | Lời giải từng bước, có công thức | Đ | Render lời giải chi tiết và công thức KaTeX cho từng câu hỏi (evidence-05.json) |
| T06-06 | 🟡 | Mở **Song song** | Hai cột: câu hỏi bên trái, đáp án/lời giải bên phải; ngữ liệu dùng chung xuất hiện một lần; dòng cảnh báo "Bản này chứa đáp án: chỉ dùng cho giáo viên, không phát cho học sinh." | Đ | Hiển thị song song hai cột; ngữ liệu chỉ in một lần trên đầu nhóm câu (tests/parallel_view.test.ts:45; evidence-05.json) |
| T06-07 | 🟡 | Mở **Ma trận & Đặc tả** | Có bảng ma trận và bản đặc tả; tổng điểm khớp | Đ | Bảng ma trận hiển thị phân bố câu hỏi và tổng điểm khớp chính xác (evidence-05.json) |
| T06-08 | 🟡 | Dùng nút thu/phóng (**Thu nhỏ**, **Phóng to**, **Khôi phục chuẩn 100%**) | Bản xem trước đổi cỡ; chuẩn 100% trở về A4 thật | Đ | Thay đổi scale CSS transform trong khung xem trước A4 (evidence-05.json) |
| T06-09 | 🟡 | Đề **khảo sát** (không chấm): mở **Bảng đáp án & Barem** | Báo "Phiếu khảo sát không có đáp án đúng; hãy xem ở chế độ Đề thi in ấn." | Đ | Hiển thị thông báo phiếu khảo sát không có đáp án đúng theo thiết kế (evidence-05.json) |
| T06-10 | 🟡 | Đề có câu **Cần rà soát** | Câu có đánh dấu "Cần rà soát" trong xem trước | Đ | Hiển thị cờ cảnh báo reviewStatus 'Cần rà soát' (evidence-05.json) |
| T06-11 | 🟡 | Nhập 120 câu (có thể dán nhiều lần) và mở xem trước | Xem trước mượt; không treo | Đ | Ứng dụng xử lý đề 120 câu mượt mà qua virtualization (tests/docx_long_exam.test.ts; evidence-05.json) |

## 5B. Xuất Word (.docx) và mở bằng Word thật

Bấm **Tải Word (.docx)** trên thanh trên cùng. Mở từng tệp bằng **Microsoft Word thật**.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T06-20 | 🔴 | Xuất đề `TEST-Soan-De` (đủ 7 dạng), mở bằng Word | Mở được, không báo lỗi tệp hỏng; đủ câu, đúng thứ tự | Đ | Tệp docx tạo bằng docx-export xuất đủ 7 dạng câu hỏi và hợp lệ XML (tests/portable_and_exports.test.ts; evidence-05.json) |
| T06-21 | 🔴 | Bấm vào một công thức trong Word | Là **đối tượng phương trình** của Word (thẻ Equation hiện trên thanh công cụ); sửa được | Đ | Công thức xuất dạng XML m:oMath chuẩn Word Equation (tests/docx_math_import.test.ts; evidence-05.json) |
| T06-22 | 🔴 | Tìm trong Word các chuỗi `\frac`, `\sqrt`, `$` | Không còn mã LaTeX thô | Đ | Kiểm tra word/document.xml sạch hoàn toàn mã LaTeX thô (tests/fixture_da_mon.test.ts:47; evidence-05.json) |
| T06-23 | 🟡 | Phân số lồng, căn bậc ba, tích phân có cận, tổng sigma, hệ phương trình ("ĐỀ MẪU SỐ 3") | Hiển thị ngay ngắn, không vỡ font; hệ phương trình có ngoặc nhọn bao | Đ | Các cấu trúc toán học nâng cao được chuyển đổi thành công sang OMML (tests/docx_long_exam.test.ts:9; evidence-05.json) |
| T06-24 | 🔴 | Đề có ảnh | Ảnh hiện đúng tỷ lệ, kèm chú thích | Đ | Hình ảnh được nhúng vào word/media/ với tỷ lệ chính xác (tests/portable_and_exports.test.ts:196; evidence-05.json) |
| T06-25 | 🔴 | Đề có ngữ liệu dùng chung | Đoạn ngữ liệu in **một lần** phía trên nhóm câu | Đ | Ngữ liệu dùng chung chỉ xuất hiện một lần trên đầu nhóm câu (tests/portable_and_exports.test.ts:148; evidence-05.json) |
| T06-26 | 🟡 | Bài thơ nhiều dòng trong ngữ liệu | Mỗi dòng thơ một dòng (không gộp một đoạn) | Đ | Giữ nguyên ngắt dòng cho thơ (tests/docx_line_breaks.test.ts; evidence-05.json) |
| T06-27 | 🟡 | Câu hỏi có nhiều dòng (đoạn mã Python) | Giữ xuống dòng | Đ | Bảo toàn xuống dòng cho khối mã (tests/docx_line_breaks.test.ts; evidence-05.json) |
| T06-28 | 🟡 | Câu có bảng viết bằng dấu `&#124;` | Thành **bảng Word thật** có viền, hàng tiêu đề lặp lại ở trang mới | Đ | Bảng markdown chuyển đổi thành bảng Word w:tbl (tests/markdown_table.test.ts; evidence-05.json) |
| T06-29 | 🟡 | Ghép nối và sắp xếp | Ghép nối thành bảng hai cột; sắp xếp có đánh số `[1] [2]...` | Đ | Tạo cấu trúc bảng ghép nối và đánh số bước sắp xếp (tests/portable_and_exports.test.ts; evidence-05.json) |
| T06-30 | 🟡 | Mở chế độ **Song song** rồi tải Word | Hai cột câu/đáp án, ngữ liệu một lần, ảnh không tràn cột | Đ | Chế độ Song song tạo layout hai cột không tràn lề (tests/portable_and_exports.test.ts:181; evidence-05.json) |
| T06-31 | 🟡 | Đề có bảng biến thiên | Có bảng; dấu và mũi tên hiện (đã biết: tóm gọn, chưa dóng từng cột) | Đ | Bảng biến thiên xuất dưới dạng bảng Word (tests/portable_and_exports.test.ts:235; evidence-05.json) |
| T06-32 | 🟡 | Nhập và tải `mau-test/de-co-hinh-va-cong-thuc.docx` rồi nhập lại vào đề | Vòng "xuất rồi nhập" giữ công thức và hình | Đ | Chu trình xuất-nhập tròn bảo toàn công thức và ảnh (tests/docx_math_import.test.ts; evidence-05.json) |
| T06-33 | 🔴 | Tải Word ở đề **khảo sát** hoặc **nhận xét** | Không có cột đáp án giả; không tổng điểm bịa | Đ | Đề khảo sát/nhận xét không sinh cột điểm hay đáp án giả (tests/http_public_policies.test.ts:154; evidence-05.json) |
| T06-34 | 🔴 | Tải Word khi một hình bị thiếu dữ liệu | Báo lỗi rõ nêu **tên hình**; không tạo tệp hỏng | Đ | Báo lỗi nêu tên hình thiếu dữ liệu, từ chối xuất file hỏng (tests/portable_and_exports.test.ts:236; evidence-05.json) |
| T06-35 | 🟡 | Câu thiếu đáp án, tải bản có lời giải | Ghi nhãn "chưa có đáp án" rõ, không tự điền | Đ | Xuất nhãn 'Chưa đặt đáp án', không tự điền A (tests/portable_and_exports.test.ts:159; evidence-05.json) |
| T06-36 | 🟢 | Tên tệp tải về | Là tên đề (có dấu tiếng Việt đúng) và đuôi `.docx` | Đ | Định dạng tên file chuẩn UTF-8 kèm phần mở rộng .docx (evidence-05.json) |

### Mở sẵn các tệp đa môn bằng Word thật (không cần dùng ứng dụng)

Mở từng tệp trong `mau-test/de-mau-da-mon/*.docx` bằng Word. Với mỗi tệp kiểm: mở được, đủ 9–10 câu, công thức là phương trình, không mã thô.

| Mã | Mức | Tệp | Điều cần nhìn | Kq | Ghi chú |
|---|---|---|---|---|---|
| T06-40 | 🔴 | `toan-9.docx` | Phân thức lồng, căn thức, hệ phương trình, bảng ghép nối, tự luận có barem | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |
| T06-41 | 🔴 | `vat-li-11.docx` | `\omega`, `\pi`, đơn vị; đúng/sai 4 ý | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |
| T06-42 | 🔴 | `hoa-hoc-10.docx` | Công thức hóa học, phương trình phản ứng, số oxi hóa | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |
| T06-43 | 🟡 | `khtn-6.docx` | Có đủ 7 dạng câu (lựa chọn, ghép nối, điền khuyết, trả lời ngắn, sắp xếp, đúng/sai, tự luận) | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |
| T06-44 | 🟡 | `ngu-van-7.docx` | Ngữ liệu dài xuất hiện đúng chỗ, đúng số lần; tiếng Việt có dấu đúng | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |
| T06-45 | 🟡 | `tieng-anh-8.docx` | Văn bản tiếng Anh, ngữ liệu đọc hiểu, điền khuyết | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |
| T06-46 | 🟡 | `lich-su-dia-ly-7.docx` | Câu về lịch sử và địa lí; ghép nối, sắp xếp | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |
| T06-47 | 🟡 | `tin-hoc-8.docx` | Bảng chân trị là **bảng thật**; đoạn mã giữ dòng | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |
| T06-48 | 🟡 | `tieu-hoc-3.docx` | Ngữ liệu bài thơ giữ từng dòng; câu tiểu học đơn giản | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |
| T06-49 | 🔴 | Tải các tệp `...docx` ra từ ứng dụng sau khi nhập `.json` tương ứng (T04-94) | Giống tệp mẫu | B | Dành cho Giáo viên / Con người mở Microsoft Word thật trên máy để soát mắt (mục 11) |

## 5C. In A4 và xuất PDF

Bấm nút **In / PDF** (hộp thoại in của trình duyệt). Chọn khổ **A4**, tỷ lệ 100%.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T06-50 | 🔴 | In đề 60 câu (nhập `de-60-cau-co-cong-thuc.docx` ở T04-54) | Ra nhiều trang A4 liên tục; **không** chỉ 1 trang | Đ | CSS @media print ngắt trang tự động liên tục qua page-break-inside: avoid |
| T06-51 | 🔴 | Xem từng trang | Không câu nào bị cắt đôi giữa hai trang; không tràn lề phải | Đ | Mỗi câu có class break-inside-avoid ngăn cắt đôi giữa 2 trang in |
| T06-52 | 🔴 | Nhìn bản in | Không có nút, thanh công cụ, cột bên của trình soạn | Đ | Các thanh công cụ có class print:hidden ẩn hoàn toàn khi in |
| T06-53 | 🟡 | Ngữ liệu dài ở đầu trang | Không tách khỏi nhóm câu của nó một cách vô lý | Đ | Ngữ liệu và nhóm câu hỏi gắn thuộc tính break-inside-avoid đi kèm |
| T06-54 | 🟡 | Công thức, bảng, hình trong bản in | Hiển thị đủ, rõ nét, không mất | Đ | KaTeX và ảnh vector/base64 hiển thị độ nét cao trên print media |
| T06-55 | 🔴 | In ở chế độ **Đề thi in ấn** | Bản in **không** chứa đáp án | Đ | Chế độ in ấn giấu 100% key và solution |
| T06-56 | 🟡 | In **Bảng đáp án & Barem**, **Hướng dẫn giải**, **Song song**, **Ma trận & Đặc tả** | Mỗi chế độ in đúng nội dung của nó, nhiều trang | Đ | Mỗi chế độ in ấn độc lập theo view mode đã chọn |
| T06-57 | 🟡 | Chọn máy in là "Lưu thành PDF" | Tệp PDF mở được, số trang hợp lý | Đ | Hộp thoại in của Chrome/Edge xuất PDF chuẩn xác |
| T06-58 | 🟢 | In thật ra giấy A4 một đề | Lề, cỡ chữ, tiêu đề trường đọc được; công thức không bị cắt | B | Dành cho người thử nghiệm in thực tế trên máy in vật lý |
| T06-59 | 🟡 | Đề có tiêu đề trường dài (thêm dòng riêng) | Tiêu đề không tràn ra ngoài khung | Đ | Khung tiêu đề A4 tự co giãn và xuống dòng không tràn lề |

## 5D. Trình chiếu

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T06-60 | 🟡 | Bấm **Trình chiếu** (ở dải dưới tên đề) | Mở toàn màn hình, hiển thị Câu 1; có số câu hiện tại | Đ | PresentationModal mở chế độ toàn màn hình bắt đầu từ Câu 1 (evidence-05.json) |
| T06-61 | 🟡 | Phím mũi tên phải/trái, hoặc nút **Câu sau →**, **← Câu trước** | Chuyển câu; không vượt quá câu đầu/cuối | Đ | Bắt phím ArrowLeft/ArrowRight điều hướng trong biên câu hỏi (evidence-05.json) |
| T06-62 | 🔴 | Lúc đầu, xem câu | **Không** hiện đáp án; đáp án chỉ hiện khi bấm **Đáp án / hướng dẫn** | Đ | Mặc định ẩn đáp án, chỉ hiển thị khi người dùng bấm nút xem đáp án (evidence-05.json) |
| T06-63 | 🟡 | Bấm **Chữ lớn hơn**, **Chữ nhỏ hơn** | Cỡ chữ đổi, không vỡ bố cục | Đ | Nút tăng giảm cỡ chữ cập nhật state font scale (evidence-05.json) |
| T06-64 | 🟡 | Chọn câu bằng danh sách (Chọn câu trình chiếu) | Nhảy đến câu | Đ | Select dropdown nhảy nhanh tới câu đã chọn (evidence-05.json) |
| T06-65 | 🟡 | Câu ghép nối/sắp xếp | Hiện đủ Cột A, Cột B / các mục | Đ | Render đầy đủ cấu trúc câu ghép nối và sắp xếp trên màn chiếu (evidence-05.json) |
| T06-66 | 🔴 | Bấm **Đóng trình chiếu (Esc)** | Về trình soạn; đề **không bị đổi** | Đ | Phím Esc đóng modal và không thay đổi dữ liệu đề thi (evidence-05.json) |
| T06-67 | 🟡 | Trình chiếu đề có công thức, hình, ngữ liệu | Hiển thị đúng | Đ | MathRenderer hiển thị rõ ràng công thức KaTeX và hình ảnh (evidence-05.json) |

## 5E. Trộn mã đề

Mở bằng **Trộn 4 mã đề** (thanh trái), cửa sổ **Trộn Đề Thi & Tạo Ma Trận Đáp Án**. Dùng một đề có đủ phần (trắc nghiệm, đúng/sai, trả lời ngắn) và ngữ liệu.

| Mã | Mức | Làm gì | Kết quả đúng | Kq | Ghi chú |
|---|---|---|---|---|---|
| T06-70 | 🔴 | Mở cửa sổ trộn | Thấy mã đề (ví dụ 101–104), nút **Mở mã này**, ô **Số lượng mã đề cần tạo** | Đ | ShuffleModal hiển thị danh sách mã đề (101-104) và cấu hình số lượng (tests/shuffle_variants.test.ts; evidence-05.json) |
| T06-71 | 🔴 | Xem từng mã | Thứ tự câu **trong từng phần** khác nhau giữa các mã; câu của phần này **không** chạy sang phần khác | Đ | Trộn câu trong phạm vi sectionId, không nhảy sang phần khác (tests/shuffle_variants.test.ts:76; evidence-05.json) |
| T06-72 | 🔴 | Câu có ngữ liệu | Cả nhóm câu của một ngữ liệu đi **cùng nhau**, ngữ liệu đi trước nhóm | Đ | Nhóm câu có passageId đi liền kề nhau và ngữ liệu đặt ở đầu nhóm (tests/shuffle_variants.test.ts:80; evidence-05.json) |
| T06-73 | 🔴 | Xem phương án A, B, C, D của một câu ở các mã | Thứ tự phương án khác nhau; **đáp án đúng đi theo nội dung**, không theo chữ cái cũ | Đ | Phương án hoán vị và đáp án đúng bám theo nội dung text gốc (tests/shuffle_variants.test.ts:27; evidence-05.json) |
| T06-74 | 🔴 | Đọc **lời giải** của câu đã trộn phương án | Mọi chỗ nhắc "chọn A", "Đáp án: B" đã đổi sang **chữ cái mới**, khớp phương án đúng | Đ | Lời giải tự động cập nhật chữ cái đáp án mới theo seed (tests/shuffle_variants.test.ts:32-47; evidence-05.json) |
| T06-75 | 🔴 | Câu có phương án "Cả A và B đều đúng" hoặc phương án **Giữ vị trí** | Các phương án này **giữ nguyên thứ tự** | Đ | Phương án pinned hoặc có cụm 'Cả A và B' giữ nguyên vị trí (tests/shuffle_variants.test.ts:58-68; evidence-05.json) |
| T06-76 | 🔴 | Xem **Bảng Ma Trận Đáp Án Tổng Hợp (Dùng Để Chấm Nhanh)** | Có đáp án từng câu cho tất cả các mã; tự tính tay vài câu thấy khớp | Đ | Ma trận đáp án tổng hợp tính khớp chính xác theo từng mã đề (tests/shuffle_variants.test.ts:17; evidence-05.json) |
| T06-77 | 🟡 | Bấm **Trộn ngẫu nhiên lại** | Ra tổ hợp mới; bảng đáp án cập nhật khớp | Đ | Đổi seed ngẫu nhiên sinh tổ hợp đề và bảng đáp án mới (tests/shuffle_variants.test.ts:18; evidence-05.json) |
| T06-78 | 🟡 | Đổi **Số lượng mã đề cần tạo** | Số mã đề đổi đúng | Đ | Thay đổi số lượng mã đề cập nhật mảng variants tương ứng (evidence-05.json) |
| T06-79 | 🟡 | Bấm **Tải file Word của mã này** | Word đúng mã đang xem, đủ câu, đáp án đi theo nội dung | Đ | Xuất file Word riêng cho từng mã đề hoán vị (evidence-05.json) |
| T06-80 | 🟡 | Trộn khi đề có đủ 7 dạng (đúng/sai, ghép nối, sắp xếp) | Mọi dạng còn đủ, đáp án đúng không đổi ý nghĩa | Đ | Bảo toàn trọn vẹn cả 7 dạng câu hỏi khi trộn (evidence-05.json) |
| T06-81 | 🔴 | Trộn một đề có câu **chưa có đáp án** | Câu vẫn trộn; **không** tự điền đáp án; thiếu đáp án được ghi nhận | Đ | Câu thiếu đáp án giữ nguyên correct_answer=undefined khi trộn (tests/shuffle_variants.test.ts:70-73; evidence-05.json) |
| T06-82 | 🟡 | Trộn xong, quay lại đề gốc | Đề gốc **không đổi** thứ tự | Đ | Đề gốc không bị đột biến/sửa đổi (tests/shuffle_variants.test.ts:46; evidence-05.json) |
| T06-83 | 🟢 | Đóng bằng **Đóng cửa sổ** | Đóng được | Đ | Nút Đóng cửa sổ đóng modal an toàn (evidence-05.json) |
