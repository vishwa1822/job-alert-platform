# ⚡ JobPulse — Real-Time Intelligent Job Alert Platform

> Microservices-based job intelligence platform that monitors company career pages **directly** — surfacing roles before they appear on LinkedIn, Indeed, or any aggregator.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│             UI · WebSocket Live Feed · 4 Tabs          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP + WS
                    ┌────────▼────────┐
                    │   API Gateway   │  :8080
                    │  JWT · Rate Limit│
                    └─┬──┬──┬──┬─────┘
          ┌───────────┘  │  │  └──────────────┐
          ▼              ▼  ▼                 ▼
   ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌─────────────┐
   │  User    │  │  Scraper  │  │ Notification │  │Recommendation│
   │ Service  │  │ Service   │  │   Service    │  │   Service    │
   │  :8081   │  │  :8082    │  │    :8083     │  │    :8084     │
   └────┬─────┘  └─────┬─────┘  └──────┬───────┘  └──────┬──────┘
        │              │               │                  │
        └──────────────┴───────────────┴──────────────────┘
                              │
          ┌───────────────────┼─────────────────────┐
          ▼                   ▼                     ▼
    ┌──────────┐       ┌──────────┐          ┌──────────┐
    │PostgreSQL│       │  Kafka   │          │  Redis   │
    │  :5432   │       │  :9092   │          │  :6379   │
    └──────────┘       └──────────┘          └──────────┘
```

## 🚀 Quick Start

```bash
# 1. Clone & configure
cp .env.example .env
# Edit .env with your secrets

# 2. Start everything
docker compose up --build

# 3. Open browser
open http://localhost:3000
```

## 📦 Services

| Service | Port | Responsibility |
|---------|------|----------------|
| API Gateway | 8080 | JWT auth, routing, CORS, rate limiting |
| User Service | 8081 | Auth, profiles, job alerts CRUD |
| Job Scraper | 8082 | Career page crawling, Kafka publishing |
| Notification | 8083 | WebSocket push, alert matching |
| Recommendation | 8084 | AI scoring engine, Redis caching |
| PostgreSQL | 5432 | Primary datastore |
| Kafka + Zookeeper | 9092 | Event streaming |
| Redis | 6379 | Caching, session, rate limiting |
| React Frontend | 3000 | UI (served via Nginx in Docker) |

## 🔑 Key Features

- **Real-time scraping** — monitors 10+ company career pages every 5–15 min
- **Kafka event stream** — every new job is a Kafka event consumed by notification + recommendation services
- **WebSocket live feed** — jobs appear on your screen the moment they're scraped
- **Smart alert matching** — PostgreSQL array-overlap queries match jobs against user alerts instantly
- **AI recommendation engine** — TF-IDF skill scoring + recency decay + salary alignment
- **Full-text search** — PostgreSQL `tsvector` with weighted ranking (title > skills > description)
- **Redis caching** — bloom filter for dedup, recommendation cache, pending notification queue

## 📡 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Jobs
```
GET  /api/jobs?search=&company=&location=&remoteType=&minSalary=&page=&size=
GET  /api/jobs/:id
GET  /api/jobs/recent?hoursBack=24
GET  /api/jobs/stats
POST /api/jobs/scrape/trigger
```

### Alerts
```
GET    /api/users/alerts
POST   /api/users/alerts
PUT    /api/users/alerts/:id
PATCH  /api/users/alerts/:id/toggle?active=true
DELETE /api/users/alerts/:id
```

### Notifications
```
GET   /api/notifications
GET   /api/notifications/unread-count
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

### WebSocket
```
ws://localhost:8080/ws/notifications?userId=<UUID>
```

## 🗄️ Database Schema

Key tables: `users`, `jobs`, `company_sources`, `user_alerts`, `job_applications`, `saved_jobs`, `notifications`, `scrape_logs`

Full DDL in `backend/common/init.sql`

## 🛠️ Tech Stack

**Backend:** Spring Boot 3.2, Spring Cloud Gateway, Spring Kafka, Spring Data JPA, WebSocket  
**Database:** PostgreSQL 16 (full-text search, array ops), Redis 7  
**Messaging:** Apache Kafka + Zookeeper  
**Frontend:** React 18, Vite, WebSocket  
**Infrastructure:** Docker, Docker Compose, Nginx  
**Auth:** JWT (jjwt 0.12), BCrypt
