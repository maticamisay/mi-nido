# 🐣 Mi Nido — Audit Progress Tracker

## Status: 🔄 In Progress

### Batch 1: Critical Infrastructure & Security (Issues 9.4, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2)
- [ ] Create .gitignore
- [ ] Fix CORS_ORIGIN vs CORS_ORIGINS mismatch
- [ ] Fix JWT_SECRET reading at import time
- [ ] Add error handler to Express

### Batch 2: Critical Backend Bugs (Issues 1.1, 1.6, 1.10, 6.2, 6.3, 6.4, 8.5)
- [ ] Fix getGardenStats `garden._id` reference
- [ ] Add global error handler
- [ ] Fix Attendance subdoc spread
- [ ] Fix Child double next()
- [ ] Fix Announcement double next()
- [ ] Add virtuals to toJSON
- [ ] Fix ObjectId in aggregates

### Batch 3: Critical Frontend - API Integration (Issues 2.1, 2.3, 2.4, 3.1)
- [ ] Create apiFetch helper with gardenId
- [ ] Fix ALL relative URLs to use API_BASE_URL
- [ ] Fix ALL response destructuring

### Batch 4: Missing Endpoints & Route Fixes (Issues 2.2, 3.2, 3.3, 3.4, 3.5, 3.6)
- [ ] Fix familia page to use existing endpoints
- [ ] Fix payment endpoint URLs
- [ ] Fix attendance POST vs PUT
- [ ] Fix cuaderno edit URL
- [ ] Fix comunicados URLs
- [ ] Fix salas URLs

### Batch 5: Medium Priority - Auth & Validation (Issues 4.1, 4.3, 4.5, 5.1, 5.2, 5.3, 5.5, 7.3)
- [ ] Add email validation
- [ ] Fix announcement delete auth
- [ ] Fix calendar event delete auth
- [ ] Add rate limiting
- [ ] Fix gardenId precedence

### Batch 6: Medium Priority - Models & Performance (Issues 6.1, 8.1, 8.2, 8.5, 9.1, 9.2)
- [ ] Fix Payment unique index
- [ ] Fix N+1 queries in getClassrooms
- [ ] Fix N queries in attendance summary
- [ ] Fix Dockerfile permissions

### Batch 7: Low Priority (Issues 1.9, 2.5, 2.6, 2.7, 4.4, 4.5, 5.4, 6.5, 7.4, 7.5, 7.6, 7.7, 8.3, 8.4, 9.3, 9.5, 9.6, 9.7)
- [ ] Various low-priority fixes
