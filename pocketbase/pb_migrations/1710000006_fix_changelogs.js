/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Fix: Add missing fields and rules to changelogs collection
// =============================================================================
// Same issue as 1710000001 — the collection was created but the fields were
// lost. This migration re-adds all fields and sets correct API rules.
// Also ensures the "released" status value exists on posts.
// =============================================================================

migrate((app) => {
    const posts = app.findCollectionByNameOrId("posts")
    const users = app.findCollectionByNameOrId("users")

    // -------------------------------------------------------------------------
    // 1. Ensure "released" exists in posts status field
    // -------------------------------------------------------------------------
    posts.fields.add(new SelectField({
        name: "status",
        required: true,
        values: ["new", "in_review", "processing", "done", "dropped", "later", "released"],
        maxSelect: 1,
    }))
    app.save(posts)
    console.log("Ensured 'released' status on posts")

    // -------------------------------------------------------------------------
    // 2. Fix changelogs collection — add all fields
    // -------------------------------------------------------------------------
    const changelogs = app.findCollectionByNameOrId("changelogs")

    changelogs.fields.add(new TextField({ name: "version", required: true, max: 100 }))
    changelogs.fields.add(new TextField({ name: "title", required: true, max: 300 }))
    changelogs.fields.add(new TextField({ name: "body", required: false }))
    changelogs.fields.add(new RelationField({ name: "posts", required: false, maxSelect: 999, collectionId: posts.id }))
    changelogs.fields.add(new RelationField({ name: "author", required: true, maxSelect: 1, collectionId: users.id }))
    changelogs.fields.add(new BoolField({ name: "published", required: false }))

    changelogs.listRule = ""
    changelogs.viewRule = ""
    changelogs.createRule = "@request.auth.is_admin = true"
    changelogs.updateRule = "@request.auth.is_admin = true"
    changelogs.deleteRule = "@request.auth.is_admin = true"

    app.save(changelogs)
    console.log("Fixed changelogs collection: fields + rules")

}, (app) => {
    console.log("Fix changelogs migration reverted (no-op)")
})
