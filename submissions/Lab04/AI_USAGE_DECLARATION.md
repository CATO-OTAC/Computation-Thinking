# AI Usage Declaration & Human-AI Collaboration Log
**Course:** CSC10014 / Computational Thinking / 2026  
**Group ID:** Group 02  
**Tên đề tài / Project:** Trợ lý Ảo Lập Kế hoạch Du lịch Cá nhân hóa (Personalized Travel Planner Assistant)  
**Lab Assignment:** Lab 04 – From Spec to Code: Phased Vibe-coding with AI  
**Package ID:** Lab04 - Group 02  
**Date:** November 2026  
**Policy Compliance:** Academic & Industry AI Usage Transparency Standards  

---

## 1. Overview of AI Assistance

In accordance with the transparent software development guidelines of the Computational Thinking course and academic integrity policies, this document declares the complete scope, tools, prompts, verification procedures, and ethical safeguards utilized in vibe-coding the **Trợ lý Ảo Lập Kế hoạch Du lịch Cá nhân hóa (Personalized Travel Planner Assistant)** ecosystem.

Large Language Models (LLMs) were utilized strictly as **pair-programming assistants**, **ideation partners**, and **architectural sounding boards**. All core business algorithms, mathematical abstractions, database schemas, validation pipelines, and final codebase integrations were reviewed, modified, and rigorously verified by human team members.

---

## 2. Tools and Models Used

| Thành viên | Mô hình AI sử dụng | Môi trường / Nền tảng | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Từ Nguyễn Thuận Thiên** | Google Gemini 1.5 Flash | Web Interface | Tham vấn phương pháp thu thập/chuẩn hóa dataset du lịch và cấu trúc phần báo cáo Input/Output |
| **Nguyễn Thị Hoàng Châu** | Google Gemini / ChatGPT | Web Interface | Tham khảo cách xây dựng bảng câu hỏi khảo sát Likert 1–5 và hệ thống phân loại Tag chủ đề |
| **Nguyễn Huỳnh Khánh Như** | Anthropic Claude 3.5 Sonnet / GPT-4 | VS Code / Web | Hỗ trợ cấu trúc bố cục giao diện web (Flexbox/Grid), thuật toán duyệt địa điểm và kết nối API |
| **Nguyễn Bạch Thành Nhân** | Anthropic Claude 3.5 Sonnet | VS Code / Web | Xây dựng kịch bản kiểm thử (Test Scenarios), validation form đăng ký và rà soát báo cáo |
| **Nguyễn Bình An** | Claude 3.5 Sonnet / GPT-4 | VS Code / Antigravity | Vibe-code module xác thực người dùng, bảo mật mật khẩu PBKDF2, thiết kế Responsive CSS và tổng hợp báo cáo |

---

## 3. Granular Breakdown of AI vs. Human Contributions

### 3.1 Feature 1: Chức năng Nhập Thông Tin & Xác Thực Người Dùng (`ft1`)
*(Phụ trách: Nguyễn Bình An, Nguyễn Bạch Thành Nhân)*

| Thành phần / Tác vụ | Đóng góp của AI | Đóng góp và Kiểm chứng của Con người |
| :--- | :--- | :--- |
| **Kiến trúc Luồng Xác thực (Auth Flow)** | Gợi ý cấu trúc trạng thái form: Login, Register, Forgot Password, Reset Password, Dashboard. | Điều chỉnh luồng nghiệp vụ theo thực tế: Bắt buộc người dùng tích chọn "Tôi đồng ý với Điều khoản sử dụng & Chính sách bảo mật" mới kích hoạt nút Tạo tài khoản; giữ nguyên dữ liệu đã nhập khi mở modal điều khoản. |
| **Bảo mật Mật khẩu Backend** | Đề xuất thuật toán băm mật khẩu `PBKDF2-HMAC-SHA256` với 100,000 vòng lặp và Salt ngẫu nhiên. | Kiểm tra tính bất đối xứng, bổ sung lớp Repository trừu tượng (`AuthRepositoryBase`) hỗ trợ chuyển đổi linh hoạt giữa lưu trữ tệp tin cục bộ JSON và cơ sở dữ liệu Supabase/PostgreSQL. |
| **Giao diện Responsive & Trực quan** | Tạo khung HTML/CSS ban đầu với bố cục 2 cột (Panel trực quan bên phải và Form nhập liệu bên trái). | Tinh chỉnh chuẩn font Manrope, xử lý icon ẩn/hiện mật khẩu dạng SVG sắc nét, thiết kế các banner thông báo thành công/thất bại đạt chuẩn trải nghiệm người dùng (UX). |
| **Form Validation Phía Client** | Cung cấp regex kiểm tra định dạng email và mật khẩu. | Bổ sung hộp kiểm tra trực quan các điều kiện mật khẩu (ít nhất 8 ký tự, có chữ hoa, chữ thường và chữ số) hiển thị màu xanh/xám theo thời gian thực. |

