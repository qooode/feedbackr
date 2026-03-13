/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Fix: Add missing created/updated autodate fields to posts and comments
// =============================================================================
// The posts and comments collections were created without the standard
// created/updated autodate fields, causing "Invalid Date" in the frontend.
// =============================================================================

migrate((app) => {
    // -------------------------------------------------------------------------
    // 1. Add autodate fields to POSTS
    // -------------------------------------------------------------------------
    const posts = app.findCollectionByNameOrId("posts")

    posts.fields.add(new AutodateField({
        name: "created",
        onCreate: true,
        onUpdate: false,
    }))
    posts.fields.add(new AutodateField({
        name: "updated",
        onCreate: true,
        onUpdate: true,
    }))

    app.save(posts)
    console.log("Added created/updated autodate fields to posts")

    // -------------------------------------------------------------------------
    // 2. Add autodate fields to COMMENTS
    // -------------------------------------------------------------------------
    const comments = app.findCollectionByNameOrId("comments")

    comments.fields.add(new AutodateField({
        name: "created",
        onCreate: true,
        onUpdate: false,
    }))
    comments.fields.add(new AutodateField({
        name: "updated",
        onCreate: true,
        onUpdate: true,
    }))

    app.save(comments)
    console.log("Added created/updated autodate fields to comments")

    // -------------------------------------------------------------------------
    // 3. Add autodate fields to VOTES (for consistency)
    // -------------------------------------------------------------------------
    const votes = app.findCollectionByNameOrId("votes")

    votes.fields.add(new AutodateField({
        name: "created",
        onCreate: true,
        onUpdate: false,
    }))
    votes.fields.add(new AutodateField({
        name: "updated",
        onCreate: true,
        onUpdate: true,
    }))

    app.save(votes)
    console.log("Added created/updated autodate fields to votes")

    console.log("All autodate fields added!")
}, (app) => {
    console.log("Autodate migration reverted (no-op)")
})
