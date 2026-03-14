/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Add changelogs collection + "released" status to posts
// =============================================================================
// When admin publishes a changelog, the included posts move from "done" to
// "released" so they leave the kanban board. The changelog stores the version
// label, body text, and references to the included posts.
// =============================================================================

migrate((app) => {
    // -------------------------------------------------------------------------
    // 1. Add "released" value to the posts status field
    // -------------------------------------------------------------------------
    const posts = app.findCollectionByNameOrId("posts")

    // Replace the status select field with an updated values list
    posts.fields.add(new SelectField({
        name: "status",
        required: true,
        values: ["new", "in_review", "processing", "done", "dropped", "later", "released"],
        maxSelect: 1,
    }))

    app.save(posts)
    console.log("Added 'released' status to posts")

    // -------------------------------------------------------------------------
    // 2. Create changelogs collection
    // -------------------------------------------------------------------------
    const users = app.findCollectionByNameOrId("users")

    const changelogs = new Collection({
        type: "base",
        name: "changelogs",
        listRule: "",     // anyone can read
        viewRule: "",     // anyone can read
        createRule: "@request.auth.is_admin = true",
        updateRule: "@request.auth.is_admin = true",
        deleteRule: "@request.auth.is_admin = true",
        fields: [
            new TextField({ name: "version", required: true, max: 100 }),
            new TextField({ name: "title", required: true, max: 300 }),
            new TextField({ name: "body", required: false }),
            new RelationField({ name: "posts", required: false, maxSelect: 999, collectionId: posts.id }),
            new RelationField({ name: "author", required: true, maxSelect: 1, collectionId: users.id }),
            new BoolField({ name: "published", required: false }),
        ],
    })
    app.save(changelogs)
    console.log("Created changelogs collection")

}, (app) => {
    // Down migration
    try { app.delete(app.findCollectionByNameOrId("changelogs")) } catch {}
    try {
        const posts = app.findCollectionByNameOrId("posts")
        posts.fields.add(new SelectField({
            name: "status",
            required: true,
            values: ["new", "in_review", "processing", "done", "dropped", "later"],
            maxSelect: 1,
        }))
        app.save(posts)
    } catch {}
})
