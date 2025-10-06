'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'
import {bulkUploadPlugin} from './sanity/plugins/bulk-upload-plugin'
import {videoUploadPlugin} from './sanity/plugins/video-upload-plugin'
import {AutoCreateSubalbumsAction} from './sanity/actions/auto-create-subalbums-action'
import {SafeDeleteAction} from './sanity/actions/safe-delete-action'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
    // Bulk upload plugin for photos
    bulkUploadPlugin(),
    // Video storyboard upload plugin
    videoUploadPlugin(),
  ],
  document: {
    actions: (prev, context) => {
      // Replace default delete with safe delete
      const filteredActions = prev.filter(action => action.action !== 'delete')

      if (context.schemaType === 'collection') {
        return [...filteredActions, AutoCreateSubalbumsAction, SafeDeleteAction]
      }
      if (context.schemaType === 'photo') {
        return [...filteredActions, SafeDeleteAction]
      }
      return [...filteredActions, SafeDeleteAction]
    }
  }
})
