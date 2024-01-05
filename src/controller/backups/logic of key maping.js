 for (let datavalueObj of data) {

                        for (let fieldData of field) {

                            let joinKey = fieldData.referenceTable.split('.').slice(1, 5).join('.');
                            datavalueObj[fieldData.fieldname] = dataObj[fieldData.fieldname].filter((filterData) => getNestedProperty(filterData, joinKey) === datavalueObj[fieldData.fieldname])[0] || fieldData.defaultValue
                        }
                        for (let childData of fieldforChild) {
                            let childdddd = childData
                            for (let childObj of datavalueObj[childdddd.tableName]) {
                                for (childField of childdddd.fields) {
                                    let joinKey = childField.referenceTable.split('.').slice(1, 5).join('.');
                                    console.log("childObj", childObj[childField.fieldname]);
                                    childObj[childField.fieldname] = childdddd.dataObj[childField.fieldname].filter((filterData) => getNestedProperty(filterData, joinKey) === childObj[childField.fieldname])[0] || childField.defaultValue
                                }
                                for (subChild of childData.subChildren) {
                                    console.log("subChild", childObj[subChild.tableName]);
                                    for (const subChildData of childObj[subChild.tableName]) {
                                        for (const subField of subChild.fields) {

                                            let joinKey = subField.referenceTable.split('.').slice(1, 5).join('.');

                                            subChildData[subField.fieldname] = subChild.dataObj[subField.fieldname].filter((filterData) => getNestedProperty(filterData, joinKey) === subChildData[subField.fieldname])[0] || subField.defaultValue
                                        }
                                    }
                                }
                            }



                        }

                    }