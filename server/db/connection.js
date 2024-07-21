const mongoose = require("mongoose");

const DB = "mongodb://127.0.0.1:27017/goggle-auth";

mongoose.connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("database connected"))
  .catch((err) => console.log("errr", err));
