const md5 = require('md5')
const validate = require('../helper/validate')
const model = require("../models/module")
const moment = require('moment')
const jwt = require("jsonwebtoken")
const SendMail = require('../helper/NodeMailer')
const config = require('../config/auth.config')
const mailTemplate=require('../helper/Mailtemplate')
const Mailtemplate = require('../helper/Mailtemplate')
// const { config } = require('dotenv')
const generateOTP = () => {
    // Generate a random number between 100000 and 999999
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};

module.exports = {

    addUser: async (req, res) => {
        const validationRule = {
            name: "required",
            email: "required",
            password: "required",
        }
        console.log(req.body);
        console.log('wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww')

        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(412).send({
                    success: false,
                    message: "Validation error",
                    data: err
                })
            } else {
                try {
                    let insertData = {}
                    insertData.id = req.body.id || ""
                    insertData.name = req.body.name
                    insertData.email = req.body.email
                    insertData.userName = req.body.userName
                    insertData.password = md5(req.body.password)
                    insertData.language = req.body.language
                    insertData.twoStepVerification = req.body.twoStepVerification
                    insertData.dateTimeFormat = req.body.dateTimeFormat
                    insertData.currency = req.body.currency
                    insertData.emailVerification = req.body.emailVerification
                    insertData.smsVerification = req.body.smsVerification
                    insertData.mobile = req.body.mobile
                    insertData.status = req.body.status
                    if (Array.isArray(req.body.menuAccess)) {

                        insertData.menuAccess = req.body.menuAccess || []
                    }
                    else {

                        insertData.menuAccess = JSON.parse(req.body.menuAccess) || []
                    }
                    if (req.files && req.files !== null && req.files.profilePhoto) {
                        var element = req.files.profilePhoto;
                        var image_name = moment().format("YYYYMMDDHHmmss") + element.name;
                        element.mv('./public/api/images/' + image_name.trim());
                        var doc_data = image_name;
                        insertData.profilePhoto = image_name
                    }
                    let data = await model.Update_If_Avilable_Else_Insert("tblUser", "tblUser", insertData, {}, res)
                    data ? res.send({
                        success: true,
                        message: "Data inserted successfully....",
                        data: data
                    }) : res.status(500).send({
                        success: false,
                        message: "Data not inserted Successfully...",
                        data: data
                    })
                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "Data not inserted Successfully...",
                        data: error.message
                    })
                }

            }
        })
    },
    login: async (req, res) => {
        const validationRule = {
            userName: "required",
            password: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(412).send({
                    success: false,
                    message: "Validation error",
                    data: err
                })
            } else {
                try {
                    let _match = {
                        status: Number(process.env.ACTIVE_STATUS),
                        password: md5(req.body.password),
                        $or: [
                            {
                                userName: req.body.userName,

                            },
                            {
                                email: req.body.userName
                            },
                            {
                                mobile: req.body.userName
                            }
                        ]
                    }
                    let query = [
                        {
                            $match: _match
                        },
                        {
                            $project: {
                                id: 1,
                                userName: 1,
                                name: 1,
                                email: 1,
                                profilePhoto: { $concat: [process.env.HOST + process.env.PORT + '/api/images/', "$profilePhoto"] },
                                language: 1,
                                currency: 1,
                                twoStepVerification: 1,
                                emailVerification: 1,
                                smsVerification: 1,
                                mobile: 1,
                            }
                        }
                    ]
                    let data = await model.AggregateFetchData("tblUser", "tblUser", query, res)
                    if (data.length > 0) {
                        let userName = data[0].userName
                        let otp = generateOTP();

                        if (data[0].twoStepVerification == true && data[0].emailVerification == true && data[0].smsVerification == true) {
                            console.log("heloo");
                            console.log(`Sms sent on your Mobile Number ${data[0].mobile} is your otp for verification ${otp}`);
                            SendMail(data[0].email, "Opt Verification", "Your OTP is " + otp, "")
                            await model.Update_If_Avilable_Else_Insert("tblOtpLog", "tblOtpLog", { id: "", userID: data[0].id, otp: otp, action: "login" }, {}, res)
                            return res.send({
                                success: true,
                                message: "OTP Send Successfully",
                                data: []
                            })

                        }
                        else if (data[0].twoStepVerification == true && data[0].emailVerification == true) {
                            // console.log(`Sms sent on your Mobile Number ${data[0].mobile} is your otp for verification ${otp}`);
                            SendMail(data[0].email, "Opt Verification", "Your OTP is " + otp, "")
                            await model.Update_If_Avilable_Else_Insert("tblOtpLog", "tblOtpLog", { id: "", userID: data[0].id, otp: otp, action: "login" }, {}, res)
                            return res.send({
                                success: true,
                                message: "OTP Send Successfully",
                                data: []
                            })
                        }
                        else if (data[0].twoStepVerification == true && data[0].smsVerification == true) {
                            console.log(`Sms sent on your Mobile Number ${data[0].mobile} is your otp for verification ${otp}`);
                            await model.Update_If_Avilable_Else_Insert("tblOtpLog", "tblOtpLog", { id: "", userID: data[0].id, otp: otp, action: "login" }, {}, res)
                            return res.send({
                                success: true,
                                message: "OTP Send Successfully",
                                data: []
                            })
                        }
                        // data[0].twoStepVerification?:null
                        let token = jwt.sign({ userName: userName, iat: Date.now() }, config.secret, { expiresIn: 7200000 });
                        console.log(token);
                        res.send({
                            success: true,
                            message: "User Login Successfully..",
                            data: data,
                            token: token
                        })
                    }
                    else {
                        let query = [
                            {
                                $match: {
                                    userName: req.body.userName
                                }
                            },
                            {
                                $project: {
                                    userName: 1,
                                    name: 1,
                                    email: 1,
                                    profilePohoto: 1
                                }
                            }
                        ]
                        console.log("else");

                        let data = await model.AggregateFetchData("tblUser", "tblUser", query, res)
                        if (data.length > 0) {
                            res.status(403).send({
                                success: false,
                                message: "Invalid Password",
                                data: []
                            })
                        }
                        else {
                            res.status(403).send({
                                success: false,
                                message: "user not found",
                                data: data
                            })
                        }
                    }
                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "something went wrong",
                        data: error.message
                    })
                }
            }
        })
    },
    VerifyOtp: async (req, res) => {
        const validationRule = {
            otp: "required",
            userName: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation error",
                    data: err
                })
            }
            else {
                try {
                    let query = [
                        {
                            $match: {
                                status: Number(process.env.ACTIVE_STATUS),
                                // otp: Number(req.body.otp),
                                $or: [
                                    {
                                        userName: req.body.userName,

                                    },
                                    {
                                        email: req.body.userName
                                    },
                                    {
                                        mobile: req.body.userName
                                    }
                                ]
                            }
                        },
                        {
                            $project: {
                                id: 1,
                                userName: 1,
                                name: 1,
                                email: 1,
                                profilePhoto: { $concat: [process.env.HOST + process.env.PORT + '/api/images/', "$profilePhoto"] },
                                language: 1,
                                currency: 1,
                                twoStepVerification: 1
                            }
                        }
                    ]
                    let data = await model.AggregateFetchData("tblUser", "tblUser", query, res)
                    if (data.length > 0) {
                        let userName = data[0].userName
                        let otpdata = await model.AggregateFetchData("tblOtpLog", "tblOtpLog", [{ $match: { userID: data[0].id, otp: req.body.otp, isUseable: 1 } }], res)
                        if (otpdata.length > 0) {
                            let token = jwt.sign({ userName: userName, iat: Date.now() }, config.secret, { expiresIn: 7200000 });
                            await model.Update_If_Avilable_Else_Insert("tblOtpLog", "tblOtpLog", { id: otpdata[0].id, isUseable: 0 }, {}, res)
                            res.send({
                                success: true,
                                message: "OTP Verified Successfully",
                                data: data,
                                token: token
                            })
                        }
                        else {
                            res.status(403).send({
                                success: false,
                                message: "Invalid OTP",
                                data: []
                            })
                        }

                    }
                    else {
                        res.status(403).send({
                            success: false,
                            message: "Invalid OTP",
                            data: []
                        })
                    }
                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "something went wrong",
                        data: error.message
                    })
                }
            }
        })
    },
    forgotPassword: async (req, res) => {
        const validationRule = {
            userName: "required",
        }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation error",
                    data: err
                })
            }
            else {
                try {
                    let query = [
                        {
                            $match: {
                                status: Number(process.env.ACTIVE_STATUS),
                                $or: [
                                    {
                                        userName: req.body.userName,

                                    },
                                    {
                                        email: req.body.userName
                                    },
                                    {
                                        mobile: req.body.userName
                                    }
                                ]
                            }
                        }

                    ]
                    let otp = generateOTP()
                    let data = await model.AggregateFetchData("tblUser", "tblUser", query, res)
                    if (data.length > 0) {
                        await model.Update_If_Avilable_Else_Insert("tblOtpLog", "tblOtpLog", { id: "", userID: data[0].id, otp: otp, action: "forgot" }, {}, res)
                        let templete=Mailtemplate.mailOtp(otp)
                        console.log(templete);
                        SendMail(data[0].email, "Forgot Password", "",templete)
                        res.send({
                            success: true,
                            message: "OTP sent to your mail",
                            data: data
                        })
                    }
                    else {
                        res.status(403).send({
                            success: false,
                            message: "user not found",
                            data: data
                        })
                    }
                }
                catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "something went wrong",
                        data: error.message
                    })
                }
            }
        })
    },
    changePassword: async (req, res) => {
        let validationRule = {
            userName: "required",
            newPassword: "required",
        }
       if (req.body.forgotPassword) {
        if (req.body.forgotPassword&&(req.body.forgotPassword == true||req.body.forgotPassword == "true")) {
            validationRule = {
                userName: "required",
                newPassword: "required",
                forgotPassword: "required"
            }
            
        }
        else{
            validationRule = {
                userName: "required",
                oldPassword: "required",
                newPassword: "required",
            }
        }
       }
       else{
        validationRule = {
            userName: "required",
            newPassword: "required",
            forgotPassword:"required"
        }
       }
        validate(req.body, validationRule, {}, async (err, status) => {
            if (!status) {
                res.status(403).send({
                    success: false,
                    message: "Validation error",
                    data: err
                })
            }
            else {
                try {
                    if (req.body.forgotPassword&&(req.body.forgotPassword == true||req.body.forgotPassword == "true")) {
                        let data = await model.Update("tblUser", "tblUser", { userName: req.body.userName,status:Number(process.env.ACTIVE_STATUS) }, { password: md5(req.body.newPassword)},{} ,res)
                        if (data) {
                            res.send({
                                success: true,
                                message: "Password Changed Successfully",
                                data: data
                            })
                        }
                        else {
                            res.status(400).send({
                                success: false,
                                message: "Password Not Changed",
                                data: data
                            })
                        }
                    }
                    else {
                        console.log("hello");
                        let data = await model.Update("tblUser", "tblUser", { userName: req.body.userName,status:Number(process.env.ACTIVE_STATUS),password: md5(req.body.oldPassword) }, { password: md5(req.body.newPassword)},{}, res)
                        if (data.matchedCount > 0) {
                            res.send({
                                success: true,
                                message: "Password Changed Successfully",
                                data: data
                            })
                        }
                        else {
                            res.status(400).send({
                                success: false,
                                message: "Invalid old password",
                                data: []
                            })
                        }
                    }
                } catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "something went wrong",
                        data: error.message
                    })
                }
            }
        })
    }

}