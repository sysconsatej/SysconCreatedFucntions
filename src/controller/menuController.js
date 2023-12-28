const validate = require('../helper/validate')
const model = require("../models/module")

function appendDocIdToNestedObjects(obj,search) {
    // Check if obj is an array
    if (!Array.isArray(obj)) {
        return;
    }
    let result=[]  

    for (const object of obj) {
        // Check and log menuName if it exists
        if (object.menuName) {
            // console.log(JSON.stringify(object));
        }
        
        // Assign null to docId
       if ( search==object.docId) {
            result.push(object)
       }

        // Check if child exists and has elements before making a recursive call
        else if (object.child && object.child.length > 0) {
           let data= appendDocIdToNestedObjects(object.child,search);
            result.push(data[0])
        }
    }
    console.log(JSON.stringify(result));
    return result;
}
function mapDataAndAppendDocIdToNestedObjects(data,search) {
    if (!Array.isArray(data)) {
        return;
    }
    let result=[]
    for (const iterator of data) {
        if (iterator.docId == search) {
            result.push(iterator)
        }
        else{
        let dataa= appendDocIdToNestedObjects(iterator.options,search)
        result.push(dataa[0])
    }
    }
    return result
}
function findItemsWithDocIds(obj, searchValues) {
    // Convert search values to a Set for efficient lookups
    const searchSet = new Set(searchValues);
    let results = [];

    // Recursive helper function
    function searchNestedObjects(nestedObj) {
        if (Array.isArray(nestedObj)) {
            for (const item of nestedObj) {
                if (searchSet.has(item.docId)) {
                    results.push(item);
                }
                // Recurse if 'child' exists and is an array
                if (item.child && Array.isArray(item.child)) {
                    searchNestedObjects(item.child);
                }
                // Also check in 'options' if it exists
                if (item.options && Array.isArray(item.options)) {
                    searchNestedObjects(item.options);
                }
            }
        }
    }

    // Start the recursive search
    searchNestedObjects(obj);
    return results;
}



module.exports = {

    // This api is used to create menu
    addMenu: async (req, res) => {
        const validationRule = {
            
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error....!",
                    data: err
                })
            } else {
                try {
                    let insertData={}
                    insertData.id = req.body.id || ""
                    insertData.menuName = req.body.menuName
                    insertData.options=req.body.options||[]
                    
                        // let dataa=appendDocIdToNestedObjects(insertData.options)
                        //     res.send({
                        //         success: true,
                        //         message: "Data inserted successfully....!",
                        //         data: dataa
                        //     })
                    
                    // return
                    let data = await model.Update_If_Avilable_Else_Insert("tblMenu", "tblMenu", insertData,{}, res)
                    data ? res.send({
                        success: true,
                        message: "Data inserted successfully....!",
                        data: data
                    }): res.status(500).send({
                        success: false,
                        message: "Data not inserted successfully....!",
                        data: data
                    })
                    
                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "Something went wrong....!",
                        data: error
                    })
                }
            }
        })
    },
    listMenu: async (req, res) => {
        try {
            let _match={status:Number(process.env.ACTIVE_STATUS)}
            let query=[
                {
                    $match:_match
                }
            ]

            let data = await model.AggregateFetchData("tblMenu", "tblMenu", query, res)
            if (req.body.userName&&req.body.userName!=="",req.body.userName!=="undefined"&& typeof req.body.userName!=="undefined") {
                let roleMenu=await model.AggregateFetchData("tblUser", "tblUser", [{$match:{userName:req.body.userName}}], res)
                let search=[]
                roleMenu.forEach(element => {
                    element.menuAccess.map((data)=>{
                        search.push(data.menuID)
                    })
                })
                data=findItemsWithDocIds(data,search);    
                
            }

            
            
            data.lenght > 0 ? res.send({
                success: true,
                message: "Data fetched successfully....!",
                data: data
            }): res.status(200).send({
                success: false,
                message: "No menu found....!",  
                data: data
            })
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Something went wrong....!",
                data: error.message
            })
        }
    }
}