import clientPromise from "@/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";

type PriceType = {
    id: any,
    price: number,
    product: string,
    date: any,
    address: string,
    location: {
        coordinates: [number, number] // [longitude, latitude]
    }
};

type InsertItemsType = {
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
        let lat: string | number | null = searchParams.get('lat')
        let lng: string | number | null = searchParams.get('lng')
        const searchedProduct = searchParams.get('product')

        let matches = (await (await GetCollection()).find({}).toArray())[0].prices;

        // // Check if lat and/or lng are defined in the request
        // const pipeline = [{
        //     $geoNear: {
        //         near: { type: "Point", coordinates: [101.6164017, 3.1480670] },
        //         distanceField: "dist.calculated",
        //         maxDistance: radiusInKilometers * 1000,
        //         spherical: true,
        //     }
        // }]

        // const collection = await GetCollection();
        // collection.createIndex({ 'prices.location.coordinates': '2dsphere' });
        // const matches = await collection.aggregate(pipeline).toArray();

        if (lat && lng && !searchedProduct) {
            return new Response(JSON.stringify(matches))
        }

        if (lat && lng) {
            const numLat = Number(lat)
            const numLng = Number(lng)

            matches = matches.filter((item: PriceType) => {
                const [targetlong, targetLat] = item.location.coordinates;

                const distance = calculateDistance(numLat, numLng, targetLat, targetlong);
                return distance <= radiusInKilometers * 1000;
            })
        }

        if (searchedProduct) {
            matches = matches.filter((item: PriceType) => {
                return item.product.toLowerCase().includes(searchedProduct.toLowerCase())
            })
        }

        return new Response(JSON.stringify(matches))

    }
    catch (err) {
        console.log(err)
        return new Response(JSON.stringify({ error: err }))
    }
}

export async function POST(req: Request) {
    const client = (await clientPromise) as MongoClient
    try {
        const db = client.db("prices");
        const collection = db.collection('prices')

        const items = await req.json()
        const { products, price, address, lat, lng, dateStr }: InsertItemsType = items

        const updateData = {
            id: new ObjectId(),
            address: address,
            price: price,
            product: products,
            date: new Date(dateStr),
            location: {
                type: "Point",
                coordinates: [lng, lat]
            }
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
