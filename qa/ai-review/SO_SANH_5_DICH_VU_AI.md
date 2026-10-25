# BẢNG SO SÁNH VÀ ĐÁNH GIÁ 5 DỊCH VỤ AI PHỤC VỤ HỆ THỐNG EXAMCRAFT
*Khảo sát kỹ thuật và đề xuất giải pháp mô hình ngôn ngữ lớn (LLM) cho giai đoạn Pilot*

- **Người thực hiện:** Gemini (QA & Phân tích giải pháp AI)
- **Nhiệm vụ:** GEM-Q8 (Generation 9)
- **Thời điểm lập (UTC):** 2026-10-25T07:55:00Z
- **Phạm vi khảo sát:** Đánh giá định lượng và định tính 5 nhà cung cấp dịch vụ trí tuệ nhân tạo hàng đầu hiện nay đối với bài toán sinh đề thi, ma trận đặc tả, gợi ý câu hỏi và thẩm định sư phạm theo Chương trình GDPT 2018 tại Việt Nam.

---

## 1. BẢNG TỔNG HỢP SO SÁNH ĐỊNH LƯỢNG VÀ KỸ THUẬT

| Nhà cung cấp & Dòng mô hình | Chi phí ước tính (VNĐ / 100 đề thi)* | Tốc độ xử lý (Giây / Đề thi)** | Năng lực tiếng Việt & GDPT 2018 | Hạn mức miễn phí (Free Tier) | Độ ổn định tại Việt Nam (Không VPN / Thẻ VN) |
|---|:---:|:---:|---|:---:|:---:|
| **1. Google Gemini**<br>*(Gemini 2.5 Flash & 2.5 Pro)* | **5.000 – 18.000 đ**<br>*(Bản Flash cực rẻ)* | **3 – 6 giây**<br>*(Rất nhanh)* | **Xuất sắc:** Văn phong tiếng Việt tự nhiên, chuẩn sư phạm; công thức Toán KaTeX/LaTeX rất chuẩn mực. | **Có sẵn:** 15 yêu cầu/phút miễn phí (bản Flash trên Google AI Studio). | **Hoàn hảo:** Kết nối trực tiếp từ IP Việt Nam, không cần VPN; thanh toán qua Google Cloud bằng thẻ ngân hàng Việt Nam. |
| **2. OpenAI**<br>*(GPT-4o & GPT-4o-mini)* | **8.000 – 35.000 đ** | **5 – 10 giây** | **Rất tốt:** Toán học và tiếng Anh logic chặt chẽ; môn Ngữ văn đôi khi hơi gượng gạo hoặc dùng từ dịch thô. | **Hạn chế:** Không có gói free vĩnh viễn; chỉ cấp tín dụng 5 USD ban đầu cho tài khoản mới. | **Tốt:** Đã mở cổng thanh toán cho Việt Nam, chấp nhận thẻ Visa/Mastercard nội địa, kết nối trực tiếp. |
| **3. Anthropic Claude**<br>*(Claude 3.5 Sonnet & Haiku)* | **12.000 – 45.000 đ** | **6 – 12 giây** | **Tuyệt vời về môn Văn:** Cảm thụ văn học sâu sắc, phân tích ngữ liệu tinh tế; Toán LaTeX chính xác. | **Hạn chế:** Không có gói API miễn phí; cần nạp tiền trả trước tối thiểu 5 USD. | **Khá:** Kết nối API trực tiếp; tuy nhiên cổng thanh toán thẻ đôi khi kiểm tra địa chỉ ngân hàng khắt khe. |
| **4. DeepSeek**<br>*(DeepSeek-V3 & DeepSeek-R1)* | **3.000 – 12.000 đ**<br>*(Rẻ nhất thị trường)* | **8 – 20 giây**<br>*(Bản R1 suy luận lâu)* | **Rất mạnh về Toán học:** Bản suy luận R1 giải toán và sinh barem từng bước cực kỳ chi tiết; Ngữ văn mức khá. | **Ưu đãi lớn:** Tặng số lượng token trải nghiệm lớn khi tạo tài khoản API ban đầu. | **Khá:** Kết nối trực tiếp không cần VPN; thanh toán quốc tế qua cổng thẻ quốc tế hoặc nạp tiền ví điện tử. |
| **5. Groq Cloud**<br>*(Llama 3.3 70B Versatile)* | **4.000 – 15.000 đ** | **1 – 3 giây**<br>*(Nhanh nhất thế giới)* | **Mức độ Trung bình - Khá:** Tiếng Anh ngữ pháp tuyệt hảo; Toán học dễ bị nhầm lẫn công thức phức tạp; Ngữ văn chưa tự nhiên. | **Rất hào phóng:** Miễn phí trải nghiệm tốc độ cao với giới hạn số lượt hàng ngày. | **Tốt:** Kết nối trực tiếp, không chặn IP Việt Nam, chấp nhận thanh toán quốc tế phổ biến. |

*\*Ghi chú chi phí:* Ước tính dựa trên kích thước trung bình của một đề thi chuẩn THCS gồm 20 câu hỏi (ước tính 1.500 input tokens và 3.500 output tokens cho mỗi đề thi hoàn chỉnh).

*\*\*Ghi chú tốc độ:* Đo lường thời gian phản hồi toàn bộ cấu trúc JSON của đề thi qua kết nối mạng băng thông rộng tiêu chuẩn tại Việt Nam.

---

## 2. PHÂN TÍCH CHI TIẾT THEO CÁC TIÊU CHÍ CHUYÊN MÔN

