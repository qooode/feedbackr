/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Add comment notification support
// =============================================================================
// Extends the notifications collection with:
// - "message" field: human-readable text (e.g. "commented on your post")
// - "actor" field: relation to the user who triggered the notification
//                  (the commenter, not the recipient)
// - Makes old_status/new_status optional (they're only for status_change type)
// =============================================================================

migrate((app) => {
    const users = app.findCollectionByNameOrId("users")
    const notifications = app.findCollectionByNameOrId("notifications")

    // Add new fields (addField/add is idempotent)
    notifications.fields.add(new TextField({ name: "message", required: false }))
    notifications.fields.add(new RelationField({
        name: "actor",
        required: false,
        maxSelect: 1,
        collectionId: users.id,
    }))

    // Make new_status not required (comment notifications won't have it)
    // We need to re-add it without required: true
    notifications.fields.add(new TextField({ name: "new_status", required: false }))

    app.save(notifications)
    console.log("Feedbackr: notifications collection updated with message + actor fields")

}, (app) => {
    try {
        const notifications = app.findCollectionByNameOrId("notifications")
        notifications.fields.removeByName("message")
        notifications.fields.removeByName("actor")
        // Restore new_status as required
        notifications.fields.add(new TextField({ name: "new_status", required: true }))
        app.save(notifications)
    } catch {}
})
