import clientPromise from "@/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI

type PriceType = {
    location: {
        coordinates: [number, number] // [longitude, latitude]
    }
};

type ItemsType = {
    products: string;
    price: number;
    address: string;
    lat: number;
    lng: number;
    dateStr: string
}

async function GetCollection() {
    // Connect the client to the server	(optional starting in v4.7)
    const client = await clientPromise
    // Send a ping to confirm a successful connection
    const db = client.db("prices")
    const collection = db.collection("prices");

    return collection

}

export async function GET(req: Request) {

    try {
        const radiusInKilometers = 10

        const { searchParams } = new URL(req.url)
        const lat = Number(searchParams.get('lat'))
        const lng = Number(searchParams.get('lng'))

        // Initialize an empty query object

        if (!lat || !lng) {
            return new Response(JSON.stringify({ item: null }))
        }

        // Connect to the database
        const potentialMatches = await (await GetCollection()).find({}).toArray();
        console.log(potentialMatches)

        const matches = potentialMatches.flatMap(object =>
            object.prices.filter((item: PriceType) => {
                const [targetlong, targetLat] = item.location.coordinates;
                const distance = calculateDistance(lat, lng, targetlong, targetLat);
                return distance <= radiusInKilometers * 10;
            })
        );

        console.log(matches)


        return new Response(JSON.stringify(matches))
    }
    catch (err) {
        console.log(err)
        return new Response(JSON.stringify(err))
    }
}

export async function POST(req: Request) {
    const client = (await clientPromise) as MongoClient
    try {
        const db = client.db("prices");
        const collection = db.collection('prices')

        const items = await req.json()
        const { products, price, address, lat, lng, dateStr }: ItemsType = items

        const updateData = {
            id: new ObjectId(),
            address: address,
            price: price, // You can replace this with the actual price you want to set
            product: products,
            date: new Date(dateStr),
            coordinates: [lng, lat]
        }

        await collection.updateOne(
            { _id: new ObjectId('658ea1cdaad35de3bc68d19f') },
            { $push: { prices: updateData } }
        );

        //   // Close the database connection
        return new Response(JSON.stringify({ success: 'good' }))
    }
    catch (err) {
        console.log(err)
        return new Response(JSON.stringify({ error: err }))
    }
    finally {
        await client.close()
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
