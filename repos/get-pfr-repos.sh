# uses -n for authentication so place bearer token in .netrc
# or use https://username:token@api.github.com/graphql.
curl -n \
 -H "Content-Type: application/json" \
 -X POST -d @get-pfr-repos.gql \
 https://api.github.com/graphql