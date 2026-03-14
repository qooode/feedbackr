/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Add notifications and favorites collections
// =============================================================================
// 1. Notifications: tracks status changes on posts for the author
// 2. Favorites: lets users bookmark/save posts from others
// =============================================================================

migrate((app) => {
    const users = app.findCollectionByNameOrId("users")
    const posts = app.findCollectionByNameOrId("posts")

    // 1. Notifications collection
    const notifications = new Collection({
        type: "base",
        name: "notifications",
        listRule: "@request.auth.id = user",
        viewRule: "@request.auth.id = user",
        createRule: "@request.auth.is_admin = true",
        updateRule: "@request.auth.id = user",
        deleteRule: "@request.auth.id = user",
        fields: [
            new RelationField({ name: "user", required: true, maxSelect: 1, collectionId: users.id }),
            new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }),
            new TextField({ name: "type", required: true }),           // "status_change"
            new TextField({ name: "old_status", required: false }),
            new TextField({ name: "new_status", required: true }),
            new BoolField({ name: "read", required: false }),          // false = unread
        ],
    })
    app.save(notifications)
    console.log("Feedbackr: notifications collection created")

    // 2. Favorites collection
    const favorites = new Collection({
        type: "base",
        name: "favorites",
        listRule: "@request.auth.id = user",
        viewRule: "@request.auth.id = user",
        createRule: "@request.auth.id != ''",
        updateRule: null,
        deleteRule: "@request.auth.id = user",
        fields: [
            new RelationField({ name: "user", required: true, maxSelect: 1, collectionId: users.id }),
            new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }),
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_favorites_unique ON favorites (\"user\", post)",
        ],
    })
    app.save(favorites)
    console.log("Feedbackr: favorites collection created")

}, (app) => {
    try { app.delete(app.findCollectionByNameOrId("favorites")) } catch {}
    try { app.delete(app.findCollectionByNameOrId("notifications")) } catch {}
})
