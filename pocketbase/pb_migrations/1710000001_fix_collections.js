/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Fix: Add missing fields and API rules to posts, comments, votes
// =============================================================================
// The initial migration created the collections but the fields and rules
// were lost (likely recreated via admin UI as empty shells).
// This migration re-adds all fields and sets correct API rules.
// =============================================================================

migrate((app) => {
    // -------------------------------------------------------------------------
    // 1. Fix POSTS collection
    // -------------------------------------------------------------------------
    const posts = app.findCollectionByNameOrId("posts")
    const users = app.findCollectionByNameOrId("users")

    // Add missing fields (addField is idempotent — won't duplicate if exists)
    posts.fields.add(new TextField({ name: "title", required: true, max: 300 }))
    posts.fields.add(new TextField({ name: "body", required: true }))
    posts.fields.add(new SelectField({ name: "category", required: true, values: ["bug", "feature", "improvement"], maxSelect: 1 }))
    posts.fields.add(new SelectField({ name: "status", required: true, values: ["new", "in_review", "processing", "done", "dropped", "later"], maxSelect: 1 }))
    posts.fields.add(new SelectField({ name: "priority", required: true, values: ["low", "medium", "high", "critical"], maxSelect: 1 }))
    posts.fields.add(new RelationField({ name: "author", required: true, maxSelect: 1, collectionId: users.id }))
    posts.fields.add(new NumberField({ name: "votes_count", required: false, min: 0 }))
    posts.fields.add(new JSONField({ name: "ai_transcript", required: false }))

    // Fix API rules (null = superusers only, "" = open)
    posts.listRule = ""
    posts.viewRule = ""
    posts.createRule = "@request.auth.id != ''"
    posts.updateRule = "@request.auth.is_admin = true"
    posts.deleteRule = "@request.auth.is_admin = true"

    app.save(posts)
    console.log("Fixed posts collection: fields + rules")

    // -------------------------------------------------------------------------
    // 2. Fix COMMENTS collection
    // -------------------------------------------------------------------------
    const comments = app.findCollectionByNameOrId("comments")

    comments.fields.add(new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }))
    comments.fields.add(new RelationField({ name: "author", required: true, maxSelect: 1, collectionId: users.id }))
    comments.fields.add(new TextField({ name: "body", required: true }))
    comments.fields.add(new BoolField({ name: "is_ai_merged", required: false }))

    comments.listRule = ""
    comments.viewRule = ""
    comments.createRule = "@request.auth.id != ''"
    comments.updateRule = "@request.auth.id != ''"
    comments.deleteRule = "@request.auth.id != ''"

    app.save(comments)
    console.log("Fixed comments collection: fields + rules")

    // -------------------------------------------------------------------------
    // 3. Fix VOTES collection
    // -------------------------------------------------------------------------
    const votes = app.findCollectionByNameOrId("votes")

    votes.fields.add(new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }))
    votes.fields.add(new RelationField({ name: "user", required: true, maxSelect: 1, collectionId: users.id }))

    votes.listRule = ""
    votes.viewRule = ""
    votes.createRule = "@request.auth.id != ''"
    votes.updateRule = null  // intentionally locked
    votes.deleteRule = "@request.auth.id != ''"

    app.save(votes)
    console.log("Fixed votes collection: fields + rules")

    console.log("All collections fixed!")
}, (app) => {
    // Down migration — nothing to undo since we're just adding back what should have been there
    console.log("Fix migration reverted (no-op)")
})
