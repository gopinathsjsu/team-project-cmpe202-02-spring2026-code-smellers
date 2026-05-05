# AWS Backend Deployment

This is the manual AWS setup for the CMPE202 requirement: backend on an EC2 cluster behind a load balancer, frontend running locally.

## Recommended Architecture

- 2 EC2 instances running the backend
- 1 Application Load Balancer forwarding traffic to both instances
- 1 Target Group with health checks on `/health`
- Local frontend using `VITE_API_URL=http://YOUR_LOAD_BALANCER_DNS`

## Backend Instance Setup

Run this on each EC2 instance after SSH:

```bash
sudo yum update -y
sudo yum install -y git nodejs npm
sudo npm install -g pm2

git clone YOUR_REPO_URL eventbrite-clone
cd eventbrite-clone/backend

npm ci
npm run build
```

Create `backend/.env` on each EC2 instance using your real values:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
PORT=3000
NOTIFICATION_SCHEDULER_ENABLED=false
APP_BASE_URL=http://YOUR_LOAD_BALANCER_DNS
NOTIFICATION_LINK_SECRET=your_long_random_secret
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=your_verified_sender
SENDGRID_FROM_NAME=EventDull
GOOGLE_PLACES_API_KEY=your_google_places_key
```

Start the backend:

```bash
pm2 start dist/server.js --name eventbrite-backend
pm2 save
pm2 startup
```

After running `pm2 startup`, AWS prints one extra command. Copy and run that command too.

## AWS Console Steps

1. Create or reuse two EC2 instances.
2. Put both instances in the same VPC.
3. Create a Target Group:
   - Target type: `Instances`
   - Protocol: `HTTP`
   - Port: `3000`
   - Health check path: `/health`
4. Register both EC2 instances in the Target Group.
5. Create an Application Load Balancer:
   - Internet-facing
   - Listener: `HTTP : 80`
   - Forward to your Target Group
6. Security groups:
   - Load balancer allows inbound `HTTP 80` from `0.0.0.0/0`
   - Backend EC2 allows inbound `TCP 3000` from the load balancer security group
   - Optional SSH `22` only from your IP
7. Wait until both targets show `healthy`.

## Verify

Use the load balancer DNS from AWS:

```bash
curl http://YOUR_LOAD_BALANCER_DNS/health
curl http://YOUR_LOAD_BALANCER_DNS/
```

Expected health response:

```json
{"status":"ok"}
```

## Local Frontend

Create `frontend/.env`:

```bash
VITE_API_URL=http://YOUR_LOAD_BALANCER_DNS
```

Then run:

```bash
cd frontend
npm run dev
```

## Scheduler Note

Keep `NOTIFICATION_SCHEDULER_ENABLED=false` on both web instances. If you enable it on both instances, scheduled notification work may run twice.
