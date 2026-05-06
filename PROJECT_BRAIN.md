# 🧠 PROJECT BRAIN (Ultra Aircon Platform)

Generated: 2026-04-25T10:33:42.204Z
Last Reviewed: 2026-04-19

---

# 🎯 PROJECT OVERVIEW

- Backend (NestJS) -> CORE
- Admin Dashboard (Next.js)
- Mobile / Technician App (Flutter)
- AI Platform (Python)
- Zalo / Facebook Bots

---

# 🧩 CURRENT STATE

## Backend → MATURE (CORE)
- Business logic là trung tâm hệ thống
- Backend local runtime và docker runtime đã chạy thật
- Auth production-ready đã chạy thật: login, refresh rotation, logout, session revoke, JWT Guard, Roles Guard
- PostgreSQL + Redis + NestJS là nền tảng chính
- Health endpoint chạy thật
- Core business flow Phase 3 đã có backend thật: orders, technicians, tracking, realtime socket
- Ownership của technician đã chuẩn hóa bằng technician.userId
- Realtime socket hoạt động với event technician_location_update

## Admin Dashboard → PHASE 4 DONE / MVP-READY
- Đã có login page thật trong app router
- Đã nối login frontend với backend auth thật
- Đã có API layer thống nhất ở apps/admin-dashboard/src/services/api.ts
- Đã có request interceptor gắn access token
- Đã có refresh flow cơ bản cho access token
- Đã fix route /login
- Đã fix root layout của app router
- Đã fix import path theo đúng cấu trúc thật
- Đã load được /global_map bằng dữ liệu thật từ backend
- Đã render được nền map OSM
- Đã hiển thị được Technician Detail và Technician List bằng dữ liệu thật
- Đã seed technician thật trong database
- Đã chốt auth guard sạch cho app router và pages router
- Đã test token fake -> redirect login
- Đã test no token -> redirect login
- Đã test logged-in user vào /login -> redirect /global_map
- Đã xác nhận technician movement realtime thật trên map
- Đã chuyển page ngoài MVP sang Coming Soon rõ ràng
- Đã build production thành công và start production thành công

## Mobile / Technician App → PHASE 5 DONE / PRODUCTION CORE
- Technician app đã chạy thật với backend
- Auth flow mobile hoạt động thật: login, persist, refresh, logout, session revoke
- Job list dùng dữ liệu thật từ backend
- Job detail screen production UI đã hoàn tất, không còn raw JSON
- Job lifecycle actions đã chạy thật: assigned -> in_progress -> completed
- Security response đã sạch: không lộ password / passwordHash / refreshTokenHash
- Dev seed/test data đã chốt cho admin, customer, technician, order lifecycle
- Manual tracking hoạt động thật
- Live tracking ON/OFF hoạt động thật
- Realtime movement mobile -> backend -> admin map đã test thật
- Phase 5 DONE theo production core

## AI Platform → EXPERIMENTAL
- Có nhiều service AI riêng
- Chủ yếu đang ở mức framework hoặc module thử nghiệm
- Chưa được khóa kiến trúc tích hợp chặt với backend core

## Bots (Zalo / Facebook) → VERY EARLY
- Chủ yếu mới ở webhook layer
- Chưa nên chứa business logic riêng
- Chỉ nên gọi backend khi bước sang giai đoạn tích hợp

---

# ⚠️ KNOWN ISSUES

- Monitoring/performance metric có lỗi timestamp.getTime ở một số log
- Một số response hiện còn lộ password hash trong nested relation, cần fix bảo mật sớm
- Cần seed/dev-data sạch cho 3 actor riêng biệt: customer, admin, technician
- Browser translation hoặc extension có thể gây hydration mismatch ở dev nếu tự dịch nội dung trang
- Mobile / Technician app chưa production-ready và chưa bám full contract thật sau Phase 4

---

# 🧭 MVP DEFINITION

## In Scope
- Backend
- Admin dashboard
- Technician app
- Mobile app

## Out of Scope For Now
- AI nâng cao
- Ecosystem
- Digital twin
- Universe-level features

---

# 🏗️ ARCHITECTURE RULES

