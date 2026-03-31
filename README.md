# HomeFix - Hệ thống đặt dịch vụ tiện ích và sửa chữa gia đình trực tuyến

## Giới thiệu

HomeFix là nền tảng kết nối khách hàng với kỹ thuật viên chuyên nghiệp cho các dịch vụ sửa chữa, bảo trì gia đình (điện, nước, điều hòa, vệ sinh...). Hệ thống hỗ trợ 3 vai trò: **Khách hàng** (đặt dịch vụ), **Kỹ thuật viên** (nhận và thực hiện công việc), **Quản trị viên** (quản lý toàn bộ hệ thống).

**Production URL:** https://homefix.ink

---

## Mục lục

1. [Kiến trúc tổng thể](#1-kiến-trúc-tổng-thể)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Cài đặt và chạy](#3-cài-đặt-và-chạy)
4. [Tài khoản demo](#4-tài-khoản-demo)
5. [Cấu trúc thư mục](#5-cấu-trúc-thư-mục)
6. [Backend - Chi tiết module](#6-backend---chi-tiết-module)
7. [Frontend - Chi tiết module](#7-frontend---chi-tiết-module)
8. [Luồng dữ liệu chính](#8-luồng-dữ-liệu-chính)
9. [API Reference](#9-api-reference)
10. [Sơ đồ Entity Relationship](#10-sơ-đồ-entity-relationship)
11. [Hệ thống phân quyền](#11-hệ-thống-phân-quyền)
12. [Checklist đánh giá](#12-checklist-đánh-giá)
13. [Tác giả](#13-tác-giả)

---

## 1. Kiến trúc tổng thể

```
┌─────────────┐     HTTPS/443      ┌──────────────┐    HTTP/8080    ┌──────────────┐
│   Browser   │ ◄──────────────► │   Nginx      │ ◄────────────► │  Spring Boot │
│  (React SPA)│                    │  (Frontend)  │   /api/*       │  (Backend)   │
└─────────────┘                    └──────────────┘                └──────┬───────┘
                                                                          │
                                        WebSocket /ws-chat ◄──────────────┤
                                                                          │ JPA/Hibernate
                                                                   ┌──────▼───────┐
                                                                   │   MySQL 8.0  │
                                                                   │  (Docker)    │
                                                                   └──────────────┘
```

**Triển khai Production (Docker Compose):**
- `homefix-mysql` — MySQL 8.0 (port 3306)
- `homefix-backend` — Spring Boot JAR (port 8080, max 768MB RAM)
- `homefix-frontend` — Nginx + React build (port 80/443 SSL)

---

## 2. Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|------------|-----------|----------|
| Java | 17 | Ngôn ngữ chính |
| Spring Boot | 3.2.2 | Framework |
| Spring Security | 6.2.1 | Xác thực JWT + OAuth2 |
| Spring Data JPA | 3.2.x | ORM (Hibernate 6.4) |
| MySQL | 8.0 | Database chính |
| Apache POI | 5.2.5 | Xuất file Excel |
| STOMP/WebSocket | — | Chat realtime |
| JavaMail | — | Gửi email |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|------------|-----------|----------|
| React | 18.2 | UI framework |
| Vite | 5.1 | Build tool |
| Ant Design | 5.14 | Component library |
| Tailwind CSS | 3.4 | Utility CSS |
| Recharts | 3.7 | Biểu đồ thống kê |
| Axios | 1.6 | HTTP client |
| STOMP.js + SockJS | 7.1 / 1.6 | WebSocket client |
| Lucide React | 0.330 | Icon library |
| Day.js | 1.11 | Xử lý ngày |

---

## 3. Cài đặt và chạy

### Development (Local)

```bash
# Backend
cd backend
./mvnw spring-boot:run
# → http://localhost:8080

# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Production (Docker)

```bash
docker compose up -d --build
# MySQL: 3306, Backend: 8080, Frontend: 80/443
```

Rebuild sau khi thay đổi code:
```bash
git pull origin main
docker compose up -d --build backend frontend
```

---

## 4. Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| Admin | `admin@homefix.com` | `123456` |
| Kỹ thuật viên 1 | `tech1@homefix.com` | `123456` |
| Kỹ thuật viên 2 | `tech2@homefix.com` | `123456` |
| Khách hàng | `customer@homefix.com` | `123456` |

> Tài khoản được tạo tự động bởi `DataSeeder` khi khởi động lần đầu.

---

## 5. Cấu trúc thư mục

```
HomeFix/
├── backend/
│   └── src/main/java/com/homefix/
│       ├── common/          # Enum: Role, BookingStatus, TechnicianType...
│       ├── config/          # SecurityConfig, WebSocketConfig, DataSeeder...
│       ├── controller/      # REST API controllers (13 controllers)
│       ├── dto/             # Data Transfer Objects
│       ├── entity/          # JPA Entities (19 entities)
│       ├── repository/      # Spring Data JPA repositories (18 repos)
│       ├── security/        # JWT filter, OAuth2 handler, Rate limiter
│       └── service/         # Business logic services (14 services)
├── frontend/
│   └── src/
│       ├── components/      # Navbar, Footer, NotificationBell, admin/*
│       ├── context/         # AuthContext, ThemeContext
│       ├── hooks/           # useContent
│       ├── pages/           # 25 page components
│       ├── services/        # api.js (Axios instance)
│       ├── App.jsx          # Router + Guards
│       └── index.css        # Tailwind + Dark mode overrides
└── docker-compose.yml
```

---

## 6. Backend - Chi tiết module

### 6.1 Entities (19 bảng)

| Entity | Bảng DB | Mô tả | Quan hệ chính |
|--------|---------|-------|----------------|
| **User** | `users` | Tài khoản (cả 3 vai trò) + thông tin kỹ thuật viên | ManyToMany → ServiceCategory, ManyToOne → supervisingTechnician |
| **Booking** | `bookings` | Đơn đặt dịch vụ | ManyToOne → User(customer), User(technician), ServicePackage, Coupon; ManyToMany → assistants |
| **ServiceCategory** | `service_categories` | Danh mục dịch vụ (Điện, Nước...) | OneToMany → ServicePackage |
| **ServicePackage** | `service_packages` | Gói dịch vụ cụ thể | ManyToOne → ServiceCategory; OneToMany → ServiceImage |
| **ServiceImage** | `service_images` | Ảnh phụ của dịch vụ | ManyToOne → ServicePackage |
| **Review** | `reviews` | Đánh giá sau hoàn thành | OneToOne → Booking |
| **Notification** | `notifications` | Thông báo trong app | ManyToOne → User |
| **Coupon** | `coupons` | Mã giảm giá | Standalone |
| **WithdrawalRequest** | `withdrawal_requests` | Yêu cầu rút tiền | ManyToOne → User(technician) |
| **ExportLog** | `export_logs` | Nhật ký xuất Excel | Standalone (denormalized) |
| **Conversation** | `conversations` | Nhóm chat | OneToMany → ConversationParticipant |
| **ConversationMessage** | `conversation_messages` | Tin nhắn chat | ManyToOne → Conversation, User(sender) |
| **ConversationParticipant** | `conversation_participants` | Thành viên nhóm chat | ManyToOne → Conversation, User |
| **MessageAttachment** | `message_attachments` | File đính kèm tin nhắn | ManyToOne → ConversationMessage |
| **BookingChatMessage** | `booking_chat_messages` | Chat tạm theo đơn (tự xóa) | ManyToOne → Booking, User |
| **SupportTicket** | `support_tickets` | Ticket hỗ trợ | ManyToOne → Booking, User(customer), User(technician) |
| **SupportTicketMessage** | `support_ticket_messages` | Tin nhắn trong ticket | ManyToOne → SupportTicket, User |
| **TechnicianInteractionLog** | `technician_interaction_logs` | Log tương tác KTV | ManyToOne → User(technician), User(customer), Booking |
| **PasswordResetToken** | `password_reset_tokens` | Token đặt lại mật khẩu | ManyToOne → User |
| **WebsiteContent** | `website_contents` | Nội dung CMS động | Standalone |

### 6.2 Enums

| Enum | Giá trị |
|------|---------|
| `Role` | CUSTOMER, TECHNICIAN, ADMIN |
| `BookingStatus` | PENDING → CONFIRMED → ASSIGNED → ARRIVED → WORKING → IN_PROGRESS → COMPLETED / CANCELLED / DECLINED |
| `TechnicianType` | MAIN (thợ chính), ASSISTANT (thợ phụ) |
| `TechnicianApprovalStatus` | NOT_REQUIRED, PENDING, APPROVED, REJECTED |
| `WithdrawalStatus` | PENDING, APPROVED, REJECTED |
| `TicketStatus` | OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED |
| `TicketPriority` | LOW, MEDIUM, HIGH, URGENT |
| `TicketCategory` | SERVICE_ISSUE, PAYMENT_ISSUE, SCHEDULE_CHANGE, CUSTOMER_COMPLAINT, TECHNICAL_SUPPORT |

### 6.3 Services (Business Logic)

| Service | Chức năng chính |
|---------|----------------|
| **AuthService** | Đăng ký, đăng nhập (JWT), quên/đặt lại mật khẩu qua email |
| **UserService** | Quản lý hồ sơ, duyệt KTV, ví tiền, dashboard metrics, tự động nâng cấp thợ phụ → chính (scheduled) |
| **BookingService** | Tạo đơn, áp coupon, tính commission (85% thợ / 15% nền tảng), phân công, cập nhật trạng thái, hủy đơn |
| **TechnicianMatchingService** | Matching tự động theo danh mục + lịch làm việc + khu vực, kiểm tra eligibility |
| **ReviewService** | Đánh giá theo đơn, review qua token (không cần đăng nhập) |
| **NotificationService** | CRUD thông báo, đánh dấu đã đọc |
| **HomeService** | Catalog dịch vụ: CRUD category + package, tìm kiếm phân trang |
| **CouponService** | CRUD mã giảm giá, validate trước khi áp dụng |
| **WithdrawalService** | Tạo yêu cầu rút tiền (trừ ví), admin duyệt/từ chối |
| **ExcelExportService** | Xuất Excel (đơn hàng, người dùng, doanh thu) + tracking log |
| **ChatService** | Chat nhóm realtime (STOMP/WebSocket), tìm kiếm tin nhắn, đính kèm file |
| **TechnicianEngagementService** | Leaderboard, analytics, alerts, ticket hỗ trợ, chat booking tạm |
| **EmailService** | Email HTML: reset password, xác nhận đặt lịch, hoàn thành đơn |
| **FileStorageService** | Upload/download file vào thư mục `uploads/` |

---

## 7. Frontend - Chi tiết module

### 7.1 Routing (App.jsx)

| Route | Guard | Trang | Mô tả |
|-------|-------|-------|-------|
| `/` | — | Home | Landing page, dịch vụ nổi bật |
| `/login` | — | Login | Đăng nhập (email + Google OAuth) |
| `/register` | — | Register | Đăng ký tài khoản |
| `/forgot-password` | — | ForgotPassword | Yêu cầu reset mật khẩu |
| `/reset-password` | — | ResetPassword | Đặt lại mật khẩu (query `?token=`) |
| `/services` | — | ServiceList | Danh sách tất cả dịch vụ |
| `/services/:id` | — | ServiceDetailPage | Chi tiết dịch vụ + đánh giá |
| `/about` | — | About | Giới thiệu công ty |
| `/contact` | — | Contact | Liên hệ |
| `/booking/:serviceId` | PrivateRoute | BookingPage | Đặt lịch dịch vụ |
| `/payment/gateway` | PrivateRoute | PaymentGateway | Thanh toán mô phỏng |
| `/profile` | PrivateRoute | ProfilePage | Hồ sơ khách hàng |
| `/history` | PrivateRoute | OrderHistory | Lịch sử đặt lịch |
| `/messages` | PrivateRoute | MessagesPage | Chat realtime |
| `/dashboard` | PrivateRoute | Dashboard | Hub chính (tabs theo vai trò) |
| `/review/:bookingId` | — | ReviewPage | Đánh giá qua token |
| `/oauth2/redirect` | — | OAuth2Redirect | Callback Google OAuth |
| `/technician/dashboard` | RoleRoute[TECH] | TechnicianDashboard | Bảng công việc KTV |
| `/technician/profile` | RoleRoute[TECH] | TechnicianProfilePage | Hồ sơ KTV |
| `/technician/wallet` | RoleRoute[TECH] | TechnicianWallet | Ví KTV |
| `/admin/dispatch` | RoleRoute[ADMIN] | AdminDispatch | Điều phối đơn |
| `/admin/categories` | RoleRoute[ADMIN] | AdminCategoryManager | Quản lý danh mục |
| `/admin/services` | RoleRoute[ADMIN] | AdminServiceManager | Quản lý dịch vụ |
| `/admin/users` | RoleRoute[ADMIN] | AdminUserManager | Quản lý người dùng |
| `/admin/coupons` | RoleRoute[ADMIN] | AdminCouponManager | Quản lý mã giảm giá |

### 7.2 Context Providers

| Context | State | Chức năng |
|---------|-------|-----------|
| **AuthContext** | `user`, `loading` | `login()`, `register()`, `logout()`, `updateUser()`, `refreshUserProfile()`. Lưu JWT + user vào localStorage |
| **ThemeContext** | `darkMode` | `toggleDarkMode()`. Lưu preference vào localStorage, toggle class `dark` trên `<html>` |

### 7.3 Dashboard Hub (`/dashboard`)

Dashboard là hub chính, hiển thị tabs khác nhau tùy vai trò:

**Admin (8 tabs - sidebar trái):**
1. Thống kê (AdminCharts — biểu đồ doanh thu, trạng thái đơn, top dịch vụ)
2. Phân công (AdminDispatch — bảng tất cả đơn + filter)
3. Danh mục (AdminCategoryManager)
4. Dịch vụ (AdminServiceManager)
5. Mã giảm giá (AdminCouponManager)
6. Người dùng (AdminUserManager)
7. Rút tiền (AdminWithdrawals — duyệt yêu cầu rút tiền KTV)
8. Xuất báo cáo (AdminExportStats — xuất Excel + biểu đồ thống kê)

**Kỹ thuật viên (4 tabs - top):**
1. Công việc (TechnicianDashboard)
2. Ví KTV (TechnicianWallet)
3. Lịch sử đặt lịch (OrderHistory)
4. Tin nhắn (→ redirect MessagesPage)

**Khách hàng (2 tabs - top):**
1. Lịch sử đặt lịch (OrderHistory)
2. Tin nhắn (→ redirect MessagesPage)

---

## 8. Luồng dữ liệu chính

### 8.1 Đặt dịch vụ (Customer Flow)

```
Customer chọn dịch vụ (/services/:id)
    │
    ▼
BookingPage: chọn ngày/giờ, địa chỉ, coupon, phương thức thanh toán
    │
    ▼
POST /api/bookings → BookingService.createBooking()
    ├── Validate coupon (nếu có) → tính giảm giá
    ├── Tính totalPrice, technicianEarning (85%), platformProfit (15%)
    ├── Tạo Booking (status=PENDING)
    ├── Tạo Notification cho customer
    └── Return BookingDto
    │
    ▼
PaymentGateway: mô phỏng thanh toán
    │
    ▼
POST /api/payment/confirm → status=CONFIRMED
    │
    ▼
Hệ thống matching tự động:
    ├── TechnicianMatchingService tìm KTV phù hợp (category + lịch + khu vực)
    └── KTV thấy đơn ở "Đơn mở" → POST /bookings/:id/claim → status=ASSIGNED
    │
    ▼
KTV cập nhật trạng thái:
    ASSIGNED → nhận việc → IN_PROGRESS → ARRIVED → WORKING → COMPLETED
    │
    ▼
Hoàn thành: technicianEarning → cộng vào walletBalance KTV
    │
    ▼
Gửi email + notification cho customer
    │
    ▼
Customer đánh giá qua token link
```

### 8.2 Rút tiền (Technician → Admin)

```
KTV vào Ví (/technician/wallet)
    │
    ▼
POST /api/withdrawals {amount} → trừ walletBalance, tạo WithdrawalRequest(PENDING)
    │
    ▼
Admin vào Dashboard > tab "Rút tiền"
    │
    ▼
POST /api/withdrawals/:id/process {approved, adminNote}
    ├── APPROVED: KTV nhận tiền qua ngân hàng đã liên kết
    └── REJECTED: hoàn lại walletBalance cho KTV
```

### 8.3 Chat Realtime

```
User mở /messages
    │
    ▼
SockJS connect → /ws-chat (JWT auth trên STOMP CONNECT)
    │
    ▼
GET /api/chat/conversations → danh sách cuộc trò chuyện
    │
    ▼
Gửi tin nhắn: STOMP /app/chat.send → ChatService → broadcast /topic/conversation.{id}
    │
    ▼
Typing indicator: STOMP /app/chat.typing → broadcast /topic/conversation.{id}.typing
```

### 8.4 Xuất Excel (Admin)

```
Admin vào Dashboard > tab "Xuất báo cáo"
    │
    ▼
Click "Xuất" (Đơn hàng / Người dùng / Doanh thu)
    │
    ▼
GET /api/admin/export/bookings (responseType: blob)
    ├── ExcelExportService: query DB → tạo XLSX (Apache POI)
    ├── Ghi ExportLog (userId, fileSize, rowCount, durationMs)
    └── Return byte[] → browser download
    │
    ▼
Biểu đồ thống kê tự cập nhật (GET /api/admin/export/statistics)
```

---

## 9. API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| POST | `/api/auth/register` | Public | Đăng ký tài khoản |
| POST | `/api/auth/login` | Public | Đăng nhập, nhận JWT |
| POST | `/api/auth/forgot-password` | Public | Gửi email reset |
| POST | `/api/auth/reset-password` | Public | Đặt lại mật khẩu |

### Users (`/api/users`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| GET | `/api/users` | Admin | Danh sách tất cả users |
| GET | `/api/users/profile` | Auth | Lấy profile hiện tại |
| PUT | `/api/users/profile` | Auth | Cập nhật profile |
| GET | `/api/users/technicians` | Auth | Danh sách KTV |
| PUT | `/api/users/technician/profile` | Auth | Cập nhật hồ sơ KTV |
| GET | `/api/users/technician/dashboard` | Auth | Metrics KTV |
| GET | `/api/users/technician/wallet` | Auth | Thông tin ví + thu nhập |
| GET | `/api/users/technician/history` | Auth | Lịch sử công việc |
| PUT | `/api/users/technician/bank-info` | Technician | Cập nhật ngân hàng |
| POST | `/api/users/change-password` | Auth | Đổi mật khẩu |

### Admin Users (`/api/admin/users`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| GET | `/api/admin/users` | Admin | Danh sách users (admin view) |
| PATCH | `/api/admin/users/:id/role` | Admin | Thay đổi vai trò |
| PATCH | `/api/admin/users/:id/technician-approval` | Admin | Duyệt/từ chối KTV |

### Bookings (`/api/bookings`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| POST | `/api/bookings` | Auth | Tạo đơn đặt dịch vụ |
| GET | `/api/bookings/my-bookings` | Auth | Đơn hàng của tôi |
| GET | `/api/bookings/all` | Admin | Tất cả đơn hàng |
| GET | `/api/bookings/available` | Auth | Đơn mở cho KTV nhận |
| PATCH | `/api/bookings/:id/status` | Admin/Tech | Cập nhật trạng thái |
| POST | `/api/bookings/:id/claim` | Auth | KTV nhận đơn |
| POST | `/api/bookings/:id/technician-response` | Auth | KTV chấp nhận/từ chối |
| POST | `/api/bookings/:id/assistants` | Auth | Thêm thợ phụ |
| POST | `/api/bookings/:id/cancel` | Auth | Hủy đơn |

### Services (`/api/services`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| GET | `/api/services/categories` | Public | Danh mục dịch vụ |
| GET | `/api/services/packages` | Public | Tất cả gói dịch vụ |
| GET | `/api/services/packages/:id` | Public | Chi tiết gói dịch vụ |
| POST | `/api/services/packages` | Public* | Tạo gói dịch vụ |
| PUT | `/api/services/packages/:id` | Public* | Cập nhật gói dịch vụ |

> *Lưu ý: `/api/services/**` hiện cho phép tất cả HTTP methods ở SecurityConfig. Nên thêm `@PreAuthorize` cho POST/PUT/DELETE.*

### Coupons (`/api/coupons`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| GET | `/api/coupons` | Public | Danh sách mã giảm giá |
| POST | `/api/coupons` | Admin | Tạo mã giảm giá |
| PUT | `/api/coupons/:id` | Admin | Cập nhật mã |
| DELETE | `/api/coupons/:id` | Admin | Xóa mã |

### Withdrawals (`/api/withdrawals`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| POST | `/api/withdrawals` | Technician | Tạo yêu cầu rút tiền |
| GET | `/api/withdrawals/my` | Technician | Lịch sử rút tiền |
| GET | `/api/withdrawals/all` | Admin | Tất cả yêu cầu |
| POST | `/api/withdrawals/:id/process` | Admin | Duyệt/từ chối |

### Export (`/api/admin/export`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| GET | `/api/admin/export/bookings` | Admin | Download Excel đơn hàng |
| GET | `/api/admin/export/users` | Admin | Download Excel users |
| GET | `/api/admin/export/revenue` | Admin | Download Excel doanh thu |
| GET | `/api/admin/export/statistics` | Admin | Thống kê xuất Excel (JSON) |
| GET | `/api/admin/export/recent` | Admin | Lịch sử xuất gần đây |

### Chat (`/api/chat`)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| GET | `/api/chat/conversations` | Auth | Danh sách cuộc trò chuyện |
| POST | `/api/chat/conversations` | Auth | Tạo cuộc trò chuyện |
| GET | `/api/chat/conversations/:id/messages` | Auth | Tin nhắn (phân trang) |
| POST | `/api/chat/messages` | Auth | Gửi tin nhắn (REST) |
| GET | `/api/chat/users` | Auth | Tìm kiếm user để chat |

### Khác
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| GET | `/api/statistics/top-services` | Auth | Top dịch vụ phổ biến |
| GET | `/api/statistics/revenue` | Auth | Doanh thu theo tháng |
| GET | `/api/statistics/order-status` | Auth | Thống kê trạng thái đơn |
| GET | `/api/notifications` | Auth | Thông báo của tôi |
| GET | `/api/content/:section` | Public | Nội dung CMS |
| POST | `/api/files/upload` | Public | Upload file |
| POST | `/api/reviews` | Auth | Tạo đánh giá |
| POST | `/api/reviews/by-token/:token` | Public | Đánh giá qua link |

---

## 10. Sơ đồ Entity Relationship

```
User ─────┬──── 1:N ────► Booking (as customer)
          ├──── 1:N ────► Booking (as technician)
          ├──── M:N ────► Booking (as assistant)
          ├──── M:N ────► ServiceCategory (technician_categories)
          ├──── 1:N ────► WithdrawalRequest
          ├──── 1:N ────► Notification
          ├──── 1:N ────► Review (via Booking)
          ├──── 1:N ────► SupportTicket
          ├──── 1:1 ────► User (supervisingTechnician)
          └──── 1:N ────► ConversationParticipant

ServiceCategory ──── 1:N ────► ServicePackage ──── 1:N ────► ServiceImage

Booking ──── 1:1 ────► Review
        ──── N:1 ────► Coupon
        ──── N:1 ────► ServicePackage
        ──── 1:N ────► BookingChatMessage
        ──── 1:N ────► SupportTicket

Conversation ──── 1:N ────► ConversationParticipant
             ──── 1:N ────► ConversationMessage ──── 1:N ────► MessageAttachment
```

---

## 11. Hệ thống phân quyền

### SecurityConfig Rules (thứ tự ưu tiên)

```
Public (không cần đăng nhập):
  /api/auth/**
  /api/services/**
  /api/content/**
  /api/files/**
  /api/reviews/by-token/**
  GET /api/coupons
  /ws-chat/**

Admin only:
  /api/admin/**
  /api/bookings/*/assign
  POST /api/coupons

Technician + Admin:
  /api/technician/**
  /api/bookings/*/status

Authenticated (bất kỳ role):
  Mọi request còn lại
```

### JWT Flow
1. Client gửi `POST /api/auth/login` → nhận `token` (HS256, expiry từ config)
2. Mỗi request gửi header `Authorization: Bearer <token>`
3. `JwtAuthenticationFilter` extract + validate → set `SecurityContext`
4. `@PreAuthorize("hasRole('...')")` kiểm tra role cụ thể

### OAuth2 Google Flow
1. Browser redirect → `/oauth2/authorization/google`
2. Google callback → `OAuth2AuthenticationSuccessHandler`
3. Find/create User (role=CUSTOMER) → generate JWT
4. Redirect → `https://homefix.ink/oauth2/redirect?token=<jwt>`
5. Frontend lưu token vào localStorage

---

## 12. Checklist đánh giá

### Kiến trúc
- [x] Tách biệt Backend (Spring Boot) / Frontend (React SPA)
- [x] RESTful API + WebSocket cho realtime
- [x] Docker Compose cho deployment
- [x] Phân quyền 3 vai trò (RBAC)
- [x] JWT stateless authentication

### Tính năng nghiệp vụ
- [x] Đăng ký/Đăng nhập (JWT + Google OAuth2)
- [x] Quên/đặt lại mật khẩu qua email
- [x] Catalog dịch vụ: CRUD danh mục + gói dịch vụ + hình ảnh
- [x] Đặt lịch + mã giảm giá + thanh toán mô phỏng
- [x] Phân công KTV tự động theo danh mục/lịch/khu vực
- [x] Hệ thống thợ chính/thợ phụ + tự động nâng cấp
- [x] Cập nhật trạng thái đơn (8 trạng thái)
- [x] Tính commission tự động (85% KTV / 15% nền tảng)
- [x] Ví KTV + rút tiền + admin duyệt
- [x] Đánh giá dịch vụ (đăng nhập + token link)
- [x] Chat realtime (WebSocket/STOMP)
- [x] Thông báo trong app
- [x] Email xác nhận đặt lịch + hoàn thành
- [x] Nội dung website động (CMS)
- [x] Xuất báo cáo Excel + biểu đồ thống kê
- [x] Leaderboard + analytics KTV
- [x] Ticket hỗ trợ + chat booking tạm

### UI/UX
- [x] Dark mode toàn bộ ứng dụng
- [x] Responsive (mobile/tablet/desktop)
- [x] Ant Design + Tailwind CSS
- [x] Lazy loading (React.lazy + Suspense)
- [x] Admin sidebar layout (desktop)

### Bảo mật
- [x] JWT với HS256
- [x] BCrypt password hashing
- [x] CORS configuration
- [x] Rate limiting (auth endpoints)
- [x] @PreAuthorize role-based access

---

## 13. Ví dụ Input/Output API

### 13.1 Đăng ký tài khoản

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "password": "mypassword123",
  "phone": "0901234567",
  "role": "CUSTOMER"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "role": "CUSTOMER",
  "avatarUrl": null,
  "technicianProfileCompleted": false,
  "technicianApprovalStatus": null,
  "bankName": null,
  "bankAccountNumber": null,
  "bankAccountHolder": null
}
```

### 13.2 Đăng nhập

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@homefix.com",
  "password": "123456"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "fullName": "Admin HomeFix",
  "email": "admin@homefix.com",
  "role": "ADMIN",
  "avatarUrl": null,
  "technicianProfileCompleted": false,
  "technicianApprovalStatus": "NOT_REQUIRED"
}
```

### 13.3 Tạo đơn đặt dịch vụ

**Request:**
```http
POST /api/bookings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "servicePackageId": 1,
  "bookingTime": "2026-04-05T09:00:00",
  "address": "123 Nguyễn Huệ, Q.1, TP.HCM",
  "note": "Sửa ống nước bị rò rỉ",
  "couponCode": "WELCOME",
  "paymentMethod": "CASH"
}
```

**Response (200 OK):**
```json
{
  "id": 15,
  "customerName": "Nguyễn Văn A",
  "serviceName": "Sửa ống nước cơ bản",
  "bookingTime": "2026-04-05T09:00:00",
  "address": "123 Nguyễn Huệ, Q.1, TP.HCM",
  "status": "PENDING",
  "totalPrice": 170000,
  "paymentMethod": "CASH",
  "paymentStatus": "UNPAID",
  "technicianName": null,
  "note": "Sửa ống nước bị rò rỉ"
}
```

> Logic: Giá gốc 200.000đ, coupon "WELCOME" giảm 15% → 200.000 × 0.85 = 170.000đ.
> Commission: KTV nhận 85% = 144.500đ, nền tảng nhận 15% = 25.500đ.

### 13.4 KTV nhận đơn

**Request:**
```http
POST /api/bookings/15/claim
Authorization: Bearer <technician_jwt>
```

**Response (200 OK):**
```json
{
  "id": 15,
  "status": "ASSIGNED",
  "technicianName": "Trần Văn B",
  "technicianId": 2
}
```

### 13.5 Cập nhật trạng thái đơn

**Request:**
```http
PATCH /api/bookings/15/status
Authorization: Bearer <technician_jwt>
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**Response:** Booking với status=COMPLETED. `technicianEarning` được cộng vào `User.walletBalance`.

### 13.6 Tạo yêu cầu rút tiền

**Request:**
```http
POST /api/withdrawals
Authorization: Bearer <technician_jwt>
Content-Type: application/json

{
  "amount": 500000
}
```

**Response (200 OK):**
```json
{
  "id": 3,
  "technicianName": "Trần Văn B",
  "amount": 500000,
  "bankName": "Vietcombank",
  "bankAccountNumber": "1234567890",
  "bankAccountHolder": "TRAN VAN B",
  "status": "PENDING",
  "createdAt": "2026-03-31T10:00:00"
}
```

> Logic: walletBalance bị trừ 500.000đ ngay lập tức. Nếu admin reject → hoàn lại.

### 13.7 Xuất Excel đơn hàng

**Request:**
```http
GET /api/admin/export/bookings
Authorization: Bearer <admin_jwt>
```

**Response:** File `.xlsx` (binary) download trực tiếp. Backend tạo ExportLog ghi lại fileSize, rowCount, durationMs.

---

## 14. Giải thích Logic quan trọng

### 14.1 Booking Status Machine

```
PENDING ─── (xác nhận TT) ──► CONFIRMED ─── (gán KTV) ──► ASSIGNED
                                                              │
                              ┌── KTV từ chối ──► DECLINED    │
                              │                                │
                              └── KTV nhận việc ──► IN_PROGRESS
                                                       │
                                                 ┌─────┤
                                                 ▼     ▼
                                              ARRIVED  WORKING
                                                 │        │
                                                 └────┬───┘
                                                      ▼
                                                  COMPLETED
                                                      │
                                            ┌─────────┤
                                            ▼         ▼
                              walletBalance += earning   email + notification

Bất kỳ lúc nào: status → CANCELLED (với cancellationReason)
```

### 14.2 Commission Calculation (BookingService)

```
Khi tạo Booking:
  totalPrice = servicePackage.price - discount(coupon)
  technicianEarning = totalPrice × 0.85
  platformProfit = totalPrice × 0.15

Khi COMPLETED:
  technician.walletBalance += technicianEarning
  (mỗi assistant KHÔNG nhận commission tự động - cần thỏa thuận riêng)
```

### 14.3 Technician Matching (TechnicianMatchingService)

```
findMatchingTechnicians(booking):
  1. Lấy tất cả User(role=TECHNICIAN, approvalStatus=APPROVED)
  2. Filter theo: category match (technician_categories ∩ booking.servicePackage.category)
  3. Filter theo: lịch làm việc (availableFrom ≤ bookingTime ≤ availableTo)
  4. Filter theo: khu vực (baseLocation match)
  5. Filter theo: availableForAutoAssign = true
  6. Return danh sách KTV phù hợp
```

### 14.4 Assistant Promotion (@Scheduled)

```
Mỗi ngày hệ thống chạy promoteEligibleAssistants():
  1. Tìm User(technicianType=ASSISTANT, assistantPromoteAt ≤ now)
  2. Với mỗi assistant đủ 1 tháng:
     - technicianType = MAIN
     - supervisingTechnician = null
     - Gửi notification "Bạn đã được nâng cấp thành Thợ chính"
```

### 14.5 Dark Mode (Frontend)

```
ThemeContext:
  darkMode state ← localStorage('homefix-dark-mode')
  toggleDarkMode() → document.documentElement.classList.toggle('dark')

Cơ chế:
  1. Tailwind config: darkMode: 'class'
  2. Khi class="dark" trên <html>:
     - Tailwind dark: utilities tự kích hoạt
     - index.css: 200+ CSS overrides cho .dark selector
     - Ant Design components: CSS overrides cho .dark .ant-*
```

---

## 15. Tác giả

**Author:** Vinhdev04
**Github:** https://github.com/Vinhdev04

**Author:** GiaBao3009
**Github:** https://github.com/GiaBao3009

**Author:** Vinhdev04
**Github:** https://github.com/Vinhdev04

**Author:** GiaBao3009
**Github:** https://github.com/GiaBao3009
