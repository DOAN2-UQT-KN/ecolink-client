# 🌱 EcoLink — Tài liệu Phân tích Nghiệp vụ & Kịch bản Demo

> Phân tích từ source code thực tế của dự án EcoLink (ecolink-client + DA2-backend)
> Được viết theo góc nhìn người dùng cuối — phục vụ mục đích demo cho khách hàng/giảng viên/nhà đầu tư

---

# Tổng quan hệ thống

## 🎯 Mục tiêu hệ thống

**EcoLink** là nền tảng số kết nối cộng đồng trong công tác **bảo vệ môi trường**, hoạt động theo mô hình **"Báo cáo – Chiến dịch – Phần thưởng"**:

1. **Người dân** phát hiện và báo cáo các sự cố môi trường (rác thải, ô nhiễm) kèm ảnh và vị trí GPS
2. **Hệ thống AI** tự động phân tích ảnh, nhận diện loại rác/ô nhiễm và đề xuất cách xử lý
3. **Tổ chức môi trường** tạo chiến dịch dọn dẹp/bảo vệ môi trường dựa trên các báo cáo đó
4. **Tình nguyện viên** tham gia chiến dịch và nhận điểm thưởng (Green Points)
5. **Điểm thưởng** được quy đổi thành quà tặng thực tế tại cửa hàng đối tác

Đây là một **hệ sinh thái khép kín** kết hợp công nghệ AI, gamification và cộng đồng để giải quyết bài toán môi trường từ dưới lên.

## 🏗️ Kiến trúc hệ thống (tổng quan từ mã nguồn)

```
Frontend (Next.js/React) → API Gateway → 5 Microservices
  ├── identity-service    → Xác thực & tài khoản người dùng
  ├── incident-service    → Báo cáo sự cố + Chiến dịch + SOS
  ├── reward-service      → Điểm thưởng + Gamification + Quà tặng
  ├── notification-service → Thông báo realtime
  └── ai-service (Python) → Chat AI + Phân tích ảnh + Gợi ý
```

**Hỗ trợ đa ngôn ngữ:** Tiếng Việt và Tiếng Anh (tự động dịch qua background worker)
**Hỗ trợ bản đồ:** Leaflet + OpenStreetMap — hiển thị báo cáo và chiến dịch trên bản đồ tương tác

---

# Danh sách Actor

| Actor                     | Vai trò                                     | Quyền hạn chính                                                              |
| ------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| **Người dân / Công dân**  | Người phát hiện và báo cáo sự cố môi trường | Tạo báo cáo, vote, tham gia chiến dịch với tư cách tình nguyện viên, đổi quà |
| **Chủ tổ chức**           | Đại diện tổ chức môi trường/NGO             | Tạo tổ chức, tạo chiến dịch, quản lý tình nguyện viên                        |
| **Tình nguyện viên**      | Thành viên tham gia chiến dịch              | Đăng ký chiến dịch, check-in/điểm danh, nộp kết quả                          |
| **Quản trị viên (Admin)** | Kiểm duyệt hệ thống                         | Duyệt báo cáo, duyệt chiến dịch, quản lý quà tặng, cấu hình gamification     |
| **Hệ thống AI**           | Bot phân tích tự động                       | Phân tích ảnh báo cáo, gợi ý xử lý, hỗ trợ chat                              |

---

# Luồng nghiệp vụ

## 👤 Người dân / Công dân

| STT | Nghiệp vụ                              | Mục đích                                                                    |
| --- | -------------------------------------- | --------------------------------------------------------------------------- |
| 1   | **Đăng ký & Đăng nhập**                | Tạo tài khoản, xác thực email hoặc Google OAuth                             |
| 2   | **Tạo báo cáo sự cố**                  | Chụp ảnh, chọn vị trí GPS, mô tả loại rác/ô nhiễm và mức độ nghiêm trọng    |
| 3   | **Theo dõi trạng thái báo cáo**        | Nhận thông báo khi báo cáo được xác minh hoặc xử lý xong                    |
| 4   | **Vote/Upvote báo cáo**                | Xác nhận báo cáo của cộng đồng; người vote cũng nhận điểm thưởng            |
| 5   | **Tham gia chiến dịch**                | Gửi yêu cầu tham gia chiến dịch dọn dẹp/bảo vệ môi trường                   |
| 6   | **Điểm danh tại hiện trường**          | Quét QR code để xác nhận tham dự                                            |
| 7   | **Nộp bằng chứng hoàn thành**          | Upload ảnh kết quả sau khi thực hiện nhiệm vụ                               |
| 8   | **Xem bảng xếp hạng**                  | Theo dõi thứ hạng CRP / VRP / ORG_AGGREGATE theo mùa giải; lọc theo tổ chức |
| 9   | **Đổi quà bằng SP (Spendable Points)** | Dùng SP tích lũy đổi quà thực tế; SP tiêu FIFO (hết hạn gần nhất trước)     |
| 10  | **Chat với AI trợ lý**                 | Hỏi về sự cố, chiến dịch, cách bảo vệ môi trường                            |
| 11  | **Xem bản đồ SOS**                     | Theo dõi tín hiệu khẩn cấp của chiến dịch đang cần hỗ trợ trên bản đồ       |

## 🏢 Chủ tổ chức / Campaign Manager

| STT | Nghiệp vụ                       | Mục đích                                                                        |
| --- | ------------------------------- | ------------------------------------------------------------------------------- |
| 1   | **Tạo tổ chức**                 | Đăng ký tổ chức môi trường, chờ xác minh                                        |
| 2   | **Tạo chiến dịch**              | Tổ chức sự kiện dọn dẹp dựa trên báo cáo sự cố, gắn vị trí, thời gian và độ khó |
| 3   | **Duyệt tình nguyện viên**      | Chấp nhận/từ chối các yêu cầu tham gia chiến dịch                               |
| 4   | **Quản lý nhiệm vụ chiến dịch** | Tạo và phân công task; đánh dấu task hoàn thành                                 |
| 5   | **Phát tín hiệu SOS**           | Kêu gọi hỗ trợ khẩn cấp — thông báo đến citizen gần đó và admin                 |
| 6   | **Nộp hồ sơ hoàn thành**        | Đề trình để admin xét duyệt; 100% task phải xong mới submit được                |

## 🛡️ Quản trị viên

| STT | Nghiệp vụ                          | Mục đích                                                                   |
| --- | ---------------------------------- | -------------------------------------------------------------------------- |
| 1   | **Duyệt/Từ chối báo cáo**          | Xác minh báo cáo hợp lệ trước khi công bố                                  |
| 2   | **Đánh dấu báo cáo hoàn thành**    | Cấp GP + SP cho người báo cáo                                              |
| 3   | **Duyệt chiến dịch**               | Kích hoạt chiến dịch; thông báo đến cư dân trong bán kính                  |
| 4   | **Xác nhận hoàn thành chiến dịch** | Finalize, cấp GP + SP chỉ cho volunteer check-in QR; tự đóng SOS liên quan |
| 5   | **Quản lý quà tặng**               | Thêm/sửa/ẩn quà trong cửa hàng điểm thưởng                                 |
| 6   | **Cấu hình gamification**          | Thiết lập mùa giải, huy hiệu, payout tier, multiplier, expirationDays SP   |
| 7   | **Kiểm duyệt vi phạm**             | Ẩn báo cáo/chiến dịch/SOS không phù hợp                                    |
| 8   | **Finalize mùa giải**              | Đóng mùa, snapshot leaderboard vĩnh viễn, cấp SP thưởng theo payout tier   |

## 🆘 Tính năng SOS

| STT | Actor              | Nghiệp vụ                                        | Mục đích                                                             |
| --- | ------------------ | ------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | Campaign Manager   | Phát SOS trong chiến dịch đang diễn ra           | Thông báo khẩn cấp: thiếu người, thiếu dụng cụ, tình huống nguy hiểm |
| 2   | Hệ thống (tự động) | Gửi thông báo đến citizen trong bán kính & Admin | Huy động hỗ trợ nhanh nhất có thể                                    |
| 3   | Công dân gần đó    | Thấy SOS trên bản đồ, click xem chi tiết         | Biết cần giúp gì, ở đâu, mức độ khẩn cấp nào                         |
| 4   | Admin              | Xác nhận/Đóng SOS                                | Quản lý tình trạng khẩn cấp, đảm bảo đã được xử lý                   |
| 5   | Hệ thống (tự động) | Tự đóng SOS khi chiến dịch COMPLETED             | Dọn dẹp trạng thái — không để SOS lơ lửng sau khi xong việc          |

## 🤖 AI (Tự động)

| STT | Nghiệp vụ                 | Mục đích                                                                                 |
| --- | ------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | **Phân tích ảnh báo cáo** | Nhận diện loại rác/ô nhiễm bằng object detection, vẽ bounding box + đếm số lượng         |
| 2   | **Gợi ý xử lý**           | Đề xuất phương pháp xử lý dựa trên kết quả phân tích                                     |
| 3   | **Chat hỗ trợ**           | Trả lời câu hỏi theo context EcoLink; streaming SSE realtime; hỗ trợ ảnh trong chat      |
| 4   | **Dịch thuật tự động**    | Dịch tiêu đề/mô tả báo cáo/chiến dịch sang Tiếng Việt và Tiếng Anh qua background worker |

---

# Hệ thống điểm thưởng — Giải thích chi tiết

> _Toàn bộ logic dưới đây được suy luận từ source code thực tế của reward-service_

## 3 loại điểm trong EcoLink

| Tên                          | Ký hiệu | Mục đích                                                       | Có hết hạn?                       | Dùng để đổi quà?               |
| ---------------------------- | ------- | -------------------------------------------------------------- | --------------------------------- | ------------------------------ |
| **Citizen Ranking Points**   | CRP     | Điểm xếp hạng công dân — đo mức độ đóng góp báo cáo            | Không hết hạn                     | Không đổi quà được             |
| **Volunteer Ranking Points** | VRP     | Điểm xếp hạng tình nguyện viên — đo mức độ tham gia chiến dịch | Không hết hạn                     | Không đổi quà được             |
| **Spendable Points**         | SP      | Điểm tiêu dùng thực sự — dùng để đổi quà tặng                  | **Có hết hạn** (mặc định 90 ngày) | Đổi quà, giảm giá khi mua hàng |

> **Green Points (GP)** là tên gọi legacy vẫn còn trong code. Mỗi khi GP được cộng, hệ thống **đồng thời** cũng cộng SP tương đương vào ví người dùng. GP giữ lịch sử tổng, SP là số có thể tiêu dùng được.

---

## Cách kiếm điểm — Toàn bộ nguồn điểm trong hệ thống

| Hành động                                              | Loại điểm nhận                              | Nhận CRP/VRP? | Ghi chú                                                                                                                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tạo báo cáo được Admin xác nhận hoàn thành**         | GP + SP (REPORT_COMPLETION)                 | CRP           | Admin click "Đánh dấu hoàn thành" mới cấp                                                                                                                                                                                                       |
| **Vote (upvote) báo cáo**                              | GP + SP (UPVOTE) cho người vote             | —             | Người vote nhận điểm khuyến khích                                                                                                                                                                                                               |
| **Báo cáo của bạn được cộng đồng vote đầy đủ**         | GP + SP (REPORT_VOTE_MILESTONE) cho tác giả | CRP           | **Công thức milestone:** cấu hình `baseReportPoint` và các ngưỡng vote. Khi báo cáo đạt ngưỡng 1 → cấp `basePoint x 1`; ngưỡng 2 → `basePoint x 2`; ngưỡng 3 → `basePoint x 3`... Có idempotency: mỗi ngưỡng chỉ cấp đúng 1 lần cho mỗi báo cáo |
| **Tham gia chiến dịch + check-in QR + Admin finalize** | GP + SP (CAMPAIGN_COMPLETION)               | VRP           | Chỉ volunteer đã quét QR tại hiện trường mới nhận; số điểm = `difficulty.greenPoints`                                                                                                                                                           |
| **Giới thiệu người dùng mới (referral)**               | GP + SP (REFERRAL)                          | —             | Người giới thiệu nhận thưởng khi người được giới thiệu đăng ký thành công                                                                                                                                                                       |
| **Kết thúc mùa giải — top leaderboard**                | SP (SEASON_END payout)                      | —             | Admin finalize mùa → hệ thống tự cấp SP theo payout tier (rank 1-3, rank 4-10...)                                                                                                                                                               |

---

## Quy tắc Spendable Points (SP)

**Hết hạn (Expiry)**

- Mỗi lô SP khi được cấp đều có ngày hết hạn: `now + expirationDays`
- `expirationDays` mặc định **90 ngày** nếu Admin chưa cấu hình; Admin có thể thay đổi bất kỳ lúc nào
- SP hết hạn là mất — không rollover
- Trên giao diện: hiển thị `nextExpiresAt` — ngày mà lô SP gần nhất sẽ hết hạn (nhắc nhở người dùng dùng điểm trước khi mất)

**Tiêu điểm FIFO**

- Hệ thống tiêu **lô gần hết hạn nhất trước** (`ORDER BY expiresAt ASC, createdAt ASC`)
- Ví dụ: Lan có 30 SP hết 01/09 + 50 SP hết 01/10, đổi quà 40 SP → tiêu hết 30 SP cũ + 10 SP mới
- Nếu SP không đủ: báo lỗi `INSUFFICIENT_SP`, không trừ gì cả

**Idempotency — Không cấp 2 lần**

- Mỗi giao dịch có khóa duy nhất: `sp:{transactionType}:{resourceType}:{resourceId}:{userId}`
- Dù server retry, điểm vẫn chỉ cấp đúng 1 lần

---

## Multiplier tổ chức (Volunteer Org Multiplier)

- Admin tạo `VolunteerOrgMultiplierRule` với `code` (mã tổ chức) và `multiplier` (hệ số nhân)
- Ví dụ: Tổ chức A có `multiplier = 1.5` → volunteer của tổ chức đó nhận 1.5× điểm khi hoàn thành chiến dịch
- Nhiều rule có thể tồn tại; rule có `priority` cao hơn ưu tiên hơn
- Trang chi tiết chiến dịch hiển thị `estimatedRange: { min: basePoints, max: basePoints + bonusCap }` — khoảng thưởng dự kiến

---

## Bảng xếp hạng (Leaderboard) — Chi tiết đầy đủ

---

### Góc nhìn người dùng — Trang Leaderboard (`/leaderboard`)

#### Giao diện tổng thể

Trang Leaderboard chia thành hai khu vực chính:

- **Trái (chiếm ~65% chiều rộng):** Bảng xếp hạng — Top 3 + danh sách từ vị trí 4 trở đi
- **Phải (chiếm ~35% chiều rộng):** Panel chọn Season — danh sách các mùa giải, phân trang 5 mùa/trang

#### Các loại bảng xếp hạng (3 metric)

| Metric            | Tên tab                      | Ý nghĩa                        | Đối tượng xếp hạng | Nguồn điểm                              |
| ----------------- | ---------------------------- | ------------------------------ | ------------------ | --------------------------------------- |
| **CRP**           | Citizen (Công dân)           | Điểm xếp hạng công dân         | Cá nhân            | Report hoàn thành + vote milestone      |
| **VRP**           | Volunteer (Tình nguyện viên) | Điểm xếp hạng tình nguyện viên | Cá nhân            | Campaign completion sau check-in QR     |
| **ORG_AGGREGATE** | Organizations (Tổ chức)      | Điểm tổng hợp tổ chức          | Tổ chức            | Tổng điểm của tất cả thành viên tổ chức |

#### Cách người dùng tương tác

1. **Chọn metric:** Click tab CRP / VRP / ORG_AGGREGATE để chuyển giữa 3 bảng
2. **Chọn scope:**
   - **Global** — xem toàn bộ bảng xếp hạng, hiển thị podium Top 3
   - **My Rank** — thu gọn về thứ hạng cá nhân của mình (yêu cầu đăng nhập; tab "My Rank" chỉ hiển thị khi đã đăng nhập)
3. **Chọn Season:** Click vào một mùa trong panel bên phải để xem leaderboard của mùa đó
   - Mỗi Season card hiển thị: tên mùa, ngày bắt đầu–kết thúc, trạng thái (ACTIVE / FROZEN / CLOSED), progress text (ví dụ: "2/3" thể hiện đã đạt 2/3 loại điểm)
   - Phân trang: "Prev / Next" để duyệt qua các mùa cũ
4. **Kết quả không đăng nhập:** Vẫn xem được leaderboard global và danh sách season, nhưng không có tab "My Rank"

#### Hiển thị Top 3 — Podium

Khi ở scope **Global**, 3 người dẫn đầu được hiển thị theo dạng podium:

- **Rank 2** ở cột trái
- **Rank 1** ở cột giữa (to hơn, có vòng highlight vàng, avatar 96px)
- **Rank 3** ở cột phải
- Mỗi card: Avatar tròn, icon Crown, tên người dùng, số điểm, thứ hạng

#### Hiển thị danh sách (từ rank 4 trở đi)

Danh sách 20 người tiếp theo (rank 4–20+) hiển thị theo kiểu danh sách dọc, mỗi dòng: thứ hạng, avatar, tên, điểm số.

#### Điểm được cộng từ hoạt động nào

| Hoạt động                                          | Điểm nhận           | CRP/VRP tăng? |
| -------------------------------------------------- | ------------------- | ------------- |
| Tạo báo cáo → Admin xác nhận hoàn thành            | GP + SP             | CRP ✅        |
| Báo cáo đạt ngưỡng vote (10/50/100 votes)          | GP + SP (milestone) | CRP ✅        |
| Vote (upvote) báo cáo của người khác               | GP + SP             | —             |
| Tham gia chiến dịch + check-in QR + Admin finalize | GP + SP             | VRP ✅        |
| Giới thiệu người dùng mới                          | GP + SP             | —             |
| Kết thúc mùa — top leaderboard                     | SP (payout)         | —             |

