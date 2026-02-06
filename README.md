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

## Author
**Author:** Vinhdev04
**Github:** https://github.com/Vinhdev04
