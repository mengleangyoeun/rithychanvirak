import type {StructureBuilder} from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content Management')
    .items([
      // Collections - Hierarchical Navigation
      S.listItem()
        .title('📁 Collections')
        .icon(() => '📁')
        .child(
          S.list()
            .title('Collections')
            .items([
              // IMPROVED: Browse by Main Collection → See Sub-Albums inside
              S.listItem()
                .title('🗂️ Browse by Main Collection')
                .icon(() => '🗂️')
                .child(
                  S.documentTypeList('collection')
                    .title('Main Collections')
                    .filter('_type == "collection" && collectionType == "main"')
                    .defaultOrdering([{field: 'order', direction: 'asc'}])
                    .child((collectionId) =>
                      S.list()
                        .title('Manage Collection')
                        .items([
                          // Edit the main collection
                          S.listItem()
                            .title('✏️ Edit Main Collection')
                            .icon(() => '✏️')
                            .child(
                              S.document()
                                .schemaType('collection')
                                .documentId(collectionId)
                            ),

                          S.divider(),

                          // Sub-albums in this collection
                          S.listItem()
                            .title('📂 Sub-Albums in This Collection')
                            .icon(() => '📂')
                            .child(
                              S.documentTypeList('collection')
                                .title('Sub-Albums')
                                .filter(`_type == "collection" && parentCollection._ref == "${collectionId}"`)
                                .defaultOrdering([{field: 'order', direction: 'asc'}])
                                .canHandleIntent((intentName, params) => {
                                  return intentName === 'create' && params.type === 'collection'
                                })
                            ),

                          // Photos directly in this main collection
                          S.listItem()
                            .title('📸 Photos in This Collection')
                            .icon(() => '📸')
                            .child(
                              S.documentTypeList('photo')
                                .title('Photos')
                                .filter(`_type == "photo" && collection._ref == "${collectionId}"`)
                                .defaultOrdering([{field: 'order', direction: 'asc'}])
                            ),

                          S.divider(),

                          // Quick actions
                          S.listItem()
                            .title('➕ Create New Sub-Album Here')
                            .icon(() => '➕')
                            .child(
                              S.documentTypeList('collection')
                                .title('Sub-Albums')
                                .filter(`_type == "collection" && parentCollection._ref == "${collectionId}"`)
                                .defaultOrdering([{field: 'order', direction: 'asc'}])
                            )
                        ])
                    )
                ),

              S.divider(),

              // Quick access to all main collections (flat list)
              S.listItem()
                .title('🗂️ All Main Collections')
                .icon(() => '🗂️')
                .child(
                  S.documentTypeList('collection')
                    .title('Main Collections')
                    .filter('_type == "collection" && collectionType == "main"')
                    .defaultOrdering([{field: 'order', direction: 'asc'}])
                ),

              // All Sub Albums (flat list)
              S.listItem()
                .title('📂 All Sub-Albums')
                .icon(() => '📂')
                .child(
                  S.documentTypeList('collection')
                    .title('Sub Albums')
                    .filter('_type == "collection" && collectionType == "sub"')
                    .defaultOrdering([
                      {field: 'parentCollection', direction: 'asc'},
                      {field: 'order', direction: 'asc'}
                    ])
                ),

              S.divider(),

              // Status-based views
              S.listItem()
                .title('✅ Published Collections')
                .icon(() => '✅')
                .child(
                  S.documentTypeList('collection')
                    .title('Published Collections')
                    .filter('_type == "collection" && status == "published"')
                    .defaultOrdering([{field: 'order', direction: 'asc'}])
                ),

              S.listItem()
                .title('📝 Draft Collections')
                .icon(() => '📝')
                .child(
                  S.documentTypeList('collection')
                    .title('Draft Collections')
                    .filter('_type == "collection" && status == "draft"')
                    .defaultOrdering([{field: 'order', direction: 'asc'}])
                ),

              // Featured Collections
              S.listItem()
                .title('⭐ Featured Collections')
                .icon(() => '⭐')
                .child(
                  S.documentTypeList('collection')
                    .title('Featured Collections')
                    .filter('_type == "collection" && featured == true')
                    .defaultOrdering([{field: 'order', direction: 'asc'}])
                ),

              S.divider(),

              // All Collections (flat list)
              S.listItem()
                .title('📋 All Collections')
                .icon(() => '📋')
                .child(
                  S.documentTypeList('collection')
                    .title('All Collections')
                    .defaultOrdering([
                      {field: 'collectionType', direction: 'asc'},
                      {field: 'order', direction: 'asc'}
                    ])
                )
            ])
        ),

      // Photos - Organized by Collection
      S.listItem()
        .title('📸 Photos')
        .icon(() => '📸')
        .child(
          S.list()
            .title('Photos')
            .items([
              // Browse photos by collection (hierarchical)
              S.listItem()
                .title('📁 Browse by Collection')
                .icon(() => '📁')
                .child(
                  S.documentTypeList('collection')
                    .title('Select Collection')
                    .defaultOrdering([
                      {field: 'collectionType', direction: 'asc'},
                      {field: 'order', direction: 'asc'}
                    ])
                    .child((collectionId) =>
                      S.documentTypeList('photo')
                        .title('Photos in Collection')
                        .filter(`_type == "photo" && collection._ref == "${collectionId}"`)
                        .defaultOrdering([{field: 'order', direction: 'asc'}])
                    )
                ),

              S.divider(),

              S.listItem()
                .title('⭐ Featured Photos')
                .icon(() => '⭐')
                .child(
                  S.documentTypeList('photo')
                    .title('Featured Photos')
                    .filter('_type == "photo" && featured == true')
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                ),

              S.listItem()
                .title('📅 Recent Photos')
                .icon(() => '📅')
                .child(
                  S.documentTypeList('photo')
                    .title('Recent Photos')
                    .filter('_type == "photo"')
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                ),

              S.listItem()
                .title('⚠️ Unassigned Photos')
                .icon(() => '⚠️')
                .child(
                  S.documentTypeList('photo')
                    .title('Unassigned Photos')
                    .filter('_type == "photo" && !defined(collection)')
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                ),

              S.divider(),

              S.listItem()
                .title('📷 All Photos')
                .icon(() => '📷')
                .child(
                  S.documentTypeList('photo')
                    .title('All Photos')
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                )
            ])
        ),

      // Other content types
      ...S.documentTypeListItems().filter(listItem =>
        !['collection', 'photo'].includes(listItem.getId() || '')
      )
    ])
