/*
Produce a list the top ten bugs in terms of number of
comments added in the past week
*/

const fetch = require('make-fetch-happen');
const moment = require('moment');

function isValid(format) {
    if (format && format.toLower() === 'csv') {
        return true;
    }
    return false;
}

function makeURLPath(name, value) {
    var pathSegment ='';
    
    if (Array.isArray(value)) {
        pathSegment = value.reduce((prev, curr, i) => {
            return prev + `&${name}=${encodeURIComponent(curr)}`;
        },'')
    } else if (typeof value !== '') {
        pathSegment = `&${name}=${encodeURIComponent(value)}`;
    }
    
    return pathSegment;
}

var CommentCounts = function(product, component, since, format) {
    this.products = product ? makeURLPath('product', product) : '';
    this.components = component ? makeURLPath('component', component) : '';
    this.since = since || moment.utc().subtract(1, 'week').format('YYYY-MM-DD');
    this.format = isValid(format) ? format : 'JSON';
};

CommentCounts.prototype.count = function() {
    const bugDetailQuery = 'https://bugzilla.mozilla.org/rest/bug/';
    var   bugListQuery = `https://bugzilla.mozilla.org/rest/bug?include_fields=id,summary,component,product&f1=longdescs.count&f2=longdescs.count&limit=0&o1=changedafter&o2=greaterthan&v1=${this.since}&v2=1`;
    
    var commentCounts = [];
    var requests = [];
    var result = '';
    
    bugListQuery += this.products + this.components;

    return fetch(bugListQuery)
    .then(res => { return res.json() })
    .then(body => {
        if (body.bugs.length > 9999) {
            console.warn('You have asked for more bugs than we can fetch (10,000.)');
        }
        body.bugs.forEach(bug => {
            let currentBug = bug;
            requests.push(fetch(bugDetailQuery + currentBug.id + '/comment?new_since=' + this.since)
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
        return Promise.all(requests).then(() => {
            commentCounts.sort((a, b) => {
                return (b.comments - a.comments);
            });
            if (this.format === 'CSV') {
                commentCounts.slice(0, 10).forEach(bug => {
                    result += `https://bugzilla.mozilla.org/show_bug.cgi?id=${bug.id},"${bug.summary}","${bug.product}","${bug.component}",${bug.comments}`;
                });
            } else {
                result = JSON.stringify({bugs: commentCounts.slice(0, 10)});
            }

            return result;
        });
    });
}

module.exports = CommentCounts;