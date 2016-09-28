'use strict';

const   MongoClient = require('mongodb').MongoClient,
        express = require('express'),
        app = express(),
        assert = require('assert'),
        random = require('make-random-string');
        
const yourpassword = process.env.PASSWORD;       
const url = 'mongodb://shorturlapp:Stalla75@ds033096.mlab.com:33096/shorturldb';

app.set('strict routing', true);
app.set('port', (process.env.PORT || 8080));
app.set('IP', (process.env.IP || '127.0.0.1'));
app.use(express.static(__dirname + '/public'));

MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    
    console.log("Connected correctly to the DB server");
    
    app.listen( app.get('port'), app.get('IP'), () => {
        console.log('listening on url: ' + app.get('IP') + ':' + app.get('port'));
    });
    
    var coll = db.collection('urlmap');
    coll.createIndex( { "date": 1 }, { expireAfterSeconds: 3600, background:true, w:1 } );
    //coll.createIndex( { url: 1, surl: 1 }, { unique: true, background:true, w:1 } );
    
    function isRepeated(req, res, next, callback) {
        var count = 0;
        
        var iterate = function(req, res) {
            count++;
            
            if (count > 10) assert(false, 'Too mutch recursion!');
            
            coll.findOne({ surl: req.shorUrl }, function(err,data) {
                assert.equal(err, null);
                if(data) {
                    req.shorUrl = random(6);console.log('is repeated! '+ req.shorUrl);
                    iterate(req,res);
                }
                count--;
                if(count === 0) callback(req, res, next);
            });
        };
        iterate(req,res);
    }
    
    function insOne(req,res,next) {console.log('before insert: '+ req.shorUrl);
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
            console.log('Url is OK...');
            next();
        }
        else res.end('\n\tError: invalid url format!\n\n\tPlease fix it and try again...');
    });
    
    app.use('/cut', function(req,res,next) {
        console.log('parsed url: ' + req.par);
        
        coll.find({ url: req.par }, { _id:0, surl:1 }).toArray(function(err,data) {
            assert.equal(err, null);
            
            console.log(data);
            
            if (data[0]) {
                req.shorUrl = data[0].surl;
                next();
            }
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
        console.log('exit with surl = '+ req.shorUrl);
        res.send(result);
    });
    
    app.get(/^\/[a-zA-Z0-9]{6}$/, function(req, res){
        var reqSUrl = req.path.replace(/^\/*/,'');
        
        coll.findOne({ surl: reqSUrl }, { _id:0, url:1 }, function(err,data) {
            assert.equal(err, null);
            
            if (data) res.redirect(data.url);
            else res.end('Error: not in database');
        });
    });
    
    /*coll.dropAllIndexes(function(err, reply) {
      assert.equal(null, err);
    });*/
});

var filter = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i;

