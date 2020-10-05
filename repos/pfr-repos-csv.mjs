/** Convert JSON file of Github gql repository details to excel
 *  To get an input file run

*/
import fsx from 'fs'
import fetch from 'node-fetch'
const fs = fsx.promises
const githubgql = 'https://api.github.com/graphql'
async function getQuery (after) {
  const aft = after ? `, after: "${after}"` : ''
  const query = `{ 
    organization(login: "PlantandFoodResearch") {
      repositories(first: 5 ${aft} ) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          id
          name
          url
          shortDescriptionHTML
          isPrivate
          description
          primaryLanguage { name }
          diskUsage
          hasIssuesEnabled
          hasWikiEnabled      
          collaborators(affiliation: ALL, first: 100) {
            totalCount
            edges {            
              permission
              node {
                name
                login
                email
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

const outfilename = './pfr-repos.csv'

async function main () {
  let outfile = null
  try {
    outfile = await fs.open(outfilename, 'w+')
    const header = 'name, private, url, diskUsage, hasIssuesEnabled, hasWikiEnabled, Admins\n'
    await outfile.appendFile(header)
    let hasNextPage = true
    let after = ''
    while (hasNextPage) {
      process.stdout.write('#')
      const json = await getQuery(after)
      const nodes = json.data.organization.repositories.nodes
      nodes.forEach(async repo => {
        let rep = `${repo.name}, ${repo.isPrivate}, ${repo.url}, ${repo.diskUsage}, ${repo.hasIssuesEnabled}, ${repo.hasWikiEnabled}`
        if (repo.collaborators) {
          repo.collaborators.edges.forEach(colab => {
            if (colab.permission === 'ADMIN') {
              const name = `${colab.node.login}`
              rep = rep.concat(', ', name)
            }
          })
        }
        rep = rep.concat('\n')
        // console.log(rep)
        await outfile.appendFile(rep)
      })
      hasNextPage = json.data.organization.repositories.pageInfo.hasNextPage
      after = hasNextPage && json.data.organization.repositories.pageInfo.endCursor
    }
  } finally {
    if (outfile) {
    // close the file if it is opened.
      await outfile.close()
    }
  }
  // project.issues = convert(json, project.key)
  // console.log(project)
  // projects.projects[0] = project
  // write result
  // const output = JSON.stringify(projects, null, 2)
  // await fs.append('./data/kea-issues-gql-jira.json', output)
}

main()
