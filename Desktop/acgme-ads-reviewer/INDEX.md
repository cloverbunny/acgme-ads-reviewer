# ACGME ADS Reviewer - Complete Project Index

A production-ready document analysis platform for ACGME Annual Data System annual updates.

## 📦 Project Contents

### Documentation (7 files)
```
├── README.md              # Main documentation & setup guide
├── QUICKSTART.md          # 2-minute quick start
├── DEVELOPMENT.md         # Backend customization guide
├── API.md                 # Complete API reference
├── DATABASE.md            # Database schema & setup
├── ROADMAP.md             # Feature roadmap & future plans
└── .env.example           # Environment configuration template
```

### Backend (Node.js + Express)
```
├── server.js              # Main Express application
├── package.json           # Dependencies & scripts
├── Dockerfile             # Docker containerization
├── docker-compose.yml     # Docker Compose setup
│
├── services/              # Business logic layer
│   ├── analyzer.js       # Document analysis engine
│   ├── azure.js          # Azure AI integration
│   └── database.js       # Database abstraction layer
│
├── routes/                # API endpoints
│   ├── analyze.js        # Document analysis API
│   ├── azure.js          # Azure validation API
│   └── results.js        # Results storage API
│
├── middleware/            # Express middleware
│   └── auth.js           # Authentication & security
│
└── bin/                   # CLI tools
    └── cli.js            # Command-line interface
```

### Frontend (Vanilla JavaScript)
```
└── public/                # Static files served to browser
    ├── index.html        # Main UI
    ├── css/
    │   └── styles.css    # Professional responsive design
    └── js/
        ├── api.js        # API client library
        ├── ui.js         # UI utilities & state management
        └── app.js        # Main application logic
```

### Configuration & Utilities
```
├── .env.example           # Environment variables template
├── .gitignore             # Git configuration
├── Dockerfile             # Docker image definition
└── docker-compose.yml     # Docker Compose for easy setup
```

---

## 🚀 Quick Start (30 seconds)

### 1. Install
```bash
cd acgme-ads-reviewer
npm install
```

### 2. Run
```bash
npm start
```

### 3. Open Browser
```
http://localhost:3000
```

---

## 📚 Documentation Guide

### For Users
Start here: **QUICKSTART.md**
- Get running in 2 minutes
- Basic usage instructions
- Common troubleshooting

### For Developers
Start here: **DEVELOPMENT.md**
- Add custom analysis rules
- Modify the UI
- Extend API endpoints
- Integrate Azure services

### For API Integration
Start here: **API.md**
- Complete endpoint reference
- Request/response examples
- Authentication methods
- Error handling
- SDK usage

### For Database Setup
Start here: **DATABASE.md**
- Schema definitions (SQLite, PostgreSQL, MongoDB)
- Initialization instructions
- Migration guides
- Data models

### For Feature Planning
Start here: **ROADMAP.md**
- Completed features (v1.0)
- Planned features (v2.0-v7.0)
- How to contribute
- Timeline & status

---

## 🎯 Key Features

### Analysis Engine
✅ Duplicate physician detection in faculty rosters
✅ FTE support validation against program requirements
✅ Scholarly activity recency review
✅ Extensible analysis framework for custom rules

### Backend
✅ RESTful API with comprehensive documentation
✅ File upload handling with validation
✅ Azure OpenAI Services integration ready
✅ Database abstraction (supports Memory, SQLite, PostgreSQL, MongoDB)
✅ Security middleware (authentication, rate limiting, CORS)
✅ Comprehensive error handling

### Frontend
✅ Professional medical-grade UI
✅ Responsive design (desktop & tablet)
✅ Real-time file validation
✅ Tabbed results interface
✅ Error/success notifications
✅ Sample data for testing

### DevOps
✅ Docker & Docker Compose support
✅ CLI tools for administration
✅ Environment-based configuration
✅ Health check endpoints
✅ Audit logging framework

---

## 📋 NPM Scripts

```bash
# Development
npm run dev              # Start with auto-reload

# Production
npm start                # Start server

# CLI Tools
npm run generate-api-key # Generate API key
npm run create-admin     # Create admin user
npm run init-db          # Initialize database
npm run config           # Show configuration
npm run validate-env     # Validate setup
npm run cleanup          # Remove temp files
npm run reset -- --confirm  # Clear all data (dangerous!)

# Other
npm test                 # Run tests
npm run cli              # Show CLI help
```

---

## 🔐 Security Features

- ✅ HTTPS ready (use reverse proxy)
- ✅ CORS protection
- ✅ Rate limiting
- ✅ API key authentication
- ✅ JWT token support
- ✅ Security headers (XSS, clickjacking, etc.)
- ✅ HTTPS enforcement
- ✅ Request validation
- ✅ Error message sanitization

---

