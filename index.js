const fetch = require('make-fetch-happen');
const since = '2017-11-14';
const bugListQuery = 'https://bugzilla.mozilla.org/rest/bug?include_fields=id,summary&component=WebExtensions%3A%20Android&component=WebExtensions%3A%20Compatibility&component=WebExtensions%3A%20Developer%20Tools&component=WebExtensions%3A%20Experiments&component=WebExtensions%3A%20Frontend&component=WebExtensions%3A%20General&component=WebExtensions%3A%20Request%20Handling&component=WebExtensions%3A%20Storage&component=WebExtensions%3A%20Untriaged&f1=longdescs.count&f2=longdescs.count&limit=0&o1=changedafter&o2=greaterthan&v1=' + since + '&v2=1';
const bugDetailQuery = 'https://bugzilla.mozilla.org/rest/bug/';

var commentCounts = [];
var requests = [];

fetch(bugListQuery)
.then(res => { return res.json() })
.then(body => { 
    body.bugs.forEach(bug => {
        let currentBug = bug;
        requests.push(fetch(bugDetailQuery + currentBug.id + '/comment?new_since=' + since)
            .then(res => { return res.json() })
            .then(body => {
                let result = {
                    id: currentBug.id, 
                    summary: currentBug.summary,
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
        commentCounts.slice(0, 10).forEach(bug => {
            console.log(bug.id + ',"' + bug.summary + '",' + bug.comments);
        });
    });
});
