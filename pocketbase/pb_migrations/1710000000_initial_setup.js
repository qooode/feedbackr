/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Feedbackr — Initial Migration
// =============================================================================
// This migration runs automatically on first startup and creates all necessary
// collections with their API rules. No manual setup required.
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

    // Users can view/list each other but can't modify other users
    users.listRule = ""
    users.viewRule = ""
    users.updateRule = "@request.auth.id = id"
    users.deleteRule = "@request.auth.id = id"

    app.save(users)

    // =========================================================================
    // 2. Create "posts" collection
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
            new TextField({
                name: "title",
                required: true,
                max: 300,
            }),
            new TextField({
                name: "body",
                required: true,
            }),
            new SelectField({
                name: "category",
                required: true,
                values: ["bug", "feature", "improvement"],
                maxSelect: 1,
            }),
            new SelectField({
                name: "status",
                required: true,
                values: ["new", "in_review", "processing", "done", "dropped", "later"],
                maxSelect: 1,
            }),
            new SelectField({
                name: "priority",
                required: true,
                values: ["low", "medium", "high", "critical"],
                maxSelect: 1,
            }),
            new RelationField({
                name: "author",
                required: true,
                maxSelect: 1,
                collectionId: users.id,
            }),
            new NumberField({
                name: "votes_count",
                required: false,
                min: 0,
            }),
            new JSONField({
                name: "ai_transcript",
                required: false,
            }),
        ],
    })

    app.save(posts)

    // =========================================================================
    // 3. Create "comments" collection
    // =========================================================================
    const comments = new Collection({
        type: "base",
        name: "comments",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id = author.id",
        deleteRule: "@request.auth.id = author.id || @request.auth.is_admin = true",
        fields: [
            new RelationField({
                name: "post",
                required: true,
                maxSelect: 1,
                collectionId: posts.id,
                cascadeDelete: true,
            }),
            new RelationField({
                name: "author",
                required: true,
                maxSelect: 1,
                collectionId: users.id,
            }),
            new TextField({
                name: "body",
                required: true,
            }),
            new BoolField({
                name: "is_ai_merged",
                required: false,
            }),
        ],
    })

    app.save(comments)

    // =========================================================================
    // 4. Create "votes" collection
    // =========================================================================
    const votes = new Collection({
        type: "base",
        name: "votes",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: null,  // votes can't be updated
        deleteRule: "@request.auth.id = user.id",
        fields: [
            new RelationField({
                name: "post",
                required: true,
                maxSelect: 1,
                collectionId: posts.id,
                cascadeDelete: true,
            }),
            new RelationField({
                name: "user",
                required: true,
                maxSelect: 1,
                collectionId: users.id,
            }),
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_votes_unique ON votes (post, user)",
        ],
    })

    app.save(votes)

    // =========================================================================
    // 5. Create initial superuser from env vars (if provided)
    // =========================================================================
    const superuserEmail = $os.getenv("PB_SUPERUSER_EMAIL")
    const superuserPassword = $os.getenv("PB_SUPERUSER_PASSWORD")

    if (superuserEmail && superuserPassword) {
        try {
            // Check if superuser already exists
            app.findAuthRecordByEmail("_superusers", superuserEmail)
        } catch {
            // Doesn't exist, create it
            const superusers = app.findCollectionByNameOrId("_superusers")
            const record = new Record(superusers)
            record.set("email", superuserEmail)
            record.set("password", superuserPassword)
            app.save(record)
            console.log("✅ Superuser created from env vars: " + superuserEmail)
        }
    }

    // =========================================================================
    // 6. Configure Discord OAuth from env vars (if provided)
    // =========================================================================
    const discordClientId = $os.getenv("DISCORD_CLIENT_ID")
    const discordClientSecret = $os.getenv("DISCORD_CLIENT_SECRET")

    if (discordClientId && discordClientSecret) {
        const settings = app.settings()
        // Enable Discord OAuth on the users collection
        const usersCollection = app.findCollectionByNameOrId("users")
        usersCollection.oauth2.enabled = true

        app.save(usersCollection)
        console.log("✅ Discord OAuth: set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in env — configure in PocketBase admin UI under Auth providers")
    }

    console.log("✅ Feedbackr migration complete — all collections created!")
    console.log("📋 Collections: users (extended), posts, comments, votes")

}, (app) => {
    // Revert: delete collections in reverse order
    try { app.delete(app.findCollectionByNameOrId("votes")) } catch {}
    try { app.delete(app.findCollectionByNameOrId("comments")) } catch {}
    try { app.delete(app.findCollectionByNameOrId("posts")) } catch {}

    // Revert users changes
    try {
        const users = app.findCollectionByNameOrId("users")
        const field = users.fields.getByName("is_admin")
        if (field) {
            users.fields.removeByName("is_admin")
            app.save(users)
        }
    } catch {}
})