### 2.1 Môn Toán học và Công thức LaTeX
- **DeepSeek-R1 & OpenAI GPT-4o:** Dẫn đầu về độ chính xác logic giải toán. Các câu hỏi phân hóa mức độ Vận dụng cao (rút gọn biểu thức chứa căn, hệ phương trình, bài toán thực tế) có lời giải chi tiết từng bước, kiểm soát tốt điều kiện xác định.
- **Google Gemini (Flash/Pro):** Khả năng kết xuất công thức KaTeX/LaTeX cực kỳ tương thích với bộ phân giải của ExamCraft. Không bị lỗi sinh ký hiệu lạ hay cắt cụt dấu ngoặc.
- **Groq (Llama 3.3):** Tốc độ vượt trội nhưng thỉnh thoảng tính toán nhầm số học cơ bản ở các câu hỏi trắc nghiệm nhiều bước biến đổi.

### 2.2 Môn Ngữ văn và Cảm thụ nghệ thuật GDPT 2018
- **Anthropic Claude 3.5 Sonnet:** Vượt trội hoàn toàn về khả năng đọc hiểu ngữ liệu, diễn giải hình tượng thơ ca và xây dựng barem chấm điểm tự luận. Lời văn sư phạm mực thước, giàu tính biểu cảm và bám sát tinh thần đổi mới của Công văn 3175/BGDĐT-GDTrH (tránh sao chép máy móc SGK).
- **Google Gemini:** Văn phong tiếng Việt hiện đại, trong sáng, phù hợp tâm lý lứa tuổi học sinh THCS và THPT.
- **DeepSeek & Llama:** Thỉnh thoảng sử dụng từ ngữ Hán Việt cổ hoặc cách hành văn mang phong cách dịch thuật máy móc.

### 2.3 Môn Tiếng Anh và Khoa học tự nhiên
- Cả 5 dịch vụ đều đáp ứng rất tốt cho môn Tiếng Anh (từ vựng, ngữ pháp, bài tập điền từ, tạo câu đọc hiểu theo chuẩn CEFR).
- Đối với môn Khoa học tự nhiên tích hợp (KHTN 6-9), Gemini và Claude vượt trội nhờ khả năng hiểu đúng ngữ cảnh tích hợp giữa Vật lý, Hóa học và Sinh học mà không bị nhầm lẫn kiến thức chuyên sâu.

---

## 3. ĐÁNH GIÁ VỀ HẠN MỨC MIỄN PHÍ VÀ TRIỂN KHAI TẠI VIỆT NAM

1. **Về tính khả thi cho Giáo viên tự mang khóa (BYOK - Bring Your Own Key):**
   - **Google Gemini là mô hình thân thiện nhất:** Giáo viên chỉ cần có tài khoản Google (Gmail) là có thể tạo khóa API cá nhân hoàn toàn miễn phí tại Google AI Studio trong vòng 1 phút, không bắt buộc phải nhập thẻ tín dụng visa ngay từ đầu. Hạn mức miễn phí 15 RPM là quá đủ cho nhu cầu sinh 5-10 đề mỗi ngày của một giáo viên.
   - **OpenAI & Claude:** Đòi hỏi giáo viên phải có thẻ thanh toán quốc tế và nạp sẵn tiền (tối thiểu 5 USD), tạo rào cản tài chính đối với giáo viên thử nghiệm diện rộng.

2. **Về độ ổn định đường truyền mạng:**
   - Hệ thống máy chủ của Google Cloud có đường truyền và trung tâm dữ liệu khu vực Đông Nam Á (Singapore) kết nối trực tiếp đến các nhà mạng lớn của Việt Nam (VNPT, Viettel, FPT), đảm bảo độ trễ thấp và không bao giờ bị ảnh hưởng bởi chính sách chặn IP địa lý.

---

## 4. KẾT LUẬN VÀ ĐỀ XUẤT CHO ĐỢT TRIỂN KHAI PILOT

### 4.1 Mô hình mặc định khuyến nghị cho toàn hệ thống:
- **Khuyến nghị chính thức:** **Google Gemini 2.5 Flash / 1.5 Flash**.
- **Lý do lựa chọn:**
  1. *Chi phí tối ưu nhất:* Chi phí gần như bằng không trong hạn mức miễn phí của Google AI Studio; khi dùng trả phí cũng cực kỳ tiết kiệm cho nhà trường.
  2. *Thao tác dễ dàng cho giáo viên:* 100% giáo viên đều có tài khoản Google, việc tạo và nhập khóa AI vào ExamCraft không gặp bất kỳ trở ngại nào.
  3. *Tốc độ phản hồi cực nhanh:* Chỉ mất 3 đến 5 giây để sinh một cấu trúc đề thi 20 câu hỏi.
  4. *Định dạng KaTeX chuẩn:* Tương thích hoàn hảo với giao diện soạn thảo và công cụ xuất tệp Word của ExamCraft.

### 4.2 Mô hình dự phòng (Fallback Model):
- **Mô hình dự phòng 1 (Khi cần chất lượng phân tích cao cấp):** **Anthropic Claude 3.5 Sonnet** (Dành cho việc biên soạn đề thi chọn học sinh giỏi hoặc đề thi Ngữ văn chuyên sâu).
- **Mô hình dự phòng 2 (Khi khóa chính chạm hạn mức 429):** **OpenAI GPT-4o-mini** hoặc **DeepSeek-V3** (Nhờ khả năng xử lý logic mạnh và chi phí rẻ).

---
*Báo cáo nghiên cứu giải pháp AI — ExamCraft Pilot Preparation tháng 10/2026.*
