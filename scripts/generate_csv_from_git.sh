#! /usr/bin/env bash

[ "$1" = "" ] && echo "usage: $0 <gitrepo-url>" && exit 1
[ "$2" = "" ] && echo "usage: $1 <path>" && exit 1
set -euo pipefail

tmpdir=$(mktemp -d /tmp/git-tmp.XXXXXX) || exit 1
echo "temp dir: $tmpdir"

pushd "$tmpdir" || exit 1
git clone --single-branch -n "$1" .

csv=$(git log --no-merges --pretty=format:'"%h","%an","%ae","%ad","%cn","%ce","%cd","%s"' --date=format:%Y-%m-%d\ %H:%M:%S --numstat | awk '
BEGIN {
    OFS = ",";
    print "Commit Hash", "File", "Author name", "Authored at", "Insertions", "Deletions", "Message", "Author email", "Committer name", "Committer email", "Committed at";
}
function escape_csv(field) {
    gsub(/"/, "\"\"", field); # Escape double quotes
    return "\"" field "\"";   # Enclose in double quotes
}
{
    if ($1 ~ /^"/) {
        commit = $0;
        split(commit, arr, /","/); # Split fields by comma surrounded by double quotes
        commit_hash = substr(arr[1], 2); # Remove starting double quote
        author = arr[2];
        email = arr[3];
        date = arr[4];
        committer = arr[5];
        committer_email = arr[6];
        committer_date = arr[7];
        message = arr[8];
        sub(/"$/, "", message); # Remove the trailing double quote
    } else if ($1 ~ /^[0-9-]+$/ && NF == 3) {
        insertions = $1 == "-" ? 0 : $1;
        deletions = $2 == "-" ? 0 : $2;
        file = $3;
        print escape_csv(commit_hash), escape_csv(file), escape_csv(author), escape_csv(date), insertions, deletions, escape_csv(message),  escape_csv(email), escape_csv(committer), escape_csv(committer_email), escape_csv(committer_date);
    }
}')

popd || exit

echo "$csv" > "$2"

rm -rf "$tmpdir"