const $ = (selector) => document.querySelector(selector);
const api = "/api/blog/admin/posts";
let posts = [];

const today = () => new Date().toISOString().slice(0, 10);
const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function showOnly(id) {
  ["#loading", "#login-panel", "#forbidden-panel", "#editor-app"].forEach((selector) => {
    $(selector).hidden = selector !== id;
  });
}

function clearForm() {
  $("#post-form").reset();
  $("#post-id").value = "";
  $("#post-author").value = "Dr. Mark Hagen";
  $("#post-date").value = today();
  $("#post-featured-image").value = "";
  $("#image-preview-wrap").hidden = true;
  $("#delete-post-button").hidden = true;
  $("#save-message").textContent = "";
  document.querySelectorAll(".post-list button").forEach((button) => button.classList.remove("active"));
}

function fillForm(post) {
  $("#post-id").value = post.id;
  $("#post-title").value = post.title;
  $("#post-slug").value = post.slug;
  $("#post-description").value = post.description;
  $("#post-author").value = post.author;
  $("#post-date").value = post.date.slice(0, 10);
  $("#post-status").value = post.status;
  $("#post-featured-image").value = post.featuredImage || "";
  $("#post-image-alt").value = post.imageAlt || "";
  $("#post-body").value = post.body;
  $("#delete-post-button").hidden = false;
  if (post.featuredImage) {
    $("#image-preview").src = post.featuredImage;
    $("#image-preview").alt = post.imageAlt || "";
    $("#image-preview-wrap").hidden = false;
  } else {
    $("#image-preview-wrap").hidden = true;
  }
}

function renderList() {
  const list = $("#post-list");
  list.innerHTML = "";
  if (!posts.length) {
    list.innerHTML = "<p>No posts yet. Create the first one.</p>";
    return;
  }
  posts.forEach((post) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.id = post.id;
    button.innerHTML = `<strong></strong><small></small>`;
    button.querySelector("strong").textContent = post.title;
    button.querySelector("small").textContent = `${post.status} · ${post.date.slice(0, 10)}`;
    button.addEventListener("click", () => {
      document.querySelectorAll(".post-list button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      fillForm(post);
    });
    list.append(button);
  });
}

async function loadPosts() {
  const response = await fetch(api, { credentials: "same-origin" });
  if (response.status === 401) return showOnly("#login-panel");
  if (response.status === 403) return showOnly("#forbidden-panel");
  if (!response.ok) throw new Error("Could not load posts.");
  posts = await response.json();
  showOnly("#editor-app");
  renderList();
  clearForm();
}

$("#new-post-button").addEventListener("click", clearForm);
$("#post-title").addEventListener("input", () => {
  if (!$("#post-id").value) $("#post-slug").value = slugify($("#post-title").value);
});

$("#post-image-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  $("#save-message").textContent = "Uploading image…";
  const response = await fetch("/api/blog/admin/upload", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": file.type,
      "x-file-name": encodeURIComponent(file.name),
    },
    body: file,
  });
  if (!response.ok) {
    $("#save-message").textContent = await response.text();
    return;
  }
  const result = await response.json();
  $("#post-featured-image").value = result.url;
  $("#image-preview").src = result.url;
  $("#image-preview").alt = $("#post-image-alt").value;
  $("#image-preview-wrap").hidden = false;
  $("#save-message").textContent = "Image uploaded.";
});

$("#post-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#save-message").textContent = "Saving…";
  const payload = {
    id: $("#post-id").value || undefined,
    title: $("#post-title").value.trim(),
    slug: slugify($("#post-slug").value),
    description: $("#post-description").value.trim(),
    author: $("#post-author").value.trim(),
    date: $("#post-date").value,
    status: $("#post-status").value,
    featuredImage: $("#post-featured-image").value,
    imageAlt: $("#post-image-alt").value.trim(),
    body: $("#post-body").value,
  };
  const response = await fetch(api, {
    method: payload.id ? "PUT" : "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    $("#save-message").textContent = await response.text();
    return;
  }
  const saved = await response.json();
  $("#save-message").textContent = "Saved.";
  await loadPosts();
  const button = document.querySelector(`.post-list button[data-id="${CSS.escape(saved.id)}"]`);
  if (button) button.click();
});

$("#delete-post-button").addEventListener("click", async () => {
  const id = $("#post-id").value;
  if (!id || !confirm("Delete this post permanently?")) return;
  const response = await fetch(`${api}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) {
    $("#save-message").textContent = await response.text();
    return;
  }
  await loadPosts();
});

loadPosts().catch((error) => {
  $("#loading").innerHTML = `<p>${error.message}</p>`;
});