#### Thứ hạng được cập nhật ra sao

- **Mùa ACTIVE:** Cập nhật live theo thời gian thực từ bảng điểm tích lũy
- **Mùa FROZEN/CLOSED:** Đọc từ snapshot đóng băng — thứ hạng cố định vĩnh viễn
- Hệ thống chọn season hiện tại theo ưu tiên: ACTIVE trong cửa sổ thời gian → ACTIVE bất kỳ → bất kỳ

#### Bảng xếp hạng nội bộ tổ chức (trong trang Organization Detail)

Trang `/organizations/:id` có tab **"Leaderboard"** — hiển thị LeaderboardPanel ở variant "organization":

- Chỉ hiển thị metric **CRP** và **VRP** (không có ORG_AGGREGATE)
- Lọc tự động theo `organizationId` — chỉ thành viên của tổ chức đó, xếp hạng lại từ 1
- Cùng giao diện với trang Leaderboard toàn cục, nhưng không có tab ORG_AGGREGATE

#### Giá trị người dùng nhận được từ cơ chế ranking

- **Gamification:** Thứ hạng tạo động lực duy trì hành vi tốt qua nhiều mùa
- **Công nhận đóng góp:** Phân biệt rõ người báo cáo (CRP) với người tình nguyện (VRP) — mỗi vai trò được tôn vinh đúng
- **Thi đua tổ chức:** ORG_AGGREGATE khuyến khích tổ chức huy động thành viên tích cực hơn
- **Phần thưởng cuối mùa:** Top leaderboard nhận SP thưởng thêm theo Payout Tier
- **Lịch sử vĩnh viễn:** Snapshot mùa cũ lưu mãi — người dùng có thể xem lại thành tích qua các mùa

---

### Góc nhìn Admin — Quản lý Gamification

#### Quản lý Season (`/admin/gamification/season`)

**Tạo Season:**

- Nhấn "Create season" để mở dialog
- Điền: Label (tên hiển thị), Kind (MONTHLY hoặc QUARTERLY), Date range (chọn ngày bắt đầu–kết thúc từ calendar)
- Mùa mới được tạo với status ACTIVE
- Validation: ngày kết thúc phải sau ngày bắt đầu

**Chỉnh sửa Season:**

- Nhấn icon bút chì trên dòng season trong bảng
- Chỉnh sửa được: Label, Kind, Date range
- Không thể đổi status trực tiếp từ form edit (status thay đổi qua Finalize)

**Kích hoạt / Kết thúc Season (Finalize):**

- Nhấn icon Finalize (tam giác play) — chỉ bật được khi season đang ACTIVE
- Dialog Finalize gồm:
  - Tên season (chỉ đọc)
  - Tùy chọn "Open next season?" (Yes/No)
    - Nếu Yes: điền tên mùa mới và date range cho mùa tiếp theo
  - Nhấn "Finalize" để chốt
- **Điều xảy ra khi Finalize:**
  1. Hệ thống snapshot CRP / VRP / ORG_AGGREGATE theo thứ hạng (đóng băng vĩnh viễn)
  2. Áp dụng Payout Tier: cấp SP cho top players tự động
  3. Season chuyển sang FROZEN/CLOSED
  4. Nếu chọn "Open next season": mùa mới ACTIVE được tạo ngay
  5. Điểm CRP/VRP trong season mới bắt đầu từ 0 (SP đã nhận không bị xóa)
- Không thể Finalize season đã FROZEN/CLOSED (nút bị disabled)
- Không thể tạo season mới nếu đã có ACTIVE season (`ACTIVE_SEASON_EXISTS`)

**Bộ lọc:** Admin có thể lọc danh sách season theo tiêu chí (FormFilter)

**Dữ liệu hiển thị trong bảng:** No, Label, Kind, Status, Duration (từ–đến), Action (Edit, Finalize)

---

#### Quản lý Point Rules (`/admin/gamification/config` → tab "Point Rules")

Tab này có 2 card:

**Card 1 — Volunteer Green Points:**

- `baseReportPoint`: Điểm cơ sở cho báo cáo (ví dụ: 10)
- `reportMilestoneThresholds`: Danh sách ngưỡng vote (ví dụ: [10, 50, 100])
  - Khi báo cáo đạt ngưỡng N vote → cấp `baseReportPoint × (số thứ tự ngưỡng)` SP cho tác giả báo cáo
  - Ví dụ: ngưỡng 1 (10 vote) → +10, ngưỡng 2 (50 vote) → +20, ngưỡng 3 (100 vote) → +30
  - Mỗi ngưỡng chỉ cấp đúng 1 lần / báo cáo (idempotent)
- Thay đổi áp dụng realtime lên leaderboard (có banner cảnh báo màu vàng)

**Card 2 — Citizen Green Points:**

- `volunteerBonusCapByDifficulty`: Bonus cap tối đa cho mỗi cấp độ khó (level 1, 2, 3, 4)
  - Điểm thực tế = basePoints × multiplier (nếu có), không vượt quá bonusCap của level đó

**Quy trình edit:** Nhấn bút chì → chỉnh sửa → Save → Dialog xác nhận Apply → áp dụng

**Điểm bị trừ:** Không có cơ chế trừ điểm trong hệ thống hiện tại. Chỉ cộng điểm.

---

#### Quản lý SP Rules (`/admin/gamification/config` → tab "Spendable Points (SP) Rules")

- Cấu hình duy nhất: `expirationDays` — số ngày SP có hiệu lực kể từ khi cấp
- Mặc định: 90 ngày
- Thay đổi chỉ áp dụng cho lô SP được cấp từ thời điểm đó trở đi (SP cũ không bị ảnh hưởng)
- Quy trình: Nhấn bút chì → sửa → Save → Dialog xác nhận → áp dụng

---

#### Quản lý Volunteer Multipliers (`/admin/gamification/config` → tab "Volunteer Multipliers")

- Danh sách rule nhân điểm campaign completion theo mã tổ chức
- Mỗi rule: Code (mã tổ chức), Description, Multiplier (hệ số)
- Cảnh báo: Nếu multiplier > 3 → hiển thị warning màu vàng
- Admin chỉ sửa được multiplier (code và description là read-only)
- Khi multiplier = 1.5: volunteer của tổ chức đó nhận 1.5× điểm campaign

---

#### Quản lý Difficulty Settings (`/admin/gamification/config` → tab "Difficulty Settings")

- Danh sách cấp độ khó (level 1, 2, 3, 4)
- Mỗi level: Số level, Tên hiển thị, GreenPoints reward (điểm base cấp khi hoàn thành campaign ở độ khó này)
- Admin chỉnh sửa được: level, name, greenPointsReward
- Dữ liệu này quyết định số điểm VRP và SP volunteer nhận khi hoàn thành chiến dịch

---

#### Quản lý Leaderboard Payout Tiers (`/admin/gamification/config` → tab "Leaderboard Payout Tiers")

- Danh sách dải thứ hạng được thưởng SP khi kết thúc mùa
- Mỗi tier: Metric (CRP hoặc VRP), Rank min, Rank max, SP amount
- Admin tạo / sửa / xóa tier
- Validation: Không cho phép các tier trùng dải thứ hạng (overlap detection)
- Tier không gắn seasonId → áp dụng cho tất cả mùa (global)
- Khi finalize season → hệ thống tự áp dụng tier phù hợp, cấp SP tự động

**Ví dụ cấu hình thực tế:**

| Metric | Rank | SP thưởng |
| ------ | ---- | --------- |
| CRP    | 1–1  | 500 SP    |
| CRP    | 2–3  | 300 SP    |
| CRP    | 4–10 | 100 SP    |
| VRP    | 1–1  | 500 SP    |
| VRP    | 2–3  | 300 SP    |
| VRP    | 4–10 | 100 SP    |

---

#### Quản lý Badge (`/admin/gamification/badge`)

**Tạo Badge:**

- Nhấn "Create badge" → dialog
- Điền:
  - **Name**: Tên hiển thị (bắt buộc)
  - **Symbol**: Chọn Emoji từ icon grid hoặc upload ảnh (png/jpg/webp, tối đa 2MB)
  - **Category**: REPORT / CAMPAIGN / CONTRIBUTION / RANK
  - **Scope**: LIFETIME (tính all-time) hoặc SEASON (tính trong mùa hiện tại)
  - **Repeatable**: Có cho phép nhận nhiều lần không
  - **Cooldown (seconds)**: Thời gian chờ giữa các lần nhận (với badge repeatable)
  - **Max grants per user**: Giới hạn số lần tối đa (bỏ trống = không giới hạn)
  - **Badge rules**: Builder dạng cây AND/OR conditions, mỗi điều kiện: target table, agg (COUNT/SUM), field, operator (>/>=/</<=/=/≠), value
  - **Reward**:
    - Discount (bps): Giảm giá khi đổi quà (tính theo basis points, 100 bps = 1%)
    - Bonus Points (SP): Số SP thưởng thêm khi nhận badge
  - **Publish immediately**: Khóa slug và publish ngay
- Khi tạo mới: badge tự động `isActive: true`

**Chỉnh sửa Badge:**

- Có thể sửa: Name, Symbol, Category, Scope, isRepeatable, Cooldown, MaxGrants, Rules, Reward, isActive
- Không thể sửa: Slug (sau khi publish)

**Bộ lọc & Danh sách badge:** Filter theo tên/category/scope; phân trang

**Điều kiện nhận badge (Badge Rules Engine):**

- Rules được định nghĩa dạng cây điều kiện AND/OR
- Mỗi điều kiện: `COUNT/SUM của [field] trong [table] [operator] [value]`
- Ví dụ: "COUNT of reports where status=COMPLETED >= 5" → nhận badge "Report Starter"
- Badge scope SEASON: chỉ tính trong mùa ACTIVE hiện tại
- Badge scope LIFETIME: tính tất cả dữ liệu từ trước đến nay

**Điều kiện nhận thưởng từ badge:**

- discountBps > 0: Khi đổi quà, người có badge này được giảm giá tương ứng
- bonusSp > 0: Nhận thêm SP ngay khi badge được cấp

---

### 3 Metric leaderboard

| Metric            | Ý nghĩa                  | Đối tượng xếp hạng | Nguồn điểm                                                         |
| ----------------- | ------------------------ | ------------------ | ------------------------------------------------------------------ |
| **CRP**           | Citizen Ranking Points   | Cá nhân            | Tổng CRP tích lũy trong mùa: từ report completion + vote milestone |
| **VRP**           | Volunteer Ranking Points | Cá nhân            | Tổng VRP tích lũy trong mùa: từ campaign completion (check-in QR)  |
| **ORG_AGGREGATE** | Điểm tổng hợp tổ chức    | Tổ chức            | Tổng hợp điểm của tất cả thành viên thuộc tổ chức đó               |

**Tính năng lọc bảng xếp hạng:**

- `?organizationId=...` — Lọc CRP/VRP theo tổ chức: chỉ hiển thị thành viên thuộc tổ chức đó, xếp hạng lại từ 1
- `?seasonId=...` — Xem leaderboard của bất kỳ mùa nào (đang active hay đã kết thúc)
- `/leaderboards/:metric/me` — Trả về thứ hạng hiện tại của người dùng đang đăng nhập
- Khi mùa **ACTIVE**: tính live từ bảng `userSeasonRpTotal` / `organizationSeasonScore`
- Khi mùa **FROZEN/CLOSED** (kết thúc): đọc từ `leaderboardSnapshot` — snapshot đóng băng vĩnh viễn

---

### Quản lý mùa giải (Season) — Admin

**Khái niệm Season:**

- Mỗi mùa có `label`, `kind` (loại mùa), `startsAt`, `endsAt` và `status` (ACTIVE / INACTIVE)
- Hệ thống tự tìm mùa hiện tại theo thứ tự ưu tiên:
  1. Mùa ACTIVE mà `startsAt ≤ now ≤ endsAt` (mùa trong cửa sổ calendar)
  2. Mùa ACTIVE bất kỳ (gần đây nhất)
  3. Mùa bất kỳ (fallback nếu không có active)

**Admin tạo và cấu hình mùa:**

```
POST /admin/seasons
  body: { label, kind, startsAt, endsAt, status }

PATCH /admin/seasons/:id
  body: { label?, startsAt?, endsAt?, status?, kind? }
```

**Vòng đời mùa:**

```
Admin tạo mùa mới (ACTIVE)
    ↓
 Người dùng tham gia báo cáo / chiến dịch
    ↓ (thoải mái, có thể chạy vài tuần — vài tháng)
 Admin gọi: POST /admin/seasons/:id/finalize
    ↓
  1. Hệ thống "freeze" snapshot:
     - Snapshot CRP theo thứ hạng
     - Snapshot VRP theo thứ hạng
     - Snapshot ORG_AGGREGATE theo thứ hạng
  2. Áp dụng Payout Tier: cấp SP cho top players
  3. Mùa chuyển sang INACTIVE
  4. (Tùy chọn) Mở ngay mùa mới với openNext: true
    ↓
 Điểm CRP/VRP reset về 0 — bắt đầu mùa sạch
 SP đã nhận không bị xóa — vẫn dùng đổi quà được
```

**Lưu ý quan trọng từ code:**

- Nếu finalize mùa đã INACTIVE: chỉ đếm snapshot hiện có, không tính lại
- Không thể mở mùa mới nếu đã có ACTIVE season khác đang chạy (`ACTIVE_SEASON_EXISTS`)
- `nextLabel` đặt tên mùa mới; nếu bỏ trống → auto-label: `{kind} {startsAt date}`

---

### Payout Tier — Cấp SP thưởng cuối mùa

**Khái niệm:** Admin định nghĩa các dải thứ hạng được thưởng SP khi mùa kết thúc.

```
POST /admin/gamification/payout-tiers
  body: {
    seasonId: "uuid" | null,   // null = áp dụng cho tất cả mùa
    metric: "CRP" | "VRP",      // chỉ cho USER metric
    rankMin: 1,
    rankMax: 3,
    spAmount: 500               // số SP cấp cho mỗi người trong dải này
  }
```

**Ví dụ cấu hình thực tế:**

| Metric | Thứ hạng  | SP thưởng |
| ------ | --------- | --------- |
| CRP    | Rank 1    | 500 SP    |
| CRP    | Rank 2–3  | 300 SP    |
| CRP    | Rank 4–10 | 100 SP    |
| VRP    | Rank 1    | 500 SP    |
| VRP    | Rank 2–3  | 300 SP    |
| VRP    | Rank 4–10 | 100 SP    |

**Logic ưu tiên:** Nếu có tier gắn với `seasonId` cụ thể → dùng cấu hình riêng của mùa đó. Nếu không có → dùng cấu hình global (`seasonId = null`). Điểm cấp có cùng `expirationDays` như SP bình thường và có idempotency — không bao giờ cấp 2 lần.

---

### Cấu hình điểm báo cáo (Gamification Point Rules) — Admin

```
PUT /admin/gamification/point-rules
  body: {
    baseReportPoint: 10,
    reportMilestoneThresholds: [10, 50, 100],
    volunteerBonusCapByDifficulty: {
      "1": 20,   // độ khó 1 → bonus cap tối đa 20 điểm
      "2": 40,
      "3": 80
    }
  }
```

**Cách tính thưởng vote milestone với config trên:**

| Báo cáo đạt n vote | Ngưỡng khởi động | Điểm cấp thêm    |
| ------------------ | ---------------- | ---------------- |
| ≥ 10 vote          | Ngưỡng 1         | `10 × 1 = 10 SP` |
| ≥ 50 vote          | Ngưỡng 2         | `10 × 2 = 20 SP` |
| ≥ 100 vote         | Ngưỡng 3         | `10 × 3 = 30 SP` |

> Ngưỡng cao hơn **không reset** ngưỡng thấp — cấp độc lập theo từng ngưỡng, mỗi ngưỡng chỉ cấp đúng 1 lần cho mỗi báo cáo.

---

### Cấu hình SP Expiry — Admin

```
PUT /admin/gamification/sp-rules
  body: { expirationDays: 90 }
```

- Thay đổi `expirationDays` **áp dụng cho lô SP cấp từ thời điểm đó trở đi**
- Lô SP cũ đã cấp trước đó không bị ảnh hưởng
- Admin có thể tăng/giảm expirationDays bất kỳ lúc nào

---

### Multiplier tổ chức (Volunteer Org Multiplier) — Admin

```
PUT /admin/gamification/multipliers
  body: {
    code: "ORG_XANH_VIET",
    multiplier: 1.5,
    priority: 10,
    isActive: true
  }
```

- `code` = mã tổ chức; `multiplier` = hệ số nhân điểm campaign completion
- Nhiều rule tồn tại đồng thời; rule có `priority` cao hơn thắng khi áp dụng
- `isActive: false` để tạm vô hiệu hóa không xóa
- Từ góc người dùng: trang chi tiết chiến dịch hiển thị dải điểm dự kiến `{ min: basePoints, max: basePoints + bonusCap }` — chưa bao gồm multiplier để tránh lộ thông tin nội bộ

---

# Hệ thống xác thực & tài khoản (Identity System)

> _Phân tích từ source code: `apis/auth/`, `stores/useAuthStore`, layouts/AuthLayout, pages/sign-in, sign-up, authenticate, reset-password_

---

## Tổng quan

Hệ thống xác thực quản lý danh tính người dùng, phiên đăng nhập và quyền truy cập. Frontend giao tiếp với **identity-service** qua API Gateway.

---

## Cấu trúc dữ liệu người dùng (IUser)

