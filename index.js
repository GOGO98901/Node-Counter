#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var pkg = require(path.join(__dirname, 'package.json'));
var chalk = require('chalk');
var parser = require('gitignore-parser');
var endOfLine = require('os').EOL;

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
    process.exit(1);
}

var gitignore = undefined;
if (fs.existsSync('.gitignore')) {
    gitignore = parser.compile(fs.readFileSync('.gitignore', 'utf8'));
    console.log('Filtered using .gitignore');
}
var noFiles = 0, noFolders = 1, noLines = 0;

function scan(current, callback) {
    if (program.output) console.log(' dir > %s', chalk.gray(current));
    var files = fs.readdirSync(current);
    if (gitignore != undefined) files = files.filter(gitignore.accepts);
    files.forEach(next => {
        var next = path.join(current, next);
        if (fs.existsSync(next)) {
            var stat = fs.lstatSync(next);
            if (stat.isDirectory()) {
                noFolders++;
                scan(next, function() {});
            } else if (stat.isFile()) {
                noFiles++;
                read(next);
            }
        }
    });
    callback();
}

function read(file) {
    if (program.output) console.log('file > %s', chalk.gray(file));
    var contents = fs.readFileSync(file, 'utf8');

    noLines += contents.split(endOfLine).length;

    // for (String line: contents.split(endOfLine)) {
    //     noLines ++;
    // }
}

console.log('Scanning %s', start);
scan(start, function() {
    console.log("Files: %s", noFiles);
    console.log("Folders: %s", noFolders);
    console.log("Lines: %s", noLines);
});
