const path = require("path");
const fs = require("fs");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const embedTwitter = require("eleventy-plugin-embed-twitter");
const embedYouTube = require("eleventy-plugin-youtube-embed");
const markdownIt = require("markdown-it");
const markdownItKatex = require("markdown-it-katex");
const markdownItFootnote = require("markdown-it-footnote");
const navigation = require("@11ty/eleventy-navigation");
const emojiReadTime = require("@11tyrocks/eleventy-plugin-emoji-readtime");
const { format } = require("date-fns");
const {
  MD_CONFIG,
  EMBED_YOUTUBE_CONFIG,
  GRAY_MATTER_CONFIG,
  DDMMYYYY,
  ELLIPSIS,
  EMOJI_READ_CONFIG,
} = require("./11ty/constants");
const { responsiveImgCb } = require("./11ty/transforms");

const dateFormatCb = (unformat) => format(unformat, DDMMYYYY);
const ellipsisCb = (value) => `${value}${ELLIPSIS}`;

module.exports = function (eleventyConfig) {
  let markdownLib = markdownIt(MD_CONFIG)
    .use(markdownItKatex)
    .use(markdownItFootnote);
  eleventyConfig.addFilter("date", dateFormatCb);
  eleventyConfig.addFilter("ellipsis", ellipsisCb);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(embedTwitter);
  eleventyConfig.addPlugin(embedYouTube, EMBED_YOUTUBE_CONFIG);
  eleventyConfig.addPlugin(navigation);
  eleventyConfig.addPlugin(emojiReadTime, EMOJI_READ_CONFIG);
  eleventyConfig.setLibrary("md", markdownLib);
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("not_found.html");
  eleventyConfig.setFrontMatterParsingOptions(GRAY_MATTER_CONFIG);
  eleventyConfig.addTransform("responsiveimg", responsiveImgCb);
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, bs) {
        bs.addMiddleware("*", (req, res) => {
          const content_404 = fs.readFileSync(
            path.join(__dirname, "not_found.html")
          );
          // Add 404 http status code in request header.
          res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      },
    },
  });
  return {
    passthroughFileCopy: true,
  };
};
