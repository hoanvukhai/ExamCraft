/**
 * The usage guide behind the assistant. Entries describe the screens as they are; a test keeps every button name
 * named here in the source, so a renamed button fails the build instead of silently misleading a teacher.
 */
export type HelpArea = 'soan' | 'kho' | 'giao-bai' | 'chia-se' | 'ai' | 'su-co';
export type HelpEntry = {
  id: string;
  area: HelpArea;
  title: string;
  /** Words a teacher might use; matched without diacritics. */
  keywords: string[];
  steps: string[];
  note?: string;
  needsKey?: boolean;
  /** Buttons and menu items named in the steps; checked against the source by a test. */
  names?: string[];
};

export const HELP: HelpEntry[] = [
  {
    id: 'them-cau',
    area: 'soan',
    title: 'Thêm câu hỏi vào đề',
    keywords: ['them cau', 'tao cau', 'cau moi', 'soan cau', 'them cau hoi', 'them noi dung'],
    steps: [
      'Chọn chỗ muốn thêm trên tờ đề (một câu, một phần hoặc ngữ liệu).',
      'Bấm "Thêm" ở hàng công cụ. Chọn "Từ ngân hàng", "Nhập Word/Ảnh", "Sinh bằng AI", "Phần mới" hoặc "Ngữ liệu".',
      'Hoặc bấm dấu + nhỏ hiện giữa hai câu trên tờ đề để thêm ngay tại đó.',
    ],
    note: 'Câu mới nằm ngay sau mục đang chọn. Đề tự lưu, không cần bấm lưu.',
    names: ['Thêm', 'Từ ngân hàng', 'Nhập Word/Ảnh', 'Sinh bằng AI', 'Phần mới', 'Ngữ liệu'],
  },
  {
    id: 'sua-cau',
    area: 'soan',
    title: 'Sửa nội dung một câu',
    keywords: [
      'sua cau',
      'chinh sua',
      'sua noi dung',
      'sua dap an',
      'doi dap an',
      'sua phuong an',
      'cong thuc',
      'latex',
    ],
    steps: [
      'Bấm vào câu trên tờ đề. Bảng "Chi tiết" bên trái hiện ra đúng câu đó.',
      'Sửa nội dung, phương án, đáp án và lời giải ngay trong bảng. Thay đổi tự áp dụng vào đề.',
      'Bấm vào một phương án hoặc một ý trên tờ đề để nhảy tới đúng ô cần sửa.',
    ],
    note: 'Công thức viết trong dấu $...$ (LaTeX). Câu đang bị khóa thì phải mở khóa mới sửa được.',
    names: ['Chi tiết'],
  },
  {
    id: 'chon-nhieu',
    area: 'soan',
    title: 'Chọn nhiều câu một lúc',
    keywords: ['chon nhieu', 'chon hang loat', 'nhieu cau', 'xoa nhieu', 'di chuyen nhieu', 'gop cau'],
    steps: [
      'Giữ Ctrl (hoặc Shift) rồi bấm các câu trên tờ đề hoặc trong "Dàn ý".',
      'Hàng công cụ đổi theo lựa chọn: chuyển sang phần khác, khóa, xóa, hoặc "Gộp thành 1 câu tự luận".',
    ],
    names: ['Dàn ý', 'Gộp thành 1 câu tự luận'],
  },
  {
    id: 'nhan-ban-xoa',
    area: 'soan',
    title: 'Nhân bản, xóa, đổi thứ tự, khóa câu',
    keywords: [
      'nhan ban',
      'xoa cau',
      'doi thu tu',
      'di chuyen',
      'len xuong',
      'khoa cau',
      'mo khoa',
      'copy cau',
    ],
    steps: [
      'Chọn câu trên tờ đề. Hàng công cụ hiện các nút: "Nhân bản", "Lên", "Xuống", "Khóa", "Xóa".',
      'Nhân bản tạo một câu mới có mã riêng, đứng ngay sau câu gốc.',
      'Câu đã khóa không bị xóa hay sửa nhầm; bấm "Mở khóa" khi cần.',
    ],
    note: 'Xóa nhầm thì bấm "Hoàn tác" ở góc trên bên trái.',
    names: ['Nhân bản', 'Lên', 'Xuống', 'Khóa', 'Xóa', 'Hoàn tác'],
  },
  {
    id: 'hoan-tac',
    area: 'soan',
    title: 'Hoàn tác và làm lại',
    keywords: ['hoan tac', 'undo', 'redo', 'lam lai', 'lay lai', 'xoa nham', 'quay lai'],
    steps: [
      'Bấm "Hoàn tác" hoặc "Làm lại" ở góc trên bên trái (hoặc Ctrl+Z, Ctrl+Y).',
      'Mỗi lần bấm lùi một bước sửa. Chỗ người khác đã sửa sau đó không bị ghi đè.',
    ],
    names: ['Hoàn tác', 'Làm lại'],
  },
  {
    id: 'trang',
    area: 'soan',
    title: 'Chia trang, thêm trang, ngắt trang',
    keywords: [
      'trang',
      'chia trang',
      'them trang',
      'ngat trang',
      'sang trang moi',
      'luoi trang',
      'thu tu trang',
    ],
    steps: [
      'Tờ đề tự chia trang A4; câu không bị cắt đôi giữa hai trang.',
      'Dải trang dưới tờ đề cho xem từng trang thu nhỏ: bấm để tới trang, kéo để đổi thứ tự trang, bấm + để thêm trang.',
      'Muốn một câu bắt đầu ở trang mới: chọn câu rồi bấm "Bắt đầu câu này ở trang mới".',
      'Bấm "Lưới" để xem tất cả các trang cùng lúc.',
    ],
    note: 'Trên điện thoại dùng nút ‹ › cạnh "Trang n/N".',
    names: ['Lưới', 'Bắt đầu câu này ở trang mới', 'Ngắt trang'],
  },
  {
    id: 'sao-chep-dan',
    area: 'soan',
    title: 'Sao chép và dán câu giữa các đề',
    keywords: ['sao chep', 'dan cau', 'copy', 'paste', 'dan sang de khac', 'chuyen cau sang de khac'],
    steps: [
      'Chọn một hoặc nhiều câu, bấm "Sao chép" (hoặc Ctrl+C).',
      'Mở đề khác (hoặc chọn chỗ khác trong đề này), bấm "Dán" (hoặc Ctrl+V).',
    ],
    note: 'Câu dán vào là bản mới có mã riêng, không ảnh hưởng câu gốc.',
    names: ['Sao chép', 'Dán'],
  },
  {
    id: 'thong-tin-de',
    area: 'soan',
    title: 'Sửa tên đề, môn, lớp, thời gian, đầu trang',
    keywords: [
      'ten de',
      'thong tin de',
      'mon',
      'lop',
      'thoi gian',
      'dau trang',
      'truong',
      'nam hoc',
      'ma de',
      'ghi chu cuoi de',
    ],
    steps: [
      'Bấm "Toàn đề" ở hàng công cụ (hoặc bấm vào phần đầu tờ đề). Bảng "Chi tiết" hiện "Thông tin đề".',
      'Sửa tên đề, lớp, môn, thời gian, đơn vị, mã đề, ghi chú cuối đề. Thay đổi tự áp dụng sau khoảng nửa giây.',
      'Muốn sửa riêng một dòng đầu trang, bấm thẳng vào dòng đó trên tờ đề.',
    ],
    note: 'Ở tab "Phạm vi kiến thức" và "Ma trận đề" có nút "Áp dụng" riêng vì đó là bảng lớn cần kiểm trước.',
    names: ['Toàn đề', 'Áp dụng'],
  },
  {
    id: 'in-an',
    area: 'soan',
    title: 'Chỉnh trang in: phông, cỡ chữ, lề, mẫu in',
    keywords: [
      'in',
      'phong chu',
      'co chu',
      'le trang',
      'mau in',
      'bo cuc in',
      'font',
      'dinh dang trang',
      'a4',
    ],
    steps: [
      'Chọn "Toàn đề", mở mục "Trang và in" trong bảng "Chi tiết".',
      'Chọn phông chữ, cỡ chữ và lề. Có nút đặt lại về mặc định.',
      'Bố cục đầu/chân trang: chọn một mẫu in rồi bấm "Áp dụng", hoặc bấm vào từng dòng trên tờ đề để sửa.',
      'Xuất ra giấy: "Xuất" → "In / PDF".',
    ],
    names: ['Toàn đề', 'Trang và in', 'Xuất', 'In / PDF', 'Áp dụng'],
  },
  {
    id: 'xuat-word',
    area: 'soan',
    title: 'Xuất đề ra Word hoặc PDF',
    keywords: ['xuat', 'word', 'docx', 'pdf', 'tai de', 'tai ve', 'in de', 'xuat file', 'dap an', 'loi giai'],
    steps: [
      'Bấm "Xuất" ở thanh trên.',
      'Chọn "Word – đề", "Word – đáp án/barem", "Word – lời giải", "Word – ma trận" hoặc "Word – đề song song".',
      'Muốn PDF hoặc in giấy: chọn "In / PDF", rồi chọn "Lưu thành PDF" trong hộp thoại in của trình duyệt.',
    ],
    note: 'Danh sách "Rà soát đề" chỉ nhắc, không chặn việc xuất file.',
    names: [
      'Xuất',
      'Word – đề',
      'Word – đáp án/barem',
      'Word – lời giải',
      'Word – ma trận',
      'Word – đề song song',
      'In / PDF',
    ],
  },
  {
    id: 'trinh-chieu',
    area: 'soan',
    title: 'Trình chiếu đề trên lớp',
    keywords: ['trinh chieu', 'chieu len man hinh', 'present', 'man hinh lon', 'chieu de'],
    steps: [
      'Bấm "Xuất" → "Trình chiếu". Bắt đầu từ câu đang chọn.',
      'Dùng mũi tên trái/phải để đổi câu, phím Space để hiện/ẩn đáp án, Home/End về đầu/cuối.',
      'Bấm "Toàn màn hình" để chiếu rộng. Trình chiếu không làm thay đổi đề.',
    ],
    names: ['Xuất', 'Trình chiếu', 'Toàn màn hình'],
  },
  {
    id: 'tron-de',
    area: 'soan',
    title: 'Trộn mã đề',
    keywords: ['tron de', 'ma de', 'hoan vi', 'nhieu ma de', 'dao cau', 'dao dap an'],
    steps: [
      'Bấm "Xuất" → "Trộn mã đề…".',
      'Hệ thống đảo thứ tự câu trong từng phần và đảo phương án, giữ nguyên khối ngữ liệu dùng chung và cập nhật lời giải theo chữ cái mới.',
      'Có bảng đáp án tổng hợp cho các mã đề.',
    ],
    names: ['Xuất', 'Trộn mã đề…'],
  },
  {
    id: 'ngan-hang',
    area: 'soan',
    title: 'Dùng ngân hàng câu hỏi',
    keywords: ['ngan hang', 'kho cau hoi', 'cau co san', 'luu cau', 'tim cau hoi', 'bank'],
    steps: [
      'Trong trang soạn bấm "Ngân hàng" ở thanh bên trái, lọc theo môn, lớp, độ khó rồi chọn câu để thêm vào chỗ đang chọn.',
      'Muốn lưu một câu vào ngân hàng: chọn câu rồi chọn lưu vào ngân hàng ở bảng "Chi tiết".',
      'Quản lý toàn bộ ngân hàng ở menu "Ngân hàng câu hỏi" (trang Kho đề).',
    ],
    names: ['Ngân hàng', 'Ngân hàng câu hỏi'],
  },
  {
    id: 'nhap-de',
    area: 'soan',
    title: 'Nhập đề từ Word, ảnh hoặc văn bản',
    keywords: [
      'nhap de',
      'import',
      'tu word',
      'tu anh',
      'dan van ban',
      'ocr',
      'file word',
      'chuyen de cu',
      'dua de co san',
    ],
    steps: [
      'Bấm "Nhập đề" ở thanh bên trái.',
      'Dán văn bản (không cần khóa AI), hoặc tải file Word/ảnh (cần khóa AI).',
      'Xem bản xem trước, sửa nếu cần rồi nhận vào đúng chỗ đang chọn.',
    ],
    note: 'Kết quả chỉ được nhận vào đề khi bạn đồng ý; lỗi giữa chừng không để lại gì.',
    names: ['Nhập đề'],
  },
  {
    id: 'ai-trong-de',
    area: 'ai',
    title: 'Dùng AI để sửa đề và sinh câu',
    keywords: [
      'ai',
      'tro ly',
      'sinh cau',
      'sua bang ai',
      'doi so lieu',
      'tang do kho',
      'tham dinh',
      'kiem tra dap an',
    ],
    needsKey: true,
    steps: [
      'Bấm "AI" ở hàng công cụ để mở bảng AI.',
      '"Trò chuyện": gõ yêu cầu như "đổi số liệu câu 2". AI đề xuất, bạn xem rồi bấm "Áp dụng".',
      '"Sinh câu": sinh câu mới vào đúng chỗ đang chọn, xem trước rồi mới nhận.',
      '"Thẩm định": kiểm tra đáp án của một câu đang chọn.',
    ],
    note: 'Cần khóa AI cá nhân. AI chỉ đề xuất; không có gì đổi trong đề cho tới khi bạn đồng ý.',
    names: ['AI', 'Trò chuyện', 'Sinh câu', 'Thẩm định', 'Áp dụng'],
  },
  {
    id: 'khoa-ai',
    area: 'ai',
    title: 'Thêm khóa AI (Gemini)',
    keywords: [
      'khoa ai',
      'api key',
      'key',
      'gemini',
      'them khoa',
      'chua co khoa',
      'het luot',
      'het quota',
      'het han muc',
    ],
    steps: [
      'Bấm "Thêm khóa AI" trong bảng AI (hoặc biểu tượng chìa khóa ở thanh trên).',
      'Dán khóa Gemini của bạn. Khóa được mã hóa trên máy chủ.',
      'Có thể thêm nhiều khóa; hết hạn mức ở khóa này hệ thống tự thử khóa khác.',
    ],
    note: 'Hết hạn mức ở mọi khóa: thêm khóa hoặc đợi rồi bấm gửi lại; chưa có gì bị áp dụng dở.',
    names: ['Thêm khóa AI'],
  },
  {
    id: 'luu',
    area: 'soan',
    title: 'Đề có tự lưu không? Chấm tròn cạnh tên đề là gì?',
    keywords: [
      'luu',
      'tu luu',
      'da luu',
      'cham tron',
      'dang cho luu',
      'mat ket noi',
      'ban nhap',
      'offline',
      'mat mang',
    ],
    steps: [
      'Đề tự lưu liên tục; bạn không cần bấm lưu.',
      'Chấm xanh "Đã lưu": xong. "Đang chờ lưu/Đang lưu…": đang xử lý. Chấm vàng: cần xem.',
      'Bấm vào chấm để mở bảng chi tiết: "Thử lưu lại", "Tải bản nháp", và các lựa chọn khi có xung đột.',
      'Mất mạng: đề giữ bản nháp trên máy và tự đồng bộ khi có mạng.',
    ],
    names: ['Thử lưu lại', 'Tải bản nháp'],
  },
  {
    id: 'cung-soan',
    area: 'chia-se',
    title: 'Mời đồng nghiệp cùng soạn và góp ý',
    keywords: [
      'moi',
      'cung soan',
      'dong nghiep',
      'gop y',
      'phan quyen',
      'chia se quyen',
      'nguoi khac sua',
      'xung dot',
      'ai dang mo',
    ],
    steps: [
      'Bấm "Mời" ở thanh trên, nhập email đồng nghiệp và chọn quyền: xem, góp ý hoặc sửa.',
      'Người cùng sửa thấy avatar nhau trên thanh trên và viền nét đứt quanh chỗ người kia đang làm.',
      'Hai người sửa chỗ khác nhau thì hệ thống tự ghép. Sửa cùng một chỗ thì hiện lựa chọn giữ bản nào trong bảng trạng thái lưu.',
      'Bấm "Góp ý" để gửi và xem góp ý, đánh dấu đã giải quyết.',
    ],
    note: 'Đây không phải gõ chung theo thời gian thực: cập nhật sau vài giây.',
    names: ['Mời', 'Góp ý'],
  },
  {
    id: 'giao-bai',
    area: 'giao-bai',
    title: 'Giao bài cho học sinh',
    keywords: [
      'giao bai',
      'phong thi',
      'hoc sinh lam bai',
      'link lam bai',
      'thi online',
      'ma vao bai',
      'gio mo',
      'gio dong',
      'so luot',
    ],
    steps: [
      'Bấm "Giao bài" ở thanh trên và chọn giao theo lớp hoặc cho học sinh tự điền tên.',
      'Đặt thời lượng, giờ mở/đóng, số lượt, mã vào bài, trộn câu/đáp án nếu cần.',
      'Bấm tạo phòng thi, sao chép liên kết gửi học sinh. Đề được chụp bất biến lúc giao, sửa đề sau đó không ảnh hưởng bài đã giao.',
    ],
    names: ['Giao bài'],
  },
  {
    id: 'ket-qua',
    area: 'giao-bai',
    title: 'Xem điểm, chấm tự luận, sửa đáp án và chấm lại',
    keywords: [
      'ket qua',
      'diem',
      'bang diem',
      'cham tu luan',
      'cham lai',
      'sua dap an sau khi nop',
      'bai da giao',
      'xuat excel',
      'csv',
    ],
    steps: [
      'Mở "Bài đã giao" ở menu và chọn đợt giao.',
      'Xem bảng điểm, bấm "Xem bài" để chấm câu tự luận, "Xuất Excel (CSV)" để tải bảng điểm.',
      'Đáp án nhầm: vào "Phân tích câu hỏi" → "Sửa đáp án và chấm lại", xem trước ảnh hưởng rồi áp dụng. Điểm đã chấm tay được giữ.',
    ],
    names: ['Bài đã giao'],
  },
  {
    id: 'chia-se-link',
    area: 'chia-se',
    title: 'Chia sẻ đề bằng liên kết',
    keywords: ['link chia se', 'chia se de', 'gui de', 'lien ket', 'thu hoi link', 'tao ban sao', 'xem de'],
    steps: [
      'Bấm "Giao bài" rồi chọn thẻ liên kết xem/tải Word.',
      'Chọn kèm đáp án và lời giải hay không, cho phép tạo bản sao hay không, rồi tạo liên kết.',
      'Liên kết gắn với phiên bản lúc tạo; sửa đề sau đó cần tạo liên kết mới. Có nút thu hồi.',
    ],
    names: ['Giao bài'],
  },
  {
    id: 'kho-de',
    area: 'kho',
    title: 'Quản lý Kho đề: thư mục, gắn sao, thùng rác',
    keywords: [
      'kho de',
      'thu muc',
      'gan sao',
      'thung rac',
      'khoi phuc',
      'tim de',
      'danh sach de',
      'xoa de',
      'tao de moi',
    ],
    steps: [
      'Mở menu (biểu tượng ba gạch) → "Về Kho đề". Tạo đề mới bằng "Tạo đề mới".',
      'Sắp đề vào thư mục, gắn sao đề quan trọng, tìm theo tên.',
      'Đề xóa vào "Thùng rác" và khôi phục được trước khi bị xóa hẳn.',
    ],
    names: ['Về Kho đề', 'Tạo đề mới', 'Thùng rác'],
  },
  {
    id: 'lop-hoc',
    area: 'giao-bai',
    title: 'Lớp học và mã PIN học sinh',
    keywords: ['lop hoc', 'danh sach lop', 'pin', 'ma pin', 'hoc sinh', 'them hoc sinh', 'nhom'],
    steps: [
      'Mở menu → "Lớp học", tạo lớp và thêm danh sách học sinh.',
      'Muốn kiểm soát danh tính: cấp mã PIN cho từng học sinh từ trang lớp; danh sách PIN chỉ hiện một lần.',
      'Khi giao bài theo lớp, bật yêu cầu PIN nếu cần.',
    ],
    names: ['Lớp học'],
  },
  {
    id: 'su-co-xung-dot',
    area: 'su-co',
    title: 'Báo "xung đột phiên bản" hoặc "có người vừa lưu"',
    keywords: ['xung dot', 'phien ban', 'co nguoi vua luu', 'bi ghi de', 'conflict', 'khong luu duoc'],
    steps: [
      'Bản nháp của bạn luôn được giữ; chưa có gì bị ghi đè.',
      'Nếu hai bên sửa chỗ khác nhau, hệ thống tự ghép. Nếu cùng một chỗ, mở bảng trạng thái lưu (chấm cạnh tên đề) và chọn "Của tôi" hoặc "Của người kia".',
      'Còn nghi ngờ: bấm "Tải bản nháp" để giữ một bản tệp, hoặc lưu bản nháp thành đề mới.',
    ],
    names: ['Tải bản nháp'],
  },
  {
    id: 'su-co-word',
    area: 'su-co',
    title: 'Không tải được file Word hoặc file bị lỗi',
    keywords: ['khong tai duoc word', 'loi word', 'file word loi', 'khong xuat duoc', 'docx loi'],
    steps: [
      'Thử lại "Xuất" → "Word – đề". Nếu đề rất dài, chờ vài giây cho xuất xong.',
      'Kiểm tra công thức hoặc hình trong câu có sai cú pháp không (mở "Rà soát đề").',
      'Vẫn lỗi: xuất bằng "In / PDF" để có bản in tạm, và báo lại câu bị lỗi.',
    ],
    names: ['Xuất', 'Rà soát đề', 'In / PDF'],
  },
  {
    id: 'su-co-hoc-sinh',
    area: 'su-co',
    title: 'Học sinh báo không vào được bài',
    keywords: [
      'hoc sinh khong vao duoc',
      'khong vao duoc bai',
      'sai ma',
      'het gio',
      'phong thi dong',
      'khong mo duoc link',
    ],
    steps: [
      'Kiểm tra giờ mở/đóng, số lượt còn lại và mã vào bài của đợt giao.',
      'Gửi lại đúng liên kết phòng thi; học sinh cần mã PIN riêng nếu bạn bật yêu cầu PIN.',
      'Vẫn không vào được: thử "Vào phòng thi thử" để chắc phòng đang mở.',
    ],
    names: [],
  },
];

