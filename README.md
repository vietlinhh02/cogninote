# CogniNote - Ứng Dụng AI Note-taking Thế Hệ Mới

## Tổng Quan

CogniNote là một ứng dụng web và mobile AI Note-taking thế hệ mới, được phát triển để cung cấp giải pháp ghi chép và phân tích hội thoại toàn diện. Ứng dụng tích hợp và cải tiến các tính năng tốt nhất từ các nền tảng hàng đầu trong ngành: Otter.ai, Fireflies.ai, và Gong.io. CogniNote tập trung vào việc xây dựng một hệ sinh thái trí tuệ hội thoại hoàn chỉnh với khả năng ghi chép thời gian thực, phân tích thông minh và tích hợp quy trình làm việc.

## Tính Năng Chính

CogniNote được phát triển dựa trên nghiên cứu và học hỏi từ các ứng dụng hàng đầu trong ngành:

### Tính Năng Từ Otter.ai
- **Live Transcription**: Ghi chép văn bản theo thời gian thực với độ trễ thấp
- **ASR (Automatic Speech Recognition)**: Công nghệ nhận dạng giọng nói tự động
- **Auto-Pilot**: Tự động kết nối với lịch và tham gia cuộc họp Zoom/Meet/Teams
- **Real-time Display**: Hiển thị văn bản ngay trong quá trình hội thoại

### Tính Năng Từ Fireflies.ai
- **Smart Search**: Tìm kiếm ngữ nghĩa với các tham số như "câu hỏi", "chỉ số tài chính", "ngày giờ", "cảm xúc"
- **Workflow Integration**: Tích hợp sâu với HubSpot, Salesforce, Slack
- **Post-Meeting Processing**: Xử lý và phân loại nội dung sau cuộc họp bằng NLP
- **Knowledge Hub**: Trung tâm dữ liệu hội thoại tập trung

### Tính Năng Từ Gong.io
- **Revenue Intelligence**: Phân tích tín hiệu để tối ưu hóa doanh thu
- **Conversation Analytics**: Phân tích hơn 300 tín hiệu độc nhất (tỷ lệ nói/nghe, ngập ngừng, đề cập đối thủ)
- **Forecasting**: Dự báo doanh thu dựa trên dữ liệu thực tế
- **Enterprise-Grade**: Xử lý dữ liệu quy mô lớn cho doanh nghiệp

## Mục Tiêu

CogniNote là một ứng dụng web và mobile hoàn chỉnh, nhằm mục đích tạo ra một giải pháp AI Note-taking toàn diện với các tính năng:

### Tính Năng Từ Otter.ai
- **Live Transcription**: Ghi chép văn bản theo thời gian thực với độ trễ thấp
- **ASR (Automatic Speech Recognition)**: Công nghệ nhận dạng giọng nói tự động độc quyền
- **Auto-Pilot**: Tự động kết nối với lịch và tham gia cuộc họp Zoom/Meet/Teams
- **Real-time Display**: Hiển thị văn bản ngay trong quá trình hội thoại

### Tính Năng Từ Fireflies.ai
- **Smart Search**: Tìm kiếm ngữ nghĩa với các tham số như "câu hỏi", "chỉ số tài chính", "ngày giờ", "cảm xúc"
- **Workflow Integration**: Tích hợp sâu với HubSpot, Salesforce, Slack
- **Post-Meeting Processing**: Xử lý và phân loại nội dung sau cuộc họp bằng NLP
- **Knowledge Hub**: Trung tâm dữ liệu hội thoại tập trung

### Tính Năng Từ Gong.io
- **Revenue Intelligence**: Phân tích tín hiệu để tối ưu hóa doanh thu
- **Conversation Analytics**: Phân tích hơn 300 tín hiệu độc nhất (tỷ lệ nói/nghe, ngập ngừng, đề cập đối thủ)
- **Forecasting**: Dự báo doanh thu dựa trên dữ liệu thực tế
- **Enterprise-Grade**: Xử lý dữ liệu quy mô lớn cho doanh nghiệp

