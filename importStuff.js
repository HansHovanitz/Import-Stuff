//Copyright 2017 Hans Hovanitz
//
//Permission is hereby granted, free of charge,
// to any person obtaining a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all copies
// or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

"use strict";

var MongoClient = require('mongodb').MongoClient;
var config = require('./config');

var url = "mongodb://" + config.user + ":" + config.pw + "@" + config.uri;
var quoteObj = {};

var _user, _text, _addedBy, _dateAdded, _insertId = null;

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    db.collection("counters").findOne({}, function (err, result) {
        if (err) throw err;

        _insertId = result.seq;
        console.log("initial seq id: " + _insertId)

        var fs = require('fs'),
            readline = require('readline'),
            instream = fs.createReadStream(config.file),
            outstream = new (require('stream'))(),
            rl = readline.createInterface(instream, outstream); 

        rl.on('line', function (line) {

            var split = line.indexOf(" ");
            var splits = [line.slice(0,split), line.slice(split+1)];

            _user = "@" + splits[0];
            _text = "'" + splits[1] + "'";
            _addedBy = config.addedBy;
            _dateAdded = new Date().toISOString();

            quoteObj = { user : _user , text : _text , addedby : _addedBy, dateadded : _dateAdded, insertid : _insertId};
            console.log(quoteObj);
    
            db.collection(config.database).insertOne(quoteObj, function(err, res) {
            if (err) throw err;
            }); 

            _insertId++; 
        });  
        rl.on('close', function (line) {
            db.collection("counters").updateOne({"_id" : "quotes"}, {$set: {"seq" : _insertId}}, function(err, result) {
            if (err) throw err;
            console.log("updated seq id");
            });

            console.log('done reading file.');
            console.log("ending seq id " + _insertId);
            console.log('closing db.')

            db.close();
        });
    });
});