export const foldText = (text: string) =>
  text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const STOP = new Set([
  'la',
  'o',
  'cho',
  'toi',
  'minh',
  'the',
  'nao',
  'sao',
  'lam',
  'va',
  'cua',
  'co',
  'khong',
  'duoc',
  'nhu',
  'de',
  'mot',
  'cac',
  'nay',
  'thi',
  'bi',
  'em',
  'xin',
  'hay',
  'giup',
  'huong',
  'dan',
  'cach',
  'tren',
  'trong',
  'ai',
]);

export type HelpMatch = { best: HelpEntry | null; others: HelpEntry[]; confident: boolean };

/** Rank guide entries for a question. `confident` is true only when one entry clearly wins. */
export function searchHelp(question: string, entries: HelpEntry[] = HELP): HelpMatch {
  const text = ' ' + foldText(question) + ' ';
  const words = foldText(question)
    .split(' ')
    .filter((word) => word.length > 1 && !STOP.has(word));
  const scored = entries
    .map((entry) => {
      let score = 0;
      for (const keyword of entry.keywords)
        if (text.includes(' ' + keyword + ' ') || text.includes(' ' + keyword))
          score += keyword.includes(' ') ? 4 : 2.5;
      const title = ' ' + foldText(entry.title) + ' ';
      for (const word of words) if (title.includes(' ' + word)) score += 1;
      for (const keyword of entry.keywords)
        for (const part of keyword.split(' ')) if (part.length > 2 && words.includes(part)) score += 0.5;
      return { entry, score };
    })
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return { best: null, others: [], confident: false };
  const [first, second] = scored;
  const confident = first.score >= 4 && (!second || first.score >= second.score * 1.25);
  return { best: first.entry, others: scored.slice(1, 4).map((item) => item.entry), confident };
}

/** Plain text of an entry, as shown to a teacher. */
export function formatHelp(entry: HelpEntry): string {
  return [
    `${entry.title.toUpperCase()}`,
    ...entry.steps.map((step, index) => `${index + 1}. ${step}`),
    ...(entry.note ? [`Lưu ý: ${entry.note}`] : []),
  ].join('\n');
}

/** Guide entries worth offering for what is selected in the editor. */
export function suggestForSelection(kind: string): string[] {
  switch (kind) {
    case 'exam':
      return ['thong-tin-de', 'in-an', 'xuat-word', 'giao-bai'];
    case 'question':
    case 'choice':
    case 'statement':
    case 'item':
    case 'pair':
    case 'order':
    case 'figure':
      return ['sua-cau', 'nhan-ban-xoa', 'sao-chep-dan', 'ai-trong-de'];
    case 'part':
    case 'group':
      return ['them-cau', 'chon-nhieu', 'trang'];
    case 'page':
      return ['trang', 'in-an'];
    case 'print':
      return ['in-an', 'thong-tin-de'];
    default:
      return ['them-cau', 'sua-cau', 'luu'];
  }
}
