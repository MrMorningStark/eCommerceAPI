// mongo db
const { MongoClient, ObjectId } = require('mongodb');
const { DB_NAME } = require('../constant');

const URI = process.env.MONGO_DB_URI

var client = null;

function open() {
    client = new MongoClient(URI)
    return client;
}

async function mongoClose() {
    try {
        await client.close();
        client = null;
        return { success: true, message: 'connection closed' }
    } catch (error) {
        return { success: false, message: error.message }
    }
}

const mongoDb = () => {
    var myClient;
    if (client == null) {
        myClient = open();
    } else {
        myClient = client;
    }
    const dbo = myClient.db(DB_NAME)
    return dbo;
}

const getMongodbQuery = (query) => {
    var mongodbQuery = []
    const operators = ["=", "!=", "<", "<=", ">", ">="];
    const mongodbOperators = ["$eq", "$ne", "$lt", "$lte", "$gt", "$gte"];
    const getSingleQuery = (start, operator, end) => {
        if (start == '_id') {
            end = new ObjectId(end)
        }
        for (let i = 0; i < operators.length; i++) {
            if (operator == operators[i]) {
                return { [start]: { [mongodbOperators[i]]: end } }
            }
        }
        return {};
    }
    if (query == undefined) {
        return {}
    }
    else if (typeof (query[0]) == 'string') {
        return getSingleQuery(query[0], query[1], query[2])
    }
    else if (query.length == 0) {
        return {}
    }
    else {
        query.map(singleQuery => {
            mongodbQuery.push(getSingleQuery(singleQuery[0], singleQuery[1], singleQuery[2]))
        })
        if (query.length == 1) {
            return mongodbQuery[0]
        } else {
            return { $and: mongodbQuery }
        }
    }
}

const createCollection = async (tableName) => {
    await mongoDb().createCollection(tableName);
}

const isCollectionExists = async (tableName) => {
    const collection = await mongoDb().listCollections({ name: tableName }).toArray()
    return collection.length > 0 ? true : false
}

const getDataWithEmbeddedReferenceDocument = async (tableName, query, lookup) => {


    try {

        const data = await mongoDb().collection(tableName).aggregate(
            [
                {
                    $match: getMongodbQuery(query)
                },
                {
                    $unwind: {
                        path: '$' + lookup.link_field, preserveNullAndEmptyArrays: true
                    }
                },
                { $addFields: { [lookup.link_field]: { $toObjectId: "$" + lookup.link_field } } },
                {
                    $lookup: {
                        from: lookup.link_collection,
                        localField: lookup.link_field,
                        foreignField: '_id',
                        as: lookup.link_field,
                    },

                },
                {
                    $facet: {
                        rootObj: [
                            {
                                $limit: 1
                            }
                        ],
                        [lookup.link_field]: [
                            {
                                $group: {
                                    _id: '$_id',
                                    [lookup.link_field]: {
                                        $push: {
                                            $first: '$' + lookup.link_field
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },


                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                {
                                    $first: '$rootObj'
                                },
                                {
                                    $first: '$' + lookup.link_field
                                }
                            ]
                        }
                    }
                },

            ],
        ).toArray()
        return data

    }
    catch (e) {
        console.log(e)
        return [];
    }


}



module.exports = {
    mongoDb,
    mongoClose,
    getMongodbQuery,
    createCollection,
    isCollectionExists,
    getDataWithEmbeddedReferenceDocument
}