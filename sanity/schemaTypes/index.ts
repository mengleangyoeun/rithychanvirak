import { type SchemaTypeDefinition } from 'sanity'
import { photo } from './photo'
import { collection } from './collection'
import { about } from './about'
import { contact } from './contact'
import { hero } from './hero'
import { service } from './service'
import { video } from './video'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [photo, collection, about, contact, hero, service, video],
}