| Trường                    | Kiểu                      | Mô tả                                                           |
| ------------------------- | ------------------------- | --------------------------------------------------------------- |
| `id`                      | string                    | UUID định danh người dùng                                       |
| `email`                   | string                    | Email đăng nhập                                                 |
| `name`                    | string                    | Tên hiển thị                                                    |
| `avatar`                  | string \| null            | URL ảnh đại diện (Cloudinary CDN)                               |
| `bio`                     | string \| null            | Tiểu sử                                                         |
| `roleId`                  | string                    | Role của người dùng trong hệ thống                              |
| `emailVerified`           | boolean                   | Đã xác thực email chưa                                          |
| `latitude / longitude`    | number \| null            | Vị trí địa lý (tự báo cáo) — dùng để matching chiến dịch gần đó |
| `locationUpdatedAt`       | string \| null            | Thời gian cập nhật vị trí lần cuối                              |
| `notificationPreferences` | Record\<string, boolean\> | Cài đặt loại thông báo nào được nhận                            |

---

## Các phương thức xác thực

| Phương thức          | Endpoint                            | Mô tả                                                                                  |
| -------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| **Email/Password**   | `POST /auth/sign-in`                | Đăng nhập bằng email và mật khẩu                                                       |
| **Google OAuth**     | `GET /auth/google/sign-in`          | Redirect đến Google, callback về `/google-callback` hoặc `/auth/oauth/google/callback` |
| **Đăng ký**          | `POST /auth/sign-up`                | Tạo tài khoản mới (email, password, name, roleId?)                                     |
| **Đăng xuất**        | `POST /auth/sign-out`               | Hủy phiên, xóa token                                                                   |
| **Refresh token**    | `POST /auth/refresh`                | Lấy access token mới từ refresh token                                                  |
| **Xác thực email**   | link trong email → `/authenticate`  | Kích hoạt tài khoản sau đăng ký                                                        |
| **Yêu cầu reset MK** | `POST /auth/request-password-reset` | Gửi email chứa link reset                                                              |
| **Reset mật khẩu**   | `POST /auth/reset-password`         | Đặt mật khẩu mới qua `resetToken` từ email                                             |

---

## Cơ chế token (JWT)

```
Đăng nhập thành công
  → Nhận: access_token (ngắn hạn) + refresh_token (dài hạn)
  → Lưu vào localStorage / AuthStore (Zustand)

Mỗi request API
  → Gắn access_token vào header Authorization

Khi access_token hết hạn (401)
  → Frontend tự động gọi POST /auth/refresh với refresh_token
  → Nhận access_token mới
  → Retry request gốc — người dùng không bị gián đoạn

Đăng xuất
  → Xóa cả 2 token khỏi storage
  → Redirect về /authenticate
```

**Lưu ý:** Không có session server-side — toàn bộ trạng thái xác thực nằm ở phía client (Zustand store + localStorage).

---

## Quản lý vị trí người dùng

- Người dùng tự cập nhật vị trí (latitude/longitude) qua **ProfileLocationSection** trong `/profile/account`
- Vị trí này được identity-service lưu lại
- **reward-service** và **notification-service** sử dụng vị trí này để gửi thông báo chiến dịch gần đó (bán kính km configurable)
- Người dùng **không bắt buộc** phải cung cấp vị trí — chỉ ảnh hưởng đến việc nhận thông báo địa lý

---

## Cài đặt thông báo (Notification Preferences)

- Lưu trong `notificationPreferences` của IUser — dạng key-value
- Người dùng bật/tắt từng loại thông báo qua **ProfileNotificationSection** trong `/profile/account`
- Ví dụ: tắt nhận thông báo chiến dịch gần đó, vẫn nhận thông báo điểm thưởng

---

# Hệ thống báo cáo sự cố (Incident System)

> _Phân tích từ source code: `apis/incident/`, `apis/vote/`, `apis/saved-resource/`, pages/incidents/_

---

## Tổng quan

Hệ thống báo cáo là **trụ cột đầu tiên** của EcoLink — nơi người dân ghi nhận sự cố môi trường. Mỗi báo cáo đi qua một vòng đời rõ ràng từ tạo → xác minh cộng đồng → admin duyệt → hoàn thành.

---

## Cấu trúc dữ liệu báo cáo (IIncident)

| Trường                 | Kiểu           | Mô tả                                                   |
| ---------------------- | -------------- | ------------------------------------------------------- |
| `id`                   | string         | UUID                                                    |
| `user_id`              | string \| null | Người tạo báo cáo                                       |
| `title`                | string \| null | Tiêu đề (có bản `title_vi`, `title_en` — tự động dịch)  |
| `description`          | string \| null | Mô tả chi tiết (có bản `_vi`, `_en`)                    |
| `waste_type`           | string \| null | Loại rác/ô nhiễm                                        |
| `severity_level`       | number \| null | Mức độ nghiêm trọng (số, tùy cấu hình)                  |
| `latitude / longitude` | number \| null | Tọa độ GPS                                              |
| `detail_address`       | string         | Địa chỉ văn bản                                         |
| `status`               | number \| null | Trạng thái (xem bảng bên dưới)                          |
| `ai_verified`          | boolean        | AI đã phân tích chưa                                    |
| `ai_recommendation`    | string \| null | Gợi ý xử lý từ AI (Markdown)                            |
| `media_files`          | IMediaFiles[]  | Mảng ảnh: URL gốc + `ai_analysis_url` (ảnh đã annotate) |
| `votes`                | object         | `upvote_count`, `downvote_count`, `my_vote`             |
| `saved`                | boolean        | Người dùng đã bookmark chưa                             |
| `distance`             | number         | Khoảng cách từ vị trí người dùng (km)                   |

---

## Vòng đời báo cáo (Status)

```
PENDING (chờ duyệt)
  → [Admin] Duyệt → VERIFIED (đã xác minh)
  → [Admin] Từ chối → REJECTED
  → [Admin] Đánh dấu hoàn thành → COMPLETED
    → Hệ thống cấp GP + SP + CRP cho người báo cáo
  → [Admin] Ẩn → BANNED (vi phạm)
```

**Lưu ý:** Chỉ báo cáo ở trạng thái `VERIFIED` mới có thể được gắn vào chiến dịch.

---

## Tạo báo cáo — Chi tiết kỹ thuật

```
Người dùng nhập thông tin + chọn GPS + upload ảnh
  ↓
Ảnh upload lên Cloudinary CDN → nhận URL
  ↓
POST /api/v1/reports
  body: { title, description, waste_type, severity_level,
          latitude, longitude, detail_address, image_urls[] }
  ↓
Hệ thống lưu báo cáo với status = PENDING
  ↓
Background worker tự động trigger AI phân tích ảnh
  ↓
AI cập nhật: ai_verified = true, ai_analysis_url (ảnh annotated),
             ai_recommendation (Markdown gợi ý xử lý)
```

---

## Hệ thống Vote (Upvote/Downvote)

- **Upvote:** `POST /api/v1/incident/votes/upvote` với `{ resource_id, resource_type: "report" }`
- **Downvote:** `POST /api/v1/incident/votes/downvote`
- Người vote nhận GP + SP ngay khi vote (loại `UPVOTE`)
- Tác giả báo cáo nhận thêm khi đạt **vote milestone** (ngưỡng 10/50/100 vote)
- `votes.my_vote`: `1` = đã upvote, `-1` = đã downvote, `null` = chưa vote
- Vote không thể thu hồi sau khi đã thực hiện

---

## Tính năng Bookmark (Saved Resource)

- `POST /api/v1/saved-resources` — Lưu báo cáo hoặc chiến dịch
- `resource_type`: `"report"` hoặc `"campaign"`
- Người dùng xem lại danh sách đã lưu để theo dõi tiến trình

---

## Tìm kiếm & Lọc báo cáo

Tham số query `IGetIncidentsRequest`:

| Tham số                            | Mô tả                                                                |
| ---------------------------------- | -------------------------------------------------------------------- |
| `search`                           | Tìm theo tên                                                         |
| `status`                           | Lọc theo trạng thái                                                  |
| `latitude / longitude / radius_km` | Lọc theo vị trí địa lý                                               |
| `severity_level`                   | Lọc theo mức độ                                                      |
| `sort_by`                          | `created_at` / `updated_at` / `severity_level` / `distance` / `name` |
| `sort_order`                       | `asc` / `desc`                                                       |

---

## Đa ngôn ngữ tự động

- Khi tạo báo cáo: người dùng nhập bằng ngôn ngữ bất kỳ
- Background worker tự động dịch `title` và `description` sang cả **Tiếng Việt** (`_vi`) và **Tiếng Anh** (`_en`)
- Frontend hiển thị phiên bản phù hợp ngôn ngữ hiện tại của người dùng

---

# Hệ thống chiến dịch (Campaign System)

> _Phân tích từ source code: `apis/campaign/`, pages/campaigns/_, `apis/sos/`\*

---

## Tổng quan

Hệ thống chiến dịch kết nối báo cáo sự cố với hành động thực địa. Một chiến dịch được tạo bởi chủ tổ chức, đi qua nhiều trạng thái, và kết thúc bằng việc cấp điểm thưởng cho tình nguyện viên đã tham gia thực sự.

---

## Cấu trúc dữ liệu chiến dịch (ICampaign)

| Trường                          | Kiểu     | Mô tả                                                         |
| ------------------------------- | -------- | ------------------------------------------------------------- |
| `id`                            | string   | UUID                                                          |
| `organization_id`               | string   | Tổ chức sở hữu chiến dịch                                     |
| `title`                         | string   | Tên chiến dịch (có bản `_vi`, `_en`)                          |
| `description`                   | string   | Mô tả (có bản `_vi`, `_en`)                                   |
| `status`                        | number   | Trạng thái (xem bảng bên dưới)                                |
| `difficulty`                    | number   | Cấp độ khó (1–4) — quyết định điểm thưởng base                |
| `green_points`                  | number   | Điểm thưởng base cho volunteer hoàn thành                     |
| `is_verify`                     | boolean  | Admin đã duyệt chưa                                           |
| `report_ids`                    | string[] | Danh sách báo cáo sự cố liên quan                             |
| `manager_ids`                   | string[] | Danh sách campaign manager                                    |
| `banner`                        | string   | URL ảnh banner                                                |
| `start_date / end_date`         | string   | Thời gian hoạt động                                           |
| `latitude / longitude`          | number   | Vị trí tổ chức sự kiện                                        |
| `detail_address`                | string   | Địa chỉ văn bản                                               |
| `current_members / max_members` | number   | Số tình nguyện viên hiện tại / tối đa                         |
| `request_status`                | number   | Trạng thái join request của người dùng hiện tại               |
| `join_request_id`               | string   | ID của join request (để hủy khi đang PENDING)                 |
| `completion_verification`       | object   | Kết quả xác minh từ citizen: `clean_count`, `not_clean_count` |
| `votes`                         | object   | Vote của người dùng lên chiến dịch                            |
| `can_manage_campaign`           | boolean  | Người dùng hiện tại có quyền manage không                     |

---

## Vòng đời chiến dịch (Status)

```
PENDING (Chờ admin duyệt)
  → [Admin] Duyệt → ACTIVE (Đang hoạt động, có thể join)
  → [Admin] Từ chối → REJECTED

ACTIVE
  → [Manager] Nộp hồ sơ hoàn thành → WAITING_CONFIRMED (Chờ admin xác nhận)
  → [Admin] Từ chối hoàn thành → IN_REVIEW (Quay lại để bổ sung)

WAITING_CONFIRMED
  → [Admin] Xác nhận hoàn thành → COMPLETED
    → Cấp GP + SP + VRP cho volunteer check-in QR
    → Tự động đóng tất cả SOS liên quan

COMPLETED (Đã hoàn thành vĩnh viễn)
```

---

## Luồng tham gia chiến dịch (Join Flow)

```
Volunteer click "Đăng ký tham gia"
  → POST /campaigns/volunteers/join-requests
  → Tạo JoinRequest với status = PENDING
  → Manager nhận thông báo có yêu cầu mới

[Manager] Duyệt hoặc từ chối
  → PUT /campaigns/volunteers/join-requests/process
  → Volunteer nhận thông báo kết quả
  → Nếu duyệt: Volunteer được thêm vào danh sách chính thức

Volunteer có thể hủy yêu cầu khi còn PENDING
  → DELETE /campaigns/volunteers/join-requests/cancel
```

**Trạng thái Join Request:** PENDING → APPROVED hoặc REJECTED

---

## Check-in QR tại hiện trường

```
[Manager] Phát QR
  → POST /campaigns/:id/attendance-qr
  → Nhận { token, expires_at }
  → Hiển thị QR code trên màn hình

[Volunteer] Quét QR
  → POST /campaigns/:id/attendance-check-in { token }
  → Nhận { checked_in_at, already_checked_in }
  → already_checked_in = true: đã check-in rồi, không cho check-in lại
```

**Điều quan trọng:** Chỉ volunteer có `already_checked_in = false` mới được tính check-in lần đầu. Check-in là điều kiện bắt buộc để nhận điểm thưởng khi Admin finalize.

---

## Quản lý Task (Nhiệm vụ chiến dịch)

Cấu trúc `ICampaignTask`:

| Trường                            | Mô tả                     |
| --------------------------------- | ------------------------- |
| `title`                           | Tên nhiệm vụ              |
| `description`                     | Mô tả chi tiết            |
| `scheduled_date / scheduled_time` | Ngày giờ thực hiện        |
| `priority`                        | Độ ưu tiên (số)           |
| `status`                          | Trạng thái task           |
| `result.description`              | Mô tả kết quả hoàn thành  |
| `result.file[]`                   | Ảnh bằng chứng hoàn thành |

**Quy tắc submit:** Tất cả task phải có status COMPLETED trước khi Manager có thể nộp hồ sơ hoàn thành chiến dịch.

---

## Community Verification (Xác minh cộng đồng)

Sau khi Manager nộp hồ sơ → hệ thống gửi lời mời đến Citizen gần đó:

- `POST /campaigns/:id/completion-verification { value: 1 | -1 }`
  - `value = 1`: Xác nhận chiến dịch đã hoàn thành tốt (clean)
  - `value = -1`: Phản hồi chiến dịch chưa hoàn thành (not clean)
- Kết quả lưu trong `completion_verification.clean_count` / `not_clean_count`
- Admin xem số liệu này khi xét duyệt — hỗ trợ ra quyết định

---

## Tính năng tìm kiếm & lọc chiến dịch

| Tham số                            | Mô tả                             |
| ---------------------------------- | --------------------------------- |
| `search`                           | Tìm theo tên                      |
| `status`                           | Lọc theo trạng thái               |
| `organizationId`                   | Lọc theo tổ chức                  |
| `latitude / longitude / radius_km` | Lọc theo bán kính địa lý          |
| `difficulty`                       | Lọc theo cấp độ khó               |
| `start_date / end_date`            | Lọc theo thời gian                |
| `is_owner`                         | Chỉ lấy chiến dịch do mình sở hữu |

---

## Ước tính điểm thưởng (Reward Estimate)

```
GET /gamification/campaigns/reward-estimate?difficultyLevel=2
  → Trả về:
    { difficultyLevel: 2,
      basePoints: 50,
      estimatedBonusMax: 40,
      estimatedRange: { min: 50, max: 90 },
      difficultyName: "Medium" }
```

Trang chi tiết chiến dịch hiển thị dải điểm dự kiến này cho volunteer trước khi đăng ký.

---

# Hệ thống tổ chức (Organization System)

> _Phân tích từ source code: `apis/organization/`, pages/organizations/_

---

## Tổng quan

Tổ chức là thực thể trung gian giữa cá nhân và chiến dịch — chỉ tổ chức được Admin phê duyệt mới có thể tạo chiến dịch. Mỗi người dùng có thể thuộc nhiều tổ chức.

---

## Cấu trúc dữ liệu tổ chức (IOrganization)

| Trường              | Mô tả                                           |
| ------------------- | ----------------------------------------------- |
| `id`                | UUID                                            |
| `name`              | Tên tổ chức                                     |
| `description`       | Mô tả (có bản `_vi`, `_en`)                     |
| `logo_url`          | URL logo                                        |
| `background_url`    | URL ảnh bìa                                     |
| `contact_email`     | Email liên lạc chính thức                       |
| `is_email_verified` | Email đã được xác thực chưa                     |
| `status`            | Trạng thái tổ chức                              |
| `owner_id`          | ID chủ tổ chức                                  |
| `is_member`         | Người dùng hiện tại có phải thành viên không    |
| `request_status`    | Trạng thái join request hiện tại của người dùng |
| `join_request_id`   | ID join request (để hủy khi PENDING)            |

---

## Vòng đời tổ chức

```
Người dùng tạo tổ chức → status = PENDING
  → Admin duyệt → ACTIVE (có thể tạo chiến dịch)
  → Admin từ chối → REJECTED
```

---

## Luồng gia nhập tổ chức (Join Request)

Cấu trúc `IJoinRequest`:

| Trường            | Mô tả                         |
| ----------------- | ----------------------------- |
| `organization_id` | Tổ chức muốn tham gia         |
| `requester_id`    | Người gửi yêu cầu             |
| `status`          | PENDING / APPROVED / REJECTED |

**Luồng:**

```
Volunteer click "Tham gia tổ chức"
  → POST /organizations/:id/join-requests
  → Tạo IJoinRequest status = PENDING

[Owner] Xem tab "Join Requests" trong organization detail
  → Duyệt → APPROVED: volunteer trở thành thành viên
  → Từ chối → REJECTED

Volunteer có thể rời tổ chức
  → DELETE /organizations/:id/leave
```

---

## Tổ chức của tôi vs Tổ chức tôi sở hữu

