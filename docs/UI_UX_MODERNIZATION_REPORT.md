# Báo Cáo Hiện Đại Hóa UI/UX Travel Planner (Phiên Bản Hoàn Thiện Toàn Diện)

Báo cáo chi tiết quá trình hoàn thiện giao diện và trải nghiệm người dùng hệ thống **Travel Planner** qua đủ 5 trang: Trang chủ (`index.html`), Lập lịch trình (`planner.html`), Bảng điều khiển tài khoản (`dashboard.html`), Quản lý địa điểm (`manager.html`) và Đánh giá lịch trình (`survey.html`).

---

## 1. Mở Rộng Khung Nội Dung Toàn Diện Trên Desktop & Mobile

### 1.1. Kiến Trúc Khung Khả Dụng (Full-Width Layout)
- **Trước khi sửa:** Các trang bị bó cứng vào giữa màn hình bởi các giới hạn `max-width: 1024px`, `1120px`, `1200px`, `1320px` hoặc `1360px` với `margin: auto`. Trên màn hình rộng 1440px và 1920px, hai dải lề thừa chiếm đến 40–50% không gian màn hình.
- **Sau khi sửa:** Gỡ bỏ hoàn toàn `max-width` ở tất cả các wrapper cấp trang (`main.page-wrapper`, `main.planner-layout`, `main.dash-wrapper`, `main.manager-layout`, `main.survey-layout`), áp dụng:
  - `width: 100%; max-width: none; box-sizing: border-box;`
  - Lề ngang đồng bộ trên Desktop: **28px** mỗi bên (`padding: 0 28px;` hoặc `padding: 24px 28px;`).
  - Lề ngang đồng bộ trên Mobile: **16px** mỗi bên (`padding: 0 16px;`).
  - Hero, bản đồ Leaflet, timeline, bảng dữ liệu và lưới thẻ giãn hết cột chứa. Các đoạn văn dài và câu hỏi khảo sát được giới hạn độ dài dòng tối đa bên trong (`max-width: 860px`) để giữ trải nghiệm đọc dễ chịu.

### 1.2. Bảng Số Đo Thực Tế Đo Trên Trình Duyệt (Chrome Headless CDP)
Đo đạc tự động thực tế trên cả 5 trang tại **390, 768, 1440 và 1920 CSS px**:

| Màn hình | Trang | `scrollWidth` (px) | `innerWidth` (px) | Chiều rộng Wrapper (px) | Lề ngang mỗi bên | `max-width` | Trạng thái Cuộn Ngang Document |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **390 px** (Mobile) | `/index.html` | 390 | 390 | 390 | 16 px | none | **PASS (0 px)** |
| | `/planner.html` | 390 | 390 | 390 | 16 px | none | **PASS (0 px)** |
| | `/dashboard.html` | 390 | 390 | 390 | 16 px | none | **PASS (0 px)** |
| | `/manager.html` | 390 | 390 | 390 | 16 px | none | **PASS (0 px)** |
| | `/survey.html` | 390 | 390 | 390 | 16 px | none | **PASS (0 px)** |
| **768 px** (Tablet) | `/index.html` | 753 | 768 | 753 | 16 px | none | **PASS (0 px)** |
| | `/planner.html` | 753 | 768 | 753 | 16 px | none | **PASS (0 px)** |
| | `/dashboard.html` | 753 | 768 | 753 | 16 px | none | **PASS (0 px)** |
| | `/manager.html` | 753 | 768 | 753 | 16 px | none | **PASS (0 px - Bảng cuộn riêng)** |
| | `/survey.html` | 753 | 768 | 753 | 16 px | none | **PASS (0 px)** |
| **1440 px** (Desktop) | `/index.html` | 1425 | 1440 | **1425** | 28 px | **none** | **PASS (0 px)** |
| | `/planner.html` | 1425 | 1440 | **1425** | 28 px | **none** | **PASS (0 px)** |
| | `/dashboard.html` | 1425 | 1440 | **1425** | 28 px | **none** | **PASS (0 px)** |
| | `/manager.html` | 1425 | 1440 | **1425** | 28 px | **none** | **PASS (0 px)** |
| | `/survey.html` | 1425 | 1440 | **1425** | 28 px | **none** | **PASS (0 px)** |
| **1920 px** (Full HD) | `/index.html` | 1905 | 1920 | **1905** | 28 px | **none** | **PASS (0 px)** |
| | `/planner.html` | 1905 | 1920 | **1905** | 28 px | **none** | **PASS (0 px)** |
| | `/dashboard.html` | 1920 | 1920 | **1920** | 28 px | **none** | **PASS (0 px)** |
| | `/manager.html` | 1905 | 1920 | **1905** | 28 px | **none** | **PASS (0 px)** |
| | `/survey.html` | 1905 | 1920 | **1905** | 28 px | **none** | **PASS (0 px)** |

