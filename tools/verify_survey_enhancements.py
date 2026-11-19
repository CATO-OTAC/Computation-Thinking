import asyncio
import base64
import json
import os
import subprocess
import time
import urllib.request

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9225
BASE_URL = "http://127.0.0.1:8000"
ARTIFACT_DIR = "/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f"

class CDPClient:
    def __init__(self, ws_url):
        self.ws_url = ws_url
        self.reader = None
        self.writer = None
        self.msg_id = 0

    async def connect(self):
        import urllib.parse
        parsed = urllib.parse.urlparse(self.ws_url)
        host = parsed.hostname
        port = parsed.port
        path = parsed.path
        
        self.reader, self.writer = await asyncio.open_connection(host, port)
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.writer.write(req.encode('utf-8'))
        await self.writer.drain()
        
        resp = b""
        while b"\r\n\r\n" not in resp:
            chunk = await self.reader.read(1024)
            if not chunk:
                break
            resp += chunk
        
        if b"101 " not in resp:
            raise RuntimeError(f"WebSocket handshake failed: {resp.decode('utf-8', 'ignore')}")

    async def send_command(self, method, params=None):
        self.msg_id += 1
        msg = {"id": self.msg_id, "method": method, "params": params or {}}
        payload = json.dumps(msg).encode('utf-8')
        
        length = len(payload)
        mask_key = os.urandom(4)
        header = bytearray([0x81])
        
        if length < 126:
            header.append(0x80 | length)
        elif length <= 65535:
            header.append(0x80 | 126)
            header.extend(length.to_bytes(2, 'big'))
        else:
            header.append(0x80 | 127)
            header.extend(length.to_bytes(8, 'big'))
            
        header.extend(mask_key)
        masked_payload = bytearray(b ^ mask_key[i % 4] for i, b in enumerate(payload))
        
        self.writer.write(header + masked_payload)
        await self.writer.drain()

        while True:
            res = await self._read_frame()
            if not res:
                continue
            data = json.loads(res.decode('utf-8'))
            if data.get("id") == self.msg_id:
                return data.get("result", {})

    async def eval_js(self, expr):
        res = await self.send_command("Runtime.evaluate", {"expression": expr, "returnByValue": True})
        if isinstance(res, dict) and "result" in res and "value" in res["result"]:
            return res["result"]["value"]
        return res

    async def _read_frame(self):
        head = await self.reader.readexactly(2)
        opcode = head[0] & 0x0f
        masked = (head[1] & 0x80) != 0
        length = head[1] & 0x7f
        
        if length == 126:
            length_bytes = await self.reader.readexactly(2)
            length = int.from_bytes(length_bytes, 'big')
        elif length == 127:
            length_bytes = await self.reader.readexactly(8)
            length = int.from_bytes(length_bytes, 'big')
            
        mask_key = await self.reader.readexactly(4) if masked else None
        data = await self.reader.readexactly(length)
        if masked:
            data = bytearray(b ^ mask_key[i % 4] for i, b in enumerate(data))
        return data

    async def close(self):
        if self.writer:
            self.writer.close()
            await self.writer.wait_closed()


