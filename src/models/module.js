const mongoose = require("../config/MongoConnection.js");
const monsgesss = require("mongoose")
const Schema = require("../schema/Newschema.js");
const { idCounter } = require("../helper/counter");
const NodeCache = require('node-cache');
const fs = require('fs');
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
async function getDataFromDynamicCollection(modal, query) {
    // Generate a unique cache key based on collection name and query
    const cacheKey = `${modal.collection.collectionName}-${JSON.stringify(query)}`;

    // Try to fetch cached data
    const cachedData = myCache.get(cacheKey);

    if (cachedData !== undefined) {
        console.log('Data fetched from cache');
        return cachedData;
    }

    // If not found in cache, get from MongoDB
    // const dynamicModel = connection.model(collectionName, schema);

    const data = await modal.aggregate(query, { allowDiskUse: true });

    // Cache the fetched data
    myCache.set(cacheKey, data);

    console.log('Data fetched from MongoDB');
    return data;
}




exports.AggregateFetchData = async (collectionName, schema, query, res) => {

    return new Promise(function (resolve, reject) {
        let Schemavar = Schema[schema] || Schema.any
        let model
        if (mongoose.models[collectionName]) {
            model = mongoose.model(collectionName);
        }
        else {

            model = mongoose.model(collectionName, Schemavar);
        }
        console.log(model);
        console.log('model.....................123');

        model.aggregate(query).allowDiskUse(true).then((result) => {
            console.log(result);
            resolve(result);
        })
            .catch((err) => {
                console.log(err);
                reject(err);
            })
    });
};
exports.SearchAggregateFetchData = async (collectionName, schema, query, res) => {

    return new Promise(function (resolve, reject) {
        let Schemavar = Schema[schema] || Schema.any
        let model = mongoose.model(collectionName, Schemavar);
        console.log(model);
        console.log('model.....................123');

        model.find(query).allowDiskUse(true).then((result) => {
            console.log(result);
            resolve(result);
        })
            .catch((err) => {
                console.log(err);
                reject(err);
            })
    });
};

exports.AggregateFetchDatady = async (collectionName, schema, query, res) => {
    return new Promise(function (resolve, reject) {


        let model = mongoose.model(collectionName, Schema[schema]);

        console.log(model.schema.obj);
        console.log('model.....................');

        // Analyze the schema to find fields with fk = 'yes'
        // This might involve fetching the schema or having it predefined
        // For each such field, add a $lookup stage to your query
        for (let fieldname in model.schema.obj) {
            let field = model.schema.obj[fieldname];
            console.log(field);
            console.log('field.....................');
            if (field.options.fk === 'yes') {
                const lookupStage = {
                    $lookup: {
                        from: 'tbl_voucher_ledger', // This should be dynamic based on your schema
                        localField: field.voucher_ledger_id, // The field in the current collection
                        foreignField: 'voucher_ledger_id', // The field in the foreign collection
                        as: field.name + 'GL_account' // The name for the output array
                    }
                };
                query.push(lookupStage);
            }
        }

        console.log(model);
        console.log('model.....................');

        model.aggregate(query).allowDiskUse(true).then((result) => {
            console.log(result);
            resolve(result);
        })
            .catch((err) => {
                console.log(err);
                reject(err);
            })
    });
};


exports.AddData = async (collectionName, schema, data, res) => {

    return new Promise(async function (resolve, reject) {
        // console.log(query);
        let Schemavar = Schema[schema] || Schema.any
        let model = mongoose.model(collectionName, Schemavar);
        if (Array.isArray(data)) {
            // data.map(async (item, idx) => {
            //     idx === 0 ? item.id = await idCounter(model, 'id') : item.id = data[idx - 1].id + 1;
            // })
            for (let i = 0; i < data.length; i++) {

                data[i];
                if (i === 0) {
                    console.log(await idCounter(model, 'id'));

                }
                i === 0 ? data[i].id = await idCounter(model, 'id') : data[i].id = data[i - 1].id + 1

            }
            console.log(data);
            model.insertMany(data).then((result) => {
                resolve(result);
            })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                })
        } else {
            data.ids = await idCounter(model, 'ids');
            console.log(data);
            model.insertMany([data]).then((result) => {
                resolve(result);
            })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                })

        }
    });

};

