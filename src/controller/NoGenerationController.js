const validate = require('../helper/validate')
const model = require("../models/module")

module.exports = {
    AddRules: async (req, res) => {
        const validationRule = {
            "FormControlId": "required",
            "module": "required",
            preFix: "required",
            NoofDigits: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation Error...!",
                    data: err
                })
            }
            else {
                try {
                    let insertData = {}
                    insertData.id = req.body.id || ""
                    insertData.FormControlId = req.body.FormControlId
                    insertData.module = req.body.module
                    insertData.preFix = req.body.preFix
                    insertData.NoofDigits = req.body.NoofDigits
                    if (Array.isArray(req.body.rules)) {
                        insertData.rules = req.body.rules

                    }
                    else {
                        insertData.rules = JSON.parse(req.body.rules)
                    }
                    let data = await model.Update_If_Avilable_Else_Insert("tblNoGeneration", "NumberGenerationSchema", insertData, {}, res)
                    data ? res.send({
                        success: true,
                        message: "Data inserted successfully....!",
                        data: data
                    }) : res.send({
                        success: false,
                        message: "Data not inserted successfully....!",
                        data: data
                    })

                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "Something went wrong",
                        data: error.message
                    })
                }
            }
        })
    },
    GenerateNumber: async (req, res) => {
        try {
            let query = [
                {
                    $set: {
                        rules: {
                            $sortArray: {
                                input: "$rules",
                                sortBy: { ordering: 1 } // Sorting the rules by the ordering field
                            }
                        }
                    }
                }
            ]
            let data = await model.AggregateFetchData("tblNoGeneration", "NumberGenerationSchema",query, res)
            data ? res.send({
                success: true,
                message: "Data fetched successfully....!",
                data: data
            }) : res.send({
                success: false,
                message: "Data not fetched successfully....!",
                data: data
            })
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Something went wrong",
                data: error.message
            })
        }
    }
}