## Kiến Trúc Hệ Thống

### Các Thành Phần Chính

1. **Real-Time Transcription Layer**
   - ASR Engine (Automatic Speech Recognition)
   - Live streaming transcription service
   - Audio processing pipeline
   - Low-latency text display

2. **Meeting Integration Layer**
   - Calendar integration (Google Calendar, Outlook)
   - Video conferencing APIs (Zoom, Google Meet, Microsoft Teams)
   - Auto-join bot service
   - Meeting recording service

3. **AI/ML Processing Layer**
   - Natural Language Processing (NLP) engine
   - Sentiment analysis
   - Entity extraction
   - Conversation classification
   - Semantic search engine
   - Revenue intelligence analytics

4. **Integration & Workflow Layer**
   - CRM integrations (HubSpot, Salesforce)
   - Communication tools (Slack, Microsoft Teams)
   - Project management tools
   - Custom webhook system

5. **Data & Storage Layer**
   - Primary database (PostgreSQL/MongoDB)
   - Vector database cho semantic search (Pinecone/Weaviate/Qdrant)
   - Audio/video file storage
   - Time-series data cho analytics

6. **Frontend Layer**
   - Real-time transcription UI
   - Meeting dashboard
   - Analytics & insights dashboard
   - Search interface với semantic filters
   - Mobile responsive design

## Bắt Đầu

CogniNote là một ứng dụng web full-stack với frontend và backend riêng biệt. Dưới đây là hướng dẫn để chạy ứng dụng trên máy local.

### Yêu Cầu Hệ Thống

- Node.js >= 18.x
- Docker & Docker Compose
- npm >= 9.0.0
- PostgreSQL 15+ (hoặc sử dụng Docker)
- Redis 7+ (hoặc sử dụng Docker)
- Git

### Cài Đặt và Chạy Ứng Dụng

```bash
# Clone repository
git clone https://github.com/vietlinhh02/cogninote.git
cd cogninote

# Cài đặt dependencies
npm install

# Sao chép và cấu hình environment variables
cp .env.example .env
# Chỉnh sửa .env với API keys của bạn (GEMINI_API_KEY, JWT_SECRET, etc.)

# Khởi động PostgreSQL và Redis bằng Docker
npm run docker:up

# Chạy backend server (development mode với hot reload)
npm run dev

# Hoặc build và chạy production mode
npm run build
npm start
```

Ứng dụng sẽ chạy tại:
- Backend API: http://localhost:8000
- API Documentation (Swagger): http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

## Cấu Trúc Dự Án

```
cogninote/
├── src/                      # Source code
│   ├── config/              # Configuration files
│   │   ├── index.ts         # Main config
│   │   ├── database.ts      # PostgreSQL setup
│   │   ├── redis.ts         # Redis setup
│   │   └── swagger.ts       # API documentation
│   ├── middlewares/         # Express middlewares
│   │   ├── correlation-id.ts # Request correlation tracking
│   │   ├── error-handler.ts  # Centralized error handling
│   │   ├── not-found.ts      # 404 handler
│   │   └── rate-limiter.ts   # Rate limiting
│   ├── routes/              # API routes
│   │   ├── health.routes.ts
│   │   ├── auth.routes.ts
│   │   └── meeting.routes.ts
│   ├── utils/               # Utilities
│   │   └── logger.ts         # Winston logger with correlation ID
│   ├── tests/               # Test files
│   ├── app.ts               # Express app
│   └── index.ts             # Entry point
├── docs/                    # Documentation
│   ├── GETTING_STARTED.md   # Getting started guide
│   └── ARCHITECTURE.md      # Architecture docs
├── scripts/                 # Utility scripts
│   └── init-db.sql          # Database initialization
├── .github/                 # GitHub workflows
│   └── workflows/           # CI/CD pipelines
│       ├── ci-cd.yml        # Main CI/CD pipeline
│       └── security.yml     # Security scanning
├── docker-compose.yml       # Docker services
├── Dockerfile               # Container image
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── jest.config.js           # Test config
├── .env.example             # Environment template
├── README.md
├── LICENSE
└── .gitignore
```

