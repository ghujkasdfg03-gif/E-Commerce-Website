import mongoose from "mongoose";

// MongoDB connection URI from environment variables
// Note: We read the env var lazily inside connectToDatabase() so that
// `next build` can collect page data without requiring the variable at
// build time (it is only needed at runtime).

/**
 * Global cache for the Mongoose connection.
 * In development, Next.js hot-reloads and re-executes modules,
 * which would create multiple connections without this cache.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the Node.js global type to include our mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

// Persist the cache on the global object so it survives hot reloads
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB. Returns a cached connection if one already exists.
 * This prevents multiple connections during Next.js hot reloads in dev mode.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error(
      "Please define the MONGO_URI environment variable inside .env.local"
    );
  }

  // Create a new connection promise if one doesn't exist
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset promise on failure so the next call retries
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
