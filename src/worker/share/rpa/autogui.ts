// app.js
const { exec } = require('child_process');

export function runPyCode(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`python -c "${command}"`, (error: any, stdout: string, stderr: any) => {
      if (error) {
        console.warn(error);
        reject(error);
      } else if (stderr) {
        console.warn(stderr);
        reject(stderr);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}
