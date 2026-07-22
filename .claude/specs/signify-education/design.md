# Signify for Education — Design

## Tổng quan

Xây trên nền codebase hiện tại. Chiến lược: **tái dùng tối đa module `business`**, đổi tên domain sang `school`, và bổ sung các module mới cho lớp/giao video/tiến độ/đánh giá. Ba thành phần: Backend (Spring Boot + MongoDB), Frontend (React), Chrome Extension.

```
              ┌───────────────┐
   Web (React)│ Admin / School│  JWT
              │ Teacher portals│──────────┐
              └───────────────┘          │
                                         ▼
   Extension ─── auth-sync token ──▶ Spring Boot API ──▶ MongoDB
   (student)                              │
                                          └── YouTube transcript + AI gloss (có sẵn)
```

## Kiến trúc module backend

Tạo module `education` gom domain giáo dục, tái dùng service/repo của `business` ở tầng School.

```
com.signify.modules
├── school        (refactor từ business)
│   ├── model: School, SchoolMembership
│   ├── repo, service: SchoolService
│   └── controller: SchoolController, SchoolAdminController
├── classroom     (mới)
│   ├── model: Classroom, ClassEnrollment
│   ├── repo, service: ClassroomService
│   └── controller: ClassroomController
├── assignment    (mới)
│   ├── model: Assignment, AssignmentProgress
│   ├── repo, service: AssignmentService
│   └── controller: AssignmentController, StudentAssignmentController
├── evaluation    (mới)
│   ├── model: Evaluation
│   └── controller/service
└── (giữ) auth, user, subscription, payment, admin, ai, media
```

## Data model (MongoDB)

### users (mở rộng — không đổi cấu trúc)
- Thêm giá trị role: `ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`.
- Thêm cờ `mustChangePassword: Boolean` (cho tài khoản học sinh do GV tạo).

### schools (từ BusinessOrganization)
| field | type | ghi chú |
|---|---|---|
| id | String | |
| name | String | tên trường |
| ownerUserId | String | school admin |
| subscriptionId | String unique | 1 trường ↔ 1 subscription |
| status | String | ACTIVE / INACTIVE |
| createdAt, updatedAt | LocalDateTime | |

### school_memberships (từ BusinessMembership)
| field | type | ghi chú |
|---|---|---|
| id | String | |
| schoolId | String indexed | |
| userId | String indexed | |
| role | String | SCHOOL_ADMIN / TEACHER / STUDENT |
| status | String | ACTIVE / INACTIVE |
| createdAt, updatedAt | | compound unique (schoolId,userId) |

### classes
| field | type | ghi chú |
|---|---|---|
| id | String | |
| schoolId | String indexed | |
| teacherId | String indexed | userId của GV chủ nhiệm |
| name | String | |
| description | String | |
| status | String | ACTIVE / ARCHIVED |
| createdAt, updatedAt | | |

### class_enrollments
| field | type | ghi chú |
|---|---|---|
| id | String | |
| classId | String indexed | |
| studentId | String indexed | userId của HS |
| status | String | ACTIVE / REMOVED |
| createdAt | | compound unique (classId,studentId) |

### assignments
| field | type | ghi chú |
|---|---|---|
| id | String | |
| classId | String indexed | |
| teacherId | String | |
| youtubeVideoId | String | trích từ URL |
| title | String | |
| description | String | |
| dueDate | LocalDateTime | tuỳ chọn |
| status | String | ACTIVE / CLOSED |
| createdAt | | |

### assignment_progress (mở rộng History)
| field | type | ghi chú |
|---|---|---|
| id | String | |
| assignmentId | String indexed | |
| studentId | String indexed | |
| youtubeVideoId | String | tiện cho extension |
| status | String | ASSIGNED / IN_PROGRESS / COMPLETED |
| watchedSeconds | Integer | tuỳ chọn |
| startedAt | LocalDateTime | |
| completedAt | LocalDateTime | |
| updatedAt | | compound unique (assignmentId,studentId) |

### evaluations
| field | type | ghi chú |
|---|---|---|
| id | String | |
| schoolId | String indexed | |
| classId | String | |
| studentId | String indexed | |
| teacherId | String | |
| score | Double | tuỳ chọn |
| comment | String | |
| createdAt | | |

> `histories` (có sẵn) tiếp tục ghi lượt xem thô (userId, youtubeVideoId, watchedAt); `assignment_progress` là lớp nghiệp vụ trên đó.

## API design

Tiền tố `/api/v1`. Tất cả yêu cầu JWT trừ auth công khai.

### Admin (`ADMIN`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/stats` | dashboard toàn hệ thống (mở rộng: thêm số trường/lớp/hoàn thành) |
| GET | `/admin/schools` | danh sách trường |
| PATCH | `/admin/schools/{id}/status` | khoá/mở trường |
| GET | `/admin/users` | danh sách user |
| PATCH | `/admin/users/{id}` | đổi trạng thái user |
| CRUD | `/service-packages` | quản lý gói (có sẵn) |
| GET | `/admin/subscriptions` | danh sách subscription (có sẵn) |

