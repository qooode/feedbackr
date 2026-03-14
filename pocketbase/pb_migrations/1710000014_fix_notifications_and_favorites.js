/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Fix notifications & favorites — add missing fields and rules
// =============================================================================
// Migration 1710000013 created empty shell collections (the original rules
// used `= user` which PocketBase can't validate at migration time).
// This migration adds the actual fields, indexes, and corrected rules.
// =============================================================================

migrate((app) => {
    const users = app.findCollectionByNameOrId("users")
    const posts = app.findCollectionByNameOrId("posts")

    // --- Fix notifications ---
    const notifications = app.findCollectionByNameOrId("notifications")

    notifications.fields.add(new RelationField({ name: "user", required: true, maxSelect: 1, collectionId: users.id }))
    notifications.fields.add(new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }))
    notifications.fields.add(new TextField({ name: "type", required: true }))
    notifications.fields.add(new TextField({ name: "old_status", required: false }))
    notifications.fields.add(new TextField({ name: "new_status", required: true }))
    notifications.fields.add(new BoolField({ name: "read", required: false }))

    // Simple auth-check rules — ownership enforced in hooks
    notifications.listRule = "@request.auth.id != ''"
    notifications.viewRule = "@request.auth.id != ''"
    notifications.createRule = "@request.auth.is_admin = true"
    notifications.updateRule = "@request.auth.id != ''"
    notifications.deleteRule = "@request.auth.id != ''"

    app.save(notifications)
    console.log("Feedbackr: notifications collection fixed — fields and rules applied")

    // --- Fix favorites ---
    const favorites = app.findCollectionByNameOrId("favorites")

    favorites.fields.add(new RelationField({ name: "user", required: true, maxSelect: 1, collectionId: users.id }))
    favorites.fields.add(new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }))

    favorites.listRule = "@request.auth.id != ''"
    favorites.viewRule = "@request.auth.id != ''"
    favorites.createRule = "@request.auth.id != ''"
    favorites.updateRule = null
    favorites.deleteRule = "@request.auth.id != ''"

    favorites.indexes = [
        "CREATE UNIQUE INDEX idx_favorites_unique ON favorites (\"user\", post)",
    ]

    app.save(favorites)
    console.log("Feedbackr: favorites collection fixed — fields, rules, and unique index applied")

}, (app) => {
    // Revert: strip fields back to shells (not destructive — just removes our additions)
    try {
        const notifications = app.findCollectionByNameOrId("notifications")
        notifications.fields.removeByName("user")
        notifications.fields.removeByName("post")
        notifications.fields.removeByName("type")
        notifications.fields.removeByName("old_status")
        notifications.fields.removeByName("new_status")
        notifications.fields.removeByName("read")
        notifications.listRule = null
        notifications.viewRule = null
        notifications.updateRule = null
        notifications.deleteRule = null
        app.save(notifications)
    } catch {}

    try {
        const favorites = app.findCollectionByNameOrId("favorites")
        favorites.fields.removeByName("user")
        favorites.fields.removeByName("post")
        favorites.listRule = null
        favorites.viewRule = null
        favorites.deleteRule = null
        favorites.indexes = []
        app.save(favorites)
    } catch {}
})