## Middleware và Security Features

### Request Correlation ID
Mỗi request được gán một correlation ID duy nhất để theo dõi qua các logs:
- Tự động sinh correlation ID nếu không có
- Hỗ trợ custom correlation ID qua header `X-Correlation-ID`
- Correlation ID được trả về trong response header
- Tất cả logs đều bao gồm correlation ID để dễ dàng debug

### Request/Response Logging
- Winston logger với support cho correlation ID
- Log format chuẩn với timestamp, level, message và metadata
- Tự động log tất cả HTTP requests với Morgan
- File logging riêng cho errors và combined logs
- Structured logging với JSON format

### Security Headers (Helmet)
Backend được bảo vệ với các security headers:
- Content Security Policy (CSP) để chống XSS
- HSTS với max-age 1 năm
- X-Content-Type-Options: nosniff
- X-XSS-Protection enabled
- Hide X-Powered-By header

### Rate Limiting
- Giới hạn số requests từ cùng IP
- Mặc định: 100 requests / 15 phút
- Có thể cấu hình qua environment variables
- Standard headers cho rate limit info

### CORS Configuration
- Flexible CORS configuration qua environment
- Support credentials cho authenticated requests
- Configurable allowed origins

## Công Nghệ Sử Dụng

### Backend
- **Node.js 18+** với TypeScript
- **Express.js** - Web framework
- **PostgreSQL 15** - Primary database
- **Redis 7** - Caching và session storage
- **JWT** - Authentication
- **Winston** - Logging
- **Jest** - Testing framework
- **Swagger/OpenAPI** - API documentation

### AI/ML & Speech Processing
- OpenAI Whisper / Google Speech-to-Text / Azure Speech Services
- OpenAI API / Anthropic Claude cho NLP
- LangChain / LlamaIndex cho semantic processing
- Vector databases (Pinecone, Weaviate, Qdrant) cho semantic search
- Transformers (Hugging Face) cho conversation analysis
- Custom ASR models cho real-time transcription

### Infrastructure & Integrations
- Docker & Docker Compose
- Kubernetes (production)
- CI/CD (GitHub Actions)
- WebRTC cho real-time audio streaming
- WebSocket cho real-time updates
- OAuth 2.0 cho calendar và meeting platform integrations

## Tài Liệu

- [Hướng Dẫn Bắt Đầu](./docs/GETTING_STARTED.md) - Chi tiết về setup và development
- [Kiến Trúc Hệ Thống](./docs/ARCHITECTURE.md) - Kiến trúc backend và data flow
- [API Documentation](http://localhost:8000/docs) - Swagger UI (khi server đang chạy)
- [Contributing Guide](./CONTRIBUTING.md) - Hướng dẫn đóng góp
- [Security Policy](./SECURITY.md) - Chính sách bảo mật

## Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng đọc [CONTRIBUTING.md](./CONTRIBUTING.md) để biết thêm chi tiết về quy trình đóng góp.

### Quy Trình Đóng Góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit các thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## License

Dự án này được phân phối dưới giấy phép MIT. Xem file [LICENSE](./LICENSE) để biết thêm chi tiết.

## Tác Giả

- **Viet Linh** - *Initial work* - [GitHub](https://github.com/vietlinhh02)

## Lời Cảm Ơn

- Cảm ơn tất cả các contributors đã đóng góp cho dự án
- Cảm ơn các open source libraries và frameworks đã được sử dụng

## Liên Hệ

- Email: nvlinh0607@gmail.com
- GitHub Issues: [Issues](https://github.com/vietlinhh02/cogninote/issues)
- Discussions: [Discussions](https://github.com/vietlinhh02/cogninote/discussions)

## Liên Kết Hữu Ích

- [Project Roadmap](./docs/ROADMAP.md)
- [Changelog](./CHANGELOG.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

