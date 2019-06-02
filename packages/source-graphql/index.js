const { setContext } = require("apollo-link-context");
const { HttpLink } = require("apollo-link-http");
const {
  introspectSchema,
  makeRemoteExecutableSchema
} = require("graphql-tools");
const fetch = require("node-fetch");
const { existsSync } = require("fs");

class GraphQLSource {
  static defaultOptions() {
    return {
      uri: "http://example.com/api",
      token: ""
    };
  }

  constructor(api, options) {
    this.api = api;
    this.options = options;

    /****************************************************
      STEP ONE: Stich your remote CraftQL schema into
      the local GraphQL schema.
    ****************************************************/
    api.createSchema(async function (graphql) {
      const http = new HttpLink({
        uri: options.uri,
        fetch
      });

      const link = setContext((request, previousContext) => ({
        headers: {
          Authorization: `Bearer ${options.token}`
        }
      })).concat(http);

      const schema = await introspectSchema(link);
      const executableSchema = await makeRemoteExecutableSchema({
        schema: schema,
        link
      });

      return executableSchema;
    });

    /****************************************************
      STEP TWO: Find your entry sections, and create
      routes for any of them that have a template.
    ****************************************************/

    api.createManagedPages(async ({ graphql, createPage }) => {
      // Query our local GraphQL schema to get all sections
      const { data: sectionsQuery } = await graphql(`
        query {
          sections {
            handle
          }
        }
      `);

      // Loop over each section
      await Promise.all(
        sectionsQuery.sections.map(async section => {
          const templatePath = `./src/templates/${section.handle}.vue`;
          const templateExists = existsSync(templatePath);

          // If there's not a template for this section in the "templates" directory, don't register it as a route.
          if (!templateExists) return false;

          // Query our local GraphQL schema for this section's entries
          const { data: entriesQuery } = await graphql(`
          query {
            entries(section: ${section.handle}) {
              slug,
              id
            }
          }
        `);

          // If this section doesn't have entries, we don't care about it
          if (!entriesQuery) return false;

          // Loop through each entry in this section, and register it as a page (route)
          entriesQuery.entries.forEach(entry => {
            createPage({
              path: `/${section.handle}/${entry.slug}`,
              component: `./src/templates/${section.handle}.vue`,

              // Provide variables about this entry which can be used in the entry's tempate, and <page-query>
              context: {
                id: entry.id,
                section: {
                  id: section.id,
                  handle: section.handle
                }
              }
            });
          });
        })
      );
    });
  }
}

module.exports = GraphQLSource;
