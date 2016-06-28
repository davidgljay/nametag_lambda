'use strict'

const AWS = require('aws-sdk');
const http = require('http');
const https = require('https');
const S3 = new AWS.S3();
const urlRegex = new RegExp('https?\:\/\/([^\/]+)\/(.+)');

exports.handler = function(event, context, callback) {
    const url = event.url;
    const filename = hash(url) + getFileType(url);
    //Get URL
    getProtocol(url).get(url, (res) => {
        //Upload to S3
        if (res.statusCode === 200) {
            let params = {Bucket: 'nametag_images', Key: 'user_icons/raw/' + filename , Body: res, ACL:'public-read'};
            S3.upload(params, function(err, data) {
              if (err) {context.fail(err)}
              else {callback(null, data)}
            });
        } else {
            callback('Image not found');
        }
    })

}
function getFileType(url) {
    return new RegExp('\..{3,4}$').exec(url)[0];
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