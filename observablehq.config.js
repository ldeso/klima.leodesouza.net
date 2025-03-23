import MarkdownItFootnote from "markdown-it-footnote";

export default {
  title: "Klima Visualisations",
  head: `
    <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">`,
  root: "src",
  style: "style.css",
  sidebar: false,
  toc: true,
  pager: false,
  typographer: true,
  markdownIt: md => md.use(MarkdownItFootnote),
};
