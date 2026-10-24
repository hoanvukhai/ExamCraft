# Tổng hợp bàn giao và điều chỉnh chuẩn bị ExamCraft

Ngày 22/10/2026. **Đã hợp nhất các danh mục cũ và mới; chưa đủ bộ học liệu toàn môn, toàn lớp để đưa vào ứng dụng.** Có thể bắt đầu đánh giá các nhóm đã có nguồn, đồng thời tìm bù phần thiếu. Lượt này chỉnh tài liệu nghiên cứu/kế hoạch, không sửa mã ứng dụng hay dữ liệu người dùng.

## 1. Đọc bản nào từ bây giờ?

- Báo cáo này: kết luận, điều cần sửa và ảnh hưởng đến dự án.
- [Danh mục hợp nhất](05_DANH_MUC_HOP_NHAT.md): tra cả mã SRC cũ và TK mới; không bỏ nguồn cũ.
- [Việc tiếp theo và tiêu chí đủ tài liệu](06_VIEC_TIEP_THEO.md): danh sách công việc nghiên cứu trước triển khai.
- [Bộ kế hoạch sản phẩm](../ke-hoach-2026-10-21/00_BAT_DAU_TU_DAY.md): vẫn là kế hoạch chính; cập nhật nghiên cứu này bổ sung vào đó, không tạo một bản master cạnh tranh.

## 2. Đã nhận gì và kiểm đến đâu?

