/// <reference path="../pb_data/types.d.ts" />

// Allow post authors to update/delete their own posts (not just admins)
migrate((app) => {
    const posts = app.findCollectionByNameOrId("posts")
    posts.updateRule = "@request.auth.id = author || @request.auth.is_admin = true"
    posts.deleteRule = "@request.auth.id = author || @request.auth.is_admin = true"
    app.save(posts)
    console.log("Feedbackr: posts now editable/deletable by authors")
}, (app) => {
    const posts = app.findCollectionByNameOrId("posts")
    posts.updateRule = "@request.auth.is_admin = true"
    posts.deleteRule = "@request.auth.is_admin = true"
    app.save(posts)
})
