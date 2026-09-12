# The Loop fork of `@sebastianwessel/quickjs`

This repository is a fork of
[sebastianwessel/quickjs](https://github.com/sebastianwessel/quickjs). Loop
carries changes to the sandbox runtime that upstream does not have. The
backend runs customer-supplied TypeScript in this sandbox, so Loop must be
able to change the runtime without a wait for an upstream release.

The fork publishes as `@loop-payments/quickjs` to GitHub Packages. The backend
package `@loop-payments/ts-sandbox` is the consumer.

## The version numbers

The version number tracks the upstream release that the fork is based on. The
fork started at upstream 3.1.0, so the first Loop release is `3.1.0`. Loop
increments the patch number for each change that Loop makes. When the fork
takes a new upstream release, the version number moves to that upstream
version.

## How to release a version

1. Increment `version` in `package.json` and merge that change to `main`.
2. Create a GitHub Release with the tag `v<version>`.
3. The `publish.yml` workflow lints, tests, builds, and publishes the package.

The workflow authenticates with the built-in `GITHUB_TOKEN`. There is no
separate registry secret to rotate.

## How to consume the package

The backend `.npmrc` already sends the `@loop-payments` scope to
`https://npm.pkg.github.com`. Add the dependency and import it by name:

```json
"@loop-payments/quickjs": "^3.1.0"
```

## How to take upstream changes

```sh
git remote add upstream https://github.com/sebastianwessel/quickjs.git
git fetch upstream
git switch -c sync-upstream
git pull --no-rebase upstream main
```

The fork keeps the diff against upstream small, so most merges are clean. The
files that the fork changes are `package.json` (the package name, the
repository, and the publish configuration) and `.github/workflows`. Upstream
publishes to npm and to JSR; the fork removed `release.yml`, `jsr.json`, and
`.np-config.json`, so a modify/delete conflict on those files is expected.
Delete them again and continue.