exports.Update_If_Avilable_Else_Insert_master = async (collectionName, schema, data, req) => {


    let logSchema = Schema.logSchema;

    const Log = mongoose.model('Log', logSchema);

    return new Promise(async function (resolve, reject) {
        if (mongoose.models[collectionName]) {
            delete mongoose.models[collectionName];
            // delete mongoose.modelSchemas[collectionName];
        }
        let model
        if (typeof schema == "object") {
            model = mongoose.model(collectionName, mongoose.Schema(schema));
        }
        else {

            let finalschema = Schema[schema] || Schema["any"];
            model = mongoose.model(collectionName, finalschema);
        }

        const writeLogToFile = (logEntry) => {
            fs.appendFile('log.txt', JSON.stringify(logEntry) + '\n', (err) => {
                if (err) throw err;
            });
        };

        const logAction = async (action, table, documentId, previousChanges, newData, ipAddress) => {
            let logEntry = new Log({
                action: action,
                tableName: table,
                documentId: documentId,
                previousField: previousChanges,
                updateFields: newData,
                ipadress: ipAddress
            });
            await logEntry.save();
            writeLogToFile(logEntry);
        };

        var isUpdate = data.id != null && data.id != '';
        let originalData = null;

        if (isUpdate) {
            originalData = await model.findOne({ id: data.id }).lean();
            if (!originalData) {
                isUpdate = false;
            }
        }


        const detectChanges = (original, updated) => {
            let changes = {};
            Object.keys(updated).forEach(key => {
                if (!original.hasOwnProperty(key) || original[key] !== updated[key]) {
                    if (typeof updated[key] === 'object' && updated[key] !== null) {
                        const subChanges = detectChanges(original[key] || {}, updated[key]);
                        if (Object.keys(subChanges).length > 0) {
                            changes[key] = subChanges;
                        }
                    } else {
                        changes[key] = updated[key];
                    }
                }
            });

            // Check if 'tableName' has changed
            if (original.tableName !== updated.tableName) {
                changes.tableName = {

                    tableName: updated.tableName,
                };
            }

            return changes;
        };



        if (isUpdate) {

            // Check if it's a delete operation
            if (data.isDelete === 2 && data.id) {
                // Log the "delete" action and include the document ID
                const ipAddress = "10.20.0.161";
                const documentId = data.id;

                logAction('delete', data.tableName, documentId, {}, {}, ipAddress);
                resolve({ message: 'Document deleted' });
            } else {
                // It's an update operation
                model.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).then((result) => {
                    //const ipAddress = req.ip || req.connection.remoteAddress;
                    const ipAddress = "13.12.0.16";
                    const updatedData = result.toObject();
                    const changes = detectChanges(originalData, updatedData);

                    // Filter and keep only the updated fields in previousChanges
                    let previousFields = {};

                    // Iterate through updated fields and check if they were changed
                    for (let key in data) {
                        if (originalData[key] !== data[key]) {
                            previousFields[key] = originalData[key];
                        }
                    }

                    const fieldsToExclude = ['createdDate', 'updatedDate'];
                    fieldsToExclude.forEach(field => {
                        delete previousFields[field];
                        delete changes[field];
                    });


                    logAction('update', data.tableName, data.id, previousFields, changes, ipAddress);
                    resolve(result);
                }).catch((err) => {
                    console.log(err);
                    reject(err);
                });
            }
        }
        else {
            data.id == "" ? data.id = await idCounter(model, 'id') : "";
            let newData = new model(data);
            //    try {
            //  let data=await model.findOneAndUpdate({ id: data.id ,status:Number(process.env.ACTIVE_STATUS)}, data, { new: true, upsert: true })
            //  const ipAddress = "122222222222";
            //  //const ipAddress = "122222222222"
            //  console.log(savedData);
            //  console.log('savedata');

            //  // Since it's an insert, previousChanges should be an empty object
            //  let previousChanges = {};

            //   await logAction('insert', savedData.tableName, savedData.id, previousChanges, {}, ipAddress);
            //     if (data) {
            //         resolve(data);
            //     }
            //    } catch (error) {
            //     resolve(error);
            //    }


            newData.save().then(async (savedData) => {
                const ipAddress = "122222222222";
                //const ipAddress = "122222222222"
                console.log(savedData);
                console.log('savedata');

                // Since it's an insert, previousChanges should be an empty object
                let previousChanges = {};

                await logAction('insert', savedData.tableName, savedData.id, previousChanges, {}, ipAddress);

                resolve(savedData);
            }).catch((err) => {
                console.log(err);
                reject(err);
            });
        }
    });
};
exports.Update_If_Avilable_Else_Insert_master_Bulk = async (collectionName, schema, dataArray, req) => {
    const Log = mongoose.model('Log', Schema.logSchema);
    if (mongoose.models[collectionName]) {
        delete mongoose.models[collectionName];
        // delete mongoose.modelSchemas[collectionName];
    }
    const model = mongoose.models[collectionName] || mongoose.model(collectionName, mongoose.Schema(schema));
    let id = await idCounter(model, 'id')
    let bulkOps = [];
    let logBulkOps = [];
    const writeLogToFile = (logEntry) => {
        fs.appendFile('log.txt', JSON.stringify(logEntry) + '\n', (err) => {
            if (err) throw err;
        });
    };
    const detectChanges = (original, updated) => {
        let changes = {};
        Object.keys(updated).forEach(key => {
            if (!original.hasOwnProperty(key) || original[key] !== updated[key]) {
                if (typeof updated[key] === 'object' && updated[key] !== null) {
                    const subChanges = detectChanges(original[key] || {}, updated[key]);
                    if (Object.keys(subChanges).length > 0) {
                        changes[key] = subChanges;
                    }
                } else {
                    changes[key] = updated[key];
                }
            }
        });

        // Check if 'tableName' has changed
        if (original.tableName !== updated.tableName) {
            changes.tableName = {

                tableName: updated.tableName,
            };
        }

        return changes;
    };
    const logAction = async (action, table, documentId, previousChanges, newData, ipAddress) => {
        let logEntry = new Log({
            action: action,
            tableName: table,
            documentId: documentId,
            previousField: previousChanges,
            updateFields: newData,
            ipadress: ipAddress
        });
        await logEntry.save();
        writeLogToFile(logEntry);
    };
    const prepareLogEntry = (action, table, documentId, previousChanges, newData, ipAddress) => {
        return {
            action,
            tableName: table,
            documentId,
            previousField: previousChanges,
            updateFields: newData,
            ipadress: ipAddress,
            timestamp: new Date()
        };
    };

    for (let idx = 0; idx < dataArray.length; idx++) {
        let data = dataArray[idx]
        var isUpdate = data.id != null && data.id != '';
        let originalData = null;

        if (isUpdate) {
            originalData = await model.findOne({ id: data.id }).lean();
            if (!originalData) {
                isUpdate = false;
            }
        }

        if (isUpdate) {
            // Log the 'update' action
            if (data.isDelete === 2 && data.id) {
                // Log the "delete" action and include the document ID
                const ipAddress = "10.20.0.161";
                const documentId = data.id;

                // logAction('delete', data.tableName, documentId, {}, {}, ipAddress);
                let logEntry = prepareLogEntry('delete', data.tableName, documentId, {}, {}, ipAddress);
                logBulkOps.push({ insertOne: { document: logEntry } });
                resolve({ message: 'Document deleted' });
            } else {
                // It's an update operation
                //const ipAddress = req.ip || req.connection.remoteAddress;
                const ipAddress = "13.12.0.16";
                const updatedData = data;
                const changes = detectChanges(originalData, updatedData);

                // Filter and keep only the updated fields in previousChanges
                let previousFields = {};

                // Iterate through updated fields and check if they were changed
                for (let key in data) {
                    if (originalData[key] !== data[key]) {
                        previousFields[key] = originalData[key];
                    }
                }

                const fieldsToExclude = ['createdDate', 'updatedDate'];
                fieldsToExclude.forEach(field => {
                    delete previousFields[field];
                    delete changes[field];
                });


                // logAction('update', data.tableName, data.id, previousFields, changes, ipAddress);
                let logEntry = prepareLogEntry('update', data.tableName, data.id, previousFields, changes, ipAddress);
                logBulkOps.push({ insertOne: { document: logEntry } });

            }
            // Add to bulk operation
            bulkOps.push({
                updateOne: {
                    filter: { id: data.id },
                    update: data,
                    upsert: true
                }
            });
        } else {
            if (idx == 0 && (data.id == "" || data.id == null)) {
                console.log("id Generation")
                console.log(id);
                data.id = id
                // finalarray.push(data)
            }

            else {
                console.log("Id Increment");
                console.log(idx);
                console.log("ID", id);
                console.log(dataArray[idx - 1]);
                console.log(Number(dataArray[idx - 1].id));
                console.log(Number(dataArray[idx - 1].id) + 1);
                data.id = Number(dataArray[idx - 1].id) + 1
                // id++
            }
            data.createdDate = new Date(),

                // data.tableName= req.body.tableName,

                data.status = Number(data.status) || Number(process.env.ACTIVE_STATUS),
                data.updatedDate = new Date(),
                data.updatedBy = data.updatedBy || null
                ,
                // logAction('insert', data.tableName, data.id, {}, {}, req.ip);

                bulkOps.push({
                    insertOne: {
                        document: data
                    }
                });
            let logEntry = prepareLogEntry('insert', data.tableName, data.id, {}, {}, req.ip);
            logBulkOps.push({ insertOne: { document: logEntry } });
        }
    }

    try {
        console.log('Starting bulk operation');
        // const result = await model.bulkWrite(bulkOps, { ordered: false });
        // console.log('Bulk operation completed', result);
        const reseults = Promise.all([model.bulkWrite(bulkOps, { ordered: false }), Log.bulkWrite(logBulkOps, { ordered: false })]);

        // Log bulk operation results
        // [Insert your logging logic here]

        return reseults;
    } catch (err) {
        console.error('Error during bulk operation', err);
        // Log the error
        // [Insert your logging logic here]

        // Handle or rethrow the error as needed
        throw err;
    }
};

