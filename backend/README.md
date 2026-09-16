# Health Monitoring System

A distributed health monitoring system designed to handle high-concurrency checks with a non-blocking architecture.

## Architecture & Design Decisions

### High Level Design (HLD)

<img src="public/assets/hld_flow.svg" alt="high level flow chart" />

This system isn't just a simple `setInterval` loop. It's built to scale. The core philosophy was to decouple the **scheduling** of checks from the **execution** of checks.

#### 1. RabbitMQ (The Asynchronous Buffer)

Instead of the application trying to do everything at once (find due monitors -> check them -> save results), we use a **Distributed Queue System**.

- **Thinking Process**:
  - *The Problem*: In a synchronous system, if 10,000 monitors are due at t=0, the event loop would block trying to fire 10,000 requests.
  - *The Solution*: Application-level flow control. The Scheduler only produces "jobs". The Workers consume them at their own pace.
- **Why RabbitMQ?**:
  - **Backpressure**: It acts as a shock absorber. If the network is slow, the queue fills up, but the scheduler keeps ticking.
  - **Worker Scalability**: We can spin up 50 generic worker nodes on different servers, all listening to the same queue.
  - **Reliability**: If a worker crashes while processing a job, RabbitMQ can re-queue it (via Acknowledgements) so the check isn't lost.


#### 2. Redis (The Atomic Scheduler)

We didn't want to scan the entire MongoDB `health_monitors` collection every second to find what's due. That's O(N) operation which degrades linearly as users add monitors.

- **Thinking Process**:
  - *State vs Stateless*: The "schedule" is a stateful entity. We need fast random access and range queries.
  - *Efficiency*: Redis Sorted Sets (`ZSET`) allow us to store `next_check_at` as a score.
- **Mechanism**:
  - **O(log N) Polling**: `ZRANGEBYSCORE` allows us to fetch only the monitors due *right now* without touching the millions of monitors scheduled for later.
  - **Concurrency Safe**: Redis operations are atomic, preventing race conditions if we were to scale the scheduler (with locking).

#### 3. MongoDB (The Persistent Store)

- Stores the configuration (`HealthMonitor`) and the historical results (`HealthStatusCheck`).
- **Trade-off**: For now, we store time-series data (check results) in a standard document collection.
  - *Future Upgrade*: Move `HealthStatusCheck` to a dedicated Time-Series Database (like InfluxDB or TimescaleDB) for better compression and query performance on large datasets.

#### 4. Database Design

- <img src="/public/assets/er.svg" alt="high level flow chart" />

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- MongoDB
- Redis
- RabbitMQ

### Installation

1. **Clone the repository**

   ```bash
   git clone server_url
   cd hms
   ```
2. **Install Dependencies**

   ```bash
   npm install
   ```
3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   PORT=8000
   MONGO_URI=mongodb://localhost:27017/hms
   JWT_SECRET_KEY=jwt_secret
   JWT_TOKEN_ISSUER=jwt_issued_by
   REDIS_URI=redis://localhost:6379
   RABBIT_MQ_URI=amqp://localhost:5672
   HEALTH_STATUS_QUEUE=health_status_queue
   ```
4. **Run the Application**

   ```bash
   # Development mode
   npm run dev

   # Production start
   npm start
   ```

## Project Structure

- `src/scheduler`: The heartbeat. Runs every second, checks Redis, pushes to Queue.
- `src/health_status_queue`: RabbitMQ producer/consumer logic.
- `src/health_monitor`: Core logic for creating monitors and executing the actual URL checks (Axios).
- `src/api`: Express routes and controllers.

## Database design

## Future Improvements

- **TimeSeries DB**: Migrating `HealthStatusCheck` to a TSDB.
- **Data Visualization API**: An optimized aggregation pipeline for graphing uptime/latency.
- **Distributed Scheduler**: Currently the scheduler is a singleton. Using Redlock or similar would allow multiple scheduler instances.
