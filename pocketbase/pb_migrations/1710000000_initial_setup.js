/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Feedbackr — Initial Setup Migration
// =============================================================================
// Runs automatically on first boot. Creates all collections.
// API rules use ONLY simple expressions (no relation field references like
// author.id) to avoid PocketBase's migration-time validation issues.
// Ownership checks are enforced in hooks instead (main.pb.js).
// =============================================================================

migrate((app) => {
    // 1. Extend users with is_admin
    const users = app.findCollectionByNameOrId("users")
    users.fields.add(new BoolField({ name: "is_admin", required: false }))
    users.listRule = ""
    users.viewRule = ""
    users.updateRule = "@request.auth.id = id"
    users.deleteRule = "@request.auth.id = id"
    app.save(users)

    // 2. Create posts
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

    // 3. Create comments — simple rules only, ownership enforced in hooks
    const comments = new Collection({
        type: "base",
        name: "comments",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
            new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }),
            new RelationField({ name: "author", required: true, maxSelect: 1, collectionId: users.id }),
            new TextField({ name: "body", required: true }),
            new BoolField({ name: "is_ai_merged", required: false }),
        ],
    })
    app.save(comments)

    // 4. Create votes — simple rules only, ownership enforced in hooks
    const votes = new Collection({
        type: "base",
        name: "votes",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: null,
        deleteRule: "@request.auth.id != ''",
        fields: [
            new RelationField({ name: "post", required: true, maxSelect: 1, collectionId: posts.id, cascadeDelete: true }),
            new RelationField({ name: "user", required: true, maxSelect: 1, collectionId: users.id }),
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_votes_unique ON votes (post, \"user\")",
        ],
    })
    app.save(votes)

    // 5. Create superuser from env
    const suEmail = $os.getenv("PB_SUPERUSER_EMAIL")
    const suPassword = $os.getenv("PB_SUPERUSER_PASSWORD")
    if (suEmail && suPassword) {
        try {
            app.findAuthRecordByEmail("_superusers", suEmail)
        } catch {
            const superusers = app.findCollectionByNameOrId("_superusers")
            const record = new Record(superusers)
            record.set("email", suEmail)
            record.set("password", suPassword)
            app.save(record)
            console.log("Superuser created: " + suEmail)
        }
    }

    console.log("Feedbackr: all collections created!")
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