| Endpoint                   | Mô tả                             |
| -------------------------- | --------------------------------- |
| `GET /organizations/my`    | Các tổ chức tôi **là thành viên** |
| `GET /organizations/owned` | Các tổ chức tôi **là chủ sở hữu** |

Trang `/organizations/me` hiển thị danh sách từ cả hai nguồn này.

---

## Xác thực email liên lạc tổ chức

- Tổ chức có `contact_email` cần xác thực → hệ thống gửi email với link
- Sau khi click link: redirect về `/organizations/:id?verifiedEmail=1`
- Frontend hiển thị toast "Organization contact email verified"
- `is_email_verified = true` — tăng độ tin cậy của tổ chức

---

## Danh sách thành viên tổ chức

```
GET /organizations/:id/members
  → Trả về danh sách User có trong tổ chức
  → Dùng trong tab "Members" của organization detail page
```

---

# Hệ thống SOS (Emergency System)

> _Phân tích từ source code: `apis/sos/`, pages/(maps)/maps/_

---

## Tổng quan

SOS là cơ chế kêu gọi hỗ trợ khẩn cấp trong chiến dịch đang diễn ra. Một SOS được gắn với chiến dịch cụ thể và hiển thị nổi bật trên bản đồ để thu hút sự chú ý của cộng đồng xung quanh.

---

## Cấu trúc dữ liệu SOS (ISOS)

| Trường                          | Mô tả                                                              |
| ------------------------------- | ------------------------------------------------------------------ |
| `id`                            | UUID                                                               |
| `content`                       | Nội dung mô tả tình huống khẩn cấp                                 |
| `phone`                         | Số điện thoại liên lạc                                             |
| `status`                        | Trạng thái SOS (active / closed)                                   |
| `campaign_id`                   | Chiến dịch phát SOS                                                |
| `campaign.title`                | Tên chiến dịch (embedded)                                          |
| `campaign.latitude / longitude` | Vị trí chiến dịch                                                  |
| `campaign.detail_address`       | Địa chỉ chiến dịch                                                 |
| `latitude / longitude`          | Tọa độ SOS (có thể khác với campaign nếu người phát SOS di chuyển) |
| `detail_address`                | Địa chỉ SOS                                                        |
| `created_at / updated_at`       | Timestamps                                                         |

---

## Tạo và quản lý SOS

```
[Campaign Manager] Phát SOS trong chiến dịch đang ACTIVE
  → POST /api/v1/sos
    { content, phone, campaign_id }
  → Hệ thống lưu SOS với status active
  → notification-service gửi thông báo đến:
    (1) Admin hệ thống
    (2) Citizen trong bán kính X km quanh chiến dịch

[Admin] Xem và đóng SOS
  → GET /api/v1/sos?status=active&campaign_id=...
  → Đánh dấu đã xử lý

[Hệ thống — Tự động] Khi chiến dịch finalize (COMPLETED)
  → Đóng tất cả SOS đang active liên quan đến chiến dịch đó
  → Bản đồ được dọn dẹp tự động
```

---

## Hiển thị trên bản đồ (`/maps`)

- SOS đang active hiển thị như điểm cảnh báo nổi bật trên bản đồ Leaflet
- Người dùng click vào điểm SOS → xem: tên chiến dịch, nội dung khẩn cấp, số điện thoại liên lạc, địa chỉ chính xác
- Lọc: `status` (chỉ hiện active), `campaign_id` (lọc theo chiến dịch cụ thể)

---

# Hệ thống thông báo (Notification System)

> _Phân tích từ source code: `apis/notification/`, `apis/auth/models/user.ts` (notificationPreferences)_

---

## Tổng quan

notification-service gửi thông báo đến người dùng theo các sự kiện trong hệ thống. Người dùng có thể tuỳ chỉnh loại thông báo muốn nhận.

---

## Cấu trúc thông báo (INotificationItem)

| Trường    | Mô tả                                                      |
| --------- | ---------------------------------------------------------- |
| `id`      | UUID                                                       |
| `userId`  | Người nhận (null = broadcast)                              |
| `type`    | Loại thông báo (xem bảng bên dưới)                         |
| `kind`    | Nhóm thông báo                                             |
| `title`   | Tiêu đề (đã dịch sang ngôn ngữ người dùng)                 |
| `body`    | Nội dung chi tiết                                          |
| `payload` | Dữ liệu bổ sung (ví dụ: campaignId, reportId) để deep-link |
| `readAt`  | Thời gian đọc (null = chưa đọc)                            |

---

## Các loại thông báo (type)

| Loại                                | Khi nào                   | Đến ai                                                   |
| ----------------------------------- | ------------------------- | -------------------------------------------------------- |
| Báo cáo được duyệt                  | Admin duyệt báo cáo       | Người tạo báo cáo                                        |
| Báo cáo bị từ chối                  | Admin từ chối             | Người tạo báo cáo                                        |
| Báo cáo hoàn thành                  | Admin mark complete       | Người tạo báo cáo                                        |
| Chiến dịch được duyệt               | Admin duyệt chiến dịch    | Campaign manager                                         |
| Chiến dịch mới gần bạn              | Admin duyệt chiến dịch    | Citizen trong bán kính                                   |
| Join request mới                    | Volunteer gửi yêu cầu     | Campaign manager                                         |
| Join request được duyệt             | Manager duyệt             | Volunteer                                                |
| Chiến dịch cần xác nhận             | Manager nộp hồ sơ         | Admin + Citizen gần đó                                   |
| `CAMPAIGN_COMPLETION_VERIFY_INVITE` | Manager submit completion | Citizen trong bán kính (không gồm volunteer đã tham gia) |
| `CAMPAIGN_DONE`                     | Admin finalize campaign   | Tất cả volunteer được duyệt                              |
| SOS mới                             | Manager phát SOS          | Admin + Citizen gần đó                                   |
| Điểm thưởng cấp                     | Bất kỳ sự kiện cấp điểm   | Người nhận điểm                                          |

---

## API thông báo

```
GET /notifications/my
  → { items: INotificationItem[], unreadCount: number }

PUT /notifications/:id/read
  → Đánh dấu 1 thông báo đã đọc
```

---

## Cài đặt thông báo (Preferences)

- Người dùng tắt/bật từng loại thông báo qua `/profile/account`
- Preferences lưu trong `user.notificationPreferences` — key là loại thông báo, value là boolean
- Khi preference = false: notification-service bỏ qua, không gửi

---

# Hệ thống cửa hàng quà tặng (Gift & Redemption System)

> _Phân tích từ source code: `apis/gift/`, pages/(main)/gifts/, pages/(main)/profile/orders/_

---

## Tổng quan

Hệ thống quà tặng là bước cuối của vòng lặp gamification: SP tích lũy được → đổi thành quà thực tế. Điểm được tiêu theo cơ chế FIFO (lô gần hết hạn nhất tiêu trước).

---

## Cấu trúc quà tặng (IGift)

| Trường           | Mô tả                                    |
| ---------------- | ---------------------------------------- |
| `id`             | UUID                                     |
| `name`           | Tên quà                                  |
| `description`    | Mô tả                                    |
| `greenPoints`    | Số SP cần để đổi                         |
| `stockRemaining` | Số lượng tồn kho (null = không giới hạn) |
| `isActive`       | Đang hiển thị trong cửa hàng             |
| `media.url`      | URL ảnh quà                              |

---

## Tìm kiếm quà tặng

| Tham số                | Mô tả                       |
| ---------------------- | --------------------------- |
| `search`               | Tìm theo tên                |
| `inStock`              | Chỉ hiện quà còn hàng       |
| `isActive`             | Admin-only: kể cả quà đã ẩn |
| `greenPointsMin / Max` | Lọc theo giá điểm           |

---

## Quy trình đổi quà

```
Người dùng chọn quà → click "Đổi quà"
  → Nhập: phoneNumber, pickupLocation (địa chỉ nhận)

POST /api/v1/gifts/:id/redeem
  { phoneNumber, pickupLocation }

Hệ thống kiểm tra:
  1. stockRemaining > 0 (hoặc null = không giới hạn)
  2. SP của người dùng đủ (greedy FIFO từ lô gần hết hạn nhất)
  3. Không có idempotency conflict

Nếu đủ điều kiện:
  → Trừ SP theo FIFO
  → Tạo IGiftRedeem với status = PROCESSING
  → Trừ stockRemaining đi 1

Nếu không đủ SP:
  → Lỗi INSUFFICIENT_SP — không trừ gì cả
```

---

## Vòng đời đơn hàng (GiftRedemptionStatus)

```
PROCESSING (Đang xử lý)
  → [Admin] Cập nhật → SHIPPED (Đã giao vận chuyển)
    → [Admin] Cập nhật → DELIVERED (Đã nhận hàng)
  → [Admin] Hủy → CANCELLED
```

Người dùng theo dõi trạng thái trong `/profile/orders`.

---

## Cấu trúc đơn hàng (IGiftRedeem)

| Trường             | Mô tả                                                |
| ------------------ | ---------------------------------------------------- |
| `giftId`           | ID quà đã đổi                                        |
| `greenPointsSpent` | Số SP đã tiêu                                        |
| `phoneNumber`      | SĐT nhận hàng                                        |
| `pickupLocation`   | Địa chỉ nhận hàng                                    |
| `status`           | PROCESSING / SHIPPED / DELIVERED / CANCELLED         |
| `statusUpdatedAt`  | Lần cập nhật trạng thái gần nhất                     |
| `cancelledAt`      | Thời gian hủy (nếu có)                               |
| `gift`             | Snapshot thông tin quà tại thời điểm đổi (tên, điểm) |

**Lưu ý kỹ thuật:** `gift` trong đơn hàng là **snapshot** — lưu thông tin quà tại thời điểm đổi, không thay đổi dù Admin sau đó sửa quà trong cửa hàng.

---

## Quản lý quà tặng — Admin

| Thao tác     | API                                 | Mô tả                                             |
| ------------ | ----------------------------------- | ------------------------------------------------- |
| Tạo quà      | `POST /admin/gifts`                 | Thêm quà mới với ảnh, giá, số lượng               |
| Sửa quà      | `PUT /admin/gifts/:id`              | Cập nhật thông tin, giá, số lượng                 |
| Ẩn/Hiện      | `PUT /admin/gifts/:id { isActive }` | Toggle hiển thị trong cửa hàng                    |
| Xem đơn hàng | `GET /admin/gifts/redemptions`      | Danh sách tất cả đơn đổi quà                      |
| Cập nhật đơn | `PUT /admin/gifts/redemptions/:id`  | Thay đổi status: PROCESSING → SHIPPED → DELIVERED |

---

# Hệ thống AI (AI System)

> _Phân tích từ source code: component chat AI, `apis/admin-media/`, `apis/chat-media/`, ai-service (Python)_

---

## Tổng quan

EcoLink tích hợp **ai-service** (Python) thực hiện 2 chức năng chính: phân tích ảnh báo cáo tự động và chat hỗ trợ người dùng theo ngữ cảnh EcoLink.

---

## Tính năng 1: Phân tích ảnh báo cáo (Object Detection)

```
Người dùng upload ảnh khi tạo báo cáo
  ↓
Ảnh lưu lên Cloudinary → nhận URL
  ↓
Hệ thống gửi URL đến ai-service qua message queue
  ↓
ai-service chạy object detection model:
  → Nhận diện từng loại rác (household_waste, plastic_bottle, v.v.)
  → Đếm số lượng từng loại
  → Vẽ bounding box trên ảnh
  → Tạo ai_recommendation (Markdown) gợi ý xử lý
  ↓
Kết quả lưu vào media_files:
  → ai_analysis_url: URL ảnh đã annotate (bounding box)
  → Báo cáo: ai_verified = true, ai_recommendation = "..."
```

**Xử lý bất đồng bộ:** AI chạy background — không block luồng chính. Người dùng thấy ảnh gốc trước, ảnh AI xuất hiện sau khi phân tích xong.

---

## Tính năng 2: Chat AI trợ lý (Generative AI)

```
Widget chat ở góc phải màn hình — có sẵn ở mọi trang
  ↓
Người dùng gõ câu hỏi / gửi ảnh
  ↓
Frontend gửi request đến ai-service
  ↓
ai-service trả về response qua Server-Sent Events (SSE)
  → Streaming realtime: từng token xuất hiện dần dần
  ↓
Hiển thị trong chat bubble
```

**Tính năng chat:**

- Hỗ trợ **gửi ảnh** trong chat (upload qua `chat-media/registerChatMedia`)
- Streaming SSE — response xuất hiện tức thì, không chờ toàn bộ
- AI hiểu ngữ cảnh EcoLink: biết về báo cáo, chiến dịch, cách tích điểm
- Có thể có nhiều **agent chuyên biệt** (ví dụ: agent phân tích báo cáo, agent tư vấn chiến dịch)

---

## Upload media (2 loại)

| API module                               | Dùng khi                       | Mô tả                        |
| ---------------------------------------- | ------------------------------ | ---------------------------- |
| `admin-media/registerAdminMedia`         | Upload ảnh trong admin console | Ảnh quà tặng, banner         |
| `chat-media/registerChatMedia`           | Upload ảnh trong chat AI       | Gửi ảnh để AI phân tích      |
| Cloudinary SDK (trong incidents, badges) | Upload ảnh báo cáo, ảnh badge  | Trực tiếp lên Cloudinary CDN |

---

## Tự động dịch ngôn ngữ (Translation Worker)

- Background worker quét báo cáo và chiến dịch chưa có bản dịch
- Gọi AI để dịch `title` và `description` sang cả Tiếng Việt và Tiếng Anh
- Lưu kết quả vào `title_vi`, `title_en`, `description_vi`, `description_en`
- Frontend tự chọn phiên bản phù hợp ngôn ngữ hiện tại (`i18n`)

---

# Hệ thống Badge & Gamification Engine

> _Phân tích từ source code: `apis/gamification/badges/`, `constants/badge.ts`, admin/gamification/badge/_

---

## Tổng quan

Badge system là lớp gamification phức tạp nhất trong EcoLink. Admin định nghĩa badge với điều kiện nhận bằng rule engine dạng cây, hệ thống tự động cấp badge khi người dùng đáp ứng điều kiện.

---

## Phân loại badge

### Theo Category (loại hoạt động):

| Category       | Ý nghĩa                     | Ví dụ badge                                      |
| -------------- | --------------------------- | ------------------------------------------------ |
| `REPORT`       | Liên quan đến báo cáo sự cố | "Người báo cáo tích cực", "5 báo cáo hoàn thành" |
| `CAMPAIGN`     | Liên quan đến chiến dịch    | "Volunteer Starter", "10 chiến dịch hoàn thành"  |
| `CONTRIBUTION` | Đóng góp tổng hợp           | "Thành viên tích cực", badge đặc biệt            |
| `RANK`         | Xếp hạng                    | "Top 10 CRP", "Top 3 VRP"                        |

### Theo Scope (phạm vi tính điểm):

| Scope      | Cách tính điều kiện                  | Reset khi?             |
| ---------- | ------------------------------------ | ---------------------- |
| `LIFETIME` | Tính tất cả dữ liệu từ trước đến nay | Không reset            |
| `SEASON`   | Chỉ tính trong mùa ACTIVE hiện tại   | Reset khi sang mùa mới |

---

## Badge Rules Engine — Định nghĩa điều kiện

Rules được lưu dạng **cây điều kiện JSON** (AST — Abstract Syntax Tree):

**Cấu trúc cây:**

```json
{
  "logical_operator": "AND",
  "conditions": [
    {
      "target": "reports",
      "agg": "COUNT",
      "field": "status",
      "operator": "gte",
      "value": 5
    },
    {
      "logical_operator": "OR",
      "conditions": [
        {
          "target": "campaigns",
          "agg": "COUNT",
          "field": "id",
          "operator": "gte",
          "value": 3
        }
      ]
    }
  ]
}
```

**Các thành phần:**

- `logical_operator`: `AND` / `OR` — kết hợp các điều kiện con
- `target`: Bảng metric (ví dụ: `reports`, `campaigns`) — được liệt kê qua `GET /metrics/tables`
- `agg`: `COUNT` (đếm số dòng) hoặc `SUM` (tổng giá trị)
- `field`: Cột cụ thể trong bảng target — được liệt kê qua `GET /metrics/columns`
- `operator`: `gt` / `gte` / `lt` / `lte` / `eq` / `neq`
- `value`: Giá trị so sánh

**Admin UI:** BadgeRulesBuilder cho phép tạo cây rule bằng giao diện kéo thả — không cần viết JSON thủ công.

---

## Cấu trúc Badge (IAdminBadgeDefinition)

| Trường               | Mô tả                                             |
| -------------------- | ------------------------------------------------- |
| `slug`               | Định danh duy nhất, không đổi sau khi publish     |
| `name`               | Tên hiển thị                                      |
| `symbol`             | Emoji hoặc URL ảnh icon                           |
| `category`           | REPORT / CAMPAIGN / CONTRIBUTION / RANK           |
| `scope`              | LIFETIME / SEASON                                 |
| `isRepeatable`       | Có thể nhận nhiều lần không                       |
| `cooldownSeconds`    | Thời gian chờ giữa 2 lần nhận (nếu repeatable)    |
| `maxGrantsPerUser`   | Giới hạn tổng số lần nhận (null = không giới hạn) |
| `rulesConfig`        | Cây điều kiện JSON                                |
| `reward.discountBps` | Giảm giá khi đổi quà (basis points; 100 bps = 1%) |
| `reward.bonusSp`     | Bonus SP khi nhận badge                           |
| `isActive`           | Badge đang active                                 |
| `publishedAt`        | Thời điểm publish (khóa slug sau này)             |

---

