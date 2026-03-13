/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Security: Tighten API rules for comments and votes
// =============================================================================
// Previously: any authenticated user could update/delete any comment or vote.
// Now: only the owner (or admin for comments) can modify/delete.
// =============================================================================

migrate((app) => {
    // Comments: only author or admin can update/delete
    const comments = app.findCollectionByNameOrId("comments")
    comments.updateRule = "@request.auth.id = author || @request.auth.is_admin = true"
    comments.deleteRule = "@request.auth.id = author || @request.auth.is_admin = true"
    app.save(comments)
    console.log("Tightened comments API rules")

    // Votes: only the voter can delete their vote
    const votes = app.findCollectionByNameOrId("votes")
    votes.deleteRule = "@request.auth.id = user"
    app.save(votes)
    console.log("Tightened votes API rules")
}, (app) => {
    const comments = app.findCollectionByNameOrId("comments")
    comments.updateRule = "@request.auth.id != ''"
    comments.deleteRule = "@request.auth.id != ''"
    app.save(comments)

    const votes = app.findCollectionByNameOrId("votes")
    votes.deleteRule = "@request.auth.id != ''"
    app.save(votes)
})
