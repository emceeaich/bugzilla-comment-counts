/*
    Produce a list the top ten bugs in terms of number of
    comments added in the past week or --since
*/

const fetch = require('make-fetch-happen');
const moment = require('moment');

// by default, look at bugs with changes in the past week
var   since = moment.utc().subtract(1, 'week').format('YYYY-MM-DD');

var   format = 'JSON';
const bugDetailQuery = 'https://bugzilla.mozilla.org/rest/bug/';
var   bugListQuery = 'https://bugzilla.mozilla.org/rest/bug?include_fields=id,summary,component,product&f1=longdescs.count&f2=longdescs.count&limit=0&o1=changedafter&o2=greaterthan&v1=' + since + '&v2=1';

var commentCounts = [];
var requests = [];

/*
    If I'm running on the command line, see if there are arguments.
    If there are arguments, add them to the query.
*/

if (process && process.argv) {
    const args = require('optimist').argv;

    if (args.h || args.help) {
        console.log(`
Comment Count
arguments:
    -h or --help: this message
    --since: YYYY-MM-DD or default of since one week ago
    --product: BMO product name
    --component: BMO component name
        `);
        process.exit(0);
    }

    var products = '';
    if (args.product) {
        if (Array.isArray(args.product)) {
            products = args.product.reduce((prev, curr, i) => {
                return prev + '&product=' + encodeURIComponent(curr);
            },'')
        } else {
            products = '&product=' + encodeURIComponent(args.product);
        }
    }

    var components = '';
    if (args.component) {
        if (Array.isArray(args.component)) {
            components = args.component.reduce((prev, curr, i) => {
                return prev + '&component=' + encodeURIComponent(curr);
            },'')
        } else {
            components = '&component=' + encodeURIComponent(args.component);
        }
    }   

    if(args.since) {
        // TODO: catch the -N{period} format
        try {
            since = moment(args.since).utc().format('YYYY-MM-DD')
        } catch(e) {
            console.error('Invalid Date String')
            process.exit(1);
        }
    }

    if(args.format) {
        if(args.format.toLowerCase() === 'csv') {
            format = 'CSV';
        }
    }

    bugListQuery += products + components;
}

fetch(bugListQuery)
.then(res => { return res.json() })
.then(body => {
    if (body.bugs.length > 9999) {
        console.warn('You have asked for more bugs than we can fetch (10,000.)');
    }
    body.bugs.forEach(bug => {
        let currentBug = bug;
        requests.push(fetch(bugDetailQuery + currentBug.id + '/comment?new_since=' + since)
            .then(res => { return res.json() })
            .then(body => {
                let result = {
                    id: currentBug.id, 
                    summary: currentBug.summary,
                    product: currentBug.product,
                    component: currentBug.component,
                    comments: body.bugs[currentBug.id].comments.length
                }
                commentCounts.push(result);
            })
            .catch(err => console.log(err))
        );
    });
})
.then(() => { 
    Promise.all(requests).then(() => {
        commentCounts.sort((a, b) => {
            return (b.comments - a.comments);
        });
        if (format === 'CSV') {
            commentCounts.slice(0, 10).forEach(bug => {
                console.log('https://bugzilla.mozilla.org/show_bug.cgi?id=' + bug.id + ',"' + bug.summary + '","' + bug.product + '","' + bug.component + '",' + bug.comments);
            });
        } else {
            console.log(JSON.stringify({bugs: commentCounts.slice(0, 10)}));
        }
    });
});