/** Convert JSON file of Github gql output issues to JIRA import format 
 *  To get an input file run
 * issues/postgql.sh | jq . > issues/data/kea-issues-gql-5.json
 * the jq . is optional and just formats the json file for readability.
 * 
*/
import fsx from 'fs'
const fs = fsx.promises

const readJson = async path => {
  try {
    const rawdata = await fs.readFile(path)
    return JSON.parse(rawdata)
  } catch (e) {
    console.log('read json failed', e)
  }
}

const stateMap = {
  OPEN: 'To Do',
  CLOSED: 'Done'
}

const peopleMap = {
  zanejg: 'Zane Gilmore',
  wilbuick: 'Will Buick',
  rodrim3n: 'rodrim3n'
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
          author: edge.node.author.login,
          created: edge.node.createdAt
        })
      })
    }
    return jiraIssue
  })
}

const project = {
  name: 'JSON Import test',
  key: 'JIT'
}

const projects = {
  projects: []
}

async function main () {
  const json = await readJson('./data/kea-issues-gql.json')
  project.issues = convertToJira(json, project.key)
  console.log(project)
  projects.projects[0] = project
  // write result
  const output = JSON.stringify(projects, null, 2)
  await fs.writeFile('./data/kea-issues-gql-jira.json', output)
}

main()