---

### 3.2 Feature 2, 3: Chức năng Đề Xuất Lịch Trình Chuyến Đi Đa Điều Kiện (`ft2,3`)
*(Phụ trách: Từ Nguyễn Thuận Thiên, Nguyễn Huỳnh Khánh Như)*

| Thành phần / Tác vụ | Đóng góp của AI | Đóng góp và Kiểm chứng của Con người |
| :--- | :--- | :--- |
| **Cấu trúc Dữ liệu & Dataset** | Hướng dẫn cấu trúc JSON phân cấp cho các địa điểm POI (Point of Interest). | Thành viên Thiên trực tiếp thu thập dữ liệu thực tế tại Đà Lạt và Nha Trang, chuẩn hóa 100% tọa độ GPS (lat/lng), khoảng giá và link Google Maps vào Google Sheets. |
| **Công thức Khoảng cách & Độ tương đồng** | Cung cấp mã nguồn hàm lượng giác Haversine và độ tương đồng tập hợp Jaccard Similarity. | Kiểm thử tính toán so khớp khoảng cách thực tế trên bản đồ số; thêm chốt chặn an toàn khi tập hợp rỗng tránh lỗi chia cho 0 (`ZeroDivisionError`). |
| **Quy tắc Kiểm tra Ngân sách (Budget Guardrail)** | Đề xuất công thức ước tính chi phí tối thiểu theo số phòng khách sạn và tiền ăn. | Hiệu chỉnh hệ số giá sát thị trường du lịch Việt Nam: $\text{Phòng} = \lceil \frac{\text{Số người}}{2} \rceil$, tiền ăn tối thiểu 150.000 VNĐ/người/ngày; trả về cảnh báo trực quan thay vì mã lỗi HTTP 400 gây gián đoạn UI. |
| **Tối ưu Hóa Lịch trình Ngày** | Gợi ý phân bổ 6 khung giờ hoạt động trong ngày kèm thời gian nghỉ ngơi. | Bổ sung cơ chế chống trùng lặp địa điểm (`used_attraction_ids`) giữa các ngày trong toàn bộ hành trình. |

---

### 3.3 Feature 3: Chức năng Khảo Sát & Vòng Lặp Phản Hồi Chất Lượng Thuật Toán (`ft4`)
*(Phụ trách: Nguyễn Thị Hoàng Châu, Nguyễn Huỳnh Khánh Như)*

| Thành phần / Tác vụ | Đóng góp của AI | Đóng góp và Kiểm chứng của Con người |
| :--- | :--- | :--- |
| **Xây dựng Bộ Câu hỏi Khảo sát** | Gợi ý danh mục các tiêu chí đánh giá trải nghiệm phần mềm cơ bản. | Thành viên Châu trực tiếp biên soạn bộ 10 câu hỏi chuẩn hóa theo thang đo Likert 1–5, chia đều vào 3 nhóm chủ đề cốt lõi gắn liền với chất lượng thuật toán du lịch. |
| **Gắn Thẻ (Tagging) & Lưu trữ Kép** | Gợi ý ghi dữ liệu ra tệp tin CSV bằng thư viện chuẩn Python. | Tích hợp mã hóa `utf-8-sig` (UTF-8 BOM) để khi mở file CSV trong Microsoft Excel không bị lỗi font tiếng Việt; đồng thời ghi song song ra file `survey_responses.json` để phục vụ phân tích máy tính. |
| **Kiểm soát Tính Toàn vẹn Dữ liệu** | Đề xuất validate tất cả câu hỏi trước khi gửi request. | Triển khai giao diện cuộn mượt và cảnh báo đỏ nổi bật khi người dùng bỏ sót câu hỏi nào chưa đánh giá. |

---

## 4. Specific Prompt Logs & Engineering Iterations

### Nhật ký Prompt 1: Thu thập & Chuẩn bị Dataset (Từ Nguyễn Thuận Thiên)
- **Thời gian:** 05:00 ngày 04/11/2026  
- **Công cụ:** Google Gemini 1.5 Flash  
- **Prompt:**
  > *"cách làm dataset"*
