# GIT COMMIT LOG
**Course:** CSC10014 / Computational Thinking / 2026  
**Group ID:** Group 02  
**Tên đề tài:** Trợ lý Ảo Lập Kế hoạch Du lịch Cá nhân hóa (Personalized Travel Planner Assistant)  
**Lab Assignment:** Lab 04 – From Spec to Code: Phased Vibe-coding with AI  
**Package ID:** Lab04 - Group 02  
**Repository:** https://github.com/CATO-OTAC/Computation-Thinking  

---

## 1. EXTRACTION SPECIFICATIONS

```bash
# Trích xuất toàn bộ commit liên quan đến Lab 04 và các nhánh phát triển
git log --all --graph --pretty=format:"%h | %an <%ae> | %ad | %s" --date=format:"%Y-%m-%d %H:%M:%S"
```

---

## 2. LAB 04 VIBE-CODING COMMIT SUMMARY (ALL TEAM MEMBERS)

| Hash | Thành viên thực hiện | Email / Tài khoản | Thời gian commit | Nội dung commit (Commit Message) | Nhánh liên quan |
| :---: | :--- | :--- | :---: | :--- | :---: |
| `8aa2562` | **Nguyễn Bạch Thành Nhân** | `nhantino1234@gmail.com` | 2026-11-05 22:14:53 | `w4`: Đóng gói thư mục nộp bài Lab 04, tổng hợp bộ mã nguồn ft2,3, ft4 và ảnh minh họa | `dev`, `25127111_Nhan` |
| `dd47eed` | **Nguyễn Bình An** (CATO-OTAC) | `nba.cato.otac@gmail.com` | 2026-11-05 21:57:41 | `Merge branch 'algorithm_design_and_abstraction' into dev` | `dev` |
| `95d6d6a` | **Từ Nguyễn Thuận Thiên** | `tntthien2535@clc.fitus.edu.vn` | 2026-11-05 19:15:01 | `add ai declare usage`: Khai báo chi tiết lịch sử prompt và sử dụng AI | `algorithm_design_and_abstraction` |
| `0e0d3cc` | **Từ Nguyễn Thuận Thiên** | `tntthien2535@clc.fitus.edu.vn` | 2026-11-05 19:14:35 | `add link_data_p3`: Bổ sung đường dẫn Google Sheets dataset chuẩn bị | `algorithm_design_and_abstraction` |
| `748bcaf` | **Từ Nguyễn Thuận Thiên** | `tntthien2535@clc.fitus.edu.vn` | 2026-11-05 19:12:33 | `add report p3`: Báo cáo chi tiết cấu trúc Input/Output và thuật toán đề xuất | `algorithm_design_and_abstraction` |
| `32609bd` | **Nguyễn Bình An** (CATO-OTAC) | `nba.cato.otac@gmail.com` | 2026-11-05 21:46:23 | `Merge branch '25127022_Chau' into dev` | `dev` |
| `3d160f9` | **Nguyễn Thị Hoàng Châu** (HwC) | `165186725+HwangChou@users.noreply.github.com` | 2026-11-05 20:13:04 | `Add files via upload`: Thêm BÁO CÁO.md và câu hỏi khảo sát.md | `25127022_Chau` |
| `8cd7e55` | **Nguyễn Thị Hoàng Châu** (HwC) | `165186725+HwangChou@users.noreply.github.com` | 2026-11-05 17:55:29 | `Add files via upload`: Bổ sung file BÁO CÁO.docx | `25127022_Chau` |
| `2ef141b` | **Nguyễn Bình An** (CATO-OTAC) | `nba.cato.otac@gmail.com` | 2026-11-05 21:43:16 | `Merge branch 'nhu' into dev` | `dev` |
| `c5f973a` | **Nguyễn Huỳnh Khánh Như** | `nhknhu2509@clc.fitus.edu.vn` | 2026-11-05 13:48:12 | `Add feature 2,3,4`: Vibe code hoàn chỉnh backend và frontend cho ft2,3 và ft4 | `nhu` |
| `8f604ad` | **Nguyễn Bình An** (CATO-OTAC) | `nba.cato.otac@gmail.com` | 2026-11-05 21:34:10 | `feat(auth): complete authentication flow with responsive UI and backend API`: Vibe-code module xác thực người dùng | `An` |

---

## 3. FULL REPOSITORY GRAPH COMMIT LOG

