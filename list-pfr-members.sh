curl -H "Accept: application/vnd.github.v3+json" \
  -n \
  https://api.github.com/orgs/PlantandFoodResearch/members?per_page=200 \
 | jq '.[] | .login'
