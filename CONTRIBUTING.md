# Hướng Dẫn Đóng Góp

Cảm ơn bạn đã quan tâm đến việc đóng góp cho dự án CogniNote! Tài liệu này cung cấp các hướng dẫn về cách đóng góp cho dự án.

## Mục Lục

- [Code of Conduct](#code-of-conduct)
- [Cách Đóng Góp](#cách-đóng-góp)
- [Quy Trình Phát Triển](#quy-trình-phát-triển)
- [Tiêu Chuẩn Code](#tiêu-chuẩn-code)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Dự án này tuân thủ Code of Conduct. Bằng cách tham gia, bạn được kỳ vọng sẽ tuân thủ code này.

## Cách Đóng Góp

### Báo Cáo Lỗi

Khi báo cáo lỗi, vui lòng bao gồm:

- Mô tả rõ ràng về lỗi
- Các bước để tái hiện lỗi
- Môi trường (OS, version, etc.)
- Screenshots nếu có thể
- Logs liên quan

### Đề Xuất Tính Năng

Chúng tôi hoan nghênh mọi đề xuất! Vui lòng:

- Mô tả rõ ràng tính năng và lý do tại sao nó hữu ích
- Đề xuất cách triển khai nếu có
- Thảo luận về các tác động tiềm ẩn

## Quy Trình Phát Triển

1. **Fork repository**
   ```bash
   git clone https://github.com/vietlinhh02/cogninote.git
   cd cogninote
   ```

2. **Tạo branch mới**
   ```bash
   git checkout -b feature/your-feature-name
   # hoặc
   git checkout -b fix/your-bug-fix
   ```

3. **Cài đặt dependencies**
   ```bash
   npm install
   # hoặc
   pip install -r requirements.txt
   ```

4. **Phát triển tính năng**
   - Viết code
   - Viết tests
   - Cập nhật documentation

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **Push và tạo Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Tiêu Chuẩn Code

### Code Style

- Tuân thủ coding standards của ngôn ngữ được sử dụng
- Sử dụng linter và formatter (ESLint, Prettier, Black, etc.)
- Viết code dễ đọc và dễ hiểu
- Thêm comments cho logic phức tạp

### Testing

- Viết unit tests cho các functions mới
- Đảm bảo tất cả tests pass trước khi commit
- Coverage tối thiểu 80%

### Documentation

- Cập nhật README nếu cần
- Thêm docstrings cho functions/classes
- Cập nhật API documentation

## Commit Messages

Chúng tôi sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Thay đổi documentation
- `style`: Formatting, missing semi colons, etc.
- `refactor`: Refactoring code
- `test`: Thêm tests
- `chore`: Maintenance tasks

### Examples

```
feat(ai): add semantic search functionality

fix(auth): resolve token expiration issue

docs(readme): update installation instructions
```

## Pull Request Process

1. **Cập nhật documentation** nếu cần
2. **Đảm bảo tests pass** và coverage đủ
3. **Rebase** với main branch nếu cần
4. **Tạo Pull Request** với mô tả rõ ràng:
   - Mô tả thay đổi
   - Link đến related issues
   - Screenshots nếu có UI changes
   - Checklist các items đã hoàn thành

### PR Template

```markdown
## Mô tả
Mô tả ngắn gọn về thay đổi

## Loại thay đổi
- [ ] Bug fix
- [ ] Tính năng mới
- [ ] Breaking change
- [ ] Documentation update

## Testing
Mô tả cách test thay đổi này

## Checklist
- [ ] Code tuân thủ style guide
- [ ] Đã tự review code
- [ ] Đã comment code phức tạp
- [ ] Documentation đã được cập nhật
- [ ] Không có warnings mới
- [ ] Tests đã được thêm/updated
- [ ] Tất cả tests pass
```

## Review Process

- Maintainers sẽ review PR trong vòng 48 giờ
- Có thể yêu cầu thay đổi
- Sau khi approved, PR sẽ được merge

## Questions?

Nếu có câu hỏi, vui lòng:
- Mở issue trên GitHub
- Tham gia discussions
- Liên hệ maintainers

Cảm ơn bạn đã đóng góp!