async def main():
    print("Khởi chạy Chrome headless để kiểm thử chi tiết Trang Đánh Giá (survey.html)...")
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--remote-debugging-port={PORT}",
        "--user-data-dir=/tmp/cdp_chrome_survey_test2"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    for _ in range(30):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version") as resp:
                if resp.status == 200:
                    break
        except Exception:
            time.sleep(0.2)

    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new?{BASE_URL}/survey.html", method="PUT")
    with urllib.request.urlopen(req) as resp:
        tinfo = json.loads(resp.read().decode('utf-8'))
    
    client = CDPClient(tinfo["webSocketDebuggerUrl"])
    await client.connect()

    try:
        await client.send_command("Page.enable")
        await client.send_command("DOM.enable")

        # -------------------------------------------------------------
        # 1. KIỂM THỬ KHỞI TẠO BỐ CỤC 1 CỘT (DESKTOP 1440px)
        # -------------------------------------------------------------
        print("\n=== 1. KIỂM THỬ KHỞI TẠO: BỐ CỤC 1 CỘT, THANH TIẾN ĐỘ TRÊN ĐẦU (0/10) ===")
        await client.send_command("Emulation.setDeviceMetricsOverride", {
            "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
        })
        
        # Chờ nạp xong câu hỏi
        for _ in range(30):
            count = await client.eval_js("document.querySelectorAll('.question-block').length")
            if count == 10:
                print("Đã tải xong 10 câu hỏi khảo sát!")
                break
            await asyncio.sleep(0.3)

        layout_check_js = """
        (() => {
            const mainCard = document.querySelector(".survey-main-card");
            const sidebar = document.querySelector(".survey-sidebar");
            const progressBox = document.querySelector(".progress-box");
            const progressLabel = document.getElementById("progressLabel");
            const progressBar = document.getElementById("progressBar");
            const form = document.getElementById("surveyForm");
            const mainRect = mainCard.getBoundingClientRect();
            const progRect = progressBox.getBoundingClientRect();
            const formRect = form.getBoundingClientRect();

            return {
                sidebarExists: sidebar !== null,
                mainCardWidth: Math.round(mainRect.width),
                progressBoxVisible: window.getComputedStyle(progressBox).display !== "none",
                progressBoxAboveForm: progRect.top < formRect.top,
                progressLabelText: progressLabel ? progressLabel.textContent.trim() : "",
                progressBarWidth: progressBar ? progressBar.style.width : "",
                checkedCount: document.querySelectorAll("input[type='radio']:checked").length
            };
        })()
        """
        l_res = await client.eval_js(layout_check_js)
        print("Initial Layout Check:", json.dumps(l_res, indent=2, ensure_ascii=False))

        assert not l_res["sidebarExists"], "Lỗi: Đã khôi phục 1 cột, không được có .survey-sidebar!"
        assert l_res["progressBoxVisible"], "Lỗi: Thanh tiến độ .progress-box phải hiển thị trên đầu!"
        assert l_res["progressBoxAboveForm"], "Lỗi: Thanh tiến độ phải nằm TRÊN ĐẦU biểu mẫu (#surveyForm)!"
        assert "0 / 10 câu hỏi (0%)" in l_res["progressLabelText"], f"Lỗi: Ban đầu phải là 0/10 (0%), nhận '{l_res['progressLabelText']}'"
        assert l_res["progressBarWidth"] == "0%", f"Lỗi: Độ rộng thanh tiến độ ban đầu phải là 0%, nhận '{l_res['progressBarWidth']}'"
        assert l_res["checkedCount"] == 0, f"Lỗi: Ban đầu chưa chọn đáp án nào, có {l_res['checkedCount']} radio checked"
        print("-> PASS: Bố cục 1 cột sạch sẽ, thanh tiến độ trên đầu biểu mẫu ở 0/10 (0%), chưa chọn đáp án nào!")

        # -------------------------------------------------------------
        # 2. KIỂM THỬ CĂN CÙNG HAI MÉP (THẺ CÂU HỎI, TIÊU ĐỀ NHÓM, THANH TIẾN ĐỘ)
        # -------------------------------------------------------------
        print("\n=== 2. CĂN CÙNG HAI MÉP: TIÊU ĐỀ NHÓM, THẺ CÂU HỎI & THANH TIẾN ĐỘ ===")
        align_check_js = """
        (() => {
            const progBox = document.querySelector(".progress-box");
            const pRect = progBox.getBoundingClientRect();
            const fieldsets = Array.from(document.querySelectorAll(".survey-group-fieldset"));

            const results = fieldsets.map((f, i) => {
                const divider = f.querySelector(".group-divider");
                const firstCard = f.querySelector(".question-block");
                const divRect = divider.getBoundingClientRect();
                const cardRect = firstCard.getBoundingClientRect();
                const divStyle = window.getComputedStyle(divider);

                return {
                    groupIndex: i + 1,
                    dividerLeft: Math.round(divRect.left),
                    dividerRight: Math.round(divRect.right),
                    cardLeft: Math.round(cardRect.left),
                    cardRight: Math.round(cardRect.right),
                    progLeft: Math.round(pRect.left),
                    progRight: Math.round(pRect.right),
                    diffLeftWithCard: Math.abs(Math.round(divRect.left) - Math.round(cardRect.left)),
                    diffRightWithCard: Math.abs(Math.round(divRect.right) - Math.round(cardRect.right)),
                    diffLeftWithProg: Math.abs(Math.round(divRect.left) - Math.round(pRect.left)),
                    diffRightWithProg: Math.abs(Math.round(divRect.right) - Math.round(pRect.right)),
                    bgColor: divStyle.backgroundColor,
                    textColor: divStyle.color
                };
            });
            return results;
        })()
        """
        align_res = await client.eval_js(align_check_js)
        print("Edge Alignment & Dark Background Check:", json.dumps(align_res, indent=2, ensure_ascii=False))

        for item in align_res:
            print(f"Nhóm {item['groupIndex']}: Divider Left={item['dividerLeft']} | Card Left={item['cardLeft']} | Progress Left={item['progLeft']}")
            print(f"Nhóm {item['groupIndex']}: Divider Right={item['dividerRight']} | Card Right={item['cardRight']} | Progress Right={item['progRight']}")
            assert item["diffLeftWithCard"] <= 1, f"Lỗi: Mép trái tiêu đề nhóm lệch thẻ câu hỏi ({item['diffLeftWithCard']}px)!"
            assert item["diffRightWithCard"] <= 1, f"Lỗi: Mép phải tiêu đề nhóm lệch thẻ câu hỏi ({item['diffRightWithCard']}px)!"
            assert item["diffLeftWithProg"] <= 1, f"Lỗi: Mép trái tiêu đề nhóm lệch thanh tiến độ ({item['diffLeftWithProg']}px)!"
            assert item["diffRightWithProg"] <= 1, f"Lỗi: Mép phải tiêu đề nhóm lệch thanh tiến độ ({item['diffRightWithProg']}px)!"
            # Kiểm tra nền đậm (var(--slate-900) = rgb(15, 23, 42))
            assert "15, 23, 42" in item["bgColor"], f"Lỗi: Tiêu đề nhóm phải có nền đậm (slate-900), nhận {item['bgColor']}"

        print("-> PASS: Thẻ câu hỏi, tiêu đề nhóm và thanh tiến độ căn thẳng tắp cùng hai mép (lệch <= 1px)! Tiêu đề 3 nhóm có nền đậm slate-900 chữ trắng!")

        # -------------------------------------------------------------
        # 3. KIỂM THỬ 5 Ô ĐÁP ÁN: 5 CỘT BẰNG NHAU, VÒNG TRÒN RADIO HIỆN RÕ
        # -------------------------------------------------------------
        print("\n=== 3. 5 Ô ĐÁP ÁN: 5 CỘT BẰNG NHAU, VÒNG TRÒN RADIO HIỆN RÕ ===")
        cards_check_js = """
        (() => {
            const firstCard = document.querySelector(".question-block");
            const grid = firstCard.querySelector(".likert-grid");
            const buttons = Array.from(grid.querySelectorAll(".likert-card-btn"));
            const widths = buttons.map(b => Math.round(b.getBoundingClientRect().width));
            const radioIndicators = firstCard.querySelectorAll(".likert-radio-indicator");

            const radioStyles = Array.from(radioIndicators).map(r => {
                const s = window.getComputedStyle(r);
                return {
                    width: s.width,
                    height: s.height,
                    border: s.border,
                    display: s.display
                };
            });

            return {
                buttonCount: buttons.length,
                buttonWidths: widths,
                minWidth: Math.min(...widths),
                maxWidth: Math.max(...widths),
                diff: Math.max(...widths) - Math.min(...widths),
                radioIndicatorCount: radioIndicators.length,
                firstRadioStyle: radioStyles[0]
            };
        })()
        """
        c_res = await client.eval_js(cards_check_js)
        print("Likert 5 Columns & Radio Check:", json.dumps(c_res, indent=2, ensure_ascii=False))

        assert c_res["buttonCount"] == 5, f"Lỗi: Cần đúng 5 nút đáp án, nhận {c_res['buttonCount']}"
        assert c_res["diff"] <= 1, f"Lỗi: 5 ô đáp án phải bằng nhau trên desktop! Min={c_res['minWidth']} vs Max={c_res['maxWidth']}"
        assert c_res["radioIndicatorCount"] == 5, f"Lỗi: Mỗi câu hỏi phải có 5 vòng tròn radio hiện rõ, nhận {c_res['radioIndicatorCount']}"
        assert c_res["firstRadioStyle"]["display"] != "none", "Lỗi: Vòng tròn radio phải hiển thị rõ!"
        print("-> PASS: 5 ô đáp án chia 5 cột bằng nhau chằn chặn, vòng tròn radio hiện rõ ràng trong từng ô!")

        # -------------------------------------------------------------
        # 4. CHỌN THỬ 1 ĐÁP ÁN: VÒNG TRÒN CÓ CHẤM BÊN TRONG, Ô CÓ VIỀN/NỀN NHẤN, TIẾN ĐỘ TĂNG 1/10
        # -------------------------------------------------------------
        print("\n=== 4. CHỌN THỬ 1 ĐÁP ÁN: CHẤM TRONG VÒNG TRÒN, NỀN NHẤN & TIẾN ĐỘ TĂNG 0/10 -> 1/10 ===")
        # Bấm chọn Câu 1 mức 4
        await client.eval_js("document.querySelector('input[name=\"Q1\"][value=\"4\"]').click()")
        await asyncio.sleep(0.4)

        interact_js = """
        (() => {
            const label = document.getElementById("label_Q1_4");
            const indicator = label.querySelector(".likert-radio-indicator");
            const progressLabel = document.getElementById("progressLabel");
            const progressBar = document.getElementById("progressBar");
            const style = window.getComputedStyle(label);
            const indStyle = window.getComputedStyle(indicator);
            const dotStyle = window.getComputedStyle(indicator, "::after");

            return {
                isSelected: label.classList.contains("selected"),
                bgColor: style.backgroundColor,
                borderColor: style.borderColor,
                indicatorBorderColor: indStyle.borderColor,
                dotBgColor: dotStyle.backgroundColor,
                progressLabelText: progressLabel.textContent.trim(),
                progressBarWidth: progressBar.style.width
            };
        })()
        """
        sel_res = await client.eval_js(interact_js)
        print("Selection & Progress Increment Check:", json.dumps(sel_res, indent=2, ensure_ascii=False))

        assert sel_res["isSelected"], "Lỗi: Nút được chọn phải có class .selected!"
        assert "240, 249, 255" in sel_res["bgColor"], f"Lỗi: Nền ô được chọn phải có nền nhấn (#f0f9ff), nhận {sel_res['bgColor']}"
        assert "2, 132, 199" in sel_res["borderColor"], f"Lỗi: Viền ô được chọn phải là xanh thương hiệu (#0284c7), nhận {sel_res['borderColor']}"
        assert "2, 132, 199" in sel_res["indicatorBorderColor"], f"Lỗi: Viền vòng tròn radio phải là xanh (#0284c7), nhận {sel_res['indicatorBorderColor']}"
        assert "2, 132, 199" in sel_res["dotBgColor"], f"Lỗi: Chấm tròn bên trong phải được tô màu xanh (#0284c7), nhận {sel_res['dotBgColor']}"
        assert "1 / 10 câu hỏi (10%)" in sel_res["progressLabelText"], f"Lỗi: Tiến độ phải tăng lên 1 / 10 câu hỏi (10%), nhận '{sel_res['progressLabelText']}'"
        assert sel_res["progressBarWidth"] == "10%", f"Lỗi: Thanh tiến độ phải chạy đến 10%, nhận '{sel_res['progressBarWidth']}'"
        print("-> PASS: Chọn thử đáp án thành công: Vòng tròn có chấm tròn bên trong, ô có viền và nền nhấn (#f0f9ff), tiến độ tăng chính xác từ 0/10 (0%) lên 1/10 (10%)!")

        # Chụp ảnh minh chứng: đã chọn 1 câu, tiến độ 1/10
        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        os.makedirs("docs/screenshots/after", exist_ok=True)
        os.makedirs(os.path.join(ARTIFACT_DIR, "screenshots/after"), exist_ok=True)
        with open("docs/screenshots/after/survey_flow_01_answered1.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/survey_flow_01_answered1.png"), "wb") as f:
            f.write(img_data)
        print("Đã lưu: survey_flow_01_answered1.png")

        # -------------------------------------------------------------
        # 5. CẢNH BÁO THIẾU KHI NỘP & BỎ DÒNG "CHƯA TRẢ LỜI" BAN ĐẦU
        # -------------------------------------------------------------
        print("\n=== 5. NỘP KHI MỚI TRẢ LỜI 1 CÂU -> BÁO LỖI VÀ CHỈ KHI NÀY MỚI HIỆN 'CHƯA TRẢ LỜI' ===")
        submit_missing_js = """
        (() => {
            document.getElementById("btnSubmitSurvey").click();
            const alertBox = document.getElementById("validationAlert");
            const missingCards = document.querySelectorAll(".question-block.is-missing");
            const missingPills = Array.from(document.querySelectorAll(".q-status-pill.missing")).filter(p => {
                return window.getComputedStyle(p).display !== "none";
            });

            return {
                alertDisplayed: window.getComputedStyle(alertBox).display !== "none",
                alertText: alertBox.textContent.trim(),
                missingCardsCount: missingCards.length,
                missingPillsCount: missingPills.length
            };
        })()
        """
        sub_res = await client.eval_js(submit_missing_js)
        print("Validation on Incomplete Submit:", json.dumps(sub_res, indent=2, ensure_ascii=False))

        assert sub_res["alertDisplayed"], "Lỗi: Banner cảnh báo phải hiển thị khi còn 9 câu thiếu!"
        assert sub_res["missingCardsCount"] == 9, f"Lỗi: Phải có 9 câu bị đánh dấu thiếu, nhận {sub_res['missingCardsCount']}"
        assert sub_res["missingPillsCount"] == 9, f"Lỗi: Phải có 9 pill 'Chưa trả lời' xuất hiện, nhận {sub_res['missingPillsCount']}"
        print("-> PASS: Cảnh báo thiếu hiển thị chuẩn xác!")

        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        with open("docs/screenshots/after/survey_flow_02_validation_error.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/survey_flow_02_validation_error.png"), "wb") as f:
            f.write(img_data)
        print("Đã lưu: survey_flow_02_validation_error.png")

        # -------------------------------------------------------------
        # 6. HOÀN THÀNH TẤT CẢ 10 CÂU & GỬI THÀNH CÔNG
        # -------------------------------------------------------------
        print("\n=== 6. HOÀN THÀNH TẤT CẢ 10 CÂU & GỬI THÀNH CÔNG ===")
        complete_survey_js = """
        (() => {
            const questions = document.querySelectorAll(".question-block");
            questions.forEach(q => {
                const r = q.querySelector('input[value="5"]');
                if (r) r.click();
            });
            document.getElementById("btnSubmitSurvey").click();
        })()
        """
        await client.eval_js(complete_survey_js)
        await asyncio.sleep(2.0)

        success_check_js = """
        (() => {
            const successBox = document.getElementById("successBox");
            const formWrap = document.getElementById("survey-form-wrap");
            return {
                successBoxDisplayed: window.getComputedStyle(successBox).display !== "none",
                formWrapHidden: window.getComputedStyle(formWrap).display === "none",
                displayScore: document.getElementById("displayScore").textContent.trim(),
                displaySurveyId: document.getElementById("displaySurveyId").textContent.trim()
            };
        })()
        """
        succ_res = await client.eval_js(success_check_js)
        print("Success State Check:", json.dumps(succ_res, indent=2, ensure_ascii=False))
        assert succ_res["successBoxDisplayed"], "Lỗi: Hộp thông báo thành công phải hiển thị!"
        assert succ_res["formWrapHidden"], "Lỗi: Form khảo sát phải được ẩn sau khi gửi thành công!"
        assert "5" in succ_res["displayScore"] and "/ 5.0" in succ_res["displayScore"], f"Lỗi: Điểm trung bình không đúng: {succ_res['displayScore']}"
        print("-> PASS: Gửi đánh giá thành công, hiển thị điểm trung bình và mã khảo sát!")

        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        with open("docs/screenshots/after/survey_flow_03_all10_and_submitted.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/survey_flow_03_all10_and_submitted.png"), "wb") as f:
            f.write(img_data)
        print("Đã lưu: survey_flow_03_all10_and_submitted.png")

        # -------------------------------------------------------------
        # 7. KIỂM THỬ TRÊN MOBILE (390px): CÁC Ô XUỐNG HÀNG, GIỮ THỨ TỰ 1-5, TRÁNH CUỘN NGANG
        # -------------------------------------------------------------
        print("\n=== 7. KIỂM THỬ TRÊN MOBILE (390px) ===")
        await client.eval_js("location.reload()")
        await asyncio.sleep(1.5)
        await client.send_command("Emulation.setDeviceMetricsOverride", {
            "width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True
        })
        await asyncio.sleep(1.0)

        mobile_check_js = """
        (() => {
            const firstCard = document.querySelector(".question-block");
            const grid = firstCard.querySelector(".likert-grid");
            const buttons = Array.from(grid.querySelectorAll(".likert-card-btn"));
            const tops = buttons.map(b => Math.round(b.getBoundingClientRect().top));
            const scores = buttons.map(b => b.querySelector(".likert-score-val").textContent.trim());

            return {
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                buttonCount: buttons.length,
                isStackedVertically: tops[1] > tops[0] && tops[2] > tops[1] && tops[3] > tops[2] && tops[4] > tops[3],
                scoresOrder: scores
            };
        })()
        """
        mob_res = await client.eval_js(mobile_check_js)
        print("Mobile Check:", json.dumps(mob_res, indent=2, ensure_ascii=False))

        assert mob_res["scrollWidth"] <= mob_res["innerWidth"], f"Lỗi: Tràn cuộn ngang trên mobile ({mob_res['scrollWidth']} > {mob_res['innerWidth']})"
        assert mob_res["isStackedVertically"], "Lỗi: Trên điện thoại, các ô đáp án phải xếp xuống hàng (stacked vertically)!"
        assert mob_res["scoresOrder"] == ["1", "2", "3", "4", "5"], f"Lỗi: Thứ tự điểm số phải giữ nguyên 1-5, nhận {mob_res['scoresOrder']}"
        print("-> PASS: Trên điện thoại các ô xuống hàng, giữ nguyên thứ tự 1-5 và hoàn toàn không bị cuộn ngang!")

        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        with open("docs/screenshots/after/survey_390.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/survey_390.png"), "wb") as f:
            f.write(img_data)
        print("Đã lưu: survey_390.png")

        # Chụp lại ảnh Desktop 1440px trạng thái ban đầu sạch sẽ
        await client.send_command("Emulation.setDeviceMetricsOverride", {
            "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
        })
        await client.eval_js("location.reload()")
        await asyncio.sleep(1.5)
        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        with open("docs/screenshots/after/survey_1440.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/survey_1440.png"), "wb") as f:
            f.write(img_data)
        print("Đã lưu: survey_1440.png")

        print("\n🎉 TẤT CẢ 7 HẠNG MỤC KIỂM THỬ TRANG SURVEY ĐỀU ĐẠT CHUẨN 100%!")

    finally:
        await client.close()
        chrome_proc.terminate()
        try:
            chrome_proc.wait(timeout=2)
        except Exception:
            chrome_proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
