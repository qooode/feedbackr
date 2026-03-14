/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Add reply threading to comments (1-level deep, YouTube-style)
// =============================================================================
// Adds an optional "parent" relation field to comments.
// - null parent = top-level comment
// - parent set = reply to that comment
// Backend hooks enforce max 1 level (can't reply to a reply).
// =============================================================================

migrate((app) => {
    const comments = app.findCollectionByNameOrId("comments")

    comments.fields.add(new RelationField({
        name: "parent",
        required: false,
        maxSelect: 1,
        collectionId: comments.id,
        cascadeDelete: true,  // delete replies when parent comment is deleted
    }))

    app.save(comments)
    console.log("Feedbackr: added 'parent' field to comments for reply threading")

}, (app) => {
    try {
        const comments = app.findCollectionByNameOrId("comments")
        comments.fields.removeByName("parent")
        app.save(comments)
    } catch {}
})
