import { MongoClient, Db, Collection } from "mongodb";

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is undefined");
}

const DB_NAME = "lottery-scratcher";
export const SNAPSHOTS_COLLECTION = "cs391-final";

let client: MongoClient | null = null;
let db: Db | null = null;

async function connect(): Promise<Db> {
    if (!client) {
        const tempClient = new MongoClient(MONGO_URI);
        try {
            await tempClient.connect();
            client = tempClient;
        } catch (err) {
            console.error("Error connecting to MongoDB:", err);
            client = null;
            throw err;
        }
    }
    return client.db(DB_NAME);
}

export default async function getCollection(
    collectionName: string,
): Promise<Collection> {
    if (!db) {
        db = await connect();
    }
    return db.collection(collectionName);
}