## Cấp badge (Grant)

Cấu trúc `IGamificationBadgeGrant`:

| Trường      | Mô tả                                          |
| ----------- | ---------------------------------------------- |
| `grantedAt` | Thời điểm được cấp                             |
| `metadata`  | Dữ liệu bổ sung (điểm tại thời điểm cấp, v.v.) |
| `season`    | Mùa mà badge được cấp trong (nếu SEASON scope) |
| `badge`     | Thông tin badge definition                     |

---

## Trang Badges của người dùng (`/profile/badges`)

**Summary stats:**

- Tổng số badge nhận được (totalBadges)
- Badge Lifetime (lifetimeCount)
- Badge Seasonal (seasonalCount)
- Badge Repeatable (repeatableCount)

**Grid view:** Hiển thị tất cả badge với icon, tên, số lần nhận

**Bộ lọc:** Theo category (REPORT / CAMPAIGN / CONTRIBUTION / RANK), theo scope (LIFETIME / SEASON)

---

## Tác động của Badge lên Gameplay

| Reward trong badge | Tác động                                                       |
| ------------------ | -------------------------------------------------------------- |
| `discountBps > 0`  | Khi đổi quà: giá SP được giảm tương ứng `discountBps / 10000`% |
| `bonusSp > 0`      | Ngay khi badge được cấp: nhận thêm SP vào ví                   |

Ví dụ: Badge "Top Volunteer" có `discountBps = 500` (5% giảm giá) — người có badge này đổi quà 100 SP chỉ tốn 95 SP.

---

# Hệ thống bản đồ (Map System)

> _Phân tích từ source code: pages/(maps)/maps/, MapsLayout_

---

## Tổng quan

Trang `/maps` là màn hình bản đồ toàn màn hình sử dụng **Leaflet** + **OpenStreetMap**. Đây là giao diện không-sidebar duy nhất (MapsLayout) — chiếm toàn bộ viewport.

---

## Dữ liệu hiển thị trên bản đồ

| Loại          | Biểu tượng            | Nguồn dữ liệu                               | Mô tả                         |
| ------------- | --------------------- | ------------------------------------------- | ----------------------------- |
| Báo cáo sự cố | Điểm màu đỏ           | `GET /reports?latitude=...&radius_km=...`   | Sự cố đang chờ xử lý          |
| Chiến dịch    | Điểm màu xanh         | `GET /campaigns?latitude=...&radius_km=...` | Chiến dịch đang active        |
| SOS           | Điểm cảnh báo nổi bật | `GET /sos?status=active`                    | Tín hiệu khẩn cấp đang active |

---

## Kỹ thuật render

- **Dynamic import** (`ssr: false`) — Leaflet không hỗ trợ server-side rendering, chỉ load trong browser
- **Loading skeleton** khi chưa load xong bản đồ
- MapsLayout bỏ header/footer để bản đồ chiếm full viewport
- Layout `-mt-[92px] -mb-[92px]` để bù trừ header height từ MainLayout

---

## Tương tác người dùng

- **Click vào điểm báo cáo:** Xem thông tin tóm tắt, link đến trang chi tiết báo cáo
- **Click vào điểm chiến dịch:** Xem thông tin chiến dịch, link đến trang chi tiết
- **Click vào điểm SOS:** Xem nội dung khẩn cấp: tên chiến dịch, mô tả tình huống, số điện thoại, địa chỉ
- **Zoom in/out:** Điều hướng bình thường của Leaflet

---

# Kịch bản demo

> **Câu chuyện xuyên suốt:** "Hành trình từ một bãi rác đến một cộng đồng sạch hơn"
>
> **Nhân vật:**
>
> - **Minh** — Người dân phát hiện bãi rác trái phép
> - **Hội Xanh Việt** — Tổ chức môi trường địa phương
> - **Lan** — Tình nguyện viên nhiệt tình
> - **Admin** — Quản trị viên hệ thống

| Bước | Actor              | Thao tác thực hiện                                                                                                                             | Kết quả mong đợi                                                                                                                | Giá trị nghiệp vụ                                                   |
| ---- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1    | Minh               | Đăng ký tài khoản bằng email                                                                                                                   | Tài khoản được tạo, nhận email xác nhận                                                                                         | Người dân dễ dàng tham gia cộng đồng                                |
| 2    | Minh               | Tạo báo cáo "Bãi rác trái phép đường Lê Văn Sĩ" — upload 3 ảnh, chọn vị trí GPS, chọn mức độ: Nghiêm trọng                                     | Báo cáo được lưu, AI bắt đầu phân tích ảnh tự động                                                                              | Ghi nhận sự cố có bằng chứng, định vị chính xác                     |
| 3    | AI                 | Phân tích ảnh báo cáo (tự động)                                                                                                                | Ảnh được đánh dấu bounding box, phát hiện "household_waste x 15, plastic_bottle x 8", gợi ý: "Cần thu gom và phân loại rác"     | AI thay thế khâu kiểm tra thủ công, tiết kiệm thời gian admin       |
| 4    | Minh               | Xem chi tiết báo cáo sau khi AI phân tích                                                                                                      | Thấy ảnh gốc + ảnh AI đã annotate + đề xuất xử lý                                                                               | Người dân nhận phản hồi ngay lập tức                                |
| 5    | Người dân khác     | Vote (upvote) báo cáo của Minh                                                                                                                 | Số vote tăng, báo cáo nổi bật hơn                                                                                               | Cộng đồng xác minh chéo, tăng tin cậy                               |
| 6    | Admin              | Xem danh sách báo cáo chờ duyệt, duyệt báo cáo của Minh                                                                                        | Báo cáo chuyển sang trạng thái "Đã xác minh", Minh nhận thông báo                                                               | Quy trình kiểm duyệt minh bạch                                      |
| 7    | Hội Xanh Việt      | Tạo chiến dịch "Dọn sạch đường Lê Văn Sĩ" — gắn báo cáo của Minh, chọn ngày 15/07, độ khó: Trung bình (50 Green Points)                        | Chiến dịch được tạo, chờ admin duyệt                                                                                            | Liên kết trực tiếp sự cố với hành động                              |
| 8    | Admin              | Duyệt chiến dịch                                                                                                                               | Chiến dịch kích hoạt; hệ thống tự động thông báo đến cư dân trong bán kính 5km                                                  | Khuếch đại sức lan tỏa, tăng tình nguyện viên                       |
| 9    | Lan                | Nhận thông báo chiến dịch, vào xem chi tiết và gửi yêu cầu tham gia                                                                            | Yêu cầu gửi thành công, chờ tổ chức duyệt                                                                                       | Tình nguyện viên chủ động tham gia                                  |
| 10   | Hội Xanh Việt      | Duyệt yêu cầu của Lan và 9 tình nguyện viên khác                                                                                               | Lan được chấp nhận, nhận thông báo xác nhận                                                                                     | Quản lý tình nguyện viên có kiểm soát                               |
| 11   | Lan                | Ngày 15/07: Đến hiện trường, quét QR code điểm danh                                                                                            | Check-in thành công, ghi nhận tham dự                                                                                           | Xác minh hiện diện thực tế tại hiện trường                          |
| 12   | Lan                | Hoàn thành dọn dẹp, upload ảnh kết quả                                                                                                         | Bằng chứng hoàn thành được lưu, chờ xác minh                                                                                    | Minh bạch kết quả, có bằng chứng                                    |
| 13   | Hội Xanh Việt      | Nộp hồ sơ hoàn thành chiến dịch (sau khi tất cả task xong)                                                                                     | Chiến dịch chuyển trạng thái **"Chờ xác nhận"** (`WAITING_CONFIRMED`)                                                           | Tổ chức không thể tự đóng chiến dịch, cần lớp kiểm duyệt chất lượng |
| 13b  | Hệ thống (tự động) | Gửi thông báo song song: **Admin** (xét duyệt) + **Citizen trong bán kính 5km** (xác minh thực địa — loại `CAMPAIGN_COMPLETION_VERIFY_INVITE`) | Admin nhận thông báo duyệt; Citizen gần đó nhận lời mời xác nhận kết quả                                                        | Community verification — không phụ thuộc hoàn toàn vào admin        |
| 14   | Admin              | Xét duyệt hồ sơ (task, ảnh bằng chứng, số check-in) → Click **"Xác nhận hoàn thành"**                                                          | Chiến dịch chuyển `COMPLETED`; cấp Green Points **chỉ cho volunteer đã quét QR tại hiện trường**; gửi thông báo `CAMPAIGN_DONE` | Phần thưởng đúng người đúng công, không thể gian lận                |
| 15   | Lan                | Vào cửa hàng đổi quà, dùng 50 điểm đổi "Túi vải thân thiện môi trường"                                                                         | Đơn đổi quà thành công, trừ điểm, hiển thị lịch sử đơn hàng                                                                     | Vòng lặp khen thưởng hoàn chỉnh                                     |
| 16   | Lan                | Xem bảng xếp hạng VRP (Volunteer RP) của mùa hiện tại                                                                                          | Lan thấy thứ hạng của mình trong cộng đồng                                                                                      | Gamification tạo động lực dài hạn                                   |
| 17   | Lan                | Nhận huy hiệu "Volunteer Starter" (hoàn thành 5 chiến dịch)                                                                                    | Huy hiệu hiển thị trên profile                                                                                                  | Công nhận đóng góp, khuyến khích tiếp tục                           |
| 18   | Minh               | Chat với AI: "Tôi nên xử lý rác nhựa như thế nào?"                                                                                             | AI trả lời theo ngữ cảnh, dựa trên báo cáo và dữ liệu hệ thống                                                                  | Nâng cao nhận thức, hỗ trợ người dùng 24/7                          |

---

# Demo Script

## 📍 Bước 1: Trang chủ & Giới thiệu hệ thống

### Màn hình

Trang chủ EcoLink (Homepage) — có bản đồ tương tác hiển thị các báo cáo và chiến dịch

### Thao tác

Mở trình duyệt, vào trang chủ. Cuộn trang để thấy danh sách chiến dịch nổi bật và bản đồ.

### Lời thuyết trình

> _"Đây là EcoLink — nền tảng kết nối cộng đồng bảo vệ môi trường. Bạn đang thấy bản đồ thời gian thực, hiển thị các sự cố môi trường đã được người dân báo cáo và các chiến dịch dọn dẹp đang diễn ra. Mỗi điểm màu đỏ là một sự cố cần xử lý. Mỗi điểm màu xanh là một chiến dịch đang cần tình nguyện viên."_

### Điều cần nhấn mạnh

- Bản đồ thời gian thực, trực quan
- Hệ thống hoạt động cả tiếng Việt và tiếng Anh
- Cộng đồng có thể thấy toàn cảnh tình trạng môi trường địa phương

---

## 📍 Bước 2: Đăng ký & Đăng nhập

### Màn hình

Trang đăng ký (`/sign-up`) và đăng nhập (`/sign-in`)

### Thao tác

Click "Đăng nhập với Google" hoặc nhập email/mật khẩu. Đăng nhập với tài khoản **Minh** (người dân).

### Lời thuyết trình

> _"Để tham gia cộng đồng, chỉ cần 30 giây đăng ký. Hệ thống hỗ trợ đăng nhập bằng tài khoản Google hoặc email. Không cần cài đặt app — chạy hoàn toàn trên trình duyệt."_

### Điều cần nhấn mạnh

- Không cần tải app, chạy trên web
- Google OAuth tích hợp sẵn
- Token tự động refresh, không bị đăng xuất giữa chừng

---

## 📍 Bước 3: Tạo báo cáo sự cố môi trường

### Màn hình

Trang tạo báo cáo (`/incidents/create`)

### Thao tác

1. Click "Tạo báo cáo mới"
2. Nhập tiêu đề: _"Bãi rác trái phép đường Lê Văn Sĩ, Quận 3"_
3. Upload 3 ảnh (đã chuẩn bị sẵn — ảnh rác thải thực tế)
4. Chọn loại rác: _Hỗn hợp (rác sinh hoạt + nhựa)_
5. Chọn mức độ: _Nghiêm trọng_
6. Bật GPS, chọn vị trí trên bản đồ
7. Click "Gửi báo cáo"

### Lời thuyết trình

> _"Minh — một người dân bình thường — phát hiện bãi rác trái phép trên đường Lê Văn Sĩ. Thay vì chỉ chụp ảnh đăng mạng xã hội, anh mở EcoLink và tạo báo cáo chính thức. Chỉ mất 2 phút: nhập mô tả, upload ảnh, xác nhận vị trí GPS — xong! Báo cáo được gửi đến cộng đồng và ban quản trị ngay lập tức."_

### Điều cần nhấn mạnh

- Vị trí GPS tự động, chính xác đến từng con phố
- Upload nhiều ảnh làm bằng chứng
- Hệ thống hỗ trợ phân loại rác theo loại và mức độ nghiêm trọng
- Ngay sau khi gửi, AI bắt đầu phân tích ảnh trong nền

---

## 📍 Bước 4: AI phân tích ảnh tự động

### Màn hình

Trang chi tiết báo cáo (`/incidents/[id]`) — sau vài giây

### Thao tác

Làm mới trang chi tiết báo cáo. Cuộn xuống phần "Kết quả phân tích AI".

### Lời thuyết trình

> _"Đây là điểm khác biệt lớn nhất của EcoLink. Ngay sau khi báo cáo được tạo, hệ thống AI tự động phân tích từng bức ảnh. Bạn thấy đây: ảnh gốc bên trái, ảnh AI đã đánh dấu bên phải. AI phát hiện được 15 vật thể rác sinh hoạt, 8 chai nhựa — với độ chính xác từng loại. Phía dưới là gợi ý xử lý: cần thu gom và phân loại theo 3 nhóm vật liệu."_

> _"Điều này giúp cơ quan quản lý và tổ chức môi trường nắm ngay được quy mô vấn đề mà không cần đến tận nơi kiểm tra."_

### Điều cần nhấn mạnh

- AI phân tích hoàn toàn tự động, không cần can thiệp con người
- Ảnh output có bounding box trực quan
- Đề xuất xử lý cụ thể, không chung chung
- ⚠️ Lưu ý: Nếu AI service chưa sẵn sàng trong demo, chuẩn bị sẵn ảnh annotated để hiển thị

---

## 📍 Bước 5: Cộng đồng Vote xác nhận báo cáo

### Màn hình

Trang chi tiết báo cáo — phần vote

### Thao tác

Đăng nhập với tài khoản thứ 2 (tài khoản cộng đồng). Click nút "Upvote" trên báo cáo.

### Lời thuyết trình

> _"Người dùng khác trong cộng đồng có thể xác nhận bằng cách vote. Khi có nhiều vote, báo cáo sẽ nổi bật hơn và được ưu tiên xử lý. Đây là cơ chế kiểm tra chéo từ cộng đồng — không chỉ dựa vào AI hay admin."_

### Điều cần nhấn mạnh

- Dân chủ hóa việc ưu tiên sự cố
- Người dùng có thể lưu báo cáo (bookmark) để theo dõi

---

## 📍 Bước 6: Admin duyệt báo cáo

### Màn hình

Admin console — Quản lý báo cáo (`/admin/incidents`)

### Thao tác

1. Đăng nhập tài khoản Admin
2. Vào tab "Chờ duyệt"
3. Click vào báo cáo của Minh — xem chi tiết kèm kết quả AI
4. Click "Xác minh & Duyệt"

### Lời thuyết trình

> _"Từ góc nhìn quản trị viên — tất cả báo cáo chờ duyệt hiển thị tập trung tại đây. Admin thấy ngay kết quả AI, số vote cộng đồng và thông tin người báo cáo. Chỉ một click là phê duyệt. Minh sẽ nhận thông báo ngay lập tức: 'Báo cáo của bạn đã được xác minh!'"_

### Điều cần nhấn mạnh

- Admin được hỗ trợ bởi AI → quyết định nhanh hơn, chính xác hơn
- Thông báo tự động đến người dùng, không cần liên lạc thủ công

---

## 📍 Bước 7: Tổ chức tạo chiến dịch

### Màn hình

Trang tạo chiến dịch (`/campaigns/create`)

### Thao tác

1. Đăng nhập tài khoản "Hội Xanh Việt" (chủ tổ chức)
2. Click "Tạo chiến dịch mới"
3. Nhập tên: _"Dọn sạch đường Lê Văn Sĩ — Mùa Hè Xanh"_
4. Gắn báo cáo liên quan (chọn báo cáo của Minh từ danh sách)
5. Chọn vị trí, ngày bắt đầu: 15/07, ngày kết thúc: 15/07
6. Chọn độ khó: Trung bình (50 Green Points cho tình nguyện viên)
7. Nhập banner và mô tả hấp dẫn
8. Click "Tạo chiến dịch"

### Lời thuyết trình

> _"Từ báo cáo của Minh, Hội Xanh Việt tạo ngay một chiến dịch hành động. Điểm đặc biệt: chiến dịch được gắn trực tiếp với báo cáo sự cố — mọi người đều thấy mình đang giải quyết vấn đề gì và ở đâu. Họ cũng chọn mức thưởng 50 Green Points cho ai tham gia đến cùng."_

### Điều cần nhấn mạnh

- Liên kết chặt chẽ giữa sự cố và chiến dịch xử lý
- Cơ chế điểm thưởng khuyến khích tham gia
- Chỉ chủ tổ chức mới được tạo chiến dịch — đảm bảo chất lượng

---

## 📍 Bước 8: Admin duyệt chiến dịch & Thông báo cộng đồng

### Màn hình

Admin console — Quản lý chiến dịch

### Thao tác

Admin click "Duyệt chiến dịch". Hệ thống tự động gửi thông báo.

### Lời thuyết trình

