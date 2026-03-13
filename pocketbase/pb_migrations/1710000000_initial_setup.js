/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Feedbackr — Initial Migration
// =============================================================================
// Auto-creates all collections on first boot. No manual setup required.
//
// Two-pass approach: create collections first (no rules), then apply API rules.
// PocketBase validates rules against relation fields, so fields must exist first.
// =============================================================================

migrate((app) => {
    // =========================================================================
    // 1. Extend the built-in users auth collection with is_admin field
    // =========================================================================
    const users = app.findCollectionByNameOrId("users")

    users.fields.add(new BoolField({
        name: "is_admin",
        required: false,
    }))

    users.listRule = ""
    users.viewRule = ""
    users.updateRule = "@request.auth.id = id"
    users.deleteRule = "@request.auth.id = id"

    app.save(users)

    // =========================================================================
    // 2. Create "posts" collection (no relation-dependent rules yet)
    // =========================================================================
    const posts = new Collection({
        type: "base",
        name: "posts",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.is_admin = true",
        deleteRule: "@request.auth.is_admin = true",
        fields: [
            new TextField({ name: "title", required: true, max: 300 }),
            new TextField({ name: "body", required: true }),
            new SelectField({ name: "category", required: true, values: ["bug", "feature", "improvement"], maxSelect: 1 }),
            new SelectField({ name: "status", required: true, values: ["new", "in_review", "processing", "done", "dropped", "later"], maxSelect: 1 }),
            new SelectField({ name: "priority", required: true, values: ["low", "medium", "high", "critical"], maxSelect: 1 }),
            new RelationField({ name: "author", required: true, maxSelect: 1, collectionId: users.id }),
            new NumberField({ name: "votes_count", required: false, min: 0 }),
            new JSONField({ name: "ai_transcript", required: false }),
        ],
    })
    app.save(posts)

    // =========================================================================
    // 3. Create "comments" collection (permissive rules first)
    // =========================================================================
    const comments = new Collection({
        type: "base",
        name: "comments",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: null,
        deleteRule: null,
        fields: [
            new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }),
            new RelationField({ name: "author", required: true, maxSelect: 1, collectionId: users.id }),
            new TextField({ name: "body", required: true }),
            new BoolField({ name: "is_ai_merged", required: false }),
        ],
    })
    app.save(comments)

    // =========================================================================
    // 4. Create "votes" collection (permissive rules first)
    // =========================================================================
    const votes = new Collection({
        type: "base",
        name: "votes",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: null,
        deleteRule: null,
        fields: [
            new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }),
            new RelationField({ name: "user", required: true, maxSelect: 1, collectionId: users.id }),
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_votes_unique ON votes (post, \"user\")",
        ],
    })
    app.save(votes)

    // =========================================================================
    // 5. Now apply relation-dependent API rules (fields exist, so validation passes)
    // =========================================================================
    const savedComments = app.findCollectionByNameOrId("comments")
    savedComments.updateRule = "@request.auth.id = author.id"
    savedComments.deleteRule = "@request.auth.id = author.id || @request.auth.is_admin = true"
    app.save(savedComments)

    const savedVotes = app.findCollectionByNameOrId("votes")
    savedVotes.deleteRule = "@request.auth.id = user.id"
    app.save(savedVotes)

    // =========================================================================
    // 6. Create initial superuser from env vars (if provided)
    // =========================================================================
    const superuserEmail = $os.getenv("PB_SUPERUSER_EMAIL")
    const superuserPassword = $os.getenv("PB_SUPERUSER_PASSWORD")

    if (superuserEmail && superuserPassword) {
        try {
            app.findAuthRecordByEmail("_superusers", superuserEmail)
        } catch {
            const superusers = app.findCollectionByNameOrId("_superusers")
            const record = new Record(superusers)
            record.set("email", superuserEmail)
            record.set("password", superuserPassword)
            app.save(record)
            console.log("Superuser created: " + superuserEmail)
        }
    }

    console.log("Feedbackr migration complete — all collections created!")

}, (app) => {
    try { app.delete(app.findCollectionByNameOrId("votes")) } catch {}
    try { app.delete(app.findCollectionByNameOrId("comments")) } catch {}
    try { app.delete(app.findCollectionByNameOrId("posts")) } catch {}
    try {
        const users = app.findCollectionByNameOrId("users")
        users.fields.removeByName("is_admin")
        app.save(users)
    } catch {}
})