```text
* 8aa2562 - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-11-05 22:14:53 +0700 : w4
*   dd47eed - CATO-OTAC (nba.cato.otac@gmail.com), 2026-11-05 21:57:41 +0700 : Merge branch 'algorithm_design_and_abstraction' into dev
|\  
| * 95d6d6a - tntthien (tntthien2535@clc.fitus.edu.vn), 2026-11-05 19:15:01 +0700 : add ai declare usage
| * 0e0d3cc - tntthien (tntthien2535@clc.fitus.edu.vn), 2026-11-05 19:14:35 +0700 : add link_data_p3
| * 748bcaf - tntthien (tntthien2535@clc.fitus.edu.vn), 2026-11-05 19:12:33 +0700 : add report p3
* |   32609bd - CATO-OTAC (nba.cato.otac@gmail.com), 2026-11-05 21:46:23 +0700 : Merge branch '25127022_Chau' into dev
|\ \  
| * | 3d160f9 - HwC (165186725+HwangChou@users.noreply.github.com), 2026-11-05 20:13:04 +0700 : Add files via upload
| * | 8cd7e55 - HwC (165186725+HwangChou@users.noreply.github.com), 2026-11-05 17:55:29 +0700 : Add files via upload
* | |   2ef141b - CATO-OTAC (nba.cato.otac@gmail.com), 2026-11-05 21:43:16 +0700 : Merge branch 'nhu' into dev
|\ \ \  
| * | | c5f973a - nhknhu2509-eng (nhknhu2509@clc.fitus.edu.vn), 2026-11-05 13:48:12 +0700 : Add feature 2,3,4
| * | | 49a27d7 - nhknhu2509-eng (nhknhu2509@clc.fitus.edu.vn), 2026-10-22 23:22:43 +0700 : add script present
| | | | * 8d83ddb - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-11-05 22:14:53 +0700 : w4
| | | | * 9f3d425 - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-10-21 22:09:27 +0700 : UPDATE
| | | | * e86d309 - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-10-19 19:21:46 +0700 : fix_prepresentation
| | | | * 3b111c0 - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-10-19 19:08:56 +0700 : prepresentation
| | | | * d7aa668 - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-10-16 21:35:32 +0700 : lab01_update
| | | | * f24175a - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-10-16 20:55:11 +0700 : W1
| | | | * e9a0bc9 - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-10-15 22:38:15 +0700 : w01
| | | | * a79999d - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-10-15 22:36:49 +0700 : Create 25127111_W01_02.zip
| | | |  \ 
| | | |   * f90511b - Nguyễn Bạch Thành Nhân (nhantino1234@gmail.com), 2026-10-15 21:25:42 +0700 : Initial commit
| | | | * 8f604ad - CATO-OTAC (nba.cato.otac@gmail.com), 2026-11-05 21:34:10 +0700 : feat(auth): complete authentication flow with responsive UI and backend API
| |_|_|/  
|/| | |   
* | | | 041e7ff - CATO-OTAC (nba.cato.otac@gmail.com), 2026-10-22 21:41:01 +0700 : remove redundant root drafts and organize presentation docs
* | | | 00bdf28 - CATO-OTAC (nba.cato.otac@gmail.com), 2026-10-22 21:40:36 +0700 : add pull request template and fix README line breaks
* | | | e7a86d4 - CATO-OTAC (nba.cato.otac@gmail.com), 2026-10-21 22:39:27 +0700 : add post-presentation git commit log
* | | | 713a4d4 - CATO-OTAC (nba.cato.otac@gmail.com), 2026-10-21 22:34:03 +0700 : docs: complete post-presentation proposal deliverables and update engineering report
* | | |   8a6f597 - CATO-OTAC (nba.cato.otac@gmail.com), 2026-10-21 21:58:10 +0700 : Merge remote-tracking branch 'origin/25127022_Chau' into dev and resolve conflicts
|\ \ \ \  
| | |/ /  
| |/| |   
| * | | 80df5f1 - HwC (165186725+HwangChou@users.noreply.github.com), 2026-10-21 20:20:05 +0700 : Add files via upload
| * | | 02d4d15 - HwC (165186725+HwangChou@users.noreply.github.com), 2026-10-19 20:43:59 +0700 : Add files via upload
* | | |   086f549 - CATO-OTAC (nba.cato.otac@gmail.com), 2026-10-21 21:42:39 +0700 : Merge remote-tracking branch 'origin/nhu' into dev
|\ \ \ \  
| | |/ /  
| |/| |   
| * | | 253d756 - nhknhu2509-eng (nhknhu2509@clc.fitus.edu.vn), 2026-10-21 20:41:43 +0700 : Addcontentdataset
| * | | 101ad6e - nhknhu2509-eng (nhknhu2509@clc.fitus.edu.vn), 2026-10-19 19:52:40 +0700 : Add AI usage declaration
* | | |   da45be0 - CATO-OTAC (nba.cato.otac@gmail.com), 2026-10-21 21:37:48 +0700 : Merge branch 'algorithm_design_and_abstraction' into dev
|\ \ \ \  
| | |_|/  
| |/| |   
| * | | 7c57045 - tntthien (tntthien2535@clc.fitus.edu.vn), 2026-10-21 17:14:15 +0700 : update from line 65 to line 71
| * | | 43180f6 - tntthien (tntthien2535@clc.fitus.edu.vn), 2026-10-19 19:03:25 +0700 : UPLOAD FILE PDF
* | | |   6e57b6f - CATO-OTAC (nba.cato.otac@gmail.com), 2026-10-21 21:31:16 +0700 : Merge branch 'dev' of https://github.com/CATO-OTAC/Computation-Thinking into dev
```

