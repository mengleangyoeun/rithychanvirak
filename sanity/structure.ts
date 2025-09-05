import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content Management')
    .items([
      // Collections - Clean hierarchical structure
      S.listItem()
        .title('📁 Collections')
        .icon(() => '📁')
        .child(
          S.list()
            .title('Collections')
            .items([
              // Main Collections
              S.listItem()
                .title('🗂️ Main Collections')
                .icon(() => '🗂️')
                .child(
                  S.documentTypeList('collection')
                    .title('Main Collections')
                    .filter('_type == "collection" && collectionType == "main"')
                    .defaultOrdering([{field: 'order', direction: 'asc'}])
                ),
              
              // Sub Albums  
              S.listItem()
                .title('📂 Sub Albums')
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
              
              // All Collections
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
      
      // Photos
      S.listItem()
        .title('📸 Photos')
        .icon(() => '📸')
        .child(
          S.list()
            .title('Photos')
            .items([
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
                .title('📷 All Photos')
                .icon(() => '📷')
                .child(
                  S.documentTypeList('photo')
                    .title('All Photos')
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                ),
              
              S.listItem()
                .title('🏷️ Unassigned Photos')
                .icon(() => '🏷️')
                .child(
                  S.documentTypeList('photo')
                    .title('Unassigned Photos')
                    .filter('_type == "photo" && !defined(collection)')
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])
                ),
              
              S.listItem()
                .title('📁 Photos by Collection')
                .icon(() => '📁')
                .child(
                  S.documentTypeList('collection')
                    .title('Select Collection')
                    .child((collectionId) => 
                      S.documentTypeList('photo')
                        .title('Photos in Collection')
                        .filter(`_type == "photo" && collection._ref == "${collectionId}"`)
                        .defaultOrdering([{field: 'order', direction: 'asc'}])
                    )
                )
            ])
        ),
      
      // Other content types
      ...S.documentTypeListItems().filter(listItem => 
        !['collection', 'photo'].includes(listItem.getId() || '')
      )
    ])