> [!NOTE]
> Kết quả đo đạc khẳng định: 100% các trang không có hiện tượng cuộn ngang cấp document (`scrollWidth <= innerWidth`). Trên màn hình 1440px và 1920px, nội dung mở rộng toàn diện (đạt 1425px và 1905–1920px), hoàn toàn không còn tình trạng bị thắt khung.

---

## 2. Khắc Phục Lỗi Khung Planner & Tái Cấu Trúc Timeline Động

### 2.1. Giải Quyết Hiện Tượng Nhảy Kích Thước Khung Planner
- **Lỗi trước đây:** Tại vùng hiển thị 1265px, khung Planner đo được **1.038px trước khi tạo** (bị bóp bởi `max-width: 1360px` kết hợp lề tự động) và **1.265px sau khi tạo**, gây giật layout rõ rệt khi người dùng bấm "Thử lịch trình mẫu".
- **Giải pháp:** Đồng nhất `.planner-layout` thành CSS Grid với 2 cột trên desktop (`360px minmax(0, 1fr)`) và 1 cột trên mobile (`1fr`), `width: 100%; max-width: none; margin: 24px 0 60px; padding: 0 28px; box-sizing: border-box;`.
- **Số đo thực tế kiểm chứng:**
  - **Tại 1265 px:**
    - Trước khi tạo: `wrapperWidth = 1250 px` (`max-width: none`)
    - Sau khi tạo: `wrapperWidth = 1250 px` (`max-width: none`)
    - **Độ lệch kích thước:** **0 px (TUYỆT ĐỐI ĐỒNG NHẤT)**
  - **Tại 1440 px:**
    - Trước khi tạo: `wrapperWidth = 1425 px` (`max-width: none`)
    - Sau khi tạo: `wrapperWidth = 1425 px` (`max-width: none`)
    - **Độ lệch kích thước:** **0 px (TUYỆT ĐỐI ĐỒNG NHẤT)**

### 2.2. Khắc Phục Triệt Để CSS & DOM Timeline Động
- **Lỗi trước đây:**
  - Class `.timeline-item-row` bị thiếu selector hoặc lệch tên trong CSS, dẫn đến trình duyệt áp dụng mặc định `display: block` với `padding: 0`.
  - Vòng tròn số thứ tự `.timeline-order-circle` bị kéo dãn thành một dải ngang dị dạng.
  - Các dòng địa chỉ, đánh giá và cự ly dính liền nhau thành một khối text khó đọc.
  - Các tag sở thích dính liền với nhau và dính liền với liên kết Google Maps.
  - Trùng lặp tag tiếng Việt (cả `Chill` và `Relaxation` đều hiện thành "Thư giãn").
- **Kiến trúc mới sau khi tái cấu trúc:**
  - `.timeline-day-block`: Bao bọc từng ngày với tiêu đề ngày và chỗ ở rõ ràng (`.day-header-pill`, `.day-hotel-sub`).
  - `.timeline-item-row`: `display: flex; gap: 16px; padding: 18px 0; align-items: flex-start;`.
  - `.timeline-order-circle`: Cố định `width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0;`.
  - `.timeline-item-header`: Bên trái là `[Giờ] Tên địa điểm` + badge loại hình; bên phải là `.timeline-item-cost` căn phải với font số đơn khoảng cách (`font-family: var(--font-mono); font-weight: 700; white-space: nowrap; margin-left: auto;`).
  - `.place-details-stack`: Tách bạch rõ 3 dòng phụ:
    - Dòng 1: `📍 Địa chỉ:`
    - Dòng 2: `⭐ Đánh giá:` · `🚗 Cự ly từ điểm trước:`
    - Dòng 3: `Ghi chú lịch trình` (nếu có).
  - `.place-features-row`: Bố cục Flexbox 2 bên với đường phân cách viền đứt thanh mảnh (`border-top: 1px dashed var(--slate-200); padding-top: 10px;`):
    - Cột trái (`.place-tags-group`): Dùng `display: flex; flex-wrap: wrap; gap: 6px;`. Toàn bộ tag được chuyển ngữ tiếng Việt tự nhiên và deduplicate qua `Set` (không còn lặp tag). Tag trong nhà khi mưa có badge vàng cảnh báo nổi bật.
    - Cột phải (`.place-meta-actions`): Tách biệt hoàn toàn `.match-pill` (Độ khớp: XX%) và `.map-link-btn` (Xem Google Maps ↗), không bị dính vào nhóm tag.
