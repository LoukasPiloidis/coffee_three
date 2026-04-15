import { config, fields, collection, singleton } from "@keystatic/core";

// Cloud storage when NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT is set
// (format: "team-name/project-name" — create one at https://keystatic.cloud).
// Falls back to local storage for development.
const cloudProject = process.env.NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT;

// Helper: a bilingual short string field
const bilingualText = (labelEn: string) =>
  fields.object({
    en: fields.text({
      label: `${labelEn} (EN)`,
      validation: { length: { min: 1 } },
    }),
    el: fields.text({
      label: `${labelEn} (EL)`,
      validation: { length: { min: 1 } },
    }),
  });

const bilingualTextOptional = (labelEn: string) =>
  fields.object({
    en: fields.text({ label: `${labelEn} (EN)`, multiline: true }),
    el: fields.text({ label: `${labelEn} (EL)`, multiline: true }),
  });

export default config({
  storage: cloudProject ? { kind: "cloud" } : { kind: "local" },
  ...(cloudProject ? { cloud: { project: cloudProject } } : {}),
  ui: {
    brand: { name: "Café CMS" },
  },
  collections: {
    deliveryGuys: collection({
      label: "Delivery guys",
      slugField: "name",
      path: "content/delivery-guys/*",
      format: { data: "json" },
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
      },
    }),
    optionGroups: collection({
      label: "Option groups",
      slugField: "key",
      path: "content/option-groups/*",
      format: { data: "json" },
      columns: ["selectionType", "required"],
      schema: {
        key: fields.slug({ name: { label: "Key" } }),
        name: bilingualText("Group name"),
        selectionType: fields.select({
          label: "Selection type",
          options: [
            { label: "Single choice", value: "single" },
            { label: "Multiple choice", value: "multi" },
          ],
          defaultValue: "single",
        }),
        required: fields.checkbox({
          label: "Required",
          defaultValue: false,
        }),
        defaultOptionKey: fields.text({
          label: "Default option key",
          description:
            "Enter the key of the option that should be pre-selected (e.g. 'White Sugar'). Must match an option key exactly. Leave empty for no default.",
        }),
        options: fields.array(
          fields.object({
            key: fields.text({
              label: "Key",
              description:
                "Stable identifier (e.g. 'oat-milk'). Lowercase, no spaces. Never change after creation.",
              validation: { length: { min: 1 } },
            }),
            name: bilingualText("Option"),
            priceCents: fields.integer({
              label: "Extra price (cents)",
              description:
                "Surcharge in euro-cents (e.g. 50 = €0.50). Leave 0 for free options.",
              defaultValue: 0,
            }),
            available: fields.checkbox({
              label: "Available",
              defaultValue: true,
            }),
          }),
          {
            label: "Options",
            itemLabel: (props) =>
              props.fields.name.fields.en.value || "Option",
          }
        ),
      },
    }),
    categories: collection({
      label: "Categories",
      slugField: "slug",
      path: "content/categories/*",
      format: { data: "json" },
      schema: {
        slug: fields.slug({ name: { label: "Slug" } }),
        title: bilingualText("Title"),
        order: fields.integer({
          label: "Display order",
          defaultValue: 0,
        }),
      },
    }),
    items: collection({
      label: "Menu items",
      slugField: "slug",
      path: "content/items/*",
      format: { data: "json" },
      // Show availability + display order in the collection list view so the
      // user doesn't have to open each item to see them at a glance.
      columns: ["available", "displayOrder"],
      schema: {
        available: fields.checkbox({
          label: "Available",
          defaultValue: true,
        }),
        slug: fields.slug({ name: { label: "Slug" } }),
        title: bilingualText("Title"),
        description: bilingualTextOptional("Description"),
        category: fields.relationship({
          label: "Category",
          collection: "categories",
          validation: { isRequired: true },
        }),
        price: fields.number({
          label: "Price (€)",
          validation: { isRequired: true, min: 0 },
        }),
        image: fields.image({
          label: "Image",
          directory: "public/menu-images",
          publicPath: "/menu-images/",
        }),

        displayOrder: fields.integer({
          label: "Display order within category",
          defaultValue: 0,
        }),
        optionGroups: fields.array(
          fields.relationship({
            label: "Option group",
            collection: "optionGroups",
          }),
          {
            label: "Option groups",
            itemLabel: (props) => props.value ?? "Select a group",
          }
        ),
      },
    }),
  },
  singletons: {
    settings: singleton({
      label: "Shop settings",
      path: "content/settings",
      format: { data: "json" },
      schema: {
        minOrderCents: fields.integer({
          label: "Minimum order amount (cents)",
          defaultValue: 0,
        }),
        allowedPostcodes: fields.array(fields.text({ label: "Postcode" }), {
          label: "Allowed delivery postcodes",
          itemLabel: (props) => props.value,
        }),
        deliveryHours: fields.object({
          mon: fields.text({
            label: "Monday (e.g. 09:00-22:00, empty = closed)",
          }),
          tue: fields.text({ label: "Tuesday" }),
          wed: fields.text({ label: "Wednesday" }),
          thu: fields.text({ label: "Thursday" }),
          fri: fields.text({ label: "Friday" }),
          sat: fields.text({ label: "Saturday" }),
          sun: fields.text({ label: "Sunday" }),
        }),
      },
    }),
  },
});
