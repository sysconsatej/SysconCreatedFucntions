const moment = require('moment')
const validate = require('../helper/validate')
const model = require("../models/module")
const mongoose = require('mongoose')
const Schema = require('../schema/Newschema')
const connection = require('../config/MongoConnection')
function findFieldWithNewName(children) {
    for (const child of children) {
        // Check if fields array exists and is an array
        if (Array.isArray(child.fields)) {
            // Use find() to search for the field with a 'newName' key
            const field = child.fields.find(f => f.newName !== undefined || f.newField !== undefined || f.status == 2);

            // If a field with 'newName' is found, return it
            if (field) {
                return field;
            }
        }

        // Repeat the process for subChildren if they exist
        if (child.subChildren && Array.isArray(child.subChildren)) {
            const subChildField = findFieldWithNewName(child.subChildren);
            if (subChildField) {
                return subChildField;
            }
        }
    }

    // Return null if no field with 'newName' is found in any children or subChildren
    return null;
}
function handleChildData(data, keyData) {
    for (const key of keyData.fields) {
        if (data[key.fieldname] === undefined) {
            data[key.fieldname] = key.defaultValue || null;
        }
        if (key.newName && key.newName !== "") {
            data[key.newName] = data[key.fieldname];
            delete data[key.fieldname];
        }
        if (key.status === 2) {
            delete data[key.fieldname];
        }
    }
}
async function fetchDataForFields(fields, res) {
    const dataPromises = fields.map(field => {
        const referenceTable = field.referenceTable.split('.');
        const dropdownQuery = [{ $match: { status: 1 } }];

        for (let i = 1; i < referenceTable.length; i++) {
            let path
            if (i !== referenceTable.length - 1) {
                path = referenceTable.slice(1, i + 1).join('.');
                let project = {}
                project[`${path}`] = `$${path}`
                dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } }, { $project: project });

            }

        }


        return model.AggregateFetchData(referenceTable[0], referenceTable[0], dropdownQuery, res)
            .then(result => ({ fieldname: field.fieldname, data: result }));
    });

    const results = await Promise.all(dataPromises);
    const dataObj = results.reduce((obj, item) => {
        obj[item.fieldname] = item.data;
        return obj;
    }, {});
    return dataObj;
}
function filterFieldsWithReference(fields) {
    return fields.filter(field => field.referenceTable !== null);
}

// Function to process each child
async function processChildren(children, res) {
    const processedChildren = [];

    for (const child of children) {
        let childField = { ...child };

        // Filter fields and fetch data from reference table in child
        childField.fields = filterFieldsWithReference(childField.fields);// filter the fields with reference table is not null of Child
        childField.dataObj = await fetchDataForFields(childField.fields, res);// fetch the data for the reference table of child and store in dataObj

        // Process subChildren if they exist and SubChildren is an array
        if (childField.subChildren && Array.isArray(childField.subChildren)) {
            const processedSubChildren = [];
            for (const subChild of childField.subChildren) {

                subChild.fields = filterFieldsWithReference(subChild.fields);// filter the fields with reference table is not null of subChild
                subChild.dataObj = await fetchDataForFields(subChild.fields, res);// fetch the data for the reference table of subChild and store in dataObj

                processedSubChildren.push(subChild);
            }
            childField.subChildren = processedSubChildren;
        }

        processedChildren.push(childField);
    }

    return processedChildren;
}

// Access the Object Nestedly with dot notation dynamicaly
function getNestedProperty(obj, propertyPath) {
    return propertyPath.split('.').reduce((currentObject, key) => {

        return currentObject && currentObject[key] !== undefined ? currentObject[key] : null;
    }, obj);
}


module.exports = {
    // for defining the structure of master
    Add_MasterController: async (req, res) => {
        const validationRule = {
            tableName: "required"
        }
        // Check for validation according to rule
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error....!",
                    data: err
                })
            }
            else {
                try {
                    // Forming the JSON data For Dynamic Schema 
                    let insertData = {}
                    insertData.id = req.body.id || ""
                    insertData.tableName = req.body.tableName,
                    insertData.isDelete = req.body.isDelete
                    if (Array.isArray(req.body.fields)) {
                        insertData.fields = req.body.fields
                    }
                    else {
                        insertData.fields = JSON.parse(req.body.fields)
                    }
                    insertData.children = req.body.children
                    insertData.fields = req.body.fields
                    insertData.indexes = req.body.indexes || null
                    // Check for Chidren Exist or Not
                    for (let field of insertData.fields) {
                        let validateField = insertData.fields.filter(f => f.fieldname === field.fieldname)
                        if(validateField.length > 1){
                            return res.status(403).send({
                                success: false,
                                message: "Duplicate Field Name Found....!",
                                data: field.fieldname
                            })
                        }
                    }
                    if (Array.isArray(req.body.children)) {
                        insertData.children = req.body.children
                       for (const childData of insertData.children) {
                            for (const childField of childData.fields) {
                                let validateField = childData.fields.filter(f => f.fieldname === childField.fieldname)
                                if(validateField.length > 1){
                                    return res.status(403).send({
                                        success: false,
                                        message: "Duplicate Field Name Found....!",
                                        data: `${childData.tableName}.${childField.fieldname}`
                                    })
                                }
                                
                            }
                            for (const subChild of childData.subChildren) {
                                for (const subChildField of subChild.fields) {
                                    let validateField = subChild.fields.filter(f => f.fieldname === subChildField.fieldname)
                                    if(validateField.length > 1){
                                        return res.status(403).send({
                                            success: false,
                                            message: "Duplicate Field Name Found....!",
                                            data: `${childData.tableName}.${subChild.tableName}.${subChildField.fieldname}`
                                        })
                                    }
                                }
                                
                            }
                       }
                    }
                    else {
                        // if not exist then create
                        insertData.children = []
                    }
                    // Checking the is their any key for rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in Child and subchild
                    let findChildAndSubchild = findFieldWithNewName(insertData.children)
                    // Checking the is their any key for rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in parent
                    let findparent = findFieldWithNewName([insertData])
                    // if Below Condition is true then it means there is any key to rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in Child and subchild and parent
                    if (findChildAndSubchild !== null || findparent !== null) {

                        let modell = connection.model(req.body.tableName, Schema.any);
                        let _unset = {};
                        let collectionData = await model.AggregateFetchData(req.body.tableName, req.body.tableName, [{ $match: { status: 1 } }], res);

                        for (const cd of collectionData) {
                            if (findparent !== null) {
                                for (const key of insertData.fields) {
                                    if (cd[key.fieldname] === undefined) {
                                        cd[key.fieldname] = key.defaultValue || null;
                                    }
                                    if (key.newName && key.newName !== "") {
                                        cd[key.newName] = cd[key.fieldname];
                                        _unset[key.fieldname] = "";
                                        delete cd[key.fieldname];
                                    }
                                    if (key.status === 2) {
                                        _unset[key.fieldname] = "";
                                    }
                                }
                            }

                            if (findChildAndSubchild !== null) {
                                for (const childKey of insertData.children) {
                                    const childTableName = childKey.tableName;
                                    if (cd[childTableName]) {
                                        for (const childData of cd[childTableName]) {
                                            handleChildData(childData, childKey);// This function will handle the key rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in Child
                                        }
                                    }
                                    // Handling subChildren
                                    for (const sc of childKey.subChildren) {
                                        const subChildTableName = sc.tableName;
                                        if (cd[childTableName]) {
                                            for (const childData of cd[childTableName]) {
                                                if (childData[subChildTableName]) {
                                                    for (const scd of childData[subChildTableName]) {
                                                        handleChildData(scd, sc);// This function will handle the key rename , Add ,or delete on the base of "newName" , "newField" and Status respectively in subChild
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            await modell.updateOne({ _id: cd._id }, cd);// Update records in the collection
                        }


                        if (Object.keys(_unset).length > 0) {
                            await modell.updateMany({}, { $unset: _unset });// unset the keys in case of parents
                        }
                    }

                    // Changing the field names and deleting fields in Parent, child and subchild  to update the master Schema
                    insertData.fields.map((key) => {
                        key.newName && key.newName !== "" ? key.fieldname = key.newName : null
                    })
                    insertData.children.map((key) => {
                        key.fields.map((key) => {
                            key.newName && key.newName !== "" ? key.fieldname = key.newName : null
                        })
                        key.subChildren.map((key) => {
                            key.fields.map((key) => {
                                key.newName && key.newName !== "" ? key.fieldname = key.newName : null
                            })
                        })
                    })


                    // res.send({ success: true, data: insertData })
                    // return
                    let data = await model.Update_If_Avilable_Else_Insert("master_schema", "master_schema", insertData,{} ,res)
                    data ? res.send({ success: true, message: "Data inserted successfully....", data: data }) : res.status(500).send({ success: false, message: "Data not inserted Successfully..." })
                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "Something went wrong...",
                        data: error.message
                    })
                }
            }
        })

    },

    list: async (req, res) => {
        try {
            let _matchdata = {
                status: 1
            }
            if (req.query.id) {
                _matchdata['id'] = Number(req.query.id)
            }
            let query = [
                {
                    $match: _matchdata
                },
                {
                    $project: {
                        _id: 1,
                        id: 1,
                        status: 1,
                        __v: 1,
                        add_by: 1,
                        add_dt: 1,
                        children: {
                            $map: {
                                input: "$children",
                                as: "child",
                                in: {
                                    tableName: "$$child.tableName",
                                    _id: "$$child._id",
                                    fields: {
                                        $filter: {
                                            input: "$$child.fields",
                                            as: "field",
                                            cond: { $eq: ["$$field.status", 1] }
                                        }
                                    },
                                    subChildren: {
                                        $map: {
                                            input: "$$child.subChildren",
                                            as: "subChild",
                                            in: {
                                                tableName: "$$subChild.tableName",
                                                _id: "$$subChild._id",
                                                fields: {
                                                    $filter: {
                                                        input: "$$subChild.fields",
                                                        as: "subField",
                                                        cond: { $eq: ["$$subField.status", 1] }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        fields: {
                            $filter: {
                                input: "$fields",
                                as: "field",
                                cond: { $eq: ["$$field.status", 1] }
                            }
                        },
                        tableName: 1,
                        updated_by: 1,
                        updated_dt: 1,
                        indexes: 1
                    }
                }
            ]
            let result = await model.AggregateFetchData("master_schema", "master_schema", query, res)
            result.length > 0 ? res.send({ success: true, message: "Master Record fetched", data: result }) : res.status(200).send({
                success: false, message: "No data Found....!", data: []
            })
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Something went Wrong....!",
                data: error.message
            })
        }
    },

    // to Insert values in mastrers
    Create_mater: async (req, res) => {
        try {
            const validationRule = {
                
            }
            if (req.body.id&&req.body.id!=undefined&&req.body.id!=="") {
                
                
            }
            else{
                validationRule.tableName="required"
            }
            if(Array.isArray(req.body)){
               const records=req.body
               let finalerror=[]
               let finaldata=[]
                let query = [
                        {
                            $match: {
                                tableName: req.body[0].tableName,
                                status: Number(process.env.ACTIVE_STATUS)
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                id: 1,
                                status: 1,
                                __v: 1,
                                add_by: 1,
                                add_dt: 1,
                                children: {
                                    $map: {
                                        input: "$children",
                                        as: "child",
                                        in: {
                                            tableName: "$$child.tableName",
                                            _id: "$$child._id",
                                            fields: {
                                                $filter: {
                                                    input: "$$child.fields",
                                                    as: "field",
                                                    cond: { $eq: ["$$field.status", 1] }
                                                }
                                            },
                                            subChildren: {
                                                $map: {
                                                    input: "$$child.subChildren",
                                                    as: "subChild",
                                                    in: {
                                                        tableName: "$$subChild.tableName",
                                                        _id: "$$subChild._id",
                                                        fields: {
                                                            $filter: {
                                                                input: "$$subChild.fields",
                                                                as: "subField",
                                                                cond: { $eq: ["$$subField.status", 1] }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                fields: {
                                    $filter: {
                                        input: "$fields",
                                        as: "field",
                                        cond: { $eq: ["$$field.status", 1] }
                                    }
                                },
                                tableName: 1,
                                updated_by: 1,
                                updated_dt: 1,
                                indexes: 1
                            }
                        }
                    ]

                    let data_for_validation = await model.AggregateFetchData("master_schema", "master_schema", query, res)// Fethching the data from master schema
                    
                    if (data_for_validation.length == 0) {
                        // Creating Dynamic Validation Rules according to master schema data
                        return res.status(403).send({
                            success: false,
                            message: "Schema Not Found",
                            data: []
                        })
                    }
                   
               for (const record of records) {
                // console.log(index++);
                let ValidationRules_for_tables = {}
                validate(record, validationRule, {}, async (err, status) => {
                    if (!status) {
                        finalerror.push({success:false,Message:"Validation Error...!",data:err});
                       
                    } else {
                        data_for_validation[0].fields.map((validation) => {
                            validation.isRequired == true ? ValidationRules_for_tables[validation.fieldname] = "required" : ""
                        })
            
                        // Validating the Dynamic Validation Rules according to master schema if validation is true then else condition will be executed
                        validate(record, ValidationRules_for_tables, {}, async (err, status) => {
                            if (!status) {
                                // res.status(403).send({
                                //     success: false,
                                //     Message: "Validation Error...!",
                                //     data: err
                                // })
                                finalerror.push({success:false,Message:"Validation Error...!",data:err});
                            }
                            else {
                                let todays_dt = moment().format("YYYY-MM-DD HH:mm:ss")
                                // let insertData = {}
                                const insertData = {
                                    id: record.id || '',
                                    createdDate: todays_dt,
                                    isDelete : req.body.isDelete,
                                    tableName : req.body.tableName,
                                    createdBy: record.createdBy,
                                    updatedDate: todays_dt,
                                    updatedBy: record.updatedBy,
                                };
                                // Create the JSON of Parent to insert into the master
                                data_for_validation[0].fields.forEach((field) => {
                                    insertData[field.fieldname] = record[field.fieldname] || field.defaultValue;
                                });
                                // Creating the JSON of Child to insert into the master
                                data_for_validation[0].children.forEach((child) => {
                                    insertData[child.tableName] = (record[child.tableName] || []).map((values) => {
                                        const tempObject = { id: new mongoose.Types.ObjectId() };

                                        child.fields.forEach((child_fields) => {
                                            tempObject[child_fields.fieldname] = values[child_fields.fieldname] || child_fields.defaultValue;
                                        });
                                        // Creating the JSON of SubChild to insert into the master
                                        child.subChildren.forEach((subChild) => {
                                            tempObject[subChild.tableName] = (values[subChild.tableName] || []).map((values) => {
                                                const subChildObject = { id: new mongoose.Types.ObjectId() };
                                                subChild.fields.forEach((subChild_fields) => {
                                                    subChildObject[subChild_fields.fieldname] = values[subChild_fields.fieldname] || subChild_fields.defaultValue;
                                                });
                                                return subChildObject;
                                            });
                                        })



                                        return tempObject;
                                    });
                                });
                                finaldata.push(insertData)

                            }
                        })
                    }
                })
               }
            //    console.log(finaldata);
               let insertdata= await model.AddData(req.body[0].tableName, req.body[0].tableName, finaldata, res)
               if (insertdata.length>0) {
                    return res.status(200).send({
                        success: true,
                        message: "Data Inserted Successfully",
                        data: insertdata,
                        erro:finalerror
                    })
               }else{
                return res.status(200).send({
                    success: true,
                    message: "Data not Inserted Successfully",
                    data: finalerror
                })
               }
            }
            console.log(validationRule);
            // Check For the validation of Table Name if table name exists then else condition will be executed
            validate(req.body, validationRule, {}, async (err, status) => {
                if (!status) {
                    res.status(403).send({

                        success: false,
                        Message: "Validation Error...!",
                        data: err
                    }
                    )
                }
                else {
                    // Aggregate query to fetch the schema from the master_Schema
                    let query = [
                        {
                            $match: {
                                tableName: req.body.tableName,
                                status: Number(process.env.ACTIVE_STATUS)
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                id: 1,
                                status: 1,
                                __v: 1,
                                add_by: 1,
                                add_dt: 1,
                                children: {
                                    $map: {
                                        input: "$children",
                                        as: "child",
                                        in: {
                                            tableName: "$$child.tableName",
                                            _id: "$$child._id",
                                            fields: {
                                                $filter: {
                                                    input: "$$child.fields",
                                                    as: "field",
                                                    cond: { $eq: ["$$field.status", 1] }
                                                }
                                            },
                                            subChildren: {
                                                $map: {
                                                    input: "$$child.subChildren",
                                                    as: "subChild",
                                                    in: {
                                                        tableName: "$$subChild.tableName",
                                                        _id: "$$subChild._id",
                                                        fields: {
                                                            $filter: {
                                                                input: "$$subChild.fields",
                                                                as: "subField",
                                                                cond: { $eq: ["$$subField.status", 1] }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                fields: {
                                    $filter: {
                                        input: "$fields",
                                        as: "field",
                                        cond: { $eq: ["$$field.status", 1] }
                                    }
                                },
                                tableName: 1,
                                updated_by: 1,
                                updated_dt: 1,
                                indexes: 1
                            }
                        }
                    ]

                    let data_for_validation = await model.AggregateFetchData("master_schema", "master_schema", query, res)// Fethching the data from master schema
                    let ValidationRules_for_tables = {}
                    if (data_for_validation.length > 0) {
                        // Creating Dynamic Validation Rules according to master schema data
                        data_for_validation[0].fields.map((validation) => {
                            validation.isRequired == true ? ValidationRules_for_tables[validation.fieldname] = "required" : ""
                        })
                        // Validating the Dynamic Validation Rules according to master schema if validation is true then else condition will be executed
                        validate(req.body, ValidationRules_for_tables, {}, async (err, status) => {
                            if (!status) {
                                res.status(403).send({
                                    success: false,
                                    Message: "Validation Error...!",
                                    data: err
                                })
                            }
                            else {
                                let todays_dt = moment().format("YYYY-MM-DD HH:mm:ss")
                                // let insertData = {}
                                const insertData = {
                                    id: req.body.id || '',
                                    createdDate: todays_dt,
                                    isDelete : req.body.isDelete,
                                    tableName : req.body.tableName,
                                    createdBy: req.body.createdBy,
                                    updatedDate: todays_dt,
                                    updatedBy: req.body.updatedBy,
                                };
                                // Create the JSON of Parent to insert into the master
                                data_for_validation[0].fields.forEach((field) => {
                                    if (field.type.toLowerCase()=="file") {
                                        if (req.files && req.files !== null && req.files[field.fieldname]) {
                                            var element = req.files[field.fieldname];
                                            var image_name = moment().format("YYYYMMDDHHmmss") + element.name;
                                            element.mv(`./public/api/images/` + image_name.trim());
                                            var doc_data = image_name;
                                            insertData[field.fieldname] = image_name
                                        }
                                    }else
                                    {
                                        insertData[field.fieldname] = req.body[field.fieldname] || field.defaultValue;
                                    }
                                    
                                });
                                // Creating the JSON of Child to insert into the master
                                data_for_validation[0].children.forEach((child) => {
                                    insertData[child.tableName] = (req.body[child.tableName] || []).map((values) => {
                                        const tempObject = { id: new mongoose.Types.ObjectId() };

                                        child.fields.forEach((child_fields) => {
                                            tempObject[child_fields.fieldname] = values[child_fields.fieldname] || child_fields.defaultValue;
                                        });
                                        // Creating the JSON of SubChild to insert into the master
                                        child.subChildren.forEach((subChild) => {
                                            tempObject[subChild.tableName] = (values[subChild.tableName] || []).map((values) => {
                                                const subChildObject = { id: new mongoose.Types.ObjectId() };
                                                subChild.fields.forEach((subChild_fields) => {
                                                    subChildObject[subChild_fields.fieldname] = values[subChild_fields.fieldname] || subChild_fields.defaultValue;
                                                });
                                                return subChildObject;
                                            });
                                        })



                                        return tempObject;
                                    });
                                });

                                // Inserting the data into master if not exist else update on the basis of id and status=1
                                let result = await model.Update_If_Avilable_Else_Insert_master(req.body.tableName, req.body.tableName, insertData, data_for_validation[0].indexes, res)
                                if (result) {
                                    res.send({
                                        success: true,
                                        message: "Data inserted Successfully..!",
                                        data: result
                                    })
                                }
                                else {
                                    res.status(500).send({
                                        success: false,
                                        message: "Data Not Inserted Successfull....!",
                                        data: []
                                    })
                                }

                            }
                        })
                    }
                    else {
                        res.status(403).send({
                            success: false,
                            message: "Schema Not Found",
                            data: []
                        })
                    }

                }
            })
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "something Went Worng...!",
                data: error.message
            })
        }
    },
    dytablelist: async (req, res) => {
        try {
            const validationRule = { tableName: "required" };
            // validate for validation according to validationRule
            validate(req.body, validationRule, {}, async (err, status) => {
                if (!status) {
                    return res.status(403).send({ success: false, message: "Validation Error...!", data: err });
                }
                let _matchdata = { status: Number(process.env.ACTIVE_STATUS) }
                //if req.body.id is not null or undefined or empty then the result will be filtered on the basis of id
                if (req.body.id && req.body.id != "undefined" && req.body.id !== "") {
                    _matchdata['id'] = Number(req.body.id)
                }
                // Fetching the validation data from master schema e.g. Shcema
                let FetchRules = await model.AggregateFetchData("master_schema", "master_schema", [{ $match: { tableName: req.body.tableName, status: Number(process.env.ACTIVE_STATUS) } }], res)
                let data = await model.AggregateFetchData(req.body.tableName, req.body.tableName, [{ $match: _matchdata }], res) // fetching the data from master table

                if (FetchRules.length > 0) {
                    let field = FetchRules[0].fields.filter((field) => field.referenceTable !== null);// filtering the fields with reference table is not null of parent
                    let fieldforChild = await processChildren(FetchRules[0].children, res)//  fetching the data for the reference table of child and subChild and store in dataObj
                    let dataObj = await fetchDataForFields(field, res)
                    // Binding the data of refrance table with main table data
                    for (let datavalueObj of data) {
                        // Binding the Data of reference table with main table parent
                        for (let fieldData of field) {

                            let joinKey = fieldData.referenceTable.split('.').slice(1, 5).join('.');
                            console.log("joinKey", joinKey);
                            datavalueObj[fieldData.fieldname] = dataObj[fieldData.fieldname].filter((filterData) => getNestedProperty(filterData, joinKey) !== null && getNestedProperty(filterData, joinKey) === datavalueObj[fieldData.fieldname])[0] || fieldData.defaultValue // filtering the data according to join key from the dataObj and binding it to the main data 
                        }
                        // Binding the Data of reference table with main table child and SubChild
                        for (let childData of fieldforChild) {
                            let childdddd = childData
                            for (let childObj of datavalueObj[childdddd.tableName]) {
                                for (childField of childdddd.fields) {
                                    let joinKey = childField.referenceTable.split('.').slice(1, 5).join('.');// removing the parent from join key the reference like parent.child.subchild.key to child.subchild.key
                                    console.log("childObj", childObj[childField.fieldname]);
                                    childObj[childField.fieldname] = childdddd.dataObj[childField.fieldname].filter((filterData) => getNestedProperty(filterData, joinKey) !== null && getNestedProperty(filterData, joinKey) === childObj[childField.fieldname])[0] || childField.defaultValue // filtering the data according to join key from the dataObj and binding it to the main data 
                                }
                                for (subChild of childData.subChildren) {
                                    console.log("subChild", childObj[subChild.tableName]);
                                    for (const subChildData of childObj[subChild.tableName]) {
                                        for (const subField of subChild.fields) {

                                            let joinKey = subField.referenceTable.split('.').slice(1, 5).join('.');

                                            subChildData[subField.fieldname] = subChild.dataObj[subField.fieldname].filter((filterData) => getNestedProperty(filterData, joinKey) !== null && getNestedProperty(filterData, joinKey) === subChildData[subField.fieldname])[0] || subField.defaultValue// filtering the data according to join key from the dataObj and binding it to the main data 
                                        }
                                    }
                                }
                            }



                        }

                    }

                    res.send({
                        success: true,
                        message: "list fetched",
                        data: data
                    })
                }
                else {
                    res.status(403).send({ success: false, message: "Schema Not Found", data: [] });
                }

            });
        } catch (error) {
            res.status(500).send({ success: false, message: "Something went wrong", data: error.message });
        }
    },
}