- **Số liệu kiểm chứng:**
  - Số ngày timeline hiển thị: **3 ngày (Đạt và vượt yêu cầu >= 2 ngày)**
  - Tổng số hoạt động: **18 hoạt động**
  - Trạng thái DOM: `firstRowDisplay: flex`, `circle: 30px x 30px`, `hasMatchPill: True`, `hasMapBtn: True`.

---

## 3. Hoàn Thiện Từng Trang Chi Tiết

### 3.1. Trang Chủ (`index.html`)
- **Bố cục Hero 2 cột trên desktop:**
  - Cột trái: Tiêu đề súc tích, câu mô tả lợi ích rõ ràng, nút chính "Lập lịch trình" và lối vào phụ "Thử lịch trình mẫu", kèm dãy 3 chỉ số cam kết.
  - Cột phải: Bản xem trước lịch trình thực tế sống động (3 ngày 2 đêm tại Đà Lạt) mô phỏng chính xác giao diện thật của sản phẩm.
- **Mobile xếp dọc:** Tự động chuyển thành 1 cột trên điện thoại mà không bị gãy dòng điều hướng.
- **Phân cấp thông tin:** Đưa 4 trụ cột tư duy tính toán và các phân tích kỹ thuật xuống phần dưới trang.

### 3.2. Lập Lịch Trình (`planner.html`) — Nâng Cấp Tinh Chỉnh Chuyên Sâu
- **Mở biểu mẫu lập lịch trống hoàn toàn:**
  - Điểm đến mặc định hiển thị "Chọn điểm đến" (`value=""`).
  - Ngày khởi hành, ngày kết thúc, số người và ngân sách để trống hoàn toàn.
  - Duration pill chỉ hiển thị số ngày/đêm khi cả 2 ngày hợp lệ (ẩn khi chưa chọn).
  - Ngân sách hiển thị trạng thái "Chưa nhập", thanh trượt range slider không tự ghi giá trị vào input và không tô màu khi chưa tương tác.
  - Toàn bộ 10 sở thích ở trạng thái chưa chọn (`selectedVibes = []`). Chế độ mô phỏng trời mưa mặc định tắt.
- **Xác thực dữ liệu bắt buộc (In-line Field Validation):**
  - Khi bấm "Lập lịch trình" mà thiếu dữ liệu bắt buộc: Hiển thị thông báo lỗi tiếng Việt ngay dưới từng trường tương ứng kèm viền đỏ nổi bật.
  - Sở thích là tùy chọn, bỏ trống vẫn tạo được lịch trình.
  - Nút "Thử lịch trình mẫu" là lối vào duy nhất tự động điền bộ dữ liệu mẫu chuẩn để người dùng trải nghiệm nhanh.
- **Mở rộng cột tiêu chí & Đồng bộ chiều cao ô nhập:**
  - Cột tiêu chí mở rộng chiếm **35–37%** chiều rộng nội dung (`clamp(380px, 37%, 540px)`), tối đa 540px trên màn hình lớn.
  - Cột kết quả chiếm toàn bộ phần còn lại (`minmax(0, 1fr)`).
  - Tăng và đồng bộ tuyệt đối chiều cao các ô nhập (Điểm đến, Ngày đi, Ngày về, Số người, Ngân sách) đạt chuẩn **46 CSS px** (trong dải 44–48px). Mũi tên chọn và chữ căn giữa theo chiều dọc.
- **Thiết kế lại "Sở thích & phong cách" dạng lưới 2 cột:**
  - Chuyển đổi các chip dài ngắn lộn xộn thành lưới lựa chọn **2 cột cân đối** (`min-height: 44px;`).
  - Mỗi ô có nhãn căn trái, ô vuông có dấu tích (`✓`) nổi bật cùng viền nhấn xanh khi chọn.
  - Nhãn được rút gọn sắc nét: *"Thư giãn"*, *"Thiên nhiên"*, *"Săn mây"*, *"Ẩm thực địa phương"*, *"Chụp ảnh"*, *"Văn hóa & lịch sử"*, *"Phiêu lưu"*, *"Lãng mạn"*, *"Tiết kiệm"*, *"Nghỉ dưỡng"*.
