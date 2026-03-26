/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("meta_diaria_horas");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("meta_diaria_horas"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "meta_diaria_horas",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("meta_diaria_horas");
  return app.save(collection);
})
