# sync-local-avro

This will grab all of the subjects from a given avro registry and sync them in to lenses

To use type
`npm install -g dev-sync-avro`

Then to run sync just types

`dev-sync-avro -s <source registry full http url to base path> -d <destination registry full http url to base path>`

This is intended ONLY for syncing repos to an empty non-prod avro registry. This product is not tested enough to trust in prod!