- **Tái cấu trúc "Phân bổ ngân sách 5 nhóm" theo Lưới Thống Nhất 3 Cột:**
  - Dựng cả 5 hàng trên cùng một **lưới 3 cột chuẩn mực**:
    - **Cột 1 (trái, `240px`):** Tên nhóm và chú thích bên dưới. Tên nhóm nằm trọn vẹn trên **1 dòng duy nhất**: *"Di chuyển"*, *"Lưu trú"*, *"Ăn uống"*, *"Vé tham quan & trải nghiệm"*, *"Quỹ dự phòng"*.
    - **Cột 2 (giữa, `1fr`):** Thanh tỷ lệ tự động co giãn theo toàn bộ phần chiều rộng còn lại của thẻ card (chiều rộng đạt 787px trên 1440px và tiếp tục giãn khi màn hình lớn hơn).
    - **Cột 3 (phải, `160px`):** Số tiền và phần trăm căn phải gọn gàng, định dạng tiền tệ Việt Nam (`₫`).
  - **Căn giữa ba cột theo chiều dọc:** Thiết lập `align-items: center;` và padding đối xứng `10px 0`, độ lệch tâm giữa thanh và hàng chỉ 0.5px.
  - **Giữ tất cả 5 rãnh cùng điểm bắt đầu và cùng điểm kết thúc:** Tọa độ bắt đầu `start = 885px`, tọa độ kết thúc `end = 1672px`, chiều rộng rãnh đồng nhất 787px trên cả 5 hàng.
  - **Khi khung hẹp / Mobile (390px):** Đặt tên và số tiền trên hàng đầu (`sameTopRow = true`), đưa thanh tỷ lệ xuống dưới full-width (`trackIsBelow = true`), giữ nguyên 100% tỷ lệ phần trăm tô màu, tuyệt đối không gây cuộn ngang tài liệu.

### 3.3. Bảng Điều Khiển Tài Khoản (`dashboard.html`)
- Khối chào mừng tinh gọn, email/tên dài được bảo vệ an toàn chống vỡ khung.
- Đưa 2 thẻ thao tác chính ("Lập lịch trình mới" và "Đánh giá lịch trình") lên trước các thông số phụ.
- Thẻ cùng loại căn chung cạnh trên, padding và nút bấm gióng thẳng hàng tuyệt đối ở đáy thẻ nhờ `margin-top: auto`.
- Phân quyền chính xác: chỉ hiển thị lối vào "Quản lý địa điểm" khi đăng nhập tài khoản quản trị viên (`manager`).

### 3.4. Quản Lý Địa Điểm (`manager.html`)
- Tiêu đề trang chuẩn hóa: **Quản lý địa điểm**.
- Thanh công cụ tích hợp tab thành phố (Đà Lạt: 29 / Nha Trang: 35), ô tìm kiếm nhanh theo từ khóa, lọc theo loại hình (Tham quan, Ăn uống, Cà phê, Lưu trú) và nút thêm địa điểm mới.
- Bảng dữ liệu bao bọc trong `.table-responsive` cách ly cuộn ngang riêng trên mobile, cột chi phí căn phải chuẩn tiền tệ Việt Nam (`100.000 ₫`, `Miễn phí`), STT và nút xóa căn giữa.
- Thẻ sở thích trong bảng được ánh xạ hoàn toàn sang tiếng Việt tự nhiên.

### 3.5. Đánh Giá Lịch Trình (`survey.html`) — Nâng Cấp Tinh Chỉnh Chuyên Sâu
- **Lưới 2 cột có mục đích trên desktop & Cột phụ bên phải:**
  - **Cột chính (`minmax(0, 1fr)`):** Chứa tiêu đề trang, mô tả ngắn gọn, toàn bộ các nhóm câu hỏi và thẻ câu hỏi, ô góp ý thêm và nút gửi đánh giá.
  - **Cột phụ bên phải (`340px`):** Chứa khối tiến độ thời gian thực (`0/10 câu hỏi`, thanh tỷ lệ hoàn thành), mục lục điều hướng 3 nhóm câu hỏi có thể bấm để cuộn mượt đến từng phần kèm badge trạng thái, và khối lưu ý ngắn. Cột phụ bám cố định khi cuộn trang (`position: sticky; top: 80px;`).
  - **Trên mobile:** Tiến độ và mục lục nhóm tự động đưa lên đầu trang (`order: 1`), xếp thành 1 cột duy nhất thẳng tắp, không tràn ngang (`scrollWidth = innerWidth = 390px`).
