# changed

## Features
- Get changelog of NPM packages easily
- Blazing fast due to use of bun, changelog caching and jsDelivr CDN
- Changelog texts are cached in local database (default path is `~/.config/changed-bun/cache.db`)

## Usage
```
$ chgd rimraf

5.0

 • No default export, only named exports

4.4

 • Provide Dirent or Stats object as second argument to filter

4.3

 • Return boolean indicating whether the path was fully removed
 • Add filter option
...
```