> _"Khi admin duyệt, một điều thú vị xảy ra phía sau: hệ thống tự động tìm tất cả người dùng trong bán kính 5km từ vị trí chiến dịch và gửi thông báo mời tham gia. Không cần marketing, không cần chạy quảng cáo — cộng đồng lân cận được tiếp cận trực tiếp."_

### Điều cần nhấn mạnh

- Thông báo địa lý thông minh — đúng người, đúng nơi
- Hoàn toàn tự động, không tốn công sức

---

## 📍 Bước 9: Tình nguyện viên tham gia chiến dịch

### Màn hình

Trang chi tiết chiến dịch (`/campaigns/[id]`)

### Thao tác

1. Đăng nhập tài khoản Lan
2. Vào chiến dịch "Dọn sạch đường Lê Văn Sĩ"
3. Xem mô tả, vị trí trên bản đồ, danh sách nhiệm vụ
4. Click "Đăng ký tham gia"

### Lời thuyết trình

> _"Lan nhận được thông báo trên điện thoại, click vào và thấy ngay thông tin chiến dịch: địa điểm, thời gian, nhiệm vụ cụ thể, và quan trọng nhất — sẽ nhận được 50 điểm xanh. Một click đăng ký, chờ tổ chức phê duyệt."_

### Điều cần nhấn mạnh

- Giao diện trực quan, thông tin đầy đủ
- Tình nguyện viên thấy được lợi ích cụ thể trước khi đăng ký

---

## 📍 Bước 10: Điểm danh & Check-in tại hiện trường

### Màn hình

Trang chiến dịch của tôi (`/campaigns/me`) — phần QR Code

### Thao tác

Chỉ vào màn hình QR code. Giải thích quy trình quét tại hiện trường.

### Lời thuyết trình

> _"Đến ngày 15/07, Lan đến hiện trường. Quản lý chiến dịch hiển thị QR code, Lan quét bằng điện thoại để xác nhận có mặt. Đây là bằng chứng thực tế — không thể làm giả, không thể điểm danh từ nhà."_

### Điều cần nhấn mạnh

- Chống gian lận điểm danh
- Kết nối thế giới số với thế giới thực

---

## 📍 Bước 11a: Tổ chức nộp hồ sơ hoàn thành chiến dịch

### Màn hình

Trang quản lý chiến dịch (dành cho chủ tổ chức / campaign manager)

### Thao tác

1. Hội Xanh Việt vào trang quản lý chiến dịch
2. Xác nhận tất cả nhiệm vụ (tasks) đã hoàn thành
3. Click **"Nộp hồ sơ hoàn thành — Chờ Admin duyệt"**
4. Chiến dịch chuyển sang trạng thái **"Chờ xác nhận"** (`WAITING_CONFIRMED`)

### Lời thuyết trình

> _"Sau khi tất cả nhiệm vụ hoàn thành, tổ chức không thể tự đóng chiến dịch. Họ phải nộp hồ sơ hoàn thành để Admin xem xét — đây là lớp kiểm soát chất lượng quan trọng. Chiến dịch lúc này chuyển sang trạng thái 'Chờ xác nhận'."_

### Điều cần nhấn mạnh

- Điểm thưởng **chưa được cấp** ở bước này
- Tổ chức phải đảm bảo 100% nhiệm vụ hoàn thành mới được submit
- Có cơ chế kiểm tra: nếu còn task chưa xong, hệ thống báo lỗi ngay

---

## 📍 Bước 11b: Hệ thống tự động thông báo Admin & Citizen gần đó xác minh

### Màn hình

_(Xảy ra tự động — không cần thao tác)_

### Thao tác

Hiển thị màn hình thông báo trên điện thoại của Admin và của một công dân gần khu vực chiến dịch.

### Lời thuyết trình

> _"Ngay lập tức sau khi tổ chức nộp hồ sơ, hệ thống thực hiện hai việc song song:_
>
> _Thứ nhất — gửi thông báo đến tất cả Admin để xét duyệt._
>
> _Thứ hai — và đây là điều thú vị — hệ thống tự tìm tất cả công dân sinh sống trong bán kính 5km quanh địa điểm chiến dịch và gửi thông báo mời họ đến xác minh kết quả thực địa. Đây là cơ chế 'Community Verification' — dùng chính cộng đồng địa phương để kiểm chứng, không phụ thuộc hoàn toàn vào admin."_

### Điều cần nhấn mạnh

- **2 luồng thông báo song song:** Admin (để duyệt) + Citizen gần đó (để xác minh thực địa)
- Loại thông báo riêng biệt: `CAMPAIGN_COMPLETION_VERIFY_INVITE`
- Citizen được invite **không bao gồm** volunteer đã tham gia (tránh xung đột lợi ích)
- Hoàn toàn tự động — không cần tổ chức hay admin làm thêm bước nào

---

## 📍 Bước 11c: Admin xác nhận hoàn thành → Hệ thống cấp điểm thưởng

### Màn hình

Admin console — Danh sách chiến dịch chờ duyệt hoàn thành

### Thao tác

1. Admin đăng nhập, thấy thông báo "Chiến dịch Dọn sạch đường Lê Văn Sĩ đang chờ xác nhận hoàn thành"
2. Vào xem chi tiết: danh sách task đã hoàn thành, ảnh bằng chứng, số volunteer check-in
3. Click **"Xác nhận hoàn thành"** (`adminFinalizeCampaignCompletion`)
4. Chiến dịch chuyển sang `COMPLETED`

### Lời thuyết trình

> _"Admin nhận thông báo, vào kiểm tra hồ sơ: có bao nhiêu người check-in QR tại hiện trường, các task đã hoàn thành chưa, ảnh bằng chứng trước-sau ra sao. Khi Admin click 'Xác nhận hoàn thành' — đây mới là lúc hệ thống cấp điểm._
>
> _Quan trọng: chỉ những tình nguyện viên đã quét QR điểm danh tại hiện trường mới nhận được Green Points. Người đăng ký nhưng không có mặt — không nhận được điểm. Điều này đảm bảo phần thưởng đúng người, đúng công."_

### Điều cần nhấn mạnh

- **Green Points chỉ cấp cho volunteer đã check-in QR** — không phải toàn bộ người đăng ký
- Admin là người chốt quyết định cuối cùng — không thể bypass
- Nếu Admin từ chối: chiến dịch quay về `IN_REVIEW`, tổ chức nhận thông báo để bổ sung
- Sau khi hoàn thành: tất cả SOS liên quan cũng tự động đóng lại
- Hệ thống gửi thông báo `CAMPAIGN_DONE` đến toàn bộ volunteer được duyệt

---

## 📍 Bước 12: Đổi quà bằng Green Points

### Màn hình

Cửa hàng quà tặng (`/gifts`)

### Thao tác

1. Lan vào trang "Cửa hàng"
2. Thấy danh sách quà: túi vải, bình giữ nhiệt, cây xanh mini...
3. Chọn "Túi vải thân thiện môi trường" (50 điểm)
4. Click "Đổi quà" — xác nhận
5. Vào lịch sử đơn hàng để xem

### Lời thuyết trình

> _"50 điểm Lan vừa nhận, cô dùng ngay để đổi một túi vải thân thiện môi trường. Quà tặng thực tế, có giá trị — không chỉ là điểm số ảo. Đây là vòng lặp hoàn chỉnh: Báo cáo → Chiến dịch → Hành động → Phần thưởng."_

### Điều cần nhấn mạnh

- Cơ chế discount badge: người có huy hiệu cao sẽ được giảm giá khi đổi quà
- Điểm FIFO — điểm cũ tiêu trước, điểm mới dùng sau

---

## 📍 Bước 13: Bảng xếp hạng & Huy hiệu — Luồng Demo Đầy đủ

### Kịch bản: Admin tạo Season → Người dùng kiếm điểm → Leaderboard thay đổi → Admin Finalize

---

#### Bước 13.0 (Admin) — Tạo Season mới

### Màn hình

Admin: `/admin/gamification/season`

### Thao tác

1. Đăng nhập Admin → vào **Admin > Gamification > Season**
2. Click **"Create season"**
3. Dialog hiện ra — điền:
   - **Label:** "Mùa Hè Xanh 2025"
   - **Kind:** Monthly
   - **Date range:** 01/06/2025 – 30/06/2025
4. Click **"Confirm"**
5. Season được tạo với status **ACTIVE** — xuất hiện trong bảng

### Lời thuyết trình

> _"Trước khi bảng xếp hạng hoạt động, Admin cần tạo một mùa giải. Mùa giải xác định khung thời gian thi đua — điểm CRP và VRP được tính riêng trong mỗi mùa. Khi mùa kết thúc, thứ hạng được đóng băng vĩnh viễn."_

---

#### Bước 13.1 (Người dùng) — Kiếm điểm và thấy Leaderboard thay đổi

### Màn hình

`/leaderboard`

### Thao tác

1. Đăng nhập tài khoản **Lan** → vào trang **Leaderboard**
2. Thấy panel bên phải: "Mùa Hè Xanh 2025" — status **ACTIVE**
3. Click vào mùa đó → bảng xếp hạng load
4. Chọn tab **VRP** → thấy podium Top 3 (Rank 1 ở giữa, to nhất, có icon Crown)
5. Bên dưới: danh sách rank 4–20
6. Chuyển sang scope **My Rank** → thấy thứ hạng hiện tại của Lan trong mùa này
7. Chuyển tab **CRP** → thấy bảng xếp hạng người báo cáo
8. Chuyển tab **ORG_AGGREGATE** → thấy bảng xếp hạng tổ chức; tab "My Rank" biến mất (không áp dụng cho tổ chức)

### Lời thuyết trình

> _"EcoLink có 3 bảng xếp hạng riêng biệt. CRP — điểm những người phát hiện và báo cáo sự cố: báo cáo được admin xác nhận, hoặc báo cáo nhận đủ vote từ cộng đồng — CRP tăng._
>
> _VRP — điểm những người ra hiện trường dọn dẹp: tham gia chiến dịch, check-in QR, admin finalize — VRP tăng._
>
> _ORG_AGGREGATE — điểm tổng của cả tổ chức, khích lệ các NGO thi đua lành mạnh._
>
> _Đặc biệt: Click 'My Rank' để thấy ngay vị trí của bạn trong mùa hiện tại — không cần cuộn tìm trong hàng nghìn người."_

### Điều cần nhấn mạnh

- **Podium Top 3:** Rank 1 nổi bật ở giữa, to hơn, có Crown icon vàng
- **Panel Season bên phải:** Chọn mùa khác → leaderboard load lại ngay
- **My Rank:** Người dùng thấy ngay thứ hạng cá nhân mà không cần tìm kiếm
- **Season status:** ACTIVE (đang tính), FROZEN (đang finalize), CLOSED (đã kết thúc)

---

#### Bước 13.2 (Tổ chức) — Leaderboard nội bộ trong trang Organization

### Màn hình

`/organizations/:id` → tab **Leaderboard**

### Thao tác

1. Vào trang tổ chức "Hội Xanh Việt"
2. Click tab **"Leaderboard"**
3. Thấy bảng xếp hạng nội bộ chỉ gồm thành viên của Hội Xanh Việt
4. Chọn tab CRP hoặc VRP (không có ORG_AGGREGATE ở đây)
5. Click "My Rank" → thấy thứ hạng của mình trong tổ chức

### Lời thuyết trình

> _"Mỗi tổ chức có bảng xếp hạng nội bộ riêng — chỉ tính các thành viên của tổ chức đó. Đây là cách Hội Xanh Việt có thể thi đua giữa các thành viên của chính họ."_

---

#### Bước 13.3 (Admin) — Finalize Season và cấp thưởng

### Màn hình

Admin: `/admin/gamification/season`

### Thao tác

1. Admin vào **Gamification > Season**
2. Tìm dòng "Mùa Hè Xanh 2025" — status: ACTIVE
3. Click icon **Finalize** (tam giác play)
4. Dialog Finalize xuất hiện:
   - Tên season (chỉ đọc)
   - Chọn "Open next season?" → **Yes**
   - Điền: Label "Mùa Thu Xanh 2025", date range 01/07 – 31/07/2025
5. Click **"Finalize"**
6. Hệ thống tự động:
   - Snapshot CRP/VRP/ORG_AGGREGATE — đóng băng vĩnh viễn
   - Cấp SP cho top players theo Payout Tier
   - Season chuyển FROZEN/CLOSED
   - Mùa mới "Mùa Thu Xanh 2025" được tạo với status ACTIVE

### Lời thuyết trình

> _"Cuối mùa, Admin click Finalize. Hệ thống ngay lập tức chụp ảnh toàn bộ bảng xếp hạng — đóng băng vĩnh viễn. Rank 1 CRP nhận 500 SP thưởng, rank 2-3 nhận 300 SP... tất cả tự động, không cần Admin làm gì thêm. Đồng thời mùa mới bắt đầu — điểm CRP/VRP về 0 nhưng SP đã kiếm được vẫn còn nguyên để đổi quà."_

### Điều cần nhấn mạnh

- **Tự động cấp thưởng:** Payout tier áp dụng ngay khi finalize
- **Snapshot vĩnh viễn:** Người dùng xem lại thứ hạng mùa cũ bất kỳ lúc nào
- **SP không bị reset:** Tiếp tục dùng đổi quà sau khi mùa kết thúc
- **Mùa mới bắt đầu ngay:** Không bị gián đoạn

---

#### Bước 13.4 — Profile: Huy hiệu & Điểm

### Màn hình

`/profile/badges` và `/profile/points`

### Thao tác

1. Lan vào **Profile > Badges**:
   - Thấy summary stats: Tổng số badge, badge Lifetime, badge Seasonal, badge Repeatable
   - Lưới badge với icon, tên, category, số lần nhận
   - Filter theo category (REPORT / CAMPAIGN / CONTRIBUTION / RANK)
2. Lan vào **Profile > Points**:
   - **My Points:** CRP, VRP, SP hiện có, ngày SP gần nhất sẽ hết hạn (`nextExpiresAt`)
   - **Transaction History:** Lịch sử từng lần nhận điểm — loại giao dịch, số điểm, thời gian
   - Filter theo loại giao dịch

### Lời thuyết trình

> _"Hồ sơ cá nhân của Lan ghi lại toàn bộ hành trình đóng góp: mỗi huy hiệu đạt được, mỗi lần nhận điểm, ngày SP sắp hết hạn để nhắc nhở đổi quà đúng lúc."_

### Điều cần nhấn mạnh

- **Badge reward:** Một số badge mang lại discountBps (giảm giá đổi quà) hoặc bonus SP
- **nextExpiresAt:** Cảnh báo SP sắp hết hạn — nhắc người dùng đổi quà trước khi mất điểm
- **Phân loại badge:** Lifetime (dựa all-time) vs Seasonal (dựa trong mùa hiện tại)

---

## 📍 Bước 14: Tính năng SOS — Kêu gọi hỗ trợ khẩn cấp

### Màn hình

Bản đồ SOS (`/maps`) và trang quản lý chiến dịch (manager view)

### Thao tác

1. (Manager) Đang trong chiến dịch — phát hiện thiếu người và dụng cụ
2. Click **"Đạt tín hiệu SOS"** — nhập mô tả: "Thiếu túnh và bảo hộ lao động — cần 5 người thêm"
3. (Chuyển sang tài khoản Citizen khác) Thấy thông báo SOS khẩn cấp
4. Vào trang bản đồ `/maps` — thấy điểm SOS nổi bật trên bản đồ
5. Click vào điểm SOS — xem chi tiết: chiến dịch nào, cần gì, vị trí chính xác

### Lời thuyết trình

> _"Đây là tính năng 'báo động khẩn cấp' của EcoLink. Khi chiến dịch đang diễn ra mà gặp tình huống ngoài dự kiến — thiếu người, thiếu dụng cụ — manager phát tín hiệu SOS ngay lập tức._
>
> _Tín hiệu này xuất hiện trên bản đồ như một điểm cảnh báo nổi bật. Tất cả công dân xung quanh nhận thông báo và có thể chạy đến giúp ngay._
>
> _Khi chiến dịch hoàn thành, tất cả SOS liên quan tự động đóng lại — bản đồ luôn sạch sẽ, chỉ hiển thị SOS thực sự đang xảy ra."_

### Điều cần nhấn mạnh

- SOS thông báo realtime đến cộng đồng gần đó và Admin
- Hiển thị nổi bật trên bản đồ — khác với báo cáo thông thường
- Admin có thể xác nhận/đóng SOS từ console
- Tự động đóng khi chiến dịch finalize (không để SOS lơ lửng)
- `/maps` là nơi xem **toàn bộ** báo cáo + chiến dịch + SOS trên một bản đồ

---

## 📍 Bước 15: Chat AI trợ lý

### Màn hình

Widget chat AI (hiển thị ở góc phải màn hình, có thể mở ở bất kỳ trang nào)

### Thao tác

Click icon chat. Gõ: _"Tôi vừa tạo báo cáo về bãi rác, tôi cần làm gì tiếp theo?"_

### Lời thuyết trình

> _"Cuối cùng, ở bất kỳ đâu trên hệ thống, người dùng có thể gọi trợ lý AI. AI hiểu ngữ cảnh của EcoLink — nó biết về chiến dịch, về báo cáo, về cách tích điểm. Đây không phải chatbot trả lời theo kịch bản — đây là AI sinh tạo, có thể trả lời linh hoạt mọi câu hỏi về môi trường và về hệ thống."_

### Điều cần nhấn mạnh

- Chat streaming realtime (Server-Sent Events)
- Hỗ trợ gửi ảnh trong chat
- Có nhiều agent chuyên biệt (ví dụ: agent về báo cáo, agent về chiến dịch)

---

# Danh sách đầy đủ tất cả màn hình Frontend