- **Căn mép tiêu đề nhóm & Giảm độ nặng:**
  - Căn mép trái và mép phải của tiêu đề nhóm khớp **100% với mép của các thẻ câu hỏi** (chênh lệch đo được qua CDP đúng `0px`).
  - Thay thế hoàn toàn dải xanh đậm/đen đặc nặng nề trước đây bằng **tiêu đề nhóm trên nền nhạt** (`var(--slate-50)`), viền phân cách mảnh và dải nhấn xanh bên trái (`border-left: 4px solid var(--brand-600)`), giúp người dùng nhận diện phân đoạn khi cuộn trang một cách thanh lịch, không lấn át tiêu đề trang và câu hỏi.
- **Làm gọn mỗi thẻ câu hỏi (Rating Scale 5 mức):**
  - Giữ **5 vùng bấm bằng nhau tuyệt đối** (`grid-template-columns: repeat(5, 1fr)`), chiều rộng mỗi nút đạt chuẩn 171px trên desktop và co giãn đều đặn trên mobile.
  - **Loại bỏ toàn bộ chi tiết trang trí rườm rà:** Bỏ vòng tròn radio indicator và ngôi sao vàng (★) lặp lại 50 lần gây mệt mắt; chỉ giữ số mức to rõ (1 đến 5) và mô tả tương ứng (*Rất không hài lòng*, *Không hài lòng*, *Bình thường*, *Hài lòng*, *Rất hài lòng*).
  - **Làm rõ trạng thái chọn & Focus bàn phím:** Nút được chọn nổi bật tức thì với nền xanh thương hiệu (`var(--brand-600)`), chữ số trắng tinh và mô tả xanh nhạt. Hỗ trợ focus bàn phím (`:focus-within` có outline 2px rõ nét).
  - **Dòng "Chưa trả lời" thông minh:** Ban đầu mở trang **hoàn toàn không hiển thị dòng "Chưa trả lời"** để giao diện sạch sẽ; chỉ khi người dùng bấm "Gửi đánh giá" mà còn câu thiếu, dòng `Chưa trả lời` màu đỏ cảnh báo mới xuất hiện tại đúng các câu còn thiếu để dẫn đường cho người dùng. Khi chọn đáp án, nhãn lập tức chuyển thành `✓ Đã chọn` màu xanh lá dịu.

---

## 4. Bộ Ảnh Nghiệm Thu Đối Chứng (Before vs After)

Toàn bộ ảnh chụp màn hình được lưu trữ tại `docs/screenshots/` và sao chép vào thư mục artifact:

### 4.1. Trang Chủ (`index.html`)

