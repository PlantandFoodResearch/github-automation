/** Convert JSON file of Github gql repository details to excel
 *  To get an input file run

*/
import fsx from 'fs'
import fetch from 'node-fetch'
const fs = fsx.promises
const githubgql = 'https://api.github.com/graphql'
const repo = 'kea'

async function getQuery (after) {
  const aft = after ? `, after: "${after}"` : ''
  const query = `
  { 
    repository(owner:"PlantandFoodResearch", name:"${repo}") {
      name,
      issues(first:50 ${aft}) {
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node {
            id
            number
            title
            url
            body
            state
            author {
              login
            }
            labels(first:5) {
              edges {
                node {
                  name
                }
              }
            }
            comments(last:100) {
              edges {
                node {
                  author {
                    login
                  }
                  authorAssociation
                  body
                  createdAt
                }
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

const stateMap = {
  OPEN: 'To Do',
  CLOSED: 'Done'
}

const peopleMap = {
  zanejg: 'zane.gilmore',
  wilbuick: 'will.buick',
  // stj: 'Stefan T', // unmatched
  // darrylcousins: 'darrylcousins', // unmatched
  // encodeltd: 'encodeltd', // unmatched
  // mcvmcv: 'mcvmcv',
  vnniyB: 'vincent.borgers',
  kiwiroy: 'roy.storey',
  timothymillar: 'tim.millar',
  hymmikong: 'hymmi.kong',
  guypfr: 'guy.davenport',
  eburgueno: 'eric.burgueño',
  rodrim3n: 'rodrigo.otero',
  // moopsiegoo: 'moopsiegoo'
}
function convertToJira (json, key) {
  return json.data.repository.issues.edges.map((edge, index) => {
    const node = edge.node
    const jiraIssue = {
      summary: node.title,
      key: `${key}-${node.number}`,
      status: stateMap[node.state],
      reporter: peopleMap[node.author.login],
      description: node.body,
      externalId: node.url,
      labels: node.labels.edges.map(edge => edge.node.name),
      comments: node.comments.edges.map(edge => {
        return ({
          body: edge.node.body,
          author: peopleMap[edge.node.author.login],
          created: edge.node.createdAt
        })
      })
    }
    return jiraIssue
  })
}

const outfilename = './pfr-kea-issues.json'

const project = {
  name: 'Kea Samples Database',
  key: 'KEA',
  issues: []
}

const projects = {
  projects: []
}
async function main () {
  let hasNextPage = true
  let after = ''
  while (hasNextPage) {
    process.stdout.write('#')
    const json = await getQuery(after)
    project.issues = project.issues.concat(convertToJira(json, project.key))
    hasNextPage = json.data.repository.issues.pageInfo.hasNextPage
    after = hasNextPage && json.data.repository.issues.pageInfo.endCursor
  }
  projects.projects[0] = project
  // write result
  const output = JSON.stringify(projects, null, 2)
  await fs.writeFile(outfilename, output)
}

main()
