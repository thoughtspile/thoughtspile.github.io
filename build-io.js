var Metalsmith = require('metalsmith');
var moment = require('moment');

var local = Boolean(process.argv[2]);

Metalsmith(__dirname)
    .metadata({
        debug: local,
        site: {
            title: 'Vladimir Klepov as a Blogger',
            url: local?
                'http://localhost:8082':
                'http://thoughtspile.github.io'
        }
    })
    .use(require('metalsmith-markdown')()) // parse .md
    .use(require('metalsmith-drafts')())
    .use(require('metalsmith-collections')({ // make posts
        posts: {
            pattern: 'blog/posts/*.html',
            sortBy: 'date',
            reverse: true
        },
        projects: {
            pattern: 'projects/all/*.html',
            sortBy: 'date',
            reverse: true
        }
    }))
    .use(require('metalsmith-excerpts')())
    .use(function(f) { // default layout
        Object.keys(f).filter(function(name) {
            return name.match('.html');
        }).forEach(function(name) {
            f[name].layout = f[name].layout || '../templates/article.html';
        });
    })
    .use(function(f, m) { // format dates
        Object.keys(f).forEach(function(key) {
            if (f[key].type == 'post')
                f[key].date = moment(f[key].date).format('MMMM D, YYYY');
        });
    })
    .use(require('metalsmith-permalinks')()) // pretty urls
    .use(function(f) { // backslash fix
        Object.keys(f).forEach(function(key) {
            if (f[key].path)
                f[key].path = f[key].path.replace('\\', '/');
        });
    })
    .use(require('metalsmith-in-place')({ engine: 'mustache' })) // post list
    .use(require('metalsmith-layouts')({ engine: 'mustache' }))
    .use(require('metalsmith-feed')({ collection: 'posts' }))
    .use(local? require('metalsmith-serve')({ port: 8082 }): function() {})
    .build(function(err) {
        console.log(err || 'build complete');
    });
