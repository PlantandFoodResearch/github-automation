/** Convert JSON file of Github issues to JIRA import format */
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
  open: 'To Do',
  closed: 'Done'
}

const peopleMap = {
  zanejg: 'Zane Gilmore',
  wilbuick: 'Will Buick',
  rodrim3n: 'rodrim3n'
}
function convertToJira (json, key) {
  return json.map((item, index) => {
    const jiraIssue = {
      summary: item.title,
      key: `${key}-${item.number}`,
      status: stateMap[item.state],
      reporter: peopleMap[item.user.login],
      description: item.body,
      externalId: item.url,
      labels: item.labels.map(label => label.name)
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
  const json = await readJson('./data/kea-issues.json')
  project.issues = convertToJira(json, project.key)
  console.log(project)
  projects.projects[0] = project
  // write result
  const output = JSON.stringify(projects, null, 2)
  await fs.writeFile('./data/kea-issues-jira.json', output)
}

main()