// exports.Update_If_Avilable_Else_Insert_master_Bulk = async (collectionName, schema, dataArray, req) => {
//     let logSchema = Schema.logSchema;
//     console.log("gfgggggggggggggggggggggggggggggggggggggggg")
//     const Log = mongoose.model('Log', logSchema);
//     let finalschema = Schema[schema] || Schema["any"];
//     let modell
//    if (typeof schema == 'object') {
//     if (mongoose.models[collectionName]) {
//         modell = mongoose.model(collectionName);

//     } else {
//         modell = mongoose.model(collectionName, mongoose.Schema(schema));
//     }

//    }
//    else {
//     if (mongoose.models[collectionName]) {
//         modell = mongoose.model(collectionName);
//     } else {
//         modell = mongoose.model(collectionName, finalschema);
//     }
//    }
//     console.log(modell)
//     let model = modell;
//     let id = await idCounter(model, 'id')
//     let finalarray = []
//     return Promise.all(dataArray.map(async (data, idx) => {

//         // [Rest of the original code remains the same]
//         const writeLogToFile = (logEntry) => {
//             fs.appendFile('log.txt', JSON.stringify(logEntry) + '\n', (err) => {
//                 if (err) throw err;
//             });
//         };

//         const logAction = async (action, table, documentId, previousChanges, newData, ipAddress) => {
//             let logEntry = new Log({
//                 action: action,
//                 tableName: table,
//                 documentId: documentId,
//                 previousField: previousChanges,
//                 updateFields: newData,
//                 ipadress: ipAddress
//             });
//             await logEntry.save();
//             writeLogToFile(logEntry);
//         };
//         var isUpdate = data.id != null && data.id != '';
//         let originalData = null;

