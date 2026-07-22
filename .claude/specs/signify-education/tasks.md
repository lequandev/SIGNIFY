# Signify for Education — Implementation Plan

## Giai đoạn 1 — Nền tảng (School + Roles + Migration)

- [ ] 1. Thêm role & field `mustChangePassword` vào `User`, cập nhật `DataInitializer` (giữ admin mặc định)
  - _Requirements: 1.1, 6.4_
- [ ] 2. Refactor module `business` → `school`: `School`, `SchoolMembership`, repo, `SchoolService` (giữ logic quota/context)
  - _Requirements: 2.1, 2.3, 7.2_
- [ ] 3. Hỗ trợ `planType = education` trong `ServicePackage`/`DataSeeder`; provision School khi subscription education kích hoạt
  - _Requirements: 2.1, 7.3_
- [ ] 4. Viết `CommandLineRunner` migration business→school (idempotent), map role cũ→mới
  - _Requirements: 7.1, 7.2_
- [ ] 5. Siết `SecurityConfig` theo ma trận phân quyền; thêm role check trong service
  - _Requirements: 6.1, 6.2, 6.3_

## Giai đoạn 2 — Lớp học & Học sinh

- [ ] 6. Model + repo `Classroom`, `ClassEnrollment`
  - _Requirements: 3.1, 3.4_
- [ ] 7. `ClassroomService` + `ClassroomController`: CRUD lớp (kiểm tra GV sở hữu, cùng trường)
  - _Requirements: 3.1, 3.5, 3.6_
- [ ] 8. API tạo tài khoản học sinh trực tiếp (sinh mật khẩu tạm + gửi email); tạo giáo viên (School Admin)
  - _Requirements: 2.2, 3.2, 3.3, 6.4_
- [ ] 9. API thêm/gỡ học sinh vào lớp; danh sách HS theo lớp
  - _Requirements: 3.4, 3.5_

## Giai đoạn 3 — Giao video & Tiến độ

- [ ] 10. Util trích xuất `youtubeVideoId` từ URL + unit test
  - _Requirements: 4.2_
- [ ] 11. Model + repo `Assignment`, `AssignmentProgress`
  - _Requirements: 4.1, 4.3_
- [ ] 12. `AssignmentService` + `AssignmentController`: giao video cho lớp, tạo progress `ASSIGNED` cho từng HS
  - _Requirements: 4.1, 4.2, 4.3_
- [ ] 13. API học sinh: `GET /assignments/my`, `POST /start`, `POST /complete` (ghi `histories` + cập nhật progress)
  - _Requirements: 5.2, 5.5_
- [ ] 14. API lịch sử: `GET /me/history` (HS), `GET /students/{id}/history` (GV)
  - _Requirements: 4.5, 5.6_
- [ ] 15. API tiến độ theo assignment cho giáo viên
  - _Requirements: 4.4_

## Giai đoạn 4 — Đánh giá & Dashboard

- [ ] 16. Model + API `Evaluation` (tạo, liệt kê theo lớp)
  - _Requirements: 4.6_
- [ ] 17. Mở rộng `/admin/stats` + `/schools/me/stats` (số trường/lớp/HS/tỷ lệ hoàn thành)
  - _Requirements: 1.6, 2.5_
- [ ] 18. Admin: API quản lý trường (`GET /admin/schools`, đổi trạng thái)
  - _Requirements: 1.2_

## Giai đoạn 5 — Frontend

- [ ] 19. Services FE: `schoolService`, `classroomService`, `assignmentService`, `evaluationService`
  - _Requirements: 2._, 3._, 4._
- [ ] 20. Admin UI: quản lý trường + dashboard mở rộng (tái dùng AdminLayout)
  - _Requirements: 1.2, 1.6_
- [ ] 21. School portal `/school`: quản lý GV/HS, thống kê trường
  - _Requirements: 2.2, 2.4, 2.5_
- [ ] 22. Teacher portal `/teacher`: tạo lớp, thêm HS, giao video, bảng tiến độ, đánh giá
  - _Requirements: 3.1, 3.4, 4.1, 4.4, 4.6_
- [ ] 23. Student web `/my-lessons`: video được giao + lịch sử
  - _Requirements: 5.2, 5.6_

## Giai đoạn 6 — Chrome Extension

- [ ] 24. Helper fetch có auth trong `background.js`; đọc token từ `chrome.storage.local`
  - _Requirements: 5.1, 5.7_
- [ ] 25. Popup tab "Bài học được giao": list `GET /assignments/my`, click mở YouTube
  - _Requirements: 5.2, 5.3_
- [ ] 26. `content.js`: nút "Hoàn thành bài học" → `POST /assignments/{id}/complete`
  - _Requirements: 5.4, 5.5_
- [ ] 27. Popup tab "Lịch sử học tập": `GET /me/history`
  - _Requirements: 5.6_

## Giai đoạn 7 — Kiểm thử & hoàn thiện

- [ ] 28. Unit test service (quota, phân quyền, trích xuất videoId, progress)
  - _Requirements: 6.2, 6.3, 4.2_
- [ ] 29. Test end-to-end 1 luồng: GV giao video → HS nhận trên extension → xem → hoàn thành → GV thấy tiến độ + đánh giá
  - _Requirements: 4._, 5._
- [ ] 30. Rà soát bảo mật: JWT, role, cô lập dữ liệu theo trường, mật khẩu tạm
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
```
