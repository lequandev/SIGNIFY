# Signify for Education — Requirements

## Giới thiệu

Chuyển hướng Signify từ mô hình Business sang Education. Nền tảng hỗ trợ học sinh học ngôn ngữ ký hiệu thông qua video YouTube: giáo viên tạo lớp, giao video học tập, theo dõi tiến độ từng học sinh và đánh giá kết quả. Học sinh xem video trên YouTube kèm animation ký hiệu qua Chrome Extension.

Tài liệu này bám theo hiện trạng codebase:
- Backend Spring Boot + MongoDB, module hoá (`auth`, `user`, `business`, `subscription`, `payment`, `entitlement`, `admin`, `ai`, `tracking`, `media`).
- Frontend React + Vite + TS + Tailwind + Redux.
- Chrome Extension overlay animation ký hiệu trên YouTube (`youtube-subtitle-extension`), có `auth-sync` đồng bộ token từ web.

### Quyết định thiết kế đã chốt
1. Giáo viên tạo tài khoản học sinh **trực tiếp** (không dùng luồng lời mời qua email). Học sinh nhận email + mật khẩu tạm do hệ thống sinh.
2. Mỗi trường gắn **một** subscription (giữ nguyên mô hình `business` hiện tại, đổi tên domain sang `school`).
3. Bốn vai trò: `ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`.

## Thuật ngữ
- **Trường (School)**: tổ chức, kế thừa `BusinessOrganization`, gắn 1 subscription.
- **School Membership**: quan hệ user ↔ trường + role (`SCHOOL_ADMIN` | `TEACHER` | `STUDENT`).
- **Lớp (Class)**: do giáo viên tạo, thuộc một trường.
- **Enrollment**: học sinh thuộc một lớp.
- **Assignment**: một video YouTube được giao cho một lớp.
- **Progress**: tiến độ của học sinh với một assignment.
- **Evaluation**: đánh giá của giáo viên cho một học sinh.

## Requirements

### Requirement 1 — Quản trị hệ thống (Admin)
**User story:** Là Admin, tôi muốn quản lý toàn bộ hệ thống để vận hành nền tảng.

#### Acceptance Criteria
1. WHEN admin đăng nhập THEN hệ thống SHALL cho truy cập trang quản trị chỉ với role `ADMIN`.
2. THE hệ thống SHALL cho admin xem danh sách trường học, tạo/khoá/kích hoạt trường.
3. THE hệ thống SHALL cho admin quản lý gói dịch vụ (CRUD packages).
4. THE hệ thống SHALL cho admin quản lý tài khoản người dùng (xem, đổi trạng thái).
5. THE hệ thống SHALL cho admin xem danh sách subscription và trạng thái.
6. THE hệ thống SHALL hiển thị dashboard thống kê: số trường, số giáo viên, số học sinh, số lớp, số bài học đã hoàn thành.

### Requirement 2 — Quản trị trường học (School Admin)
**User story:** Là School Admin, tôi muốn quản lý giáo viên, học sinh và lớp trong trường.

#### Acceptance Criteria
1. WHEN một subscription gói giáo dục được kích hoạt THEN hệ thống SHALL tạo trường và gán người mua làm `SCHOOL_ADMIN`.
2. THE hệ thống SHALL cho School Admin tạo tài khoản giáo viên (nhập họ tên + email).
3. WHEN tạo giáo viên/học sinh THEN hệ thống SHALL kiểm tra tổng số tài khoản không vượt `maxAccounts` của gói.
4. THE hệ thống SHALL cho School Admin xem/khoá/mở khoá giáo viên và học sinh trong trường.
5. THE hệ thống SHALL cho School Admin xem thống kê toàn trường (số lớp, số học sinh, tỷ lệ hoàn thành bài học).
6. IF người dùng không phải `SCHOOL_ADMIN` của trường THEN hệ thống SHALL trả về 403 cho các thao tác quản trị trường.

### Requirement 3 — Giáo viên: quản lý lớp & học sinh
**User story:** Là giáo viên, tôi muốn tạo lớp và thêm học sinh để tổ chức việc học.

