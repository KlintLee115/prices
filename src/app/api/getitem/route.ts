import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI
let client: MongoClient | undefined

type CoordinatesType = {
    lat?: number,
    lng?: number
}

type PriceType = {
    location: {
        coordinates: [number, number] // [longitude, latitude]
    }
};

async function GetCollection() {
    // Connect the client to the server	(optional starting in v4.7)
    if (!client) {
        client = new MongoClient('mongodb+srv://klintmongo:Motherorange1@prices.o0nfqfl.mongodb.net/', {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        await client.connect();
    }
    // Send a ping to confirm a successful connection
    const db = client.db("prices")
    const collection = db.collection("prices");

    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    return collection

}

export async function POST(req: Request) {

    try {
        const radiusInKilometers = 10

        const filters = await req.json()
        const { lat, lng }: CoordinatesType = filters

        // Initialize an empty query object

        if (!lat || !lng) {
            return new Response(JSON.stringify({ item: null }))
        }

        // Connect to the database
        const potentialMatches = await(await GetCollection()).find({}).toArray();

        const matches = potentialMatches.flatMap(object =>
            object.prices.filter((item: { location: { coordinates: [number, number]; }; }) => {
                const [targetlong, targetLat] = item.location.coordinates;
                const distance = calculateDistance(lat, lng, targetlong, targetLat);
                return distance <= radiusInKilometers * 10;
            })
        );


        return new Response(JSON.stringify(matches))
    }
    catch (err) {
        console.log(err)
        return new Response(JSON.stringify(err))
    }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // metres
    const v1 = lat1 * Math.PI / 180; // φ, λ in radians
    const v2 = lat2 * Math.PI / 180;
    const lat = (lat2 - lat1) * Math.PI / 180;
    const long = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(lat / 2) * Math.sin(lat / 2) +
        Math.cos(v1) * Math.cos(v2) *
        Math.sin(long / 2) * Math.sin(long / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

//   // Check if lat and/or lng are defined in the request
//         const pipeline = [{
//             $geoNear: {
//                 near: { type: "Point", coordinates: [-114.0901301, 51.06331180000001] },
//                 distanceField: "dist.calculated",
//                 maxDistance: radiusInKilometers * 100,
//                 spherical: true,
//             }
//         }]

//         // Connect to the database
//         const collection = await GetCollection();
//         // collection.createIndex({ 'prices.location.coordinates': '2dsphere' });
//         const data = await collection.aggregate(pipeline).toArray();
//         // const data = await collection.find({}).limit(5).toArray(); // Fetch a few sample documents
