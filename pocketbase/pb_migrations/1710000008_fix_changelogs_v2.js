/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Fix: Ensure changelogs collection has correct fields, rules, and image_url
// =============================================================================
// Nuclear option — re-applies everything to the changelogs collection.
// Fixes listRule/viewRule which may have been set to null (superusers only).
// =============================================================================

migrate((app) => {
    const posts = app.findCollectionByNameOrId("posts")
    const users = app.findCollectionByNameOrId("users")

    let changelogs
    try {
        changelogs = app.findCollectionByNameOrId("changelogs")
    } catch (e) {
        // Collection doesn't exist — create it
        changelogs = new Collection({
            type: "base",
            name: "changelogs",
        })
    }

    // Fields
    changelogs.fields.add(new TextField({ name: "version", required: true, max: 100 }))
    changelogs.fields.add(new TextField({ name: "title", required: true, max: 300 }))
    changelogs.fields.add(new TextField({ name: "body", required: false }))
    changelogs.fields.add(new TextField({ name: "image_url", required: false, max: 2000 }))
    changelogs.fields.add(new RelationField({ name: "posts", required: false, maxSelect: 999, collectionId: posts.id }))
    changelogs.fields.add(new RelationField({ name: "author", required: true, maxSelect: 1, collectionId: users.id }))
    changelogs.fields.add(new BoolField({ name: "published", required: false }))

    // Rules — "" means open to everyone, null means superusers only
    changelogs.listRule = ""
    changelogs.viewRule = ""
    changelogs.createRule = "@request.auth.is_admin = true"
    changelogs.updateRule = "@request.auth.is_admin = true"
    changelogs.deleteRule = "@request.auth.is_admin = true"

    app.save(changelogs)

    console.log("=== CHANGELOGS COLLECTION FIXED ===")
    console.log("listRule:", JSON.stringify(changelogs.listRule))
    console.log("viewRule:", JSON.stringify(changelogs.viewRule))
    console.log("createRule:", JSON.stringify(changelogs.createRule))
    console.log("fields count:", changelogs.fields.length)

}, (app) => {
    console.log("Fix changelogs v2 migration reverted (no-op)")
})
