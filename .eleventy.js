const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const jsdom = require("./node_modules/jsdom");
const { JSDOM } = jsdom;
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const embedTwitter = require("eleventy-plugin-embed-twitter");
const embedYouTube = require("eleventy-plugin-youtube-embed");

const EMBED_YOUTUBE = {
  lazy: true,
};

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(embedTwitter);
  eleventyConfig.addPlugin(embedYouTube, EMBED_YOUTUBE);
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("not_found.html");
  eleventyConfig.addTransform("responsiveimg", async (content, outputPath) => {
    // Only apply transforms if the output is HTML (not XML or CSS or something)
    if (outputPath.endsWith(".html")) {
      // Feed the content into JSDOM
      const dom = new JSDOM(content);
      const document = dom.window.document;

      // Find the image elements via `querySelectorAll`, replace this selector with your own custom one
      const imageElems = document.querySelectorAll("img");

      // If there are no matching elements, just return the original content :)

      if (imageElems.length === 0) {
        return content;
      }

      await imageElems;

      for (const imgElem of imageElems) {
        // Get the `src` of the image element
        const imgSrc = imgElem.getAttribute("src");

        // Only add this transform for internal images
        if (imgSrc.startsWith("/images/")) {
          let srcSet = [];

          // Replace all of the image sources with a new one that matches the results of the Sharp build

          const imgSrc80 = imgSrc.replace("/images/", "/images/80/");
          const imgSrc60 = imgSrc.replace("/images/", "/images/60/");
          const imgSrc40 = imgSrc.replace("/images/", "/images/40/");
          const imgSrc20 = imgSrc.replace("/images/", "/images/20/");

          // Get the metadata for the file and add it as the `${width}w` needed in defining a `srcset` in HTML for `<img>`

          const img80 = await sharp(path.join(__dirname, imgSrc80));
          const md80 = await img80.metadata();
          srcSet.push(`${imgSrc80} ${md80.width}w`);

          // Repeat

          const img60 = await sharp(path.join(__dirname, imgSrc60));
          const md60 = await img60.metadata();
          srcSet.push(`${imgSrc60} ${md60.width}w`);

          // Repeat

          const img40 = await sharp(path.join(__dirname, imgSrc40));
          const md40 = await img40.metadata();
          srcSet.push(`${imgSrc40} ${md40.width}w`);

          // Repeat

          const img20 = await sharp(path.join(__dirname, imgSrc20));
          const md20 = await img20.metadata();
          srcSet.push(`${imgSrc20} ${md20.width}w`);

          // Join the `srcset` into a string. that can be added to the `<img>` tag

          srcSet = srcSet.join(", ");

          // Set the `srcset` attribute

          imgElem.setAttribute("srcset", srcSet);

          // Find the new `src` for the WebP image

          const webpSrc = imgSrc
            .replace("/images/", "/images/webp/")
            .replace(/(png|jpg)/, "webp");

          // Create a separate `source` element for the WebP with feature detection via `type`

          const webpElement = document.createElement("source");
          webpElement.setAttribute("srcset", webpSrc);
          webpElement.setAttribute("type", "image/webp");

          // Wrap the `<img>` and the `<source>` into one `<picture>` tag in order for it to work

          const pictureElement = document.createElement("picture");
          pictureElement.appendChild(webpElement);
          pictureElement.appendChild(imgElem.cloneNode());

          // Replace the `<img>` with the `<picture>`

          imgElem.replaceWith(pictureElement);
        }
      }

      return "<!doctype html>" + document.documentElement.outerHTML;
    }

    return content;
  });
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
