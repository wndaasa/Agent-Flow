import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

export default function renderMarkdown(text) {
  return md.render(String(text ?? ""));
}