- Backend là single source of truth cho business logic
- Không đặt business logic ở bot
- Dashboard chỉ hiển thị và thao tác qua backend API
- AI là lớp hỗ trợ, không thay thế backend core
- Auth phải đi qua session + revoke + guard, không dùng JWT stateless đơn thuần
- Ownership của technician phải đi qua technician.userId, không so sánh trực tiếp user.id với technician.id
- Khi sửa code phải bám đúng cấu trúc file thật của project
- Khi sửa file phải ưu tiên viết lại file hoàn chỉnh để copy
- Mọi thay đổi lớn phải cập nhật PROJECT_BRAIN.md

---

# 🚀 CURRENT PHASE

- Current: PHASE 6 — Tích hợp Zalo / Facebook đúng kiến trúc
- Next: PHASE 7 — Production hardening

---

# ✅ COMPLETED MILESTONES

## Phase 1 — Backend foundation
- Backend boot ổn định
- Health check hoạt động
- Redis + PostgreSQL + NestJS chạy ổn
- Đã tách env local và docker đủ để backend chạy thật
- Đã fix các lỗi runtime Docker và port/env cơ bản

## Phase 2 — Auth
- Register và login hoạt động
- Refresh rotation hoạt động
- Logout + session revoke hoạt động
- JWT Guard + Roles Guard hoạt động đúng
- Đã test 401 khi thiếu token
- Đã test 403 khi sai role
- Đã xác thực auth_sessions thật trong database
- Đã login thật bằng admin user seed

## Phase 3 — Orders + Technicians + Tracking
- Customer tạo order thành công
- Order được lưu đúng DB
- Admin assign technician thành công
- Technician xem được job của mình
- Technician cập nhật được location của mình
- Admin lấy được fallback tracking qua /technicians/locations
- Realtime socket hoạt động với event technician_location_update
- Status flow pending -> assigned -> in_progress -> completed hoạt động
- Đã fix ownership bug bằng technician.userId
- Đã fix cache invalidation cho technician availability

## Phase 4 — Admin Dashboard
- Đã audit admin-dashboard map flow
- Đã fix backend local runtime và docker runtime để backend boot ổn định
- Đã chuẩn hóa env local và docker đủ để backend chạy thật
- Đã fix login flow cho admin-dashboard
- Đã tạo login page trong app router
- Đã fix root layout của app router
- Đã fix import path theo đúng cấu trúc thật của admin-dashboard
- Đã dựng API layer thống nhất ở apps/admin-dashboard/src/services/api.ts
- Đã thêm request interceptor gắn access token
- Đã thêm refresh flow cơ bản cho access token
- Đã fix lỗi 401 do token/session bằng cách xác thực đúng auth_sessions
- Đã seed user admin thật và login thật qua backend
- Đã seed technician thật vào database
- Đã sửa technician.userId trỏ đúng sang user technician
- Đã làm global_map.tsx đọc dữ liệu thật từ backend
- Đã làm OSM map render nền bản đồ thật
- Đã làm Technician Detail và Technician List hiện dữ liệu thật
- Đã xác nhận /global_map load thành công bằng dữ liệu thật thay vì placeholder
- Đã chốt auth guard sạch cho dashboard
- Đã test no token -> redirect /login
- Đã test fake token -> redirect /login
- Đã test logged-in user vào /login -> redirect /global_map
- Đã xác nhận technician movement realtime thật trên map
- Đã chuyển page ngoài MVP sang Coming Soon rõ ràng
- Đã xác nhận build production và start production pass

## Phase 5 — Mobile / Technician app
- Technician app kết nối backend thật (không còn mock)
- Login mobile hoạt động với backend auth thật
- Access token được lưu và attach vào request
- Refresh token flow hoạt động
- Cold start vẫn giữ session
- Session revoke từ backend hoạt động
- Manual update location thành công (PUT /technicians/location)
- Live tracking ON/OFF hoạt động
- Geolocator lấy GPS thật từ emulator
- Backend nhận location update liên tục
- Admin global_map nhận và render realtime
- Marker technician di chuyển realtime trên map
- Route simulation bằng emulator hoạt động
- Realtime pipeline mobile -> backend -> admin đã xác nhận

---

# 📍 ROADMAP

