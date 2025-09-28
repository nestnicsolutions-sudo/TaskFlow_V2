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
        // Ensure the collection exists before trying to create an index.
        // List collections and check if 'notifications' is in the list.
        const collections = await db.listCollections({ name: 'notifications' }).toArray();
        if (collections.length === 0) {
            // If the collection does not exist, create it.
            // This can prevent "ns does not exist" errors.
            await db.createCollection('notifications');
        }

        const notifications = db.collection('notifications');
        const indexExists = await notifications.indexExists('createdAt_1');
        if (!indexExists) {
            await notifications.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 259200 }); // 3 days
        }
    } catch (error) {
        // Log the error but don't crash the app if index creation fails.
        // It might fail in a race condition on first startup, but will succeed on subsequent starts.
        console.error("Failed to create TTL index for notifications, will retry on next connection:", error);
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

  // Create TTL index for notifications without blocking the connection process
  createTtlIndex(db);

  return { client, db };
}
