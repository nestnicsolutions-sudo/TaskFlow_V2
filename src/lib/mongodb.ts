import { Db, MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_NAME!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}
if (!DB_NAME) {
    throw new Error('Please define the DB_NAME environment variable inside .env');
}

// Global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections from growing exponentially
// during API Route usage.
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function createTtlIndex(db: Db) {
    try {
        const notifications = db.collection('notifications');
        const indexExists = await notifications.indexExists('createdAt_1');
        if (!indexExists) {
            await notifications.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 259200 }); // 3 days
        }
    } catch (error) {
        console.error("Failed to create TTL index for notifications:", error);
    }
}

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  // Create TTL index for notifications
  await createTtlIndex(db);

  return { client, db };
}