### School Admin (`SCHOOL_ADMIN`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/schools/me` | thông tin trường của tôi |
| GET | `/schools/me/members?role=TEACHER\|STUDENT` | DS thành viên theo role |
| POST | `/schools/me/teachers` | tạo GV `{fullName,email}` |
| PATCH | `/schools/me/members/{id}/status` | khoá/mở thành viên |
| DELETE | `/schools/me/members/{id}` | xoá thành viên |
| GET | `/schools/me/stats` | thống kê toàn trường |

### Teacher (`TEACHER`)
| Method | Path | Mô tả |
|---|---|---|
| GET/POST | `/classes` | danh sách / tạo lớp |
| GET | `/classes/{id}` | chi tiết lớp |
| PATCH | `/classes/{id}` | sửa/archive lớp |
| POST | `/schools/me/students` | tạo HS `{fullName,email}` (sinh mật khẩu tạm) |
| GET | `/classes/{id}/students` | HS trong lớp |
| POST | `/classes/{id}/students` | thêm HS vào lớp `{studentId}` |
| DELETE | `/classes/{id}/students/{studentId}` | gỡ HS khỏi lớp |
| GET/POST | `/classes/{id}/assignments` | DS / giao video `{youtubeUrl,title,dueDate?}` |
| GET | `/assignments/{id}/progress` | tiến độ theo assignment |
| GET | `/students/{studentId}/history` | lịch sử học của HS |
| POST | `/evaluations` | đánh giá `{studentId,classId,score?,comment}` |
| GET | `/classes/{id}/evaluations` | DS đánh giá của lớp |

### Student (`STUDENT`) — dùng bởi extension + web
| Method | Path | Mô tả |
|---|---|---|
| GET | `/assignments/my?status=` | video được giao cho tôi |
| POST | `/assignments/{id}/start` | đánh dấu bắt đầu (ASSIGNED→IN_PROGRESS) |
| POST | `/assignments/{id}/complete` | hoàn thành (→COMPLETED) |
| GET | `/me/history` | lịch sử học của tôi |

### Chuẩn response lỗi
Giữ pattern hiện tại: `ResponseEntity` + `Map.of("message", ...)`, mã 400/401/403/404 tương ứng. Không đổi convention để đồng nhất với `BusinessController`.

## Phân quyền (SecurityConfig)

Hiện `anyRequest().permitAll()` — cần siết:
```
/api/v1/auth/**            permitAll
/api/v1/service-packages/**GET permitAll, mutate ADMIN
/api/v1/payments/webhook   permitAll
/api/admin/**              hasRole ADMIN
/api/v1/schools/**         authenticated (kiểm role trong service)
/api/v1/classes/**         hasAnyRole TEACHER, SCHOOL_ADMIN
/api/v1/assignments/my, /me/history authenticated (STUDENT)
mọi cái còn lại            authenticated
```
Role check chi tiết (chủ sở hữu lớp, cùng trường) thực hiện ở service layer như `BusinessService` đang làm (`resolveManagedBusinessContext`).

## Tạo tài khoản học sinh (luồng đã chốt)

1. GV/School Admin gọi POST tạo HS với `{fullName, email}`.
2. Service kiểm tra quota (`maxAccounts`), email chưa tồn tại trong trường.
3. Sinh mật khẩu tạm ngẫu nhiên, `passwordHash = encode(temp)`, `role=STUDENT`, `isVerified=true`, `mustChangePassword=true`.
4. Tạo `User` + `SchoolMembership(role=STUDENT)`.
5. Gửi email chứa email đăng nhập + mật khẩu tạm (dùng `EmailService` có sẵn).
6. HS đăng nhập web → `auth-sync` đẩy token vào extension.

## Trích xuất youtubeVideoId
Parse URL các dạng: `watch?v=`, `youtu.be/`, `embed/`, `shorts/`. Nếu input đã là id 11 ký tự thì dùng trực tiếp. Không hợp lệ → 400.

## Frontend

- **Redux/services**: thêm `schoolService`, `classroomService`, `assignmentService`, `evaluationService` (theo mẫu `businessService.ts`).
- **Routes mới**: `/school` (school admin), `/teacher` (dashboard GV), `/teacher/classes/:id`, mở rộng `/admin`.
- **Component tái dùng**: `ConfirmModal`, layout admin có sẵn.
- **Student web**: trang `/my-lessons` liệt kê assignment + lịch sử (bản chính trên extension).

## Chrome Extension

- `popup.html/js`: thêm tab "Bài học được giao" gọi `GET /assignments/my`, render list; click → `chrome.tabs.create` mở YouTube video.
- `content.js`: giữ overlay animation; thêm nút "Hoàn thành bài học" gọi `POST /assignments/{id}/complete` (đọc token từ `chrome.storage.local.signifyAuthToken`).
- Tab "Lịch sử" gọi `GET /me/history`.
- `background.js`: helper fetch có gắn `Authorization: Bearer <token>`.

## Rủi ro & lưu ý
- Migration business→school: viết script/`CommandLineRunner` một lần, idempotent.
- Quota tính gộp GV+HS theo `maxAccounts`; cân nhắc đủ cho lớp học thực tế.
- Bảo mật: bật role-based security trước khi lên production (hiện đang mở).
- Mật khẩu tạm: bắt buộc đổi ở lần đầu để tránh rò rỉ qua email.


