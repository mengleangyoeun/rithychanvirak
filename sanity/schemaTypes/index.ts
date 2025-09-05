import { type SchemaTypeDefinition } from 'sanity'
import { photo } from './photo'
import { collection } from './collection'
import { about } from './about'
import { contact } from './contact'
import { hero } from './hero'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [photo, collection, about, contact, hero],
}
