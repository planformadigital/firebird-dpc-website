const escapeHtml = (value = "") => {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));

async function renderListing() {
  const container = document.querySelector("#blog-posts");
  if (!container) return;
  try {
    const response = await fetch("/api/blog/posts");
    if (!response.ok) throw new Error();
    const posts = await response.json();
    if (!posts.length) {
      container.className = "";
      container.innerHTML = '<div class="blog-empty"><h2>New articles are coming soon.</h2><p>Check back for practical guidance from Dr. Mark Hagen and Firebird Direct Primary Care.</p></div>';
      return;
    }
    container.innerHTML = posts.map((post) => `
      <article class="post-card">
        ${post.featuredImage ? `<a href="/blog/${encodeURIComponent(post.slug)}/"><img class="post-card__image" src="${escapeHtml(post.featuredImage)}" alt="${escapeHtml(post.imageAlt)}" loading="lazy" /></a>` : ""}
        <div class="post-card__body">
          <p class="post-meta">${formatDate(post.date)} · ${escapeHtml(post.author)}</p>
          <h2><a href="/blog/${encodeURIComponent(post.slug)}/">${escapeHtml(post.title)}</a></h2>
          <p class="post-card__summary">${escapeHtml(post.description)}</p>
        </div>
      </article>`).join("");
  } catch {
    container.className = "";
    container.innerHTML = '<div class="blog-empty"><h2>Articles are temporarily unavailable.</h2><p>Please check back soon.</p></div>';
  }
}

async function renderArticle() {
  const container = document.querySelector("#article");
  if (!container) return;
  const parts = location.pathname.split("/").filter(Boolean);
  const slug = parts[1] || "";
  try {
    const response = await fetch(`/api/blog/posts?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error();
    const post = await response.json();
    document.title = `${post.title} | Firebird Direct Primary Care`;
    document.querySelector('meta[name="description"]').content = post.description;
    container.innerHTML = `
      <header class="blog-shell article-header">
        <p class="blog-eyebrow">Firebird DPC Blog</p>
        <h1 class="article-title">${escapeHtml(post.title)}</h1>
        <p class="article-description">${escapeHtml(post.description)}</p>
        <p class="post-meta">By ${escapeHtml(post.author)} · ${formatDate(post.date)}</p>
      </header>
      ${post.featuredImage ? `<img class="article-image" src="${escapeHtml(post.featuredImage)}" alt="${escapeHtml(post.imageAlt)}" />` : ""}
      <article class="article-body">${post.bodyHtml}<p><a class="back-link" href="/blog/">← Back to the Blog</a></p></article>`;
  } catch {
    container.innerHTML = '<div class="blog-shell article-header"><h1>Article not found</h1><p><a class="back-link" href="/blog/">Return to the Blog</a></p></div>';
  }
}

renderListing();
renderArticle();
