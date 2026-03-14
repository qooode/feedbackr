/// <reference path="../pb_data/types.d.ts" />

// =============================================================================
// Add image_url field to changelogs
// =============================================================================

migrate((app) => {
    const changelogs = app.findCollectionByNameOrId("changelogs")
    changelogs.fields.add(new TextField({ name: "image_url", required: false, max: 2000 }))
    app.save(changelogs)
    console.log("Added image_url to changelogs")
}, (app) => {
    const changelogs = app.findCollectionByNameOrId("changelogs")
    changelogs.fields.removeByName("image_url")
    app.save(changelogs)
})
