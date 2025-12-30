# Development Scripts

## Automatic Docker + Development Setup

Các script này giúp tự động khởi động Docker containers và development server cùng lúc.

### Cách sử dụng:

1. **Chính (Khuyến nghị):**
   ```bash
   npm run dev
   ```
   - Tự động kiểm tra Docker có đang chạy không
   - Khởi động PostgreSQL và Redis containers
   - Đợi services sẵn sàng
   - Khởi động development server

2. **Cho Windows (Alternative):**
   ```bash
   npm run dev:win
   ```
   - Script batch đơn giản cho Windows

3. **Đơn giản với concurrently:**
   ```bash
   npm run dev:simple
   ```
   - Chạy song song Docker và dev server

4. **Chỉ development server (không Docker):**
   ```bash
   npm run dev:only
   ```

### Yêu cầu:
- Docker Desktop phải được cài đặt và đang chạy
- Node.js và npm
- Các dependencies đã được cài đặt (`npm install`)

### Troubleshooting:
- Nếu gặp lỗi permission trên Linux/Mac: `chmod +x scripts/dev-with-docker.js`
- Nếu Docker không khởi động được: Kiểm tra Docker Desktop
- Nếu database không connect được: Chạy `npm run docker:restart`