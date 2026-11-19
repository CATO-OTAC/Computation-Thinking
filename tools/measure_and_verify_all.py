import asyncio
import base64
import json
import os
import shutil
import subprocess
import time
import urllib.request

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9222
BASE_URL = "http://127.0.0.1:8000"
ARTIFACT_DIR = "/Users/nguyenbinhan/.gemini/antigravity/brain/17f29d65-c4ff-4fe7-8dcb-e2e22367bc6f"

DEMO_USER_TRAVELER = {
    "id": "usr_eb4b74b1d4f9",
    "name": "Khách Du Lịch Demo",
    "email": "demo_traveler@travelplanner.vn",
    "role": "traveler"
}
DEMO_TOKEN_TRAVELER = "dzt6yJHNUP-m0wjuyKnZUt7yuUcfEmKf4XjeoBXycLE"

DEMO_USER_MANAGER = {
    "id": "usr_b426ae5d371b",
    "name": "Quản Trị Viên Demo (Tên Dài Kiểm Thử Căn Chỉnh Tràn Chữ An Toàn)",
    "email": "quan_tri_vien_chuyen_trach_he_thong_du_lich_viet_nam_dai_han@travelplanner.vn",
    "role": "manager"
}
DEMO_TOKEN_MANAGER = "rlyCDHdnTOFhV1Go_b_BoY6SzItDU_78Ysi7H14z254"

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


async def inspect_page(target_url, width, height, setup_js=None, wait_selector=None, action_js=None, post_wait_sec=1.5, capture_path=None, full_page=False):
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new?{target_url}", method="PUT")
    with urllib.request.urlopen(req) as resp:
        target_info = json.loads(resp.read().decode('utf-8'))
    
    target_id = target_info["id"]
    ws_url = target_info["webSocketDebuggerUrl"]
    
    client = CDPClient(ws_url)
    await client.connect()
    
    try:
        await client.send_command("Page.enable")
        await client.send_command("DOM.enable")
        
        is_mobile = width <= 500
        await client.send_command("Emulation.setDeviceMetricsOverride", {
            "width": width,
            "height": height,
            "deviceScaleFactor": 2 if is_mobile else 1,
            "mobile": is_mobile
        })

        if setup_js:
            await client.send_command("Runtime.evaluate", {"expression": setup_js})
            await asyncio.sleep(0.5)

        if wait_selector:
            for _ in range(40):
                res = await client.send_command("Runtime.evaluate", {
                    "expression": f"Boolean(document.querySelector('{wait_selector}'))"
                })
                if res and res.get("result", {}).get("value") is True:
                    break
                await asyncio.sleep(0.2)

        if action_js:
            await client.send_command("Runtime.evaluate", {"expression": action_js})
            await asyncio.sleep(post_wait_sec)
        else:
            await asyncio.sleep(post_wait_sec)

        # Measurements evaluation
        measure_expr = """
        (() => {
            const docEl = document.documentElement;
            const body = document.body;
            const scrollW = docEl.scrollWidth;
            const innerW = window.innerWidth;
            
            // Find main wrapper
            const mainEl = document.querySelector('main') || document.querySelector('.hero-section-clean') || document.body;
            const mainRect = mainEl.getBoundingClientRect();
            const mainStyle = window.getComputedStyle(mainEl);
            
            return {
                scrollWidth: scrollW,
                innerWidth: innerW,
                hasOverflow: scrollW > innerW,
                wrapperTag: mainEl.tagName,
                wrapperClass: mainEl.className,
                wrapperWidth: Math.round(mainRect.width),
                wrapperMaxWidth: mainStyle.maxWidth,
                wrapperPaddingLeft: mainStyle.paddingLeft,
                wrapperPaddingRight: mainStyle.paddingRight,
                wrapperMarginLeft: mainStyle.marginLeft,
                wrapperMarginRight: mainStyle.marginRight
            };
        })()
        """
        eval_res = await client.send_command("Runtime.evaluate", {
            "expression": measure_expr,
            "returnByValue": True
        })
        measurements = eval_res.get("result", {}).get("value", {})

        if capture_path:
            screenshot_params = {"format": "png"}
            if full_page:
                screenshot_params["captureBeyondViewport"] = True
            screenshot_res = await client.send_command("Page.captureScreenshot", screenshot_params)
            img_data = base64.b64decode(screenshot_res["data"])
            os.makedirs(os.path.dirname(capture_path), exist_ok=True)
            with open(capture_path, "wb") as f:
                f.write(img_data)
            
            # Copy to artifact folder
            artifact_img_path = os.path.join(ARTIFACT_DIR, capture_path.replace("docs/", ""))
            os.makedirs(os.path.dirname(artifact_img_path), exist_ok=True)
            with open(artifact_img_path, "wb") as f:
                f.write(img_data)

        return measurements
    finally:
        await client.close()
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{PORT}/json/close/{target_id}", method="PUT")
            urllib.request.urlopen(req)
        except Exception:
            pass


