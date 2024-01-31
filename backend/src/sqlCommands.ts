const ADD_COLUMN = (colName: string, colType: any) => {
    return {
        text: 'ALTER TABLE public.users ADD COLUMN $1 $2',
        values: [colName, colType]
    }
}

const SELECT_PRODUCTS = (ids: any[], name: string, min: any, max: any, sortType: string, subDirs: any[]) => {

    let query = "SELECT * FROM public.products"

    let clauses = []

    const nameClause = `\"itemName\" ILIKE '%${name}%'`
    const minClause = `\"price\">=${parseFloat(min)}`
    const maxClause = `\"price\"<=${parseFloat(max)}`

    const sortOrder = sortType === "LOW_TO_HIGH" ? "ASC" : "DESC"
    const sortClause = ` ORDER BY \"price\" ${sortOrder}`

    if (ids) {
        const idsClause = `\"id\" IN (${ids.join(",")})`
        clauses.push(idsClause)
    }
    else {
        if (name) clauses.push(nameClause)
        if (min) clauses.push(minClause)
        if (max) clauses.push(maxClause)
        if (subDirs) {
            for (let idx = 0; idx < subDirs.length; idx++) {
                const newClause = `\"subDir${idx}\"='${subDirs[idx]}'`
                clauses.push(newClause)
            }
        }
    }

    if (clauses.length > 0) {
        query += " WHERE " + clauses.join(" AND ")
    }

    if (sortType) query += sortClause
    query += ";"

    return query
}

const SELECT_ALL_USERS = () => "SELECT * FROM public.users"

const INSERT_INTO_PRODUCTS_TABLE = (itemName: string, authorLink: string, authorName: string, imgCredit: string, imgSrc: string) => {
    return {
        text: 'INSERT INTO public.products("itemName", "authorLink", "authorName", "imageCredit", "imageSrc" VALUES $1 $2 $3 $4 $5',
        values: [itemName, authorLink, authorName, imgCredit, imgSrc]
    }
}

const SELECT_DISTINCT_VAL_FROM_COLUMN = (colName: string) => (
    `SELECT DISTINCT \"${colName}\" FROM public.products;`
);

const SELECT_COL_WHERE_DIR_OVERLAP = (upperDirVals: any[]) => {
    const amtUpperDivs = upperDirVals.length

    let query = `SELECT DISTINCT \"subDir${amtUpperDivs}\" FROM public.products`

    const clauses = []

    for (let idx = 0; idx < amtUpperDivs; idx++) {
        const newClause = `\"subDir${idx}\"='${upperDirVals[idx]}'`
        clauses.push(newClause)
    }

    return query += " WHERE " + clauses.join(" AND ") + ";"
}

const CHECK_IF_COLUMN_EXIST = (colName: string) => (
    `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'products'
              AND column_name = '${colName}'
    );`
)

/*
    Users
*/

const CREATE_USER = (email: string, password: string) => {
    return {
        text: 'INSERT INTO public.users( "email", "password") VALUES $1 $2',
        values: [email, password]
    }
}

const LOGIN_USER = (email: string, password: string) => (
    `SELECT * FROM public.users WHERE email='${email}' 
    AND password='${password}';`
);

module.exports = {
    CHECK_IF_COLUMN_EXIST,
    LOGIN_USER,
    CREATE_USER,
    SELECT_COL_WHERE_DIR_OVERLAP,
    SELECT_DISTINCT_VAL_FROM_COLUMN,
    ADD_COLUMN, INSERT_INTO_PRODUCTS_TABLE, SELECT_PRODUCTS,
    SELECT_ALL_USERS
}