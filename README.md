# Course Project — Candidate Selection System

## 📌 Описание
Веб-приложение для управления процессом подбора кандидатов в проекты.

Система реализует полный цикл:
- отклик на вакансию
- проведение собеседований
- оценка кандидатов
- принятие решения

---

## 🧠 Архитектура

Client (Browser)
↓
NGINX
↓
Backend (Node.js)
↓
PostgreSQL

---

## ⚙️ Технологии

- Node.js
- PostgreSQL
- Docker + Docker Compose
- NGINX
- (позже React)

---

## 📦 Структура проекта

app/
├── backend/
├── frontend/
├── frontend-build/
├── nginx/
├── docker-compose.yml
└── init.sql

---

## 🚀 Запуск проекта

```bash
docker-compose down -v
docker-compose up -d