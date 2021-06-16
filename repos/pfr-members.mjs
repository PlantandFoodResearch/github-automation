/** Convert JSON file of Github gql repository details to excel
 *  To get an input file run

*/
import fsx from 'fs'
import fetch from 'node-fetch'
const fs = fsx.promises
const githubgql = 'https://api.github.com/graphql'
async function getQuery (after) {
  const aft = after ? `, after: "${after}"` : ''
  const query = `
  {
    enterprise(slug: \"pfrnz\") {
      organizations(query: \"Plant & Food Research\", first: 1) {
        nodes {
          name
          membersWithRole(first: 200) {
            edges {
              role
              hasTwoFactorEnabled
              node {
                organizationVerifiedDomainEmails(login: \"pfrnz\")
                login
                databaseId
                name
              }
            }
          }
        }
      }
    }
  }`
  const qjson = { query: query }
  return fetch(githubgql, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    },
    body: JSON.stringify(qjson)
  })
    .then(r => r.json())
}

const outfilename = './pfr-members.csv'

async function main () {
  let outfile = null
  try {
    outfile = await fs.open(outfilename, 'w+')
    const header = 'role, login, name, email, totalRepositoryContributions,totalIssueContributions,totalCommitContributions,totalPullRequestContributions,totalRepositoryContributions,totalRepositoriesWithContributedIssues,totalRepositoriesWithContributedCommits,totalRepositoriesWithContributedPullRequests,endedAt,repos\n'

    await outfile.appendFile(header)
    let hasNextPage = true
    let after = ''
    while (hasNextPage) {
      process.stdout.write('#')
      const json = await getQuery(after)
      console.log(json)
      // const edges = json.data.organization.membersWithRole.edges
      // edges.forEach(async m => {
      //   const n = m.node
      //   const user = `${m.role}, ${n.login}, ${n.name}, ${n.email}`
      //   const c = n.contributionsCollection
      //   const contribs = `${c.totalRepositoryContributions}, ${c.totalIssueContributions}, ${c.totalCommitContributions}, ${c.totalPullRequestContributions}, ${c.totalRepositoryContributions}, ${c.totalRepositoriesWithContributedIssues}, ${c.totalRepositoriesWithContributedCommits}, ${c.totalRepositoriesWithContributedPullRequests}, ${c.endedAt.slice(0, 10)}`
      //   const repos = c.commitContributionsByRepository.map(el => `"${el.repository.name} ${el.contributions.totalCount} ${el.contributions.nodes[0].occurredAt.slice(0, 10)}"`)
      //   const rep = `${user}, ${contribs}, ${repos}\n`
      //   console.log(rep)
      //   await outfile.appendFile(rep)
      // })
      hasNextPage = json.data.organization.membersWithRole.pageInfo.hasNextPage
      after = hasNextPage && json.data.organization.membersWithRole.pageInfo.endCursor
    }
  } finally {
    if (outfile) {
    // close the file if it is opened.
      await outfile.close()
    }
  }
}

main()
