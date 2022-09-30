const https = require('https');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const arguments = process.argv.slice(2);
const [username, dir = ''] = arguments;

const targetDir = path.resolve(process.cwd(), dir)

if (!username) {
  console.error('No username provided');
  process.exit()
}

const options = {
  hostname: 'api.github.com',
  port: 443,
  path: `/users/${username}/repos`,
  method: 'GET',
  headers: {'user-agent': 'node.js'}
};

const request = https.request(options, response => {

  let data = [];

  switch(response.statusCode) {

    case 200: {
      response.on('data', buffer => {
        data.push(buffer);
      });
  
      response.on('end', () => {
        const repos = JSON.parse(Buffer.concat(data).toString())

        repos.forEach(repo => {

          if (fs.existsSync(path.resolve(targetDir, repo.name))) {
            console.log(`SKIP: Repository "${repo.name}" already exists in "${targetDir}"`)
          } else {

            try {
              child_process.execSync(`git clone ${repo.clone_url}`, {
                cwd: targetDir,
                stdio: []
              })
              console.log(`SUCCESS: Repository "${repo.name}" was successfully cloned into "${targetDir}"`);
            } catch {
              console.log(`ERROR: Cannot clone repository "${repo.name}"`);
            }
          }          
        });
      });

      break;
    }

    case 404: {
      console.error(`No account found with username ${username}`);
      process.exit()
    }
  }
});

request.on('error', () => {
  console.error('Something went wrong');
});

request.end();