const htmlMinifier = require ('html-minifier')
const { DateTime } = require("luxon");
const { parse } = require('node-html-parser')
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const externalLinks = require('eleventy-plugin-external-links');

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
  eleventyConfig.addPlugin(externalLinks);

  eleventyConfig.addTransform('htmlMinifier', (content, name) => {
    if (!name.endsWith('.html')) return content;
    return htmlMinifier.minify(content, {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true,
    });
  })

  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });
  
  eleventyConfig.addFilter('getImages', (content) => {
    return parse(content).querySelectorAll('img').map(img => img.getAttribute('src'));
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

  // Customize Markdown library and settings:
  // let markdownLibrary = markdownIt({
  //   html: true,
  //   linkify: true
  // }).use(markdownItAnchor, {
  //   permalink: markdownItAnchor.permalink.ariaHidden({
  //     placement: "after",
  //     class: "direct-link",
  //     symbol: "#"
  //   }),
  //   level: [1,2,3,4],
  //   slugify: eleventyConfig.getFilter("slugify")
  // });
  // eleventyConfig.setLibrary("md", markdownLibrary);

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
      output: "_site"
    }
  };
};
