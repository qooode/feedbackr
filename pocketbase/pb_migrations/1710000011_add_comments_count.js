/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const posts = app.findCollectionByNameOrId("posts")
    posts.fields.add(new NumberField({ name: "comments_count", required: false, min: 0 }))
    app.save(posts)

    // Backfill existing posts with their actual comment counts
    const allPosts = app.findRecordsByFilter("posts", "1=1", "", 0, 0)
    for (let i = 0; i < allPosts.length; i++) {
        try {
            const comments = app.findRecordsByFilter("comments", "post = '" + allPosts[i].id + "'", "", 0, 0)
            allPosts[i].set("comments_count", comments ? comments.length : 0)
            app.save(allPosts[i])
        } catch(e) {
            // No comments for this post
            allPosts[i].set("comments_count", 0)
            app.save(allPosts[i])
        }
    }

    console.log("Feedbackr: added comments_count to posts")
}, (app) => {
    const posts = app.findCollectionByNameOrId("posts")
    posts.fields.removeByName("comments_count")
    app.save(posts)
})
