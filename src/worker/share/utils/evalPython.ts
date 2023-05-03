const { exec, spawn } = require('child_process');

export function runPyCode(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const py = spawn('python', ['-c', command]);

    let output = '';

    py.stdout.on('data', (data: string) => {
      output += data;
    });

    py.stderr.on('data', (data: any) => {
      console.warn(data);
      reject(data);
    });

    py.on('close', (code: number) => {
      if (code !== 0) {
        reject(`Python process exited with code ${code}`);
      } else {
        resolve(output.trim());
      }
    });
  });
}
export function runPyCode1(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `python -c "${command}"`,
      { stdout: process.stdout },
      (error: any, stdout: string, stderr: any) => {
        if (error) {
          console.warn(error);
          reject(error);
        } else if (stderr) {
          console.warn(stderr);
          reject(stderr);
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}
