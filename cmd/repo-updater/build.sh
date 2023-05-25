#!/usr/bin/env bash

# We want to build multiple go binaries, so we use a custom build step on CI.
cd "$(dirname "${BASH_SOURCE[0]}")"/../..
set -ex

OUTPUT=$(mktemp -d -t sgdockerbuild_XXXXXXX)
cleanup() {
  rm -rf "$OUTPUT"
}

trap cleanup EXIT
if [[ "${DOCKER_BAZEL:-false}" == "true" ]]; then
  package=${1:-//cmd/repo-updater}
  ./dev/ci/bazel.sh build "$package"
  out=$(./dev/ci/bazel.sh cquery "$package" --output=files)
  cp "$out" "$OUTPUT"

  docker build -f cmd/repo-updater/Dockerfile -t "$IMAGE" "$OUTPUT" \
    --progress=plain \
    --build-arg COMMIT_SHA \
    --build-arg DATE \
    --build-arg VERSION
  exit $?
fi

# Environment for building linux binaries
export GO111MODULE=on
export GOARCH=amd64
export GOOS=linux
export CGO_ENABLED=0

path_to_package=${1:-github.com/sourcegraph/sourcegraph/cmd/repo-updater}
for pkg in $path_to_package; do
  go build -trimpath -ldflags "-X github.com/sourcegraph/sourcegraph/internal/version.version=$VERSION  -X github.com/sourcegraph/sourcegraph/internal/version.timestamp=$(date +%s)" -buildmode exe -tags dist -o "$OUTPUT/$(basename "$pkg")" "$pkg"
done

docker build -f cmd/repo-updater/Dockerfile -t "$IMAGE" "$OUTPUT" \
  --progress=plain \
  --build-arg COMMIT_SHA \
  --build-arg DATE \
  --build-arg VERSION
