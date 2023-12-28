const validate = require('../helper/validate')
const model = require("../models/module")
module.exports = {
    addRole: async (req, res) => {
        const validationRule={
            "roleName": "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error....!",
                    data: err
                })
            }
            else{
                try {

                    let insertData={}
                    insertData.id = req.body.id || ""
                    insertData.roleName = req.body.roleName
                    insertData.status = process.env.ACTIVE_STATUS
                    insertData.menuAccess=req.body.menuAccess||[]
                    console.log("insertData..........");
                    console.log(insertData);
                    //change spelling of Update_If_Avilable_Else_Insert
                    let data = await model.Update_If_Avilable_Else_Insert("tblRole", "tblRole", insertData,{}, res)
                    data ? res.send({
                        success: true,
                        message: "Data inserted successfully....!",
                        data: data
                    }) : res.status(500).send({
                        success: false,
                        message: "Data not inserted Successfully...",
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
        })
    },
    lisRole: async (req, res) => {
        try {
            let _match = { status: Number(process.env.ACTIVE_STATUS) }
           
            if (req.query.id && req.query.id!==""&&req.query.id!=="undefined" && typeof req.query.id!=="undefined") {
                _match.id = Number(req.query.id)
                
            }
            let query = [
                {
                    $match: _match
                }
            ]
            console.log(typeof req.query.id);
            let data = await model.AggregateFetchData("tblRole", "tblRole",query, res)
            data ? res.send({
                success: true,
                message: "Data fetched successfully....!",
                data: data
            }) : res.status(500).send({
                success: false,
                message: "Data not fetched Successfully...",
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