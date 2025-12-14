# Langfuse Sync Background Job

This directory contains background jobs for the ZenVoice server. The primary job is the Langfuse sync job that automatically updates call log costs and durations.

## Langfuse Sync Job

### Purpose
The `langfuse-sync.ts` job continuously monitors the `call_logs` table for records with `cost = 0` and updates them with actual cost and duration data from the Langfuse API.

### How it works
1. **Database Query**: Finds one record from `call_logs` where `cost = 0` and has a valid `session_id`
2. **API Call**: Calls the Langfuse metrics API with the session_id to get:
   - `sum_totalCost` → maps to `cost` field
   - `sum_latency` → maps to `duration` field
3. **Database Update**: Updates the call log record with the retrieved values
4. **Loop**: Waits 5 seconds and repeats the process

### Configuration

#### Environment Variables Required
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=zenvoice

# Langfuse API
LANGFUSE_BASIC_AUTH=your_base64_encoded_credentials
```

#### API Request Details
- **Endpoint**: `https://cloud.langfuse.com/api/public/metrics`
- **Method**: GET
- **Time Range**: Current date from 00:00:00 to 23:59:59
- **Filters**: session_id matches the one from database
- **Metrics**: totalCost (sum), totalTokens (sum), latency (sum)

### Running the Job

#### Prerequisites
1. Install PM2 globally: `npm install -g pm2`
2. Build the project: `npm run build`
3. Ensure environment variables are set

#### Using the Management Script
The project includes a management script for easy job control:

```bash
# Deploy (build and start)
./manage-langfuse-sync.sh deploy

# View logs
./manage-langfuse-sync.sh logs

# Check status
./manage-langfuse-sync.sh status

# Restart job
./manage-langfuse-sync.sh restart

# Stop job
./manage-langfuse-sync.sh stop

# Delete job
./manage-langfuse-sync.sh delete
```

#### Manual PM2 Commands
```bash
# Start the job
pm2 start ecosystem.config.js --only langfuse-sync

# View logs
pm2 logs langfuse-sync

# Monitor
pm2 monit

# Stop the job
pm2 stop langfuse-sync

# Restart the job
pm2 restart langfuse-sync
```

### Monitoring

#### Logs
Logs are stored in:
- `./logs/langfuse-sync.log` - Combined logs
- `./logs/langfuse-sync-out.log` - Standard output
- `./logs/langfuse-sync-error.log` - Error logs

#### Log Messages
- `✅ Updated call log for session {sessionId}` - Successful update
- `🔄 Processing session: {sessionId}` - Starting to process a session
- `No call log found with cost = 0` - No records to process
- `No data returned from Langfuse` - API returned empty results

### Error Handling
- Database connection errors will terminate the process
- API errors are logged but don't stop the job
- Graceful shutdown on SIGINT/SIGTERM signals
- Automatic restart via PM2 on crashes

### Performance Considerations
- Processes one record at a time to avoid API rate limits
- Uses database indexes on `sessionId` for efficient queries
- 5-second delay between iterations to prevent excessive API calls
- Memory limit set to 1GB in PM2 configuration

### Troubleshooting

#### Common Issues
1. **"No call log found with cost = 0"**
   - All records have been processed or no records exist
   - This is normal behavior when all costs are updated

2. **"Error calling Langfuse API"**
   - Check LANGFUSE_BASIC_AUTH environment variable
   - Verify API credentials and permissions
   - Check network connectivity

3. **Database connection errors**
   - Verify database environment variables
   - Ensure PostgreSQL is running and accessible
   - Check database credentials and permissions

#### Debugging
```bash
# View detailed logs
pm2 logs langfuse-sync --lines 100

# Check PM2 process status
pm2 status

# View error logs only
tail -f ./logs/langfuse-sync-error.log
```

### Development

#### Running in Development
```bash
# Compile TypeScript
npm run build

# Run directly with Node.js
node dist/jobs/langfuse-sync.js

# Or use PM2 in development mode
pm2 start ecosystem.config.js --env development --only langfuse-sync
```

#### Making Changes
1. Edit `src/jobs/langfuse-sync.ts`
2. Build the project: `npm run build`
3. Restart the job: `./manage-langfuse-sync.sh restart`

### File Structure
```
server/
├── src/jobs/
│   ├── langfuse-sync.ts          # Main job script
│   └── README.md                 # This documentation
├── ecosystem.config.js           # PM2 configuration
├── manage-langfuse-sync.sh       # Management script
└── logs/                         # Log files
    ├── langfuse-sync.log
    ├── langfuse-sync-out.log
    └── langfuse-sync-error.log
```
