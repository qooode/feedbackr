/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Add platform field to posts collection
// =============================================================================

migrate((app) => {
    const posts = app.findCollectionByNameOrId("posts")
    posts.fields.add(new SelectField({
        name: "platform",
        required: true,
        values: ["all", "iOS", "iPadOS", "macOS", "tvOS"],
        maxSelect: 1,
    }))
    app.save(posts)

    console.log("Feedbackr: added platform field to posts")
}, (app) => {
    const posts = app.findCollectionByNameOrId("posts")
    posts.fields.removeByName("platform")
    app.save(posts)
})
