//jshint esversion:6

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const _ = require('lodash');

// var items = ["Have Gum", "Good Gum", "Be Gum"];  arrays used previously
// var workItems = [];

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongoose.connect("mongodb+srv://admin-aishwarya:Test123@cluster0.w4rrrly.mongodb.net/todolistDB");   to connect to atlas

mongoose.connect("mongodb://localhost:27017/todolistDB");

// creating todolist Schema
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter the task name"],
  },
});

// creating list model
const Item = mongoose.model("Item", itemSchema); //so, collection name will be 'items'

// Creating default documents into our collection
const item1 = new Item({
  name: "Welcome to your to-do list!",
});

const item2 = new Item({
  name: "Hit the + icon to add a new task",
});

const item3 = new Item({
  name: "<-- Hit this to delete your task",
});

const defaultItems = [item1, item2, item3];


// Schema for custom lists
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
})

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {
  // var today = new Date();

  //Taken from Stack Overflow
  // var options = {
  //   weekday: "long",
  //   day: "numeric",
  //   month: "long",
  // };

  // var day = today.toLocaleDateString("en-US", options);

  //pass this 'day' to 'kindOfDay'

  //getting the items from mongoDB
  Item.find(function (err, items) {
    if (items.length == 0) {
      // inserting...
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items inserted successfully.");
        }
      });
      res.redirect('/');
    } else {
        res.render("list", { kindOfDay: 'Today', listItem: items });
    }
  });
});

app.get("/:categoryName", function(req, res) {
    const customListName = _.capitalize(req.params.categoryName);

    List.findOne({name: customListName}, function(err, foundList) {    //since we're using findOne, it will return an object
      if(!err) {
        if(!foundList) {
          // Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          })
      
          list.save();
          res.redirect('/' + customListName);
        } else {
          res.render('list', { kindOfDay: foundList.name, listItem: foundList.items })
        }
      }
    })
})

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.button;

  const item = new Item({
    name: itemName
  })

  if(listName === 'Today') {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    })
  }
  

});

app.post('/delete', function(req, res) {
  // console.log(req.body.checkbox);

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === 'Today') {
    Item.deleteOne({_id: checkedItemId}, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log('Item deleted successfully.');
        res.redirect('/');
      }
    })
  } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, results) {
        if(!err) {
          res.redirect('/' + listName);
        }
      })
  }

})

app.listen(3000, function () {
  console.log("Server is running on port 3000.");
});
