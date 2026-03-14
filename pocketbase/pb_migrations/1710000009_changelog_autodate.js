/// <reference path="../pb_data/types.d.ts" />

// Add missing created/updated autodate fields to changelogs collection

migrate((app) => {
    const changelogs = app.findCollectionByNameOrId("changelogs")

    changelogs.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }))
    changelogs.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }))

    app.save(changelogs)
    console.log("Added created/updated autodate fields to changelogs")
}, (app) => {
    const changelogs = app.findCollectionByNameOrId("changelogs")
    changelogs.fields.removeByName("created")
    changelogs.fields.removeByName("updated")
    app.save(changelogs)
})
