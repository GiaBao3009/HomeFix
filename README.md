# HomeFix - Hệ thống đặt dịch vụ tiện ích và sửa chữa gia đình trực tuyến

## Giới thiệu
HomeFix là hệ thống cho phép người dùng đặt lịch các dịch vụ tiện ích (Điện, Nước, Vệ sinh...) và kết nối với các thợ kỹ thuật lành nghề.

## Công nghệ sử dụng
- **Backend:** Java Spring Boot 3.2
  - Spring Security (JWT)
  - Spring Data JPA
  - H2 Database (Dev) / MySQL (Prod)
- **Frontend:** ReactJS (Vite)
  - Tailwind CSS
  - Ant Design
- **Tools:** Maven, Node.js

## Cài đặt và Chạy ứng dụng

### 1. Backend (Spring Boot)
Di chuyển vào thư mục backend và chạy lệnh:
```bash
cd backend
./mvnw spring-boot:run
```
Server sẽ chạy tại `http://localhost:8080`

### 2. Frontend (ReactJS)
Di chuyển vào thư mục frontend (sau khi khởi tạo) và chạy:
```bash
cd frontend
npm install
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:5173`

## Tài khoản demo (Dev)
- Admin: email `admin@homefix.com` / mật khẩu `123456`
- Kỹ thuật viên 1: email `tech1@homefix.com` / mật khẩu `123456`
- Kỹ thuật viên 2: email `tech2@homefix.com` / mật khẩu `123456`
- Khách hàng: email `customer@homefix.com` / mật khẩu `123456`

Lưu ý: Đây là tài khoản phát triển, mật khẩu được seed tự động khi khởi động backend.

## Trạng thái tính năng
### Đã có
- Đăng ký/Đăng nhập (JWT), phân quyền theo vai trò ADMIN/TECHNICIAN/CUSTOMER.
- Quên mật khẩu gửi
- Hệ thống gửi email xác nhận với link đặt lại mật khẩu.
- Quản lý danh mục và gói dịch vụ (CRUD).
- Đặt lịch dịch vụ, xem lịch của tôi, quản trị xem tất cả.
- Phân công kỹ thuật viên, cập nhật trạng thái đơn (PENDING/ASSIGNED/IN_PROGRESS/COMPLETED/DECLINED).
- Mã giảm giá: tạo/cập nhật (ADMIN), áp dụng khi đặt lịch.
- Thông báo nội bộ: tạo khi đặt lịch, đổi trạng thái, phân công, hoàn thành.
- Nội dung website động theo section (HOME/REGISTER/ABOUT/CONTACT/SERVICE_LIST).
- Thanh toán mô phỏng: tạo URL và xác nhận, cập nhật trạng thái, tạo thông báo.
- Xuất CSV danh sách đơn hàng (ADMIN).
- Upload và tải tệp (hình ảnh dịch vụ).
- Thống kê dịch vụ phổ biến (top services).

### Đang có
- OAuth2 Google (cần thiết lập GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET để hoạt động).
- UI quản trị/kỹ thuật viên cơ bản; cần bổ sung bảo vệ route/điều hướng theo vai trò.

### Chưa hoàn thiện
- Tích hợp cổng thanh toán thực (MoMo/VNPay), xác minh callback.
- Realtime notification (WebSocket/SSE); hiện lưu thông báo dạng server-side.
- Email/SMS thông báo ngoài hệ thống.

### Cần bổ sung
- Khôi phục mật khẩu, xác minh email, đổi mật khẩu nâng cao.
- Phân trang/tìm kiếm nâng cao trong danh sách dịch vụ/đơn hàng/người dùng.
- Nhật ký/audit log, rate limiting, hardening bảo mật theo OWASP.
- Bộ báo cáo/dashboard nâng cao cho Admin.

## Author
**Author:** Vinhdev04
**Github:** https://github.com/Vinhdev04
**Author:** GiaBao3009
**Github:** https://github.com/GiaBao3009
