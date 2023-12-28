const { bgYellow } = require('colors');
const mongoose = require('mongoose');
const fieldSchema = new mongoose.Schema({
  fieldname: { type: String, required: false, default: null },
  defaultValue: mongoose.Schema.Types.Mixed,
  status: { type: Number, required: false, default: 1 },
  isRequired: Boolean,
  type: { type: String, required: false, default: null },
  size: { type: Number, required: false, default: null },
  referenceTable: { type: String, required: false, default: null },
});
const childSchema = new mongoose.Schema({
  tableName: { type: String, required: false, default: null },
  fields: [fieldSchema],
  subChildren: [{
    tableName: { type: String, required: false, default: null },
    fields: [fieldSchema],
  }],
});
const optionSchema = new mongoose.Schema({
  menuName: { type: String, required: false, default: null },
  child: [{ type: mongoose.Schema.Types.Mixed }], // Allows for recursive nesting
  docId: { type: String, required: false, default: null, index: 'text' },
});

// Use the schema within itself for recursive nesting
optionSchema.add({ child: [optionSchema] });

function appendDocIdToNestedObjects(obj) {
  // Check if obj is an array
  if (!Array.isArray(obj)) {
    return;
  }

  for (const object of obj) {
    // Check and log menuName if it exists
    if (object.menuName) {
      console.log(object.menuName);
    }

    // Assign null to docId
    object.docId = object._id.toString();

    // Check if child exists and has elements before making a recursive call
    if (object.child && object.child.length > 0) {
      appendDocIdToNestedObjects(object.child);
    }
  }
  return obj;
}



