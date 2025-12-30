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
- Python >= 3.9
- Docker & Docker Compose (khuyến nghị)
- PostgreSQL hoặc MongoDB
- Redis (cho caching)
- Git

### Cài Đặt và Chạy Ứng Dụng

```bash
# Clone repository
git clone https://github.com/vietlinhh02/cogninote.git
cd cogninote

# Cài đặt dependencies cho frontend
cd src/frontend
npm install

# Cài đặt dependencies cho backend
cd ../backend
pip install -r requirements.txt

# Setup database
docker-compose up -d

# Chạy migrations
python manage.py migrate

# Chạy backend server
python app.py

# Trong terminal khác, chạy frontend
cd src/frontend
npm start
```

Ứng dụng sẽ chạy tại:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Cấu Trúc Dự Án

```
cogninote/
├── docs/                   # Tài liệu dự án
│   ├── architecture/      # Tài liệu kiến trúc
│   ├── api/               # Tài liệu API
│   └── guides/            # Hướng dẫn sử dụng
├── src/                   # Source code chính
│   ├── frontend/          # Frontend application
│   ├── backend/           # Backend services
│   ├── ai/                # AI/ML modules
│   └── shared/            # Shared utilities
├── tests/                 # Test cases
├── scripts/               # Utility scripts
├── .github/               # GitHub workflows
│   └── workflows/         # CI/CD pipelines
├── README.md
├── LICENSE
└── .gitignore
```

## Công Nghệ Sử Dụng

### Frontend
- React / Vue.js / Next.js
- TypeScript
- Tailwind CSS / Material-UI

### Backend
- Node.js / Python
- FastAPI / Express.js
- PostgreSQL / MongoDB
- Redis

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

- [Kiến Trúc Hệ Thống](./docs/architecture/README.md)
- [API Documentation](./docs/api/README.md)
- [Hướng Dẫn Phát Triển](./docs/guides/DEVELOPMENT.md)
- [Hướng Dẫn Triển Khai](./docs/guides/DEPLOYMENT.md)

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

