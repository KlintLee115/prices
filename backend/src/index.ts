import express, { Request, Response } from 'express';

require('dotenv').config();
const cors = require('cors')
const db = require('./postgres-config')

const app = express()

const domain = "https://easyprices.vercel.app"

const corsOptions = {
    origin: function (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
        if (origin == domain || origin == "http://localhost:3000" || origin == "http://localhost:3001" ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};


app.use(express.json())
app.use(cors(corsOptions))

app.get('/', (_: Request, res: Response) => {
    res.send('connection successfuly')
})

enum FeedbackType {
    Like = "Like", Dislike = "Dislike"
}

const INSERT_INTO_PRICES_TABLE = (price: any, address: string, lat: any, lng: any, date: string, by: string, product: string) => {

    return {
        text: 'INSERT INTO public.prices ("price", "address", "lat", "lng", "date", "by", "product") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        values: [price, address, lat, lng, date, by, product]
    }
}

const UPDATE_FEEDBACK = (id: number, feedback: FeedbackType, action: number) => {

    const queryFeedbackPart = feedback === FeedbackType.Like ? '"likes" = "likes" ' : '"dislikes" = "dislikes" '
    return {
        text: 'UPDATE public.prices SET ' + queryFeedbackPart + (action === 1 ? '+1' : '-1') + ' WHERE id = $1;',
        values: [id]
    }
}

const CREATE_USER = (email: string) => {
    return {
        text: 'INSERT INTO public."pricesUsers" ("email", "posts", "likes", "dislikes") VALUES ($1, $2, $3, $4)',
        values: [email, [], [], []]
    }
}

const FIND_USER = (email: string) => {
    return {
        text: 'SELECT * FROM public."pricesUsers" WHERE "email" = $1',
        values: [email]
    }
}

const UPDATE_USER_FEEDBACK_ARRAY = (email: string, id: number, feedback: FeedbackType, action: "Add" | "Remove") => {
    const arrayType = feedback === FeedbackType.Like ? "likes" : "dislikes";
    return {
        text: `UPDATE public."pricesUsers" SET ${arrayType} = ${action === "Add" ? `array_append(${arrayType}, $1)` : `array_remove(${arrayType}, $1)`
            } WHERE "email" = $2;`,
        values: [id, email]
    };
}


app.get('/getUserInfo', (req: Request, res: Response) => {
    const { email } = req.query as { email: string }

    db.pool.query(FIND_USER(email),
        (err: Error, result: any) => {
            if (err) throw err
            res.status(200).json(result.rows[0])
        })
})

app.get('/getPosts', (req: Request, res: Response) => {
    type queryType = string | undefined
    const { likes, dislikes, posts } = req.query as { likes: queryType, dislikes: queryType, posts: queryType }

    const likesAsNumArray = likes && likes.split(',').map(like => parseInt(like))
    const dislikesAsNumArray = dislikes && dislikes.split(',').map(dislike => parseInt(dislike))
    const postsAsNumArray = posts && posts.split(',').map(post => parseInt(post))

    const getLikesQuery = {
        text: 'SELECT * FROM public.prices WHERE id= ANY($1)',
        values: [likesAsNumArray],
    };

    const getDislikesQuery = {
        text: 'SELECT * FROM public.prices WHERE id= ANY($1)',
        values: [dislikesAsNumArray],
    };

    const getPostsQuery = {
        text: 'SELECT * FROM public.prices WHERE id= ANY($1)',
        values: [postsAsNumArray],
    };

    Promise.all([
        likes && db.pool.query(getLikesQuery),
        dislikes && db.pool.query(getDislikesQuery),
        posts && db.pool.query(getPostsQuery)])
        .then(result => {

            const response = {
                likes: result[0] ? result[0].rows : [],
                dislikes: result[1] ? result[1].rows : [],
                posts: result[2] ? result[2].rows : [],
            };

            res.json(response);
        }).catch((err: { message: string }) => {
            console.log(err)
            res.status(500).json({ error: err });
        })

})

app.get('/getPricesData', (req: Request, res: Response) => {
    const executeQuery = (query: string, queryValues: any[] = []) => {
        db.pool.query(query, queryValues, (err: Error, results: any) => {
            if (err) throw err;
            console.log(results.rows)
            res.json(results.rowCount > 0 ? results.rows : []);
        });
    };

    type QueryType = {
        lat?: string,
        lng?: string,
        product?: string,
        radius?: string,
        sortType?: string,
    }

    let { lat, lng, product, radius, sortType } = req.query as QueryType

    radius = radius ?? "5"
    sortType = sortType ?? "Price_LTH"

    if (
        (lat && lng) ||
        (!lat && !lng)
    ) {
        let query: string
        let values: any[] = []

        if (lat && lng && radius && sortType) {
            query = `WITH distances AS (
            SELECT *,
                (6371 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) + sin(radians($1)) * sin(radians(lat)))) AS distance,
                (likes - dislikes) AS rating
            FROM public.prices
            ${product ? `WHERE product ILIKE '%${product}%'` : ""}
        )
        SELECT *
        FROM distances
        WHERE distance <= $3
        ORDER BY ${sortType.startsWith("Price") ? 'price' : 'rating'} 
        ${sortType.endsWith('LTH') ? ' ASC' : ' DESC'}`

            values = [parseFloat(lat), parseFloat(lng), parseInt(radius)]
        }
        else {
            query = "SELECT * FROM public.prices"
        }

        console.log(query)

        executeQuery(query, values)
    }

    else res.status(404).send({error:"All searched parameters must be defined, or all undefined"})

})

app.post('/insertNewPrice', (req: Request, res: Response) => {
    const { price, address, lat, lng, dateStr, by, products } = req.body

    db.pool.query(INSERT_INTO_PRICES_TABLE(price, address, lat, lng, dateStr, by, products), (err: Error, results: any) => {
        if (err) throw err
        if (results) res.sendStatus(200)
    })
})


app.post('/getUserFeedbacks', async (req, res) => {
    try {
        const { email }: { email: string } = req.body

        const feedback: number[] = (await db.pool.query(`SELECT likes, dislikes FROM public."pricesUsers" WHERE "email" = '${email}'`)).rows[0]

        res.json({ feedback })
    }

    catch (err) {
        res.sendStatus(500)
    }
})

app.patch('/feedback', async (req, res) => {

    try {
        const { id, feedbackType, email, action }: { action: number, id: number, feedbackType: FeedbackType, email: string } = req.body

        if (feedbackType !== FeedbackType.Like && feedbackType !== FeedbackType.Dislike) {
            throw "Invalid feedback"
        }

        if (action !== 1 && action !== -1) {
            throw "Invalid feedback"
        }

        db.pool.query(UPDATE_FEEDBACK(id, feedbackType, action), (err: Error) => {
            if (err) {
                res.sendStatus(500)
                return
            }
            db.pool.query(UPDATE_USER_FEEDBACK_ARRAY(email, id, feedbackType, action === 1 ? "Add" : "Remove"), (err: Error) => {
                if (err) {
                    res.sendStatus(500);
                    return
                }
                res.sendStatus(200);
            })
        })
    }
    catch (err) {
        res.sendStatus(500)
    }
})

app.listen(process.env.PORT || 3001, () => {
    console.log('connected')
})

