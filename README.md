# GitHub Automation

We can do most necessary source code management using the git command line but git doesn't let us do much in the way of controlling a remote git repository. After all it is just a URL and we don't know much about how new people, memberships or repositories are managed in systems like BitBucket or GitHub. 

One of the most useful things we would like to be able to do is to create a new remote repository based on a local repository. 

GitHub has an API which if you have appropriate permissions you can use do this as well as a bunch of other admin functions. 

The API documentation is at: https://developer.github.com/v3/

The root endpoint is at: https://api.github.com/

This example uses the command line function Curl - but the requests are easily translated into python or javascript. 

# Basic Authentication 
Most useful requests require the user to be authenticated.  We should use OAuth2.0 for formal apps but can use basic HTTP auth for simple script requests. However, you should not use your normal github password, and if you have 2FA enabled you won't be able to. Instead you should generate a personal access token here: https://github.com/settings/tokens and set the permissions for that token to be as limited as necessary for the scripts.

Personal access tokens function like ordinary OAuth access tokens. They can be used instead of a password for Git over HTTPS, or can be used to authenticate to the API over Basic Authentication. 

We can then include -u username:personal_token in the curl command line or can use the ~/.netrc file to store the machine credentials for curl and use the -n parameter. 

    machine api.bitbucket.org
    login <your username>
    password <your personal access token>

## List user info
    curl -n https://api.github.com/users/avowkind

## List a user's organisations
    curl -n https://api.github.com/user/orgs

    [
      {
        "login": "PlantandFoodResearch",
        "id": 7144520,
        "node_id": "MDEyOk9yZ2FuaXphdGlvbjcxNDQ1MjA=",
        "url": "https://api.github.com/orgs/PlantandFoodResearch",
        "repos_url": "https://api.github.com/orgs/PlantandFoodResearch/repos",
        "events_url": "https://api.github.com/orgs/PlantandFoodResearch/events",
        "hooks_url": "https://api.github.com/orgs/PlantandFoodResearch/hooks",
        "issues_url": "https://api.github.com/orgs/PlantandFoodResearch/issues",
        "members_url": "https://api.github.com/orgs/PlantandFoodResearch/members{/member}",
        "public_members_url": "https://api.github.com/orgs/PlantandFoodResearch/public_members{/member}",
        "avatar_url": "https://avatars0.githubusercontent.com/u/7144520?v=4",
        "description": "The New Zealand Institute for Plant and Food Research. Crown Research Institute. Contact Matthew Laurenson or Zane Gilmore for access."
      }
    ]

Note that the response includes the URLS required to access the organisation repos.

### List Repos
Depending on the organisation type you may or may not be able to list the repos.

    curl -n https://api.github.com/orgs/PlantandFoodResearch/repos | jq ".[] | .name
    curl -n https://api.github.com/orgs/pfrnz/repos | jq ".[] | .name

pfrnz is the GitHub Enterprise organisation account and is linked to PFR Single Sign on. The request returns this response

    {
      "message": "Resource protected by organization SAML enforcement. You must grant your personal token access to this organization.",
      "documentation_url": "https://help.github.com/articles/authenticating-to-a-github-organization-with-saml-single-sign-on/"
    }

After using the SSO button on the personal access token and authenticating with PFR. the response is 
    "bitbucket-integration"
    "example-public"
    "example-internal"
    "example-private"


## Creating a Repository
https://developer.github.com/v3/repos/#create-an-organization-repository

To create a new repository we make a POST request to the repositories endpoint with the name of the new repo and the initial configuration. The authenticated user must be a member of the organization.

    POST /orgs/:org/repos

    curl -n --location --request POST "https://api.github.com/orgs/pfrnz/repos" \
    --header 'Content-Type: application/json' \
    --data-raw '{
      "name": "github-automation",
      "description": "Scripts and tools to automate github",
      "homepage": "https://github.com/pfrnz/github-automation",
      "visibility": "internal",
      "private": false,
      "has_issues": false,
      "has_projects": false,
      "has_wiki": false
    }
    '

You can push a new codebase to the repository by making it the remote origin

using https:
    git remote add origin https://github.com/pfrnz/github-automation.git
    git push origin master

or using ssh:
    git remote add origin git@github.com:pfrnz/github-automation.git
    git push -u origin master

### Note using SSH
The `pfrnz' organization has enabled or enforced SAML SSO. To access
this repository, you must use the HTTPS remote with a personal access token
or SSH with an SSH key and passphrase that has been whitelisted for this organization. Visit https://help.github.com/articles/authenticating-to-a-github-organization-with-saml-single-sign-on/ for more information.


# Member Management
## get members list
GET /orgs/:org/members
https://api.github.com/orgs/PlantandFoodResearch/members