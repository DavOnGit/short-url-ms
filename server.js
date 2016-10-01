'use strict';

const   MongoClient = require('mongodb').MongoClient,
        express = require('express'),
        app = express(),
        assert = require('assert'),
        random = require('make-random-string');
        
const url = process.env.MONGODB_URI;

app.set('strict routing', true);
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.set('json spaces', 4);

MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    
    console.log( "Connected correctly to the DB server" );
    
    app.listen( app.get('port'), () => {
        console.log( 'listening on port: ' + app.get('port') );
    });
    
    var coll = db.collection('urlmap');

    function isRepeated(req, res, next, callback) {
        var count = 0;
        
        var iterate = function(req, res) {
            count++;
            
            if (count > 10) return new Error('Short url generation ERROR...');
            
            coll.findOne({ surl: req.shorUrl }, function(err,data) {
                assert.equal(err, null);
                if(data) {
                    req.shorUrl = random(6);
                    iterate(req,res);
                }
                count--;
                if(count === 0) callback(req, res, next);
            });
        };
        iterate(req,res);
    }
    
    function insOne(req,res,next) {
        coll.insert({ url: req.par, surl: req.shorUrl, date: new Date() }, function(err,data) {
            assert.equal(err, null);
            assert.equal(1, data.insertedCount);
            next();
        });
    }
    
    app.use('/cut', function(req,res,next) {  // URL VALIDATION
    
        var raw = req.path.replace(/^\/*/,'').toString();
        var hasProt = /^(?:https?:\/\/|ftp:\/\/)/.test(raw);
        
        if (!hasProt) {
            req.par = 'http://' + raw;
        }
        else req.par = raw;
        
        if(req.par && req.par.match(filter)) {
            next();
        }
        else res.end('\n\tError: invalid url format!\n\n\tPlease fix it and try again...');
    });
    
    app.use('/cut', function(req,res,next) {
        
        //requested url already in DB?
        coll.find({ url: req.par }, { _id:0, surl:1 }).toArray(function(err,data) {
            assert.equal(err, null);
            
            //if the url is present then it already has short url in DB
            if (data[0]) {
                req.shorUrl = data[0].surl;
                next();
            }
            //we do a new random url and then validate if it is unique in DB
            else {
                req.shorUrl = random(6);
                isRepeated(req,res,next,insOne);
            }
        });
    });
    
    app.use('/cut', function(req,res) {
        
        var result = { 
            original_url: req.par,
            short_url: req.headers['x-forwarded-proto'] + '://' + req.headers.host + '/' + req.shorUrl
        };
        res.setHeader('Content-Type', 'application/json');
        res.send(result);
    });
    
    app.get(/^\/[a-zA-Z0-9]{6}$/, function(req, res){
        
        var reqSUrl = req.path.replace(/^\/*/,'');
        
        coll.findOne({ surl: reqSUrl }, { _id:0, url:1 }, function(err,data) {
            assert.equal(err, null);
            
            if (data) res.redirect(data.url);
            else res.end('Error: not in database, please register a new Short Url!');
        });
    });
});

var filter = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i;