## 🗄️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / Client                         │
│        (React, Vue, or vanilla JavaScript app)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Express Server                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Routes & Middleware                      │   │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │ /api/analyze│  │/api/azure│  │/api/results  │   │   │
│  │  └─────────────┘  └──────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Services (Business Logic)                  │   │
│  │  ┌──────────────┐  ┌────────┐  ┌────────────┐       │   │
│  │  │ analyzer.js  │  │azure.js│  │database.js │       │   │
│  │  └──────────────┘  └────────┘  └────────────┘       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Middleware (Security & Logging)              │   │
│  │  ┌────────────┐  ┌─────────────┐  ┌────────────┐    │   │
│  │  │ auth.js    │  │rateLimit.js │  │logging.js  │    │   │
│  │  └────────────┘  └─────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬─────────────────┬──────────────┬────────────────┘
             │                 │              │
         ┌───▼────┐      ┌─────▼──────┐  ┌───▼──────┐
         │  File  │      │  Database  │  │  Azure   │
         │ System │      │  (Memory/  │  │   APIs   │
         │        │      │  SQLite/   │  │          │
         │        │      │  Postgres) │  │          │
         └────────┘      └────────────┘  └──────────┘
```

---

## 🔄 Data Flow

### Analysis Flow
```
1. User uploads HTML & PDF
   ↓
2. Files validated
   ↓
3. Content extracted
   ↓
4. Analysis rules applied:
   - Duplicate detection
   - FTE validation
   - Scholarly activity check
   ↓
5. Results aggregated
   ↓
6. Results rendered in UI
   ↓
7. User can save results (optional)
```

### Storage Flow (if enabled)
```
1. Results saved to database
   ↓
2. Submission metadata stored
   ↓
3. Audit log created
   ↓
4. User can retrieve later
   ↓
5. Historical analysis available
```

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **File Upload**: Multer
- **Async HTTP**: Axios
- **Environment**: dotenv

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern responsive design
- **JavaScript**: Vanilla ES6+
- **No dependencies**: Lightweight & fast

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Process Management**: PM2 (recommended for production)
- **Reverse Proxy**: Nginx (recommended for production)

### Integrations
- **Azure OpenAI**: Optional AI analysis
- **Azure Document Intelligence**: Optional advanced PDF parsing

### Databases Supported
- **Memory**: Development/testing (no persistence)
- **SQLite**: Local deployments
- **PostgreSQL**: Production deployments
- **MongoDB**: Modern NoSQL deployments

---

## 📊 File Statistics

| Category | Count | Total Size |
|----------|-------|-----------|
| Documentation | 7 | ~80 KB |
| Backend Code | 8 | ~45 KB |
| Frontend Code | 4 | ~35 KB |
| Config Files | 4 | ~5 KB |
| **Total** | **23** | **~165 KB** |

---

## 🌐 Deployment Options

### Option 1: Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Option 2: Docker (Recommended)
```bash
docker-compose up
# Open http://localhost:3000
```

### Option 3: Production with PM2
```bash
npm install -g pm2
pm2 start server.js
pm2 save
```

### Option 4: Kubernetes
See DEVELOPMENT.md for Helm chart examples

---

## 🔧 Customization Path

### Add New Analysis Rule
1. Edit `services/analyzer.js`
2. Add new `checkXXX()` method
3. Call in `analyze()` method
4. Update frontend tabs
5. Test with sample data

### Add API Endpoint
1. Create route file in `routes/`
2. Import in `server.js`
3. Add to router
4. Document in `API.md`
5. Update API client

### Change UI Theme
1. Edit `:root` in `public/css/styles.css`
2. Update color variables
3. Test in browser
4. Create CSS theme variants

### Integrate Database
1. Choose database type
2. Implement `services/database.js` subclass
3. Create schema with migrations
4. Update connection code
5. Test with data

---

## 🚨 Important Notes

### Development vs Production
- Use `.env.local` for local settings (not in git)
- Never commit API keys or secrets
- Use environment variables for all sensitive data
- Enable HTTPS in production
- Use strong database passwords

### Performance
- Files are processed in memory (streaming for large files)
- Rate limiting prevents abuse
- Cache analysis results when appropriate
- Consider async processing for very large files

### Security
- Validate all file uploads
- Sanitize error messages
- Use HTTPS in production
- Implement proper authentication
- Regular security updates

---

## 📞 Support & Resources

### Documentation
- README.md - Main documentation
- QUICKSTART.md - Get started in 2 minutes
- DEVELOPMENT.md - Customization guide
- API.md - API reference
- DATABASE.md - Database setup
- ROADMAP.md - Future features

### Getting Help
1. Check documentation first
2. Review similar issues/PRs
3. Run `npm run validate-env`
4. Check server logs
5. Open GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment info
   - Relevant logs

### Reporting Bugs
Include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser/Node version
- Environment details

### Feature Requests
Include:
- Use case & motivation
- Expected behavior
- Current workaround (if any)
- Related issues (if any)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Follow development guidelines in DEVELOPMENT.md
4. Add tests for new features
5. Submit pull request

See ROADMAP.md for feature requests & voting

---

## 🎓 Learning Resources

### About ACGME ADS
- [ACGME Official Website](https://www.acgme.org/)
- [ADS Annual Update Guide](https://www.acgme.org/ads/)
- Program Requirements by Specialty

### Node.js & Express
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Frontend Development
- [JavaScript ES6+](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [CSS3 Guide](https://developer.mozilla.org/en-US/docs/Web/CSS)

### Database
- [SQLite Tutorial](https://www.sqlitetutorial.net/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)

### DevOps
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready
