# Bugzilla Comment Counts

Compute the top 10 bugs in terms of new comments over a period of time (default of one week)

This module exports a CommentCount object. 

Use that to make an instance specifying optional arrays of Bugzilla products, and components, an optional date string in the format YYYY-MM-DD to indicate how far back to go, and a format CSV or JSON (JSON is emitted by default.)

See the clj.js file for example usage.