module.exports = {

  any: new mongoose.Schema({id: Number}, { strict: false }).set("autoIndex", true),
// Create the Log model using the logSchema
 

  logSchema: new mongoose.Schema({
    // Defines the table or collection name related to the log
    tableName: {
        type: String,
        required: false
    },
    // An array to store the state of the fields before the update
    previousField: {
        type: Object,
        of: mongoose.Schema.Types.Mixed,
    },
    // An array to store the state of the fields after the update
    updateFields: {
        type: Object,
        of: mongoose.Schema.Types.Mixed,
    },
    isDelete:{
  type:Number
    },
    // Primary key of the document/row that was updated
    pk: {
        type: String,
        required: false
    },
    // IP address from which the action was performed
    ipadress: {
        type: String,
        required: false
    },
    // Type of action performed (e.g., 'update', 'delete')
    action: {
        type: String,
        required: false,
        enum: ['insert','update','delete','add','insertMany', 'findOneAndUpdate'] // Restrict to these actions
    },
    // Timestamp of when the log was created
    updated_dt: {
        type: Date,
        default: Date.now
    },
    // ID of the document that was changed
    documentId: {
        type: Number,
        required: false
    },
    // Additional fields as needed
}),
//Log: mongoose.model('Log', logSchema),
  // Define logSchema
  




  mainTableSchema: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    tableName: { type: String, required: false, default: null },
    menuID: { type: String, required: false, default: null },
    status: { type: Number, required: false, default: 1 },
    // gridView: Number,

    fields: [{
      fieldname: { type: String, required: false, default: null },
      yourlabel: { type: String, required: false, default: null },
      controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
      isControlShow: { type: Boolean, default: true },// to show and hide the control
      defaultValue: [{ id: String, value: String }],
      // Width: Number,
      // Height: Number,
      referenceTable: { type: String, required: false, default: null,},
      referenceColumn: { type: String, required: false, default: null },// have to check the combination of keys 
      type: { type: mongoose.Schema.Types.Mixed, required: false, default: null },// Data type like number, string, decimal etc,
      size: { type: Number, required: false, default: null },//size of the control to accept the values
      ordering: { type: Number, required: false, default: null },
      isRequired: { type: Boolean, default: false },
      isEditable: { type: Boolean, default: true },
      dropdownFilter: { type: String, required: false, default: null },// filter condition for dropdown like by default filter city of india
      controlDefaultValue: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
      functionOnChange: { type: String, required: false, default: null },
      functionOnBlur: { type: String, required: false, default: null },
      functionOnKeyPress: { type: String, required: false, default: null },
      sectionHeader: { type: String, required: false, default: null },// Short by this keys to drow the screem
      sectionOrder: { type: Number, required: false, default: null },// Short by this keys to drow the screem
    }],
    children: [{
      tableName: { type: String, required: false, default: null },
      fields: [{
        fieldname: { type: String, required: false, default: null },
        yourlabel: { type: String, required: false, default: null },
        controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
        isControlShow: { type: Boolean, default: true },// to show and hide the control
        defaultValue: [{ id: String, value: String }],
        // Width: Number,
        // Height: Number,
        referenceTable: { type: String, required: false, default: null },
        referenceColumn: { type: String, required: false, default: null },// have to check the combination of keys 
        type: { type: mongoose.Schema.Types.Mixed, required: false, default: null },// Data type like number, string, decimal etc,
        size: { type: Number, required: false, default: null },
        ordering: { type: Number, required: false, default: null },
        isRequired: { type: Boolean, default: false },
        isEditable: { type: Boolean, default: true },
        dropdownFilter: { type: String, required: false, default: null },// filter condition for child dropdown
        controlDefaultValue: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
        functionOnChange: { type: String, required: false, default: null },
        functionOnBlur: { type: String, required: false, default: null },
        functionOnKeyPress: { type: String, required: false, default: null },
        sectionHeader: { type: String, required: false, default: null },// Short by this keys to drow the screem
        sectionOrder: { type: Number, required: false, default: null },// Short by this keys to drow the screem
      }],
      subChildren: [{
        tableName: { type: String, required: false, default: null },
        fields: [{
          fieldname: { type: String, required: false, default: null },
          yourlabel: { type: String, required: false, default: null },
          controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
          isControlShow: { type: Boolean, default: true },// to show and hide the control
          defaultValue: [{ id: String, value: String }],
          // Width: Number,
          // Height: Number,
          referenceTable: { type: String, required: false, default: null },
          referenceColumn: { type: String, required: false, default: null },// have to check the combination of keys 
          type: { type: mongoose.Schema.Types.Mixed, required: false, default: null },// Data type like number, string, decimal etc,
          size: { type: Number, required: false, default: null },
          ordering: { type: Number, required: false, default: null },
          isRequired: { type: Boolean, default: false },
          isEditable: { type: Boolean, default: true },
          dropdownFilter: { type: String, required: false, default: null },// filter condition for child dropdown
          controlDefaultValue: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
          functionOnChange: { type: String, required: false, default: null },
        }]
      }]
    }], // Array of child tables
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },

  }),
  // Form Control master

  master_schema: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    tableName: { type: String, required: false, default: null, unique: true },
    fields: {
      type: [{
        fieldname: { type: String, required: false, default: null },
        defaultValue: mongoose.Schema.Types.Mixed,
        status: { type: Number, required: false, default: 1 },
        isRequired: Boolean,
        type: { type: String, required: false, default: null },
        size: { type: Number, required: false, default: null },
        referenceTable: { type: String, required: false, default: null },
        isUnique: {type: Boolean, required: false, default: false},
        index: {type: Number, required: false, default: 0},
        isDeletable: {type: Boolean, required: false, default: false},

      }],
    },
    children: [{
      tableName: { type: String, required: false, default: null, },
      fields: [{
        fieldname: { type: String, required: false, default: null, },
        defaultValue: mongoose.Schema.Types.Mixed,
        status: { type: Number, required: false, default: 1 },
        isRequired: Boolean,
        type: { type: String },
        size: { type: Number },
        referenceTable: { type: String, required: false, default: null },
        isDeletable: {type: Boolean, required: false, default: false},

      }],
      subChildren: [{
        tableName: { type: String, required: false, default: null, },
        fields: [{
          fieldname: { type: String, required: false, default: null, },
          defaultValue: mongoose.Schema.Types.Mixed,
          status: { type: Number, required: false, default: 1 },
          isRequired: Boolean,
          type: { type: String },
          size: { type: Number },
          referenceTable: { type: String, required: false, default: null },
          isDeletable: {type: Boolean, required: false, default: false},
        }]
      }]
    }], // Array of child tables
    indexes: {},
    status: { type: Number, required: false, default: 1 },
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },

  }).set('autoIndex', true),// Master Control Shema

  //Defining the schema of menu master
  tblMenu: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    docId: { type: String, required: false, default: null, index: 'text' },
    menuName: { type: String, required: false, default: null, unique: true },
    // options: {
    //   type: [{
    //     menuName: { type: String, required: false, default: null,},
    //     child:mongoose.Schema.Types.Mixed,
    //   }]
    // },
    options: [optionSchema],
    status: { type: Number, required: false, default: 1 },
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },

  }).post('findOneAndUpdate', function (doc, next) {
    console.log('Pre-findOneAndUpdate hook triggered');

    // Access the update operation
    const update = doc;
    console.log(update);
    if (update.docId == null) {
      update.docId = update._id.toString();
      update.options = appendDocIdToNestedObjects(update.options)
      doc.save().then(() => next());
      console.log(update);
    }


    // Check if the operation is creating a new document (upsert)


    // next();
  }),
  tblRole: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    roleName: { type: String, required: true, default: null, unique: true },
    menuAccess: [{
      menuID: { type: String, required: false, default: null },// menu document id i.e _id
      isDeleted: { type: Boolean, required: false, default: false },
      isEdit: { type: Boolean, required: false, default: false },
      isview: { type: Boolean, required: false, default: false },
      isAdd: { type: Boolean, required: false, default: false },
    }],
    status: { type: Number, required: false, default: 1 },
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
  }).set('autoIndex', true).set("collection", "tblRole"),



  tblUser: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    userName: { type: String, required: false, default: null, unique: true },
    name: { type: String, required: false, default: null },
  
    status: { type: Number, required: false, default: 1 },
    email: { type: String, required: false, default: null, unique: true },
    mobile: { type: String, required: false, default: null, unique: true },
    password: { type: String, required: false, default: null },
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },
    // otp: { type: Number, required: false, default: null },
    profilePhoto: { type: String, required: false, default: null },
    language: { type: String, required: false, default: null },
    twoStepVerification: { type: Boolean, required: false, default: false },
    dateTimeFormat: { type: String, required: false, default: null },
    currency: { type: String, required: false, default: null },
    emailVerification: { type: Boolean, required: false, default: false },
    smsVerification: { type: Boolean, required: false, default: false },
    menuAccess: [{
      menuID: { type: String, required: false, default: null },// menu document id i.e _id
      isDeleted: { type: Boolean, required: false, default: false },
      isEdit: { type: Boolean, required: false, default: false },
      isview: { type: Boolean, required: false, default: false },
      isAdd: { type: Boolean, required: false, default: false },
      
    }]
  }),
  tblOtpLog: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    status: { type: Number, required: false, default: 1 },
    userID: { type: Number, required: false, default: null },
    action: { type: String, required: false, default: null },//used for login or forget password,
    otp: { type: String, required: false, default: null },
    expireIn: { type: String, required: false, default: null },// used to check otp expire time and time will store in seconds
    createdDate: { type: Date, required: false, default: Date.now() },
    isUseable: { type: Number, required: false, default: 1 },// 1 for usable and 2 for not usable
  })
}



