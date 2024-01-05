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
const model = require("../models/module");
const moment = require('moment');

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
async function fetchDataForDropdown(dropdownData, model, res) {
  let dropdownMatch = { status: 1 };
  // if (dropdownData.controlDefaultValue !== null && dropdownData.referenceTable.split('.').length > 1) {
  //   dropdownMatch[`${dropdownData.referenceColumn.replace("$","")}`] = dropdownData.controlDefaultValue

  // }
  // else if (dropdownData.controlDefaultValue !== null) {
  //   dropdownMatch[dropdownData.referenceColumn] = dropdownData.controlDefaultValue
  // }
  console.log(dropdownMatch);
  if (dropdownData.controlDefaultValue !== null) {
    console.log(fixJsonLikeString(dropdownData.controlDefaultValue));
    // let temp = JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"'));
    let temp = JSON.parse(fixJsonLikeString(dropdownData.controlDefaultValue));
    console.log(typeof temp);
    Object.assign(dropdownMatch, temp);
    console.log(dropdownMatch);
  }
  //    dropdownData.dropdownFilter!==null&&console.log("DropdownFilter",JSON.parse(dropdownData.dropdownFilter.replace(/(\w+):/g, '"$1":').replace(/:([a-zA-Z]+)/g, ':"$1"')));
  let dropdownQuery = [{ $match: dropdownMatch }];

  let referenceTable = dropdownData.referenceTable.split('.');
  for (let i = 1; i < referenceTable.length; i++) {
    let path = referenceTable.slice(1, i + 1).join('.');
    dropdownQuery.push({ $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: false } });
  }

  if (dropdownData.referenceColumn) {
    const keys = dropdownData.referenceColumn.split(',');
    const regex = /[\s\W]/;
    const fieldsToConcat = keys.map(key => regex.test(key) ? `${key}` : `$${key.trim()}`);
    dropdownQuery.push({
      $project: {
        id: 1,
        value: { $concat: fieldsToConcat }
      }
    });
  }

  return await model.AggregateFetchData(referenceTable[0], dropdownData.referenceTable, dropdownQuery, res);
}
function fixJsonLikeString(str) {
  // First, ensure that colons have spaces after them for consistency in the regex match
  str = str.replace(/:/g, ': ');

  // Add quotes to keys (including those with periods) and values that are missing them
  str = str.replace(/([{\s,])(\w+(\.\w+)*)\s*:\s*(\w+)/g, '$1"$2": "$4"');

  // Check if there are nested objects with improperly formatted JSON and fix them
  const nestedObjectRegex = /"(\w+(\.\w+)*)":\s*"{([^}]+)}"/;
  let match = nestedObjectRegex.exec(str);

  while (match) {
    // For the matched nested object, recursively fix its string
    const fixedNestedObject = fixJsonLikeString(`{${match[3]}}`);
    // Replace the matched string with the fixed nested object
    str = str.replace(nestedObjectRegex, `"$1": ${fixedNestedObject}`);
    // Search for the next nested object
    match = nestedObjectRegex.exec(str);
  }

  return str;
}
async function processFields(fields, model, next) {
  for (let field of fields) {
    if (field.controlname === "dropdown" && field.controlDefaultValue !== null) {
      const datadafind = await fetchDataForDropdown(field, model, "res");
      if (datadafind.length == 0) {
        next(new Error(`Field ${field.controlDefaultValue} not found in reference table of ${field.fieldname}`));
        return; // Stop processing further fields after error
      }
    }
  }
}
async function processAggregateFields(fields, model) {
  for (const field of fields) {
    if (["date.now()", "Date.now()", "date.now", "Date.now"].includes(field.controlDefaultValue)) {
      field.controlDefaultValue = moment().format("YYYY-MM-DD");
    }

    if (field.controlname === "dropdown" && field.controlDefaultValue !== null) {
      const datadafind = await fetchDataForDropdown(field, model, "res");
      if (datadafind.length > 0) {
        field.controlDefaultValue = datadafind[0];
      }
    }
  }
}


module.exports = {

  any: new mongoose.Schema({ id: Number }, { strict: false }).set("autoIndex", true),
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
    isDelete: {
      type: Number
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
      enum: ['insert', 'update', 'delete', 'add', 'insertMany', 'findOneAndUpdate'] // Restrict to these actions
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

  tblQuotation: new mongoose.Schema({
    id: { type: String, required: true, default: 0 },
    name: { type: String, required: false, default: null },
    yourlabel: { type: String, required: false, default: null },
    controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
    isControlShow: { type: Boolean, default: true },// to show and hide the control
    referenceTable: { type: String, required: false, default: null },
    fields: [{}],

    status: { type: Number, required: false, default: 1 },
  }),
  tblBooking: new mongoose.Schema({
    // _id: { type: String, required: true },
    name: { type: String, required: false, default: null },
    yourlabel: { type: String, required: false, default: null },
    controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
    quotationid: { type: String, default: true },// to show and hide the control
    referenceTable: { type: String, required: false, default: null },
    fields: [{}],

    status: { type: Number, required: false, default: 1 },
  }),



  mainTableSchema: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    tableName: { type: String, required: true },
    menuID: { type: String, required: false, default: null },
    status: { type: Number, required: false, default: 1 },
    // gridView: Number,

    fields: [{
      fieldname: { type: String, required: false, default: null },
      yourlabel: { type: String, required: false, default: null },
      controlname: { type: String, required: false, default: null },// Type of control like dropdown, radio , text
      isControlShow: { type: Boolean, default: true },// to show and hide the control
      defaultValue: [{ id: String, value: String }],//for drowpdown
      // default: Date.now Replace 'YourDefaultValue' with the default value you want
      // Width: Number,
      // Height: Number,
      referenceTable: { type: String, required: false, default: null, },
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
      isCopy: { type: Boolean, default: false },
    }],
    children: [{
      tableName: { type: String, required: true },
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
        isCopy: { type: Boolean, default: false },
      }],
      subChildren: [{
        tableName: { type: String, required: true, },
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
          isCopy: { type: Boolean, default: false },
        }]
      }]
    }], // Array of child tables
    createdDate: { type: Date, required: false, default: Date.now() },
    createdBy: { type: String, required: false, default: null },
    updatedDate: { type: Date, required: false, default: Date.now() },
    updatedBy: { type: String, required: false, default: null },

  }).pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    // Process fields in the main document
    if (update.fields) {
      await processFields(update.fields, model, next);
    }

    // Process fields in children
    if (update.children) {
      for (const child of update.children) {
        await processFields(child.fields, model, next);

        // Process fields in subChildren
        for (const subChild of child.subChildren) {
          await processFields(subChild.fields, model, next);
        }
      }
    }

    next();
    // console.log(fields);
    next();
  }).post("aggregate", async function (doc, next) {
    for (const object of doc) {
      // Process fields in the main document
      await processAggregateFields(object.fields, model);

      // Process fields in children and subChildren
      for (const child of object.children) {
        await processAggregateFields(child.fields, model);
        for (const subChild of child.subChildren) {
          await processAggregateFields(subChild.fields, model);
        }
      }
    }
    next();
  }),
  // Form Control master

  master_schema: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    tableName: { type: String, required: true, unique: true },
    fields: {
      type: [{
        fieldname: { type: String, required: false, default: null },
        defaultValue: mongoose.Schema.Types.Mixed,
        status: { type: Number, required: false, default: 1 },
        isRequired: Boolean,
        type: { type: String, required: false, default: null },
        size: { type: Number, required: false, default: null },
        referenceTable: { type: String, required: false, default: null },
        isUnique: { type: Boolean, required: false, default: false },
        index: { type: Number, required: false, default: 0 },
        isDeletable: { type: Boolean, required: false, default: false },

      }],
    },
    children: [{
      tableName: { type: String, required: true, },
      fields: [{
        fieldname: { type: String, required: false, default: null, },
        defaultValue: mongoose.Schema.Types.Mixed,
        status: { type: Number, required: false, default: 1 },
        isRequired: Boolean,
        type: { type: String },
        size: { type: Number },
        referenceTable: { type: String, required: false, default: null },
        isDeletable: { type: Boolean, required: false, default: false },

      }],
      subChildren: [{
        tableName: { type: String, required: true, },
        fields: [{
          fieldname: { type: String, required: false, default: null, },
          defaultValue: mongoose.Schema.Types.Mixed,
          status: { type: Number, required: false, default: 1 },
          isRequired: Boolean,
          type: { type: String },
          size: { type: Number },
          referenceTable: { type: String, required: false, default: null },
          isDeletable: { type: Boolean, required: false, default: false },
        }]
      }]
    }], // Array of child tables
    // indexes: {},
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
  }),
  NumberGenerationSchema: new mongoose.Schema({
    id: { type: Number, required: true, default: 0 },
    client: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    FormControlId:{type:Number, required:false, default:0},
    module: {
      type: String,
      // enum: ['Quotation', 'Booking', 'B/L', 'Invoice', 'Voucher'],
      required: true,
    },
    preFix: {
      type: String,
      required: true,
      default: null
    },
    NoofDigits : {type: Number, required: false, default: 0},
    cycleType: String,
    status: { type: Number, required: false, default: 1 },
    rules: [{
      name: { type: String, required: true, default:null },
      tableName: { type: String, required: true, default:null },// while submiting JSON we will find this key in the Original JSON and append the No. Generation Value
      ColumnName: { type: String, required: true, default:null },
      type: { type: String, required: true, default:null },// Should be PreFIx , Key ,Date, Special Symbol
      DateFormat: { type: String, required: true, default:null },// Date format exampel DD,MM,YYYY,DDMMYYYY,YYYYMMDD
      specialSymbol: { type: String, required: true, default:null },// Special symbol include ( , - . ),
      to: { type: Number, required: true, default:null },// To
      from: { type: Number, required: true, default:null },// From
      ordering: { type: Number, required: true, default: 0 },// Ordering
    }],
  })

}



