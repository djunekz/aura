import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_SIGNATURES = [
  { file: 'package.json',     type: 'Node.js / JavaScript' },
  { file: 'deno.json',        type: 'Deno (TypeScript)' },
  { file: 'bun.lockb',        type: 'Bun (JavaScript)' },
  { file: 'requirements.txt', type: 'Python' },
  { file: 'pyproject.toml',   type: 'Python (pyproject)' },
  { file: 'Pipfile',          type: 'Python (Pipenv)' },
  { file: 'go.mod',           type: 'Go' },
  { file: 'Cargo.toml',       type: 'Rust' },
  { file: 'composer.json',    type: 'PHP (Composer)' },
  { file: 'Gemfile',          type: 'Ruby' },
  { file: 'pom.xml',          type: 'Java (Maven)' },
  { file: 'build.gradle',     type: 'Java/Kotlin (Gradle)' },
  { file: 'pubspec.yaml',     type: 'Flutter/Dart' },
  { file: '*.csproj',         type: '.NET / C#', glob: true },
  { file: 'CMakeLists.txt',   type: 'C/C++ (CMake)' },
];

class Context {
  constructor() {
    this.projectType = null;
    this.projectFiles = [];
    this.detectProject();
  }

  detectProject() {
    const cwd = process.cwd();
    const entries = fs.readdirSync(cwd).map(f => f.toLowerCase());
    this.projectFiles = entries;

    for (const sig of PROJECT_SIGNATURES) {
      if (sig.glob) {
        const ext = sig.file.replace('*.', '.');
        if (entries.some(f => f.endsWith(ext))) {
          this.projectType = sig.type;
          return;
        }
      } else {
        if (fs.existsSync(path.join(cwd, sig.file))) {
          this.projectType = sig.type;
          return;
        }
      }
    }

    this.projectType = 'Unknown / Generic';
  }

  showContext() {
    this.detectProject();
    console.log(chalk.blue.bold('\n── Project Context ─────────────────────'));
    console.log(chalk.white('  Type  : ') + chalk.cyan(this.projectType));
    console.log(chalk.white('  Folder: ') + chalk.cyan(process.cwd()));
    console.log(chalk.blue('────────────────────────────────────────\n'));
  }
}

export default Context;
