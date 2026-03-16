/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Migration: Add attachments field to posts collection
// =============================================================================
// Stores an array of Catbox URLs as a JSON field on posts.
// Example: ["https://files.catbox.moe/abc123.png", "https://files.catbox.moe/xyz789.mp4"]
// =============================================================================

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("posts")

    collection.fields.add(
      new Field({
        name: "attachments",
        type: "json",
        required: false,
        maxSize: 5000,
      })
    )

    app.save(collection)
    console.log("[migration] Added 'attachments' JSON field to posts collection")
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("posts")
    collection.fields.removeByName("attachments")
    app.save(collection)
  }
)
