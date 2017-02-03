#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var pkg = require(path.join(__dirname, 'package.json'));
var chalk = require('chalk');
var parser = require('gitignore-parser');

var program = require('commander');
program.version(pkg.version)
    .option('-d, --directory <path>', 'The directory to start the scan')
    .option('-o, --output', 'Displays the file currently beng read')
    .parse(process.argv);

var start = __dirname;
if (fs.existsSync(program.directory)) {
    start = program.directory;
} else if (program.directory != undefined) {
    console.error(chalk.red('The directory \'%s\' dose not exist'), program.directory);
    program.help();
    process.exit(0);
}
var gitignore = undefined;
if (fs.existsSync('.gitignore')) {
    gitignore = parser.compile(fs.readFileSync('.gitignore', 'utf8'));
    console.log('Filtered using .gitignore');
}

console.log('Scanning %s', start);
var files = 0, folders = 1, lines = 0;
function scan(current) {
    var files = fs.readdirSync(current);
    if (gitignore != undefined) files = files.filter(gitignore.accepts);
    files.forEach(file => {
        if (fs.existsSync(file)) {
            var stat = fs.lstatSync(file);
            if (stat.isDirectory()) {
                folders++;
                scan(file);
            } else if (stat.isFile()) {
                files++;
                read(file);
            }
            if (program.output) console.log(chalk.gray(file));
        }
    });
}

function read(file) {
    var contents = fs.readFileSync(file, 'utf8');
    //for ()
}

scan(start);
console.log("Files: %s", files);
console.log("Folders: %s", folders);
console.log("Lines: %s", lines);
