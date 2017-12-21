const CommentCounts = require('./index.js');
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

var products = args.product || '';
var components = args.components || '';
var since = args.since || '';
var format = args.format || '';

var commentCounts = new CommentCounts(products, components, since, format);
commentCounts.count()
.then(result => console.log(result));