- Phase 0 — Chuẩn hóa PROJECT_BRAIN.md
- Phase 1 — Ổn định backend foundation
- Phase 2 — Chuẩn hóa auth
- Phase 3 — Orders + Technicians + Tracking
- Phase 4 — Dọn và sync Admin Dashboard
- Phase 5 — Hoàn thiện Mobile / Technician app
- Phase 6 — Tích hợp Zalo / Facebook đúng kiến trúc
- Phase 5.5 — Customer App production core
- Phase 7 — Production hardening

---

# ✅ NEXT ACTIONS

- Bắt đầu Phase 6 — Tích hợp Zalo / Facebook đúng kiến trúc
- Audit source thật của chatbot / bot / webhook hiện có trước khi sửa
- Không đưa business logic vào bot
- Bot chỉ là channel adapter
- Backend là single source of truth cho order/customer/technician/auth
- Zalo/Facebook adapter chỉ nhận message/event và gọi backend API thật
- Không gọi DB trực tiếp từ bot
- Không mock business data
- Không hardcode secret/token production
- Thiết kế webhook foundation sạch
- Có error handling, timeout, logging sạch
- Test manual thật: webhook -> adapter -> backend API -> response
- Không phá Phase 4 / Phase 5 / Phase 5.5
- Cuối Phase 6 phải cập nhật PROJECT_BRAIN.md và project-brain.config.json

---

# 🚀 API MAP

- **GET** `/ai/health` → backend/src/modules/ai/ai.controller.ts
- **POST** `/auth/login` → backend/src/modules/auth/api/controllers/auth.controller.ts
- **POST** `/auth/logout` → backend/src/modules/auth/api/controllers/auth.controller.ts
- **POST** `/auth/logout-all` → backend/src/modules/auth/api/controllers/auth.controller.ts
- **POST** `/auth/refresh` → backend/src/modules/auth/api/controllers/auth.controller.ts
- **POST** `/auth/register` → backend/src/modules/auth/api/controllers/auth.controller.ts
- **GET** `/health` → backend/src/health/health.controller.ts
- **GET** `/health/detailed` → backend/src/health/health.controller.ts
- **POST** `/maps/update` → backend/src/modules/maps/location.controller.ts
- **GET** `/orders` → backend/src/modules/orders/orders.controller.ts
- **POST** `/orders` → backend/src/modules/orders/orders.controller.ts
- **GET** `/orders/:id` → backend/src/modules/orders/orders.controller.ts
- **PUT** `/orders/:id/assign/:technicianId` → backend/src/modules/orders/orders.controller.ts
- **PUT** `/orders/:id/status` → backend/src/modules/orders/orders.controller.ts
- **GET** `/orders/customer/:customerId` → backend/src/modules/orders/orders.controller.ts
- **GET** `/orders/stats` → backend/src/modules/orders/orders.controller.ts
- **GET** `/orders/technician/:technicianId` → backend/src/modules/orders/orders.controller.ts
- **GET** `/reviews` → backend/src/modules/reviews/reviews.controller.ts
- **POST** `/reviews` → backend/src/modules/reviews/reviews.controller.ts
- **GET** `/technicians` → backend/src/modules/technicians/technicians.controller.ts
- **POST** `/technicians` → backend/src/modules/technicians/technicians.controller.ts
- **GET** `/technicians/:id` → backend/src/modules/technicians/technicians.controller.ts
- **GET** `/technicians/available` → backend/src/modules/technicians/technicians.controller.ts
- **PUT** `/technicians/location/:id` → backend/src/modules/technicians/technicians.controller.ts
- **GET** `/technicians/locations` → backend/src/modules/technicians/technicians.controller.ts
- **GET** `/technicians/nearby` → backend/src/modules/technicians/technicians.controller.ts
- **GET** `/tracking` → backend/src/modules/realtime/tracking.controller.ts
- **POST** `/tracking/update` → backend/src/modules/realtime/tracking.controller.ts
- **GET** `/twin` → backend/src/modules/digital_twin/digital_twin.controller.ts
- **GET** `/users` → backend/src/modules/users/users.controller.ts
- **POST** `/users` → backend/src/modules/users/users.controller.ts
- **DELETE** `/users/:id` → backend/src/modules/users/users.controller.ts
- **GET** `/users/:id` → backend/src/modules/users/users.controller.ts
- **PUT** `/users/:id` → backend/src/modules/users/users.controller.ts

---

# 📊 SUMMARY

- Total APIs: 34

- Current stable milestone: Phase 3 DONE

---