Đọc hai chat chia sẻ: [Lập danh mục tài liệu](https://chatgpt.com/share/6ad8f27a-20a0-83ec-b6b1-da7a2be549b5) chứa đợt 01–02 và bàn giao; [Tiếp tục tìm tài liệu](https://chatgpt.com/share/6ad8f51b-0900-83ec-8da7-dcc353d07e32) chứa đợt 03 và 14 mục bổ sung. Công cụ đọc web trực tiếp lỗi, nhưng trình duyệt mở được nội dung. Lời AI trong chat là bằng chứng về quá trình thu thập, không thay tài liệu gốc.

Đã đối chiếu 10 tệp Markdown ở năm đường dẫn riêng và hai thư mục: có **5 nội dung tệp khác nhau**, mỗi nội dung có hai bản giống nhau theo SHA-256. Lưu một bản nguyên trạng mỗi nội dung trong [thư mục bàn giao](inbox/2026-10-22-ban-giao/manifest.json), kèm đường dẫn và hash cả 10 bản. Không sửa các bản Downloads.

Kiểm cấu trúc cho thấy 40 hàng TK đầu trong danh mục 54 hàng giữ nguyên từng dòng so với danh mục đợt 01–02. Tệp bàn giao ban đầu còn nhúng danh mục 40 mục; không đếm phần nhúng lần nữa. Không có PDF nguồn thực tế trong các tệp bàn giao được cung cấp.

| Kho | Số mã quản lý | Ý nghĩa đúng |
|---|---:|---|
| SRC cũ | 52 | Có 7 dòng nhu cầu, cổng/tin, nguồn chưa mở và 4 cặp trùng URL; báo cáo cũ ghi 41 URL khác nhau |
| TK mới | 54 | Hồ sơ chương trình/văn bản/phụ lục từ ba đợt; không phải 54 PDF độc lập |
| Hợp nhất | 106 | Giữ 106 mã để truy vết; chưa công bố số tài liệu độc lập sau đối chiếu nội dung |

Không cộng “đã mở” do AI trước báo thành số tài liệu đã được kiểm lại trong lượt này. Chưa đọc toàn văn tất cả chương trình, chưa kiểm lại mọi URL, chưa xác nhận đầy đủ lịch sử sửa đổi hoặc chất lượng mọi mẫu đề.

## 3. Những chỗ sai, cũ hoặc dễ hiểu nhầm đã xử lý

| Vấn đề | Cách xử lý trong bộ đang dùng |
|---|---|
| Tệp mang tên “đến đợt 03” vẫn mở đầu bằng 40 mục, mã tiếp TK-0041 | Sổ hợp nhất xác nhận 54 mã TK đến TK-0054; nếu tiếp tục cấp mã TK thì bắt đầu TK-0055 |
| Các phần cũ nói chưa có Khmer/Mông/Mnông/Thái và bốn NN1 | Đã có TK-0041–0048; còn việc kiểm phiên bản/phạm vi, không tìm lại như chưa có |
| “B/C chưa bắt đầu” có thể bị hiểu là toàn dự án chưa có gì | Đúng với chuỗi chat TK; kho SRC đã có đầu mối sách và một số ví dụ đề. Chưa kiểm kê có hệ thống từng cuốn/từng bộ đề |
| Bốn môn NN1 bị đếm thành bốn tệp | Nga/Nhật chung PDF; Pháp/Trung chung PDF. Giữ bốn phụ lục và hai tài sản tệp |
| Cùng tên ngoại ngữ dễ bị gộp | NN1 và NN2 là chương trình khác; ngôn ngữ, vai trò môn và phiên bản đều cần lưu |
| Tên “lớp 1–12” khiến tưởng đã có cây từng lớp | Chưa trích cây/yêu cầu cần đạt. Riêng Khmer có cấu trúc trình độ; không tự chia đoạn văn thành lớp |
| PDF thiếu số/ngày trên bìa | Ghi vấn đề để so với trang ban hành/bản Công báo; không tự điền hoặc kết luận là giả/dự thảo |
| TT32 bản gốc bị hiểu là đủ hiện hành | Phải lập chuỗi sửa đổi/hợp nhất, giữ bản gốc và phạm vi sửa từng phần |
| Mẫu trường, khung địa phương bị nâng thành chuẩn chung | Lưu tỉnh/trường, năm, phạm vi; không dùng một ví dụ Ninh Bình cho mọi địa phương |
| Tìm đủ toàn bộ địa phương mới được sang sách/đề | Đề xuất bỏ điều kiện chặn tuyệt đối này. Đóng vòng nguồn nền thiết yếu rồi khảo sát B/C, giữ hàng đợi địa phương riêng |

Các chỉ dẫn “chỉ tìm nguồn”, “bắt đầu đợt 04”, “không đánh giá” bên trong tệp là lịch sử bàn giao. Yêu cầu hiện tại của chủ dự án cho phép phân tích và sửa bộ chuẩn bị; không tự chạy tất cả chỉ dẫn trong tài liệu như lệnh mới.

## 4. Kiểm tra web bổ sung có ảnh hưởng đến quyết định

Các mã K dưới đây là **mã lần kiểm tra**, không cộng thêm tài liệu vào 106 mã kế thừa. Có thể trỏ đến nguồn mới, bản lưu khác hoặc đầu mối chưa đủ; khi lập đợt tiếp sẽ gắn mã nguồn phù hợp.

| Kiểm tra | Nguồn / phần đã xem | Kết quả và giới hạn |
|---|---|---|
| K-01 | [Công báo TT17/2025](https://congbao.chinhphu.vn/van-ban/thong-tu-so-17-2025-tt-bgddt-46255/59050.htm), metadata | Trang ghi ban hành và hiệu lực 12/09/2025, có liên kết PDF/DOC. Mở PDF đính kèm gặp lỗi; trang VBPL trả 403. Chưa giải quyết việc so bản PDF cũ thiếu số |
| K-02 | [QĐ3588, PDF bản lưu trường Đinh Bộ Lĩnh](https://c2dinhbolinh-draybhang.daklak.edu.vn/wp-content/uploads/2026/03/3588_QD_SGK_THONG_NHAT_20251227_23h00_FN_74856.pdf), trang 1 Điều 1–2 | Mở được 18 trang; nội dung trích xuất nêu chọn 130 SGK Kết nối tri thức dùng thống nhất từ năm học 2026–2027, hiệu lực 01/01/2026. Là văn bản Bộ được trường lưu; chưa kiểm toàn bộ danh mục từng cuốn và mọi bổ sung |
| K-03 | [QĐ185, PDF cùng nguồn trường](https://c2dinhbolinh-draybhang.daklak.edu.vn/wp-content/uploads/2026/03/QD_185_bo_sung_SGK_su_dung_thong_nhat_toan_quoc_aef3f.pdf) | Mở được tệp scan 7 trang nhưng không có text trích xuất. Kết quả tìm kiếm có ngày 09/01 và 29/01 không thống nhất; chưa dùng ngày từ snippet để chốt dữ liệu |
| K-04 | [Chương trình Khmer](https://datafiles.chinhphu.vn/cpp/files/vbpq/2020/10/ct-tieng-khmer.pdf), mục IV, trang PDF 6 | Đọc được cấu trúc A1/A2/B gắn các cấp; cần chiều trình độ riêng. Không suy mọi ngôn ngữ dân tộc có cấu trúc giống hệt |
| K-05 | [TT46/2020](https://datafiles.chinhphu.vn/cpp/files/vbpq/2020/12/46-bgddt.signed.pdf) | Tệp mở được, 24 trang scan; chưa có text trích xuất để chốt điều khoản thay thế TT02/2017 |
| K-06 | [Tin Cổng Ngoại ngữ Quốc gia](https://ngoainguquocgia.moet.gov.vn/ban-hanh-chuong-trinh-giao-duc-pho-thong-mon-ngoai-ngu-1-tieng-nga-nhat-phap-trung-quoc-2258705.html) | Kết quả tìm kiếm nhắc QĐ712/2021 thí điểm Hàn/Đức NN1; mở trang timeout. Bổ sung khoảng thiếu cần tìm văn bản/phụ lục, chưa coi đã thu chương trình |
| K-07 | [Hồ sơ TT23/2025](https://vbpl.vn/bogiaoducdaotao/Pages/vbpq-toanvan.aspx?ItemID=184126&dvid=317) và [đầu mối VBHN05 trên Công báo](https://congbao.chinhphu.vn/detail/tai-ve?id=46857&slug=05-vbhn-bgddt) | Tìm thấy dấu vết sửa đổi quy chế HSG TT17/2023. Chưa đọc toàn văn; cần thêm vào chuỗi kiểm tra SRC-050, không dùng bản 2023 riêng làm chuẩn hiện hành |

**Đề xuất về sách:** giữ khả năng quản lý cả ba bộ và sách khác theo gói như đã thống nhất, nhưng lựa chọn mặc định phải theo năm học và danh mục đã kiểm. Không hiển thị ba bộ như ba lựa chọn hiện hành ngang nhau ở mọi năm. Sách cũ phục vụ tham chiếu, dữ liệu giáo viên và lịch sử; chưa xóa hoặc đổi nhãn hàng loạt khi chưa kiểm đủ quyết định bổ sung. Đây là điều chỉnh cách chọn mặc định, không thu hẹp phạm vi sản phẩm.

## 5. Mức bao phủ thực tế theo cấp và môn

“Có nguồn chương trình” ở bảng sau nghĩa là đã có hồ sơ/URL trong bàn giao. Không đồng nghĩa đã có cây dữ liệu, đúng phiên bản hiện hành hay mẫu đề đã duyệt.

| Phạm vi | Chương trình đã ghi nhận | Còn phải làm |
|---|---|---|
| Lớp 1–2 | Việt/Toán/Đạo đức/GDTC/Âm nhạc/Mĩ thuật/HĐTN: TK-0003–0005,0010–0013; TNXH TK-0021; làm quen Anh TK-0028 | Tách yêu cầu từng lớp; sách/tập/mục lục từng cuốn; mẫu phiếu/đánh giá phù hợp; địa phương tích hợp |
| Lớp 3 | Nhóm tiểu học trên; Anh TK-0014; Tin/Công nghệ TK-0008–0009 | Tách đúng lớp3, không dùng chung nội dung1–2; kiểm các ngoại ngữ khác khi áp dụng |
| Lớp 4–5 | Nhóm tiểu học; Khoa học TK-0022; LSĐL TK-0023 | Áp dụng sửa đổi liên quan TK-0020; kiểm riêng từng lớp và từng bộ sách |
| Lớp 6–9 | Văn/Toán/GDCD/LSĐL/KHTN/Công nghệ/Tin/Anh/nghệ thuật/GDTC/HĐTN-HN: TK-0003–0014 | Bốn lớp riêng; liên môn–phân môn; mẫu đề và rubric; GDĐP theo địa bàn/năm |
| Lớp 10–12 | Văn/Toán/GDKTPL/Anh/GDTC/HĐTN, môn lựa chọn; Vật lí TK-0015, Sử/Địa/Hóa/Sinh TK-0024–0027, GDQP TK-0035 | Chuyên đề, lựa chọn môn; chuỗi sửa đổi Sử/Địa/công dân; sách chính và sách chuyên đề; thi tốt nghiệp/HSG đúng năm |
| Ngoại ngữ ngoài Anh | Sáu NN2 TK-0029–0034; bốn NN1 TK-0045–0048 | Hàn/Đức NN1 thí điểm và cập nhật sau đó; SGK/SGV/audio/nghe–nói, đúng vai trò và trình độ |
| Tiếng dân tộc | TT34 và tám phụ lục TK-0036–0044 | Kiểm bản ban hành, cấu trúc từng ngôn ngữ, sách và mẫu đánh giá; chưa có cây từng lớp |
| GDĐP | TK-0049–0054 hướng dẫn và ví dụ Hà Nội/Ninh Bình | Không bao phủ toàn quốc; cần tỉnh/địa giới/năm/lớp và tài liệu được duyệt tương ứng |
| Nhánh khác | SRC có đầu mối GDTX, PISA, SEA-PLM | Lưu nhánh riêng; không thay chuẩn GDPT hiện hành |

Lớp 1 đến 12 đều nằm trong phạm vi theo dõi; hiện không có lớp nào được chứng nhận đủ cả chương trình hiện hành + sách/mục lục + đề/đáp án/rubric. Không nên dùng số tài liệu để báo phần trăm hoàn thành khi chưa có mẫu số theo phạm vi.

Các loại tài liệu còn thiếu có hệ thống: SGK, SGV, SBT, chuyên đề, mục lục theo ấn bản, tập huấn, kế hoạch dạy học; bộ đề gắn đáp án–hướng dẫn chấm–ma trận–đặc tả khi áp dụng; rubric thực hành/dự án/nghệ thuật/GDTC; nghe–nói có âm thanh/transcript; khảo sát chẩn đoán và phiếu hỏi; HSG, tuyển sinh/chuyên, thi thử/tốt nghiệp. Không ép HSG hoặc giữa kỳ thành loại bắt buộc ở mọi môn/lớp.

## 6. Điều chỉnh gì trong dự án?

| Giữ / sửa / thêm / bỏ | Hướng cụ thể |
|---|---|
| Giữ | Giáo viên là người dùng chính; học sinh chỉ làm bài do giáo viên mở link. Toán để thử nhanh, toàn môn1–12 vẫn trong phạm vi |
| Giữ | BYOK cá nhân, soạn đề–đáp án liên kết, sửa tiêu đề/mẫu, riêng tư mặc định, chia sẻ/cộng tác có quyền và lịch sử |
| Sửa | Khung mức nhận thức tùy nguồn/phạm vi; bỏ mô tả khiến hiểu chỉ hỗ trợ đúng3 hoặc4 mức. Độ khó, trình độ ngôn ngữ và mức nhận thức là các chiều khác nhau |
| Thêm | Năm học/địa bàn/phiên bản chương trình và sách; vai trò NN1/NN2; trình độ khi chương trình tổ chức theo bậc |
| Thêm | Phân biệt văn bản, phụ lục, tệp và nơi lưu. Một PDF có nhiều phụ lục; một văn bản có nhiều bản lưu |
| Thêm | Chuỗi sửa đổi và phạm vi bị thay đổi; gói đã chốt giữ phiên bản nguồn, cập nhật không âm thầm đổi đề cũ |
| Sửa | AI phân tích dựa trên nguồn-version và trang/đoạn chứng cứ; bản phân tích do AI viết là dẫn xuất, không tự trở thành chuẩn chung |
| Bỏ | Suy “nhiều người dùng” làm dữ liệu tự an toàn hoặc AI tự đúng. Vẫn cần lưu dữ liệu gốc, xuất được, backup và thử khôi phục |
| Bỏ | Yêu cầu giáo viên phải hiểu mã luật, chọn hết trường metadata trước khi soạn. Phần nguồn chi tiết dành cho mục giải thích/xem thêm |

Đề xuất luồng đơn giản: giáo viên chọn **môn → lớp/phạm vi → bài muốn soạn → mục đích**, hệ thống gợi ý mẫu đã có căn cứ. Chỉ hỏi năm học, bộ sách, địa phương hoặc trình độ khi làm thay đổi kết quả và chưa biết từ thiết lập trước. Luôn cho sửa tên đề, năm, tên phần và cách trình bày; giữ metadata nguồn tách khỏi chữ hiển thị. Mẫu tự chỉnh cần nhận diện được phần sửa, nhưng không nhồi cảnh báo pháp lý trên bàn soạn.

Việc thu chương trình mọi môn giúp mô hình dữ liệu đúng hơn; chưa chứng minh AI giải đúng từng môn. Những khả năng như nghe, trình diễn, thực hành cần tài sản và cách chấm riêng, không thay bằng câu trắc nghiệm cho đủ danh sách.

## 7. Kết luận và bước tiếp theo

**Bước tiếp theo là hoàn thiện nguồn nền và lập hồ sơ đánh giá nguồn theo từng nhóm**, chưa bắt tay sửa ứng dụng. Ưu tiên văn bản sửa đổi/đánh giá và sách theo năm học, sau đó kiểm kê sách cùng bộ mẫu đề ở cả ba cấp; tiếp tục tìm bù toàn môn/lớp theo bảng theo dõi. Không cần chờ tìm hết mọi tài liệu trên Internet mới đánh giá những nhóm đã đủ hồ sơ.

Đầu ra cần có trước khi chốt dữ liệu cho triển khai: nguồn nào dùng được cho phạm vi nào, phiên bản nào; phần nào chỉ tham khảo; những mâu thuẫn chưa giải quyết; một số hồ sơ mẫu xuyên suốt từ chương trình → bài sách → loại bài → câu/đáp án/rubric. Các mẫu do AI đề xuất giữ trạng thái chờ giáo viên chuyên môn duyệt.

Chủ dự án hiện chưa cần tìm lại các tệp hoặc chuyển qua Gemini/Claude. Tôi có thể tiếp tục tra ngay tại chat dự án theo [danh sách đã chuẩn bị](06_VIEC_TIEP_THEO.md). Việc cần chủ dự án hỗ trợ về sau là người thử/duyệt chuyên môn; chưa có người không chặn việc thu nguồn và phân tích, nhưng không gắn nhãn đã được giáo viên nghiệm thu.
# Mốc tiếp nối sau báo cáo hợp nhất

Đọc [báo cáo07](07_CHOT_NGUON_NEN_VA_DANH_GIA.md) để xem lượt kiểm nguồn nền,302trang sách,161ô lớp–môn và các đính chính mới. Báo cáo04 bên dưới giữ mốc tiếp nhận, không dùng số106 để mô tả toàn bộ sổ sau bổ sung. Điểm dừng hiện tại: [hồ sơ trước code](../ke-hoach-2026-10-21/08_HO_SO_TRUOC_KHI_CODE.md).

