import MarkdownItFootnote from "markdown-it-footnote";

export default {
  title: "Klima 2.0",
  head: `
    <link rel="icon" type="image/png" sizes="96x96" href="res/favicon-96x96.png">
    <link rel="icon" type="image/svg+xml" href="res/favicon.svg">
    <link rel="shortcut icon" href="res/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="res/apple-touch-icon.png">`,
  root: "src",
  style: "style.css",
  globalStylesheets: ["https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"],
  pages: [
    { name: "White Paper", path: "/whitepaper" },
    { name: "Carbon Selling Strategies", path: "/carbon-selling-strategies" },
  ],
  toc: true,
  pager: false,
  typographer: true,
  markdownIt: md => md.use(MarkdownItFootnote),
};