> Tổng hợp từ `src/routes/index.tsx` — toàn bộ route được đăng ký trong ứng dụng

## Route Table — Tổng quan

| STT | Route                                    | Tên màn hình                | Layout        | Role        | Đã có trong tài liệu   | Ghi chú                                                |
| --- | ---------------------------------------- | --------------------------- | ------------- | ----------- | ---------------------- | ------------------------------------------------------ |
| 1   | `/`                                      | Trang chủ (Homepage)        | MainLayout    | Tất cả      | ✅ Có (Bước 1)         | Hero, ProblemSolution, ForVolunteers, ForCitizens, CTA |
| 2   | `/campaigns`                             | Danh sách chiến dịch        | MainLayout    | Tất cả      | ✅ Có                  | Search, filter, list                                   |
| 3   | `/campaigns/create`                      | Tạo chiến dịch              | MainLayout    | Chủ tổ chức | ✅ Có (Bước 7)         | Cần tài khoản tổ chức                                  |
| 4   | `/campaigns/me`                          | Chiến dịch của tôi          | MainLayout    | Đăng nhập   | ✅ Có (Bước 10)        | Danh sách chiến dịch đã tham gia + QR check-in         |
| 5   | `/campaigns/:id`                         | Chi tiết chiến dịch         | MainLayout    | Tất cả      | ✅ Có (Bước 9)         | Thông tin, tasks, join, QR code                        |
| 6   | `/incidents`                             | Danh sách báo cáo           | MainLayout    | Tất cả      | ✅ Có                  | Search, filter, list, map view                         |
| 7   | `/incidents/create`                      | Tạo báo cáo                 | MainLayout    | Đăng nhập   | ✅ Có (Bước 3)         | Upload ảnh, GPS, phân loại                             |
| 8   | `/incidents/me`                          | Báo cáo của tôi             | MainLayout    | Đăng nhập   | ⚠️ Sơ lược             | Danh sách báo cáo do user tạo, trạng thái              |
| 9   | `/incidents/:id`                         | Chi tiết báo cáo            | MainLayout    | Tất cả      | ✅ Có (Bước 4)         | AI kết quả, vote, trạng thái                           |
| 10  | `/organizations`                         | Danh sách tổ chức           | MainLayout    | Tất cả      | ⚠️ Sơ lược             | Search, filter, list tổ chức                           |
| 11  | `/organizations/create`                  | Tạo tổ chức                 | MainLayout    | Đăng nhập   | ⚠️ Sơ lược             | Đăng ký tổ chức, chờ admin duyệt                       |
| 12  | `/organizations/me`                      | Tổ chức của tôi             | MainLayout    | Chủ tổ chức | ❌ Chưa có             | Quản lý tổ chức do mình sở hữu                         |
| 13  | `/organizations/:id`                     | Chi tiết tổ chức            | MainLayout    | Tất cả      | ⚠️ Sơ lược             | Có 4 tab (xem chi tiết bên dưới)                       |
| 13a | `/organizations/:id` → tab Campaign      | DS chiến dịch của tổ chức   | —             | Tất cả      | ⚠️ Sơ lược             | —                                                      |
| 13b | `/organizations/:id` → tab Members       | Danh sách thành viên        | —             | Tất cả      | ❌ Chưa có             | —                                                      |
| 13c | `/organizations/:id` → tab Leaderboard   | Leaderboard nội bộ tổ chức  | —             | Tất cả      | ❌ Chưa có             | Variant "organization" — CRP/VRP only                  |
| 13d | `/organizations/:id` → tab Join Requests | Yêu cầu tham gia            | —             | Chủ tổ chức | ❌ Chưa có             | Chỉ owner thấy, badge đỏ khi có pending                |
| 14  | `/gifts`                                 | Cửa hàng quà tặng           | MainLayout    | Tất cả      | ✅ Có (Bước 12)        | Danh sách quà, đổi điểm                                |
| 15  | `/leaderboard`                           | Bảng xếp hạng               | MainLayout    | Tất cả      | ✅ Có (Bước 13)        | 3 tab metric, 2 scope, season selector                 |
| 16  | `/profile`                               | Hồ sơ (redirect)            | ProfileLayout | Đăng nhập   | ✅ Có                  | Redirect → /profile/account                            |
| 17  | `/profile/account`                       | Thông tin tài khoản         | ProfileLayout | Đăng nhập   | ⚠️ Sơ lược             | Avatar, tên, email, đặt vị trí, thông báo, bảo mật     |
| 18  | `/profile/badges`                        | Huy hiệu                    | ProfileLayout | Đăng nhập   | ⚠️ Sơ lược             | Summary stats + lưới badge + filter                    |
| 19  | `/profile/points`                        | Lịch sử điểm                | ProfileLayout | Đăng nhập   | ❌ Chưa có             | CRP/VRP/SP hiện có + transaction history               |
| 20  | `/profile/orders`                        | Đơn hàng đổi quà            | ProfileLayout | Đăng nhập   | ⚠️ Sơ lược             | Danh sách đơn đổi quà, trạng thái giao hàng            |
| 21  | `/maps`                                  | Bản đồ tương tác            | MapsLayout    | Tất cả      | ✅ Có (Bước 14)        | Leaflet, báo cáo + chiến dịch + SOS                    |
| 22  | `/sign-in`                               | Đăng nhập                   | AuthLayout    | Khách       | ✅ Có (Bước 2)         | Email/password + Google OAuth                          |
| 23  | `/sign-up`                               | Đăng ký                     | AuthLayout    | Khách       | ✅ Có (Bước 2)         | Email + xác thực                                       |
| 24  | `/authenticate`                          | Xác thực email              | AuthLayout    | Khách       | ❌ Chưa có             | Xác nhận email sau đăng ký                             |
| 25  | `/reset-password`                        | Đặt lại mật khẩu            | AuthLayout    | Khách       | ❌ Chưa có             | Đặt mật khẩu mới sau khi nhận link                     |
| 26  | `/request-reset-password`                | Yêu cầu đặt lại MK          | AuthLayout    | Khách       | ❌ Chưa có             | Nhập email để nhận link reset                          |
| 27  | `/google-callback`                       | Google OAuth callback       | AuthLayout    | —           | ❌ Chưa có             | Xử lý redirect từ Google, không cần demo trực tiếp     |
| 28  | `/auth/oauth/google/callback`            | Google OAuth callback (alt) | AuthLayout    | —           | ❌ Chưa có             | Alias route Google callback                            |
| 29  | `/admin`                                 | Admin Dashboard             | AdminLayout   | Admin       | ⚠️ Placeholder         | Chưa hoàn thiện — chỉ hiển thị text tĩnh               |
| 30  | `/admin/campaigns`                       | Quản lý chiến dịch          | AdminLayout   | Admin       | ✅ Có (Bước 6, 8, 11c) | Duyệt, từ chối, finalize                               |
| 31  | `/admin/incidents`                       | Quản lý báo cáo             | AdminLayout   | Admin       | ✅ Có (Bước 6)         | Duyệt, từ chối, mark complete                          |
| 32  | `/admin/organizations`                   | Quản lý tổ chức             | AdminLayout   | Admin       | ⚠️ Sơ lược             | Duyệt/từ chối tổ chức                                  |
| 33  | `/admin/gifts`                           | Quản lý quà tặng            | AdminLayout   | Admin       | ⚠️ Sơ lược             | CRUD quà, ẩn/hiện                                      |
| 34  | `/admin/gamification/config`             | Cấu hình Gamification       | AdminLayout   | Admin       | ✅ Có (Bổ sung)        | 5 tabs (xem chi tiết phần Leaderboard)                 |
| 35  | `/admin/gamification/badge`              | Quản lý Badge               | AdminLayout   | Admin       | ✅ Có (Bổ sung)        | CRUD badge, rule engine, reward                        |
| 36  | `/admin/gamification/season`             | Quản lý Season              | AdminLayout   | Admin       | ✅ Có (Bổ sung)        | CRUD season, finalize                                  |
| 37  | `/admin/settings`                        | Cài đặt Admin               | AdminLayout   | Admin       | ⚠️ Placeholder         | Chưa hoàn thiện — chỉ hiển thị text tĩnh               |

---

## Mô tả chi tiết các màn hình còn thiếu

### `/incidents/me` — Báo cáo của tôi

**Mục đích:** Người dùng xem lại toàn bộ báo cáo sự cố mình đã tạo

**Actor:** Đăng nhập (bất kỳ role)

**Cách demo:**

1. Đăng nhập → vào menu hoặc click "My Incidents"
2. Thấy danh sách báo cáo đã tạo, kèm trạng thái: PENDING / VERIFIED / COMPLETED / REJECTED
3. Filter theo trạng thái
4. Click vào báo cáo → xem chi tiết

**Giá trị nghiệp vụ:** Người dùng theo dõi được báo cáo của mình đang ở bước nào trong quy trình xử lý

---

### `/organizations` — Danh sách tổ chức

**Mục đích:** Khám phá các tổ chức môi trường trên hệ thống

**Actor:** Tất cả

**Cách demo:**

1. Vào menu "Organizations"
2. Tìm kiếm theo tên, lọc theo khu vực
3. Click vào tổ chức để xem chi tiết

**Giá trị nghiệp vụ:** Người dùng tìm tổ chức phù hợp để xin gia nhập và tham gia chiến dịch

---

### `/organizations/create` — Tạo tổ chức

**Mục đích:** Đăng ký tổ chức môi trường mới

**Actor:** Đăng nhập

**Cách demo:**

1. Click "Create Organization"
2. Điền: tên, mô tả, thông tin liên lạc, địa chỉ
3. Submit → chờ Admin duyệt

**Giá trị nghiệp vụ:** Tổ chức NGO, hội nhóm môi trường đăng ký chính thức để tạo chiến dịch

---

### `/organizations/me` — Tổ chức của tôi

**Mục đích:** Chủ tổ chức quản lý tổ chức của mình

**Actor:** Chủ tổ chức (đã được admin duyệt)

**Cách demo:**

1. Đăng nhập tài khoản chủ tổ chức
2. Vào "My Organization"
3. Xem thông tin tổ chức, trạng thái, chỉnh sửa

**Giá trị nghiệp vụ:** Quản lý hồ sơ tổ chức, duy trì thông tin cập nhật

---

### `/organizations/:id` — Tab Members (Thành viên tổ chức)

**Mục đích:** Xem danh sách tình nguyện viên đang là thành viên của tổ chức

**Actor:** Tất cả (chỉ đọc); Chủ tổ chức (có thêm tùy chọn quản lý)

**Cách demo:**

1. Vào trang chi tiết tổ chức
2. Click tab **"Members"**
3. Thấy danh sách thành viên: avatar, tên, vai trò, ngày tham gia

**Giá trị nghiệp vụ:** Minh bạch hóa cộng đồng tổ chức; người muốn gia nhập có thể thấy độ lớn và tính tích cực của tổ chức

---

### `/organizations/:id` → Tab Join Requests (Chỉ Chủ tổ chức)

**Mục đích:** Duyệt yêu cầu tham gia tổ chức từ tình nguyện viên

**Actor:** Chủ tổ chức

**Cách demo:**

1. Đăng nhập chủ tổ chức
2. Vào trang tổ chức của mình → tab **"Join Requests"**
3. Thấy badge đỏ số lượng pending (ví dụ "9+")
4. Duyệt hoặc từ chối từng yêu cầu

**Giá trị nghiệp vụ:** Tổ chức kiểm soát được thành phần thành viên; đảm bảo chất lượng cộng đồng

---

### `/profile/account` — Thông tin tài khoản

**Mục đích:** Xem và chỉnh sửa thông tin cá nhân

**Actor:** Đăng nhập

**Nội dung màn hình:**

- Avatar (click để đổi — upload lên Cloudinary)
- Tên hiển thị, Email (chỉ đọc)
- Vị trí của tôi (ProfileLocationSection) — dùng để matching thông báo chiến dịch gần đó
- Cài đặt thông báo (ProfileNotificationSection)
- Bảo mật — gợi ý đổi mật khẩu nếu nghi bị xâm phạm
- Nút Logout

**Cách demo:**

1. Đăng nhập → Profile → Account
2. Click avatar → chọn ảnh mới → xem avatar cập nhật ngay
3. Chỉnh vị trí → lưu → hệ thống matching chiến dịch gần đó

**Giá trị nghiệp vụ:** Người dùng kiểm soát thông tin cá nhân; vị trí giúp nhận thông báo chiến dịch phù hợp địa lý

---

### `/profile/points` — Lịch sử điểm

**Mục đích:** Xem số điểm hiện có và lịch sử giao dịch

**Actor:** Đăng nhập

**Nội dung màn hình:**

- **My Points card:** CRP hiện có, VRP hiện có, SP hiện có, ngày SP gần nhất hết hạn (`nextExpiresAt`)
- **Transaction History:** Bảng lịch sử từng lần nhận điểm
  - Loại giao dịch: REPORT_COMPLETION, UPVOTE, REPORT_VOTE_MILESTONE, CAMPAIGN_COMPLETION, REFERRAL, SEASON_END, v.v.
  - Số SP nhận, ngày giao dịch
- **Filter:** Lọc theo loại giao dịch

**Cách demo:**

1. Đăng nhập tài khoản Lan → Profile → Points
2. Thấy: "SP: 50 — hết hạn 01/09/2025"
3. Xem transaction history: lần nhận điểm từ chiến dịch gần nhất
4. Filter theo "CAMPAIGN_COMPLETION"

**Giá trị nghiệp vụ:** Minh bạch hoàn toàn — người dùng biết điểm đến từ đâu, còn bao nhiêu, hết hạn khi nào

---

### `/profile/orders` — Đơn hàng đổi quà

**Mục đích:** Theo dõi trạng thái các lần đổi quà

**Actor:** Đăng nhập

**Trạng thái đơn hàng:**

- **PROCESSING** — Đang xử lý (màu vàng)
- **SHIPPED** — Đã giao cho đơn vị vận chuyển (màu xanh dương)
- **DELIVERED** — Đã nhận hàng (màu xanh lá)
- **CANCELLED** — Đã hủy (màu đỏ)

**Thông tin mỗi đơn:** Tên quà, số SP đã tiêu, ngày đặt, số điện thoại, địa chỉ nhận, trạng thái cập nhật lần cuối

**Cách demo:**

1. Lan vào Profile → Orders
2. Thấy đơn hàng "Túi vải thân thiện môi trường" — PROCESSING
3. Theo dõi tiến trình giao hàng

**Giá trị nghiệp vụ:** Đóng vòng lặp reward — người dùng thấy quà thực sự đang trên đường đến tay mình

---

### `/authenticate` — Xác thực email

**Mục đích:** Xác nhận email sau đăng ký

**Actor:** Khách (vừa đăng ký)

**Luồng:** Đăng ký → nhận email → click link → redirect về `/authenticate` → tài khoản được kích hoạt

**Giá trị nghiệp vụ:** Đảm bảo email hợp lệ, ngăn tài khoản rác

---

### `/request-reset-password` — Yêu cầu đặt lại mật khẩu

**Mục đích:** Người dùng quên mật khẩu nhập email để nhận link reset

**Actor:** Khách

**Luồng:** Nhập email → hệ thống gửi email có link → click link → redirect về `/reset-password`

---

### `/reset-password` — Đặt lại mật khẩu

**Mục đích:** Đặt mật khẩu mới sau khi nhận link từ email

**Actor:** Khách (đã nhận link reset)

**Luồng:** Nhập mật khẩu mới + xác nhận → submit → đăng nhập lại

---

### `/admin` — Admin Dashboard (Placeholder)

**Mục đích:** Trang chào mừng Admin sau khi đăng nhập vào console

**Actor:** Admin

**Nội dung hiện tại:** Chưa hoàn thiện — chỉ hiển thị tiêu đề "Admin" và text "Dashboard content goes here. Use the sidebar to navigate."

**Ghi chú:** Dùng sidebar để điều hướng đến các module quản lý

---

### `/admin/organizations` — Quản lý tổ chức

**Mục đích:** Admin duyệt, từ chối tổ chức mới đăng ký

**Actor:** Admin

**Cách demo:**

1. Admin vào Admin > Organizations
2. Thấy danh sách tổ chức theo trạng thái: PENDING / ACTIVE / REJECTED
3. Click vào tổ chức chờ duyệt → xem thông tin
4. Duyệt → tổ chức được kích hoạt, chủ tổ chức có thể tạo chiến dịch

**Giá trị nghiệp vụ:** Kiểm soát chất lượng tổ chức tham gia hệ thống

---

### `/admin/gifts` — Quản lý quà tặng

**Mục đích:** Admin thêm, sửa, ẩn quà trong cửa hàng điểm thưởng

**Actor:** Admin

**Cách demo:**

1. Admin vào Admin > Gifts
2. Xem danh sách quà đang có: tên, giá SP, trạng thái (hiện/ẩn)
3. Click "Create" → điền thông tin quà mới: tên, mô tả, giá SP, ảnh, số lượng
4. Ẩn quà hết hàng

**Giá trị nghiệp vụ:** Quản lý catalog quà, điều chỉnh giá và số lượng theo thực tế

---

### `/admin/settings` — Cài đặt Admin (Placeholder)

**Mục đích:** Cài đặt hệ thống (chưa hoàn thiện)

**Actor:** Admin

**Nội dung hiện tại:** Chưa hoàn thiện — chỉ hiển thị text "Admin settings placeholder."

**Ghi chú:** Dành cho phiên bản tương lai

---

# Dữ liệu chuẩn bị

## Tài khoản demo

