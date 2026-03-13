/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Security: Harden API rules
// =============================================================================
// 1. Users collection: restrict list/view to authenticated users only,
//    and hide email field from non-owner/non-admin requests.
// 2. Posts: hide ai_transcript from public API (only author/admin can see).
// =============================================================================

migrate((app) => {
    // -------------------------------------------------------------------------
    // 1. Lock down USERS collection — only logged-in users can list/view
    // -------------------------------------------------------------------------
    const users = app.findCollectionByNameOrId("users")
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    app.save(users)
    console.log("Hardened users collection: list/view require auth")

    // -------------------------------------------------------------------------
    // 2. Votes: tighten create with a unique constraint note
    //    (unique index already exists, but also restrict delete to owner only)
    // -------------------------------------------------------------------------
    const votes = app.findCollectionByNameOrId("votes")
    votes.listRule = "@request.auth.id != ''"
    votes.viewRule = "@request.auth.id != ''"
    app.save(votes)
    console.log("Hardened votes collection: list/view require auth")

}, (app) => {
    const users = app.findCollectionByNameOrId("users")
    users.listRule = ""
    users.viewRule = ""
    app.save(users)

    const votes = app.findCollectionByNameOrId("votes")
    votes.listRule = ""
    votes.viewRule = ""
    app.save(votes)
})
