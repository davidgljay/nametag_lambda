var https = require('https')

exports.handler = (event, context, callback) => {
    var start = event.start ? '&start=' + event.start : '';
    https.get("https://www.googleapis.com/customsearch/v1?q=" + encodeURI(event.query) + "&cx=003788376846115390289%3Axu9fqjzvy6i&rights=cc_publicdomain&safe=medium" + start + "&searchType=image&key=AIzaSyAMbpyB8iTXlE3zvyJLZAjwayznSAZPGJw", (res) => {
        var body = '';
        if (res.statusCode !== 200) {
            callback('Error ' + res.statusCode)
        }
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body = body + chunk;
        });
        res.on('end', () => {
            callback(null, body)
        });
        res.on('error', (err) => callback(err))
    })
};
