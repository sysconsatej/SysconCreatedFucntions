
// const LRU = require('lru-cache');

const mongoos=require("mongoose")
const colors=require("colors")
let url=`mongodb://0.0.0.0:27017/${process.env.DB}`
// mongoos.connect(url,{useNewUrlParser:true})
// mongoos.connect(url,{useNewUrlParser:true,useUnifiedTopology:true,ssl:false,user:process.env.DB_USER,pass:process.env.DB_PASSWORD,authSource:process.env.DB,dbName:process.env.DB,})

mongoos.connect(url,{useNewUrlParser:true,useUnifiedTopology:true})
// mongoos.connect(url)
const db = mongoos.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully".green);
});
mongoos.set("debug",true)
mongoos.pluralize(false)
// mongoos.set("strictQuery",false)
// mongoos.cache = cache;

// console.log(mongoos);
module.exports=mongoos