#### Acceptance Criteria
1. THE hệ thống SHALL cho giáo viên tạo lớp với tên và mô tả, thuộc trường của giáo viên.
2. THE hệ thống SHALL cho giáo viên tạo tài khoản học sinh trực tiếp (họ tên + email); hệ thống SHALL sinh mật khẩu tạm và gửi email cho học sinh.
3. WHEN tạo học sinh với email đã tồn tại trong trường THEN hệ thống SHALL báo lỗi thay vì tạo trùng.
4. THE hệ thống SHALL cho giáo viên thêm học sinh (đã có trong trường) vào một lớp và xoá khỏi lớp.
5. THE hệ thống SHALL cho giáo viên xem danh sách lớp và học sinh của từng lớp.
6. IF giáo viên thao tác trên lớp không thuộc mình THEN hệ thống SHALL trả về 403.

### Requirement 4 — Giáo viên: giao video & đánh giá
**User story:** Là giáo viên, tôi muốn giao video YouTube và đánh giá học sinh.

#### Acceptance Criteria
1. THE hệ thống SHALL cho giáo viên giao một video YouTube (URL hoặc videoId) cho một lớp, kèm tiêu đề và hạn nộp tuỳ chọn.
2. WHEN giao video THEN hệ thống SHALL trích xuất `youtubeVideoId` hợp lệ từ URL; IF URL không hợp lệ THEN trả lỗi.
3. THE hệ thống SHALL tạo bản ghi progress `ASSIGNED` cho mỗi học sinh trong lớp khi giao video.
4. THE hệ thống SHALL cho giáo viên xem tiến độ của từng học sinh theo assignment (assigned/in_progress/completed).
5. THE hệ thống SHALL cho giáo viên xem lịch sử học của một học sinh (các video đã xem/hoàn thành).
6. THE hệ thống SHALL cho giáo viên tạo đánh giá cho học sinh (điểm số và/hoặc nhận xét).

### Requirement 5 — Học sinh qua Chrome Extension
**User story:** Là học sinh, tôi muốn nhận video được giao và học qua extension.

#### Acceptance Criteria
1. THE hệ thống SHALL cho học sinh đăng nhập trên web; extension SHALL đồng bộ token qua `auth-sync`.
2. WHEN học sinh mở extension THEN hệ thống SHALL hiển thị danh sách video được giao (chưa hoàn thành ưu tiên trước).
3. WHEN học sinh chọn một video THEN extension SHALL mở đúng trang YouTube của video đó.
4. WHILE xem video THE extension SHALL hiển thị animation ngôn ngữ ký hiệu overlay (chức năng hiện có).
5. WHEN học sinh bấm "Hoàn thành bài học" THEN hệ thống SHALL cập nhật progress sang `COMPLETED` và ghi `completedAt`.
6. THE hệ thống SHALL cho học sinh xem lịch sử học tập của mình.
7. IF token hết hạn/không hợp lệ THEN extension SHALL yêu cầu đăng nhập lại.

### Requirement 6 — Phân quyền & bảo mật
**User story:** Là chủ hệ thống, tôi muốn phân quyền chặt theo vai trò.

#### Acceptance Criteria
1. THE hệ thống SHALL bảo vệ mọi endpoint nghiệp vụ bằng JWT (không để `permitAll` mặc định cho API nghiệp vụ).
2. THE hệ thống SHALL kiểm tra role cho từng nhóm endpoint (admin/school/teacher/student).
3. THE hệ thống SHALL đảm bảo dữ liệu bị cô lập theo trường: người dùng chỉ truy cập dữ liệu trong trường của mình.
4. WHEN mật khẩu tạm được tạo THEN hệ thống SHALL lưu dạng hash và buộc/khuyến nghị đổi mật khẩu ở lần đăng nhập đầu.

### Requirement 7 — Tương thích dữ liệu & migration
**User story:** Là dev, tôi muốn chuyển đổi dữ liệu business hiện có mà không mất mát.

#### Acceptance Criteria
1. THE hệ thống SHALL giữ nguyên collections dùng chung (`users`, `packages`, `subscriptions`, `payments`).
2. WHERE dữ liệu business cũ tồn tại THE hệ thống SHALL ánh xạ `BusinessOrganization`→`School`, `BusinessMembership`→`SchoolMembership` (role `BUSINESS_ADMIN`→`SCHOOL_ADMIN`, `MEMBER`→`STUDENT` hoặc `TEACHER` theo cấu hình).
3. THE gói dịch vụ `planType` SHALL hỗ trợ giá trị `education` (bên cạnh `individual`).