//         if (isUpdate) {
//             originalData = await model.findOne({ id: data.id }).lean();
//             if (!originalData) {
//                 isUpdate = false;
//             }
//         }

//         // [Rest of the original code remains the same]
//         const detectChanges = (original, updated) => {
//             let changes = {};
//             Object.keys(updated).forEach(key => {
//                 if (!original.hasOwnProperty(key) || original[key] !== updated[key]) {
//                     if (typeof updated[key] === 'object' && updated[key] !== null) {
//                         const subChanges = detectChanges(original[key] || {}, updated[key]);
//                         if (Object.keys(subChanges).length > 0) {
//                             changes[key] = subChanges;
//                         }
//                     } else {
//                         changes[key] = updated[key];
//                     }
//                 }
//             });

//             // Check if 'tableName' has changed
//             if (original.tableName !== updated.tableName) {
//                 changes.tableName = {

//                     tableName: updated.tableName,
//                 };
//             }

//             return changes;
//         };

//         if (isUpdate) {
//             if (data.isDelete === 2 && data.id) {
//                 // Log the "delete" action and include the document ID
//                 const ipAddress = "10.20.0.161";
//                 const documentId = data.id;

//                 logAction('delete', data.tableName, documentId, {}, {}, ipAddress);
//                 resolve({ message: 'Document deleted' });
//             } else {
//                 // It's an update operation
//                 model.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).then((result) => {
//                     //const ipAddress = req.ip || req.connection.remoteAddress;
//                     const ipAddress = "13.12.0.16";
//                     const updatedData = result.toObject();
//                     const changes = detectChanges(originalData, updatedData);

