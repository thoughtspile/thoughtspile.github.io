const htmlMinifier = require ('html-minifier')
const { DateTime } = require("luxon");
const { parse } = require('node-html-parser');
const config = require('./_data/config.json');
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function(eleventyConfig) {
  // Copy the `img` and `css` folders to the output
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("CNAME");

  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);

  eleventyConfig.addTransform('absoluteHrefs', (content, name) => {
    if (!name.endsWith('.html')) return content;

    const isExternal = href => href.startsWith('https://');
    const root = parse(content);
    for (const link of root.querySelectorAll("a")) {
      const href = link.getAttribute('href');
      if (href && isExternal(href)) {
        link.setAttribute("target", '_blank');
        link.setAttribute("rel", 'noopener');
      }
    }
    for (const css of root.querySelectorAll('link[rel=stylesheet]')) {
      if (!css.getAttribute('href')) throw new Error(`${css} has no href`);
      const url = new URL(config.base + css.getAttribute('href'));
      url.searchParams.append('ts', String(Date.now()));
      css.setAttribute('href', `${url.pathname}${url.search}`);
    }

    return root.toString();
  });

  eleventyConfig.addTransform('htmlMinifier', (content, name) => {
    if (!name.endsWith('.html')) return content;
    return htmlMinifier.minify(content, {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true,
    });
  });

  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });
  
  eleventyConfig.addFilter('getImages', (content) => {
    const images = parse(content).querySelectorAll('img:not([data-no-preview])').map(img => {
      const src = img.getAttribute('src');
      return `${config.base}${src}`;
    });
    return images.length ? images : [`${config.base}/images/main-promo.png`];
  });

  function filterTagList(tags) {
    return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
  }

  eleventyConfig.addFilter("filterTagList", filterTagList)

  // Create an array of all tags
  eleventyConfig.addCollection("tagList", function(collection) {
    let tagSet = new Set();
    collection.getAll().forEach(item => {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    });

    return filterTagList([...tagSet]);
  });

  // Override Browsersync defaults (used only with --serve)
  eleventyConfig.setBrowserSyncConfig({
    ui: false,
    ghostMode: false
  });
  
  js = eleventyConfig.javascriptFunctions;

  return {
    templateFormats: [
      "md",
      "ejs",
      "njk",
      "html",
    ],
    markdownTemplateEngine: 'ejs',
    htmlTemplateEngine: "ejs",
    dir: {
      input: ".",
      includes: "layout",
      data: "_data",
      output: "docs"
    }
  };
};