| Vai trò             | Username                 | Mật khẩu      | Mô tả                              |
| ------------------- | ------------------------ | ------------- | ---------------------------------- |
| Admin               | `admin@ecolink.vn`       | `Admin@2024!` | Quản trị toàn hệ thống             |
| Chủ tổ chức         | `hoixanhviet@ecolink.vn` | `Demo@2024!`  | Hội Xanh Việt — tổ chức môi trường |
| Người dân 1         | `minh@gmail.com`         | `Demo@2024!`  | Người báo cáo sự cố chính          |
| Người dân 2 (voter) | `voter@gmail.com`        | `Demo@2024!`  | Tài khoản để vote báo cáo          |
| Tình nguyện viên    | `lan@gmail.com`          | `Demo@2024!`  | Lan — tình nguyện viên nhiệt tình  |

## Dữ liệu mẫu (chuẩn bị trước khi demo)

### Dữ liệu bắt buộc có sẵn:

- **Tổ chức "Hội Xanh Việt"** — đã được duyệt, sẵn sàng tạo chiến dịch
- **3-5 báo cáo cũ** — đã được duyệt, để hiển thị trên bản đồ tổng quan
- **2-3 chiến dịch đã hoàn thành** — để Lan có huy hiệu "Volunteer Starter"
- **Lan có 50+ Green Points** — để demo đổi quà ngay lập tức
- **Cửa hàng có 5+ quà tặng** — đa dạng mức giá (20, 50, 100 điểm)
- **Mùa giải đang ACTIVE** — để bảng xếp hạng hiển thị đúng

### Dữ liệu tạo LIVE trong demo:

- Báo cáo mới của Minh (tạo trực tiếp)
- Chiến dịch mới của Hội Xanh Việt
- Yêu cầu tham gia của Lan

### Ảnh cần chuẩn bị:

- 3 ảnh rác thải thực tế (chất lượng cao, rõ ràng) để upload demo
- 1 ảnh "After" sau dọn dẹp để nộp kết quả
- Ảnh AI annotated (backup trong trường hợp AI service lag)

### Dữ liệu tránh lỗi:

- Đảm bảo Cloudinary upload preset còn hoạt động
- Kiểm tra API Gateway đang chạy
- Pre-warm AI service trước 5 phút (gửi 1 request test)

---

# Kế hoạch demo theo thời lượng

## ⏱️ Demo 5 phút — "Ấn tượng đầu tiên"

**Mục tiêu:** Cho người xem thấy vòng lặp cốt lõi

| Thứ tự | Nội dung                                                    |
| ------ | ----------------------------------------------------------- |
| 1      | Trang chủ + bản đồ (30 giây)                                |
| 2      | Tạo báo cáo sự cố có ảnh + GPS (90 giây)                    |
| 3      | AI phân tích ảnh — hiển thị kết quả (60 giây)               |
| 4      | Admin duyệt báo cáo trong 1 click (30 giây)                 |
| 5      | Tình nguyện viên đổi quà bằng Green Points có sẵn (60 giây) |

---

## ⏱️ Demo 10 phút — "Luồng cơ bản đầy đủ"

Bổ sung thêm (ngoài 5 phút):

- Tổ chức tạo chiến dịch gắn với báo cáo
- Admin duyệt chiến dịch + thông báo địa lý
- Tình nguyện viên đăng ký và được duyệt
- Bảng xếp hạng và huy hiệu

---

## ⏱️ Demo 15 phút — "Kịch bản hoàn chỉnh"

Bổ sung thêm (ngoài 10 phút):

- Quét QR code điểm danh hiện trường (hoặc mô phỏng)
- Upload kết quả sau chiến dịch
- Hoàn thành chiến dịch + cấp điểm tự động
- Chat với AI trợ lý

---

## ⏱️ Demo 20 phút+ — "Kịch bản mở rộng"

Bổ sung thêm (ngoài 15 phút):

- Tính năng SOS trong chiến dịch
- Admin console toàn diện: cấu hình badge, mùa giải, quà tặng
- Chế độ đa ngôn ngữ (đổi sang tiếng Anh)
- Bản đồ đầy đủ (`/maps`) — xem toàn bộ sự cố và SOS theo vị trí
- Tổ chức tạo và quản lý thành viên
- Luồng tạo chiến dịch cấp độ khó cao (nhiều Green Points hơn)

---

# Câu hỏi phản biện

| Câu hỏi                                                | Cách trả lời                                                                                                                                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"AI phân tích ảnh có chính xác không?"**             | "Mô hình object detection được train trên dataset rác thải thực tế, cho kết quả theo bounding box kèm điểm confidence. Ngoài ra còn có xác minh cộng đồng (vote) và admin review — 3 lớp kiểm tra giảm thiểu sai sót." |
| **"Làm sao đảm bảo tình nguyện viên thực sự có mặt?"** | "Hệ thống QR Code điểm danh tại hiện trường — mã QR chỉ được tạo bởi quản lý chiến dịch tại thời điểm sự kiện, không thể chia sẻ trước. Kết hợp với GPS location của người quét."                                      |
| **"Báo cáo giả mạo thì sao?"**                         | "3 cơ chế: (1) AI phân tích ảnh ngay khi upload — phát hiện ảnh không liên quan, (2) Vote cộng đồng cross-check, (3) Admin review trước khi duyệt. Báo cáo vi phạm bị ban."                                            |
| **"Hệ thống có mở rộng được không?"**                  | "Kiến trúc microservices với API Gateway — mỗi service scale độc lập. Hiện tại 5 services, dễ dàng thêm service mới. Đang deploy trên Kubernetes (Helm charts + ArgoCD CD/CD)."                                        |
| **"Bảo mật như thế nào?"**                             | "JWT token với auto-refresh. Token access ngắn hạn, token refresh dài hạn lưu phía client. Không có session server-side. Tất cả endpoint xác thực qua API Gateway trước khi đến service."                              |
| **"Ai sẽ dùng hệ thống này?"**                         | "3 nhóm: (1) Người dân muốn đóng góp và nhận phần thưởng, (2) Tổ chức NGO/môi trường muốn huy động tình nguyện viên, (3) Cơ quan địa phương muốn data về tình trạng môi trường."                                       |
| **"So với việc đăng Facebook hay Zalo thì khác gì?"**  | "Trên mạng xã hội: post mà không ai xử lý, không có feedback. EcoLink: có vòng lặp hoàn chỉnh — báo cáo → xác minh → chiến dịch → xử lý → phần thưởng. Người báo cáo thấy tác động thực sự của mình."                  |
| **"Green Points có thực sự có giá trị không?"**        | "Điểm được đổi thành quà tặng thực tế từ đối tác (túi vải, bình nước, v.v.). Người có huy hiệu cao còn được giảm giá khi đổi. Đây là chế độ discount_bps tích hợp trong badge system."                                 |
| **"Hiệu năng thế nào khi nhiều người dùng?"**          | "Phân tích ảnh AI chạy bất đồng bộ qua message queue (SQS) — không block luồng chính. Background worker xử lý riêng. Hệ thống không bị chậm ngay cả khi AI đang phân tích."                                            |
| **"Dữ liệu người dùng được bảo vệ thế nào?"**          | "Không lưu ảnh trực tiếp — dùng Cloudinary CDN. Dữ liệu vị trí chỉ dùng để hiển thị bản đồ và matching chiến dịch. Người dùng kiểm soát thông tin cá nhân qua trang profile."                                          |
| **"Tính năng nào chưa hoàn thiện?"**                   | "Theo source code: (1) Chưa có test framework, (2) Dockerfile frontend cần cập nhật từ Next.js sang Vite, (3) Nginx config chưa có tài liệu. Đây là dự án đang phát triển tích cực."                                   |

---

# Đề xuất cải tiến trong tương lai

> _Dựa trên phân tích source code — các tính năng này CHƯA TỒN TẠI trong codebase hiện tại_

| STT | Tính năng                                | Lý do đề xuất                                                                                           |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | **Mobile App (React Native)**            | Web hiện tại khó dùng khi đứng ngoài đường báo cáo. App native sẽ tốt hơn cho camera + GPS              |
| 2   | **Heatmap ô nhiễm**                      | Hiện có dữ liệu vị trí nhưng chưa có visualization heatmap — giúp cơ quan nhà nước thấy vùng trọng điểm |
| 3   | **Tích hợp thanh toán thực**             | Green Points hiện chỉ đổi quà nội bộ — tích hợp MoMo/VNPay để chuyển thành tiền mặt sẽ tăng động lực    |
| 4   | **Open API cho Chính quyền**             | Cho phép UBND phường/xã truy cập data báo cáo qua API để lên kế hoạch xử lý                             |
| 5   | **Gamification Team**                    | Thi đua theo nhóm/tổ chức — hiện đã có ORG_AGGREGATE leaderboard, cần thêm tính năng team challenge     |
| 6   | **Tính năng phát sóng trực tiếp**        | Livestream trong chiến dịch để cộng đồng theo dõi từ xa                                                 |
| 7   | **Tích hợp IoT sensor**                  | Nhận báo cáo tự động từ cảm biến môi trường (nước thải, không khí)                                      |
| 8   | **AI phân loại tự động mức độ khẩn cấp** | Hiện AI detect đối tượng nhưng chưa tự động escalate báo cáo nguy hiểm lên admin                        |
| 9   | **Carbon footprint tracker**             | Theo dõi lượng carbon tiết kiệm được qua các chiến dịch — số liệu báo cáo tác động                      |
| 10  | **Marketplace đối tác**                  | Doanh nghiệp đăng ký đối tác để cung cấp quà — mở rộng pool phần thưởng                                 |

---

_Tài liệu này được tổng hợp từ phân tích trực tiếp source code EcoLink (ecolink-client + DA2-backend). Tất cả tính năng mô tả đều tồn tại trong code. Các mục có ghi chú ⚠️ là những điểm cần kiểm tra kỹ trước demo._

---

# Coverage Report

## Tổng quan phủ sóng tài liệu

| Hạng mục                                    | Số lượng                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| Tổng số route FE                            | 37 (bao gồm 2 alias route Google callback và các sub-tab trong org detail) |
| Route chính (unique pages)                  | 30                                                                         |
| Đã được mô tả đầy đủ trong tài liệu         | 22                                                                         |
| Mô tả sơ lược / chưa đủ                     | 8                                                                          |
| Chưa có trong tài liệu (trước khi cập nhật) | 7                                                                          |
| Sau khi cập nhật — Còn thiếu                | 0                                                                          |

---

## Missing Features Found (Đã bổ sung trong lần cập nhật này)

Các màn hình/chức năng bị bỏ sót trong phiên bản tài liệu cũ:

| STT | Màn hình / Chức năng                                                                        | Mức độ thiếu sót           | Đã bổ sung? |
| --- | ------------------------------------------------------------------------------------------- | -------------------------- | ----------- |
| 1   | `/organizations/me` — Tổ chức của tôi                                                       | Hoàn toàn thiếu            | ✅          |
| 2   | `/organizations/:id` → tab Members                                                          | Hoàn toàn thiếu            | ✅          |
| 3   | `/organizations/:id` → tab Leaderboard (nội bộ tổ chức)                                     | Hoàn toàn thiếu            | ✅          |
| 4   | `/organizations/:id` → tab Join Requests                                                    | Hoàn toàn thiếu            | ✅          |
| 5   | `/profile/points` — Lịch sử điểm + My Points                                                | Hoàn toàn thiếu            | ✅          |
| 6   | `/authenticate` — Xác thực email                                                            | Hoàn toàn thiếu            | ✅          |
| 7   | `/request-reset-password` — Yêu cầu reset password                                          | Hoàn toàn thiếu            | ✅          |
| 8   | `/reset-password` — Đặt lại mật khẩu                                                        | Hoàn toàn thiếu            | ✅          |
| 9   | `/admin` — Dashboard placeholder                                                            | Chưa ghi rõ là placeholder | ✅          |
| 10  | `/admin/settings` — Settings placeholder                                                    | Hoàn toàn thiếu            | ✅          |
| 11  | UI chi tiết của Leaderboard (podium Top3, MetricTabs, SeasonCard, My Rank scope)            | Thiếu mô tả UI             | ✅          |
| 12  | Luồng demo Admin tạo Season → Leaderboard → Finalize đầy đủ                                 | Thiếu flow                 | ✅          |
| 13  | Admin config tabs chi tiết (5 tabs: Point Rules, SP Rules, Multipliers, Difficulty, Payout) | Thiếu mô tả UI             | ✅          |
| 14  | Badge system đầy đủ: category, scope, rules engine, reward (discountBps, bonusSp)           | Thiếu mô tả UI             | ✅          |
| 15  | Badge types: REPORT / CAMPAIGN / CONTRIBUTION / RANK                                        | Hoàn toàn thiếu            | ✅          |
| 16  | Badge scope LIFETIME vs SEASON                                                              | Hoàn toàn thiếu            | ✅          |
| 17  | Profile Badges page — summary stats (total, lifetime, seasonal, repeatable)                 | Thiếu mô tả UI             | ✅          |
| 18  | Profile Account — đổi avatar, cài vị trí, cài thông báo                                     | Thiếu mô tả UI             | ✅          |
| 19  | Profile Orders — trạng thái PROCESSING/SHIPPED/DELIVERED/CANCELLED                          | Thiếu mô tả UI             | ✅          |
| 20  | Admin: Finalize Season dialog (open next season option)                                     | Thiếu mô tả UI             | ✅          |
| 21  | Season statuses: ACTIVE / FROZEN / CLOSED (không phải INACTIVE)                             | Sai trong doc cũ           | ✅          |
| 22  | Season kinds: MONTHLY / QUARTERLY                                                           | Hoàn toàn thiếu            | ✅          |
| 23  | Difficulty Settings tab — cấu hình greenPointsReward theo cấp độ                            | Hoàn toàn thiếu            | ✅          |

---

## Demo Completeness Score

### Coverage nghiệp vụ (Business Logic Coverage): 95%

| Actor       | Nghiệp vụ có trong tài liệu | Tổng | %    |
| ----------- | --------------------------- | ---- | ---- |
| Người dân   | 11/11                       | 11   | 100% |
| Chủ tổ chức | 6/6                         | 6    | 100% |
| Admin       | 8/8 + gamification đầy đủ   | 8+   | 100% |
| SOS         | 5/5                         | 5    | 100% |
| AI          | 4/4                         | 4    | 100% |

### Coverage UI (UI Screen Coverage): 97%

| Loại            | Đã mô tả | Tổng | %                                    |
| --------------- | -------- | ---- | ------------------------------------ |
| Main pages      | 13/14    | 14   | 93%                                  |
| Auth pages      | 5/6      | 6    | 83% (google-callback không cần demo) |
| Admin pages     | 7/7      | 7    | 100%                                 |
| Profile tabs    | 4/4      | 4    | 100%                                 |
| Org detail tabs | 4/4      | 4    | 100%                                 |

> Note: `/google-callback` và `/auth/oauth/google/callback` là internal redirect route không cần demo trực tiếp.

### Coverage Actor (Actor Coverage): 100%

Tất cả 5 actor đã được mô tả đầy đủ luồng nghiệp vụ:

- ✅ Người dân / Công dân
- ✅ Chủ tổ chức / Campaign Manager
- ✅ Tình nguyện viên
- ✅ Quản trị viên (Admin)
- ✅ Hệ thống AI (tự động)

### Coverage Demo Flow (Demo Scenario Coverage): 95%

| Demo Flow                                                 | Trạng thái              |
| --------------------------------------------------------- | ----------------------- |
| Báo cáo sự cố → AI phân tích → Admin duyệt                | ✅ Đầy đủ               |
| Tổ chức tạo chiến dịch → Admin duyệt → Volunteer tham gia | ✅ Đầy đủ               |
| Check-in QR → Nộp hồ sơ → Admin xác nhận → Cấp điểm       | ✅ Đầy đủ               |
| Đổi quà bằng SP                                           | ✅ Đầy đủ               |
| SOS kêu gọi hỗ trợ                                        | ✅ Đầy đủ               |
| Chat AI                                                   | ✅ Đầy đủ               |
| Admin tạo Season → Finalize → Payout                      | ✅ Đầy đủ (bổ sung mới) |
| Leaderboard: 3 metrics + My Rank + Season selector        | ✅ Đầy đủ (bổ sung mới) |
| Badge: nhận badge → reward (discount/bonus SP)            | ✅ Đầy đủ (bổ sung mới) |
| Profile: account, badges, points, orders                  | ✅ Đầy đủ (bổ sung mới) |
| Organization: members, leaderboard tab, join requests     | ✅ Đầy đủ (bổ sung mới) |
| Auth: xác thực email, reset password                      | ✅ Đầy đủ (bổ sung mới) |

---

## Đề xuất bổ sung tiếp theo

Các điểm có thể cải thiện thêm trong tài liệu (không phải thiếu sót mà là cơ hội nâng cao):

| STT | Đề xuất                                                                      | Lý do                                                                                |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Thêm screenshot mockup cho mỗi màn hình chính                                | Giúp người demo hình dung giao diện trước khi đứng trước máy                         |
| 2   | Demo script riêng cho luồng Organization owner                               | Luồng Chủ tổ chức (tạo org → duyệt thành viên → tạo chiến dịch) chưa có script riêng |
| 3   | Bổ sung demo badge cụ thể: tạo badge → user trigger → nhận badge             | Hiện mô tả nghiệp vụ nhưng chưa có script demo bước-từng-bước                        |
| 4   | Bổ sung demo Admin Gifts: tạo quà mới trong demo live                        | Hiện chỉ nói "cửa hàng có quà sẵn", chưa demo Admin thêm quà                         |
| 5   | Thêm timing estimate cho từng màn hình mới (badges, points, org leaderboard) | Giúp lên kế hoạch demo 20 phút+ chính xác hơn                                        |
