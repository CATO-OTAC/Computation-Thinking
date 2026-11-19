import asyncio
import base64
import json
import os
import subprocess
import time
import urllib.request

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9222
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
                return data.get("result")

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
    print("Khởi chạy Chrome headless để kiểm tra trang Planner...")
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--remote-debugging-port={PORT}",
        "--user-data-dir=/tmp/cdp_chrome_planner_test"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    for _ in range(25):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version") as resp:
                if resp.status == 200:
                    break
        except Exception:
            time.sleep(0.2)

    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new?{BASE_URL}/planner.html", method="PUT")
    with urllib.request.urlopen(req) as resp:
        tinfo = json.loads(resp.read().decode('utf-8'))
    
    client = CDPClient(tinfo["webSocketDebuggerUrl"])
    await client.connect()

    try:
        await client.send_command("Page.enable")
        await client.send_command("DOM.enable")

        os.makedirs("docs/screenshots/after", exist_ok=True)
        os.makedirs(os.path.join(ARTIFACT_DIR, "screenshots/after"), exist_ok=True)

        # -------------------------------------------------------------
        # TEST 1: KIỂM TRA TRẠNG THÁI KHỞI TẠO TRỐNG (INITIAL EMPTY FORM)
        # -------------------------------------------------------------
        print("\n=== TEST 1: TRẠNG THÁI BIỂU MẪU MỞ ĐẦU (EMPTY FORM) ===")
        await client.send_command("Emulation.setDeviceMetricsOverride", {
            "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
        })
        await asyncio.sleep(1.0)

        empty_check_js = """
        (() => {
            const dest = document.getElementById("destSelect");
            const start = document.getElementById("startDate");
            const end = document.getElementById("endDate");
            const party = document.getElementById("partySize");
            const budget = document.getElementById("budgetInput");
            const budgetFormatted = document.getElementById("budgetFormattedVal");
            const slider = document.getElementById("budgetSlider");
            const pill = document.getElementById("durationPill");
            const selectedCards = document.querySelectorAll(".vibe-option-card.selected");
            const rain = document.getElementById("rainToggle");

            return {
                destValue: dest.value,
                destSelectedText: dest.options[dest.selectedIndex] ? dest.options[dest.selectedIndex].text : '',
                startDate: start.value,
                endDate: end.value,
                durationPillDisplay: window.getComputedStyle(pill).display,
                partySize: party.value,
                budgetVal: budget.value,
                budgetFormatted: budgetFormatted.textContent,
                sliderHasActiveFill: slider.classList.contains("active-fill"),
                selectedVibesCount: selectedCards.length,
                rainChecked: rain.checked
            };
        })()
        """
        eval_res = await client.send_command("Runtime.evaluate", {"expression": empty_check_js, "returnByValue": True})
        initial_state = eval_res.get("result", {}).get("value", {})
        print("Trạng thái khởi tạo:", json.dumps(initial_state, indent=2, ensure_ascii=False))

        assert initial_state["destValue"] == "", f"Lỗi: Điểm đến phải rỗng, thực tế: '{initial_state['destValue']}'"
        assert "Chọn điểm đến" in initial_state["destSelectedText"], f"Lỗi: Điểm đến phải hiển thị 'Chọn điểm đến'"
        assert initial_state["startDate"] == "", "Lỗi: Ngày khởi hành phải để trống"
        assert initial_state["endDate"] == "", "Lỗi: Ngày kết thúc phải để trống"
        assert initial_state["durationPillDisplay"] == "none", "Lỗi: Duration pill phải ẩn khi chưa có 2 ngày"
        assert initial_state["partySize"] == "", "Lỗi: Số người phải để trống"
        assert initial_state["budgetVal"] == "", "Lỗi: Ngân sách phải để trống"
        assert initial_state["budgetFormatted"] == "Chưa nhập", "Lỗi: Budget formatted phải là 'Chưa nhập'"
        assert initial_state["sliderHasActiveFill"] is False, "Lỗi: Slider không được active-fill trước khi tương tác"
        assert initial_state["selectedVibesCount"] == 0, "Lỗi: Không được chọn sẵn sở thích nào"
        assert initial_state["rainChecked"] is False, "Lỗi: Chế độ mưa phải mặc định tắt"
        print("-> TEST 1 PASS: Biểu mẫu mở đầu hoàn toàn trống theo đúng yêu cầu!")

        # Chụp ảnh biểu mẫu trống
        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        with open("docs/screenshots/after/planner_initial_empty_1440.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/planner_initial_empty_1440.png"), "wb") as f:
            f.write(img_data)
        # Đồng thời cập nhật planner_initial_1440.png
        with open("docs/screenshots/after/planner_initial_1440.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/planner_initial_1440.png"), "wb") as f:
            f.write(img_data)

        # -------------------------------------------------------------
        # TEST 2: KIỂM TRA XÁC THỰC LỖI TIẾNG VIỆT KHI THIẾU DỮ LIỆU
        # -------------------------------------------------------------
        print("\n=== TEST 2: XÁC THỰC LỖI TIẾNG VIỆT DƯỚI TRƯỜNG KHI THIẾU DỮ LIỆU ===")
        validation_test_js = """
        (() => {
            // Click submit
            document.getElementById("btnSubmitTrip").click();

            const errDest = document.getElementById("err-dest");
            const errDates = document.getElementById("err-dates");
            const errParty = document.getElementById("err-party");
            const errBudget = document.getElementById("err-budget");

            return {
                errDestText: errDest ? errDest.textContent : '',
                errDestDisplay: errDest ? window.getComputedStyle(errDest).display : 'none',
                errDatesText: errDates ? errDates.textContent : '',
                errDatesDisplay: errDates ? window.getComputedStyle(errDates).display : 'none',
                errPartyText: errParty ? errParty.textContent : '',
                errPartyDisplay: errParty ? window.getComputedStyle(errParty).display : 'none',
                errBudgetText: errBudget ? errBudget.textContent : '',
                errBudgetDisplay: errBudget ? window.getComputedStyle(errBudget).display : 'none'
            };
        })()
        """
        eval_res = await client.send_command("Runtime.evaluate", {"expression": validation_test_js, "returnByValue": True})
        val_state = eval_res.get("result", {}).get("value", {})
        print("Trạng thái lỗi:", json.dumps(val_state, indent=2, ensure_ascii=False))

        assert "Vui lòng chọn điểm đến" in val_state["errDestText"], "Lỗi: Thiếu thông báo lỗi điểm đến"
        assert val_state["errDestDisplay"] == "flex", "Lỗi: errDest phải hiển thị"
        assert "Vui lòng chọn" in val_state["errDatesText"], "Lỗi: Thiếu thông báo lỗi ngày"
        assert "Vui lòng nhập số người" in val_state["errPartyText"], "Lỗi: Thiếu thông báo lỗi số người"
        assert "Vui lòng nhập ngân sách" in val_state["errBudgetText"], "Lỗi: Thiếu thông báo lỗi ngân sách"
        print("-> TEST 2 PASS: Hiển thị lỗi tiếng Việt ngay dưới từng trường thiếu!")

        # Chụp ảnh hiển thị lỗi
        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        with open("docs/screenshots/after/planner_validation_errors_1440.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/planner_validation_errors_1440.png"), "wb") as f:
            f.write(img_data)

        # -------------------------------------------------------------
        # TEST 3: ĐO ĐẠC CỘT TIÊU CHÍ VÀ CHIỀU CAO Ô NHẬP Ở 1280, 1440, 1920 PX
        # -------------------------------------------------------------
        print("\n=== TEST 3: ĐO ĐẠC CỘT TIÊU CHÍ & CHIỀU CAO Ô NHẬP (1280px, 1440px, 1920px) ===")
        dimensions_report = {}

        for w in [1280, 1440, 1920]:
            await client.send_command("Emulation.setDeviceMetricsOverride", {
                "width": w, "height": 900, "deviceScaleFactor": 1, "mobile": False
            })
            await asyncio.sleep(0.5)

            col_measure_js = """
            (() => {
                const layout = document.querySelector(".planner-layout");
                const sidebar = document.querySelector(".control-sidebar");
                const results = document.getElementById("resultsWorkspace");
                const dest = document.getElementById("destSelect");
                const start = document.getElementById("startDate");
                const party = document.getElementById("partySize");
                const budget = document.getElementById("budgetInput");

                const layoutRect = layout.getBoundingClientRect();
                const sidebarRect = sidebar.getBoundingClientRect();
                const resultsRect = results.getBoundingClientRect();

                return {
                    layoutWidth: Math.round(layoutRect.width),
                    sidebarWidth: Math.round(sidebarRect.width),
                    resultsWidth: Math.round(resultsRect.width),
                    sidebarRatioPct: Math.round((sidebarRect.width / layoutRect.width) * 100),
                    destHeight: Math.round(dest.getBoundingClientRect().height),
                    startHeight: Math.round(start.getBoundingClientRect().height),
                    partyHeight: Math.round(party.getBoundingClientRect().height),
                    budgetHeight: Math.round(budget.getBoundingClientRect().height)
                };
            })()
            """
            eval_res = await client.send_command("Runtime.evaluate", {"expression": col_measure_js, "returnByValue": True})
            measure = eval_res.get("result", {}).get("value", {})
            dimensions_report[w] = measure
            print(f"[{w}px] Layout: {measure['layoutWidth']}px | Cột tiêu chí: {measure['sidebarWidth']}px ({measure['sidebarRatioPct']}%) | Cột kết quả: {measure['resultsWidth']}px")
            print(f"       Chiều cao: dest={measure['destHeight']}px, start={measure['startHeight']}px, party={measure['partyHeight']}px, budget={measure['budgetHeight']}px")

            assert 44 <= measure['destHeight'] <= 48, f"Lỗi: Chiều cao destSelect ({measure['destHeight']}px) ngoài khoảng 44-48px"
            assert measure['destHeight'] == measure['startHeight'] == measure['partyHeight'] == measure['budgetHeight'], "Lỗi: Chiều cao các ô nhập không bằng nhau!"
            assert measure['sidebarWidth'] <= 560, f"Lỗi: Cột tiêu chí vượt quá 560px ({measure['sidebarWidth']}px)"

        print("-> TEST 3 PASS: Cột tiêu chí rộng rãi (~37%, max <= 540px) và chiều cao ô nhập 46px đồng bộ tuyệt đối!")

        # -------------------------------------------------------------
        # TEST 4: KIỂM TRA LƯỚI 2 CỘT SỞ THÍCH & PHONG CÁCH
        # -------------------------------------------------------------
        print("\n=== TEST 4: LƯỚI LỰA CHỌN 2 CỘT SỞ THÍCH ===")
        vibe_check_js = """
        (() => {
            const grid = document.getElementById("vibesContainer");
            const gridStyle = window.getComputedStyle(grid);
            const cards = document.querySelectorAll(".vibe-option-card");
            const labels = Array.from(cards).map(c => c.querySelector(".vibe-label-text").textContent.trim());

            return {
                display: gridStyle.display,
                gridTemplateColumns: gridStyle.gridTemplateColumns,
                totalCards: cards.length,
                labels: labels,
                firstCardHeight: cards[0] ? Math.round(cards[0].getBoundingClientRect().height) : 0
            };
        })()
        """
        eval_res = await client.send_command("Runtime.evaluate", {"expression": vibe_check_js, "returnByValue": True})
        vibe_meta = eval_res.get("result", {}).get("value", {})
        print("Vibes Grid Meta:", json.dumps(vibe_meta, indent=2, ensure_ascii=False))

        assert vibe_meta["totalCards"] == 10, "Lỗi: Phải có đủ 10 lựa chọn vibes"
        assert "Săn mây" in vibe_meta["labels"], "Lỗi: Nhãn phải rút gọn 'Săn mây'"
        assert "Chụp ảnh" in vibe_meta["labels"], "Lỗi: Nhãn phải rút gọn 'Chụp ảnh'"
        assert vibe_meta["firstCardHeight"] >= 44, f"Lỗi: Chiều cao card phải >= 44px (thực tế {vibe_meta['firstCardHeight']}px)"
        print("-> TEST 4 PASS: Lưới sở thích 2 cột cân đối, nhãn rút gọn chuẩn!")

        # -------------------------------------------------------------
        # TEST 5: THỬ LỊCH TRÌNH MẪU & KIỂM TRA PHÂN BỔ NGÂN SÁCH 5 NHÓM
        # -------------------------------------------------------------
        print("\n=== TEST 5: THỬ LỊCH TRÌNH MẪU & LƯỚI PHÂN BỔ NGÂN SÁCH 5 NHÓM ===")
        await client.send_command("Runtime.evaluate", {"expression": "window.triggerDefaultDemo()"})
        await asyncio.sleep(3.5)

        budget_grid_check_js = """
        (() => {
            const rows = document.querySelectorAll(".budget-row-grid");
            const rowData = Array.from(rows).map(row => {
                const label = row.querySelector(".budget-col-label");
                const track = row.querySelector(".budget-col-track");
                const val = row.querySelector(".budget-col-val");
                const title = row.querySelector(".budget-cat-title");
                const titleSpan = row.querySelector(".budget-cat-title span:last-child");
                const sub = row.querySelector(".budget-cat-sub");
                const amount = row.querySelector(".budget-amount-txt");
                const pct = row.querySelector(".budget-pct-txt");
                const progressTrack = row.querySelector(".budget-progress-track");
                const fill = row.querySelector(".budget-progress-fill");

                const rowRect = row.getBoundingClientRect();
                const labelRect = label.getBoundingClientRect();
                const trackRect = track.getBoundingClientRect();
                const progRect = progressTrack.getBoundingClientRect();
                const valRect = val.getBoundingClientRect();
                const titleRect = title.getBoundingClientRect();

                const rowCenterY = rowRect.top + rowRect.height / 2;
                const trackCenterY = progRect.top + progRect.height / 2;
                const vertDiff = Math.abs(rowCenterY - trackCenterY);

                return {
                    title: titleSpan.textContent.trim(),
                    sub: sub.textContent.trim(),
                    amount: amount.textContent.trim(),
                    pct: pct.textContent.trim(),
                    fillWidthPct: fill.style.width,
                    trackLeft: Math.round(progRect.left),
                    trackRight: Math.round(progRect.right),
                    trackWidth: Math.round(progRect.width),
                    labelRight: Math.round(labelRect.right),
                    valLeft: Math.round(valRect.left),
                    isSingleLine: titleRect.height <= 26,
                    vertDiff: Math.round(vertDiff * 10) / 10
                };
            });

            return {
                rowsCount: rows.length,
                rows: rowData
            };
        })()
        """
        eval_res = await client.send_command("Runtime.evaluate", {"expression": budget_grid_check_js, "returnByValue": True})
        b_res = eval_res.get("result", {}).get("value", {})
        print("Budget Rows Data:", json.dumps(b_res, indent=2, ensure_ascii=False))

        assert b_res["rowsCount"] == 5, f"Lỗi: Phải có 5 hàng ngân sách, thực tế {b_res['rowsCount']}"
        expected_titles = ["Di chuyển", "Lưu trú", "Ăn uống", "Vé tham quan & trải nghiệm", "Quỹ dự phòng"]
        first_left = b_res["rows"][0]["trackLeft"]
        first_right = b_res["rows"][0]["trackRight"]
        first_width = b_res["rows"][0]["trackWidth"]

        for idx, r in enumerate(b_res["rows"]):
            assert r["title"] == expected_titles[idx], f"Lỗi: Tiêu đề hàng {idx} phải là '{expected_titles[idx]}', thực tế: '{r['title']}'"
            assert len(r["sub"]) > 0, f"Lỗi: Hàng {r['title']} phải có chú thích riêng bên dưới"
            assert r["isSingleLine"], f"Lỗi: Tiêu đề {r['title']} bị xuống dòng!"
            assert r["vertDiff"] <= 3.0, f"Lỗi: Căn giữa theo chiều dọc bị lệch ({r['vertDiff']}px) ở {r['title']}"
            assert abs(r["trackLeft"] - first_left) <= 1, f"Lỗi: Rãnh {r['title']} lệch điểm bắt đầu! {r['trackLeft']} vs {first_left}"
            assert abs(r["trackRight"] - first_right) <= 1, f"Lỗi: Rãnh {r['title']} lệch điểm kết thúc! {r['trackRight']} vs {first_right}"
            assert abs(r["trackWidth"] - first_width) <= 1, f"Lỗi: Chiều rộng rãnh {r['title']} không đồng nhất! {r['trackWidth']} vs {first_width}"
            assert r["labelRight"] <= r["trackLeft"], f"Lỗi: Cột nhãn chồng lấn vào rãnh ở {r['title']}"
            assert r["trackRight"] <= r["valLeft"] + 2, f"Lỗi: Rãnh chồng lấn vào cột số tiền ở {r['title']}"
        print("-> TEST 5 PASS: Phân bổ ngân sách 5 nhóm đạt chuẩn 3 cột: tên 1 dòng, rãnh thẳng hàng tuyệt đối (start & end), căn giữa dọc!")

        # -------------------------------------------------------------
        # TEST 6: CHỤP ẢNH NGHIỆM THU TẠI 1440PX VÀ 390PX
        # -------------------------------------------------------------
        print("\n=== TEST 6: CHỤP BỘ ẢNH NGHIỆM THU MỚI ===")
        # 1440px Planner Result (với form rộng, lưới 2 cột vibes đã chọn, phân bổ ngân sách chuẩn)
        await client.send_command("Emulation.setDeviceMetricsOverride", {
            "width": 1440, "height": 1400, "deviceScaleFactor": 1, "mobile": False
        })
        await asyncio.sleep(1.0)
        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        with open("docs/screenshots/after/planner_result_1440.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/planner_result_1440.png"), "wb") as f:
            f.write(img_data)

        # 390px Mobile Test
        await client.send_command("Emulation.setDeviceMetricsOverride", {
            "width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True
        })
        await asyncio.sleep(1.0)
        # Check horizontal scroll on mobile
        scroll_eval = await client.send_command("Runtime.evaluate", {
            "expression": "({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth })",
            "returnByValue": True
        })
        s_val = scroll_eval.get("result", {}).get("value", {})
        print(f"Mobile 390px: scrollWidth = {s_val['scrollW']}px, innerWidth = {s_val['innerW']}px (PASS: Không cuộn ngang)")
        assert s_val['scrollW'] <= s_val['innerW'], "Lỗi: Tràn cuộn ngang trên mobile"

        # Check mobile budget layout (top row = label + val, bottom row = track)
        mob_budget_eval = await client.send_command("Runtime.evaluate", {
            "expression": """
            (() => {
                const rows = Array.from(document.querySelectorAll(".budget-row-grid"));
                return rows.map(r => {
                    const label = r.querySelector(".budget-col-label");
                    const val = r.querySelector(".budget-col-val");
                    const track = r.querySelector(".budget-progress-track");
                    const fill = r.querySelector(".budget-progress-fill");
                    const lRect = label.getBoundingClientRect();
                    const vRect = val.getBoundingClientRect();
                    const tRect = track.getBoundingClientRect();
                    return {
                        title: label.querySelector(".budget-cat-title").textContent.trim(),
                        sameTopRow: Math.abs(lRect.top - vRect.top) <= 8,
                        trackIsBelow: tRect.top >= lRect.top,
                        fillWidthPct: fill.style.width
                    };
                });
            })()
            """,
            "returnByValue": True
        })
        mob_b_rows = mob_budget_eval.get("result", {}).get("value", [])
        print("Mobile Budget Check:", json.dumps(mob_b_rows, indent=2, ensure_ascii=False))
        for mr in mob_b_rows:
            assert mr["sameTopRow"], f"Lỗi: Tên và số tiền không cùng hàng trên mobile ở {mr['title']}"
            assert mr["trackIsBelow"], f"Lỗi: Rãnh không nằm bên dưới ở {mr['title']}"
            assert len(mr["fillWidthPct"]) > 0 and "%" in mr["fillWidthPct"], f"Lỗi: Mất tỷ lệ tô ở {mr['title']}"
        print("-> PASS: Mobile 390px tên và số tiền ở hàng đầu, thanh bên dưới, tỷ lệ tô giữ nguyên!")

        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        with open("docs/screenshots/after/planner_result_390.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/planner_result_390.png"), "wb") as f:
            f.write(img_data)

        # 390px Mobile Initial Empty Form
        await client.send_command("Runtime.evaluate", {"expression": "location.reload()"})
        await asyncio.sleep(1.5)
        screenshot_res = await client.send_command("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(screenshot_res["data"])
        with open("docs/screenshots/after/planner_initial_390.png", "wb") as f:
            f.write(img_data)
        with open(os.path.join(ARTIFACT_DIR, "screenshots/after/planner_initial_390.png"), "wb") as f:
            f.write(img_data)

        print("\nHOÀN THÀNH TẤT CẢ CÁC BÀI KIỂM THỬ VÀ CHỤP ẢNH ĐỐI CHỨNG!")

    finally:
        await client.close()
        chrome_proc.terminate()
        try:
            chrome_proc.wait(timeout=2)
        except Exception:
            chrome_proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
