'use strict'

const AWS = require('aws-sdk');
const http = require('http');
const https = require('https');
const fs = require('fs');
const imagemagick = require('imagemagick');
const S3 = new AWS.S3();
const urlRegex = new RegExp('https?\:\/\/([^\/]+)\/(.+)');

exports.handler = function(event, context, callback) {
    const url = event.url;
    //Get URL
    getProtocol(url).get(url, (res) => {
        
        let buf=[];

        if (res.statusCode === 200) {
          res.on("data", function(data) {
              buf.push(data);
          })
          
          res.on("end", function() {
              resizeAndUpload(buf, event, callback)
          });
          
        } else {
            callback('Image not found');
        }
    })

}

function resizeAndUpload(imgBuffer, event, callback) {
    const url = event.url;
    const filename = hash(url) + '.jpg';
    const sizes = event.sizes;
    let promises = [];
    

      for (let i = sizes.length - 1; i >= 0; i--) {
        const width = sizes[i].width;
        const height = sizes[i].height;
        const imgData = Buffer.concat(imgBuffer);
        //Resize image
        promises.push(
            resize(imgData, getFileType(url), width, height)
            .then(function(resizedImg) {
                return s3Upload(resizedImg, width, height, filename);
            })
        );
      }
      
      Promise.all(promises).then(function() {
        callback(null, filename);  
      }, function(err) {
        callback(err);
      })
}
function getFileType(url) {
    return new RegExp('[a-z]{3,4}$').exec(url)[0];
}

function getProtocol(url) {
    if (url.slice(0,5) === 'https') {
        return https;
    } else {
        return http;
    }
}

function hash(string) {
  let hash = 0, i, chr, len;
  if (string.length === 0) return hash;
  for (i = 0, len = string.length; i < len; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

//Returns stream with resized image
function resize(imageData, imageType, width, height) {
    return new Promise(function(resolve, reject) {
        var params = {
            srcData:   imageData,
            srcFormat: imageType,
            format:    'jpg',
            width: width,
            height: height,
            progressize: false
        };
        imagemagick.resize(params, function(err, stdout, stderr) {
            if ( err || stderr ) {
              reject("ImageMagick err" + (err || stderr));
            } else {
              resolve(stdout);
            }
        })  
    })
}

function s3Upload (resizedImg, width, height, filename) {
    return new Promise(function(resolve, reject) {
        //Upload to S3
        let params = {
            Bucket: 'nametag_images', 
            Key: 'user_icons/' + width + 'X' + height + '/' + filename , 
            Body: new Buffer(resizedImg, "binary"), 
            ACL:'public-read'
        };
        S3.upload(params, function(err, data) {
          if (err) {reject(err)}
          else {resolve(data)}
        });
    })
}