- **Mục đích:** Tìm hiểu phương pháp thu thập dữ liệu POI du lịch có cấu trúc, các trường dữ liệu cần thiết để phục vụ thuật toán phân cụm không gian và định tuyến thời gian.
- **Kết quả người dùng áp dụng:** Xây dựng bảng Google Sheets gồm 11 trường: `stt`, `name`, `type`, `vibes`, `avg_price`, `open_time`, `close_time`, `rating`, `lat`, `lng`, `link`.

### Nhật ký Prompt 2: Báo cáo Cấu trúc Input/Output (Từ Nguyễn Thuận Thiên)
- **Thời gian:** 18:30 ngày 05/11/2026  
- **Công cụ:** Google Gemini 1.5 Flash  
- **Prompt:**
  > *"còn output với chức năng hoạt động như nào, cái này là 1 phần của chức năng nên là hmmm tôi k biết viết gì tiếp"*
- **Kết quả người dùng áp dụng:** Tổng hợp luồng dữ liệu 5 bước: Input Parsing $\rightarrow$ Vibe Matching $\rightarrow$ Budget Optimization $\rightarrow$ Geographical Clustering $\rightarrow$ Itinerary Payload Rendering.

### Nhật ký Prompt 3: Công thức Toán học Haversine & Jaccard (Nguyễn Huỳnh Khánh Như)
- **Thời gian:** Ngày 05/11/2026  
- **Công cụ:** Anthropic Claude 3.5 Sonnet  
- **Prompt:**
  > *"Viết hàm tính khoảng cách đường chim bay giữa 2 tọa độ GPS bằng công thức Haversine và hàm tính độ tương đồng Jaccard giữa tập vibes người dùng chọn và vibes của địa điểm."*
- **Kiểm chứng con người:** Thêm ép kiểu float an toàn, kiểm tra trường rỗng và làm tròn 2 chữ số thập phân cho hiển thị km.

### Nhật ký Prompt 4: Bảo mật Mật khẩu & Quy tắc Điều khoản (Nguyễn Bình An & Nguyễn Bạch Thành Nhân)
- **Thời gian:** Ngày 05/11/2026  
- **Công cụ:** Claude 3.5 Sonnet  
- **Prompt:**
  > *"Làm thế nào để đảm bảo form đăng ký chỉ cho phép bấm Tạo tài khoản khi người dùng đã tick vào đồng ý điều khoản, và khi người dùng bấm vào xem popup điều khoản rồi quay lại thì thông tin họ đã nhập không bị mất?"*
- **Kiểm chứng con người:** Thay vì chuyển trang dẫn đến mất state DOM, nhóm chuyển đổi Điều khoản và Chính sách quyền riêng tư thành cửa sổ Overlay Modal tĩnh trên cùng trang, đóng mở bằng JavaScript không làm reload form.

---

## 5. Potential Risks, Limitations & Ethical Safeguards

1. **Phòng chống Ảo giác Dữ liệu Địa lý (Hallucination Mitigation):**  
   Mô hình AI thường có xu hướng tạo ra các địa điểm, tọa độ hoặc giờ mở cửa không có thật. Để loại bỏ hoàn toàn rủi ro này, 100% dữ liệu trong `places_dalat.json` và `places_nhatrang.json` đều là dữ liệu thực tế do nhóm xác minh trên Google Maps và tích hợp worker đồng bộ Google Places API.

2. **Bảo vệ Dữ liệu Cá nhân (Privacy & Zero PII):**  
   Dữ liệu khảo sát người dùng chỉ lưu mã định danh ngẫu nhiên ẩn danh (`USR_xxxx`), hoàn toàn không thu thập bất kỳ thông tin cá nhân định danh nào (họ tên thật, số điện thoại, số CCCD).

3. **Bảo mật Thông tin Đăng nhập (Credential Security):**  
   Mật khẩu của người dùng được băm một chiều với Salt ngẫu nhiên trước khi lưu trữ, không lưu bản rõ (Plaintext) ở bất kỳ đâu trên hệ thống. Khóa bí mật API được đọc từ biến môi trường (`os.getenv`), tuyệt đối không gửi lên prompt của AI.

---

## 6. Verification Statement

Tập thể nhóm 02 cam kết:
- Toàn bộ mã nguồn và báo cáo được tạo ra với sự hỗ trợ của AI đều đã được từng thành viên trực tiếp đọc hiểu, kiểm thử chức năng, tối ưu hóa và làm chủ hoàn toàn.
- Không có bất kỳ hành vi sao chép trái phép hoặc nộp nguyên bản nội dung do AI sinh ra mà không qua kiểm chứng thực tế.