//                     // Filter and keep only the updated fields in previousChanges
//                     let previousFields = {};

//                     // Iterate through updated fields and check if they were changed
//                     for (let key in data) {
//                         if (originalData[key] !== data[key]) {
//                             previousFields[key] = originalData[key];
//                         }
//                     }

//                     const fieldsToExclude = ['createdDate', 'updatedDate'];
//                     fieldsToExclude.forEach(field => {
//                         delete previousFields[field];
//                         delete changes[field];
//                     });


//                     logAction('update', data.tableName, data.id, previousFields, changes, ipAddress);
//                     // resolve(result);
//                     return result;
//                 }).catch((err) => {
//                     console.log(err);
//                     throw err;
//                 });
//             }
//         } else {
//             //   idx==0&&data.id == "" ? data.id = await idCounter(model, 'id') ,id=data.id: "";
//             if (idx == 0 && (data.id == "" || data.id == null)) {
//                 console.log("id Generation")
//                 console.log(id);
//                 data.id = id
//                 finalarray.push(data)
//             }
//             else {
//                 console.log("Id Increment");
//                 console.log(idx);
//                 console.log("ID", id);
//                 console.log(dataArray[idx - 1]);
//                 console.log(Number(dataArray[idx - 1].id));
//                 console.log(Number(dataArray[idx - 1].id) + 1);
//                 data.id = Number(dataArray[idx - 1].id) + 1
//                 // id++
//             }
//             let newData = new model(data);

//             // Save new document logic
//             return newData.save().then(async (savedData) => {
//                 const ipAddress = "122222222222";
//                 //const ipAddress = "122222222222"
//                 console.log(savedData);
//                 console.log('savedata');

//                 // Since it's an insert, previousChanges should be an empty object
//                 let previousChanges = {};

//                 await logAction('insert', savedData.tableName, savedData.id, previousChanges, {}, ipAddress);
//                 return savedData;
//             }).catch((err) => {
//                 console.log(err);
//                 throw err;
//             });
//         }
//     })).then(results => {
//         // Handling all Promise results
//         return results;
//     }).catch(err => {
//         console.error(err);
//         throw err;
//     });
// };


exports.Update_If_Avilable_Else_Insert = async (collectionName, schema, data, indexes, res) => {

    return new Promise(async function (resolve, reject) {
        let finalschema = Schema[schema] || Schema["any"]
        // console.log(query);
        let model = mongoose.model(collectionName, finalschema);
        // model.createIndexes([indexes])
        //     .then(() => console.log('Indexes created'))
        //     .catch((err) => console.error(err))
        indexes && indexes !== null ? finalschema.index(indexes) : finalschema.index({});
        if (Array.isArray(data)) {
            data.map(async (item, idx) => {
                idx === 0 ? item.id = await idCounter(model, 'id') : item.id = data[idx - 1].id + 1;
            })

            model.insertMany(data).then((result) => {
                resolve(result);
            })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                })
        } else {
            data.id == "" ? data.id = await idCounter(model, 'id') : "";
            model.findOneAndUpdate({ id: data.id, status: 1 }, data, { new: true, upsert: true }).then((result) => {
                resolve(result);
            })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                })

        }
    });
};
exports.Update = async (collectionName, schema, condition, data, filter, res) => {
    console.log(collectionName)
    console.log(schema);
    console.log(JSON.stringify(condition))
    console.log(JSON.stringify(data));
    let arrayfilter = filter || {}
    return new Promise(function (resolve, reject) {
        // console.log(query);
        let model = mongoose.model(collectionName, Schema[schema]);
        model.updateMany(condition, data, arrayfilter).then((result) => {
            resolve(result);
        })
            .catch((err) => {
                console.log(err);
                reject(err);
            })

    });
};
exports.CheckUniqueData = async (collectionName, schema, KEY, value, res) => {

    return new Promise(function (resolve, reject) {

        let model = monsgesss.model(collectionName, Schema[schema]);
        model.aggregate([{ $match: { [KEY]: value, status: 1 } }]).then((result) => {
            result.length > 0 ? resolve(false) : resolve(true);
            // resolve(result);
        })
            .catch((err) => {
                console.log(err);
                reject(err);
            })
    });
};