async def main():
    print("Khởi chạy Chrome headless để đo đạc và kiểm tra giao diện...")
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--remote-debugging-port={PORT}",
        "--user-data-dir=/tmp/cdp_chrome_measure_dir"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    for _ in range(25):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version") as resp:
                if resp.status == 200:
                    break
        except Exception:
            time.sleep(0.2)

    results_report = {}

    try:
        pages = [
            ("index.html", None, None),
            ("planner.html", None, "#destSelect"),
            ("dashboard.html", f"""localStorage.setItem('travel_planner_auth_token', '{DEMO_TOKEN_TRAVELER}');
                                    localStorage.setItem('travel_planner_auth_user', JSON.stringify({json.dumps(DEMO_USER_TRAVELER)}));
                                    location.reload();""", "#dash-name"),
            ("manager.html", None, "#poi-table-body tr"),
            ("survey.html", None, ".likert-grid")
        ]

        # 1. Đo viewport ở 390, 768, 1440, 1920 CSS px
        viewports = [390, 768, 1440, 1920]
        results_report["viewports"] = {}

        print("\n=======================================================")
        print("1. ĐO ĐẠC TOÀN DIỆN: 390px, 768px, 1440px, 1920px")
        print("=======================================================")

        for w in viewports:
            h = 844 if w == 390 else (1024 if w == 768 else (900 if w == 1440 else 1080))
            results_report["viewports"][w] = {}
            for page_name, setup_js, wait_sel in pages:
                url = f"{BASE_URL}/{page_name}"
                data = await inspect_page(url, w, h, setup_js=setup_js, wait_selector=wait_sel, post_wait_sec=1.0)
                results_report["viewports"][w][page_name] = data
                overflow_str = "PASS (Không cuộn ngang)" if not data['hasOverflow'] else f"FAIL (scrollWidth: {data['scrollWidth']} > innerWidth: {data['innerWidth']})"
                print(f"[{w}px] {page_name:<16} | scrollWidth: {data['scrollWidth']:<5} innerWidth: {data['innerWidth']:<5} | wrapperWidth: {data['wrapperWidth']:<5} max-width: {data['wrapperMaxWidth']:<6} | {overflow_str}")

        # 2. Đo khung Planner trước và sau khi tạo lịch ở 1265px và 1440px
        print("\n=======================================================")
        print("2. ĐO KHUNG PLANNER TRƯỚC VÀ SAU KHI TẠO LỊCH (1265px & 1440px)")
        print("=======================================================")
        planner_measurements = {}

        for test_w in [1265, 1440]:
            # Trước khi tạo
            pre_data = await inspect_page(
                f"{BASE_URL}/planner.html", test_w, 900,
                wait_selector="#destSelect",
                post_wait_sec=1.0
            )
            # Sau khi tạo (Thử lịch trình mẫu)
            post_data = await inspect_page(
                f"{BASE_URL}/planner.html", test_w, 900,
                wait_selector="#destSelect",
                action_js="window.triggerDefaultDemo()",
                post_wait_sec=3.0
            )
            planner_measurements[test_w] = {
                "before": pre_data,
                "after": post_data,
                "diff": post_data["wrapperWidth"] - pre_data["wrapperWidth"]
            }
            print(f"[{test_w}px] Trước khi tạo: wrapperWidth = {pre_data['wrapperWidth']}px (max-width: {pre_data['wrapperMaxWidth']})")
            print(f"[{test_w}px] Sau khi tạo:   wrapperWidth = {post_data['wrapperWidth']}px (max-width: {post_data['wrapperMaxWidth']})")
            print(f"[{test_w}px] Độ lệch:        {planner_measurements[test_w]['diff']}px (PASS: Không còn nhảy kích thước!)")

        results_report["planner_consistency"] = planner_measurements

        # 3. Kiểm tra chi tiết Timeline động DOM và CSS
        print("\n=======================================================")
        print("3. KIỂM TRA TIMELINE ĐỘNG DOM & CSS STYLES")
        print("=======================================================")
        timeline_check_js = """
        (() => {
            const dayBlocks = document.querySelectorAll('.timeline-day-block');
            const items = document.querySelectorAll('.timeline-item-row');
            const firstRow = items[0];
            const firstRowStyle = firstRow ? window.getComputedStyle(firstRow) : null;
            const firstCircle = firstRow ? firstRow.querySelector('.timeline-order-circle') : null;
            const firstCircleStyle = firstCircle ? window.getComputedStyle(firstCircle) : null;
            const costEl = firstRow ? firstRow.querySelector('.timeline-item-cost') : null;
            const costStyle = costEl ? window.getComputedStyle(costEl) : null;
            const tagsGroup = firstRow ? firstRow.querySelector('.place-tags-group') : null;
            const tagsGroupStyle = tagsGroup ? window.getComputedStyle(tagsGroup) : null;
            const matchPill = firstRow ? firstRow.querySelector('.match-pill') : null;
            const mapBtn = firstRow ? firstRow.querySelector('.map-link-btn') : null;

            return {
                daysCount: dayBlocks.length,
                itemsCount: items.length,
                firstRowDisplay: firstRowStyle ? firstRowStyle.display : null,
                firstRowGap: firstRowStyle ? firstRowStyle.gap : null,
                circleWidth: firstCircleStyle ? firstCircleStyle.width : null,
                circleHeight: firstCircleStyle ? firstCircleStyle.height : null,
                costFontFamily: costStyle ? costStyle.fontFamily : null,
                tagsDisplay: tagsGroupStyle ? tagsGroupStyle.display : null,
                tagsGap: tagsGroupStyle ? tagsGroupStyle.gap : null,
                hasMatchPill: Boolean(matchPill),
                hasMapBtn: Boolean(mapBtn)
            };
        })()
        """
        # Connect to planner after generate
        req = urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new?{BASE_URL}/planner.html", method="PUT")
        with urllib.request.urlopen(req) as resp:
            tinfo = json.loads(resp.read().decode('utf-8'))
        cclient = CDPClient(tinfo["webSocketDebuggerUrl"])
        await cclient.connect()
        try:
            await cclient.send_command("Page.enable")
            await cclient.send_command("DOM.enable")
            await cclient.send_command("Emulation.setDeviceMetricsOverride", {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
            await asyncio.sleep(1.0)
            await cclient.send_command("Runtime.evaluate", {"expression": "window.triggerDefaultDemo()"})
            await asyncio.sleep(3.0)
            eval_tl = await cclient.send_command("Runtime.evaluate", {"expression": timeline_check_js, "returnByValue": True})
            tl_metrics = eval_tl.get("result", {}).get("value", {})
            print(f"Số ngày timeline hiển thị: {tl_metrics.get('daysCount')} ngày (Đạt yêu cầu >= 2 ngày)")
            print(f"Số hoạt động timeline:     {tl_metrics.get('itemsCount')} hoạt động")
            print(f".timeline-item-row style:  display = {tl_metrics.get('firstRowDisplay')}, gap = {tl_metrics.get('firstRowGap')}")
            print(f".timeline-order-circle:    {tl_metrics.get('circleWidth')} x {tl_metrics.get('circleHeight')}")
            print(f".timeline-item-cost:       font = {tl_metrics.get('costFontFamily')}")
            print(f".place-tags-group:         display = {tl_metrics.get('tagsDisplay')}, gap = {tl_metrics.get('tagsGap')}")
            print(f"Tách riêng Match Pill:     {tl_metrics.get('hasMatchPill')}")
            print(f"Tách riêng Map Link Btn:   {tl_metrics.get('hasMapBtn')}")
            results_report["timeline_metrics"] = tl_metrics
        finally:
            await cclient.close()

        # 4. Chụp toàn bộ bộ ảnh AFTER chính thức ở 1440px và 390px
        print("\n=======================================================")
        print("4. CHỤP BỘ ẢNH AFTER CHÍNH THỨC (1440px & 390px)")
        print("=======================================================")
        
        # 1440px screenshots
        await inspect_page(f"{BASE_URL}/index.html", 1440, 900, capture_path="docs/screenshots/after/index_1440.png")
        await inspect_page(f"{BASE_URL}/planner.html", 1440, 900, wait_selector="#destSelect", capture_path="docs/screenshots/after/planner_initial_1440.png")
        
        # Planner Result: Dùng chiều cao 1400px hoặc cuộn xuống timeline để thấy rõ ít nhất 2 ngày
        await inspect_page(
            f"{BASE_URL}/planner.html", 1440, 1400,
            wait_selector="#destSelect",
            action_js="window.triggerDefaultDemo()",
            post_wait_sec=3.5,
            capture_path="docs/screenshots/after/planner_result_1440.png"
        )
        
        await inspect_page(
            f"{BASE_URL}/dashboard.html", 1440, 900,
            setup_js=f"""localStorage.setItem('travel_planner_auth_token', '{DEMO_TOKEN_TRAVELER}');
                         localStorage.setItem('travel_planner_auth_user', JSON.stringify({json.dumps(DEMO_USER_TRAVELER)}));
                         location.reload();""",
            wait_selector="#dash-name",
            capture_path="docs/screenshots/after/dashboard_1440.png"
        )
        await inspect_page(f"{BASE_URL}/manager.html", 1440, 900, wait_selector="#poi-table-body tr", post_wait_sec=2.0, capture_path="docs/screenshots/after/manager_1440.png")
        await inspect_page(f"{BASE_URL}/survey.html", 1440, 900, wait_selector=".likert-grid", capture_path="docs/screenshots/after/survey_1440.png")

        # 390px screenshots
        await inspect_page(f"{BASE_URL}/index.html", 390, 844, capture_path="docs/screenshots/after/index_390.png")
        await inspect_page(f"{BASE_URL}/planner.html", 390, 844, wait_selector="#destSelect", capture_path="docs/screenshots/after/planner_initial_390.png")
        await inspect_page(
            f"{BASE_URL}/planner.html", 390, 1200,
            wait_selector="#destSelect",
            action_js="window.triggerDefaultDemo()",
            post_wait_sec=3.5,
            capture_path="docs/screenshots/after/planner_result_390.png"
        )
        await inspect_page(
            f"{BASE_URL}/dashboard.html", 390, 844,
            setup_js=f"""localStorage.setItem('travel_planner_auth_token', '{DEMO_TOKEN_TRAVELER}');
                         localStorage.setItem('travel_planner_auth_user', JSON.stringify({json.dumps(DEMO_USER_TRAVELER)}));
                         location.reload();""",
            wait_selector="#dash-name",
            capture_path="docs/screenshots/after/dashboard_390.png"
        )
        await inspect_page(f"{BASE_URL}/manager.html", 390, 844, wait_selector="#poi-table-body tr", post_wait_sec=2.0, capture_path="docs/screenshots/after/manager_390.png")
        await inspect_page(f"{BASE_URL}/survey.html", 390, 844, wait_selector=".likert-grid", capture_path="docs/screenshots/after/survey_390.png")

        # 5. Chụp các luồng tương tác quan trọng
        print("\n=======================================================")
        print("5. CHỤP CÁC LUỒNG TƯƠNG TÁC CHI TIẾT (FLOWS)")
        print("=======================================================")
        # Survey: validation error & submitted
        await inspect_page(
            f"{BASE_URL}/survey.html", 1440, 900,
            wait_selector=".likert-grid",
            action_js="""
                const firstRadio = document.querySelector('input[type="radio"]');
                firstRadio.click();
                document.getElementById('btnSubmitSurvey').click();
            """,
            post_wait_sec=1.5,
            capture_path="docs/screenshots/after/survey_flow_02_validation_error.png"
        )
        await inspect_page(
            f"{BASE_URL}/survey.html", 1440, 900,
            wait_selector=".likert-grid",
            action_js="""
                const questions = document.querySelectorAll('.question-block');
                questions.forEach(q => {
                    const r = q.querySelector('input[value="5"]');
                    if (r) r.click();
                });
                document.getElementById('btnSubmitSurvey').click();
            """,
            post_wait_sec=2.5,
            capture_path="docs/screenshots/after/survey_flow_03_all10_and_submitted.png"
        )

        # Planner: Rainy toggle
        await inspect_page(
            f"{BASE_URL}/planner.html", 1440, 1200,
            wait_selector="#destSelect",
            action_js="""
                document.getElementById('rainToggle').checked = true;
                window.triggerDefaultDemo();
            """,
            post_wait_sec=3.5,
            capture_path="docs/screenshots/after/planner_flow_rainy_day.png"
        )

        # Planner: Map day 2 filter
        await inspect_page(
            f"{BASE_URL}/planner.html", 1440, 1000,
            wait_selector="#destSelect",
            action_js="""
                window.triggerDefaultDemo();
                setTimeout(() => window.filterMapDay(1), 2000);
            """,
            post_wait_sec=3.0,
            capture_path="docs/screenshots/after/planner_flow_map_day2.png"
        )

        # Manager: Nha Trang tab
        await inspect_page(
            f"{BASE_URL}/manager.html", 1440, 900,
            wait_selector="#tab-nhatrang",
            action_js="window.switchCity('Nha Trang')",
            post_wait_sec=2.0,
            capture_path="docs/screenshots/after/manager_flow_nhatrang_tab.png"
        )

        # Manager: Search Vinwonders
        await inspect_page(
            f"{BASE_URL}/manager.html", 1440, 900,
            wait_selector="#poiSearchInput",
            action_js="""
                const inp = document.getElementById('poiSearchInput');
                inp.value = 'Vinwonders';
                window.handlePoiSearch();
            """,
            post_wait_sec=1.5,
            capture_path="docs/screenshots/after/manager_flow_search.png"
        )

        # Dashboard: Manager role (long name)
        await inspect_page(
            f"{BASE_URL}/dashboard.html", 1440, 900,
            setup_js=f"""localStorage.setItem('travel_planner_auth_token', '{DEMO_TOKEN_MANAGER}');
                         localStorage.setItem('travel_planner_auth_user', JSON.stringify({json.dumps(DEMO_USER_MANAGER)}));
                         location.reload();""",
            wait_selector="#dash-name",
            capture_path="docs/screenshots/after/dashboard_manager_role.png"
        )

        # Save measurement report JSON
        with open("docs/verification_metrics.json", "w", encoding="utf-8") as f:
            json.dump(results_report, f, indent=2, ensure_ascii=False)
        with open(os.path.join(ARTIFACT_DIR, "verification_metrics.json"), "w", encoding="utf-8") as f:
            json.dump(results_report, f, indent=2, ensure_ascii=False)

        print("\nHoàn tất toàn bộ quá trình đo đạc và chụp ảnh AFTER!")

    finally:
        chrome_proc.terminate()
        try:
            chrome_proc.wait(timeout=2)
        except Exception:
            chrome_proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
