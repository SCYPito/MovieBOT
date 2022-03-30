'use strict'
const
    config = require('config'),
    express = require('express'),
    request = require('request');

var app = express();

var port = process.env.PORT || process.env.port || 5000;
app.set('port',port);  
app.use(express.json());
app.listen(app.get('port'),function(){
    console.log('[app.listen] Node app is running on port',app.get('port'));
});
module.exports = app;
const MOVIE_API_KEY = config.get('MovieDB_API_Key');

app.post('/webhook',function(req, res){
    let data = req.body;
    let queryMovieName = data.queryResult.parameters.MovieName;
    //As Browser
    let propertiesObject = {
        query : queryMovieName,
        api_key : MOVIE_API_KEY,
        language : 'zh-TW'
    };
    request({
        uri : 'https://api.themoviedb.org/3/search/movie?',
        json : true,
        qs : propertiesObject 
    },function(error, response, body){
        if(!error && response.statusCode == 200){
            //正常運作
            if(body.results.length != 0){
                let thisFulfillmentMessages =[];
                // 電影名稱+電影簡介+電影海報
                let movieTitleObject ={};
                if(body.results[0].title == queryMovieName) {
                    movieTitleObject.text = {text:[body.results[0].title]};
                }else{
                    movieTitleObject.text = {text:["系統內最相關的電影是"+body.results[0].title]};
                }
                thisFulfillmentMessages.push(movieTitleObject);
                //簡介
                if(body.results[0].overview){
                    let movieOverViewObject = {};
                    movieOverViewObject.text = {text:[body.results[0].overview]};
                    thisFulfillmentMessages.push(movieOverViewObject);
                }
                //海報
                if(body.results[0].poster_path){
                    let movieImageObject = {};
                    //movieImageObject.image = {imageUri:"https://image.tmdb.org/t/p/w185"+body.results[0].poster_path};
                    movieImageObject.image = {imageUri:"https://image.tmdb.org/t/p/original"+body.results[0].poster_path}; //原本海報大小
                    thisFulfillmentMessages.push(movieImageObject);
                }
                // 建立LINEBOT專屬結構物件
                let additionalObject = {};
                // 增加additionalObject物件quickReplies物件
                additionalObject.quickReplies = {};
                // 增加quickReplies物件title屬性
                additionalObject.quickReplies.title = "請問你還要查詢其他電影嗎?請點擊下方按鈕(手機Only)或輸入我想查詢電影簡介";
                additionalObject.quickReplies.quickReplies = [];
                let quick_Replie1 = "我想查詢電影簡介";
                additionalObject.quickReplies.quickReplies.push(quick_Replie1);
                thisFulfillmentMessages.push(additionalObject);
                res.json({fulfillmentMessages:thisFulfillmentMessages});                
            }else{
                res.json({fulfillmentText:"很抱歉，系統裡面沒有這部電影"});
            }              
        }else{
            console.log('[The MovieDB] fail');
            console.log(error);
            console.log(response.statusCode);
        }
    })   
});