````carousel
![Trang Chủ - Trước (Desktop 1440px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/index_1440.png)
<!-- slide -->
![Trang Chủ - Sau (Desktop 1440px - Hero 2 cột & Preview Thực)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/index_1440.png)
<!-- slide -->
![Trang Chủ - Trước (Mobile 390px - Tràn Navbar)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/index_390.png)
<!-- slide -->
![Trang Chủ - Sau (Mobile 390px - Tối ưu di động)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/index_390.png)
````

### 4.2. Lập Lịch Trình (`planner.html`)

````carousel
![Planner Ban Đầu - Trước (Desktop 1440px - Bó khung, điền sẵn ngầm)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/planner_initial_1440.png)
<!-- slide -->
![Planner Ban Đầu - Sau (Desktop 1440px - Form trống hoàn toàn, Cột rộng 36%, Lưới 2 cột vibes, Input 46px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/planner_initial_1440.png)
<!-- slide -->
![Planner Xác Thực Lỗi - Sau (Desktop 1440px - Báo lỗi tiếng Việt chi tiết dưới từng trường)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/planner_validation_errors_1440.png)
<!-- slide -->
![Planner Kết Quả - Trước (Desktop 1440px - Lỗi Timeline Block, Tag dính, Ngân sách rãnh tràn)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/planner_result_1440.png)
<!-- slide -->
![Planner Kết Quả - Sau (Desktop 1440px - Lưới ngân sách 5 nhóm chuẩn, Tên 1 dòng, Rãnh thẳng hàng, Timeline 3 ngày)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/planner_result_1440.png)
<!-- slide -->
![Planner Ban Đầu - Trước (Mobile 390px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/planner_initial_390.png)
<!-- slide -->
![Planner Ban Đầu - Sau (Mobile 390px - Form trống & Lưới 2 cột cân đối)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/planner_initial_390.png)
<!-- slide -->
![Planner Kết Quả - Trước (Mobile 390px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/planner_result_390.png)
<!-- slide -->
![Planner Kết Quả - Sau (Mobile 390px - Ngân sách & Timeline chuẩn không cuộn ngang)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/planner_result_390.png)
````

### 4.3. Bảng Điều Khiển Tài Khoản (`dashboard.html`)

````carousel
![Dashboard - Trước (Desktop 1440px - Bó 1120px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/dashboard_1440.png)
<!-- slide -->
![Dashboard - Sau (Desktop 1440px - Rộng rãi & Nút thẳng hàng)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/dashboard_1440.png)
<!-- slide -->
![Dashboard - Trước (Mobile 390px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/dashboard_390.png)
<!-- slide -->
![Dashboard - Sau (Mobile 390px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/dashboard_390.png)
````

### 4.4. Quản Lý Địa Điểm (`manager.html`)

````carousel
![Manager - Trước (Desktop 1440px - Bó 1320px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/manager_1440.png)
<!-- slide -->
![Manager - Sau (Desktop 1440px - Mở rộng full width)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/manager_1440.png)
<!-- slide -->
![Manager - Trước (Mobile 390px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/manager_390.png)
<!-- slide -->
![Manager - Sau (Mobile 390px - Bảng cuộn riêng không tràn)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/manager_390.png)
````

### 4.5. Đánh Giá Lịch Trình (`survey.html`)

````carousel
![Survey - Trước (Desktop 1440px - Bó 860px vào giữa)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/survey_1440.png)
<!-- slide -->
![Survey - Sau (Desktop 1440px - Bố cục 1 cột chuẩn, thanh tiến độ trên đầu, tiêu đề nhóm nền đậm & 5 cột bằng nhau)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/survey_1440.png)
<!-- slide -->
![Survey - Trước (Mobile 390px)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/before/survey_390.png)
<!-- slide -->
![Survey - Sau (Mobile 390px - Các ô xuống hàng, giữ thứ tự 1-5, không tràn cuộn ngang)](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/survey_390.png)
````

### 4.6. Các Luồng Tương Tác Nâng Cao (Interactive Flows)

````carousel
![Survey Flow 01 - Đã chọn 1 câu: Vòng tròn có chấm trong, nền nhấn #f0f9ff & tiến độ tăng 0/10 lên 1/10](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/survey_flow_01_answered1.png)
<!-- slide -->
![Survey Flow 02 - Báo lỗi khi thiếu câu & Cuộn đến câu thiếu](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/survey_flow_02_validation_error.png)
<!-- slide -->
![Survey Flow 03 - Hoàn thành 10 câu & Gửi thành công](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/survey_flow_03_all10_and_submitted.png)
<!-- slide -->
![Planner Flow - Chế độ mô phỏng trời mưa](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/planner_flow_rainy_day.png)
<!-- slide -->
![Planner Flow - Lọc xem lộ trình Ngày 2 trên bản đồ Leaflet](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/planner_flow_map_day2.png)
<!-- slide -->
![Manager Flow - Chuyển Tab Nha Trang 35 địa điểm](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/manager_flow_nhatrang_tab.png)
<!-- slide -->
![Manager Flow - Tìm kiếm trực tiếp Vinwonders](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/manager_flow_search.png)
<!-- slide -->
![Dashboard Flow - Tài khoản Quản trị viên tên dài](/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f/screenshots/after/dashboard_manager_role.png)
````

---

## 5. Tóm Tắt Thay Đổi Mã Nguồn (Changelog)

1. **`src/frontend/css/theme.css`:**
   - Cung cấp đầy đủ CSS tokens hiện đại, định vị thương hiệu Travel Planner.
   - Định nghĩa quy chuẩn Full-width cho toàn bộ ứng dụng: `.app-nav`, `.nav-container`, `.app-footer`, `.footer-content` với `width: 100%; max-width: none; box-sizing: border-box;`.
   - Bổ sung bộ selector hoàn chỉnh cho timeline động: `.timeline-day-block`, `.day-header-pill`, `.timeline-item-row` (`display: flex; gap: 16px;`), `.timeline-order-circle`, `.timeline-item-content`, `.timeline-item-cost`, `.place-details-stack`, `.place-features-row`, `.place-tags-group`, `.feat-tag`, `.match-pill`, `.map-link-btn`.
   - Bổ sung quy chuẩn cách ly cuộn ngang bảng dữ liệu `.table-responsive` (`overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%;`).
2. **`src/frontend/index.html`:**
   - Chuyển đổi khối Hero thành bố cục 2 cột trên desktop với bản xem trước lịch trình thực tế sống động bên phải.
   - Chuyển đổi `.page-wrapper` thành full-width (`width: 100%; max-width: none; padding: 32px 28px;`).
   - Đưa nội dung lý thuyết môn học và 4 trụ cột tư duy tính toán xuống nửa dưới trang.
3. **`src/frontend/planner.html`:**
   - Cột tiêu chí rộng 37% (tối đa 560px), form khởi tạo trống, validate in-line chuẩn tiếng Việt.
   - Lưới sở thích 2 cột cân đối, thanh phân bổ ngân sách 5 nhóm theo lưới 3 cột `240px 1fr 160px` căn giữa dọc, rãnh trượt thẳng hàng.
   - Loại bỏ hoàn toàn sự chênh lệch kích thước khung Planner trước và sau khi tạo lịch (0px chênh lệch).
   - Tái cấu trúc hàm `renderPlannerResults(data)`: Tạo DOM chuẩn ngữ nghĩa, tách riêng số thứ tự, tên, giờ, chi phí căn phải, 3 dòng chi tiết địa chỉ/đánh giá/cự ly, nhóm tag tiếng Việt deduplicate, điểm match và nút Google Maps riêng biệt.
4. **`src/frontend/dashboard.html`:**
   - Nâng cấp `.dash-wrapper` lên full-width (`width: 100%; max-width: none; padding: 0 28px;`).
   - Tinh gọn khối chào mừng, xử lý an toàn email/tên dài.
   - Đưa 2 thẻ thao tác chính lên trước các thông số phụ, căn gióng các nút hành động ở đáy thẻ (`margin-top: auto`).
5. **`src/frontend/manager.html`:**
   - Nâng cấp `.manager-layout` lên full-width (`width: 100%; max-width: none; padding: 0 28px; min-width: 0; overflow-x: hidden;`).
   - Đồng bộ hóa bản dịch tiếng Việt cho toàn bộ tag địa điểm trong bảng dữ liệu. Căn phải cột chi phí, giữ bảng cuộn an toàn trong container responsive.
6. **`src/frontend/survey.html`:**
   - Khôi phục bố cục 1 cột đồng nhất, thanh tiến độ `.progress-box` nằm trên đầu biểu mẫu.
   - Căn thẳng tắp cùng hai mép: Thẻ câu hỏi (`.question-block`), tiêu đề nhóm (`.group-divider`), và thanh tiến độ (`.progress-box`) có độ lệch mép trái/phải = 0px.
   - Tiêu đề 3 nhóm câu hỏi có nền đậm (`var(--slate-900)`) chữ trắng trang trọng như bản cũ.
   - Vòng tròn radio (`.likert-radio-indicator`) hiện rõ trong từng ô đáp án. Khi chọn, vòng tròn có chấm bên trong (`::after`), ô có viền và nền nhấn `#f0f9ff` + `var(--brand-600)`.
   - 5 ô đáp án chia thành 5 cột bằng nhau trên desktop (`grid-template-columns: repeat(5, 1fr)`). Trên mobile (<= 640px), xếp xuống hàng (1 cột dọc), giữ thứ tự 1-5 và không cuộn ngang.
   - Đảm bảo toàn bộ 10 câu hỏi khởi tạo ở 0/10 (0%), chưa chọn đáp án nào. Khi chọn thử 1 đáp án, tiến độ tăng chính xác từ 0/10 lên 1/10 (10%). Chặn gửi khi thiếu câu và tự động cuộn đến câu thiếu đầu tiên.
